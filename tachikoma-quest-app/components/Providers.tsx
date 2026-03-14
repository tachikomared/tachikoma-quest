'use client'

import { PrivyProvider } from '@privy-io/react-auth'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <PrivyProvider
        appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ''}
        config={{
          appearance: {
            theme: 'dark',
            accentColor: '#00f0ff',
            logo: '/tachikoma-logo.png',
          },
          embeddedWallets: {
            createOnLogin: 'users-without-wallets',
          },
          defaultChain: {
            id: 8453,
            name: 'Base',
            nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
            rpcUrls: { default: { http: ['https://mainnet.base.org'] } },
          },
          supportedChains: [
            {
              id: 8453,
              name: 'Base',
              nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
              rpcUrls: { default: { http: ['https://mainnet.base.org'] } },
            },
          ],
        }}
      >
        {children}
      </PrivyProvider>
    </QueryClientProvider>
  )
}
