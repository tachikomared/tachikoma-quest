'use client';

import { useState } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

interface QuestReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  quest: {
    id: string;
    title: string;
    points: number;
    icon: string;
  };
  user: {
    username: string;
    points: number;
    referralCode: string;
  };
  isMiniApp: boolean;
}

export function QuestReceiptModal({ isOpen, onClose, quest, user, isMiniApp }: QuestReceiptModalProps) {
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

  if (!isOpen) return null;

  const shareText = `Completed "${quest.title}" in TACHI Quest ⚔️\n\n+${quest.points} XP earned!\n\nJoin the mission: https://tachi-quest.vercel.app?ref=${user.referralCode}`;

  const handleShare = async () => {
    setSharing(true);
    try {
      if (isMiniApp && sdk?.actions?.composeCast) {
        await sdk.actions.composeCast({
          text: shareText,
          embeds: ['https://tachi-quest.vercel.app'],
        });
      } else {
        // Web fallback
        const tweetText = encodeURIComponent(shareText);
        window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, '_blank');
      }
    } catch (e) {
      console.error('Share failed:', e);
    } finally {
      setSharing(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0a0a0f] border border-[#ff1a1a] rounded-xl max-w-sm w-full overflow-hidden">
        {/* Header */}
        <div className="bg-[#ff1a1a]/10 border-b border-[#ff1a1a]/30 p-4 text-center">
          <div className="text-4xl mb-2">{quest.icon}</div>
          <h3 className="text-lg font-black text-[#ff1a1a] tracking-wider">MISSION COMPLETE</h3>
        </div>

        {/* Receipt Body */}
        <div className="p-6 space-y-4">
          {/* Quest Name */}
          <div className="text-center">
            <p className="text-[#8a8a9a] text-sm font-mono mb-1">OPERATION</p>
            <p className="text-white font-bold">{quest.title}</p>
          </div>

          {/* XP Earned */}
          <div className="bg-[#1a1a24] border border-[#252535] rounded-lg p-4 text-center">
            <p className="text-[#8a8a9a] text-xs font-mono mb-1">XP AWARDED</p>
            <p className="text-3xl font-black text-[#ff6b00]" style={{ fontFamily: 'Press Start 2P, monospace' }}>
              +{quest.points}
            </p>
          </div>

          {/* Total XP */}
          <div className="flex justify-between text-sm">
            <span className="text-[#8a8a9a] font-mono">TOTAL XP</span>
            <span className="text-[#00f0ff] font-bold">{user.points.toLocaleString()}</span>
          </div>

          {/* Rank Badge */}
          <div className="flex items-center justify-center gap-2 py-2">
            <span className="text-2xl">🦀</span>
            <span className="text-sm text-[#8a8a9a] font-mono">@{user.username || 'PILOT'}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-[#1a1a24] space-y-2">
          <button
            onClick={handleShare}
            disabled={sharing}
            className="w-full bg-[#ff1a1a] hover:bg-[#ff1a1a]/80 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <span>📢</span>
            {sharing ? 'Opening...' : isMiniApp ? 'Share to Farcaster' : 'Share on X'}
          </button>

          <button
            onClick={handleCopy}
            className="w-full bg-[#1a1a24] hover:bg-[#252535] border border-[#353545] text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <span>{copied ? '✅' : '📋'}</span>
            {copied ? 'Copied!' : 'Copy Text'}
          </button>

          <button
            onClick={onClose}
            className="w-full text-[#8a8a9a] hover:text-white text-sm py-2 transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
