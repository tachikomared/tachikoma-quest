'use client';

import { useAuth } from '@/app/providers';
import { useConnect, useAccount, useSignMessage } from 'wagmi';
import { sdk } from '@farcaster/miniapp-sdk';
import { useState } from 'react';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { auth, isMiniApp, refreshAuth } = useAuth();

  // Show loading state
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

  // Show error state with retry
  if (auth.status === 'error') {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-gray-900/50 rounded-2xl p-6 border border-red-900/30 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-lg font-bold text-red-400 mb-2">Connection Error</h2>
          <p className="text-sm text-gray-400 mb-4">{auth.error}</p>
          <button
            onClick={refreshAuth}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Show unauthenticated state
  if (auth.status === 'unauthenticated') {
    return <UnauthenticatedScreen isMiniApp={isMiniApp} onGuestLogin={refreshAuth} />;
  }

  // Authenticated - render children
  return <>{children}</>;
}

function UnauthenticatedScreen({ isMiniApp, onGuestLogin }: { isMiniApp: boolean; onGuestLogin: () => void }) {
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { isConnected, address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [isGuestLoggingIn, setIsGuestLoggingIn] = useState(false);
  const [refCode, setRefCode] = useState('');
  const urlRef = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('ref') : null;

  const handleConnectFarcaster = async () => {
    if (isMiniApp) {
      window.location.reload();
    } else {
      alert('Please open this app in Farcaster (Warpcast) for the best experience');
    }
  };

  const handleGuestLogin = async () => {
    if (!address) {
      // Connect wallet first
      if (connectors[0]) {
        connect({ connector: connectors[0] });
      }
      return;
    }

    setIsGuestLoggingIn(true);
    try {
      // Sign message to verify wallet ownership
      const message = `TACHI Quest Guest Login\n\nWallet: ${address}\nTimestamp: ${Date.now()}`;
      const signature = await signMessageAsync({ message });

      // Create guest session
      const res = await fetch('/api/auth/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, signature, message, refCode: refCode || urlRef }),
      });

      if (res.ok) {
        onGuestLogin();
      } else {
        const err = await res.text();
        alert('Guest login failed: ' + err);
      }
    } catch (e: any) {
      console.error('[guest] Login error:', e);
      alert('Guest login failed: ' + (e.message || 'Unknown error'));
    } finally {
      setIsGuestLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="max-w-sm w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🦀</div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-red-500 to-red-400 bg-clip-text text-transparent">
            TACHI Quest
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Complete quests · Earn XP · Stack $TACHI
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800">
          <h2 className="text-lg font-bold text-white mb-4 text-center">
            Connect to Start
          </h2>

          <div className="space-y-3">
            <button
              onClick={handleConnectFarcaster}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <span>🔑</span>
              Connect with Farcaster
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-gray-900 text-gray-500">or</span>
              </div>
            </div>

            {/* Referral Code Input */}
            {(urlRef || !isConnected) && (
              <div className="bg-[#1a1a24] border border-[#252535] rounded-lg p-3">
                <label className="text-[10px] text-[#8a8a9a] font-mono block mb-1">HAVE A REFERRAL CODE?</label>
                <input
                  type="text"
                  value={refCode}
                  onChange={(e) => setRefCode(e.target.value.toUpperCase())}
                  placeholder={urlRef || 'ENTER CODE'}
                  defaultValue={urlRef || ''}
                  className="w-full bg-[#050508] border border-[#353545] rounded p-2 text-sm font-mono text-[#f0f0f0] focus:border-[#ff1a1a] focus:outline-none"
                />
              </div>
            )}

            {!isConnected ? (
              <button
                onClick={() => connectors[0] && connect({ connector: connectors[0] })}
                disabled={isConnecting}
                className="w-full bg-[#1a1a24] hover:bg-[#252535] border border-[#ff1a1a]/30 text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>💎</span>
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            ) : (
              <button
                onClick={handleGuestLogin}
                disabled={isGuestLoggingIn}
                className="w-full bg-[#ff1a1a]/20 hover:bg-[#ff1a1a]/30 border border-[#ff1a1a] text-[#ff1a1a] font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>🎮</span>
                {isGuestLoggingIn ? 'Logging in...' : 'Continue as Guest'}
              </button>
            )}

            {isConnected && (
              <p className="text-xs text-green-400 text-center">
                ✓ Wallet connected: {address?.slice(0, 6)}...{address?.slice(-4)}
              </p>
            )}

            {!isMiniApp && (
              <p className="text-xs text-gray-500 text-center">
                For the best experience, open this app in{' '}
                <a 
                  href="https://warpcast.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:underline"
                >
                  Warpcast
                </a>
              </p>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 space-y-3">
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <span className="text-green-400">✓</span>
            <span>Complete social quests</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <span className="text-green-400">✓</span>
            <span>Earn XP and rewards</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <span className="text-green-400">✓</span>
            <span>Stack $TACHI tokens</span>
          </div>
        </div>
      </div>
    </div>
  );
}
