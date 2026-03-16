'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, Button } from '@neynar/ui';
import { useShare } from '@/neynar-farcaster-sdk/mini';
import { generateReferralCode } from '@/lib/referral-utils';
import {
  getReferralsByReferrer,
  getActiveReferralCount,
} from '@/db/actions/referral-actions';
import { MOCK_REFERRAL_REWARDS } from '@/data/mocks';
import type { ReferralReward } from '@/features/app/types';

type ReferralUser = {
  referredFid: number;
  code: string;
  status: 'pending' | 'active';
  joinedAt: Date;
  questsDone: number;
};

type ReferralTabProps = {
  fid: number;
  username: string;
};

export function ReferralTab({ fid, username }: ReferralTabProps) {
  const [copied, setCopied] = useState(false);
  const [referrals, setReferrals] = useState<ReferralUser[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [rewards, setRewards] = useState<ReferralReward[]>(MOCK_REFERRAL_REWARDS);
  const [loading, setLoading] = useState(true);
  const { share } = useShare();

  const referralCode = generateReferralCode(username, fid);
  const referralLink = `?ref=${referralCode}`;
  const xpEarned = activeCount * 200;

  useEffect(() => {
    async function loadReferrals() {
      try {
        const [refs, count] = await Promise.all([
          getReferralsByReferrer(fid),
          getActiveReferralCount(fid),
        ]);
        setReferrals(refs);
        setActiveCount(count);

        // Update claimed status based on active count
        setRewards(
          MOCK_REFERRAL_REWARDS.map((r) => ({
            ...r,
            claimed: count >= r.milestone,
          })),
        );
      } catch (err) {
        console.error('Failed to load referrals:', err);
      } finally {
        setLoading(false);
      }
    }

    loadReferrals();
  }, [fid]);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCastInvite = async () => {
    await share({
      text: `Join Tachi Quests — complete social quests, earn XP & stack up for future $TACHI drops! 🦀 Use my code: ${referralCode}`,
    });
  };

  const formatJoinedAt = (date: Date): string => {
    const now = Date.now();
    const diff = now - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'today';
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
  };

  return (
    <div className="flex flex-col gap-3 pb-4">
      {/* Stats row */}
      <Card className="border-red-900 bg-card">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 text-center p-3 bg-background rounded-2xl border border-border">
              <p className="font-bold text-2xl text-red-400">{referrals.length}</p>
              <p className="text-xs text-muted-foreground">Invited</p>
            </div>
            <div className="flex-1 text-center p-3 bg-background rounded-2xl border border-border">
              <p className="font-bold text-2xl text-green-400">{activeCount}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
            <div className="flex-1 text-center p-3 bg-background rounded-2xl border border-border">
              <p className="font-bold text-2xl text-red-400">
                {xpEarned}
              </p>
              <p className="text-xs text-muted-foreground">XP earned</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            You earn{' '}
            <span className="font-bold text-red-400">200 XP</span> per active referral —
            and future $TACHI drops based on your score 🦀
          </p>
        </CardContent>
      </Card>

      {/* Invite link */}
      <p className="text-xs font-bold text-red-500 uppercase tracking-widest px-1">
        Your Invite Code
      </p>
      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <div className="flex items-center bg-background rounded-xl px-3 py-2 mb-3 border border-border">
            <p className="text-sm text-red-400 font-mono flex-1 truncate">{referralCode}</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleCopy}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold text-sm"
            >
              {copied ? '✓ Copied!' : '📋 Copy Code'}
            </Button>
            <Button
              onClick={handleCastInvite}
              variant="outline"
              className="flex-1 border-red-900 text-foreground text-sm"
            >
              Cast Invite ↗
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Milestones */}
      <p className="text-xs font-bold text-red-500 uppercase tracking-widest px-1">
        Referral Milestones
      </p>
      {rewards.map((reward) => {
        const reached = activeCount >= reward.milestone;
        return (
          <Card key={reward.milestone} className="border-border bg-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 border ${
                    reward.claimed
                      ? 'bg-green-950 border-green-800'
                      : reached
                      ? 'bg-red-950 border-red-800'
                      : 'bg-background border-border opacity-50'
                  }`}
                >
                  {reward.claimed ? '✓' : reached ? '🎁' : '🔒'}
                </div>
                <div className="flex-1">
                  <p
                    className={`font-bold text-sm ${
                      !reached && !reward.claimed ? 'text-muted-foreground' : 'text-foreground'
                    }`}
                  >
                    {reward.label}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-semibold text-red-400">
                      +{reward.xp} XP
                    </span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-purple-400">🦀 future drop</span>
                  </div>
                </div>
                <div className="shrink-0">
                  {reward.claimed && (
                    <span className="text-xs bg-green-950 text-green-400 border border-green-800 px-2 py-1 rounded-full font-semibold">
                      Claimed
                    </span>
                  )}
                  {!reward.claimed && reached && (
                    <span className="text-xs bg-red-950 text-red-400 border border-red-800 px-2 py-1 rounded-full font-semibold">
                      🎁 Earned
                    </span>
                  )}
                  {!reward.claimed && !reached && (
                    <span className="text-xs text-muted-foreground">
                      {activeCount}/{reward.milestone}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Referred users */}
      <p className="text-xs font-bold text-red-500 uppercase tracking-widest px-1">
        People You Invited
      </p>
      {loading ? (
        <div className="animate-pulse flex flex-col gap-2">
          {[1, 2].map((i) => <div key={i} className="h-16 bg-muted rounded-xl" />)}
        </div>
      ) : referrals.length === 0 ? (
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground text-center">
              No referrals yet. Share your code to get started! 🦀
            </p>
          </CardContent>
        </Card>
      ) : (
        referrals.map((ref) => (
          <Card key={ref.referredFid} className="border-border bg-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-foreground shrink-0">
                  #{ref.referredFid}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    FID {ref.referredFid}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    joined {formatJoinedAt(ref.joinedAt)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  {ref.status === 'active' ? (
                    <>
                      <p className="text-xs font-bold text-green-400">Active</p>
                      <p className="text-xs text-muted-foreground">
                        {ref.questsDone} quests
                      </p>
                    </>
                  ) : (
                    <span className="text-xs bg-yellow-950 text-yellow-400 border border-yellow-800 px-2 py-0.5 rounded-full">
                      Pending
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}