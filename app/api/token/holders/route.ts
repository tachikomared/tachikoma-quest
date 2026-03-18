import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

const TACHI_CONTRACT = '0x39B4B879b8521d6A8C3a87cda64b969327b7fbA3';
const BLOCKSCOUT_HOLDERS_URL = `https://base.blockscout.com/api/v2/tokens/${TACHI_CONTRACT}/holders`;
const DECIMALS = 18;

export const dynamic = 'force-dynamic';

function formatBalance(raw: string) {
  const value = Number(raw) / Math.pow(10, DECIMALS);
  return value.toFixed(4);
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

    const holders = items.slice(0, 20).map((item: any, index: number) => {
      const address = item.address?.hash;
      const linkedUser = linkedMap.get(address?.toLowerCase());

      return {
        rank: index + 1,
        address,
        balance: formatBalance(item.value || '0'),
        rawBalance: item.value || '0',
        fid: linkedUser?.fc_fid || null,
        username: linkedUser?.fc_username || null,
        displayName: linkedUser?.fc_display_name || null,
        pfpUrl: linkedUser?.fc_pfp_url || null,
        xp: linkedUser?.points || 0,
      };
    });

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
