import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const QUESTS = [
  {
    id: 'follow-x',
    title: 'Follow on X',
    description: 'Follow @smolekoma_bot on X (Twitter)',
    points: 100,
    action: 'follow',
    url: 'https://x.com/smolekoma_bot',
    platform: 'x',
  },
  {
    id: 'repost-x',
    title: 'Repost on X',
    description: 'Repost our announcement on X',
    points: 200,
    action: 'repost',
    url: 'https://x.com/smolekoma_bot/status/...',
    platform: 'x',
  },
  {
    id: 'follow-farcaster',
    title: 'Follow on Farcaster',
    description: 'Follow @smolekoma on Farcaster',
    points: 150,
    action: 'follow',
    url: 'https://warpcast.com/smolekoma',
    platform: 'farcaster',
  },
  {
    id: 'repost-farcaster',
    title: 'Recast on Farcaster',
    description: 'Recast our announcement cast',
    points: 250,
    action: 'recast',
    url: 'https://warpcast.com/smolekoma/...',
    platform: 'farcaster',
  },
  {
    id: 'submit-wallet',
    title: 'Submit Wallet',
    description: 'Connect your wallet for $TACHI airdrop on Base',
    points: 500,
    action: 'wallet',
    platform: 'base',
  },
] as const

export type Quest = typeof QUESTS[number]
export type QuestId = Quest['id']
