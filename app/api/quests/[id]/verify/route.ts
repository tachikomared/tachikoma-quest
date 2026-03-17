import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireCurrentUser } from '@/lib/auth';
import { fetchCastWithViewer, verifyFarcasterFollow } from '@/lib/neynar';
import { getQuest } from '@/lib/quests';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

async function withRetry<T>(fn: () => Promise<T>, attempts = 6, delayMs = 1500): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      if (i < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * (i + 1)));
      }
    }
  }
  throw lastError;
}

const TACHI_CONTRACT = '0x39B4B879b8521d6A8C3a87cda64b969327b7fbA3';

const ERC20_BALANCE_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
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

async function awardReferralIfQualified(userId: string) {
  // Check if user has wallet and at least one Farcaster quest
  const walletRows = await sql`
    SELECT 1 FROM wallets WHERE user_id = ${userId} AND verified = true LIMIT 1
  `;
  
  const claimRows = await sql`
    SELECT 1
    FROM quest_claims qc
    JOIN quests q ON q.id = qc.quest_id
    WHERE qc.user_id = ${userId}
      AND q.platform = 'farcaster'
    LIMIT 1
  `;

  if (!walletRows.length || !claimRows.length) return;

  // Get referee info
  const referee = await sql`
    SELECT id, referred_by_code
    FROM users
    WHERE id = ${userId}
    LIMIT 1
  `;

  if (!referee.length || !referee[0].referred_by_code) return;

  // Get referrer
  const referrer = await sql`
    SELECT id
    FROM users
    WHERE referral_code = ${referee[0].referred_by_code}
    LIMIT 1
  `;

  if (!referrer.length) return;

  // Check if referral already exists
  const existing = await sql`
    SELECT 1 FROM referrals WHERE referee_user_id = ${userId} LIMIT 1
  `;
  
  if (existing.length) return;

  // Create qualified referral
  await sql`
    INSERT INTO referrals (referrer_user_id, referee_user_id, code, qualified_at, points_awarded)
    VALUES (${referrer[0].id}, ${userId}, ${referee[0].referred_by_code}, NOW(), 100)
  `;

  // Award referrer points
  await sql`
    INSERT INTO quest_claims (user_id, quest_id, status, proof, points_awarded)
    VALUES (${referrer[0].id}, 'referral-qualified', 'verified', ${JSON.stringify({ refereeUserId: userId })}::jsonb, 100)
    ON CONFLICT DO NOTHING
  `;
}

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const current = await requireCurrentUser();
  const quest = getQuest(params.id);

  if (!quest || !quest.enabled) {
    return NextResponse.json(
      { verified: false, error: 'quest_not_found' },
      { status: 404 }
    );
  }

  // Reject unsupported verification types
  if (quest.verification === 'wallet_signature' || quest.platform === 'x') {
    return NextResponse.json(
      { verified: false, error: 'unsupported_verification_type' },
      { status: 400 }
    );
  }

  // Get user ID
  const userRows = await sql`
    SELECT id FROM users WHERE fc_fid = ${current.fid} LIMIT 1
  `;

  if (!userRows.length) {
    return NextResponse.json(
      { verified: false, error: 'user_not_found' },
      { status: 401 }
    );
  }

  const userId = userRows[0].id;

  // Check if already completed
  const existing = await sql`
    SELECT id FROM quest_claims WHERE user_id = ${userId} AND quest_id = ${quest.id}
  `;

  if (existing.length && !quest.repeatable) {
    return NextResponse.json({
      verified: true,
      questId: quest.id,
      pointsAwarded: 0,
      alreadyCompleted: true,
    });
  }

  // Perform verification
  let verified = false;
  let proof: Record<string, unknown> = {};

  if (quest.verification === 'fc_follow_user') {
    const targetFid = quest.target.targetFid;
    if (!targetFid) {
      return NextResponse.json(
        { verified: false, error: 'missing_target_fid' },
        { status: 400 }
      );
    }
    verified = await withRetry(() => verifyFarcasterFollow(current.fid, targetFid));
    proof = { targetFid, viewerFid: current.fid, verified };
  }

  if (quest.verification === 'fc_cast_viewer_context') {
    const identifier = quest.target.castHash || quest.target.castUrl;
    if (!identifier) {
      return NextResponse.json(
        { verified: false, error: 'missing_cast_identifier' },
        { status: 400 }
      );
    }
    const type = quest.target.castHash ? 'hash' : 'url';

    let cast = await withRetry(() => fetchCastWithViewer(identifier, type, current.fid));

    const checkViewerContext = (c: any) => {
      if (!c?.viewer_context) return false;
      if (quest.action === 'recast_cast') return Boolean(c.viewer_context.recasted);
      if (quest.action === 'like_cast') return Boolean(c.viewer_context.liked);
      return false;
    };

    let verifiedInViewerContext = checkViewerContext(cast);

    // If viewer_context is empty or false, retry a few times to avoid API lag
    if (!verifiedInViewerContext) {
      for (let i = 0; i < 3; i += 1) {
        await new Promise((resolve) => setTimeout(resolve, 1500 * (i + 1)));
        cast = await fetchCastWithViewer(identifier, type, current.fid);
        verifiedInViewerContext = checkViewerContext(cast);
        if (verifiedInViewerContext) break;
      }
    }

    verified = verifiedInViewerContext;

    proof = {
      identifier,
      type,
      viewerFid: current.fid,
      viewerContext: cast?.viewer_context ?? null,
      verified,
    };
  }

  if (quest.verification === 'wallet_balance') {
    const minBalance = Number(quest.target.minBalance || '0');

    const walletRows = await sql`
      SELECT w.address AS wallet_address
      FROM wallets w
      WHERE w.user_id = ${userId} AND w.verified = true
      LIMIT 1
    `;

    const walletAddress = walletRows[0]?.wallet_address;
    if (!walletAddress) {
      return NextResponse.json(
        { verified: false, error: 'wallet_not_linked' },
        { status: 400 }
      );
    }

    const [balance, decimals] = await Promise.all([
      publicClient.readContract({
        address: TACHI_CONTRACT as `0x${string}`,
        abi: ERC20_BALANCE_ABI,
        functionName: 'balanceOf',
        args: [walletAddress as `0x${string}`],
      }),
      publicClient.readContract({
        address: TACHI_CONTRACT as `0x${string}`,
        abi: ERC20_BALANCE_ABI,
        functionName: 'decimals',
      }),
    ]);

    const formatted = Number(balance) / Math.pow(10, decimals);
    verified = formatted >= minBalance;
    proof = { walletAddress, balance: formatted.toFixed(4), minBalance };
  }

  if (!verified) {
    return NextResponse.json(
      { verified: false, error: 'not_completed' },
      { status: 409 }
    );
  }

  // Award points
  await sql`
    INSERT INTO quest_claims (user_id, quest_id, status, proof, points_awarded)
    VALUES (${userId}, ${quest.id}, 'verified', ${JSON.stringify(proof)}::jsonb, ${quest.points})
    ON CONFLICT (user_id, quest_id) DO NOTHING
  `;

  // Check for referral qualification
  await awardReferralIfQualified(userId);

  return NextResponse.json({
    verified: true,
    questId: quest.id,
    pointsAwarded: quest.points,
  });
}
