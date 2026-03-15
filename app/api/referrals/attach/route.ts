import { NextResponse } from 'next/server';
import { z } from 'zod';
import { sql } from '@/lib/db';
import { requireCurrentUser } from '@/lib/auth';

const Body = z.object({
  code: z.string().min(4).max(64),
});

export async function POST(req: Request) {
  const current = await requireCurrentUser();
  const body = Body.parse(await req.json());

  const rows = await sql`
    select id, referral_code, referred_by_code
    from users
    where fc_fid = ${current.fid}
    limit 1
  `;

  if (!rows.length) {
    return NextResponse.json({ ok: false, error: 'User not synced' }, { status: 401 });
  }

  const me = rows[0];

  if (me.referral_code === body.code) {
    return NextResponse.json({ ok: false, error: 'Self referral not allowed' }, { status: 400 });
  }

  if (me.referred_by_code) {
    return NextResponse.json({ ok: true, alreadyAttached: true });
  }

  const referrer = await sql`
    select id
    from users
    where referral_code = ${body.code}
    limit 1
  `;

  if (!referrer.length) {
    return NextResponse.json({ ok: false, error: 'Invalid code' }, { status: 404 });
  }

  await sql`
    update users
    set referred_by_code = ${body.code}
    where id = ${me.id}
      and referred_by_code is null
  `;

  return NextResponse.json({ ok: true });
}
