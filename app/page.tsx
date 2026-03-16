'use client';

import { useEffect, useState } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';
import { useAuth } from '@/app/providers';
import { useConnect, useAccount, useSignMessage, useReadContract } from 'wagmi';
import { TACHI_CONTRACT, ERC20_BALANCE_ABI, MOCK_REFERRAL_REWARDS, MOCK_LEADERBOARD } from '@/data/mocks';

type Tab = 'quests' | 'leaderboard' | 'referrals' | 'profile';
type QuestStatus = 'idle' | 'opened' | 'verifying' | 'verified' | 'failed';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'quests', label: 'Quests', icon: '⚡' },
  { id: 'leaderboard', label: 'Board', icon: '🏆' },
  { id: 'referrals', label: 'Refer', icon: '🔗' },
  { id: 'profile', label: 'Me', icon: '👤' },
];

export default function HomePage() {
  const { auth, isMiniApp } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('quests');

  // Get user from auth context
  const user = auth.status === 'authenticated' ? auth.user : null;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-red-900/30">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-red-500 to-red-400 bg-clip-text text-transparent">
              TACHI Quest
            </h1>
            <p className="text-xs text-gray-500">Complete quests · Earn XP · Stack $TACHI</p>
          </div>
          {user && (
            <div className="flex items-center gap-2 bg-gray-900/50 rounded-full px-3 py-1.5 border border-red-900/30">
              <img 
                src={user.fcPfpUrl || '/default-avatar.png'} 
                alt="" 
                className="w-6 h-6 rounded-full" 
              />
              <span className="text-xs font-medium text-red-400">{user.points || 0} XP</span>
            </div>
          )}
        </div>

        {/* Tab Bar */}
        <div className="flex border-b border-gray-800">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-red-400 border-b-2 border-red-500'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-4 pb-24">
        {activeTab === 'quests' && <QuestsTab user={user} isMiniApp={isMiniApp} />}
        {activeTab === 'leaderboard' && <LeaderboardTab user={user} />}
        {activeTab === 'referrals' && <ReferralsTab user={user} isMiniApp={isMiniApp} />}
        {activeTab === 'profile' && <ProfileTab user={user} />}
      </main>
    </div>
  );
}

