export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const revalidate = 60;

// Get community burn leaderboard
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get top burners
    const leaders = await sql`
      SELECT 
        cb.user_id,
        u.fc_username as username,
        u.fc_fid,
        SUM(cb.amount) as total_burned,
        COUNT(cb.id) as burn_count,
        MAX(cb.created_at) as last_burn
      FROM community_burns cb
      JOIN users u ON cb.user_id = u.id
      GROUP BY cb.user_id, u.fc_username, u.fc_fid
      ORDER BY total_burned DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    // Get user's total stats
    const totals = await sql`
      SELECT 
        COUNT(DISTINCT user_id) as total_burners,
        COALESCE(SUM(amount), 0) as total_burned
      FROM community_burns
    `;

    // Format results with tier badges
    const formatted = leaders.map((row, index) => ({
      rank: offset + index + 1,
      userId: row.user_id,
      username: row.username || `pilot_${row.user_id.toString().slice(0, 6)}`,
      fid: row.fc_fid,
      totalBurned: row.total_burned.toString(),
      burnCount: parseInt(row.burn_count),
      lastBurn: row.last_burn,
      tier: calculateTier(row.total_burned),
      tierName: getTierName(calculateTier(row.total_burned)),
    }));

    return NextResponse.json(
      {
        ok: true,
        leaderboard: formatted,
        stats: {
          totalBurners: parseInt(totals[0]?.total_burners || '0'),
          totalBurned: totals[0]?.total_burned.toString() || '0',
        },
      },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } }
    );
  } catch (err) {
    console.error('Burn leaderboard error:', err);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}

function calculateTier(totalBurned: string | bigint): number {
  const amount = typeof totalBurned === 'string' ? BigInt(totalBurned) : totalBurned;
  const tiers = [
    10000000000000000000000n,   // 10K
    100000000000000000000000n,  // 100K
    1000000000000000000000000n, // 1M
    1000000000000000000000000000n, // 1B
  ];
  
  for (let i = tiers.length - 1; i >= 0; i--) {
    if (amount >= tiers[i]) return i + 1;
  }
  return 0;
}

function getTierName(tier: number): string {
  const names = ['Cadet', 'Bronze', 'Silver', 'Gold', 'Diamond'];
  return names[tier] || 'Cadet';
}
