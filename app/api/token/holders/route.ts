import { NextResponse } from 'next/server';
import { createPublicClient, http, formatEther } from 'viem';
import { base } from 'viem/chains';
import { sql } from '@/lib/db';

const TACHI_CONTRACT = '0x39B4B879b8521d6A8C3a87cda64b969327b7fbA3';

const ERC20_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

const publicClient = createPublicClient({
  chain: base,
  transport: http(),
});

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get all users with linked wallets
    const users = await sql`
      SELECT 
        u.id,
        u.fc_fid,
        u.fc_username,
        u.fc_display_name,
        u.fc_pfp_url,
        u.wallet_address,
        COALESCE(SUM(qc.points_awarded), 0)::int as points
      FROM users u
      LEFT JOIN quest_claims qc ON qc.user_id = u.id
      WHERE u.wallet_address IS NOT NULL
      GROUP BY u.id, u.fc_fid, u.fc_username, u.fc_display_name, u.fc_pfp_url, u.wallet_address
    `;

    // Get token decimals
    const decimals = await publicClient.readContract({
      address: TACHI_CONTRACT as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'decimals',
    });

    // Fetch balances for all users
    const holders = await Promise.all(
      users.map(async (user: any) => {
        try {
          const balance = await publicClient.readContract({
            address: TACHI_CONTRACT as `0x${string}`,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [user.wallet_address as `0x${string}`],
          });

          const formattedBalance = Number(balance) / Math.pow(10, decimals);

          return {
            fid: user.fc_fid,
            username: user.fc_username,
            displayName: user.fc_display_name,
            pfpUrl: user.fc_pfp_url,
            walletAddress: user.wallet_address,
            balance: formattedBalance.toFixed(4),
            rawBalance: balance.toString(),
            xp: user.points,
          };
        } catch (e) {
          return null;
        }
      })
    );

    // Filter out nulls and sort by balance
    const sortedHolders = holders
      .filter((h): h is NonNullable<typeof h> => h !== null && Number(h.balance) > 0)
      .sort((a, b) => Number(b.balance) - Number(a.balance))
      .slice(0, 20);

    return NextResponse.json({
      holders: sortedHolders,
      totalHolders: sortedHolders.length,
    });
  } catch (e: any) {
    console.error('[token/holders] Error:', e);
    return NextResponse.json(
      { error: e.message || 'Failed to fetch holders' },
      { status: 500 }
    );
  }
}
