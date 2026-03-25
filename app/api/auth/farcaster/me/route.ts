import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@farcaster/quick-auth';
import { sql } from '@/lib/db';
import { fetchUserWithScore, type NeynarUser } from '@/lib/neynar';
import { signSession, getFullUser, setSession } from '@/lib/auth';

const quickAuth = createClient();
function getRequestHost(req: Request): string {
  // Use the actual request host — Quick Auth JWT domain must match exactly
  const forwarded = req.headers.get('x-forwarded-host');
  const host = req.headers.get('host');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  // Prefer forwarded host (Vercel sets this), then host header, then env var
  const domain = forwarded || host || (appUrl ? new URL(appUrl).host : 'tachi-quest.vercel.app');
  return domain.split(',')[0].trim(); // handle multiple forwarded hosts
}

async function ensureUser(fid: number, neynarUser: NeynarUser | null): Promise<string> {
  // Check if user exists
  const existing = await sql`
    SELECT id FROM users WHERE fc_fid = ${fid} LIMIT 1
  `;

  if (existing.length) {
    const userId = existing[0].id;
    
    // Try to update profile if we have Neynar data
    // This may fail if columns don't exist, so we wrap in try-catch
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
        console.warn('[auth] Failed to update extended profile:', e);
        // Try basic update without extended columns
        try {
          await sql`
            UPDATE users
            SET fc_username = ${neynarUser.username ?? null}
            WHERE id = ${userId}
          `;
        } catch {
          // Ignore - user exists, that's what matters
        }
      }
    }
    
    return userId;
  }

  // Create new user
  const username = neynarUser?.username || `fid-${fid}`;
  const referralCode = username.toUpperCase().replace(/[^A-Z0-9]/g, '') + '-' + fid;

  // Try full insert first
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
    console.warn('[auth] Full insert failed, trying minimal insert:', e);
    
    // Fallback to minimal insert
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

  // Domains to try in order
  const domainsToTry = [
    domain,
    'tachi-quest.vercel.app',
    process.env.NEXT_PUBLIC_APP_URL ? new URL(process.env.NEXT_PUBLIC_APP_URL).host : null,
  ].filter(Boolean) as string[];

  let payload: any = null;
  let lastErr: any;
  for (const d of domainsToTry) {
    try {
      payload = await quickAuth.verifyJwt({ token, domain: d });
      console.log('[auth] JWT verified with domain:', d, JSON.stringify(payload));
      break;
    } catch (e: any) {
      lastErr = e;
      console.warn('[auth] JWT verify failed for domain:', d, e?.message);
    }
  }

  if (!payload) {
    console.error('[auth] JWT verification failed all domains:', lastErr?.message || lastErr);
    return NextResponse.json(
      { user: null, error: 'jwt_verification_failed', details: lastErr?.message },
      { status: 401 }
    );
  }

  // FID is in payload.sub
  const fid = typeof payload.sub === 'number' ? payload.sub : Number(payload.sub);
  
  if (!fid || Number.isNaN(fid)) {
    return NextResponse.json(
      { user: null, error: 'missing_fid' },
      { status: 401 }
    );
  }

  console.log('[auth] Authenticating FID:', fid);

  // Fetch Neynar data (optional)
  let neynarUser: NeynarUser | null = null;
  try {
    neynarUser = await fetchUserWithScore(fid);
  } catch (e) {
    console.warn('[auth] Neynar fetch failed:', e);
  }

  // Create/update user
  try {
    const userId = await ensureUser(fid, neynarUser);
    await setSession(fid, neynarUser?.username || null, userId);
    
    const user = await getFullUser(fid);
    console.log('[auth] Success:', user?.fcFid);
    return NextResponse.json({ user });
  } catch (e: any) {
    console.error('[auth] Database error:', e);
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

  // Check session cookie
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
