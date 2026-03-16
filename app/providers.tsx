'use client';

import { ReactNode, useEffect, useState, createContext, useContext } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getWagmiConfig } from '@/lib/wagmi';
import { detectMiniApp } from '@/lib/miniapp';
import { sdk } from '@farcaster/miniapp-sdk';
import { AuthState, authenticate, AuthUser } from '@/lib/auth-utils';

// Auth context for sharing auth state across components
const AuthContext = createContext<{
  auth: AuthState;
  isMiniApp: boolean;
  sdkReady: boolean;
  refreshAuth: () => Promise<void>;
}>({
  auth: { status: 'loading' },
  isMiniApp: false,
  sdkReady: false,
  refreshAuth: async () => {},
});

export const useAuth = () => useContext(AuthContext);

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({ status: 'loading' });
  const [isMiniApp, setIsMiniApp] = useState<boolean>(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Mark as client-side rendered
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Detect Mini App context
  useEffect(() => {
    let mounted = true;
    
    async function init() {
      try {
        const inMiniApp = await detectMiniApp();
        console.log('[providers] isInMiniApp:', inMiniApp);
        if (mounted) setIsMiniApp(inMiniApp);
      } catch (e) {
        console.error('[providers] Detection failed:', e);
        if (mounted) setIsMiniApp(false);
      }
    }
    
    if (isClient) {
      init();
    }
    
    return () => { mounted = false; };
  }, [isClient]);

  // Authenticate once we know if we're in Mini App
  useEffect(() => {
    let mounted = true;
    
    async function doAuth() {
      if (!isClient) return;
      
      const state = await authenticate(isMiniApp);
      if (mounted) setAuth(state);
      
      // Signal SDK ready after auth attempt
      if (isMiniApp) {
        try {
          await sdk.actions.ready();
          console.log('[providers] SDK ready() called');
          if (mounted) setSdkReady(true);
        } catch (e) {
          console.error('[providers] SDK ready() failed:', e);
          // Still mark as ready even if it fails
          if (mounted) setSdkReady(true);
        }
      } else {
        if (mounted) setSdkReady(true);
      }
    }
    
    doAuth();
    
    return () => { mounted = false; };
  }, [isMiniApp, isClient]);

  const refreshAuth = async () => {
    setAuth({ status: 'loading' });
    const state = await authenticate(isMiniApp);
    setAuth(state);
  };

  // Don't render until client-side hydration is complete
  if (!isClient) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          <div className="text-gray-400 text-sm">Loading TACHI Quest...</div>
        </div>
      </div>
    );
  }

  const config = getWagmiConfig(isMiniApp);

  return (
    <AuthContext.Provider value={{ auth, isMiniApp, sdkReady, refreshAuth }}>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </WagmiProvider>
    </AuthContext.Provider>
  );
}
