'use client';

import { ReactNode, useEffect, useState } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getWagmiConfig } from '@/lib/wagmi';
import { detectMiniApp } from '@/lib/miniapp';
import { sdk } from '@farcaster/miniapp-sdk';

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  const [isMiniApp, setIsMiniApp] = useState<boolean | null>(null);
  const [sdkReady, setSdkReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    async function init() {
      try {
        const inMiniApp = await detectMiniApp();
        console.log('[providers] isInMiniApp:', inMiniApp);
        if (mounted) setIsMiniApp(inMiniApp);
        
        // If in mini app, signal ready after a short delay to let UI render
        if (inMiniApp) {
          setTimeout(async () => {
            try {
              await sdk.actions.ready();
              console.log('[providers] SDK ready() called');
              if (mounted) setSdkReady(true);
            } catch (e) {
              console.error('[providers] SDK ready() failed:', e);
            }
          }, 100);
        } else {
          if (mounted) setSdkReady(true);
        }
      } catch (e) {
        console.error('[providers] Init failed:', e);
        if (mounted) {
          setIsMiniApp(false);
          setSdkReady(true);
        }
      }
    }
    
    init();
    
    return () => { mounted = false; };
  }, []);

  if (isMiniApp === null) {
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
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
