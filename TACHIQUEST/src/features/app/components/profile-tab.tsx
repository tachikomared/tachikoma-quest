'use client';

import { useReadContract } from 'wagmi';
import { ShareButton } from '@/neynar-farcaster-sdk/mini';
import { getUserRank } from '@/db/actions/leaderboard-actions';
import { Card, CardContent } from '@neynar/ui';
import { useEffect, useState } from 'react';
import { TACHI_CONTRACT, ERC20_BALANCE_ABI } from '@/data/mocks';

type ProfileTabProps = {
  displayName: string;
  username: string;
  pfpUrl: string;
  fid: number;
  bio: string;
  walletAddress: string;
  isVerified: boolean;
  followers: number;
  following: number;
  casts: number;
  questXP: number;
  questsCompleted: number;
};

function formatBalance(raw: bigint | undefined): string {
  if (raw === undefined) return '—';
  const value = Number(raw) / 1e18;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function truncateAddress(addr: string): string {
  if (addr.startsWith('0x') && addr.length >= 10) {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }
  return addr;
}

function formatCount(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toString();
}

export function ProfileTab({
  displayName,
  username,
  pfpUrl,
  fid,
  bio,
  walletAddress,
  isVerified,
  followers,
  following,
  casts,
  questXP,
  questsCompleted,
}: ProfileTabProps) {
  const [rank, setRank] = useState<number | null>(null);

  // Read real $TACHI balance on-chain
  const isRealAddress = walletAddress.startsWith('0x') && walletAddress.length === 42;
  const { data: tachiBalance, isLoading: balanceLoading } = useReadContract({
    address: TACHI_CONTRACT,
    abi: ERC20_BALANCE_ABI,
    functionName: 'balanceOf',
    args: isRealAddress ? [walletAddress as `0x${string}`] : undefined,
    query: { enabled: isRealAddress },
  });

  // Load rank from DB
  useEffect(() => {
    if (!fid) return;
    getUserRank(fid).then(setRank).catch(console.error);
  }, [fid, questXP]);

  const displayRank = rank ?? '—';

  // Format $TACHI balance for share image
  const formattedTachiBalance = formatBalance(tachiBalance as bigint | undefined);

  return (
    <div className="flex flex-col gap-3 pb-4">
      {/* Identity */}
      <Card className="border-red-900 bg-card">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <img
                src={pfpUrl}
                alt=""
                className="w-16 h-16 rounded-full border-4 border-red-700"
              />
              {isVerified && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  ✓
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-base text-foreground truncate">{displayName}</p>
              <p className="text-xs text-red-400 font-semibold">@{username}</p>
              <p className="text-xs text-muted-foreground mt-0.5">FID #{fid}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-3 leading-snug">{bio}</p>
          {isRealAddress && (
            <div className="mt-3 pt-3 border-t border-border flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
              <p className="text-xs font-mono text-muted-foreground truncate">
                {truncateAddress(walletAddress)}
              </p>
              <span className="ml-auto text-xs bg-blue-950 text-blue-400 border border-blue-900 px-2 py-0.5 rounded-full shrink-0">
                Base
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* $TACHI balance */}
      <Card className="border-yellow-900/50 bg-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-yellow-950 border border-yellow-800 flex items-center justify-center text-xl shrink-0">
                🪙
              </div>
              <div>
                <p className="font-bold text-sm text-foreground">$TACHI Balance</p>
                <p className="text-xs text-muted-foreground font-mono">
                  0x39B4...fbA3 · Base
                </p>
              </div>
            </div>
            {balanceLoading ? (
              <div className="animate-pulse h-7 w-24 bg-muted rounded-xl" />
            ) : (
              <div className="text-right">
                <p className="font-bold text-yellow-400 text-xl">
                  {formatBalance(tachiBalance as bigint | undefined)}
                </p>
                <p className="text-xs text-muted-foreground">$TACHI</p>
              </div>
            )}
          </div>
          <div className="pt-3 border-t border-border flex justify-between items-center">
            <p className="text-xs text-muted-foreground">Quest XP earned</p>
            <p className="text-xs font-semibold text-red-400">
              🦀 {questXP.toLocaleString()} XP
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Farcaster stats */}
      <p className="text-xs font-bold text-red-500 uppercase tracking-widest px-1">
        Farcaster Stats
      </p>
      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: formatCount(followers), label: 'Followers' },
              { value: formatCount(following), label: 'Following' },
              { value: casts.toString(), label: 'Casts' },
              { value: questXP.toString(), label: 'Quest XP', highlight: 'text-red-400' },
              {
                value: questsCompleted.toString(),
                label: 'Completed',
                highlight: 'text-green-400',
              },
              {
                value: `#${displayRank}`,
                label: 'Rank',
                highlight: 'text-red-400',
              },
            ].map(({ value, label, highlight }) => (
              <div
                key={label}
                className="text-center p-2 bg-background rounded-xl border border-border"
              >
                <p className={`font-bold text-base ${highlight ?? 'text-foreground'}`}>
                  {value}
                </p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Badges */}
      <p className="text-xs font-bold text-red-500 uppercase tracking-widest px-1">
        Badges Earned
      </p>
      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <div className="flex gap-3 flex-wrap">
            {[
              { icon: '🔁', label: 'Recaster', earned: questsCompleted >= 1 },
              { icon: '👤', label: 'Follower', earned: questsCompleted >= 2 },
              { icon: '💬', label: 'Quoter', earned: questsCompleted >= 3 },
              { icon: '❤️', label: 'Liker', earned: questsCompleted >= 4 },
              { icon: '📣', label: 'Caster', earned: questsCompleted >= 5 },
            ].map((badge) => (
              <div
                key={badge.label}
                className={`flex flex-col items-center gap-1 ${!badge.earned ? 'opacity-30' : ''}`}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl border ${
                    badge.earned
                      ? 'bg-red-950 border-red-800'
                      : 'bg-background border-border'
                  }`}
                >
                  {badge.icon}
                </div>
                <p className="text-xs text-muted-foreground">{badge.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <ShareButton
        variant="outline"
        className="w-full border-red-900 text-foreground"
        text={`I've earned ${questXP.toLocaleString()} XP on Tachi Quests! 🦀`}
        queryParams={{
          username,
          xp: questXP.toString(),
          questsCompleted: questsCompleted.toString(),
          rank: displayRank.toString(),
          tachiBalance: formattedTachiBalance,
        }}
      >
        Check My Quests
      </ShareButton>
    </div>
  );
}