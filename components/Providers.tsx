'use client'

import { PrivyProvider } from '@privy-io/react-auth'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  const [mounted, setMounted] = useState(false)
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || ''

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <QueryClientProvider client={queryClient}>
      {appId ? (
        <PrivyProvider
          appId={appId}
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
      ) : (
        children
      )}
    </QueryClientProvider>
  )
}
