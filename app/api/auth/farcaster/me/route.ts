import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@farcaster/quick-auth';
import { sql } from '@/lib/db';
import { fetchUserWithScore, type NeynarUser } from '@/lib/neynar';
import { signSession, getFullUser, setSession } from '@/lib/auth';

const quickAuth = createClient();
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Domain must match exactly what's in the farcaster.json manifest
const DOMAIN = 'tachi-quest.vercel.app';

function getRequestHost(req: Request): string {
  // Always use the canonical domain for JWT verification
  // The JWT is signed for the domain in the manifest
  return DOMAIN;
}

async function ensureUser(fid: number, neynarUser: NeynarUser | null): Promise<string> {
  // Check if user exists
  const existing = await sql`
    SELECT id FROM users WHERE fc_fid = ${fid} LIMIT 1
  `;

  if (existing.length) {
    const userId = existing[0].id;
    
    // Update profile if we have Neynar data
    if (neynarUser) {
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
    }
    
    return userId;
  }

  // Create new user
  const username = neynarUser?.username || `fid-${fid}`;
  const referralCode = username.toUpperCase().replace(/[^A-Z0-9]/g, '') + '-' + fid;

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
}

async function handleQuickAuth(token: string, req: Request) {
  const domain = getRequestHost(req);
  console.log('[auth] Verifying JWT for domain:', domain);
  console.log('[auth] Token preview:', token.substring(0, 20) + '...');
  console.log('[auth] All headers:', Object.fromEntries(req.headers.entries()));

  let payload;
  try {
    payload = await quickAuth.verifyJwt({
      token,
      domain,
    });
    console.log('[auth] JWT verified successfully');
  } catch (e: any) {
    console.error('[auth] JWT verification failed:', e?.message || e);
    console.error('[auth] JWT error details:', e);
    return NextResponse.json(
      { user: null, error: 'jwt_verification_failed', details: e?.message },
      { status: 401 }
    );
  }

  const quickAuthPayload = payload as { fid?: number; username?: string };
  const fid = quickAuthPayload?.fid ? Number(quickAuthPayload.fid) : null;
  const username = quickAuthPayload?.username ?? null;

  if (!fid) {
    return NextResponse.json(
      { user: null, error: 'missing_fid' },
      { status: 401 }
    );
  }

  console.log('[auth] Authenticating FID:', fid);

  // Fetch full user data from Neynar
  let neynarUser: NeynarUser | null = null;
  try {
    neynarUser = await fetchUserWithScore(fid);
  } catch (e) {
    console.error('[auth] Failed to fetch Neynar profile:', e);
  }

  // Ensure user exists in DB
  const userId = await ensureUser(fid, neynarUser);

  // Set session cookie
  await setSession(fid, username, userId);

  // Return full user data
  const user = await getFullUser(fid);
  console.log('[auth] User authenticated:', user?.fcFid);

  return NextResponse.json({ user });
}

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  console.log('[auth] GET headers:', { 
    authorization: authHeader ? 'present' : 'missing', 
    host: getRequestHost(req) 
  });

  // Handle Quick Auth Bearer token
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '').trim();
    return handleQuickAuth(token, req);
  }

  // Check session cookie
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session');

  if (!sessionToken?.value) {
    return NextResponse.json({ user: null });
  }

  // Try to get user from session
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
