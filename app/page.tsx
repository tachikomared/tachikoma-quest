'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/providers';
import { useConnect, useAccount } from 'wagmi';
import { sdk } from '@farcaster/miniapp-sdk';
import { TACHI_CONTRACT, ERC20_BALANCE_ABI, MOCK_REFERRAL_REWARDS, MOCK_LEADERBOARD } from '@/data/mocks';
import { useReadContract } from 'wagmi';

type Tab = 'missions' | 'warroom' | 'enlist' | 'pilot';
type MissionStatus = 'pending' | 'active' | 'completed' | 'failed';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'missions', label: 'MISSIONS', icon: '⚔️' },
  { id: 'warroom', label: 'WAR ROOM', icon: '📊' },
  { id: 'enlist', label: 'ENLIST', icon: '🔗' },
  { id: 'pilot', label: 'PILOT', icon: '🦀' },
];

export default function HomePage() {
  const { auth, isMiniApp } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('missions');
  const user = auth.status === 'authenticated' ? auth.user : null;

  return (
    <div className="min-h-screen bg-[#050508] text-[#f0f0f0] crt-flicker">
      {/* Warning Stripe Header */}
      <div className="warning-stripe" />
      
      {/* Main Header */}
      <header className="bg-[#0a0a0f] border-b border-[#1a1a24] sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🦀</div>
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
            {user && (
              <div className="bg-[#1a1a24] border border-[#ff1a1a]/30 rounded px-3 py-1.5">
                <div className="text-xs text-[#8a8a9a] font-mono">XP</div>
                <div className="text-[#ff6b00] font-black text-lg" style={{ fontFamily: 'Press Start 2P, monospace' }}>
                  {user.points?.toString().padStart(5, '0') || '00000'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Military Tab Bar */}
        <div className="flex border-t border-[#1a1a24] bg-[#0a0a0f]">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-xs font-black tracking-wider transition-all duration-300 border-b-2 ${
                activeTab === tab.id
                  ? 'text-[#ff1a1a] border-[#ff1a1a] bg-[#ff1a1a]/5'
                  : 'text-[#5a5a6a] border-transparent hover:text-[#8a8a9a]'
              }`}
              style={{ fontFamily: 'Share Tech Mono, monospace' }}
            >
              <span className="block text-lg mb-1">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-4 pb-24 damage-texture">
        {activeTab === 'missions' && <MissionsTab user={user} isMiniApp={isMiniApp} />}
        {activeTab === 'warroom' && <WarRoomTab user={user} />}
        {activeTab === 'enlist' && <EnlistTab user={user} isMiniApp={isMiniApp} />}
        {activeTab === 'pilot' && <PilotTab user={user} />}
      </main>

      {/* Footer Warning Stripe */}
      <div className="fixed bottom-0 left-0 right-0 warning-stripe" />
    </div>
  );
}

// Missions Tab Component
function MissionsTab({ user, isMiniApp }: { user: any; isMiniApp: boolean }) {
  const [missions, setMissions] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<Record<string, MissionStatus>>({});

  useEffect(() => {
    fetch('/api/quests').then(r => r.json()).then(d => setMissions(d.quests || []));
  }, []);

  const setStatus = (id: string, status: MissionStatus) => {
    setStatuses(s => ({ ...s, [id]: status }));
  };

  const executeMission = async (mission: any) => {
    setStatus(mission.id, 'active');
    
    if (mission.platform === 'x' && mission.target?.url) {
      if (isMiniApp) await sdk.actions.openUrl({ url: mission.target.url });
      else window.open(mission.target.url, '_blank');
      return;
    }

    if (mission.platform === 'farcaster') {
      if (mission.action === 'follow_user' && mission.target?.targetFid) {
        if (isMiniApp) await sdk.actions.viewProfile({ fid: mission.target.targetFid });
        else window.open(`https://warpcast.com/~/profiles/${mission.target.targetFid}`, '_blank');
      } else if (mission.target?.castHash) {
        if (isMiniApp) await sdk.actions.viewCast({ hash: mission.target.castHash });
        else window.open(mission.target.castUrl || `https://warpcast.com/~/casts/${mission.target.castHash}`, '_blank');
      }
    }
  };

  const verifyMission = async (mission: any) => {
    if (!user || mission.platform === 'x' || mission.verification === 'wallet_signature') return;
    setStatus(mission.id, 'active');
    try {
      const res = await fetch(`/api/quests/${mission.id}/verify`, { method: 'POST' });
      const data = await res.json();
      if (data.verified) setStatus(mission.id, 'completed');
      else setStatus(mission.id, 'failed');
    } catch {
      setStatus(mission.id, 'failed');
    }
  };

  return (
    <div className="space-y-4">
      {/* Pilot Status Card */}
      {user && (
        <div className="mission-card holographic">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative">
              <img 
                src={user.fcPfpUrl || '/default-avatar.png'} 
                alt="" 
                className="w-14 h-14 rounded border-2 border-[#ff1a1a]" 
              />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#39ff14] rounded-full border-2 border-[#050508] flex items-center justify-center">
                <span className="text-xs">✓</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[#39ff14] font-mono text-xs">PILOT:</span>
                <span className="font-bold text-[#f0f0f0]">@{user.fcUsername}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#8a8a9a] font-mono">
                <span>FID #{user.fcFid}</span>
                <span>•</span>
                <span className="text-[#ff6b00]">PVT</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#050508] border border-[#1a1a24] rounded p-2">
              <div className="text-[#8a8a9a] text-xs font-mono">XP RANK</div>
              <div className="text-[#ff6b00] font-black text-lg" style={{ fontFamily: 'Press Start 2P, monospace' }}>
                {user.points || 0}
              </div>
            </div>
            <div className="bg-[#050508] border border-[#1a1a24] rounded p-2">
              <div className="text-[#8a8a9a] text-xs font-mono">MISSIONS</div>
              <div className="text-[#00f0ff] font-black text-lg" style={{ fontFamily: 'Press Start 2P, monospace' }}>
                {missions.length}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mission Briefings */}
      <div className="flex items-center gap-2 text-[#ff1a1a] font-black text-sm tracking-widest">
        <span className="text-lg">⚔️</span>
        <span>ACTIVE MISSIONS</span>
        <div className="flex-1 h-px bg-[#ff1a1a]/30" />
      </div>
      
      {missions.map((mission) => {
        const status = statuses[mission.id] || 'pending';
        return (
          <div key={mission.id} className="mission-card glitch">
            <div className="flex items-start gap-3">
              <div className="text-3xl">{mission.icon || '⚡'}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-black text-sm tracking-wide">{mission.title}</span>
                  {status === 'completed' && (
                    <span className="text-xs bg-[#39ff14]/20 text-[#39ff14] px-2 py-0.5 rounded font-mono">
                      ✓ ACCOMPLISHED
                    </span>
                  )}
                  {status === 'active' && (
                    <span className="text-xs bg-[#00f0ff]/20 text-[#00f0ff] px-2 py-0.5 rounded font-mono animate-pulse">
                      ⏳ EXECUTING...
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#8a8a9a] mb-2">{mission.description}</p>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-[#ff6b00] font-bold">+{mission.points} XP</span>
                  <span className="text-[#5a5a6a]">•</span>
                  <span className="text-[#00f0ff]">🦀 {mission.tachiReward || 0} $TACHI</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 mt-4">
              {(mission.platform === 'farcaster' || mission.platform === 'x') && (
                <button 
                  onClick={() => executeMission(mission)}
                  className="mecha-button flex-1 text-xs"
                >
                  {mission.platform === 'x' ? '⚡ DEPLOY TO X' : '⚡ ENGAGE'}
                </button>
              )}
              {mission.platform === 'farcaster' && status !== 'completed' && (
                <button 
                  onClick={() => verifyMission(mission)}
                  disabled={status === 'active'}
                  className="mecha-button flex-1 text-xs bg-[#ff1a1a]/20"
                >
                  {status === 'active' ? '⏳ VERIFYING...' : '✓ CONFIRM'}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// War Room Tab (Leaderboard)
function WarRoomTab({ user }: { user: any }) {
  const [operatives, setOperatives] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/leaderboard').then(r => r.json()).then(d => setOperatives(d.entries || MOCK_LEADERBOARD));
  }, []);

  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'text-[#ff6b00] border-[#ff6b00]';
    if (rank === 2) return 'text-[#8a8a9a] border-[#8a8a9a]';
    if (rank === 3) return 'text-[#cd7f32] border-[#cd7f32]';
    return 'text-[#5a5a6a] border-[#1a1a24]';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-[#ff1a1a] font-black text-sm tracking-widest">
        <span className="text-lg">📊</span>
        <span>TOP OPERATIVES</span>
        <div className="flex-1 h-px bg-[#ff1a1a]/30" />
      </div>

      <div className="bg-[#0a0a0f] border border-[#1a1a24] rounded-lg overflow-hidden">
        {operatives.slice(0, 20).map((op, i) => (
          <div 
            key={i} 
            className={`flex items-center gap-3 p-3 ${i !== 0 ? 'border-t border-[#1a1a24]' : ''} ${
              op.username === user?.fcUsername ? 'bg-[#ff1a1a]/10' : ''
            }`}
          >
            <div className={`w-8 h-8 rounded border-2 flex items-center justify-center font-black text-sm ${getRankStyle(i + 1)}`}>
              {i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}
            </div>
            <div className="w-10 h-10 rounded bg-[#1a1a24] flex items-center justify-center text-lg border border-[#252535]">
              {op.username?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm">@{op.username || 'anon'}</p>
              <p className="text-xs text-[#5a5a6a] font-mono">OPERATIVE #{op.fid}</p>
            </div>
            <div className="text-right">
              <div className="text-[#ff6b00] font-black text-sm" style={{ fontFamily: 'Press Start 2P, monospace' }}>
                {op.xp || op.points || 0}
              </div>
              <div className="text-xs text-[#5a5a6a] font-mono">XP</div>
            </div>
          </div>
        ))}
      </div>

      {user && (
        <div className="mission-card">
          <div className="text-center">
            <div className="text-[#8a8a9a] text-xs font-mono mb-1">YOUR POSITION</div>
            <div className="text-[#ff1a1a] font-black text-2xl" style={{ fontFamily: 'Press Start 2P, monospace' }}>
              #{operatives.findIndex(o => o.username === user.fcUsername) + 1 || '???'}
            </div>
            <div className="text-[#5a5a6a] text-xs font-mono mt-1">
              {operatives.findIndex(o => o.username === user.fcUsername) > 10 
                ? 'CLIMB THE RANKS, PILOT' 
                : 'TOP 10 ELITE STATUS'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Enlist Tab (Referrals)
function EnlistTab({ user, isMiniApp }: { user: any; isMiniApp: boolean }) {
  const [copied, setCopied] = useState(false);
  const referralCode = user?.referralCode || 'NO-CODE';
  const referralLink = `${typeof window !== 'undefined' ? window.location.origin : ''}?ref=${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const text = `🦀 TACHI-QUEST // JOIN THE CRAB ARMY // Use my access key: ${referralCode} // Complete missions. Earn XP. Stack $TACHI.`;
    if (isMiniApp) {
      await sdk.actions.composeCast({ text });
    } else if (navigator.share) {
      navigator.share({ title: 'TACHI QUEST', text, url: referralLink });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-[#ff1a1a] font-black text-sm tracking-widest">
        <span className="text-lg">🔗</span>
        <span>ENLISTMENT</span>
        <div className="flex-1 h-px bg-[#ff1a1a]/30" />
      </div>

      {/* Squad Stats */}
      <div className="mission-card">
        <div className="grid grid-cols-3 gap-3 text-center mb-3">
          <div className="bg-[#050508] border border-[#1a1a24] rounded p-3">
            <div className="text-[#ff6b00] font-black text-xl" style={{ fontFamily: 'Press Start 2P, monospace' }}>0</div>
            <div className="text-[#5a5a6a] text-xs font-mono">ENLISTED</div>
          </div>
          <div className="bg-[#050508] border border-[#1a1a24] rounded p-3">
            <div className="text-[#39ff14] font-black text-xl" style={{ fontFamily: 'Press Start 2P, monospace' }}>0</div>
            <div className="text-[#5a5a6a] text-xs font-mono">ACTIVE</div>
          </div>
          <div className="bg-[#050508] border border-[#1a1a24] rounded p-3">
            <div className="text-[#00f0ff] font-black text-xl" style={{ fontFamily: 'Press Start 2P, monospace' }}>0</div>
            <div className="text-[#5a5a6a] text-xs font-mono">XP EARNED</div>
          </div>
        </div>
        <div className="text-center text-xs text-[#8a8a9a] font-mono">
          Earn <span className="text-[#ff6b00] font-bold">+200 XP</span> per active operative
        </div>
      </div>

      {/* Access Key */}
      <div className="mission-card border-[#00f0ff]">
        <div className="text-[#00f0ff] text-xs font-mono mb-2 tracking-wider">/// ACCESS KEY ///</div>
        <div className="bg-[#050508] border border-[#1a1a24] rounded p-4 mb-4">
          <div className="text-[#ff1a1a] font-mono text-center text-xl tracking-[0.5em] font-black">
            {referralCode}
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleCopy}
            className="mecha-button flex-1 text-xs"
          >
            {copied ? '✓ COPIED!' : '📋 COPY KEY'}
          </button>
          <button 
            onClick={handleShare}
            className="mecha-button flex-1 text-xs bg-[#00f0ff]/10 border-[#00f0ff]"
          >
            📡 BROADCAST
          </button>
        </div>
      </div>

      {/* Milestones */}
      <div className="flex items-center gap-2 text-[#ff1a1a] font-black text-sm tracking-widest">
        <span className="text-lg">🎯</span>
        <span>CAMPAIGN MILESTONES</span>
        <div className="flex-1 h-px bg-[#ff1a1a]/30" />
      </div>
      
      {MOCK_REFERRAL_REWARDS.map((reward) => (
        <div key={reward.milestone} className="mission-card opacity-60">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded bg-[#1a1a24] border border-[#252535] flex items-center justify-center text-2xl">
              🔒
            </div>
            <div className="flex-1">
              <p className="font-black text-sm">{reward.label}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[#ff6b00] text-xs font-bold">+{reward.xp} XP</span>
                <span className="text-[#5a5a6a]">•</span>
                <span className="text-[#00f0ff] text-xs">🦀 {reward.tachi} $TACHI</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[#5a5a6a] text-xs font-mono">0/{reward.milestone}</div>
              <div className="progress-container w-16 mt-1">
                <div className="progress-bar" style={{ width: '0%' }} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Pilot Tab (Profile)
function PilotTab({ user }: { user: any }) {
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
        <div className="text-6xl mb-4">🦀</div>
        <p className="text-[#8a8a9a] font-mono">AWAITING PILOT AUTHENTICATION</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-[#ff1a1a] font-black text-sm tracking-widest">
        <span className="text-lg">🦀</span>
        <span>PILOT PROFILE</span>
        <div className="flex-1 h-px bg-[#ff1a1a]/30" />
      </div>

      {/* Pilot Card */}
      <div className="mission-card border-[#ff1a1a]">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img 
              src={user.fcPfpUrl || '/default-avatar.png'} 
              alt="" 
              className="w-20 h-20 rounded border-4 border-[#ff1a1a]" 
            />
            {user.fcPowerBadge && (
              <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-[#39ff14] rounded-full border-2 border-[#050508] flex items-center justify-center">
                <span className="text-xs font-bold text-[#050508]">✓</span>
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-[#ff1a1a] text-[#050508] text-xs font-black px-2 py-0.5 rounded">PVT</span>
              <span className="text-[#8a8a9a] text-xs font-mono">FID #{user.fcFid}</span>
            </div>
            <p className="font-black text-lg">{user.fcDisplayName || user.fcUsername}</p>
            <p className="text-[#ff6b00] font-mono text-sm">@{user.fcUsername}</p>
          </div>
        </div>
        
        {user.fcBio && (
          <div className="mt-4 pt-4 border-t border-[#1a1a24]">
            <p className="text-sm text-[#8a8a9a]">{user.fcBio}</p>
          </div>
        )}
        
        {user.walletAddress && (
          <div className="mt-3 flex items-center gap-2 bg-[#050508] border border-[#1a1a24] rounded p-2">
            <div className="w-2 h-2 rounded-full bg-[#00f0ff] animate-pulse" />
            <span className="text-xs font-mono text-[#8a8a9a]">{truncateAddress(user.walletAddress)}</span>
            <span className="ml-auto text-xs bg-[#00f0ff]/20 text-[#00f0ff] px-2 py-0.5 rounded font-mono">BASE</span>
          </div>
        )}
      </div>

      {/* TACHI Vault */}
      <div className="mission-card border-[#00f0ff] bg-gradient-to-br from-[#00f0ff]/5 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#00f0ff]/10 border border-[#00f0ff] flex items-center justify-center text-2xl">
              🪙
            </div>
            <div>
              <p className="text-[#00f0ff] font-black text-sm tracking-wider">/// TACHI VAULT ///</p>
              <p className="text-[#5a5a6a] text-xs font-mono">{truncateAddress(TACHI_CONTRACT)}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[#00f0ff] font-black text-2xl" style={{ fontFamily: 'Press Start 2P, monospace' }}>
              {formatBalance(tachiBalance as bigint)}
            </p>
            <p className="text-[#5a5a6a] text-xs font-mono">$TACHI</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-[#1a1a24] flex justify-between items-center">
          <span className="text-[#8a8a9a] text-xs font-mono">MISSION XP</span>
          <span className="text-[#ff6b00] font-black" style={{ fontFamily: 'Press Start 2P, monospace' }}>
            {user.points || 0} XP
          </span>
        </div>
      </div>

      {/* Combat Stats */}
      <div className="flex items-center gap-2 text-[#ff1a1a] font-black text-sm tracking-widest">
        <span className="text-lg">📊</span>
        <span>COMBAT STATS</span>
        <div className="flex-1 h-px bg-[#ff1a1a]/30" />
      </div>
      
      <div className="mission-card">
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: user.fcFollowers?.toString() || '0', label: 'ALLIES' },
            { value: user.fcFollowing?.toString() || '0', label: 'TRACKING' },
            { value: user.points?.toString() || '0', label: 'XP', highlight: 'text-[#ff6b00]' },
          ].map(({ value, label, highlight }) => (
            <div key={label} className="text-center p-3 bg-[#050508] border border-[#1a1a24] rounded">
              <p className={`font-black text-lg ${highlight || 'text-[#f0f0f0]'}`} style={{ fontFamily: 'Press Start 2P, monospace' }}>
                {value}
              </p>
              <p className="text-xs text-[#5a5a6a] font-mono mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Medals */}
      <div className="flex items-center gap-2 text-[#ff1a1a] font-black text-sm tracking-widest">
        <span className="text-lg">🏅</span>
        <span>DECORATIONS</span>
        <div className="flex-1 h-px bg-[#ff1a1a]/30" />
      </div>
      
      <div className="mission-card">
        <div className="flex gap-3 flex-wrap">
          {[
            { icon: '🔁', label: 'RECASTER', earned: user.points >= 100 },
            { icon: '👤', label: 'FOLLOWER', earned: user.points >= 150 },
            { icon: '💎', label: 'WALLET LINKED', earned: !!user.walletAddress },
            { icon: '❤️', label: 'LIKER', earned: user.points >= 200 },
          ].map((medal) => (
            <div key={medal.label} className={`flex flex-col items-center gap-1 ${!medal.earned ? 'opacity-30' : ''}`}>
              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl border-2 ${
                medal.earned ? 'bg-[#ff1a1a]/20 border-[#ff1a1a]' : 'bg-[#1a1a24] border-[#252535]'
              }`}>
                {medal.icon}
              </div>
              <p className="text-xs text-[#5a5a6a] font-mono text-center">{medal.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
// FORCE UPDATE Mon Mar 16 22:31:48 +04 2026
