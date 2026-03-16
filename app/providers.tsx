'use client';

import { ReactNode, useEffect, useState, createContext, useContext } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getWagmiConfig } from '@/lib/wagmi';
import { detectMiniApp } from '@/lib/miniapp';
import { sdk } from '@farcaster/miniapp-sdk';
import { AuthState, authenticate, AuthUser } from '@/lib/auth-utils';

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

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    let mounted = true;
    
    async function init() {
      try {
        const inMiniApp = await detectMiniApp();
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

  useEffect(() => {
    let mounted = true;
    
    async function doAuth() {
      if (!isClient) return;
      
      const state = await authenticate(isMiniApp);
      if (mounted) setAuth(state);
      
      if (isMiniApp) {
        try {
          await sdk.actions.ready();
          console.log('[providers] SDK ready() called');
          if (mounted) setSdkReady(true);
        } catch (e) {
          console.error('[providers] SDK ready() failed:', e);
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

  if (!isClient) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center crt-flicker">
        <div className="text-center">
          <div className="text-4xl mb-4">🦀</div>
          <div className="terminal-text text-sm">INITIALIZING TACHI SYSTEMS...</div>
          <div className="w-48 h-1 bg-[#1a1a24] mt-4 mx-auto overflow-hidden">
            <div className="boot-line" />
          </div>
        </div>
      </div>
    );
  }

  const config = getWagmiConfig(isMiniApp);

  return (
    <AuthContext.Provider value={{ auth, isMiniApp, sdkReady, refreshAuth }}>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <div className="scanlines" />
          {children}
        </QueryClientProvider>
      </WagmiProvider>
    </AuthContext.Provider>
  );
}
