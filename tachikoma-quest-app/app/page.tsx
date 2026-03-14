'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { QuestCard } from '@/components/QuestCard'
import { ProgressBar } from '@/components/ProgressBar'
import { ShareButton } from '@/components/ShareButton'
import { WalletButton } from '@/components/WalletButton'
import { QUESTS, QuestId } from '@/lib/utils'
import { usePrivy } from '@privy-io/react-auth'

const STORAGE_KEY = 'tachikoma.quest.completed'

export default function HomePage() {
  const { user, authenticated, login } = usePrivy()
  const [completed, setCompleted] = useState<QuestId[]>([])
  const [loading, setLoading] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setCompleted(JSON.parse(stored))
      } catch {
        // ignore
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(completed))
  }, [completed])

  const progress = useMemo(() => {
    const points = completed.reduce((acc, id) => {
      const quest = QUESTS.find((q) => q.id === id)
      return acc + (quest?.points || 0)
    }, 0)
    return { current: completed.length, total: QUESTS.length, points }
  }, [completed])

  const handleComplete = (id: QuestId) => {
    if (!completed.includes(id)) {
      setCompleted((prev) => [...prev, id])
    }
  }

  const handleQuestAction = async (id: QuestId) => {
    const quest = QUESTS.find((q) => q.id === id)
    if (!quest) return

    setLoading((prev) => ({ ...prev, [id]: true }))

    try {
      if (quest.action === 'wallet') {
        if (!authenticated) {
          await login()
        }

        const address = user?.wallet?.address
        if (address) {
          await fetch('/api/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              walletAddress: address,
              farcasterFid: user?.farcaster?.fid,
              farcasterUsername: user?.farcaster?.username,
            }),
          })
          handleComplete(id)
        }
        return
      }

      // Open quest URL
      if (quest.url) {
        window.open(quest.url, '_blank')
      }

      // Farcaster verification if we have an FID
      if (quest.platform === 'farcaster' && user?.farcaster?.fid) {
        const params = new URLSearchParams({
          fid: String(user.farcaster.fid),
          type: quest.action,
        })
        const res = await fetch(`/api/verify?${params.toString()}`)
        const data = await res.json()
        if (data?.verified) {
          handleComplete(id)
          return
        }
      }

      // Fallback: self-report completion for X or unverifiable actions
      handleComplete(id)
    } catch (err) {
      console.error('Quest action failed:', err)
    } finally {
      setLoading((prev) => ({ ...prev, [id]: false }))
    }
  }

  return (
    <main className="min-h-screen px-5 pb-20 pt-10">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-10 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-tachikoma-cyan to-tachikoma-purple p-0.5">
                <div className="flex h-full w-full items-center justify-center rounded-2xl bg-tachikoma-dark text-lg font-bold">
                  🕷️
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">TACHIKOMA QUEST</h1>
                <p className="text-sm text-gray-400">Complete viral quests, earn $TACHI on Base</p>
              </div>
            </div>
            <WalletButton />
          </div>

          <div className="glass rounded-3xl p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-xl">
                <h2 className="mb-2 text-xl font-semibold gradient-text">The Viral Airdrop Campaign</h2>
                <p className="text-sm text-gray-400">
                  Join the Tachikoma swarm. Recast, repost, and spread the signal — every quest earns points toward the $TACHI airdrop.
                </p>
              </div>
              <ShareButton />
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="glass mb-8 rounded-3xl p-6">
          <ProgressBar current={progress.current} total={progress.total} points={progress.points} />
        </div>

        {/* Quest list */}
        <div className="grid gap-6 md:grid-cols-2">
          {QUESTS.map((quest) => (
            <QuestCard
              key={quest.id}
              quest={quest}
              isCompleted={completed.includes(quest.id)}
              isLoading={!!loading[quest.id]}
              onAction={() => handleQuestAction(quest.id)}
            />
          ))}
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-12 text-center text-xs text-gray-500"
        >
          Powered by Neynar + Privy • Built for the $TACHI swarm on Base
        </motion.div>
      </div>
    </main>
  )
}
