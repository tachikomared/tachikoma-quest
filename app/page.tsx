'use client';

import { useEffect, useState } from 'react';
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
  fid: number;
  username: string;
  points: number;
  referral_code: string;
};

export default function HomePage() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [refCode, setRefCode] = useState('');
  const [isFarcaster, setIsFarcaster] = useState(false);

  useEffect(() => {
    // Check if in Farcaster environment
    sdk.context.then((ctx) => {
      setIsFarcaster(Boolean(ctx?.user));
    }).catch(() => {});
    
    // Fetch quests
    fetch('/api/quests')
      .then((r) => r.json())
      .then((d) => setQuests(d.quests ?? []));
    
    // Fetch current user
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setUser(d.user);
        }
      });
    
    // Check for ref code in URL
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      setRefCode(ref);
    }
    
    // Signal ready to Farcaster
    sdk.actions.ready().catch(() => {});
  }, []);

  async function handleAuth() {
    try {
      // Get context first for user info
      const ctx = await sdk.context;
      
      // Use Neynar auth - get signature from user
      const result = await sdk.actions.signIn({
        nonce: Math.random().toString(36).slice(2),
      });
      
      if (!result) {
        throw new Error('Auth failed');
      }
      
      // Send to server to create session
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signature: result.signature,
          message: result.message,
          user: ctx?.user,
        }),
      });
      
      if (res.ok) {
        window.location.reload();
      }
    } catch (e) {
      console.error('Auth failed:', e);
    }
  }

  async function verifyQuest(quest: Quest) {
    setLoading((s) => ({ ...s, [quest.id]: true }));
    try {
      // For external quests (X), just open the URL
      if (quest.platform === 'x' && quest.target.url) {
        window.open(quest.target.url, '_blank');
        return;
      }
      
      // For Farcaster quests, open the target first
      if (quest.platform === 'farcaster') {
        if (quest.target.castUrl) {
          window.open(quest.target.castUrl, '_blank');
        } else if (quest.target.targetFid) {
          window.open(`https://warpcast.com/~/profiles/${quest.target.targetFid}`, '_blank');
        }
      }
      
      // Then verify
      const res = await fetch(`/api/quests/${quest.id}/verify`, { 
        method: 'POST' 
      });
      const data = await res.json();
      
      if (data.verified) {
        // Refresh user data
        const meRes = await fetch('/api/me');
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

  async function attachReferral() {
    if (!refCode) return;
    
    const res = await fetch('/api/referrals/attach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: refCode }),
    });
    
    if (res.ok) {
      setRefCode('');
      // Remove ref from URL
      const url = new URL(window.location.href);
      url.searchParams.delete('ref');
      window.history.replaceState({}, '', url);
    }
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <h1 className="text-4xl font-bold mb-4">TACHI Quest</h1>
          <p className="text-white/70 mb-8">
            Complete quests and link your wallet for $TACHI airdrop eligibility
          </p>
          <button
            onClick={handleAuth}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-8 rounded-xl transition"
          >
            {isFarcaster ? 'Connect with Farcaster' : 'Sign In'}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">TACHI Quest</h1>
          <div className="text-right">
            <div className="text-sm text-white/60">@{user.username}</div>
            <div className="text-cyan-400 font-semibold">{user.points ?? 0} points</div>
          </div>
        </div>
        
        {refCode && (
          <div className="mb-6 p-4 bg-purple-900/30 border border-purple-500/30 rounded-xl">
            <p className="text-sm mb-2">You were referred by: <span className="font-mono">{refCode}</span></p>
            <button
              onClick={attachReferral}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium py-2 rounded-lg transition"
            >
              Attach Referral Code
            </button>
          </div>
        )}
        
        <div className="mb-6 p-4 bg-white/5 rounded-xl">
          <div className="text-sm text-white/60 mb-1">Your Referral Code</div>
          <div className="font-mono text-lg">{user.referral_code}</div>
        </div>
        
        <div className="grid gap-3">
          {quests.map((quest) => (
            <button
              key={quest.id}
              className="text-left p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition disabled:opacity-50"
              disabled={loading[quest.id]}
              onClick={() => verifyQuest(quest)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold">{quest.title}</div>
                  <div className="text-sm text-white/60 mt-1">{quest.description}</div>
                </div>
                {quest.points > 0 && (
                  <div className="text-cyan-400 font-semibold whitespace-nowrap ml-4">
                    +{quest.points}
                  </div>
                )}
              </div>
              <div className="mt-2 text-xs text-white/40 uppercase tracking-wider">
                {quest.platform}
              </div>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
