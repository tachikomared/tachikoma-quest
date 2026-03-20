'use client';

import { useAuth } from '@/app/providers';
import { useConnect, useAccount, useDisconnect, useSignMessage } from 'wagmi';
import { sdk } from '@farcaster/miniapp-sdk';
import { useEffect, useState } from 'react';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { auth, isMiniApp, refreshAuth } = useAuth();

  if (auth.status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          <div className="text-gray-400 text-sm">Connecting to Farcaster...</div>
        </div>
      </div>
    );
  }

  if (auth.status === 'error') {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-gray-900/50 rounded-2xl p-6 border border-red-900/30 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-lg font-bold text-red-400 mb-2">Connection Error</h2>
          <p className="text-sm text-gray-400 mb-4">{auth.error}</p>
          <button onClick={refreshAuth} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors">Try Again</button>
        </div>
      </div>
    );
  }

  if (auth.status === 'unauthenticated') {
    return <UnauthenticatedScreen isMiniApp={isMiniApp} onGuestLogin={refreshAuth} />;
  }

  return <>{children}</>;
}

function UnauthenticatedScreen({ isMiniApp, onGuestLogin }: { isMiniApp: boolean; onGuestLogin: () => void }) {
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { isConnected, address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [isGuestLoggingIn, setIsGuestLoggingIn] = useState(false);
  const [refCode, setRefCode] = useState('');
  const [urlRef, setUrlRef] = useState<string | null>(null);
  const [guestPfp, setGuestPfp] = useState<string>('/guest-avatar.jpg');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setUrlRef(params.get('ref'));
    }
  }, []);

  const handleConnectFarcaster = async () => {
    if (isMiniApp) window.location.reload();
    else alert('Please open this app in Farcaster for the best experience');
  };

  const handleGuestLogin = async () => {
    if (!address) {
      if (connectors[0]) connect({ connector: connectors[0] });
      return;
    }

    const referralCode = refCode.trim().toUpperCase();
    if (!referralCode && !window.localStorage.getItem(`tachi_guest_${address.toLowerCase()}`)) {
      alert('Referral code required');
      return;
    }

    setIsGuestLoggingIn(true);
    try {
      const message = `TACHI Quest Guest Login\n\nWallet: ${address}\nTimestamp: ${Date.now()}`;
      const signature = await signMessageAsync({ message });
      const res = await fetch('/api/auth/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, signature, message, refCode: referralCode || '__SAVED_GUEST__' }),
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.pfpUrl) setGuestPfp(data.pfpUrl);
        if (address) window.localStorage.setItem(`tachi_guest_${address.toLowerCase()}`, '1');
        onGuestLogin();
      } else {
        alert('Guest login failed: ' + await res.text());
      }
    } catch (e: any) {
      alert('Guest login failed: ' + (e.message || 'Unknown error'));
    } finally {
      setIsGuestLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="max-w-sm w-full">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🦀</div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-red-500 to-red-400 bg-clip-text text-transparent">TACHI Quest</h1>
        </div>

        <div className="mb-6 text-[10px] uppercase tracking-[0.2em] text-[#39ff14] font-mono border border-[#39ff14]/30 bg-[#39ff14]/10 rounded p-2 leading-snug">
          AI AGENT CREATED MINIAPP. IT IS NOT A FINANCIAL PRODUCT, SECURITY OR INVESTMENT. WE DO NOT PROMISE NUMBERS GO UP, OR NUMBERS DO ANYTHING AT ALL. USE AT YOUR OWN RISK. ALL TACHI CONTENT, INCLUDING SOCIAL POSTS, AND APPS IS FOR AI EXPERIMENTS ONCHAIN. THIS IS NOT FINANCIAL ADVICE. DYOR. STAY DEGEN. STAY SAFU. GET $TACHI RESPONSIBLY.
        </div>

        <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800">
          <h2 className="text-lg font-bold text-white mb-4 text-center">Connect to Start</h2>
          <div className="space-y-3">
            <button onClick={handleConnectFarcaster} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2">
              <span>🔑</span> Connect with Farcaster
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-700" /></div>
              <div className="relative flex justify-center text-xs"><span className="px-2 bg-gray-900 text-gray-500">or</span></div>
            </div>

            <div className="bg-[#1a1a24] border border-[#252535] rounded-lg p-3">
              <label className="text-[10px] text-[#8a8a9a] font-mono block mb-1">HAVE A REFERRAL CODE?</label>
              <input type="text" value={refCode} onChange={(e) => setRefCode(e.target.value.toUpperCase())} placeholder={urlRef || 'ENTER CODE'} className="w-full bg-[#050508] border border-[#353545] rounded p-2 text-sm font-mono text-[#f0f0f0] focus:border-[#ff1a1a] focus:outline-none" />
            </div>

            {isConnected ? (
              <button onClick={handleGuestLogin} disabled={isGuestLoggingIn} className="w-full bg-[#ff1a1a]/20 hover:bg-[#ff1a1a]/30 border border-[#ff1a1a] text-[#ff1a1a] font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                <img src={guestPfp} alt="Guest avatar" className="w-6 h-6 rounded-full object-cover border border-white/20" />
                {isGuestLoggingIn ? 'Logging in...' : 'Continue as Guest'}
              </button>
            ) : (
              <button onClick={() => connectors[0] && connect({ connector: connectors[0] })} disabled={isConnecting} className="w-full bg-[#1a1a24] hover:bg-[#252535] border border-[#ff1a1a]/30 text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                <span>💎</span> {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            )}

            {isConnected && (
              <div className="space-y-2 text-center">
                <p className="text-xs text-green-400">✓ Wallet connected: {address?.slice(0, 6)}...{address?.slice(-4)}</p>
                <button onClick={() => disconnect()} className="text-[10px] uppercase tracking-wider px-2 py-1 rounded border border-[#ff1a1a]/30 text-[#ff1a1a] bg-[#ff1a1a]/10 hover:bg-[#ff1a1a]/20">Disconnect Wallet</button>
              </div>
            )}

            <div className="text-center text-xs text-[#8a8a9a]">For the best experience, open this app in <a href="https://farcaster.xyz/miniapps/nLEf2pIdso35/tachi-quest" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">Farcaster</a></div>
          </div>
        </div>
      </div>
    </div>
  );
}