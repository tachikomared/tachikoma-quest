'use client'

import React, { useEffect, useState } from 'react'
import { PrivyProvider } from '@privy-io/react-auth'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

class PrivyErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return <>{this.props.children}</>
    }
    return this.props.children
  }
}

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
        <PrivyErrorBoundary>
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
        </PrivyErrorBoundary>
      ) : (
        children
      )}
    </QueryClientProvider>
  )
}
