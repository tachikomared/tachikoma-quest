import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireCurrentUser } from '@/lib/auth';
import { fetchCastWithViewer, verifyFarcasterFollow } from '@/lib/neynar';
import { getQuest } from '@/lib/quests';

async function awardReferralIfQualified(userId: string) {
  const walletRows = await sql`select 1 from wallets where user_id = ${userId} and verified = true limit 1`;
  const claimRows = await sql`
    select 1
    from quest_claims qc
    join quests q on q.id = qc.quest_id
    where qc.user_id = ${userId}
      and q.platform = 'farcaster'
    limit 1
  `;

  if (!walletRows.length || !claimRows.length) return;

  const referee = await sql`
    select id, referred_by_code
    from users
    where id = ${userId}
    limit 1
  `;

  if (!referee.length || !referee[0].referred_by_code) return;

  const referrer = await sql`
    select id
    from users
    where referral_code = ${referee[0].referred_by_code}
    limit 1
  `;

  if (!referrer.length) return;

  const existing = await sql`
    select 1 from referrals where referee_user_id = ${userId} limit 1
  `;
  if (existing.length) return;

  await sql`
    insert into referrals (referrer_user_id, referee_user_id, code, qualified_at, points_awarded)
    values (${referrer[0].id}, ${userId}, ${referee[0].referred_by_code}, now(), 100)
  `;

  await sql`
    insert into quest_claims (user_id, quest_id, status, proof, points_awarded)
    values (${referrer[0].id}, 'referral-qualified', 'verified', ${JSON.stringify({ refereeUserId: userId })}::jsonb, 100)
    on conflict do nothing
  `;
}

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const current = await requireCurrentUser();
  const quest = getQuest(params.id);

  if (!quest || !quest.enabled) {
    return NextResponse.json({ verified: false, error: 'quest_not_found' }, { status: 404 });
  }

  // Only support Farcaster verification types here
  if (quest.verification === 'wallet_signature' || quest.platform === 'x') {
    return NextResponse.json(
      { verified: false, error: 'unsupported_verification_type' },
      { status: 400 }
    );
  }

  // Ensure quest exists in DB
  await sql`
    insert into quests (id, title, description, platform, action, verification, points, repeatable, enabled, target)
    values (
      ${quest.id},
      ${quest.title},
      ${quest.description},
      ${quest.platform},
      ${quest.action},
      ${quest.verification},
      ${quest.points},
      ${quest.repeatable},
      ${quest.enabled},
      ${JSON.stringify(quest.target)}::jsonb
    )
    on conflict (id) do update set
      title = excluded.title,
      description = excluded.description,
      platform = excluded.platform,
      action = excluded.action,
      verification = excluded.verification,
      points = excluded.points,
      repeatable = excluded.repeatable,
      enabled = excluded.enabled,
      target = excluded.target
  `;

  const userRows = await sql`
    select id, fc_fid
    from users
    where fc_fid = ${current.fid}
    limit 1
  `;

  if (!userRows.length) {
    return NextResponse.json({ verified: false, error: 'user_not_synced' }, { status: 401 });
  }

  const userId = userRows[0].id;

  const existing = await sql`
    select id
    from quest_claims
    where user_id = ${userId}
      and quest_id = ${quest.id}
    limit 1
  `;

  if (existing.length && !quest.repeatable) {
    return NextResponse.json({ verified: true, questId: quest.id, pointsAwarded: 0 });
  }

  let verified = false;
  let proof: Record<string, unknown> = {};

  if (quest.verification === 'fc_follow_user') {
    verified = await verifyFarcasterFollow(current.fid, Number(quest.target.targetFid));
    proof = { targetFid: quest.target.targetFid, viewerFid: current.fid };
  }

  if (quest.verification === 'fc_cast_viewer_context') {
    const identifier = quest.target.castHash || quest.target.castUrl;
    if (!identifier) {
      return NextResponse.json({ verified: false, error: 'missing_cast_identifier' }, { status: 400 });
    }
    const type = quest.target.castHash ? 'hash' : 'url';
    const cast = await fetchCastWithViewer(identifier, type, current.fid);

    if (quest.action === 'recast_cast') {
      verified = Boolean(cast?.viewer_context?.recasted);
    } else if (quest.action === 'like_cast') {
      verified = Boolean(cast?.viewer_context?.liked);
    }

    proof = {
      identifier,
      type,
      viewerFid: current.fid,
      viewerContext: cast?.viewer_context ?? null,
    };
  }

  if (!verified) {
    return NextResponse.json({ verified: false, error: 'not_completed' }, { status: 409 });
  }

  await sql`
    insert into quest_claims (user_id, quest_id, status, proof, points_awarded)
    values (${userId}, ${quest.id}, 'verified', ${JSON.stringify(proof)}::jsonb, ${quest.points})
    on conflict (user_id, quest_id) do nothing
  `;

  await awardReferralIfQualified(userId);

  return NextResponse.json({
    verified: true,
    questId: quest.id,
    pointsAwarded: quest.points,
  });
}
