import { NextResponse } from 'next/server';
import { createPublicClient, http, formatEther } from 'viem';
import { base } from 'viem/chains';
import { requireCurrentUser } from '@/lib/auth';

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
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Use Alchemy RPC for reliable data
const alchemyKey = process.env.ALCHEMY_API_KEY || '_cJQ3B3yIO5msQ-IN-z239yz8V4WxZs6';

const publicClient = createPublicClient({
  chain: base,
  transport: http(`https://base-mainnet.g.alchemy.com/v2/${alchemyKey}`),
});

export async function GET(req: Request) {
  try {
    const current = await requireCurrentUser();
    
    // Get user's wallet from DB
    const { sql } = await import('@/lib/db');
    const rows = current.fid === 0
      ? await sql`
          SELECT w.address AS wallet_address
          FROM wallets w
          WHERE w.user_id = ${current.id} AND w.verified = true
          LIMIT 1
        `
      : await sql`
          SELECT w.address AS wallet_address
          FROM wallets w
          JOIN users u ON u.id = w.user_id
          WHERE u.fc_fid = ${current.fid} AND w.verified = true
          LIMIT 1
        `;
    
    const walletAddress = rows[0]?.wallet_address;
    
    if (!walletAddress) {
      return NextResponse.json({
        balance: '0',
        formattedBalance: '0',
        hasTokens: false,
        walletLinked: false,
      });
    }

    // Get token balance
    const balance = await publicClient.readContract({
      address: TACHI_CONTRACT as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [walletAddress as `0x${string}`],
    });

    // Get token info
    const [decimals, symbol, totalSupply] = await Promise.all([
      publicClient.readContract({
        address: TACHI_CONTRACT as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'decimals',
      }),
      publicClient.readContract({
        address: TACHI_CONTRACT as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'symbol',
      }),
      publicClient.readContract({
        address: TACHI_CONTRACT as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'totalSupply',
      }),
    ]);

    const formattedBalance = Number(balance) / Math.pow(10, decimals);

    return NextResponse.json({
      balance: balance.toString(),
      formattedBalance: formattedBalance.toFixed(4),
      hasTokens: formattedBalance > 0,
      walletLinked: true,
      walletAddress,
      tokenInfo: {
        symbol,
        decimals,
        totalSupply: formatEther(totalSupply),
        contractAddress: TACHI_CONTRACT,
      },
    });
  } catch (e: any) {
    console.error('[token/balance] Error:', e);
    return NextResponse.json(
      { error: e.message || 'Failed to fetch balance' },
      { status: 500 }
    );
  }
}
