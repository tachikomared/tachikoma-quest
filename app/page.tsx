'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/providers';
import { useConnect, useAccount, useSignMessage, useDisconnect } from 'wagmi';
import { sdk } from '@farcaster/miniapp-sdk';
import { TACHI_CONTRACT, ERC20_BALANCE_ABI, MOCK_LEADERBOARD } from '@/data/mocks';
import { useReadContract } from 'wagmi';
import { useMobileWriteContract } from '@/hooks/useMobileWallet';
import { QuestReceiptModal } from '@/components/quest-receipt-modal';
import { StreakIndicator, DailyQuestCard } from '@/components/streak-indicator';
import { NotificationBell } from '@/components/notification-bell';

const formatNumber = (value: number | string, maxFractionDigits = 0) => {
  const num = Math.floor(Number(value || 0));
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: maxFractionDigits, useGrouping: false }).format(num);
};

type Tab = 'missions' | 'staking' | 'casino' | 'warroom' | 'enlist' | 'pilot';
type MissionStatus = 'pending' | 'active' | 'completed' | 'failed';

const TABS: { id: Tab; label: string; icon: string; note?: string }[] = [
  { id: 'missions', label: 'MISSIONS', icon: '⚔️' },
  { id: 'warroom', label: 'WAR ROOM', icon: '📊' },
  { id: 'enlist', label: 'ENLIST', icon: '🔗' },
  { id: 'pilot', label: 'PILOT', icon: '🦀' },
  { id: 'staking', label: 'STAKING', icon: '🪙', note: 'IN DEV' },
  { id: 'casino', label: 'CASINO', icon: '🎰', note: 'IN DEV' },
];

