'use client';

import { useEffect, useMemo, useState } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

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
  referral_code: string;
  points: number;
};

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export default function HomePage() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [refCode, setRefCode] = useState('');
  const [isMiniApp, setIsMiniApp] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    fetch('/api/quests')
      .then((r) => r.json())
      .then((d) => setQuests(d.quests ?? []));

    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      setRefCode(ref);
    }

    (async () => {
      try {
        const inMiniApp = await sdk.isInMiniApp();
        setIsMiniApp(inMiniApp);

        if (inMiniApp) {
          const res = await sdk.quickAuth.fetch('/api/auth/farcaster/me');
          if (res.ok) {
            const data = await res.json();
            setUser(data.user ?? null);
          }
          await sdk.actions.ready();
        } else {
          const res = await fetch('/api/auth/farcaster/me', { credentials: 'include' });
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

  const shareLink = useMemo(() => {
    if (!user?.referral_code) return '';
    return `${window.location.origin}?ref=${user.referral_code}`;
  }, [user?.referral_code]);

  async function handleMiniAppAuth() {
    try {
      const res = await sdk.quickAuth.fetch('/api/auth/farcaster/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user ?? null);
      }
    } catch (e) {
      console.error('Mini app auth failed:', e);
    }
  }

  async function verifyQuest(quest: Quest) {
    if (!user) return;
    setLoading((s) => ({ ...s, [quest.id]: true }));
    try {
      const res = await fetch(`/api/quests/${quest.id}/verify`, {
        method: 'POST',
      });
      const data = await res.json();

      if (data.verified) {
        const meRes = await fetch('/api/auth/farcaster/me', { credentials: 'include' });
        const meData = await meRes.json();
        if (meData.user) {
          setUser(meData.user);
        }
      }
    } catch (e) {
      console.error('Verification failed:', e);
    } finally {
      setLoading((s) => ({ ...s, [quest.id]: false }));
    }
  }

  function openQuest(quest: Quest) {
    if (quest.platform === 'x' && quest.target.url) {
      window.open(quest.target.url, '_blank');
      return;
    }

    if (quest.platform === 'farcaster') {
      if (quest.target.castUrl) {
        window.open(quest.target.castUrl, '_blank');
      } else if (quest.target.targetFid) {
        window.open(`https://farcaster.xyz/~/profiles/${quest.target.targetFid}`, '_blank');
      }
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

  if (!authChecked) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
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
            <p className="text-white/60 mt-2">
              Complete quests and link your wallet for $TACHI airdrop eligibility
            </p>
          </div>
          <div className="flex items-center gap-3">
            {!user && isMiniApp && (
              <button
                onClick={handleMiniAppAuth}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-5 rounded-xl transition"
              >
                Connect with Farcaster
              </button>
            )}
            {!user && !isMiniApp && (
              <a
                href={APP_URL}
                className="bg-white/10 hover:bg-white/15 text-white font-semibold py-2 px-5 rounded-xl transition"
              >
                Open in Farcaster
              </a>
            )}
            {user && (
              <div className="text-right">
                <div className="text-sm text-white/60">@{user.fc_username ?? 'anon'}</div>
                <div className="text-cyan-400 font-semibold">{user.points ?? 0} points</div>
              </div>
            )}
          </div>
        </header>

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
                <div className="text-sm text-white/60 mb-1">Your Referral Code</div>
                <div className="font-mono text-lg">{user.referral_code}</div>
                <div className="text-xs text-white/40 mt-2 truncate">Share: {shareLink}</div>
              </div>
            )}

            {refCode && user && (
              <div className="p-4 bg-purple-900/30 border border-purple-500/30 rounded-2xl">
                <p className="text-sm mb-2">
                  You were referred by: <span className="font-mono">{refCode}</span>
                </p>
                <button
                  onClick={attachReferral}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium py-2 rounded-lg transition"
                >
                  Attach Referral Code
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
              {quests.map((quest) => (
                <div
                  key={quest.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-base font-semibold">{quest.title}</h3>
                      <p className="mt-1 text-sm text-white/60">{quest.description}</p>
                    </div>
                    {quest.points > 0 && (
                      <div className="text-cyan-400 font-semibold whitespace-nowrap">+{quest.points}</div>
                    )}
                  </div>
                  <div className="mt-2 text-xs text-white/40 uppercase tracking-wider">
                    {quest.platform}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      onClick={() => openQuest(quest)}
                      className="rounded-xl px-4 py-2 bg-white/10 hover:bg-white/15"
                    >
                      Open task
                    </button>
                    <button
                      onClick={() => verifyQuest(quest)}
                      disabled={!user || loading[quest.id]}
                      className="rounded-xl px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                    >
                      {loading[quest.id] ? 'Verifying...' : 'Verify'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
