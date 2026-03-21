import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const VALID_INVITE_CODES = new Set(
  [
    '4EB8ED3B',
    ...(process.env.INVITE_CODES || '')
      .split(',')
      .map((c) => c.trim().toUpperCase())
      .filter(Boolean),
  ]
);

export async function POST(req: Request) {
  try {
    const { code } = await req.json().catch(() => ({}));
    const invite = String(code || '').trim().toUpperCase();

    if (!invite) {
      return NextResponse.json({ ok: false, error: 'missing_code' }, { status: 400 });
    }

    if (!VALID_INVITE_CODES.has(invite)) {
      return NextResponse.json({ ok: false, error: 'invalid_code' }, { status: 403 });
    }

    const cookieStore = await cookies();
    cookieStore.set('invite_access', invite, {
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
