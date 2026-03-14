'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ProgressBarProps {
  current: number
  total: number
  points: number
}

export function ProgressBar({ current, total, points }: ProgressBarProps) {
  const percentage = Math.round((current / total) * 100)

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Quest Progress</h2>
          <p className="text-sm text-gray-400">
            {current} of {total} completed
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold gradient-text">{points}</div>
          <div className="text-xs text-gray-500">POINTS</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-4 overflow-hidden rounded-full bg-white/5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={cn(
            'h-full rounded-full bg-gradient-to-r from-tachikoma-cyan via-tachikoma-purple to-tachikoma-pink',
            percentage === 100 && 'animate-pulse'
          )}
        />
        
        {/* Shine effect */}
        <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent bg-[length:200%_100%]" />
      </div>

      {/* Milestones */}
      <div className="mt-4 flex justify-between text-xs text-gray-500">
        <span>Start</span>
        <span className={percentage >= 50 ? 'text-tachikoma-cyan' : ''}>Halfway</span>
        <span className={percentage === 100 ? 'text-tachikoma-success' : ''}>Complete</span>
      </div>
    </div>
  )
}