export default function HomePage() {
  const { auth, isMiniApp } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('missions');
  const user = auth.status === 'authenticated' ? auth.user : null;
  const isGuest = user?.fcFid === 0;
  const isAuthenticated = auth.status === 'authenticated';
  const streak = 0;
  const completedToday = false;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (!ref || auth.status !== 'authenticated') return;

    fetch('/api/referrals/attach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: ref }),
    }).catch(() => null);
  }, [auth.status]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab') as Tab | null;
    if (tab && TABS.some((t) => t.id === tab)) setActiveTab(tab);
  }, []);

  return (
    <div className="min-h-screen bg-[#050508] text-[#f0f0f0] crt-flicker">
      <div className="warning-stripe" />

      <header className="bg-[#0a0a0f] border-b border-[#1a1a24] sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="text-3xl"><img src="/crab-icon.png" alt="crab" className="inline-block align-middle w-4 h-4 object-contain" /></div>
              <div>
                <h1 className="text-lg font-black tracking-widest text-[#ff1a1a]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  TACHI-QUEST
                </h1>
                <div className="flex items-center gap-2 text-xs text-[#8a8a9a] font-mono">
                  <span className="w-2 h-2 rounded-full bg-[#39ff14] animate-pulse" />
                  SYSTEM ONLINE
                </div>
              </div>
            </div>
            {isAuthenticated && user && (
              <div className="flex items-center gap-2">
                {isGuest && (
                  <div className="bg-[#ff1a1a]/20 border border-[#ff1a1a] rounded px-2 py-1">
                    <span className="text-[10px] text-[#ff1a1a] font-bold">GUEST</span>
                  </div>
                )}
                <div className="bg-[#1a1a24] border border-[#ff1a1a]/30 rounded px-3 py-1.5">
                  <div className="text-xs text-[#8a8a9a] font-mono">XP</div>
                  <div className="text-[#ff6b00] font-black text-lg" style={{ fontFamily: 'Press Start 2P, monospace' }}>
                    {user.points?.toString().padStart(5, '0') || '00000'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex border-t border-[#1a1a24] bg-[#0a0a0f] overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[92px] py-3 text-xs font-black tracking-wider transition-all duration-300 border-b-2 ${
                activeTab === tab.id
                  ? 'text-[#ff1a1a] border-[#ff1a1a] bg-[#ff1a1a]/5'
                  : 'text-[#5a5a6a] border-transparent hover:text-[#8a8a9a]'
              }`}
              style={{ fontFamily: 'Share Tech Mono, monospace' }}
            >
              <span className="block text-lg mb-1">{tab.id === 'pilot' ? <img src="/crab-icon.png" alt="crab" className="inline-block align-middle w-4 h-4 object-contain mx-auto" /> : tab.icon}</span>
              {tab.label}
              {tab.note && <span className="block mt-1 text-[9px] text-[#8a8a9a]">{tab.note}</span>}
            </button>
          ))}
        </div>
      </header>


      <main className="max-w-lg mx-auto px-4 py-4 pb-24 damage-texture">
        {activeTab === 'missions' && <MissionsTab user={user} isMiniApp={isMiniApp} />}
        {activeTab === 'warroom' && <WarRoomTab user={user} isMiniApp={isMiniApp} />}
        {activeTab === 'enlist' && <EnlistTab user={user} isMiniApp={isMiniApp} />}
        {activeTab === 'pilot' && <PilotTab user={user} />}
      </main>

      <div className="fixed bottom-0 left-0 right-0 warning-stripe" />
    </div>
  );
}

function MissionsTab({ user, isMiniApp }: { user: any; isMiniApp: boolean; }) {
  const [missions, setMissions] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<Record<string, MissionStatus>>({});
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  // Re-syncing balance display and quest buttons to use a shared, correct numericBalance
  const [numericBalance, setNumericBalance] = useState(0);

  useEffect(() => {
    fetch('/api/token/balance')
      .then(r => r.json())
      .then(d => setNumericBalance(Number(d?.balance ?? d?.formattedBalance ?? 0)))
      .catch(() => null);
  }, []);

  const [receiptModal, setReceiptModal] = useState<{ isOpen: boolean; quest: any; }>({ isOpen: false, quest: null });
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { refreshAuth } = useAuth();

  // Helper to format tier labels
  const tieredHodlLabel = (min?: number) => {
    if (!min) return '✓ VERIFY';
    if (min >= 10000000000) return '✓ VERIFY 10B';
    if (min >= 1000000000) return '✓ VERIFY 1B';
    if (min >= 100000000) return '✓ VERIFY 100M';
    if (min >= 10000000) return '✓ VERIFY 10M';
    if (min >= 1000000) return '✓ VERIFY 1M';
    if (min >= 100000) return '✓ VERIFY 100K';
    if (min >= 10000) return '✓ VERIFY 10K';
    if (min >= 1000) return '✓ VERIFY 1K';
    return '✓ VERIFY 100';
  };

  const refreshCompletions = async () => {
    try {
      const res = await fetch('/api/quests/status');
      const data = await res.json();
      const completed = new Set<string>(data.completed || []);
      setCompletedIds(completed);
      setStatuses((prev) => {
        const next = { ...prev } as Record<string, MissionStatus>;
        completed.forEach((id) => { next[id] = 'completed'; });
        return next;
      });
    } catch {
      // ignore
    }
  };

  // Hardcoded missions — single source of truth until DB is reliable
  const defaultMissions = [
    { id: 'fc-follow-smolekoma', title: 'Follow @smolekoma', description: 'Follow @smolekoma on Farcaster', points: 150, icon: '👤', platform: 'farcaster', verification: 'fc_follow_user', action: 'follow_user', target: { targetFid: 2656205, profileUrl: 'https://farcaster.xyz/smolekoma' } },
    { id: 'fc-recast-launch', title: 'Recast Launch Cast', description: 'Recast the official TACHI Quest launch announcement', points: 250, icon: '🔄', platform: 'farcaster', verification: 'fc_cast_viewer_context', action: 'open_external', target: { castHash: '0x400e79ed5f99b2c9ac35c880fddf80672c3ea37a', castUrl: 'https://warpcast.com/smolekoma/0x400e79ed' } },
    { id: 'wallet-link', title: 'Link Base Wallet', description: 'Link a Base wallet for airdrop eligibility', points: 200, icon: '🔗', platform: 'wallet', verification: 'wallet_signature' },
    { id: 'hodl-100', title: 'HODL 100 $TACHI', description: 'Hold 100+ $TACHI in your linked wallet', points: 250, icon: '🪙', platform: 'wallet', verification: 'wallet_balance', target: { min: 100 } },
    { id: 'hodl-1k', title: 'HODL 1,000 $TACHI', description: 'Hold 1,000+ $TACHI in your linked wallet', points: 750, icon: '🪙', platform: 'wallet', verification: 'wallet_balance', target: { min: 1000 } },
    { id: 'hodl-10k', title: 'HODL 10,000 $TACHI', description: 'Hold 10,000+ $TACHI in your linked wallet', points: 1500, icon: '🪙', platform: 'wallet', verification: 'wallet_balance', target: { min: 10000 } },
    { id: 'hodl-100k', title: 'HODL 100,000 $TACHI', description: 'Hold 100,000+ $TACHI in your linked wallet', points: 3000, icon: '🪙', platform: 'wallet', verification: 'wallet_balance', target: { min: 100000 } },
    { id: 'hodl-1m', title: 'HODL 1,000,000 $TACHI', description: 'Hold 1,000,000+ $TACHI in your linked wallet', points: 10000, icon: '🪙', platform: 'wallet', verification: 'wallet_balance', target: { min: 1000000 } },
    { id: 'hodl-10m', title: 'HODL 10,000,000 $TACHI', description: 'Hold 10,000,000+ $TACHI in your linked wallet', points: 25000, icon: '🪙', platform: 'wallet', verification: 'wallet_balance', target: { min: 10000000 } },
    { id: 'hodl-100m', title: 'HODL 100,000,000 $TACHI', description: 'Hold 100,000,000+ $TACHI in your linked wallet', points: 50000, icon: '🪙', platform: 'wallet', verification: 'wallet_balance', target: { min: 100000000 } },
    { id: 'hodl-1b', title: 'HODL 1,000,000,000 $TACHI', description: 'Hold 1,000,000,000+ $TACHI in your linked wallet', points: 100000, icon: '🪙', platform: 'wallet', verification: 'wallet_balance', target: { min: 1000000000 } },
    { id: 'hodl-10b', title: 'HODL 10,000,000,000 $TACHI', description: 'Hold 10,000,000,000+ $TACHI in your linked wallet', points: 250000, icon: '🪙', platform: 'wallet', verification: 'wallet_balance', target: { min: 10000000000 } },
  ];

  useEffect(() => {
    // Prefer hardcoded list for UI stability until DB is fixed
    setMissions(defaultMissions);
    if (user) refreshCompletions();
  }, [user]);

  const setStatus = (id: string, status: MissionStatus) => setStatuses(s => ({ ...s, [id]: status }));

  const executeMission = async (mission: any) => {
    const openLink = async (url: string) => {
      if (isMiniApp && (sdk as any)?.actions?.openUrl) {
        await (sdk as any).actions.openUrl(url);
      } else if (typeof window !== 'undefined') {
        window.open(url, '_blank');
      }
    };

    if (mission.platform === 'x' && mission.target?.url) {
      await openLink(mission.target.url);
      return;
    }

    if (mission.platform === 'farcaster') {
      // For follow, try SDK's followUser if available, otherwise open profile URL
      if (mission.action === 'follow_user' && mission.target?.targetFid) {
        if (isMiniApp && (sdk as any)?.actions?.followUser) {
          await (sdk as any).actions.followUser({ fid: mission.target.targetFid });
        } else {
          await openLink(mission.target.profileUrl);
        }
      }
    }
  };

  const verifyMission = async (mission: any) => {
    if (!user || mission.platform === 'x') return;
    if (mission.verification === 'wallet_signature') {
      if (!isConnected || !address) return;
      await linkWalletForQuest(mission);
      return;
    }
    if (mission.verification === 'wallet_balance' || mission.verification === 'wallet_burn') {
      setStatus(mission.id, 'active');
      try {
        const res = await fetch(`/api/quests/${mission.id}/verify`, { method: 'POST' });
        const data = await res.json();
        const walletBalance = Number(data?.balance ?? data?.formattedBalance ?? 0);
        const threshold = Number(mission.target?.min || 0);
        const verified = mission.verification === 'wallet_burn' ? Boolean(data?.verified) : walletBalance >= threshold;
        if (verified) {
          setStatus(mission.id, 'completed');
          await refreshAuth();
          await refreshCompletions();
          setReceiptModal({ isOpen: true, quest: mission });
        } else setStatus(mission.id, 'failed');
      } catch {
        setStatus(mission.id, 'failed');
      }
      return;
    }

    setStatus(mission.id, 'active');
    try {
      const attemptVerify = async () => {
        const res = await fetch(`/api/quests/${mission.id}/verify`, { method: 'POST' });
        const data = await res.json().catch(() => ({}));
        return { ok: res.ok, data };
      };

      let verified = false;
      let result = await attemptVerify();
      verified = Boolean(result.data?.verified);
      if (!verified) {
        for (let i = 0; i < 5; i += 1) {
          await new Promise((resolve) => setTimeout(resolve, 8000));
          result = await attemptVerify();
          verified = Boolean(result.data?.verified);
          if (verified) break;
        }
      }

      if (verified) {
        setStatus(mission.id, 'completed');
        await refreshAuth();
        await refreshCompletions();
        setReceiptModal({ isOpen: true, quest: mission });
      } else setStatus(mission.id, 'failed');
    } catch {
      setStatus(mission.id, 'failed');
    }
  };

  const linkWalletForQuest = async (mission: any) => {
    if (!user || !address || !isConnected) return;
    setStatus(mission.id, 'active');
    try {
      const message = `Link wallet to TACHI Quest: ${user.fcFid}`;
      const signature = await signMessageAsync({ message });
      const res = await fetch('/api/wallet/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, message, signature }),
      });
      const data = await res.json();
      if (data.ok) {
        setStatus(mission.id, 'completed');
        await refreshAuth();
        await refreshCompletions();
        setReceiptModal({ isOpen: true, quest: mission });
      } else setStatus(mission.id, 'failed');
    } catch (e) {
      console.error('[wallet] Link failed:', e);
      setStatus(mission.id, 'failed');
    }
  };

  return (
    <div className="space-y-4">
      {user && (
        <div className="mission-card holographic">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative">
              <img src={user.fcPfpUrl || '/default-avatar.png'} alt="" className="w-14 h-14 rounded border-2 border-[#ff1a1a] object-cover bg-[#1a1a24]" onError={(e) => { (e.target as HTMLImageElement).src = '/guest-avatar.jpg'; }} />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#39ff14] rounded-full border-2 border-[#050508] flex items-center justify-center"><span className="text-xs">✓</span></div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2"><span className="text-[#39ff14] font-mono text-xs">PILOT:</span><span className="font-bold text-[#f0f0f0]">@{user.fcUsername}</span></div>
              <div className="flex items-center gap-2 text-xs text-[#8a8a9a] font-mono"><span>FID #{user.fcFid}</span><span>•</span><span className="text-[#ff6b00]">PVT</span></div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#050508] border border-[#1a1a24] rounded p-2"><div className="text-[#8a8a9a] text-xs font-mono">XP RANK</div><div className="text-[#ff6b00] font-black text-lg" style={{ fontFamily: 'Press Start 2P, monospace' }}>{user.points || 0}</div></div>
            <div className="bg-[#050508] border border-[#1a1a24] rounded p-2"><div className="text-[#8a8a9a] text-xs font-mono">MISSIONS</div><div className="text-[#00f0ff] font-black text-lg" style={{ fontFamily: 'Press Start 2P, monospace' }}>{missions.length}</div></div>
          </div>
        </div>
      )}

      {user && <DailyQuestCard streak={0} completedToday={false} onComplete={() => document.querySelector('.mission-card')?.scrollIntoView({ behavior: 'smooth' })} />}

      <div className="flex items-center gap-2 text-[#ff1a1a] font-black text-sm tracking-widest"><span className="text-lg">⚔️</span><span>ACTIVE MISSIONS</span><div className="flex-1 h-px bg-[#ff1a1a]/30" /></div>
      <div className="text-[10px] text-[#8a8a9a] font-mono">Each mission is a deployable objective. Complete, verify, then flex like you meant it.</div>

      {missions.map((mission) => {
        const status = statuses[mission.id] || 'pending';
        return (
          <div key={mission.id} className="mission-card glitch">
            <div className="flex items-start gap-3">
              <div className="text-3xl">{mission.icon || '⚡'}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-black text-sm tracking-wide">{mission.title}</span>
                  {status === 'completed' && <span className="text-xs bg-[#39ff14]/20 text-[#39ff14] px-2 py-0.5 rounded font-mono">✓ ACCOMPLISHED</span>}
                  {status === 'active' && <span className="text-xs bg-[#00f0ff]/20 text-[#00f0ff] px-2 py-0.5 rounded font-mono animate-pulse">⏳ EXECUTING...</span>}
                </div>
                <p className="text-xs text-[#8a8a9a] mb-2">{mission.description}</p>
                <div className="flex items-center gap-3 text-xs"><span className="text-[#ff6b00] font-bold">+{mission.points} XP</span><span className="text-[#5a5a6a]">•</span><span className="text-[#00f0ff]">XP ONLY</span></div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              {mission.platform === 'wallet' && mission.verification === 'wallet_signature' && (
                !isConnected ? (
                  <button onClick={() => connect({ connector: connectors[0] })} disabled={isConnecting} className="mecha-button flex-1 text-xs bg-[#00f0ff]/10 border-[#00f0ff]">{isConnecting ? '⏳ CONNECT...' : '🔗 CONNECT WALLET'}</button>
                ) : status !== 'completed' ? (
                  <button onClick={() => linkWalletForQuest(mission)} disabled={status === 'active' || completedIds.has(mission.id)} className="mecha-button flex-1 text-xs bg-[#39ff14]/10 border-[#39ff14]">{status === 'active' ? '⏳ LINKING...' : completedIds.has(mission.id) ? '✅ DONE' : '✓ LINK WALLET'}</button>
                ) : null
              )}

              {(mission.platform === 'farcaster' || mission.platform === 'x') && (
                <>
                  <button onClick={() => executeMission(mission)} className="mecha-button flex-1 text-xs bg-[#00f0ff]/10 border-[#00f0ff]" disabled={completedIds.has(mission.id)}>
                    {completedIds.has(mission.id) ? '✅ OPENED' : mission.platform === 'x' ? '↗ OPEN' : '⚡ OPEN'}
                  </button>
                  <button onClick={() => verifyMission(mission)} disabled={status === 'active' || completedIds.has(mission.id)} className="mecha-button flex-1 text-xs bg-[#ff1a1a]/20">
                    {status === 'active' ? '⏳ VERIFYING...' : completedIds.has(mission.id) ? '✅ VERIFIED' : '✓ VERIFY'}
                  </button>
                </>
              )}

              {mission.platform === 'wallet' && mission.verification === 'wallet_balance' && (
                <button disabled={true} className={`mecha-button flex-1 text-xs ${numericBalance >= (mission.target?.min || 0) ? 'bg-[#39ff14]/10 border-[#39ff14] text-[#39ff14]' : 'bg-[#5a5a6a]/10 border-[#5a5a6a] text-[#8a8a9a]'}`}>
                  {numericBalance >= (mission.target?.min || 0) ? '✅ ACHIEVED' : '🔒 LOCKED'}
                </button>
              )}

              {mission.platform === 'wallet' && mission.verification === 'wallet_burn' && (
                <button onClick={() => verifyMission(mission)} disabled={status === 'active' || completedIds.has(mission.id)} className="mecha-button flex-1 text-xs bg-[#ff1a1a]/20">{status === 'active' ? '⏳ VERIFYING...' : completedIds.has(mission.id) ? '✅ VERIFIED' : '✓ VERIFY BURN'}</button>
              )}

              {mission.platform === 'farcaster' && mission.verification === 'fc_follow_user' && (
                <button onClick={() => verifyMission(mission)} disabled={status === 'active' || completedIds.has(mission.id)} className="mecha-button flex-1 text-xs bg-[#ff1a1a]/20">{status === 'active' ? '⏳ VERIFYING...' : completedIds.has(mission.id) ? '✅ VERIFIED' : '✓ VERIFY FOLLOW'}</button>
              )}
            </div>
          </div>
        );
      })}

      <QuestReceiptModal isOpen={receiptModal.isOpen} onClose={() => setReceiptModal({ isOpen: false, quest: null })} quest={receiptModal.quest} user={user} isMiniApp={isMiniApp} />
    </div>
  );
}

function StakingTab({ user }: { user: any }) {
  return (
    <div className="space-y-4">
      <div className="mission-card border-[#39ff14]/30">
        <div className="text-[#39ff14] font-black text-sm tracking-widest mb-2">🪙 STAKING / POOL</div>
        <p className="text-xs text-[#8a8a9a] mb-3">Staking lives here next. Keep the surface visible while the pool actions are wired in.</p>
        <div className="text-[10px] text-[#5a5a6a] font-mono">{user ? `Connected as @${user.fcUsername || 'guest'}` : 'Authenticate to access staking.'}</div>
      </div>
    </div>
  );
}

function CasinoTab() {
  return (
    <div className="mission-card">
      <div className="text-[#ff1a1a] font-black text-sm tracking-widest mb-2">🎰 CASINO / GAMES</div>
      <p className="text-xs text-[#8a8a9a]">Games surface reserved. Wire the actual mini-game or contract flow here when ready.</p>
    </div>
  );
}

function WarRoomTab({ user, isMiniApp }: { user: any; isMiniApp: boolean }) {
  const [operatives, setOperatives] = useState<any[]>([]);
  const [holders, setHolders] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/leaderboard').then(r => r.json()).then(d => setOperatives(d.entries || MOCK_LEADERBOARD));
    fetch('/api/token/holders').then(r => r.json()).then(d => setHolders(d.holders || [])).catch(() => setHolders([]));
  }, []);

  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'text-[#00f0ff] border-[#00f0ff]';
    if (rank === 2) return 'text-[#39ff14] border-[#39ff14]';
    if (rank === 3) return 'text-[#ff6b00] border-[#ff6b00]';
    return 'text-[#5a5a6a] border-[#1a1a24]';
  };

  const getHolderTier = (balance: string, rank: number) => {
    const bal = Number(balance);
    if (rank === 1) return { label: 'TACHIKOMA PRIME', color: 'text-[#00f0ff] border-[#00f0ff] bg-[#00f0ff]/10' };
    if (rank <= 3) return { label: 'MECHA ACE', color: 'text-[#39ff14] border-[#39ff14] bg-[#39ff14]/10' };
    if (rank <= 10) return { label: 'GHOST PILOT', color: 'text-[#ff6b00] border-[#ff6b00] bg-[#ff6b00]/10' };
    if (bal >= 1000) return { label: 'STEALTH DRONE', color: 'text-[#ff1a1a] border-[#ff1a1a] bg-[#ff1a1a]/10' };
    if (bal >= 500) return { label: 'CHASSIS', color: 'text-[#8a8a9a] border-[#8a8a9a] bg-[#8a8a9a]/10' };
    return { label: 'PROTOCRAB', color: 'text-[#5a5a6a] border-[#5a5a6a] bg-[#5a5a6a]/10' };
  };

  return (
    <div className="space-y-4">
      <div className="mission-card">
        <div className="flex items-center gap-2 text-[#ff1a1a] font-black text-sm tracking-widest mb-3"><span className="text-lg"><img src="/crab-icon.png" alt="crab" className="inline-block align-middle w-4 h-4 object-contain" /></span><span>TOKEN HOLDERS</span><div className="flex-1 h-px bg-[#ff1a1a]/30" /></div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {[
            { label: 'TACHIKOMA PRIME', color: 'text-[#00f0ff] border-[#00f0ff]/50' },
            { label: 'MECHA ACE', color: 'text-[#39ff14] border-[#39ff14]/50' },
            { label: 'GHOST PILOT', color: 'text-[#ff6b00] border-[#ff6b00]/50' },
            { label: 'STEALTH DRONE', color: 'text-[#ff1a1a] border-[#ff1a1a]/50' },
          ].map((tier) => <span key={tier.label} className={`text-[8px] px-1.5 py-0.5 border rounded ${tier.color}`}>{tier.label}</span>)}
        </div>
        {holders.length === 0 ? <div className="text-xs text-[#5a5a6a] font-mono">NO HOLDER DATA YET</div> : (
          <div className="space-y-2">
            {holders.map((holder, i) => {
              const tier = getHolderTier(holder.balance, i + 1);
              const displayName = holder.username ? `@${holder.username}` : holder.ens || `${holder.address?.slice(0, 6)}...${holder.address?.slice(-4)}`;
              const tierAvatar = i === 0 ? '/diamond.png' : i === 1 ? '/gold.png' : i === 2 ? '/silver.png' : '/bronze.png';
              return (
                <a key={`${holder.address}-${i}`} href={`https://basescan.org/address/${holder.address}`} target="_blank" rel="noreferrer" className={`flex items-center gap-3 p-2 border rounded ${holder.username === user?.fcUsername ? 'bg-[#ff1a1a]/10 border-[#ff1a1a]/30' : 'bg-[#050508] border-[#1a1a24]'} hover:border-[#ff1a1a]/40 transition-colors`}>
                  <div className="flex flex-col items-center"><div className={`w-7 h-7 rounded border-2 flex items-center justify-center font-black text-[10px] ${i < 3 ? 'text-[#ff6b00] border-[#ff6b00]' : 'text-[#5a5a6a] border-[#1a1a24]'}`}>{i + 1}</div></div>
                  <div className="w-8 h-8 rounded bg-[#1a1a24] border border-[#252535] overflow-hidden"><img src={tierAvatar} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = '/default-avatar.png'; }} /></div>
                  <div className="flex-1 min-w-0"><div className="flex items-center gap-1.5"><span className="text-xs font-bold truncate">{displayName}</span><span className={`text-[7px] px-1 py-0.5 border rounded ${tier.color}`}>{tier.label}</span></div><div className="text-[9px] text-[#5a5a6a] font-mono">{holder.fid ? `FID ${holder.fid}` : 'UNLINKED WALLET'}</div></div>
                  <div className="text-right"><div className="text-[#39ff14] font-black text-xs" style={{ fontFamily: 'Press Start 2P, monospace' }}>{formatNumber(holder.balance, 0)}</div><div className="text-[9px] text-[#5a5a6a] font-mono">$TACHI</div>{holder.balanceUsd && <div className="text-[8px] text-[#ff6b00] font-mono">${Number(holder.balanceUsd).toFixed(0)}</div>}</div>
                </a>
              );
            })}
          </div>
        )}
        {user && <button onClick={async () => { const rank = holders.findIndex(h => h.username === user.fcUsername) + 1; const holder = holders.find(h => h.username === user.fcUsername); const tier = holder ? getHolderTier(holder.balance, rank) : { label: 'CRAB' }; const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://tachi-quest.vercel.app'}?tab=warroom`; const text = `<img src="/crab-icon.png" alt="crab" className="inline-block align-middle w-4 h-4 object-contain" /> Check out the $TACHI Holders Leaderboard! Rank #${rank || '???'} ${tier.label} // Holding ${holder?.balance || '0'} $TACHI`; if (isMiniApp && typeof window !== 'undefined' && (window as any).sdk?.actions?.composeCast) { const embedUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://tachi-quest.vercel.app'}?tab=warroom`; const footer = `\n\n🎮 ${typeof window !== 'undefined' ? window.location.origin : 'https://tachi-quest.vercel.app'}`; await (window as any).sdk.actions.composeCast({ text: text + footer, embeds: [embedUrl] }); } else { const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent); const encodedText = encodeURIComponent(text); const encodedEmbed = encodeURIComponent(shareUrl); if (isMobile) { const deepLink = `warpcast://compose?text=${encodedText}&embeds[]=${encodedEmbed}`; window.location.href = deepLink; setTimeout(() => { window.open(`https://warpcast.com/~/compose?text=${encodedText}&embeds[]=${encodedEmbed}`, '_blank'); }, 2000); } else { window.open(`https://warpcast.com/~/compose?text=${encodedText}&embeds[]=${encodedEmbed}`, '_blank'); } } }} className="mt-4 mecha-button w-full text-xs bg-[#ff1a1a]/10 border-[#ff1a1a]">📡 BROADCAST LEADERBOARD</button>}
      </div>

      <div className="flex items-center gap-2 text-[#ff1a1a] font-black text-sm tracking-widest"><span className="text-lg">📊</span><span>TOP OPERATIVES</span><div className="flex-1 h-px bg-[#ff1a1a]/30" /></div>
      <div className="bg-[#0a0a0f] border border-[#1a1a24] rounded-lg overflow-hidden">
        {operatives.slice(0, 20).map((op, i) => (
          <div key={i} className={`flex items-center gap-3 p-3 ${i !== 0 ? 'border-t border-[#1a1a24]' : ''} ${op.username === user?.fcUsername ? 'bg-[#ff1a1a]/10' : ''}`}>
            <div className={`w-8 h-8 rounded border-2 flex items-center justify-center font-black text-sm ${getRankStyle(i + 1)}`}>{i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}</div>
            <div className="w-10 h-10 rounded bg-[#1a1a24] flex items-center justify-center text-lg border border-[#252535]">{op.username?.[0]?.toUpperCase() || '?'}</div>
            <div className="flex-1"><p className="font-bold text-sm">@{op.username || 'anon'}</p><p className="text-xs text-[#5a5a6a] font-mono">OPERATIVE #{op.fid}</p></div>
            <div className="text-right"><div className="text-[#ff6b00] font-black text-sm" style={{ fontFamily: 'Press Start 2P, monospace' }}>{op.xp || op.points || 0}</div><div className="text-xs text-[#5a5a6a] font-mono">XP</div></div>
          </div>
        ))}
      </div>
      {user && <div className="mission-card"><div className="text-center"><div className="text-[#8a8a9a] text-xs font-mono mb-1">YOUR POSITION</div><div className="text-[#ff1a1a] font-black text-2xl" style={{ fontFamily: 'Press Start 2P, monospace' }}>#{operatives.findIndex(o => o.username === user.fcUsername) + 1 || '???'}</div><div className="text-[#5a5a6a] text-xs font-mono mt-1">{operatives.findIndex(o => o.username === user.fcUsername) > 10 ? 'CLIMB THE RANKS, PILOT' : 'TOP 10 ELITE STATUS'}</div></div></div>}
    </div>
  );
}

function EnlistTab({ user, isMiniApp }: { user: any; isMiniApp: boolean }) {
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [stats, setStats] = useState({ enlisted: 0, active: 0, xpEarned: 0, recruits: [] as any[] });
  const [statsLoading, setStatsLoading] = useState(false);
  const referralCode = user?.referralCode || 'NO-CODE';
  const referralLink = `${typeof window !== 'undefined' ? window.location.origin : ''}?ref=${referralCode}`;
  const remainingInvites = Math.max(0, (user?.inviteLimit ?? 5) - (user?.invitesUsed ?? 0));

  useEffect(() => {
    if (!user) return;
    setStatsLoading(true);
    fetch('/api/referrals/stats')
      .then(r => r.json())
      .then(d => {
        setStats({
          enlisted: d.enlisted || 0,
          active: d.active || 0,
          xpEarned: d.xpEarned || 0,
          recruits: d.recruits || [],
        });
      })
      .catch(() => null)
      .finally(() => setStatsLoading(false));
  }, [user?.id]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleShare = async () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.origin : 'https://tachi-quest.vercel.app';
    const text = `<img src="/crab-icon.png" alt="crab" className="inline-block align-middle w-4 h-4 object-contain" /> TACHI-QUEST // JOIN THE CRAB ARMY // Use my access key: ${referralCode} // Complete missions. Earn XP. Stack $TACHI.\n\n🎮 ${shareUrl}`;
    if (isMiniApp) {
      await sdk.actions.composeCast({ text, embeds: [shareUrl] });
    } else if (navigator.share) {
      navigator.share({ title: 'TACHI QUEST', text, url: shareUrl });
    }
  };

  return (
    <div className="space-y-4">

      <div className="flex items-center gap-2 text-[#ff1a1a] font-black text-sm tracking-widest">
        <span className="text-lg">🔗</span>
        <span>ENLISTMENT</span>
        <div className="flex-1 h-px bg-[#ff1a1a]/30" />
      </div>
      <div className="mission-card">
        <div className="grid grid-cols-3 gap-3 text-center mb-3">
          <div className="bg-[#050508] border border-[#1a1a24] rounded p-3"><div className="text-[#ff6b00] font-black text-xl" style={{ fontFamily: 'Press Start 2P, monospace' }}>{statsLoading ? '...' : stats.enlisted}</div><div className="text-[#5a5a6a] text-xs font-mono">ENLISTED</div></div>
          <div className="bg-[#050508] border border-[#1a1a24] rounded p-3"><div className="text-[#39ff14] font-black text-xl" style={{ fontFamily: 'Press Start 2P, monospace' }}>{statsLoading ? '...' : stats.active}</div><div className="text-[#5a5a6a] text-xs font-mono">ACTIVE</div></div>
          <div className="bg-[#050508] border border-[#1a1a24] rounded p-3"><div className="text-[#00f0ff] font-black text-xl" style={{ fontFamily: 'Press Start 2P, monospace' }}>{statsLoading ? '...' : stats.xpEarned}</div><div className="text-[#5a5a6a] text-xs font-mono">XP EARNED</div></div>
        </div>
        <div className="text-center text-xs text-[#8a8a9a] font-mono">Earn <span className="text-[#ff6b00] font-bold">+100 XP</span> per qualified operative</div>
      </div>
      <div className="mission-card border-[#00f0ff]">
        <div className="text-[#00f0ff] text-xs font-mono mb-2 tracking-wider">/// REFERRAL LINK ///</div>
        <div className="text-[10px] text-[#8a8a9a] font-mono mb-2">Remaining invites: {remainingInvites}/5</div>
        <div className="bg-[#050508] border border-[#1a1a24] rounded p-3 mb-3 overflow-hidden"><div className="text-[#ff1a1a] font-mono text-sm truncate">{referralLink}</div></div>
        <div className="grid grid-cols-2 gap-2 mb-3"><button onClick={handleCopyLink} className="mecha-button text-xs">{linkCopied ? '✓ LINK COPIED!' : '📋 COPY LINK'}</button><button onClick={handleShare} className="mecha-button text-xs bg-[#00f0ff]/10 border-[#00f0ff]">📡 BROADCAST</button></div>
        <div className="bg-[#1a1a24]/50 border border-[#252535] rounded p-3"><div className="text-[#8a8a9a] text-xs font-mono mb-1">ACCESS KEY</div><div className="flex items-center justify-between gap-2"><span className="text-[#f0f0f0] font-mono font-bold tracking-wider">{referralCode}</span><button onClick={handleCopyCode} className="text-[10px] bg-[#252535] hover:bg-[#353545] px-2 py-1 rounded text-[#8a8a9a]">{copied ? '✓' : 'COPY'}</button></div></div>
      </div>
      <div className="flex items-center gap-2 text-[#ff1a1a] font-black text-sm tracking-widest"><span className="text-lg">👥</span><span>NEW RECRUITS</span><div className="flex-1 h-px bg-[#ff1a1a]/30" /></div>
      {stats.recruits.length === 0 ? <div className="mission-card text-center text-xs text-[#5a5a6a] font-mono">No recruits yet. Share your access key to enlist operatives.</div> : <div className="bg-[#0a0a0f] border border-[#1a1a24] rounded-lg overflow-hidden">{stats.recruits.map((r, i) => (<div key={r.id} className={`flex items-center gap-3 p-3 ${i !== 0 ? 'border-t border-[#1a1a24]' : ''}`}><div className="w-8 h-8 rounded bg-[#1a1a24] flex items-center justify-center text-sm">{r.fc_username ? r.fc_username[0]?.toUpperCase() : '👤'}</div><div className="flex-1"><div className="text-sm font-bold">{r.fc_username ? `@${r.fc_username}` : 'Guest Pilot'}</div><div className="text-[10px] text-[#5a5a6a] font-mono">{r.fc_fid ? `FID ${r.fc_fid}` : 'WALLET MODE'}</div></div><div className="text-[10px] text-[#5a5a6a] font-mono">{new Date(r.created_at).toLocaleDateString()}</div></div>))}</div>}
    </div>
  );
}

function PilotTab({ user }: { user: any }) {
  const [mounted, setMounted] = useState(false);
  const { address } = useAccount();
  const [fastBalance, setFastBalance] = useState<string>('0');
  const [fastBalanceLoading, setFastBalanceLoading] = useState<boolean>(false);
  const { disconnect } = useDisconnect();
  const { data: tachiBalance } = useReadContract({
    address: TACHI_CONTRACT as `0x${string}`,
    abi: [{ inputs: [{ name: 'account', type: 'address' }], name: 'balanceOf', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' }],
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (!user?.walletAddress) return;
    setFastBalanceLoading(true);
    fetch('/api/token/balance')
      .then(r => r.json())
      .then(d => {
        const balance = d?.balance ?? d?.formattedBalance ?? '0';
        setFastBalance(String(balance));
      })
      .catch(() => null)
      .finally(() => setFastBalanceLoading(false));
  }, [user?.walletAddress]);

  if (!user) return null;
  const numericBalance = tachiBalance ? (Number(tachiBalance) / 1e18) : Number(fastBalance || '0');
  const formattedBalance = numericBalance.toFixed(0);
  const displayBalance = formatNumber(numericBalance, 0);

  const tieredHodlLabel = (min?: number) => {
    if (!min) return '✓ VERIFY';
    if (min >= 10000000000) return '✓ VERIFY 10B';
    if (min >= 1000000000) return '✓ VERIFY 1B';
    if (min >= 100000000) return '✓ VERIFY 100M';
    if (min >= 10000000) return '✓ VERIFY 10M';
    if (min >= 1000000) return '✓ VERIFY 1M';
    if (min >= 100000) return '✓ VERIFY 100K';
    if (min >= 10000) return '✓ VERIFY 10K';
    if (min >= 1000) return '✓ VERIFY 1K';
    return '✓ VERIFY 100';
  };

  const getHodlTier = (balance: number) => {
    if (balance >= 10000000000) return { label: '10B HODL LVL', color: 'text-[#00f0ff] border-[#00f0ff] bg-[#00f0ff]/10' };
    if (balance >= 1000000000) return { label: '1B HODL LVL', color: 'text-[#39ff14] border-[#39ff14] bg-[#39ff14]/10' };
    if (balance >= 100000000) return { label: '100M HODL LVL', color: 'text-[#ff6b00] border-[#ff6b00] bg-[#ff6b00]/10' };
    if (balance >= 10000000) return { label: '10M HODL LVL', color: 'text-[#ff1a1a] border-[#ff1a1a] bg-[#ff1a1a]/10' };
    if (balance >= 1000000) return { label: '1M HODL LVL', color: 'text-[#00f0ff] border-[#00f0ff] bg-[#00f0ff]/10' };
    if (balance >= 100000) return { label: '100K HODL LVL', color: 'text-[#39ff14] border-[#39ff14] bg-[#39ff14]/10' };
    if (balance >= 10000) return { label: '10K HODL LVL', color: 'text-[#ff6b00] border-[#ff6b00] bg-[#ff6b00]/10' };
    if (balance >= 1000) return { label: '1K HODL LVL', color: 'text-[#ff1a1a] border-[#ff1a1a] bg-[#ff1a1a]/10' };
    if (balance >= 100) return { label: '100 HODL LVL', color: 'text-[#00f0ff] border-[#00f0ff] bg-[#00f0ff]/10' };
    return { label: 'NO HODL', color: 'text-[#5a5a6a] border-[#5a5a6a] bg-[#5a5a6a]/10' };
  };

  const hodlTier = getHodlTier(numericBalance);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-[#ff1a1a] font-black text-sm tracking-widest"><span className="text-lg">🦀</span><span>PILOT PROFILE</span><div className="flex-1 h-px bg-[#ff1a1a]/30" /></div>
      <div className="inline-flex items-center gap-2 text-[10px] font-mono px-2 py-1 rounded border border-[#00f0ff]/30 text-[#00f0ff] bg-[#00f0ff]/10 mb-1">{user.fcFid === 0 ? 'INVITE / TRUST GATED' : user.fcPowerBadge ? 'VERIFIED BLUE CHECK' : (Number(user.fcScore || 0) >= 0.8 ? 'TRUSTED USER' : 'DEGEN MODE')}</div>
      <div className="mission-card text-center">
        <div className="relative inline-block mb-4">
          <img src={user.fcPfpUrl || '/default-avatar.png'} alt="" className="w-24 h-24 rounded-full border-4 border-[#ff1a1a] mx-auto object-cover bg-[#1a1a24]" onError={(e) => { (e.target as HTMLImageElement).src = '/guest-avatar.jpg'; }} />
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#ff1a1a] text-[#050508] px-3 py-1 rounded-full text-xs font-black">PILOT</div>
        </div>
        <h2 className="text-xl font-black mb-1">{user.fcFid === 0 ? '👤 Guest Pilot' : `@${user.fcUsername}`}</h2>
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className={`text-[8px] px-2 py-0.5 border rounded ${hodlTier.color}`}>{hodlTier.label}</span>
        </div>
        <p className="text-[#8a8a9a] text-xs font-mono mb-4">{user.fcFid === 0 ? 'WALLET MODE' : `FID #${user.fcFid}`}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="mission-card text-center"><div className="text-[#8a8a9a] text-xs font-mono mb-1">TOTAL XP</div><div className="text-[#ff6b00] font-black text-2xl" style={{ fontFamily: 'Press Start 2P, monospace' }}>{user.points || 0}</div></div>
        <div className="mission-card text-center"><div className="text-[#8a8a9a] text-xs font-mono mb-1">MISSIONS</div><div className="text-[#00f0ff] font-black text-2xl" style={{ fontFamily: 'Press Start 2P, monospace' }}>{user.completions?.length || 0}</div></div>
        <div className="mission-card text-center"><div className="text-[#8a8a9a] text-xs font-mono mb-1">WALLET</div><div className="text-[#39ff14] font-black text-lg" style={{ fontFamily: 'Press Start 2P, monospace' }}>{user.walletAddress ? 'LINKED' : 'NONE'}</div></div>
        <div className="mission-card text-center"><div className="text-[#8a8a9a] text-xs font-mono mb-1">$TACHI</div><div className="text-[#ff1a1a] font-black text-2xl" style={{ fontFamily: 'Press Start 2P, monospace' }}>{mounted ? (fastBalanceLoading ? '...' : displayBalance) : '---'}</div></div>
      </div>
      <div className="mission-card">
        <div className="text-[#00f0ff] text-xs font-mono mb-3 tracking-wider">/// WALLET STATUS ///</div>
        {user.walletAddress ? (
          <div className="space-y-3">
            <div className="text-[10px] text-[#8a8a9a] font-mono">STAKING MODULE COMING NEXT. THIS SLOT IS RESERVED FOR POOL ACTIONS.</div>
            <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-[#39ff14]/20 flex items-center justify-center"><span className="text-[#39ff14] text-lg">✓</span></div><div className="flex-1"><div className="text-sm font-bold">Wallet Connected</div><div className="text-xs text-[#8a8a9a] font-mono">{user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}</div></div></div>
            <button onClick={async () => { try { disconnect(); await fetch('/api/auth/logout', { method: 'POST' }); window.location.reload(); } catch (e) { console.error('Disconnect failed:', e); } }} className="w-full bg-[#ff1a1a]/20 border border-[#ff1a1a] text-[#ff1a1a] font-bold py-2 rounded-lg text-xs">DISCONNECT WALLET + LOGOUT</button>
          </div>
        ) : (
          <div className="text-center py-4"><div className="text-[#5a5a6a] text-sm mb-3">No wallet linked</div><p className="text-xs text-[#8a8a9a] font-mono mb-4">Link your wallet to receive $TACHI airdrops</p></div>
        )}
      </div>
      <div className="mission-card">
        <div className="text-[#ff1a1a] text-xs font-mono mb-2 tracking-wider">/// BURN $TACHI ///</div>
        <div className="text-[10px] text-[#8a8a9a] font-mono">Burning is in development. This slot is reserved and currently inactive.</div>
      </div>
      <div className="mission-card"><div className="text-[#00f0ff] text-xs font-mono mb-2 tracking-wider">/// YOUR ACCESS KEY ///</div><div className="bg-[#050508] border border-[#1a1a24] rounded p-3 text-center"><code className="text-[#ff1a1a] font-mono text-lg tracking-wider">{user.referralCode}</code></div></div>
    </div>
  );
}

