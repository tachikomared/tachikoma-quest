export type QuestPlatform = 'farcaster' | 'x' | 'wallet' | 'referral' | 'daily';
export type QuestAction =
  | 'follow_user'
  | 'recast_cast'
  | 'like_cast'
  | 'quote_cast'
  | 'cast_in_channel'
  | 'link_wallet'
  | 'open_external'
  | 'daily_checkin';

export type QuestVerification =
  | 'fc_follow_user'
  | 'fc_cast_viewer_context'
  | 'fc_quote_cast'
  | 'fc_reply_cast'
  | 'wallet_signature'
  | 'manual_open'
  | 'wallet_balance'
  | 'wallet_burn'
  | 'referral_qualified'
  | 'daily_checkin';

export type QuestStatus = 'idle' | 'opened' | 'verifying' | 'verified' | 'failed';

export type QuestTarget = {
  targetFid?: number;
  castHash?: string;
  castUrl?: string;
  profileUrl?: string;
  url?: string;
  channelId?: string;
  defaultQuoteText?: string;
  min?: number;
};

export type QuestDef = {
  id: string;
  title: string;
  description: string;
  platform: QuestPlatform;
  action: QuestAction;
  verification: QuestVerification;
  points: number;
  tachiReward?: number;
  repeatable: boolean;
  enabled: boolean;
  target: QuestTarget;
  icon?: string;
};

export type User = {
  id: string;
  fcFid: number;
  fcUsername: string | null;
  fcDisplayName: string | null;
  fcPfpUrl: string | null;
  fcBio: string | null;
  fcScore: number | null;
  fcFollowers: number;
  fcFollowing: number;
  fcPowerBadge: boolean;
  referralCode: string;
  referredByCode: string | null;
  walletAddress: string | null;
  points: number;
  createdAt: string;
};

