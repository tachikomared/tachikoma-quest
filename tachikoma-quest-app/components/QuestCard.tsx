'use client'

import { motion } from 'framer-motion'
import { Check, ExternalLink, Loader2 } from 'lucide-react'
import { cn, Quest } from '@/lib/utils'

interface QuestCardProps {
  quest: Quest
  isCompleted: boolean
  isLoading: boolean
  onAction: () => void
}

export function QuestCard({ quest, isCompleted, isLoading, onAction }: QuestCardProps) {
  const getPlatformColor = () => {
    switch (quest.platform) {
      case 'x':
        return 'from-gray-800 to-gray-900 border-gray-700'
      case 'farcaster':
        return 'from-purple-900/30 to-violet-900/30 border-purple-500/30'
      case 'base':
        return 'from-blue-900/30 to-cyan-900/30 border-blue-500/30'
      default:
        return 'from-tachikoma-card to-tachikoma-darker border-white/10'
    }
  }

  const getPlatformIcon = () => {
    switch (quest.platform) {
      case 'x':
        return '𝕏'
      case 'farcaster':
        return 'F'
      case 'base':
        return '⬡'
      default:
        return '✦'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className={cn(
        'relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 card-hover',
        getPlatformColor(),
        isCompleted && 'opacity-75'
      )}
    >
      {/* Background glow */}
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-tachikoma-cyan/10 blur-3xl" />
      
      {/* Platform badge */}
      <div className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-sm font-bold">
        {getPlatformIcon()}
      </div>

      <div className="relative">
        {/* Points */}
        <div className="mb-3 inline-flex items-center gap-1 rounded-full bg-tachikoma-cyan/20 px-3 py-1 text-xs font-semibold text-tachikoma-cyan">
          +{quest.points} POINTS
        </div>

        {/* Title */}
        <h3 className="mb-1 text-lg font-bold text-white">{quest.title}</h3>
        
        {/* Description */}
        <p className="mb-4 text-sm text-gray-400">{quest.description}</p>

        {/* Action button */}
        <button
          onClick={onAction}
          disabled={isCompleted || isLoading}
          className={cn(
            'flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all',
            isCompleted
              ? 'bg-tachikoma-success/20 text-tachikoma-success'
              : 'btn-primary text-white'
          )}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isCompleted ? (
            <>
              <Check className="h-4 w-4" />
              Completed
            </>
          ) : (
            <>
              {quest.action === 'wallet' ? 'Connect Wallet' : 'Complete Quest'}
              <ExternalLink className="h-4 w-4" />
            </>
          )}
        </button>
      </div>

      {/* Completion overlay */}
      {isCompleted && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
          <div className="rounded-full bg-tachikoma-success/20 p-3">
            <Check className="h-8 w-8 text-tachikoma-success" />
          </div>
        </div>
      )}
    </motion.div>
  )
}
