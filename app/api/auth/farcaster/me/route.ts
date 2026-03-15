import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sql } from '@/lib/db';

const NEYNAR_API_URL = 'https://api.neynar.com/v2';

async function verifyQuickAuthToken(token: string): Promise<{
  valid: boolean;
  fid?: number;
  username?: string;
  pfp?: string;
}> {
  try {
    const res = await fetch(`${NEYNAR_API_URL}/farcaster/user/verify_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.NEYNAR_API_KEY || '',
      },
      body: JSON.stringify({ token }),
    });

    if (!res.ok) return { valid: false };
    const data = await res.json();
    return {
      valid: true,
      fid: data.fid,
      username: data.username,
      pfp: data.pfp_url,
    };
  } catch {
    return { valid: false };
  }
}

async function getUserWithPoints(fid: number) {
  const rows = await sql`
    select
      u.id,
      u.fc_fid,
      u.fc_username,
      u.referral_code,
      coalesce(sum(qc.points_awarded), 0)::int as points
    from users u
    left join quest_claims qc on qc.user_id = u.id
    where u.fc_fid = ${fid}
    group by u.id, u.fc_fid, u.fc_username, u.referral_code
    limit 1
  `;

  return rows[0] ?? null;
}

async function ensureUser(fid: number, username?: string | null) {
  const existing = await sql`
    select id, fc_fid, fc_username from users where fc_fid = ${fid} limit 1
  `;

  if (existing.length) {
    const userId = existing[0].id;
    if (username && username !== existing[0].fc_username) {
      await sql`update users set fc_username = ${username} where id = ${userId}`;
    }
    return userId;
  }

  const result = await sql`
    insert into users (fc_fid, fc_username, referral_code)
    values (${fid}, ${username ?? null}, encode(gen_random_bytes(4), 'hex'))
    returning id
  `;

  return result[0].id as string;
}

async function setSession(fid: number, username?: string | null, userId?: string) {
  const cookieStore = await cookies();
  cookieStore.set('session', JSON.stringify({
    fid,
    username: username ?? null,
    userId,
  }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
  });
}

async function handleQuickAuth(token: string) {
  const auth = await verifyQuickAuthToken(token);
  if (!auth.valid || !auth.fid) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const userId = await ensureUser(auth.fid, auth.username);
  await setSession(auth.fid, auth.username, userId);

  const user = await getUserWithPoints(auth.fid);
  return NextResponse.json({ user });
}

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '').trim();
    return handleQuickAuth(token);
  }

  const cookieStore = await cookies();
  const session = cookieStore.get('session');

  if (!session?.value) {
    return NextResponse.json({ user: null });
  }

  try {
    const data = JSON.parse(session.value);
    if (!data.fid) {
      return NextResponse.json({ user: null });
    }

    const user = await getUserWithPoints(data.fid);
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ user: null });
  }
}

export async function POST(req: Request) {
  const body = await req.json();
  const { token } = body;

  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  }

  return handleQuickAuth(token);
}
