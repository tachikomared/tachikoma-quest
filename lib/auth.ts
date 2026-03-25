import { cookies } from 'next/headers';
import { jwtVerify, SignJWT } from 'jose';
import { sql } from '@/lib/db';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || process.env.SESSION_SECRET || 'dev-secret-min-32-chars-long!!'
);

export type AuthMode = 'farcaster' | 'base_web';

export type SessionPayload = {
  authMode: AuthMode;
  fid?: number;
  walletAddress?: string;
  username?: string | null;
  userId: string;
};

export type CurrentUser = {
  id: string;
  authMode: AuthMode;
  fid?: number;
  walletAddress?: string | null;
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

async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

export async function signSession(payload: SessionPayload): Promise<string> {
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
  if (!session?.userId) {
    throw new Error('Invalid session');
  }

  // Look up exactly by userId (primary key)
  const rows = await sql`
    SELECT id, fc_fid, fc_username, wallet_address
    FROM users
    WHERE id = ${session.userId}
    LIMIT 1
  `;
  
  if (rows.length) {
    return {
      id: rows[0].id,
      authMode: session.authMode,
      fid: rows[0].fc_fid || 0,
      walletAddress: rows[0].wallet_address,
      username: rows[0].fc_username
    };
  }
  
  throw new Error('User not found');
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    return await requireCurrentUser();
  } catch {
    return null;
  }
}

export async function getFullUser(userIdOrFid: string | number): Promise<FullUser | null> {
  try {
    const isId = typeof userIdOrFid === 'string';
    const rows = isId 
      ? await sql`
        SELECT u.id, u.fc_fid, u.fc_username, u.fc_display_name, u.fc_pfp_url, u.fc_bio, u.fc_score, u.fc_followers, u.fc_following, u.fc_power_badge, u.referral_code, u.referred_by_code, u.wallet_address, COALESCE(SUM(qc.points_awarded), 0)::int AS points
        FROM users u LEFT JOIN quest_claims qc ON qc.user_id = u.id
        WHERE u.id = ${userIdOrFid}
        GROUP BY u.id, u.fc_fid, u.fc_username, u.fc_display_name, u.fc_pfp_url, u.fc_bio, u.fc_score, u.fc_followers, u.fc_following, u.fc_power_badge, u.referral_code, u.referred_by_code, u.wallet_address
        LIMIT 1
      `
      : await sql`
        SELECT u.id, u.fc_fid, u.fc_username, u.fc_display_name, u.fc_pfp_url, u.fc_bio, u.fc_score, u.fc_followers, u.fc_following, u.fc_power_badge, u.referral_code, u.referred_by_code, u.wallet_address, COALESCE(SUM(qc.points_awarded), 0)::int AS points
        FROM users u LEFT JOIN quest_claims qc ON qc.user_id = u.id
        WHERE u.fc_fid = ${userIdOrFid}
        GROUP BY u.id, u.fc_fid, u.fc_username, u.fc_display_name, u.fc_pfp_url, u.fc_bio, u.fc_score, u.fc_followers, u.fc_following, u.fc_power_badge, u.referral_code, u.referred_by_code, u.wallet_address
        LIMIT 1
      `;

    if (!rows.length) return null;

    const r = rows[0];
    return {
      id: r.id,
      fcFid: r.fc_fid || 0,
      fcUsername: r.fc_username,
      fcDisplayName: r.fc_display_name,
      fcPfpUrl: r.fc_pfp_url,
      fcBio: r.fc_bio,
      fcScore: r.fc_score ? Number(r.fc_score) : null,
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
    const isId = typeof userIdOrFid === 'string';
    const rows = isId 
      ? await sql`SELECT id, fc_fid, fc_username, referral_code, wallet_address FROM users WHERE id = ${userIdOrFid} LIMIT 1`
      : await sql`SELECT id, fc_fid, fc_username, referral_code, wallet_address FROM users WHERE fc_fid = ${userIdOrFid} LIMIT 1`;
    
    if (!rows.length) return null;
    
    return {
      id: rows[0].id,
      fcFid: rows[0].fc_fid || 0,
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
      walletAddress: rows[0].wallet_address,
      points: 0,
    };
  }
}

export async function setSession(fid: number, username: string | null, userId: string, authMode: AuthMode = 'farcaster', walletAddress?: string): Promise<void> {
  const token = await signSession({ fid, username, userId, authMode, walletAddress });
  const cookieStore = await cookies();
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
}
