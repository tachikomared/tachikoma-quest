'use client'

import { useState } from 'react'
import { Share2, Check, Copy } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function ShareButton() {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : ''
    const text = '🎯 Complete quests & earn $TACHI rewards! Join the Tachikoma airdrop now 👇'

    // Try native share first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'TACHI Quest',
          text,
          url: shareUrl,
        })
        return
      } catch {
        // User cancelled, fall through to clipboard
      }
    }

    // Fallback to clipboard
    try {
      await navigator.clipboard.writeText(`${text} ${shareUrl}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <motion.button
      onClick={handleShare}
      whileTap={{ scale: 0.95 }}
      className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
    >
      <AnimatePresence mode="wait">
        {copied ? (
          <motion.span
            key="check"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="flex items-center gap-2 text-tachikoma-success"
          >
            <Check className="h-4 w-4" />
            Copied!
          </motion.span>
        ) : (
          <motion.span
            key="share"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="flex items-center gap-2"
          >
            <Share2 className="h-4 w-4" />
            Share
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}
