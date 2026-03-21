import { cookies } from 'next/headers';
import { jwtVerify, SignJWT } from 'jose';
import { sql } from '@/lib/db';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || process.env.SESSION_SECRET || 'dev-secret-min-32-chars-long!!'
);

export type CurrentUser = {
  id: string;
  fid: number;
  username: string | null;
};

export type FullUser = {
  id: string;
  fcFid: number;
  fcUsername: string | null;
  fcDisplayName: string | null;
  fcPfpUrl: string | null;
  fcBio: string | null;
  fcScore: number | null;
  fcFollowers: number;
  fcFollowing: number;
  fcPowerBadge: boolean;
  referralCode: string;
  referredByCode: string | null;
  walletAddress: string | null;
  points: number;
};

async function verifySessionToken(token: string): Promise<{ fid: number; username: string | null; userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { fid: number; username: string | null; userId: string };
  } catch {
    return null;
  }
}

export async function signSession(payload: { fid: number; username: string | null; userId: string }): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function requireCurrentUser(): Promise<CurrentUser> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');

  if (!sessionCookie?.value) {
    throw new Error('Unauthorized');
  }

  const session = await verifySessionToken(sessionCookie.value);
  if (session?.fid === undefined || session?.fid === null) {
    throw new Error('Invalid session');
  }

  // Verify user exists in DB
  const rows = session.fid === 0
    ? await sql`
        SELECT id, fc_fid, fc_username
        FROM users
        WHERE id = ${session.userId}
        LIMIT 1
      `
    : await sql`
        SELECT id, fc_fid, fc_username
        FROM users
        WHERE fc_fid = ${session.fid}
        LIMIT 1
      `;

  if (rows.length) {
    return {
      id: rows[0].id,
      fid: rows[0].fc_fid ?? 0,
      username: rows[0].fc_username,
    };
  }

  // Create new user if not exists - generate referral code in JS (no pgcrypto dependency)
  if (session.fid === 0) {
    throw new Error('Guest user not found');
  }

  const referralCode = Math.random().toString(36).substring(2, 10).toUpperCase();
  const result = await sql`
    INSERT INTO users (fc_fid, fc_username, referral_code)
    VALUES (${session.fid}, ${session.username ?? null}, ${referralCode})
    RETURNING id, fc_fid, fc_username
  `;

  return {
    id: result[0].id,
    fid: result[0].fc_fid,
    username: result[0].fc_username,
  };
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    return await requireCurrentUser();
  } catch {
    return null;
  }
}

export async function getFullUser(fid: number, userId?: string): Promise<FullUser | null> {
  try {
    // For guests (fid = 0), query by userId instead
    const rows = fid === 0 && userId
      ? await sql`
          SELECT 
            u.id,
            u.fc_fid,
            u.fc_username,
            u.fc_display_name,
            u.fc_pfp_url,
            u.fc_bio,
            u.fc_score,
            u.fc_followers,
            u.fc_following,
            u.fc_power_badge,
            u.referral_code,
            u.referred_by_code,
            MAX(w.address) AS wallet_address,
            COALESCE(SUM(qc.points_awarded), 0)::int AS points
          FROM users u
          LEFT JOIN wallets w ON w.user_id = u.id AND w.verified = true
          LEFT JOIN quest_claims qc ON qc.user_id = u.id
          WHERE u.id = ${userId}
          GROUP BY u.id, u.fc_fid, u.fc_username, u.fc_display_name, u.fc_pfp_url, 
                   u.fc_bio, u.fc_score, u.fc_followers, u.fc_following, u.fc_power_badge,
                   u.referral_code, u.referred_by_code
          LIMIT 1
        `
      : await sql`
          SELECT 
            u.id,
            u.fc_fid,
            u.fc_username,
            u.fc_display_name,
            u.fc_pfp_url,
            u.fc_bio,
            u.fc_score,
            u.fc_followers,
            u.fc_following,
            u.fc_power_badge,
            u.referral_code,
            u.referred_by_code,
            MAX(w.address) AS wallet_address,
            COALESCE(SUM(qc.points_awarded), 0)::int AS points
          FROM users u
          LEFT JOIN wallets w ON w.user_id = u.id AND w.verified = true
          LEFT JOIN quest_claims qc ON qc.user_id = u.id
          WHERE u.fc_fid = ${fid}
          GROUP BY u.id, u.fc_fid, u.fc_username, u.fc_display_name, u.fc_pfp_url, 
                   u.fc_bio, u.fc_score, u.fc_followers, u.fc_following, u.fc_power_badge,
                   u.referral_code, u.referred_by_code
          LIMIT 1
        `;

    if (!rows.length) return null;

    const r = rows[0];
    return {
      id: r.id,
      fcFid: r.fc_fid,
      fcUsername: r.fc_username,
      fcDisplayName: r.fc_display_name,
      fcPfpUrl: r.fc_pfp_url,
      fcBio: r.fc_bio,
      fcScore: r.fc_score !== null && r.fc_score !== undefined ? Number(r.fc_score) : null,
      fcFollowers: r.fc_followers || 0,
      fcFollowing: r.fc_following || 0,
      fcPowerBadge: r.fc_power_badge || false,
      referralCode: r.referral_code,
      referredByCode: r.referred_by_code,
      walletAddress: r.wallet_address,
      points: r.points || 0,
    };
  } catch (e) {
    console.warn('[auth] getFullUser failed with extended columns, trying minimal:', e);
    
    // Fallback to minimal query
    const rows = await sql`
      SELECT id, fc_fid, fc_username, referral_code
      FROM users
      WHERE fc_fid = ${fid}
      LIMIT 1
    `;
    
    if (!rows.length) return null;
    
    return {
      id: rows[0].id,
      fcFid: rows[0].fc_fid,
      fcUsername: rows[0].fc_username,
      fcDisplayName: null,
      fcPfpUrl: null,
      fcBio: null,
      fcScore: null,
      fcFollowers: 0,
      fcFollowing: 0,
      fcPowerBadge: false,
      referralCode: rows[0].referral_code,
      referredByCode: null,
      walletAddress: null,
      points: 0,
    };
  }
}

export async function setSession(fid: number, username: string | null, userId: string): Promise<void> {
  const token = await signSession({ fid, username, userId });
  const cookieStore = await cookies();
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
}
