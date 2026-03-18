import { NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import { sql } from '@/lib/db';

const TACHI_CONTRACT = '0x39B4B879b8521d6A8C3a87cda64b969327b7fbA3';
const BLOCKSCOUT_HOLDERS_URL = `https://base.blockscout.com/api/v2/tokens/${TACHI_CONTRACT}/holders`;
const DECIMALS = 18;

// Base ENS Registry for .base.eth names
const BASE_ENS_REGISTRY = '0x5B241b04234a9f7e16eF32CD559Ab930799f6E8B';

const alchemyKey = process.env.ALCHEMY_API_KEY || '_cJQ3B3yIO5msQ-IN-z239yz8V4WxZs6';

const publicClient = createPublicClient({
  chain: base,
  transport: http(`https://base-mainnet.g.alchemy.com/v2/${alchemyKey}`),
});

const ENS_REGISTRY_ABI = [
  {
    inputs: [{ name: 'node', type: 'bytes32' }],
    name: 'resolver',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

const ENS_RESOLVER_ABI = [
  {
    inputs: [{ name: 'node', type: 'bytes32' }],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export const dynamic = 'force-dynamic';

function formatBalance(raw: string) {
  const value = Number(raw) / Math.pow(10, DECIMALS);
  return value.toFixed(4);
}

// Reverse resolve address to .base.eth name
async function resolveBaseENS(address: string): Promise<string | null> {
  try {
    // Convert address to reverse node
    const reverseName = `${address.toLowerCase().slice(2)}.addr.reverse`;
    const node = `0x${Buffer.from(reverseName).toString('hex')}`;
    
    // Get resolver from registry
    const resolverAddr = await publicClient.readContract({
      address: BASE_ENS_REGISTRY as `0x${string}`,
      abi: ENS_REGISTRY_ABI,
      functionName: 'resolver',
      args: [node as `0x${string}`],
    });
    
    if (!resolverAddr || resolverAddr === '0x0000000000000000000000000000000000000000') {
      return null;
    }
    
    // Get name from resolver
    const name = await publicClient.readContract({
      address: resolverAddr,
      abi: ENS_RESOLVER_ABI,
      functionName: 'name',
      args: [node as `0x${string}`],
    });
    
    return name || null;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    // Pull top holders from Blockscout (all token holders)
    const res = await fetch(BLOCKSCOUT_HOLDERS_URL, {
      headers: { 'Accept': 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`Blockscout error: ${res.status}`);
    }

    const data = await res.json();
    const items = data?.items || [];

    // Map address -> user info (if linked)
    const linked = await sql`
      SELECT 
        u.fc_fid,
        u.fc_username,
        u.fc_display_name,
        u.fc_pfp_url,
        w.address AS wallet_address,
        COALESCE(SUM(qc.points_awarded), 0)::int as points
      FROM users u
      JOIN wallets w ON w.user_id = u.id AND w.verified = true
      LEFT JOIN quest_claims qc ON qc.user_id = u.id
      GROUP BY u.id, u.fc_fid, u.fc_username, u.fc_display_name, u.fc_pfp_url, w.address
    `;

    const linkedMap = new Map(
      linked.map((u: any) => [u.wallet_address?.toLowerCase(), u])
    );

    const excluded = new Set([
      // Uniswap V4 Pool Manager (not a user holder)
      '0x498581ff718922c3f8e6a244956af099b2652b2b',
    ]);

    const filtered = items.filter((item: any) => {
      const address = item.address?.hash?.toLowerCase();
      return address && !excluded.has(address);
    });

    // Resolve Base ENS names for top holders
    const holders = await Promise.all(
      filtered.slice(0, 20).map(async (item: any, index: number) => {
        const address = item.address?.hash;
        const linkedUser = linkedMap.get(address?.toLowerCase());
        
        // Try to get .base.eth name if no ENS from Blockscout
        let baseEns = item.address?.ens_domain_name;
        if (!baseEns && address) {
          baseEns = await resolveBaseENS(address);
        }

        return {
          rank: index + 1,
          address,
          ens: baseEns || item.address?.ens_domain_name || null,
          balance: formatBalance(item.value || '0'),
          rawBalance: item.value || '0',
          fid: linkedUser?.fc_fid || null,
          username: linkedUser?.fc_username || null,
          displayName: linkedUser?.fc_display_name || null,
          pfpUrl: linkedUser?.fc_pfp_url || null,
          xp: linkedUser?.points || 0,
        };
      })
    );

    return NextResponse.json({
      holders,
      totalHolders: data?.total || holders.length,
    });
  } catch (e: any) {
    console.error('[token/holders] Error:', e);
    return NextResponse.json(
      { error: e.message || 'Failed to fetch holders' },
      { status: 500 }
    );
  }
}
