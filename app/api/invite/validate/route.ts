export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sql } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { code } = await req.json().catch(() => ({}));
    const invite = String(code || '').trim();

    if (!invite) {
      return NextResponse.json({ ok: false, error: 'missing_code' }, { status: 400 });
    }

    const normalized = invite.toUpperCase();
    const referrer = await sql`
      SELECT referral_code
      FROM users
      WHERE referral_code = ${normalized}
      LIMIT 1
    `;

    if (!referrer.length) {
      return NextResponse.json({ ok: false, error: 'invalid_code' }, { status: 403 });
    }

    const cookieStore = await cookies();
    cookieStore.set('invite_access', normalized, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message || 'invite_validation_failed' }, { status: 500 });
  }
}
