import { NextResponse } from 'next/server';
import { verifyMessage } from 'viem';
import { z } from 'zod';
import { sql } from '@/lib/db';
import { requireCurrentUser } from '@/lib/auth';
import { getQuest } from '@/lib/quests';

const BodySchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  message: z.string().min(1, 'Message required'),
  signature: z.string().regex(/^0x[a-fA-F0-9]{130}$/, 'Invalid signature'),
});

export async function POST(req: Request) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  // Validate body
  const parseResult = BodySchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { ok: false, error: parseResult.error.errors[0].message },
      { status: 400 }
    );
  }

  const { address, message, signature } = parseResult.data;

  // Verify current user
  const current = await requireCurrentUser();

  // Verify signature
  let valid = false;
  try {
    valid = await verifyMessage({
      address: address as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    });
  } catch (e) {
    console.error('[wallet] Signature verification error:', e);
  }

  if (!valid) {
    return NextResponse.json(
      { ok: false, error: 'Invalid signature' },
      { status: 400 }
    );
  }

  // Verify message contains FID
  if (!message.includes(String(current.fid))) {
    return NextResponse.json(
      { ok: false, error: 'Invalid message - FID mismatch' },
      { status: 400 }
    );
  }

  // Get user ID
  const userRows = await sql`
    SELECT id FROM users WHERE fc_fid = ${current.fid} LIMIT 1
  `;

  if (!userRows.length) {
    return NextResponse.json(
      { ok: false, error: 'User not found' },
      { status: 401 }
    );
  }

  const userId = userRows[0].id;
  const addressLower = address.toLowerCase();

  // Insert/update wallet
  await sql`
    INSERT INTO wallets (user_id, address, chain, verified)
    VALUES (${userId}, ${addressLower}, 'base', true)
    ON CONFLICT (address) DO UPDATE SET
      user_id = EXCLUDED.user_id,
      verified = true
  `;

  // Update user's primary wallet (best effort)
  try {
    await sql`
      UPDATE users SET wallet_address = ${addressLower} WHERE id = ${userId}
    `;
  } catch (e) {
    console.warn('[wallet] users.wallet_address update skipped:', e);
  }

  // Award quest points if wallet-link quest exists
  const walletQuest = getQuest('wallet-link');
  if (walletQuest) {
    await sql`
      INSERT INTO quest_claims (user_id, quest_id, status, proof, points_awarded)
      VALUES (
        ${userId},
        'wallet-link',
        'verified',
        ${JSON.stringify({ address: addressLower, signature })}::jsonb,
        ${walletQuest.points}
      )
      ON CONFLICT (user_id, quest_id) DO NOTHING
    `;
  }

  return NextResponse.json({
    ok: true,
    questId: 'wallet-link',
    pointsAwarded: walletQuest?.points ?? 0,
  });
}
