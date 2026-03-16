'use client';

import { useState } from 'react';
import { Card, CardContent, Button } from '@neynar/ui';
import { QuestActionSheet } from '@/features/app/components/quest-action-sheet';
import type { Quest, QuestStatus } from '@/features/app/types';

type QuestsTabProps = {
  initialQuests: Quest[];
  username: string;
  pfpUrl: string;
  fid: number;
  signerUuid: string;
  onQuestComplete: (updatedQuests: Quest[]) => void;
};

export function QuestsTab({
  initialQuests,
  username,
  pfpUrl,
  fid,
  signerUuid,
  onQuestComplete,
}: QuestsTabProps) {
  const [quests, setQuests] = useState<Quest[]>(initialQuests);
  const [activeQuest, setActiveQuest] = useState<Quest | null>(null);

  const handleComplete = (id: number) => {
    const updated = quests.map((q) =>
      q.id === id ? { ...q, status: 'completed' as QuestStatus } : q,
    );
    setQuests(updated);
    onQuestComplete(updated);
  };

  const completedCount = quests.filter((q) => q.status === 'completed').length;
  const earnedXP = quests
    .filter((q) => q.status === 'completed')
    .reduce((acc, q) => acc + q.xp, 0);
  const maxXP = quests.reduce((acc, q) => acc + q.xp, 0);

  return (
    <div className="flex flex-col gap-3 pb-4 relative">
      {/* Progress card */}
      <Card className="border-red-900 bg-card">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <img src={pfpUrl} alt="" className="w-10 h-10 rounded-full border-2 border-red-700" />
            <div>
              <p className="font-bold text-sm text-foreground">@{username}</p>
              <p className="text-xs text-muted-foreground">FID #{fid}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="font-bold text-red-400 text-sm">{earnedXP} XP</p>
              <p className="text-xs text-muted-foreground">
                {completedCount}/{quests.length} done
              </p>
            </div>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full transition-all duration-500"
              style={{ width: `${maxXP > 0 ? (earnedXP / maxXP) * 100 : 0}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {earnedXP} / {maxXP} XP total
          </p>
        </CardContent>
      </Card>

      {/* Quest list */}
      <p className="text-xs font-bold text-red-500 uppercase tracking-widest px-1">
        Active Quests 🦀
      </p>

      {quests.map((quest) => (
        <Card key={quest.id} className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl mt-0.5 shrink-0">{quest.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-sm text-foreground">{quest.label}</p>
                  {quest.status === 'completed' && (
                    <span className="text-xs bg-green-950 text-green-400 border border-green-800 px-2 py-0.5 rounded-full font-semibold">
                      ✓ Done
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{quest.description}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-semibold text-red-400">+{quest.xp} XP</span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-purple-400">🦀 future drop</span>
                </div>
              </div>
              <div className="shrink-0">
                {quest.status === 'in_progress' && (
                  <Button
                    onClick={() => setActiveQuest(quest)}
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-3"
                  >
                    Go →
                  </Button>
                )}
                {quest.status === 'completed' && (
                  <div className="w-8 h-8 rounded-full bg-green-950 border border-green-800 flex items-center justify-center text-green-400 font-bold">
                    ✓
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* X (Twitter) Support — no points, just love */}
      <p className="text-xs font-bold text-red-500 uppercase tracking-widest px-1 mt-2">
        Support on X 𝕏
      </p>
      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-3">
            No XP, no $TACHI — just show love to TachikomaRed on X.
          </p>
          <div className="flex flex-col gap-2">
            {[
              {
                label: 'Follow @TachikomaRed',
                icon: '👤',
                url: 'https://x.com/TachikomaRed',
              },
              {
                label: 'Like & Repost intro tweet',
                icon: '🔁',
                url: 'https://x.com/TachikomaRed',
              },
              {
                label: 'Reply to latest post',
                icon: '💬',
                url: 'https://x.com/TachikomaRed',
              },
            ].map((action) => (
              <a
                key={action.label}
                href={action.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-background border border-border hover:border-red-900 transition-colors"
              >
                <span className="text-base">{action.icon}</span>
                <span className="text-sm text-foreground flex-1">{action.label}</span>
                <span className="text-xs text-muted-foreground">↗</span>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>

      {activeQuest && (
        <QuestActionSheet
          quest={activeQuest}
          fid={fid}
          signerUuid={signerUuid}
          username={username}
          pfpUrl={pfpUrl}
          onClose={() => setActiveQuest(null)}
          onComplete={() => handleComplete(activeQuest.id)}
        />
      )}
    </div>
  );
}
