export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    const rows = await sql`
      SELECT 
        u.fc_username,
        u.fc_display_name,
        u.fc_pfp_url,
        u.fc_fid,
        u.referral_code,
        COUNT(r.id)::int AS referral_count,
        COALESCE(SUM(r.points_awarded), 0)::int AS xp_earned
      FROM users u
      LEFT JOIN referrals r ON r.referrer_user_id = u.id
      GROUP BY u.id, u.fc_username, u.fc_display_name, u.fc_pfp_url, u.fc_fid, u.referral_code
      HAVING COUNT(r.id) > 0
      ORDER BY COUNT(r.id) DESC, COALESCE(SUM(r.points_awarded), 0) DESC
      LIMIT 50
    `;

    return NextResponse.json(
      { leaderboard: rows },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' } }
    );
  } catch (e: any) {
    return NextResponse.json({ leaderboard: [], error: e.message }, { status: 500 });
  }
}
