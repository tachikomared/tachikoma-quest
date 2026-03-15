import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { sql } from '@/lib/db';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || process.env.SESSION_SECRET || 'dev-secret-min-32-chars-long!!'
);

export type CurrentUser = {
  id: string;
  fid: number;
  username: string | null;
};

async function verifySession(token: string): Promise<{ fid: number; username: string | null; userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { fid: number; username: string | null; userId: string };
  } catch {
    return null;
  }
}

export async function requireCurrentUser(): Promise<CurrentUser> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');

  if (!sessionCookie?.value) {
    throw new Error('Unauthorized');
  }

  const session = await verifySession(sessionCookie.value);
  if (!session?.fid) {
    throw new Error('Invalid session');
  }

  // Verify user exists in DB
  const rows = await sql`
    select id, fc_fid, fc_username
    from users
    where fc_fid = ${session.fid}
    limit 1
  `;

  if (rows.length) {
    return {
      id: rows[0].id,
      fid: rows[0].fc_fid,
      username: rows[0].fc_username,
    };
  }

  // Create new user
  const result = await sql`
    insert into users (fc_fid, fc_username, referral_code)
    values (${session.fid}, ${session.username ?? null}, encode(gen_random_bytes(4), 'hex'))
    returning id, fc_fid, fc_username
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
