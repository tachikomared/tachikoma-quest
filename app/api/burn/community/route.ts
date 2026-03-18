import { NextResponse } from 'next/server';
import { requireCurrentUser } from '@/lib/auth';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Community Burner contract address (to be set after deployment)
const COMMUNITY_BURNER = process.env.COMMUNITY_BURNER_ADDRESS || '0x0000000000000000000000000000000000000000';

// ABI for CommunityBurner
const BURNER_ABI = [
  {
    "inputs": [{ "internalType": "uint256", "name": "amount", "type": "uint256" }],
    "name": "burn",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "user", "type": "address" }],
    "name": "getStats",
    "outputs": [
      { "internalType": "uint256", "name": "burned", "type": "uint256" },
      { "internalType": "uint256", "name": "tier", "type": "uint256" },
      { "internalType": "uint256", "name": "nextTierAmount", "type": "uint256" },
      { "internalType": "uint256", "name": "globalRank", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "user", "type": "address" }],
    "name": "getTierName",
    "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalCommunityBurned",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalBurners",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
];

// Get user's burn stats
export async function GET(req: Request) {
  try {
    const user = await requireCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get wallet address
    const wallet = await sql`
      SELECT address FROM wallets 
      WHERE user_id = ${user.id} 
      ORDER BY verified DESC, created_at DESC 
      LIMIT 1
    `;

    if (!wallet.length) {
      return NextResponse.json({ ok: false, error: 'No wallet found' }, { status: 400 });
    }

    const address = wallet[0].address;

    // Get burn history from our DB
    const burns = await sql`
      SELECT 
        COALESCE(SUM(amount), 0) as total_burned,
        COUNT(*) as burn_count,
        MAX(created_at) as last_burn
      FROM community_burns 
      WHERE user_id = ${user.id}
    `;

    // Get leaderboard position
    const rank = await sql`
      SELECT COUNT(*) + 1 as rank
      FROM (
        SELECT user_id, SUM(amount) as total
        FROM community_burns
        GROUP BY user_id
        HAVING SUM(amount) > ${burns[0]?.total_burned || 0}
      ) ranked
    `;

    // Get total community stats
    const totals = await sql`
      SELECT 
        COALESCE(SUM(amount), 0) as total_community_burned,
        COUNT(DISTINCT user_id) as total_burners
      FROM community_burns
    `;

    return NextResponse.json({
      ok: true,
      stats: {
        userTotal: burns[0]?.total_burned || '0',
        burnCount: parseInt(burns[0]?.burn_count || '0'),
        lastBurn: burns[0]?.last_burn,
        rank: parseInt(rank[0]?.rank || '0'),
        tier: calculateTier(burns[0]?.total_burned || '0'),
        nextTier: getNextTierAmount(burns[0]?.total_burned || '0'),
      },
      community: {
        totalBurned: totals[0]?.total_community_burned || '0',
        totalBurners: parseInt(totals[0]?.total_burners || '0'),
      },
      contract: {
        address: COMMUNITY_BURNER,
        abi: BURNER_ABI,
      }
    });
  } catch (err) {
    console.error('Burn stats error:', err);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}

// Record a burn (called after on-chain burn is confirmed)
export async function POST(req: Request) {
  try {
    const user = await requireCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { txHash, amount } = await req.json();

    if (!txHash || !amount) {
      return NextResponse.json({ ok: false, error: 'Missing txHash or amount' }, { status: 400 });
    }

    // Check for duplicate
    const existing = await sql`
      SELECT 1 FROM community_burns WHERE tx_hash = ${txHash} LIMIT 1
    `;
    if (existing.length) {
      return NextResponse.json({ ok: false, error: 'Already recorded' }, { status: 409 });
    }

    // Record the burn
    await sql`
      INSERT INTO community_burns (user_id, tx_hash, amount, created_at)
      VALUES (${user.id}, ${txHash}, ${amount}, NOW())
    `;

    return NextResponse.json({ ok: true, message: 'Burn recorded' });
  } catch (err) {
    console.error('Burn record error:', err);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}

function calculateTier(totalBurned: string): number {
  const amount = BigInt(totalBurned);
  const tiers = [
    BigInt(10000000000000000000000n),   // 10K
    BigInt(100000000000000000000000n),  // 100K
    BigInt(1000000000000000000000000n), // 1M
    BigInt(1000000000000000000000000000n), // 1B
  ];
  
  for (let i = tiers.length - 1; i >= 0; i--) {
    if (amount >= tiers[i]) return i + 1;
  }
  return 0;
}

function getNextTierAmount(totalBurned: string): string | null {
  const amount = BigInt(totalBurned);
  const tiers = [
    BigInt(10000000000000000000000n),   // 10K
    BigInt(100000000000000000000000n),  // 100K
    BigInt(1000000000000000000000000n), // 1M
    BigInt(1000000000000000000000000000n), // 1B
  ];
  
  for (const tier of tiers) {
    if (amount < tier) return tier.toString();
  }
  return null;
}
