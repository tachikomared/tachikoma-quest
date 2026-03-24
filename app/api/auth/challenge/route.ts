import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import crypto from 'crypto';

export async function POST(req: Request) {
  const { walletAddress, domain } = await req.json();
  
  if (!walletAddress || !domain) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  const nonce = crypto.randomBytes(32).toString('hex');
  const hashedNonce = crypto.createHash('sha256').update(nonce).digest('hex');
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

  await sql`
    INSERT INTO auth_nonces (nonce_hash, wallet_address, domain, expires_at)
    VALUES (${hashedNonce}, ${walletAddress.toLowerCase()}, ${domain}, ${expiresAt.toISOString()})
  `;

  return NextResponse.json({ nonce, message: `Sign this to verify ownership: ${nonce}` });
}
