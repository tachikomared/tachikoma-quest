import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  const body = await req.json();
  
  const { signature, message, user } = body;
  
  if (!signature || !user?.fid) {
    return NextResponse.json({ error: 'Invalid auth data' }, { status: 401 });
  }
  
  // Set session cookie
  const cookieStore = await cookies();
  cookieStore.set('session', JSON.stringify({
    fid: user.fid,
    username: user.username,
    signature,
    message,
  }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
  return NextResponse.json({ ok: true });
}
