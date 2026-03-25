import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireCurrentUser } from '@/lib/auth';
import { fetchCastWithViewer, verifyFarcasterFollow } from '@/lib/neynar';
import { getQuest } from '@/lib/quests';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

const TACHI_CONTRACT = '0x39B4B879b8521d6A8C3a87cda64b969327b7fbA3';
const alchemyKey = process.env.ALCHEMY_API_KEY || '_cJQ3B3yIO5msQ-IN-z239yz8V4WxZs6';
const publicClient = createPublicClient({ chain: base, transport: http(`https://base-mainnet.g.alchemy.com/v2/${alchemyKey}`) });

const ERC20_ABI = [
  { inputs: [{ name: 'account', type: 'address' }], name: 'balanceOf', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'decimals', outputs: [{ name: '', type: 'uint8' }], stateMutability: 'view', type: 'function' },
] as const;

async function awardReferralIfQualified(userId: string) {
  const walletRows = await sql`SELECT 1 FROM wallets WHERE user_id = ${userId} AND verified = true LIMIT 1`;
  const claimRows = await sql`SELECT 1 FROM quest_claims qc JOIN quests q ON q.id = qc.quest_id WHERE qc.user_id = ${userId} AND q.platform = 'farcaster' LIMIT 1`;
  if (!walletRows.length || !claimRows.length) return;
  const referee = await sql`SELECT id, referred_by_code FROM users WHERE id = ${userId} LIMIT 1`;
  if (!referee.length || !referee[0].referred_by_code) return;
  const referrer = await sql`SELECT id FROM users WHERE referral_code = ${referee[0].referred_by_code} LIMIT 1`;
  if (!referrer.length) return;
  const existing = await sql`SELECT 1 FROM referrals WHERE referee_user_id = ${userId} LIMIT 1`;
  if (existing.length) return;
  await sql`INSERT INTO referrals (referrer_user_id, referee_user_id, code, qualified_at, points_awarded) VALUES (${referrer[0].id}, ${userId}, ${referee[0].referred_by_code}, NOW(), 100)`;
  await sql`INSERT INTO quest_claims (user_id, quest_id, status, proof, points_awarded) VALUES (${referrer[0].id}, 'referral-qualified', 'verified', ${JSON.stringify({ refereeUserId: userId })}::jsonb, 100) ON CONFLICT DO NOTHING`;
}

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const current = await requireCurrentUser();
  const quest = getQuest(params.id);

  if (!quest || !quest.enabled) {
    return NextResponse.json({ verified: false, error: 'quest_not_found' }, { status: 404 });
  }

  if (quest.platform === 'x') {
    return NextResponse.json({ verified: false, error: 'unsupported_verification_type' }, { status: 400 });
  }

  // Resolve userId — works for both Farcaster (fid>0) and wallet/guest (fid=0)
  let userId: string;
  if (current.fid && current.fid > 0) {
    const userRows = await sql`SELECT id FROM users WHERE fc_fid = ${current.fid} LIMIT 1`;
    if (!userRows.length) return NextResponse.json({ verified: false, error: 'user_not_found' }, { status: 401 });
    userId = userRows[0].id;
  } else {
    // wallet/guest user — id is directly in session
    userId = current.id;
  }

  // Check already completed
  const existing = await sql`SELECT id FROM quest_claims WHERE user_id = ${userId} AND quest_id = ${quest.id}`;
  if (existing.length && !quest.repeatable) {
    return NextResponse.json({ verified: true, questId: quest.id, pointsAwarded: 0, alreadyCompleted: true });
  }

  // wallet_signature is handled by /api/wallet/link
  if (quest.verification === 'wallet_signature') {
    return NextResponse.json({ verified: false, error: 'use_wallet_link_endpoint' }, { status: 400 });
  }

  let verified = false;
  let proof: Record<string, unknown> = {};

  // HODL / wallet_balance — check token balance against linked wallet
  if (quest.verification === 'wallet_balance') {
    const walletRows = await sql`
      SELECT address FROM wallets WHERE user_id = ${userId} AND verified = true LIMIT 1
    `;
    if (!walletRows.length) {
      return NextResponse.json({ verified: false, error: 'no_wallet_linked', balance: '0' }, { status: 409 });
    }
    const walletAddress = walletRows[0].address as `0x${string}`;
    try {
      const [rawBalance, decimals] = await Promise.all([
        publicClient.readContract({ address: TACHI_CONTRACT as `0x${string}`, abi: ERC20_ABI, functionName: 'balanceOf', args: [walletAddress] }),
        publicClient.readContract({ address: TACHI_CONTRACT as `0x${string}`, abi: ERC20_ABI, functionName: 'decimals' }),
      ]);
      const balance = Number(rawBalance) / Math.pow(10, Number(decimals));
      const minRequired = (quest.target as any)?.min || 0;
      verified = balance >= minRequired;
      proof = { walletAddress, balance, minRequired, verified };
      if (!verified) {
        return NextResponse.json({ verified: false, error: 'insufficient_balance', balance: balance.toString() }, { status: 409 });
      }
    } catch (e: any) {
      return NextResponse.json({ verified: false, error: 'rpc_error', details: e.message }, { status: 500 });
    }
  }

  // Farcaster follow
  if (quest.verification === 'fc_follow_user') {
    if (!current.fid || current.fid === 0) return NextResponse.json({ verified: false, error: 'farcaster_required' }, { status: 401 });
    const targetFid = (quest.target as any).targetFid;
    if (!targetFid) return NextResponse.json({ verified: false, error: 'missing_target_fid' }, { status: 400 });
    verified = await verifyFarcasterFollow(current.fid, targetFid);
    proof = { targetFid, viewerFid: current.fid, verified };
  }

  // Farcaster cast viewer context (recast / like)
  if (quest.verification === 'fc_cast_viewer_context') {
    if (!current.fid || current.fid === 0) return NextResponse.json({ verified: false, error: 'farcaster_required' }, { status: 401 });
    const target = quest.target as any;
    const identifier = target.castHash || target.castUrl;
    if (!identifier) return NextResponse.json({ verified: false, error: 'missing_cast_identifier' }, { status: 400 });
    const type = target.castHash ? 'hash' : 'url';
    const cast = await fetchCastWithViewer(identifier, type, current.fid);
    if (quest.action === 'recast_cast') verified = Boolean(cast?.viewer_context?.recasted);
    else if (quest.action === 'like_cast') verified = Boolean(cast?.viewer_context?.liked);
    proof = { identifier, type, viewerFid: current.fid, viewerContext: cast?.viewer_context ?? null, verified };
  }

  // Daily check-in (once per 24h) — stored as 'daily-checkin-YYYY-MM-DD'
  if (quest.verification === 'daily_checkin') {
    const lastClaim = await sql`
      SELECT created_at FROM quest_claims
      WHERE user_id = ${userId} AND quest_id LIKE 'daily-checkin-%'
      ORDER BY created_at DESC LIMIT 1
    `;
    if (lastClaim.length) {
      const lastTime = new Date(lastClaim[0].created_at).getTime();
      const hoursSince = (Date.now() - lastTime) / 3600000;
      if (hoursSince < 24) {
        return NextResponse.json({ verified: false, error: 'cooldown_active', hoursRemaining: (24 - hoursSince).toFixed(1) }, { status: 409 });
      }
    }
    // Use today's date as unique quest_id so UNIQUE constraint works per-day
    const today = new Date().toISOString().slice(0, 10);
    (quest as any)._dailyQuestId = `daily-checkin-${today}`;
    verified = true;
    proof = { checkedInAt: new Date().toISOString() };
  }

  if (!verified) {
    return NextResponse.json({ verified: false, error: 'not_completed' }, { status: 409 });
  }

  // Award points
  const claimQuestId = (quest as any)._dailyQuestId || quest.id;
  await sql`
    INSERT INTO quest_claims (user_id, quest_id, status, proof, points_awarded)
    VALUES (${userId}, ${claimQuestId}, 'verified', ${JSON.stringify(proof)}::jsonb, ${quest.points})
    ON CONFLICT (user_id, quest_id) DO NOTHING
  `;
  // Update user points total
  await sql`UPDATE users SET points = COALESCE(points, 0) + ${quest.points} WHERE id = ${userId}`;

  await awardReferralIfQualified(userId);

  return NextResponse.json({ verified: true, questId: quest.id, pointsAwarded: quest.points });
}
