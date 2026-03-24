export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { sql } from '@/lib/db';
import { requireCurrentUser } from '@/lib/auth';

const BodySchema = z.object({
  code: z.string().min(3).max(64),
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

  const parseResult = BodySchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { ok: false, error: 'Invalid referral code' },
      { status: 400 }
    );
  }

  const current = await requireCurrentUser();
  const { code } = parseResult.data;

  // Get current user
  const userRows = current.fid === 0
    ? await sql`
        SELECT id, referral_code, referred_by_code
        FROM users
        WHERE id = ${current.id}
        LIMIT 1
      `
    : await sql`
        SELECT id, referral_code, referred_by_code
        FROM users
        WHERE fc_fid = ${current.fid}
        LIMIT 1
      `;

  if (!userRows.length) {
    return NextResponse.json(
      { ok: false, error: 'User not found' },
      { status: 404 }
    );
  }

  const me = userRows[0];

  // Prevent self-referral
  if (me.referral_code === code) {
    return NextResponse.json(
      { ok: false, error: 'Cannot use your own referral code' },
      { status: 400 }
    );
  }

  // Check if already has a referrer
  if (me.referred_by_code) {
    return NextResponse.json({
      ok: true,
      alreadyAttached: true,
      message: 'You already have a referrer',
    });
  }

  // Find referrer
  const referrer = await sql`
    SELECT id
    FROM users
    WHERE referral_code = ${code}
    LIMIT 1
  `;

  if (!referrer.length) {
    return NextResponse.json(
      { ok: false, error: 'Invalid referral code' },
      { status: 404 }
    );
  }

  // Update user with referrer code
  await sql`
    UPDATE users
    SET referred_by_code = ${code}
    WHERE id = ${me.id}
      AND referred_by_code IS NULL
  `;

  return NextResponse.json({ ok: true });
}
