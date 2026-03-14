'use client'

import { usePrivy } from '@privy-io/react-auth'
import { Wallet, LogOut, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export function WalletButton() {
  const { login, logout, authenticated, user, ready } = usePrivy()

  if (!ready) {
    return (
      <button
        disabled
        className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-sm text-gray-400"
      >
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-tachikoma-cyan border-t-transparent" />
        Loading...
      </button>
    )
  }

  if (authenticated && user) {
    const wallet = user.wallet
    const address = wallet?.address
    const displayAddress = address 
      ? `${address.slice(0, 6)}...${address.slice(-4)}`
      : user.farcaster?.username || 'Connected'

    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-tachikoma-cyan/20 to-tachikoma-purple/20 px-4 py-2">
          <Wallet className="h-4 w-4 text-tachikoma-cyan" />
          <span className="text-sm font-medium text-white">{displayAddress}</span>
          {user.farcaster && (
            <span className="text-xs text-tachikoma-cyan">@{user.farcaster.username}</span>
          )}
        </div>
        <button
          onClick={logout}
          className="rounded-xl bg-white/5 p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={login}
      className={cn(
        'flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white',
        'bg-gradient-to-r from-tachikoma-cyan to-tachikoma-purple',
        'transition-all hover:shadow-lg hover:shadow-tachikoma-cyan/25'
      )}
    >
      <Wallet className="h-4 w-4" />
      Connect Wallet
    </button>
  )
}
