import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { signSession } from '@/lib/auth';
import { createPublicClient, http, verifyMessage } from 'viem';
import { base } from 'viem/chains';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const publicClient = createPublicClient({
  chain: base,
  transport: http('https://mainnet.base.org'),
});

export async function POST(req: Request) {
  try {
    const { address, signature, message, refCode } = await req.json();

    if (!address || !signature || !message) {
      return NextResponse.json({ error: 'Missing params' }, { status: 400 });
    }

    // Verify signature
    const isValid = await verifyMessage({
      address: address as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    });

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Extract timestamp from message to prevent replay attacks
    const timestampMatch = message.match(/Timestamp:\s*(\d+)/);
    const timestamp = timestampMatch ? parseInt(timestampMatch[1]) : 0;
    const now = Date.now();
    
    // Signature must be within 5 minutes
    if (now - timestamp > 5 * 60 * 1000) {
      return NextResponse.json({ error: 'Signature expired' }, { status: 401 });
    }

    // Normalize address
    const normalizedAddress = address.toLowerCase();

    // Check if wallet already belongs to an existing guest account
    const existingWallet = await sql`
      SELECT u.id, u.fc_fid, u.fc_username, u.referral_code, w.address
      FROM wallets w
      JOIN users u ON u.id = w.user_id
      WHERE LOWER(w.address) = ${normalizedAddress}
      LIMIT 1
    `;

    let userId: string;
    let fid = 0;

    const canUseSavedGuest = refCode === '__SAVED_GUEST__';

    if (existingWallet.length) {
      userId = existingWallet[0].id;
      fid = existingWallet[0].fc_fid || 0;
    } else if (canUseSavedGuest) {
      return NextResponse.json({ error: 'No saved guest session found for this wallet' }, { status: 403 });
    } else {
      if (!refCode) {
        return NextResponse.json({ error: 'Referral code required for wallet guest access' }, { status: 403 });
      }

      const referrer = await sql`SELECT referral_code FROM users WHERE referral_code = ${refCode.toUpperCase()} LIMIT 1`;
      if (!referrer.length) {
        return NextResponse.json({ error: 'Invalid referral code' }, { status: 403 });
      }

      const referredByCode = referrer[0].referral_code;
      const referralCode = 'GUEST-' + Math.random().toString(36).substring(2, 10).toUpperCase();
      const newUser = await sql`
        INSERT INTO users (fc_fid, fc_username, referral_code, referred_by_code, created_at)
        VALUES (NULL, ${'guest_' + normalizedAddress.slice(2, 8)}, ${referralCode}, ${referredByCode}, NOW())
        RETURNING id
      `;

      fid = 0;
      userId = newUser[0].id;
      await sql`
        INSERT INTO wallets (user_id, address, verified, created_at)
        VALUES (${userId}, ${normalizedAddress}, true, NOW())
      `;
    }

    // Create session
    const sessionToken = await signSession({ 
      fid, 
      username: 'guest', 
      userId 
    });

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return NextResponse.json({ success: true, isGuest: fid === 0 });
  } catch (e: any) {
    console.error('[auth/guest] Error:', e);
    return NextResponse.json({ error: e.message || 'Guest auth failed' }, { status: 500 });
  }
}
