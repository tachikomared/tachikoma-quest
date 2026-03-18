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

    // Check if guest user exists (fc_fid = 0 for guests, identified by wallet)
    const existingWallet = await sql`
      SELECT u.id, u.fc_fid, u.fc_username, w.address
      FROM wallets w
      JOIN users u ON u.id = w.user_id
      WHERE LOWER(w.address) = ${normalizedAddress}
      LIMIT 1
    `;

    let userId: string;
    let fid = 0;

    if (existingWallet.length) {
      // Existing wallet found - use that user
      userId = existingWallet[0].id;
      fid = existingWallet[0].fc_fid || 0;
      
      // If it's a Farcaster user (fid > 0), we should have used Farcaster auth
      // But we'll allow it for now
    } else {
      // Validate ref code if provided
      let referredByCode: string | null = null;
      if (refCode) {
        const referrer = await sql`SELECT referral_code FROM users WHERE referral_code = ${refCode.toUpperCase()} LIMIT 1`;
        if (referrer.length) referredByCode = referrer[0].referral_code;
      }

      // Create new guest user
      const referralCode = 'GUEST-' + Math.random().toString(36).substring(2, 10).toUpperCase();
      
      const newUser = await sql`
        INSERT INTO users (fc_fid, fc_username, referral_code, referred_by_code, created_at)
        VALUES (0, ${'guest_' + normalizedAddress.slice(2, 8)}, ${referralCode}, ${referredByCode}, NOW())
        RETURNING id
      `;
      
      userId = newUser[0].id;
      
      // Link wallet
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
