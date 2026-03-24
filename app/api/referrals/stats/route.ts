export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireCurrentUser } from '@/lib/auth';

export const revalidate = 60;

export async function GET() {
  try {
    const current = await requireCurrentUser();

    const userRows = current.fid === 0
      ? await sql`SELECT id, referral_code FROM users WHERE id = ${current.id} LIMIT 1`
      : await sql`SELECT id, referral_code FROM users WHERE fc_fid = ${current.fid} LIMIT 1`;

    if (!userRows.length) {
      return NextResponse.json({ enlisted: 0, active: 0, xpEarned: 0, recruits: [] });
    }

    const userId = userRows[0].id;
    const referralCode = userRows[0].referral_code;

    const enlistedRows = await sql`
      SELECT COUNT(*)::int AS count
      FROM users
      WHERE referred_by_code = ${referralCode}
    `;

    const activeRows = await sql`
      SELECT COUNT(*)::int AS count, COALESCE(SUM(points_awarded), 0)::int AS xp
      FROM referrals
      WHERE referrer_user_id = ${userId}
    `;

    const recruits = await sql`
      SELECT u.id, u.fc_username, u.fc_fid, u.created_at
      FROM users u
      WHERE u.referred_by_code = ${referralCode}
      ORDER BY u.created_at DESC
      LIMIT 20
    `;

    return NextResponse.json(
      {
        enlisted: enlistedRows[0]?.count || 0,
        active: activeRows[0]?.count || 0,
        xpEarned: activeRows[0]?.xp || 0,
        recruits,
      },
      { headers: { 'Cache-Control': 'private, s-maxage=60, stale-while-revalidate=120' } }
    );
  } catch (e: any) {
    console.error('[referrals/stats] Error:', e.message);
    return NextResponse.json({ enlisted: 0, active: 0, xpEarned: 0, error: e.message }, { status: 500 });
  }
}
