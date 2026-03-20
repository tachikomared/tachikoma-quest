import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireCurrentUser, getFullUser } from '@/lib/auth';

export const revalidate = 30;

async function getStreakInfo(userId: string) {
  try {
    const dailyClaims = await sql`
      SELECT quest_id, verified_at, points_awarded
      FROM quest_claims
      WHERE user_id = ${userId} AND quest_id LIKE 'daily-checkin-%'
      ORDER BY verified_at DESC
    `;

    if (dailyClaims.length === 0) {
      return { streak: 0, completedToday: false };
    }

    const today = new Date().toISOString().split('T')[0];
    const completedToday = dailyClaims.some((c: any) => c.verified_at.toISOString().startsWith(today));

    let streak = 0;
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    for (let i = 0; i < dailyClaims.length; i++) {
      const claimDate = new Date(dailyClaims[i].verified_at);
      claimDate.setHours(0, 0, 0, 0);

      const expectedDate = new Date(now);
      expectedDate.setDate(expectedDate.getDate() - i);

      if (claimDate.getTime() === expectedDate.getTime()) {
        streak++;
      } else {
        break;
      }
    }

    return { streak, completedToday };
  } catch (e) {
    console.warn('[me] Streak calculation failed:', e);
    return { streak: 0, completedToday: false };
  }
}

export async function GET() {
  try {
    const current = await requireCurrentUser();
    const user = await getFullUser(current.fid, current.id);
    const { streak, completedToday } = await getStreakInfo(current.id);

    return NextResponse.json(
      { user: user ? { ...user, streak, completedToday } : null },
      { headers: { 'Cache-Control': 'private, s-maxage=30, stale-while-revalidate=60' } }
    );
  } catch (e: any) {
    console.error('[api/me] Error:', e.message);
    return NextResponse.json({ user: null, error: e.message }, { status: 500 });
  }
}
