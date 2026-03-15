import { NextResponse } from 'next/server';
import { verifyMessage } from 'viem';
import { z } from 'zod';
import { sql } from '@/lib/db';
import { requireCurrentUser } from '@/lib/auth';

const Body = z.object({
  address: z.string(),
  message: z.string(),
  signature: z.string(),
});

export async function POST(req: Request) {
  const current = await requireCurrentUser();
  const body = Body.parse(await req.json());

  const valid = await verifyMessage({
    address: body.address as `0x${string}`,
    message: body.message,
    signature: body.signature as `0x${string}`,
  });

  if (!valid) {
    return NextResponse.json({ ok: false, error: 'Invalid signature' }, { status: 400 });
  }

  const userRows = await sql`
    select id
    from users
    where fc_fid = ${current.fid}
    limit 1
  `;

  if (!userRows.length) {
    return NextResponse.json({ ok: false, error: 'User not synced' }, { status: 401 });
  }

  const userId = userRows[0].id;

  await sql`
    insert into wallets (user_id, address, chain, verified)
    values (${userId}, ${body.address.toLowerCase()}, 'base', true)
    on conflict (address) do update set
      user_id = excluded.user_id,
      verified = true
  `;

  await sql`
    insert into quest_claims (user_id, quest_id, status, proof, points_awarded)
    values (
      ${userId},
      'wallet-link',
      'verified',
      ${JSON.stringify({ address: body.address.toLowerCase() })}::jsonb,
      500
    )
    on conflict (user_id, quest_id) do nothing
  `;

  return NextResponse.json({ ok: true });
}
