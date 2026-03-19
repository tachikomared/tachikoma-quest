import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireCurrentUser, getFullUser } from '@/lib/auth';

export const revalidate = 30;

async function getStreakInfo(userId: string) {
  try {
    // Get all daily check-ins ordered by date
    const dailyClaims = await sql`
      SELECT quest_id, verified_at, points_awarded
      FROM quest_claims
      WHERE user_id = ${userId} AND quest_id LIKE 'daily-checkin-%'
      ORDER BY verified_at DESC
    `;

    if (dailyClaims.length === 0) {
      return { streak: 0, completedToday: false };
    }

    // Check if completed today
    const today = new Date().toISOString().split('T')[0];
    const completedToday = dailyClaims.some((c: any) =>
      c.verified_at.toISOString().startsWith(today)
    );

    // Calculate streak
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
      } else if (i === 0 && !completedToday) {
        // Check if yesterday was completed (streak still alive)
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        if (claimDate.getTime() === yesterday.getTime()) {
          streak++;
        } else {
          break;
        }
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

    // Get streak info
    const { streak, completedToday } = await getStreakInfo(current.id);

    const userWithStreak = user ? { ...user, streak, completedToday } : null;

    console.log('[api/me] Returning user:', user?.fcFid, 'guest:', user?.fcFid === 0, 'streak:', streak);
    return NextResponse.json(
      { user: userWithStreak },
      { headers: { 'Cache-Control': 'private, s-maxage=30, stale-while-revalidate=60' } }
    );
  } catch (e: any) {
    console.error('[api/me] Error:', e.message);
    return NextResponse.json({ user: null, error: e.message }, { status: 500 });
  }
}
