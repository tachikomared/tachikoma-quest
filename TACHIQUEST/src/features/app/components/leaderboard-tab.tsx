'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@neynar/ui';
import { getLeaderboard, getUserRank } from '@/db/actions/leaderboard-actions';
import { MOCK_LEADERBOARD } from '@/data/mocks';
import type { LeaderboardEntry } from '@/features/app/types';

type LeaderboardTabProps = {
  currentFid: number;
  currentUsername: string;
};

const RANK_BADGES: Record<number, string> = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
};

export function LeaderboardTab({ currentFid, currentUsername }: LeaderboardTabProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [dbEntries, rank] = await Promise.all([
          getLeaderboard(20),
          getUserRank(currentFid),
        ]);

        if (dbEntries.length > 0) {
          const mapped: LeaderboardEntry[] = dbEntries.map((row) => ({
            rank: row.rank,
            username: row.username,
            displayName: row.username,
            pfpUrl: row.pfpUrl,
            xp: row.xp,
            badge: RANK_BADGES[row.rank] ?? '',
          }));
          setEntries(mapped);
        } else {
          // Fall back to mock data while leaderboard is empty
          setEntries(MOCK_LEADERBOARD);
        }

        setUserRank(rank);
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
        setEntries(MOCK_LEADERBOARD);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [currentFid]);

  if (loading) {
    return (
      <div className="flex flex-col gap-3 pb-4">
        <p className="text-xs font-bold text-red-500 uppercase tracking-widest px-1">Top Questers</p>
        <div className="animate-pulse flex flex-col gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 pb-4">
      <p className="text-xs font-bold text-red-500 uppercase tracking-widest px-1">Top Questers</p>
      <Card className="border-red-900 bg-card">
        <CardContent className="p-4">
          <div className="flex flex-col gap-1">
            {entries.map((entry) => (
              <div
                key={entry.rank}
                className={`flex items-center gap-3 p-2 rounded-xl transition-colors ${
                  entry.username === currentUsername
                    ? 'bg-red-950/60 border border-red-800'
                    : 'hover:bg-muted/30'
                }`}
              >
                <span className="w-7 text-center text-sm font-bold text-muted-foreground shrink-0">
                  {entry.badge || `#${entry.rank}`}
                </span>
                <img
                  src={entry.pfpUrl}
                  alt=""
                  className="w-8 h-8 rounded-full shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {entry.displayName}
                  </p>
                  <p className="text-xs text-muted-foreground">@{entry.username}</p>
                </div>
                <span className="text-sm font-bold text-red-400 shrink-0">
                  {entry.xp} XP
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {userRank !== null && (
        <Card className="border-red-900 bg-card">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground text-center">
              Your rank:{' '}
              <span className="font-bold text-red-400">#{userRank}</span>
              {userRank > 1 && ' · Keep questing to climb the board!'}
              {userRank === 1 && ' · You are the mecha crab overlord 🦀'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
