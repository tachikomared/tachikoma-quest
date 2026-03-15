import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireCurrentUser } from '@/lib/auth';

export async function GET() {
  const current = await requireCurrentUser();

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
    where u.fc_fid = ${current.fid}
    group by u.id, u.fc_fid, u.fc_username, u.fc_display_name, u.fc_pfp_url, u.fc_bio, u.fc_score, u.referral_code
    limit 1
  `;

  return NextResponse.json({ user: rows[0] ?? null });
}
