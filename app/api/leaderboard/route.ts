import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const rows = await sql`
    SELECT 
      u.fc_username,
      u.fc_fid,
      u.fc_pfp_url,
      u.fc_display_name,
      COALESCE(SUM(qc.points_awarded), 0)::int AS points
    FROM users u
    LEFT JOIN quest_claims qc ON qc.user_id = u.id
    GROUP BY u.id, u.fc_username, u.fc_fid, u.fc_pfp_url, u.fc_display_name
    ORDER BY points DESC, u.created_at ASC
    LIMIT 100
  `;

  const entries = rows.map((r, index) => ({
    rank: index + 1,
    fid: r.fc_fid,
    username: r.fc_username,
    displayName: r.fc_display_name,
    pfpUrl: r.fc_pfp_url,
    points: r.points,
  }));

  return NextResponse.json({ entries });
}
