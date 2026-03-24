import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyMessage } from 'viem';
import crypto from 'crypto';
import { setSession } from '@/lib/auth';

export async function POST(req: Request) {
  const { walletAddress, signature, nonce } = await req.json();

  if (!walletAddress || !signature || !nonce) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  const hashedNonce = crypto.createHash('sha256').update(nonce).digest('hex');

  const rows = await sql`
    SELECT * FROM auth_nonces
    WHERE nonce_hash = ${hashedNonce}
    AND wallet_address = ${walletAddress.toLowerCase()}
    AND expires_at > NOW()
    AND used = FALSE
    LIMIT 1
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Invalid or expired nonce' }, { status: 401 });
  }

  const message = `Sign this to verify ownership: ${nonce}`;
  const isValid = await verifyMessage({
    address: walletAddress as `0x${string}`,
    message,
    signature: signature as `0x${string}`,
  });

  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  await sql`UPDATE auth_nonces SET used = TRUE WHERE nonce_hash = ${hashedNonce}`;

  // Issue session
  await setSession(0, null, walletAddress, 'base_web'); // fid 0 for wallet users

  return NextResponse.json({ success: true });
}
