import { cookies } from 'next/headers';
import { sql } from '@/lib/db';

export type CurrentUser = {
  id: string;
  fid: number;
  username: string | null;
};

export async function requireCurrentUser(): Promise<CurrentUser> {
  const cookieStore = await cookies();
  const session = cookieStore.get('session');

  if (!session?.value) {
    throw new Error('Unauthorized');
  }

  let data: { fid?: number; username?: string | null; userId?: string };
  try {
    data = JSON.parse(session.value);
  } catch {
    throw new Error('Invalid session');
  }

  if (!data.fid) {
    throw new Error('Invalid session');
  }

  // Verify user exists in DB
  const rows = await sql`
    select id, fc_fid, fc_username
    from users
    where fc_fid = ${data.fid}
    limit 1
  `;

  if (rows.length) {
    return {
      id: rows[0].id,
      fid: rows[0].fc_fid,
      username: rows[0].fc_username,
    };
  }

  // User not in DB yet - create them
  const result = await sql`
    insert into users (fc_fid, fc_username, referral_code)
    values (${data.fid}, ${data.username ?? null}, encode(gen_random_bytes(4), 'hex'))
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
