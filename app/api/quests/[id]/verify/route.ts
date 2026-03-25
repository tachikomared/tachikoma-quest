import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireCurrentUser } from '@/lib/auth';
import { fetchCastWithViewer, verifyFarcasterFollow } from '@/lib/neynar';
import { getQuest } from '@/lib/quests';

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
    SELECT id FROM users WHERE fc_fid = ${current.fid!} LIMIT 1
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
    verified = await verifyFarcasterFollow(current.fid!, targetFid);
    proof = { targetFid, viewerFid: current.fid!, verified };
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
    const cast = await fetchCastWithViewer(identifier, type, current.fid!);

    if (quest.action === 'recast_cast') {
      verified = Boolean(cast?.viewer_context?.recasted);
    } else if (quest.action === 'like_cast') {
      verified = Boolean(cast?.viewer_context?.liked);
    }

    proof = {
      identifier,
      type,
      viewerFid: current.fid!,
      viewerContext: cast?.viewer_context ?? null,
      verified,
    };
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
