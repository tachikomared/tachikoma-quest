import { NextResponse } from 'next/server';
import { createPublicClient, http, keccak256, toBytes } from 'viem';
import { base } from 'viem/chains';
import { sql } from '@/lib/db';

const TACHI_CONTRACT = '0x39B4B879b8521d6A8C3a87cda64b969327b7fbA3';
const BLOCKSCOUT_HOLDERS_URL = `https://base.blockscout.com/api/v2/tokens/${TACHI_CONTRACT}/holders`;
const DEXSCREENER_URL = `https://api.dexscreener.com/latest/dex/tokens/${TACHI_CONTRACT}`;
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

export const revalidate = 300;

function formatBalance(raw: string) {
  const value = Number(raw) / Math.pow(10, DECIMALS);
  return value.toFixed(2);
}

// Simple namehash implementation for reverse records
function namehash(name: string): `0x${string}` {
  let node = '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`;
  if (name) {
    const labels = name.split('.');
    for (let i = labels.length - 1; i >= 0; i--) {
      node = keccak256(toBytes(node + keccak256(toBytes(labels[i])).slice(2)));
    }
  }
  return node;
}

// Fetch TACHI price from DexScreener
async function getTachiPrice(): Promise<number> {
  try {
    const res = await fetch(DEXSCREENER_URL, { next: { revalidate: 60 } });
    if (!res.ok) return 0;
    const data = await res.json();
    const pair = data?.pairs?.[0];
    return pair?.priceUsd ? Number(pair.priceUsd) : 0;
  } catch {
    return 0;
  }
}

// Reverse resolve address to .base.eth name
async function resolveBaseENS(address: string): Promise<string | null> {
  try {
    // Proper reverse node: address.addr.reverse
    const reverseName = `${address.toLowerCase().slice(2)}.addr.reverse`;
    const node = namehash(reverseName);
    
    // Get resolver from registry
    const resolverAddr = await publicClient.readContract({
      address: BASE_ENS_REGISTRY as `0x${string}`,
      abi: ENS_REGISTRY_ABI,
      functionName: 'resolver',
      args: [node],
    });
    
    if (!resolverAddr || resolverAddr === '0x0000000000000000000000000000000000000000') {
      return null;
    }
    
    // Get name from resolver
    const name = await publicClient.readContract({
      address: resolverAddr,
      abi: ENS_RESOLVER_ABI,
      functionName: 'name',
      args: [node],
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
      // Burn address
      '0x0000000000000000000000000000000000000000',
      // Null address
      '0x0000000000000000000000000000000000000001',
    ]);

    const filtered = items.filter((item: any) => {
      const address = item.address?.hash?.toLowerCase();
      return address && !excluded.has(address) && Number(item.value || '0') > 0;
    });

    // Fetch TACHI price
    const tachiPrice = await getTachiPrice();

    // Verify live onchain balance for top Blockscout candidates and sort by live balance
    const verified = await Promise.all(
      filtered.slice(0, 50).map(async (item: any) => {
        const address = item.address?.hash as `0x${string}`;
        try {
          const liveBalance = await publicClient.readContract({
            address: TACHI_CONTRACT as `0x${string}`,
            abi: [{ name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] }],
            functionName: 'balanceOf',
            args: [address],
          });
          return { ...item, liveBalance };
        } catch {
          return { ...item, liveBalance: 0n };
        }
      })
    );

    const sorted = verified
      .filter((x) => Number(x.liveBalance) > 0)
      .sort((a, b) => Number(b.liveBalance) - Number(a.liveBalance))
      .slice(0, 20);

    // Resolve Base ENS names for top holders
    const holders = await Promise.all(
      sorted.map(async (item: any, index: number) => {
        const address = item.address?.hash;
        const linkedUser = linkedMap.get(address?.toLowerCase());
        const balanceTokens = Number(item.liveBalance || '0') / Math.pow(10, DECIMALS);
        
        // Try to get .base.eth name if no ENS from Blockscout
        let baseEns = item.address?.ens_domain_name;
        if (!baseEns && address) {
          baseEns = await resolveBaseENS(address);
        }

        return {
          rank: index + 1,
          address,
          ens: baseEns || item.address?.ens_domain_name || null,
          balance: balanceTokens.toFixed(2),
          balanceUsd: tachiPrice > 0 ? (balanceTokens * tachiPrice).toFixed(2) : null,
          rawBalance: item.liveBalance?.toString() || item.value || '0',
          fid: linkedUser?.fc_fid || null,
          username: linkedUser?.fc_username || null,
          displayName: linkedUser?.fc_display_name || null,
          pfpUrl: linkedUser?.fc_pfp_url || null,
          xp: linkedUser?.points || 0,
        };
      }).filter((x: any) => Number(x.rawBalance || '0') > 0)
    );

    return NextResponse.json(
      {
        holders,
        totalHolders: data?.total || holders.length,
        priceUsd: tachiPrice,
      },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } }
    );
  } catch (e: any) {
    console.error('[token/holders] Error:', e);
    return NextResponse.json(
      { error: e.message || 'Failed to fetch holders' },
      { status: 500 }
    );
  }
}
