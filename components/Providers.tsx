'use client'

import { PrivyProvider } from '@privy-io/react-auth'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
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

import React from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || ''

  return (
    <QueryClientProvider client={queryClient}>
      {appId ? (
        <ErrorBoundary>
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
        </ErrorBoundary>
      ) : (
        children
      )}
    </QueryClientProvider>
  )
}
