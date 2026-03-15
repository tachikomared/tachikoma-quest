import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const rows = await sql`
    select
      u.fc_username,
      u.fc_fid,
      coalesce(sum(qc.points_awarded), 0)::int as points
    from users u
    left join quest_claims qc on qc.user_id = u.id
    group by u.id, u.fc_username, u.fc_fid
    order by points desc, u.created_at asc
    limit 100
  `;

  return NextResponse.json({ entries: rows });
}
