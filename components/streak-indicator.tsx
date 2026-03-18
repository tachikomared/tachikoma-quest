'use client';

import { useEffect, useState } from 'react';

interface StreakIndicatorProps {
  streak: number;
  lastCheckIn?: string;
  isMiniApp?: boolean;
}

export function StreakIndicator({ streak, lastCheckIn, isMiniApp }: StreakIndicatorProps) {
  const [timeLeft, setTimeLeft] = useState('');
  const [danger, setDanger] = useState(false);

  useEffect(() => {
    if (!lastCheckIn) return;

    const calculateTimeLeft = () => {
      const last = new Date(lastCheckIn);
      const nextDeadline = new Date(last);
      nextDeadline.setDate(nextDeadline.getDate() + 1);
      nextDeadline.setHours(23, 59, 59, 999);

      const now = new Date();
      const diff = nextDeadline.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('EXPIRED');
        setDanger(true);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setTimeLeft(`${hours}h ${minutes}m`);
      setDanger(hours < 4);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 60000);
    return () => clearInterval(interval);
  }, [lastCheckIn]);

  const getStreakEmoji = () => {
    if (streak >= 30) return '🔥🔥🔥';
    if (streak >= 7) return '🔥🔥';
    if (streak >= 3) return '🔥';
    return '⚡';
  };

  const getStreakLabel = () => {
    if (streak >= 30) return 'LEGENDARY';
    if (streak >= 7) return 'WEEKLY';
    if (streak >= 3) return 'HOT';
    return 'STARTER';
  };

  if (streak === 0 && !lastCheckIn) {
    return (
      <div className="flex items-center gap-2 bg-[#1a1a24] border border-[#353545] rounded-lg px-3 py-1.5">
        <span className="text-lg">⚡</span>
        <div>
          <p className="text-[10px] text-[#8a8a9a] font-mono">START STREAK</p>
          <p className="text-xs font-bold text-white">Complete a quest!</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 rounded-lg px-3 py-1.5 border ${
      danger 
        ? 'bg-[#ff1a1a]/10 border-[#ff1a1a] animate-pulse' 
        : 'bg-[#1a1a24] border-[#ff6b00]/30'
    }`}>
      <span className="text-2xl">{getStreakEmoji()}</span>
      <div>
        <div className="flex items-center gap-1">
          <p className="text-[10px] text-[#8a8a9a] font-mono">{getStreakLabel()} STREAK</p>
          {streak > 0 && (
            <span className="text-[10px] text-[#ff6b00] font-bold">x{streak}</span>
          )}
        </div>
        {timeLeft && (
          <p className={`text-xs font-bold ${danger ? 'text-[#ff1a1a]' : 'text-[#ff6b00]'}`}>
            {danger ? '⚠️ ' : ''}{timeLeft}
          </p>
        )}
      </div>
    </div>
  );
}

interface DailyQuestCardProps {
  onComplete: () => void;
  completedToday: boolean;
  streak: number;
}

export function DailyQuestCard({ onComplete, completedToday, streak }: DailyQuestCardProps) {
  return (
    <div className="bg-gradient-to-r from-[#ff6b00]/20 to-[#ff1a1a]/20 border border-[#ff6b00]/30 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#ff6b00]/20 rounded-lg flex items-center justify-center text-2xl">
            🔥
          </div>
          <div>
            <h4 className="font-bold text-white">Daily Check-in</h4>
            <p className="text-xs text-[#8a8a9a]">
              {completedToday 
                ? '✅ Completed today — come back tomorrow!' 
                : `Complete any quest to keep your ${streak}-day streak!`
              }
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-[#ff6b00]" style={{ fontFamily: 'Press Start 2P, monospace' }}>
            +50
          </p>
          <p className="text-[10px] text-[#8a8a9a] font-mono">XP BONUS</p>
        </div>
      </div>
      
      {!completedToday && (
        <button
          onClick={onComplete}
          className="w-full mt-3 bg-[#ff6b00] hover:bg-[#ff6b00]/80 text-white font-bold py-2 rounded-lg transition-colors"
        >
          View Missions
        </button>
      )}
    </div>
  );
}
