'use client';

import { useEffect, useMemo, useState } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';
import { useConnect, useAccount, useSignMessage } from 'wagmi';

type QuestStatus = 'idle' | 'opened' | 'verifying' | 'verified' | 'failed';

type Quest = {
  id: string;
  title: string;
  description: string;
  platform: string;
  action: string;
  verification: string;
  points: number;
  target: Record<string, any>;
};

type User = {
  id: string;
  fc_fid: number;
  fc_username: string | null;
  fc_display_name: string | null;
  fc_pfp_url: string | null;
  fc_bio: string | null;
  fc_score: number | null;
  referral_code: string;
  points: number;
};

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const FARCASTER_APP_URL = process.env.NEXT_PUBLIC_FARCASTER_APP_URL || 'https://warpcast.com/~/mini-apps/launch?url=' + encodeURIComponent(APP_URL);

function useQuestStatuses() {
  const [statuses, setStatuses] = useState<Record<string, QuestStatus>>({});
  const setStatus = (id: string, status: QuestStatus) => {
    setStatuses(s => ({ ...s, [id]: status }));
  };
  return { statuses, setStatus };
}

export default function HomePage() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [refCode, setRefCode] = useState('');
  const [isMiniApp, setIsMiniApp] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [copied, setCopied] = useState(false);
  const { statuses, setStatus } = useQuestStatuses();
  
  const { connect, connectors } = useConnect();
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [walletState, setWalletState] = useState<'not_connected' | 'connecting' | 'connected' | 'linking' | 'linked' | 'failed'>('not_connected');

  useEffect(() => {
    fetch('/api/quests')
      .then(r => r.json())
      .then(d => setQuests(d.quests ?? []));

    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) setRefCode(ref);

    (async () => {
      try {
        const inMiniApp = await sdk.isInMiniApp();
        console.log('[miniapp] isInMiniApp', inMiniApp);
        setIsMiniApp(inMiniApp);

        if (inMiniApp) {
          const res = await sdk.quickAuth.fetch('/api/auth/farcaster/me');
          console.log('[miniapp] quickAuth status', res.status);
          if (res.ok) {
            const data = await res.json();
            setUser(data.user ?? null);
          } else {
            console.error('[miniapp] auth failed', res.status);
          }
          await sdk.actions.ready();
        } else {
          const res = await fetch('/api/me', { credentials: 'include' });
          console.log('[web] /api/me status', res.status);
          if (res.ok) {
            const data = await res.json();
            setUser(data.user ?? null);
          }
        }
      } catch (e) {
        console.error('Auth check failed:', e);
      } finally {
        setAuthChecked(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!connectors?.length) return;
    console.log('[wallet] connectors', connectors.map((c) => c.id));
  }, [connectors]);

  const shareLink = useMemo(() => {
    if (!user?.referral_code) return '';
    return `${window.location.origin}?ref=${user.referral_code}`;
  }, [user?.referral_code]);

  async function refreshUser() {
    const res = await fetch('/api/me', { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      setUser(data.user ?? null);
    }
  }

  async function handleMiniAppAuth() {
    try {
      const res = await sdk.quickAuth.fetch('/api/auth/farcaster/me');
      console.log('[miniapp] quickAuth status', res.status);
      if (res.ok) {
        const data = await res.json();
        setUser(data.user ?? null);
        await sdk.actions.ready();
      } else {
        console.error('[miniapp] auth failed', res.status);
      }
    } catch (e) {
      console.error('Mini app auth failed:', e);
    }
  }

  async function openQuest(quest: Quest) {
    setStatus(quest.id, 'opened');
    
    if (quest.platform === 'x' && quest.target.url) {
      if (isMiniApp) {
        await sdk.actions.openUrl({ url: quest.target.url });
      } else {
        window.open(quest.target.url, '_blank');
      }
      return;
    }

    if (quest.platform === 'farcaster') {
      if (quest.action === 'follow_user' && quest.target.targetFid) {
        if (isMiniApp) {
          await sdk.actions.viewProfile({ fid: Number(quest.target.targetFid) });
        } else {
          window.open(`https://warpcast.com/~/profiles/${quest.target.targetFid}`, '_blank');
        }
      } else if (quest.target.castHash) {
        if (isMiniApp) {
          await sdk.actions.viewCast({ hash: quest.target.castHash });
        } else {
          const castUrl = quest.target.castUrl || `https://warpcast.com/~/casts/${quest.target.castHash}`;
          window.open(castUrl, '_blank');
        }
      } else if (quest.target.castUrl) {
        if (isMiniApp) {
          await sdk.actions.openUrl({ url: quest.target.castUrl });
        } else {
          window.open(quest.target.castUrl, '_blank');
        }
      }
    }
  }

  async function verifyQuest(quest: Quest) {
    if (!user) return;
    if (quest.platform === 'x' || quest.verification === 'wallet_signature') {
      setStatus(quest.id, 'failed');
      return;
    }
    setStatus(quest.id, 'verifying');
    try {
      const res = await fetch(`/api/quests/${quest.id}/verify`, { method: 'POST' });
      const data = await res.json();
      if (data.verified) {
        setStatus(quest.id, 'verified');
        await refreshUser();
      } else {
        setStatus(quest.id, 'failed');
      }
    } catch (e) {
      setStatus(quest.id, 'failed');
    }
  }

  async function connectWallet(quest: Quest) {
    if (!user || !address) return;
    try {
      setWalletState('linking');
      const message = `Link wallet to TACHI Quest: ${user.fc_fid}`;
      const signature = await signMessageAsync({ message });
      const res = await fetch('/api/wallet/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, message, signature }),
      });
      if (res.ok) {
        setStatus(quest.id, 'verified');
        await refreshUser();
        setWalletState('linked');
      } else {
        const data = await res.json().catch(() => ({}));
        console.error('[wallet] link failed', data);
        setWalletState('failed');
      }
    } catch (e) {
      console.error('Wallet connect failed:', e);
      setWalletState('failed');
    }
  }

  async function attachReferral() {
    if (!refCode || !user) return;
    const res = await fetch('/api/referrals/attach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: refCode }),
    });
    if (res.ok) {
      setRefCode('');
      const url = new URL(window.location.href);
      url.searchParams.delete('ref');
      window.history.replaceState({}, '', url);
    }
  }

  async function copyReferral() {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error('Copy failed', e);
    }
  }

  async function shareReferral() {
    if (!shareLink) return;
    if (isMiniApp) {
      try {
        await sdk.actions.composeCast({
          text: `Join TACHI Quest and earn points. Use my code: ${user?.referral_code}\n${shareLink}`,
        });
      } catch (e) {
        console.error('Compose cast failed', e);
      }
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'TACHI Quest',
          text: `Join TACHI Quest and earn points. Use my code: ${user?.referral_code}`,
          url: shareLink,
        });
        return;
      } catch {
        // ignore
      }
    }

    await copyReferral();
  }

  function getStatusBadge(status: QuestStatus) {
    const styles: Record<QuestStatus, string> = {
      idle: 'bg-white/10 text-white/60',
      opened: 'bg-yellow-500/20 text-yellow-400',
      verifying: 'bg-blue-500/20 text-blue-400',
      verified: 'bg-green-500/20 text-green-400',
      failed: 'bg-red-500/20 text-red-400',
    };
    return <span className={`px-2 py-1 rounded text-xs ${styles[status]}`}>{status}</span>;
  }

  if (!authChecked) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-white/70">Loading...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">TACHI Quest</h1>
            <p className="text-white/60 mt-2">Complete quests for $TACHI airdrop eligibility</p>
          </div>
          <div className="flex items-center gap-3">
            {!user && isMiniApp && (
              <button onClick={handleMiniAppAuth} className="bg-purple-600 hover:bg-purple-700 px-5 py-2 rounded-xl font-semibold">
                Connect with Farcaster
              </button>
            )}
            {!user && !isMiniApp && (
              <a href={FARCASTER_APP_URL} className="bg-white/10 hover:bg-white/15 px-5 py-2 rounded-xl font-semibold">
                Open in Farcaster
              </a>
            )}
            {user && (
              <div className="text-right">
                <div className="text-sm text-white/60">@{user.fc_username ?? 'anon'}</div>
                <div className="text-cyan-400 font-semibold">{user.points} points</div>
              </div>
            )}
          </div>
        </header>

        {user && (
          <div className="mb-6 p-4 bg-white/5 rounded-2xl border border-white/10 flex gap-4">
            {user.fc_pfp_url && (
              <img
                src={user.fc_pfp_url}
                alt={user.fc_display_name ?? user.fc_username ?? 'Profile'}
                className="w-16 h-16 rounded-full"
              />
            )}
            <div>
              <div className="text-lg font-semibold">{user.fc_display_name ?? user.fc_username ?? 'Anon'}</div>
              <div className="text-sm text-white/60">@{user.fc_username ?? 'anon'} · FID {user.fc_fid}</div>
              {user.fc_bio && <div className="text-xs text-white/50 mt-1">{user.fc_bio}</div>}
              {user.fc_score && <div className="text-xs text-white/40 mt-1">Score: {user.fc_score}</div>}
            </div>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-[260px_1fr]">
          <aside className="space-y-4">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
              <div className="text-sm text-white/60 mb-1">Status</div>
              {user ? (
                <div>
                  <div className="text-lg font-semibold">Connected</div>
                  <div className="text-sm text-white/50">FID {user.fc_fid}</div>
                </div>
              ) : (
                <div className="text-sm text-white/50">Connect to verify quests.</div>
              )}
            </div>

            {user && (
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <div className="text-sm text-white/60 mb-1">Referral Code</div>
                <div className="font-mono text-lg">{user.referral_code}</div>
                <div className="text-xs text-white/40 mt-2 truncate">{shareLink}</div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={copyReferral}
                    className="flex-1 rounded-lg bg-white/10 hover:bg-white/15 py-2 text-xs font-medium"
                  >
                    {copied ? 'Copied!' : 'Copy Link'}
                  </button>
                  <button
                    onClick={shareReferral}
                    className="flex-1 rounded-lg bg-purple-600 hover:bg-purple-700 py-2 text-xs font-medium"
                  >
                    Share
                  </button>
                </div>
              </div>
            )}

            {refCode && user && (
              <div className="p-4 bg-purple-900/30 border border-purple-500/30 rounded-2xl">
                <p className="text-sm mb-2">Referred by: <span className="font-mono">{refCode}</span></p>
                <button onClick={attachReferral} className="w-full bg-purple-600 hover:bg-purple-700 text-sm font-medium py-2 rounded-lg">
                  Attach Code
                </button>
              </div>
            )}
          </aside>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Quests</h2>
              <div className="text-sm text-white/50">{quests.length} active</div>
            </div>
            <div className="grid gap-4">
              {quests.map((quest) => {
                const status = statuses[quest.id] ?? 'idle';
                const isWallet = quest.verification === 'wallet_signature';
                const isX = quest.platform === 'x';
                const isFarcaster = quest.platform === 'farcaster';
                const showVerify = isFarcaster && user;
                const farcasterDisabled = !user && isFarcaster;

                return (
                  <div key={quest.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-base font-semibold">{quest.title}</h3>
                        <p className="mt-1 text-sm text-white/60">{quest.description}</p>
                      </div>
                      <div className="text-cyan-400 font-semibold whitespace-nowrap">+{quest.points}</div>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-white/40 uppercase">{quest.platform}</span>
                      {getStatusBadge(status)}
                    </div>

                    {farcasterDisabled && (
                      <div className="mt-3 text-xs text-white/50">
                        Connect with Farcaster to verify this quest.
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap gap-3">
                      {(isFarcaster || isX) && (
                        <button onClick={() => openQuest(quest)} className="rounded-xl px-4 py-2 bg-white/10 hover:bg-white/15">
                          {isX ? 'Open on X' : 'Open task'}
                        </button>
                      )}
                      {showVerify && (
                        <button
                          onClick={() => verifyQuest(quest)}
                          disabled={status === 'verifying'}
                          className="rounded-xl px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                        >
                          {status === 'verifying' ? 'Verifying...' : 'Verify'}
                        </button>
                      )}
                      {isWallet && (
                        <button
                          onClick={() => {
                            const connector = isMiniApp ? connectors[0] : connectors.find((c) => c.id !== 'farcaster');
                            if (!connector) {
                              console.error('[wallet] missing connector');
                              return;
                            }
                            setWalletState('connecting');
                            connect({ connector });
                          }}
                          disabled={status === 'verified' || isConnected}
                          className="rounded-xl px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                        >
                          {walletState === 'connecting' ? 'Connecting...' : isConnected ? 'Connected' : 'Connect Wallet'}
                        </button>
                      )}
                      {isWallet && isConnected && status !== 'verified' && (
                        <button
                          onClick={() => connectWallet(quest)}
                          className="rounded-xl px-4 py-2 bg-green-600 hover:bg-green-700"
                        >
                          {walletState === 'linking' ? 'Linking...' : walletState === 'linked' ? 'Linked' : 'Link Wallet'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
