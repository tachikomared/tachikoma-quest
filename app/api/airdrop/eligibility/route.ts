export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get('address');
    
    if (!address) {
      return NextResponse.json({ error: 'Address required' }, { status: 400 });
    }

    // Example logic: Check if user has TACHI, has claimed at least 1 quest, and is a member of the community
    const [stats] = await sql`
      SELECT 
        u.id,
        (SELECT COUNT(*) FROM quest_claims WHERE user_id = u.id) as quest_count,
        (SELECT SUM(points_awarded) FROM quest_claims WHERE user_id = u.id) as total_points
      FROM users u
      JOIN wallets w ON w.user_id = u.id
      WHERE w.address = ${address.toLowerCase()}
      LIMIT 1
    `;

    const isEligible = stats && stats.quest_count > 0;
    
    return NextResponse.json({
      address,
      eligible: isEligible,
      reason: isEligible ? 'Quest participation detected' : 'Not enough activity',
      details: {
        questsCompleted: stats?.quest_count || 0,
        points: stats?.total_points || 0
      }
    });
  } catch (e: any) {
    return NextResponse.json({ error: 'Failed to check eligibility' }, { status: 500 });
  }
}
