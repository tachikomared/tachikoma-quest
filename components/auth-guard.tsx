'use client';

import { useAuth } from '@/app/providers';
import { useConnect, useAccount, useSignMessage } from 'wagmi';
import { sdk } from '@farcaster/miniapp-sdk';

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
    return <UnauthenticatedScreen isMiniApp={isMiniApp} />;
  }

  // Authenticated - render children
  return <>{children}</>;
}

function UnauthenticatedScreen({ isMiniApp }: { isMiniApp: boolean }) {
  const { connect, connectors } = useConnect();
  const { isConnected } = useAccount();

  const handleConnectFarcaster = async () => {
    if (isMiniApp) {
      // In Mini App - this shouldn't happen as auth is automatic
      // Try reloading the page to trigger auth again
      window.location.reload();
    } else {
      // On web - we need to implement Sign In With Neynar
      // For now, show instructions
      alert('Please open this app in Farcaster (Warpcast) for the best experience');
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

            {isConnected && (
              <p className="text-xs text-green-400 text-center">
                ✓ Wallet connected
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
