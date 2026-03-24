export type QuestPlatform = 'farcaster' | 'x' | 'wallet' | 'referral';
export type QuestAction =
  | 'follow_user'
  | 'recast_cast'
  | 'like_cast'
  | 'quote_cast'
  | 'cast_in_channel'
  | 'link_wallet'
  | 'open_external';

export type QuestVerification =
  | 'fc_follow_user'
  | 'fc_cast_viewer_context'
  | 'wallet_signature'
  | 'manual_open'
  | 'referral_qualified';

export type QuestStatus = 'idle' | 'opened' | 'verifying' | 'verified' | 'failed';

export type QuestTarget = {
  targetFid?: number;
  castHash?: string;
  castUrl?: string;
  url?: string;
  channelId?: string;
  defaultQuoteText?: string;
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

export type LeaderboardEntry = {
  rank: number;
  fid: number;
  username: string | null;
  displayName: string | null;
  pfpUrl: string | null;
  points: number;
};

export type Referral = {
  id: string;
  username: string | null;
  displayName: string | null;
  pfpUrl: string | null;
  qualified: boolean;
  createdAt: string;
};

export type ReferralReward = {
  milestone: number;
  label: string;
  xp: number;
  tachi?: number;
  claimed: boolean;
};

export const QUESTS: QuestDef[] = [
  {
    id: 'fc-follow-smolekoma',
    title: 'Follow @smolekoma',
    description: 'Follow the creator on Farcaster',
    platform: 'farcaster',
    action: 'follow_user',
    verification: 'fc_follow_user',
    points: 150,
    tachiReward: 0,
    repeatable: false,
    enabled: true,
    target: { targetFid: 2656205 },
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
    tachiReward: 0,
    repeatable: false,
    enabled: true,
    target: { 
      castHash: '0x400e79ed5f99b2c9ac35c880fddf80672c3ea37a',
      castUrl: 'https://warpcast.com/smolekoma/0x400e79ed'
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
    tachiReward: 0,
    repeatable: false,
    enabled: true,
    target: { 
      castHash: '0x400e79ed5f99b2c9ac35c880fddf80672c3ea37a',
      castUrl: 'https://warpcast.com/smolekoma/0x400e79ed'
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
    tachiReward: 100,
    repeatable: false,
    enabled: true,
    target: {},
    icon: '💎',
  },
  {
    id: 'x-follow',
    title: 'Follow on X',
    description: 'Follow @smolekoma on X (formerly Twitter)',
    platform: 'x',
    action: 'open_external',
    verification: 'manual_open',
    points: 0,
    tachiReward: 0,
    repeatable: false,
    enabled: true,
    target: { url: 'https://x.com/smolekoma' },
    icon: '🐦',
  },
  {
    id: 'x-like-tweet',
    title: 'Like Announcement',
    description: 'Like the TACHI Quest announcement tweet',
    platform: 'x',
    action: 'open_external',
    verification: 'manual_open',
    points: 0,
    tachiReward: 0,
    repeatable: false,
    enabled: true,
    target: { url: 'https://x.com/smolekoma/status/2029672279416721648' },
    icon: '💙',
  },
];

export function getQuest(id: string): QuestDef | undefined {
  return QUESTS.find((q) => q.id === id);
}

export function getQuests(): QuestDef[] {
  return QUESTS.filter((q) => q.enabled).sort((a, b) => (a.points - b.points));
}
