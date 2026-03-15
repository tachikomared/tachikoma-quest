'use client';

import { ReactNode, useEffect, useState } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getWagmiConfig } from '@/lib/wagmi';
import { detectMiniApp } from '@/lib/miniapp';

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  const [isMiniApp, setIsMiniApp] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const inMiniApp = await sdk.isInMiniApp();
        console.log('[providers] isInMiniApp', inMiniApp);
        setIsMiniApp(inMiniApp);
      } catch (e) {
        console.error('[providers] isInMiniApp failed', e);
        setIsMiniApp(false);
      }
    })();
  }, []);

  if (isMiniApp === null) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-white/70">Loading...</div>
      </div>
    );
  }

  const config = getWagmiConfig(isMiniApp);
  console.log('[providers] wagmi connectors', config.connectors.map((c) => c.id));

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