// Quests Tab Component
function QuestsTab({ user, isMiniApp }: { user: any; isMiniApp: boolean }) {
  const [quests, setQuests] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<Record<string, QuestStatus>>({});

  useEffect(() => {
    fetch('/api/quests').then(r => r.json()).then(d => setQuests(d.quests || []));
  }, []);

  const setStatus = (id: string, status: QuestStatus) => {
    setStatuses(s => ({ ...s, [id]: status }));
  };

  const openQuest = async (quest: any) => {
    setStatus(quest.id, 'opened');
    
    if (quest.platform === 'x' && quest.target?.url) {
      if (isMiniApp) await sdk.actions.openUrl({ url: quest.target.url });
      else window.open(quest.target.url, '_blank');
      return;
    }

    if (quest.platform === 'farcaster') {
      if (quest.action === 'follow_user' && quest.target?.targetFid) {
        if (isMiniApp) await sdk.actions.viewProfile({ fid: quest.target.targetFid });
        else window.open(`https://warpcast.com/~/profiles/${quest.target.targetFid}`, '_blank');
      } else if (quest.target?.castHash) {
        if (isMiniApp) await sdk.actions.viewCast({ hash: quest.target.castHash });
        else window.open(quest.target.castUrl || `https://warpcast.com/~/casts/${quest.target.castHash}`, '_blank');
      }
    }
  };

  const verifyQuest = async (quest: any) => {
    if (!user || quest.platform === 'x' || quest.verification === 'wallet_signature') return;
    setStatus(quest.id, 'verifying');
    try {
      const res = await fetch(`/api/quests/${quest.id}/verify`, { method: 'POST' });
      const data = await res.json();
      if (data.verified) setStatus(quest.id, 'verified');
      else setStatus(quest.id, 'failed');
    } catch {
      setStatus(quest.id, 'failed');
    }
  };

  return (
    <div className="space-y-3">
      {/* Progress Card */}
      {user && (
        <div className="bg-gradient-to-br from-red-950/50 to-gray-900 rounded-2xl p-4 border border-red-900/30">
          <div className="flex items-center gap-3 mb-3">
            <img src={user.fcPfpUrl} alt="" className="w-10 h-10 rounded-full border-2 border-red-600" />
            <div>
              <p className="font-bold text-sm">@{user.fcUsername}</p>
              <p className="text-xs text-gray-500">FID #{user.fcFid}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="font-bold text-red-400 text-lg">{user.points || 0} XP</p>
              <p className="text-xs text-gray-500">Keep questing!</p>
            </div>
          </div>
        </div>
      )}

      {/* Quest List */}
      <p className="text-xs font-bold text-red-500 uppercase tracking-widest">Active Quests 🦀</p>
      
      {quests.map((quest) => {
        const status = statuses[quest.id] || 'idle';
        return (
          <div key={quest.id} className="bg-gray-900/50 rounded-2xl p-4 border border-gray-800 hover:border-red-900/50 transition-colors">
            <div className="flex items-start gap-3">
              <div className="text-2xl">{quest.icon || '⚡'}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm">{quest.title}</p>
                  {status === 'verified' && <span className="text-xs bg-green-950 text-green-400 px-2 py-0.5 rounded-full">✓ Done</span>}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{quest.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs font-bold text-red-400">+{quest.points} XP</span>
                  <span className="text-xs text-gray-600">·</span>
                  <span className="text-xs text-purple-400">🦀 future drop</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 mt-3">
              {(quest.platform === 'farcaster' || quest.platform === 'x') && (
                <button 
                  onClick={() => openQuest(quest)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold py-2.5 rounded-xl transition-colors"
                >
                  {quest.platform === 'x' ? 'Open on X ↗' : 'Go →'}
                </button>
              )}
              {quest.platform === 'farcaster' && status !== 'verified' && (
                <button 
                  onClick={() => verifyQuest(quest)}
                  disabled={status === 'verifying'}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold py-2.5 rounded-xl transition-colors"
                >
                  {status === 'verifying' ? 'Verifying...' : 'Verify'}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Leaderboard Tab
function LeaderboardTab({ user }: { user: any }) {
  const [entries, setEntries] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/leaderboard').then(r => r.json()).then(d => setEntries(d.entries || MOCK_LEADERBOARD));
  }, []);

  return (
    <div className="space-y-3">
      <p className="text-xs font-bold text-red-500 uppercase tracking-widest">Top Questers 🏆</p>
      
      <div className="bg-gray-900/50 rounded-2xl border border-gray-800 overflow-hidden">
        {entries.slice(0, 20).map((entry, i) => (
          <div 
            key={i} 
            className={`flex items-center gap-3 p-3 ${i !== 0 ? 'border-t border-gray-800' : ''} ${
              entry.username === user?.fcUsername ? 'bg-red-950/30' : ''
            }`}
          >
            <span className="w-6 text-center text-sm font-bold text-gray-500">
              {i < 3 ? ['🥇', '🥈', '🥉'][i] : `#${i + 1}`}
            </span>
            <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-xs font-bold">
              {entry.username?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">@{entry.username || 'anon'}</p>
            </div>
            <span className="text-sm font-bold text-red-400">{entry.xp} XP</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Referrals Tab
function ReferralsTab({ user, isMiniApp }: { user: any; isMiniApp: boolean }) {
  const [copied, setCopied] = useState(false);
  const referralCode = user?.referralCode || 'NO-CODE';
  const referralLink = `${typeof window !== 'undefined' ? window.location.origin : ''}?ref=${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const text = `Join TACHI Quests — complete quests, earn XP & stack $TACHI! 🦀 Use my code: ${referralCode}`;
    if (isMiniApp) {
      await sdk.actions.composeCast({ text });
    } else if (navigator.share) {
      navigator.share({ title: 'TACHI Quest', text, url: referralLink });
    }
  };

  return (
    <div className="space-y-3">
      {/* Stats */}
      <div className="bg-gray-900/50 rounded-2xl p-4 border border-gray-800">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-gray-800/50 rounded-xl p-3">
            <p className="font-bold text-xl text-red-400">0</p>
            <p className="text-xs text-gray-500">Invited</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-3">
            <p className="font-bold text-xl text-green-400">0</p>
            <p className="text-xs text-gray-500">Active</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-3">
            <p className="font-bold text-xl text-red-400">0</p>
            <p className="text-xs text-gray-500">XP Earned</p>
          </div>
        </div>
        <p className="text-xs text-gray-500 text-center mt-3">
          Earn <span className="text-red-400 font-bold">200 XP</span> per active referral
        </p>
      </div>

      {/* Invite Code */}
      <p className="text-xs font-bold text-red-500 uppercase tracking-widest">Your Invite Code 🔗</p>
      
      <div className="bg-gray-900/50 rounded-2xl p-4 border border-gray-800">
        <div className="bg-gray-800/50 rounded-xl px-4 py-3 mb-3">
          <p className="text-red-400 font-mono text-center font-bold tracking-wider">{referralCode}</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleCopy}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-3 rounded-xl transition-colors"
          >
            {copied ? '✓ Copied!' : '📋 Copy Code'}
          </button>
          <button 
            onClick={handleShare}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold py-3 rounded-xl transition-colors"
          >
            Share ↗
          </button>
        </div>
      </div>

      {/* Milestones */}
      <p className="text-xs font-bold text-red-500 uppercase tracking-widest">Milestones 🎯</p>
      
      {MOCK_REFERRAL_REWARDS.map((reward) => (
        <div key={reward.milestone} className="bg-gray-900/50 rounded-2xl p-4 border border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-lg border border-gray-700">
              🔒
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm text-gray-400">{reward.label}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-semibold text-red-400">+{reward.xp} XP</span>
                <span className="text-xs text-gray-600">·</span>
                <span className="text-xs text-purple-400">🦀 {reward.tachi} $TACHI</span>
              </div>
            </div>
            <span className="text-xs text-gray-500">0/{reward.milestone}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// Profile Tab
function ProfileTab({ user }: { user: any }) {
  const isRealAddress = user?.walletAddress?.startsWith('0x') && user.walletAddress.length === 42;
  
  const { data: tachiBalance } = useReadContract({
    address: TACHI_CONTRACT,
    abi: ERC20_BALANCE_ABI,
    functionName: 'balanceOf',
    args: isRealAddress ? [user.walletAddress as `0x${string}`] : undefined,
    query: { enabled: isRealAddress },
  });

  const formatBalance = (raw: bigint | undefined) => {
    if (raw === undefined) return '—';
    const value = Number(raw) / 1e18;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
    return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  const truncateAddress = (addr: string) => {
    if (addr?.startsWith('0x') && addr.length >= 10) return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    return addr;
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Connect your Farcaster account to view your profile</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Identity Card */}
      <div className="bg-gray-900/50 rounded-2xl p-4 border border-gray-800">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img 
              src={user.fcPfpUrl || '/default-avatar.png'} 
              alt="" 
              className="w-16 h-16 rounded-full border-4 border-red-600" 
            />
            {user.fcPowerBadge && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                ✓
              </div>
            )}
          </div>
          <div>
            <p className="font-bold text-base">{user.fcDisplayName || user.fcUsername}</p>
            <p className="text-xs text-red-400 font-semibold">@{user.fcUsername}</p>
            <p className="text-xs text-gray-500">FID #{user.fcFid}</p>
          </div>
        </div>
        {user.fcBio && (
          <p className="text-sm text-gray-400 mt-3">{user.fcBio}</p>
        )}
        {user.walletAddress && (
          <div className="mt-3 pt-3 border-t border-gray-800 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <p className="text-xs font-mono text-gray-500">{truncateAddress(user.walletAddress)}</p>
            <span className="ml-auto text-xs bg-blue-950 text-blue-400 px-2 py-0.5 rounded-full">Base</span>
          </div>
        )}
      </div>

      {/* $TACHI Balance */}
      <div className="bg-gradient-to-br from-yellow-950/30 to-gray-900 rounded-2xl p-4 border border-yellow-900/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-950 border border-yellow-800 flex items-center justify-center text-xl">
              🪙
            </div>
            <div>
              <p className="font-bold text-sm">$TACHI Balance</p>
              <p className="text-xs text-gray-500 font-mono">{truncateAddress(TACHI_CONTRACT)} · Base</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold text-xl text-yellow-400">{formatBalance(tachiBalance as bigint)}</p>
            <p className="text-xs text-gray-500">$TACHI</p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-800 flex justify-between items-center">
          <p className="text-xs text-gray-500">Quest XP earned</p>
          <p className="text-xs font-semibold text-red-400">🦀 {user.points || 0} XP</p>
        </div>
      </div>

      {/* Stats Grid */}
      <p className="text-xs font-bold text-red-500 uppercase tracking-widest">Stats 📊</p>
      
      <div className="bg-gray-900/50 rounded-2xl p-4 border border-gray-800">
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: user.fcFollowers?.toString() || '0', label: 'Followers' },
            { value: user.fcFollowing?.toString() || '0', label: 'Following' },
            { value: user.points?.toString() || '0', label: 'Quest XP', highlight: 'text-red-400' },
          ].map(({ value, label, highlight }) => (
            <div key={label} className="text-center p-2 bg-gray-800/50 rounded-xl">
              <p className={`font-bold text-base ${highlight || 'text-white'}`}>{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Badges */}
      <p className="text-xs font-bold text-red-500 uppercase tracking-widest">Badges 🏅</p>
      
      <div className="bg-gray-900/50 rounded-2xl p-4 border border-gray-800">
        <div className="flex gap-3 flex-wrap">
          {[
            { icon: '🔁', label: 'Recaster', earned: user.points >= 100 },
            { icon: '👤', label: 'Follower', earned: user.points >= 150 },
            { icon: '💎', label: 'Wallet Linked', earned: !!user.walletAddress },
            { icon: '❤️', label: 'Liker', earned: user.points >= 200 },
          ].map((badge) => (
            <div key={badge.label} className={`flex flex-col items-center gap-1 ${!badge.earned ? 'opacity-30' : ''}`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl border ${
                badge.earned ? 'bg-red-950 border-red-800' : 'bg-gray-800 border-gray-700'
              }`}>
                {badge.icon}
              </div>
              <p className="text-xs text-gray-500">{badge.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