export const QUESTS: QuestDef[] = [
  {
    id: 'daily-checkin',
    title: 'Daily Check-In',
    description: 'Claim your daily XP — once every 24 hours',
    platform: 'daily',
    action: 'daily_checkin',
    verification: 'daily_checkin',
    points: 50,
    repeatable: true,
    enabled: true,
    target: {},
    icon: '📅',
  },
  {
    id: 'fc-follow-smolekoma',
    title: 'Follow @smolekoma',
    description: 'Follow the creator on Farcaster',
    platform: 'farcaster',
    action: 'follow_user',
    verification: 'fc_follow_user',
    points: 150,
    repeatable: false,
    enabled: true,
    target: { targetFid: 2656205, profileUrl: 'https://warpcast.com/smolekoma' },
    icon: '👤',
  },
  {
    id: 'fc-recast-launch',
    title: 'Recast Launch Cast',
    description: 'Recast the official TACHI Quest launch announcement',
    platform: 'farcaster',
    action: 'recast_cast',
    verification: 'fc_cast_viewer_context',
    points: 250,
    repeatable: false,
    enabled: true,
    target: {
      castHash: '0xa74dd319',
      castUrl: 'https://farcaster.xyz/smolekoma/0xa74dd319'
    },
    icon: '🔄',
  },
  {
    id: 'fc-like-launch',
    title: 'Like Launch Cast',
    description: 'Like the official TACHI Quest launch announcement',
    platform: 'farcaster',
    action: 'like_cast',
    verification: 'fc_cast_viewer_context',
    points: 100,
    repeatable: false,
    enabled: true,
    target: {
      castHash: '0xa74dd319',
      castUrl: 'https://farcaster.xyz/smolekoma/0xa74dd319'
    },
    icon: '❤️',
  },
  {
    id: 'wallet-link',
    title: 'Link Base Wallet',
    description: 'Link a Base wallet for airdrop eligibility',
    platform: 'wallet',
    action: 'link_wallet',
    verification: 'wallet_signature',
    points: 500,
    repeatable: false,
    enabled: true,
    target: {},
    icon: '💎',
  },
  {
    id: 'hodl-100',
    title: 'HODL 100 $TACHI',
    description: 'Hold 100+ $TACHI in your linked wallet',
    platform: 'wallet',
    action: 'link_wallet',
    verification: 'wallet_balance',
    points: 250,
    repeatable: false,
    enabled: true,
    target: { min: 100 },
    icon: '🪙',
  },
  {
    id: 'hodl-1k',
    title: 'HODL 1,000 $TACHI',
    description: 'Hold 1,000+ $TACHI in your linked wallet',
    platform: 'wallet',
    action: 'link_wallet',
    verification: 'wallet_balance',
    points: 750,
    repeatable: false,
    enabled: true,
    target: { min: 1000 },
    icon: '🪙',
  },
  {
    id: 'hodl-10k',
    title: 'HODL 10,000 $TACHI',
    description: 'Hold 10,000+ $TACHI in your linked wallet',
    platform: 'wallet',
    action: 'link_wallet',
    verification: 'wallet_balance',
    points: 1500,
    repeatable: false,
    enabled: true,
    target: { min: 10000 },
    icon: '🪙',
  },
  {
    id: 'hodl-100k',
    title: 'HODL 100,000 $TACHI',
    description: 'Hold 100,000+ $TACHI in your linked wallet',
    platform: 'wallet',
    action: 'link_wallet',
    verification: 'wallet_balance',
    points: 3000,
    repeatable: false,
    enabled: true,
    target: { min: 100000 },
    icon: '🪙',
  },
  {
    id: 'hodl-1m',
    title: 'HODL 1,000,000 $TACHI',
    description: 'Hold 1M+ $TACHI in your linked wallet',
    platform: 'wallet',
    action: 'link_wallet',
    verification: 'wallet_balance',
    points: 10000,
    repeatable: false,
    enabled: true,
    target: { min: 1000000 },
    icon: '🪙',
  },
  {
    id: 'hodl-10m',
    title: 'HODL 10,000,000 $TACHI',
    description: 'Hold 10M+ $TACHI in your linked wallet',
    platform: 'wallet',
    action: 'link_wallet',
    verification: 'wallet_balance',
    points: 25000,
    repeatable: false,
    enabled: true,
    target: { min: 10000000 },
    icon: '🪙',
  },
  {
    id: 'hodl-100m',
    title: 'HODL 100,000,000 $TACHI',
    description: 'Hold 100M+ $TACHI in your linked wallet',
    platform: 'wallet',
    action: 'link_wallet',
    verification: 'wallet_balance',
    points: 50000,
    repeatable: false,
    enabled: true,
    target: { min: 100000000 },
    icon: '🪙',
  },
  {
    id: 'hodl-1b',
    title: 'HODL 1B $TACHI',
    description: 'Hold 1B+ $TACHI in your linked wallet',
    platform: 'wallet',
    action: 'link_wallet',
    verification: 'wallet_balance',
    points: 100000,
    repeatable: false,
    enabled: true,
    target: { min: 1000000000 },
    icon: '🪙',
  },
  {
    id: 'hodl-10b',
    title: 'HODL 10B $TACHI',
    description: 'Hold 10B+ $TACHI in your linked wallet',
    platform: 'wallet',
    action: 'link_wallet',
    verification: 'wallet_balance',
    points: 250000,
    repeatable: false,
    enabled: true,
    target: { min: 10000000000 },
    icon: '🪙',
  },
  {
    id: 'x-follow',
    title: 'Follow on X',
    description: 'Follow @smolekoma on X',
    platform: 'x',
    action: 'open_external',
    verification: 'manual_open',
    points: 0,
    repeatable: false,
    enabled: true,
    target: { url: 'https://x.com/smolekoma' },
    icon: '🐦',
  },
];

export function getQuest(id: string): QuestDef | undefined {
  return QUESTS.find((q) => q.id === id);
}

export function getQuests(): QuestDef[] {
  return QUESTS.filter((q) => q.enabled);
}
