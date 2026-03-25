import { NextResponse } from 'next/server';
import { verifyMessage } from 'viem';
import { z } from 'zod';
import { sql } from '@/lib/db';
import { requireCurrentUser } from '@/lib/auth';
import { getQuest } from '@/lib/quests';

const BodySchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  message: z.string().min(1, 'Message required'),
  signature: z.string().min(10, 'Invalid signature'),
});

export async function POST(req: Request) {
  let body;
  try { body = await req.json(); } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const parseResult = BodySchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json({ ok: false, error: parseResult.error.errors[0].message }, { status: 400 });
  }

  const { address, message, signature } = parseResult.data;

  const current = await requireCurrentUser();

  // Verify signature
  let valid = false;
  try {
    valid = await verifyMessage({
      address: address as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    });
  } catch (e) {
    console.error('[wallet] Signature verification error:', e);
  }

  if (!valid) {
    return NextResponse.json({ ok: false, error: 'Invalid signature' }, { status: 400 });
  }

  // Resolve userId — works for Farcaster (fid>0) and wallet/guest (fid=0, id from session)
  let userId: string;
  if (current.fid && current.fid > 0) {
    const userRows = await sql`SELECT id FROM users WHERE fc_fid = ${current.fid} LIMIT 1`;
    if (!userRows.length) return NextResponse.json({ ok: false, error: 'User not found' }, { status: 401 });
    userId = userRows[0].id;
  } else if (current.id) {
    userId = current.id;
  } else {
    return NextResponse.json({ ok: false, error: 'No user identity in session' }, { status: 401 });
  }

  const addressLower = address.toLowerCase();

  // Upsert wallet
  await sql`
    INSERT INTO wallets (user_id, address, chain, verified)
    VALUES (${userId}, ${addressLower}, 'base', true)
    ON CONFLICT (address) DO UPDATE SET
      user_id = EXCLUDED.user_id,
      verified = true
  `;

  // Update user's primary wallet address
  await sql`UPDATE users SET wallet_address = ${addressLower} WHERE id = ${userId}`;

  // Award wallet-link quest XP (only once)
  const walletQuest = getQuest('wallet-link');
  let totalPointsAwarded = 0;
  if (walletQuest) {
    const alreadyAwarded = await sql`SELECT 1 FROM quest_claims WHERE user_id = ${userId} AND quest_id = 'wallet-link' LIMIT 1`;
    if (!alreadyAwarded.length) {
      await sql`INSERT INTO quest_claims (user_id, quest_id, status, proof, points_awarded) VALUES (${userId}, 'wallet-link', 'verified', ${JSON.stringify({ address: addressLower })}::jsonb, ${walletQuest.points}) ON CONFLICT (user_id, quest_id) DO NOTHING`;
      await sql`UPDATE users SET points = COALESCE(points, 0) + ${walletQuest.points} WHERE id = ${userId}`;
      totalPointsAwarded += walletQuest.points;
    }
  }

  // Auto-verify HODL quests based on actual on-chain balance
  let autoHodlPoints = 0;
  try {
    const { createPublicClient, http } = await import('viem');
    const { base } = await import('viem/chains');
    const TACHI_CONTRACT = '0x39B4B879b8521d6A8C3a87cda64b969327b7fbA3';
    const alchemyKey = process.env.ALCHEMY_API_KEY || '_cJQ3B3yIO5msQ-IN-z239yz8V4WxZs6';
    const client = createPublicClient({ chain: base, transport: http(`https://base-mainnet.g.alchemy.com/v2/${alchemyKey}`) });
    const ERC20_ABI = [
      { inputs: [{ name: 'account', type: 'address' }], name: 'balanceOf', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
      { inputs: [], name: 'decimals', outputs: [{ name: '', type: 'uint8' }], stateMutability: 'view', type: 'function' },
    ] as const;
    const [rawBal, decimals] = await Promise.all([
      client.readContract({ address: TACHI_CONTRACT as `0x${string}`, abi: ERC20_ABI, functionName: 'balanceOf', args: [addressLower as `0x${string}`] }),
      client.readContract({ address: TACHI_CONTRACT as `0x${string}`, abi: ERC20_ABI, functionName: 'decimals' }),
    ]);
    const balance = Number(rawBal) / Math.pow(10, Number(decimals));
    const hodlTiers = [
      { id: 'hodl-100', min: 100, pts: 250 }, { id: 'hodl-1k', min: 1000, pts: 750 },
      { id: 'hodl-10k', min: 10000, pts: 1500 }, { id: 'hodl-100k', min: 100000, pts: 3000 },
      { id: 'hodl-1m', min: 1000000, pts: 10000 }, { id: 'hodl-10m', min: 10000000, pts: 25000 },
      { id: 'hodl-100m', min: 100000000, pts: 50000 }, { id: 'hodl-1b', min: 1000000000, pts: 100000 },
      { id: 'hodl-10b', min: 10000000000, pts: 250000 },
    ];
    for (const tier of hodlTiers) {
      if (balance >= tier.min) {
        const already = await sql`SELECT 1 FROM quest_claims WHERE user_id = ${userId} AND quest_id = ${tier.id} LIMIT 1`;
        if (!already.length) {
          await sql`INSERT INTO quest_claims (user_id, quest_id, status, proof, points_awarded) VALUES (${userId}, ${tier.id}, 'verified', ${JSON.stringify({ walletAddress: addressLower, balance })}::jsonb, ${tier.pts}) ON CONFLICT (user_id, quest_id) DO NOTHING`;
          autoHodlPoints += tier.pts;
        }
      }
    }
    if (autoHodlPoints > 0) {
      await sql`UPDATE users SET points = COALESCE(points, 0) + ${autoHodlPoints} WHERE id = ${userId}`;
    }
  } catch (e) { console.warn('[wallet/link] Auto-HODL check failed:', e); }

  return NextResponse.json({
    ok: true,
    questId: 'wallet-link',
    pointsAwarded: totalPointsAwarded + autoHodlPoints,
    walletAddress: addressLower,
  });
}
