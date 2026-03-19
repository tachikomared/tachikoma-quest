'use client';

import React from 'react';
import { useAuth } from '@/lib/auth';

interface CasinoResult {
  isWin: boolean;
  payout?: number;
  burned?: number;
  toCommunity?: number;
  xpEarned?: number;
  betAmount: number;
}

export function CasinoResultCard({ result, user }: { result: CasinoResult; user: any }) {
  const { auth } = useAuth();
  
  if (!user) return null;

  const handleShareWin = async () => {
    const castText = `🎰 I just WON ${result.payout} $TACHI in TACHI Casino!\n\nBet: ${result.betAmount} | Multiplier: 2×\nXP Earned: ${result.xpEarned}\n\nPlay now: https://tachi-quest.vercel.app/casino`;
    
    try {
      const res = await fetch('/api/farcaster/cast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: castText }),
      });
      console.log('Cast posted:', res);
    } catch (e) {
      console.error('Cast error:', e);
    }
  };

  const handleShareLoss = async () => {
    const castText = `💀 Just lost ${result.betAmount} $TACHI to the burn pool...\n\nBut ${result.toCommunity || 0} went to community pool! 💪\nXP Earned: ${result.xpEarned}\n\nTry again: https://tachi-quest.vercel.app/casino`;
    
    try {
      const res = await fetch('/api/farcaster/cast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: castText }),
      });
      console.log('Cast posted:', res);
    } catch (e) {
      console.error('Cast error:', e);
    }
  };

  return (
    <div className="bg-[#0a0a12]/80 border border-[#333] rounded-lg p-4 mt-4 animate-in fade-in zoom-in duration-300">
      <div className="text-center">
        {result.isWin ? (
          <>
            <div className="text-4xl mb-2">🎉</div>
            <h3 className="text-[#39ff14] text-xl font-mono font-bold">YOU WON!</h3>
            <div className="text-[#39ff14] text-3xl font-mono mt-2">{result.payout} $TACHI</div>
            <div className="text-xs text-[#8a8a9a] mt-1">+{result.xpEarned} XP</div>
          </>
        ) : (
          <>
            <div className="text-4xl mb-2">💀</div>
            <h3 className="text-[#ff1a1a] text-xl font-mono font-bold">BURNED</h3>
            <div className="text-[#ff1a1a] text-3xl font-mono mt-2">{result.burned} $TACHI</div>
            <div className="text-xs text-[#8a8a9a] mt-1">
              {result.toCommunity} → community pool
            </div>
            <div className="text-xs text-[#8a8a9a] mt-1">
              +{result.xpEarned} XP (consolation)
            </div>
          </>
        )}
      </div>
      
      <div className="mt-4 flex gap-2">
        <button
          onClick={result.isWin ? handleShareWin : handleShareLoss}
          className="flex-1 bg-[#1a1a24] hover:bg-[#252535] border border-[#333] rounded px-4 py-2 text-xs font-mono transition-colors"
        >
          📤 Share Result
        </button>
      </div>
    </div>
  );
}

// Community pool tracker component
export function CommunityPoolTracker({ total, tvl }: { total: number; tvl: string }) {
  return (
    <div className="bg-[#0a0a12]/80 border border-[#333] rounded-lg p-4 mt-4">
      <div className="flex justify-between items-center">
        <div>
          <div className="text-[#8a8a9a] text-xs font-mono">Community Pool</div>
          <div className="text-lg font-mono text-[#f0f0f0]">{tvl} $TACHI</div>
          <div className="text-xs text-[#8a8a9a] mt-1">
            {total.toLocaleString()} total contributors
          </div>
        </div>
        <div className="text-2xl">🔥</div>
      </div>
    </div>
  );
}
