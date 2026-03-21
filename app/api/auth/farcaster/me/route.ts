import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@farcaster/quick-auth';
import { sql } from '@/lib/db';
import { fetchUserWithScore, type NeynarUser } from '@/lib/neynar';
import { fetchUserByFid } from '@/lib/neynar';
import { signSession, getFullUser, setSession } from '@/lib/auth';

const quickAuth = createClient();
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const MAX_INVITES = 5;

function getRequestHost(req: Request): string {
  const host = req.headers.get('host') || req.headers.get('x-forwarded-host');
  if (host) return host;
  try {
    return new URL(APP_URL).host;
  } catch {
    return 'localhost:3000';
  }
}

async function enforceAccessGate(fid: number, neynarUser: NeynarUser | null): Promise<{ allowed: boolean; reason?: string }> {
  const minScore = Number(process.env.NEYNAR_MIN_SCORE || '0.8');

  // Allow if blue check exists
  if (neynarUser?.power_badge) {
    return { allowed: true };
  }

  // Allow if score meets threshold
  const score = neynarUser?.experimental?.neynar_user_score;
  if (typeof score === 'number' && score >= minScore) {
    return { allowed: true };
  }

  // Otherwise block unless this is an existing invited user record
  const invited = await sql`SELECT 1 FROM users WHERE fc_fid = ${fid} LIMIT 1`;
  if (invited.length) {
    return { allowed: true };
  }

  return { allowed: false, reason: 'invite_or_trust_required' };
}

async function canInviteMore(userId: string): Promise<boolean> {
  const result = await sql`
    SELECT COUNT(*)::int AS count FROM referrals WHERE referrer_user_id = ${userId}
  `;
  return result[0].count < MAX_INVITES;
}

async function ensureUser(fid: number, neynarUser: NeynarUser | null): Promise<string> {
  const cookieStore = await cookies();
  const inviteAccess = cookieStore.get('invite_access')?.value;

  const gate = await enforceAccessGate(fid, neynarUser);
  if (!gate.allowed && !inviteAccess) {
    throw new Error(gate.reason);
  }

  // Check if user exists
  const existing = await sql`
    SELECT id FROM users WHERE fc_fid = ${fid} LIMIT 1
  `;

  if (existing.length) {
    const userId = existing[0].id;

    if (neynarUser) {
      try {
        await sql`
          UPDATE users
          SET 
            fc_username = ${neynarUser.username ?? null},
            fc_display_name = ${neynarUser.display_name ?? null},
            fc_pfp_url = ${neynarUser.pfp_url ?? null},
            fc_bio = ${neynarUser.profile?.bio?.text ?? null},
            fc_score = ${neynarUser.experimental?.neynar_user_score ?? null},
            fc_followers = ${neynarUser.follower_count ?? 0},
            fc_following = ${neynarUser.following_count ?? 0},
            fc_power_badge = ${neynarUser.power_badge ?? false},
            updated_at = NOW()
          WHERE id = ${userId}
        `;
      } catch (e) {
        console.warn('[auth] Failed to update profile:', e);
        try {
          await sql`
            UPDATE users
            SET fc_username = ${neynarUser.username ?? null}
            WHERE id = ${userId}
          `;
        } catch {
          // Ignore
        }
      }
    }

    return userId;
  }

  // Create new user
  const username = neynarUser?.username || `fid-${fid}`;
  const referralCode = username.toUpperCase().replace(/[^A-Z0-9]/g, '') + '-' + fid;

  try {
    const result = await sql`
      INSERT INTO users (
        fc_fid, fc_username, fc_display_name, fc_pfp_url, fc_bio,
        fc_score, fc_followers, fc_following, fc_power_badge, referral_code
      ) VALUES (
        ${fid},
        ${neynarUser?.username ?? null},
        ${neynarUser?.display_name ?? null},
        ${neynarUser?.pfp_url ?? null},
        ${neynarUser?.profile?.bio?.text ?? null},
        ${neynarUser?.experimental?.neynar_user_score ?? null},
        ${neynarUser?.follower_count ?? 0},
        ${neynarUser?.following_count ?? 0},
        ${neynarUser?.power_badge ?? false},
        ${referralCode}
      )
      RETURNING id
    `;
    return result[0].id;
  } catch (e) {
    console.warn('[auth] Full insert failed, trying minimal:', e);
    const result = await sql`
      INSERT INTO users (fc_fid, fc_username, referral_code)
      VALUES (${fid}, ${username}, ${referralCode})
      RETURNING id
    `;
    return result[0].id;
  }
}

async function handleQuickAuth(token: string, req: Request) {
  const domain = getRequestHost(req);
  console.log('[auth] Verifying JWT for domain:', domain);

  let payload;
  try {
    payload = await quickAuth.verifyJwt({ token, domain });
    console.log('[auth] JWT verified, payload:', JSON.stringify(payload));
  } catch (e: any) {
    console.error('[auth] JWT verification failed:', e?.message || e);
    return NextResponse.json(
      { user: null, error: 'jwt_verification_failed', details: e?.message },
      { status: 401 }
    );
  }

  const fid = typeof payload.sub === 'number' ? payload.sub : Number(payload.sub);

  if (!fid || Number.isNaN(fid)) {
    return NextResponse.json(
      { user: null, error: 'missing_fid' },
      { status: 401 }
    );
  }

  console.log('[auth] Authenticating FID:', fid);

  let neynarUser: NeynarUser | null = null;
  try {
    neynarUser = await fetchUserWithScore(fid);
  } catch (e) {
    console.warn('[auth] Neynar fetch failed:', e);
  }

  try {
    const userId = await ensureUser(fid, neynarUser);
    await setSession(fid, neynarUser?.username || null, userId);

    const user = await getFullUser(fid);
    console.log('[auth] Success:', user?.fcFid);
    return NextResponse.json({ user });
  } catch (e: any) {
    console.error('[auth] Database error:', e);
    if (e.message === 'invite_or_trust_required') {
      return NextResponse.json(
        { user: null, error: 'access_restricted', details: 'You need a blue check or Neynar score >= 0.8' },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { user: null, error: 'database_error', details: e.message },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '').trim();
    return handleQuickAuth(token, req);
  }

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session');

  if (!sessionToken?.value) {
    return NextResponse.json({ user: null });
  }

  try {
    const { default: jwtVerify } = await import('jose').then(m => ({ default: m.jwtVerify }));
    const JWT_SECRET = new TextEncoder().encode(
      process.env.JWT_SECRET || process.env.SESSION_SECRET || 'dev-secret-min-32-chars-long!!'
    );
    const { payload } = await jwtVerify(sessionToken.value, JWT_SECRET);
    const session = payload as { fid: number };

    const user = await getFullUser(session.fid);
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ user: null });
  }
}

export async function POST(req: Request) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const { token } = body;
  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  }

  return handleQuickAuth(token, req);
}
