'use client';

import { useState } from 'react';
import { Button } from '@neynar/ui';
import { usePublishReaction } from '@/neynar-web-sdk/neynar';
import { useFollowUser } from '@/neynar-web-sdk/neynar';
import { usePublishCast } from '@/neynar-web-sdk/neynar';
import { markQuestComplete } from '@/db/actions/quest-actions';
import { activateReferral } from '@/db/actions/referral-actions';
import type { Quest } from '@/features/app/types';

type QuestActionSheetProps = {
  quest: Quest;
  fid: number;
  signerUuid: string;
  username: string;
  pfpUrl: string;
  onClose: () => void;
  onComplete: () => void;
};

export function QuestActionSheet({
  quest,
  fid,
  signerUuid,
  username,
  pfpUrl,
  onClose,
  onComplete,
}: QuestActionSheetProps) {
  const [actionDone, setActionDone] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState('');
  // Pre-fill quote text from quest config if available
  const [quoteText, setQuoteText] = useState(quest.target.defaultQuoteText ?? '');
  const [castText, setCastText] = useState('');

  const publishReaction = usePublishReaction({
    onSuccess: () => setActionDone(true),
    onError: (err) => setError(err.message ?? 'Action failed. Try again.'),
  });

  const followUser = useFollowUser({
    onSuccess: () => setActionDone(true),
    onError: (err) => setError((err as unknown as Error).message ?? 'Follow failed. Try again.'),
  });

  const publishCast = usePublishCast({
    onSuccess: () => setActionDone(true),
    onError: (err) => setError(err.message ?? 'Cast failed. Try again.'),
  });

  const isActing =
    publishReaction.isPending || followUser.isPending || publishCast.isPending;

  const handleAction = () => {
    setError('');
    if (!signerUuid) {
      // No signer yet (dev mode or unauthenticated) — let user proceed anyway
      setActionDone(true);
      return;
    }

    switch (quest.type) {
      case 'recast':
        if (quest.target.castHash) {
          publishReaction.mutate({
            signer_uuid: signerUuid,
            reaction_type: 'recast',
            target: quest.target.castHash,
          });
        } else {
          // No cast hash configured yet — mark as done manually
          setActionDone(true);
        }
        break;

      case 'like':
        if (quest.target.castHash) {
          publishReaction.mutate({
            signer_uuid: signerUuid,
            reaction_type: 'like',
            target: quest.target.castHash,
          });
        } else {
          setActionDone(true);
        }
        break;

      case 'follow':
        if (quest.target.targetFid) {
          followUser.mutate({
            target_fid: quest.target.targetFid,
            signer_uuid: signerUuid,
          });
        } else {
          setActionDone(true);
        }
        break;

      case 'quote':
        // For quote, we need text — show textarea first
        if (quoteText.trim()) {
          publishCast.mutate({
            signer_uuid: signerUuid,
            text: quoteText,
            ...(quest.target.castHash && {
              embeds: [{ cast_id: { fid, hash: quest.target.castHash } }],
            }),
          });
        } else {
          // No text yet — don't proceed, show textarea
          break;
        }
        break;

      case 'cast':
        if (castText.trim()) {
          publishCast.mutate({
            signer_uuid: signerUuid,
            text: castText,
            ...(quest.channelId && { channel_id: quest.channelId }),
          });
        } else {
          break;
        }
        break;
    }
  };

  const handleClaim = async () => {
    setClaiming(true);
    try {
      await markQuestComplete(fid, quest.id, quest.xp, 0, username, pfpUrl);
      // Activate any referral if this is the first quest completion
      await activateReferral(fid);
      onComplete();
      onClose();
    } catch {
      setError('Failed to claim reward. Please try again.');
    } finally {
      setClaiming(false);
    }
  };

  const needsTextInput = (quest.type === 'quote' || quest.type === 'cast') && !actionDone;
  const showTextArea = needsTextInput;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      {/* Sheet */}
      <div className="relative bg-[#111111] border-t border-red-900 rounded-t-3xl p-5 flex flex-col gap-4 shadow-2xl shadow-red-950/50">
        {/* Handle */}
        <div className="w-10 h-1 bg-red-900 rounded-full mx-auto -mt-1" />

        {/* Quest header */}
        <div className="flex items-center gap-3">
          <div className="text-3xl">{quest.icon}</div>
          <div>
            <p className="font-bold text-base text-foreground">{quest.label}</p>
            <p className="text-xs text-muted-foreground">{quest.description}</p>
          </div>
        </div>

        {/* Reward pills */}
        <div className="flex gap-2">
          <span className="text-xs font-semibold bg-red-950 text-red-400 border border-red-800 px-3 py-1 rounded-full">
            +{quest.xp} XP
          </span>
          <span className="text-xs font-semibold bg-purple-950 text-purple-400 border border-purple-800 px-3 py-1 rounded-full">
            🦀 Future $TACHI drop
          </span>
        </div>

        {/* Target cast / profile preview */}
        <div className="bg-background rounded-2xl p-3 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <img
              src={quest.target.authorPfp}
              alt=""
              className="w-7 h-7 rounded-full"
            />
            <div>
              <p className="text-xs font-bold text-foreground">{quest.target.authorName}</p>
              <p className="text-xs text-muted-foreground">
                @{quest.target.authorUsername}
              </p>
            </div>
            {quest.target.type === 'profile' && (
              <span className="ml-auto text-xs bg-blue-950 text-blue-400 border border-blue-800 px-2 py-0.5 rounded-full">
                Profile
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground leading-snug">
            {quest.target.content}
          </p>
        </div>

        {/* Text input for quote/cast quests */}
        {showTextArea && (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-muted-foreground">
              {quest.type === 'quote' ? 'Your quote:' : 'Your cast:'}
            </p>
            <textarea
              value={quest.type === 'quote' ? quoteText : castText}
              onChange={(e) => {
                if (quest.type === 'quote') setQuoteText(e.target.value);
                else setCastText(e.target.value);
              }}
              placeholder={
                quest.type === 'quote'
                  ? 'Write your quote cast...'
                  : 'Say something in /tachi...'
              }
              className="w-full bg-background border border-red-900 rounded-xl p-3 text-sm text-foreground placeholder:text-muted-foreground resize-none h-20 focus:outline-none focus:border-red-600"
              maxLength={320}
            />
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-xs text-red-500 bg-red-950/30 border border-red-900 rounded-xl px-3 py-2">
            {error}
          </p>
        )}

        {/* Action / claim */}
        {!actionDone ? (
          <Button
            onClick={handleAction}
            disabled={isActing || (showTextArea && !(quest.type === 'quote' ? quoteText.trim() : castText.trim()))}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 disabled:opacity-50"
          >
            {isActing ? 'Processing...' : `${quest.actionLabel} ↗`}
          </Button>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 bg-green-950 border border-green-800 rounded-xl px-4 py-2">
              <span className="text-green-400 text-lg">✓</span>
              <p className="text-sm text-green-400 font-semibold">Action completed!</p>
            </div>
            <Button
              onClick={handleClaim}
              disabled={claiming}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 disabled:opacity-50"
            >
              {claiming ? 'Claiming...' : `Claim +${quest.xp} XP 🦀`}
            </Button>
          </div>
        )}

        <button onClick={onClose} className="text-xs text-muted-foreground text-center pb-1">
          Cancel
        </button>
      </div>
    </div>
  );
}
