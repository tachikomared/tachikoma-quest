import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@farcaster/quick-auth';
import { SignJWT, jwtVerify } from 'jose';
import { sql } from '@/lib/db';
import { fetchUserByFid } from '@/lib/neynar';

const quickAuth = createClient();
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || process.env.SESSION_SECRET || 'dev-secret-min-32-chars-long!!'
);
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

function getRequestHost(req: Request) {
  const forwardedHost = req.headers.get('x-forwarded-host');
  const host = forwardedHost || req.headers.get('host');
  return host || new URL(APP_URL).host;
}

async function signSession(payload: { fid: number; username: string | null; userId: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

async function verifySession(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { fid: number; username: string | null; userId: string };
  } catch {
    return null;
  }
}

async function getUserWithPoints(fid: number) {
  const rows = await sql`
    select
      u.id,
      u.fc_fid,
      u.fc_username,
      u.fc_display_name,
      u.fc_pfp_url,
      u.fc_bio,
      u.fc_score,
      u.referral_code,
      coalesce(sum(qc.points_awarded), 0)::int as points
    from users u
    left join quest_claims qc on qc.user_id = u.id
    where u.fc_fid = ${fid}
    group by u.id, u.fc_fid, u.fc_username, u.fc_display_name, u.fc_pfp_url, u.fc_bio, u.fc_score, u.referral_code
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

async function enrichUserProfile(fid: number) {
  try {
    const profile = await fetchUserByFid(fid);
    if (!profile) return;

    await sql`
      update users
      set
        fc_display_name = ${profile.display_name ?? null},
        fc_pfp_url = ${profile.pfp_url ?? null},
        fc_bio = ${profile.profile?.bio?.text ?? null},
        fc_score = ${profile.score ?? null}
      where fc_fid = ${fid}
    `;
  } catch {
    // Ignore profile enrichment failures
  }
}

async function setSession(fid: number, username: string | null, userId: string) {
  const token = await signSession({ fid, username, userId });
  const cookieStore = await cookies();
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
  });
}

async function handleQuickAuth(token: string, req: Request) {
  const domain = getRequestHost(req);
  console.log('[auth] Verifying JWT for domain:', domain);

  let payload;
  try {
    payload = await quickAuth.verifyJwt({
      token,
      domain,
    });
  } catch (e: any) {
    console.error('[auth] JWT verification failed:', e?.message || e);
    throw new Error('jwt_verification_failed: ' + (e?.message || 'unknown'));
  }

  console.log('[auth] JWT payload keys:', Object.keys(payload || {}));

  // Quick Auth JWT contains fid and username in the payload
  const quickAuthPayload = payload as { fid?: number; username?: string };
  const fid = quickAuthPayload?.fid ? Number(quickAuthPayload.fid) : null;
  const username = quickAuthPayload?.username ?? null;

  console.log('[auth] Extracted fid:', fid, 'username:', username);

  if (!fid) {
    throw new Error('missing_fid_in_token');
  }

  const userId = await ensureUser(fid, username);
  await enrichUserProfile(fid);
  await setSession(fid, username, userId);

  const user = await getUserWithPoints(fid);
  console.log('[auth] User authenticated:', user?.fc_fid);
  return NextResponse.json({ user });
}

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  console.log('[auth] GET headers:', { authorization: authHeader ? 'present' : 'missing', host: getRequestHost(req) });

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '').trim();
    console.log('[auth] Bearer token present, length:', token.length);
    try {
      return await handleQuickAuth(token, req);
    } catch (e: any) {
      console.error('[auth] Quick auth failed:', e?.message || e);
      return NextResponse.json({ user: null, error: e?.message || 'auth_failed' }, { status: 401 });
    }
  }

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session');

  if (!sessionToken?.value) {
    console.log('[auth] No session cookie');
    return NextResponse.json({ user: null });
  }

  const session = await verifySession(sessionToken.value);
  if (!session) {
    console.log('[auth] Session verification failed');
    return NextResponse.json({ user: null });
  }

  console.log('[auth] Session valid for fid:', session.fid);
  const user = await getUserWithPoints(session.fid);
  return NextResponse.json({ user });
}

export async function POST(req: Request) {
  let body;
  try {
    body = await req.json();
  } catch (e) {
    console.error('[auth] POST body parse failed');
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const { token } = body;
  console.log('[auth] POST token present:', !!token, 'host:', getRequestHost(req));

  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  }

  try {
    return await handleQuickAuth(token, req);
  } catch (e: any) {
    console.error('[auth] POST auth failed:', e?.message || e);
    return NextResponse.json({ error: e?.message || 'auth_failed' }, { status: 401 });
  }
}
