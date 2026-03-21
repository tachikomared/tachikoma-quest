export type QuestPlatform = 'farcaster' | 'x' | 'wallet' | 'referral';
export type QuestAction =
  | 'follow_user'
  | 'recast_cast'
  | 'like_cast'
  | 'quote_cast'
  | 'reply_cast'
  | 'cast_in_channel'
  | 'link_wallet'
  | 'open_external';

export type QuestVerification =
  | 'fc_follow_user'
  | 'fc_cast_viewer_context'
  | 'fc_quote_cast'
  | 'fc_reply_cast'
  | 'wallet_signature'
  | 'wallet_balance'
  | 'wallet_burn'
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
  minBalance?: string;
  requiredText?: string; // for quote/reply verification
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

// Community Burn Quests (for wrapper contract)
export const COMMUNITY_BURN_QUESTS: QuestDef[] = [
  {
    id: 'community-burn-bronze',
    title: 'Community Burner // Bronze',
    description: 'Burn 10,000+ $TACHI via community burner',
    platform: 'wallet',
    action: 'link_wallet',
    verification: 'wallet_burn',
    points: 1000,
    tachiReward: 0,
    repeatable: false,
    enabled: true,
    target: { minBalance: '10000' },
    icon: '🔥',
  },
  {
    id: 'community-burn-silver',
    title: 'Community Burner // Silver',
    description: 'Burn 100,000+ $TACHI via community burner',
    platform: 'wallet',
    action: 'link_wallet',
    verification: 'wallet_burn',
    points: 2500,
    tachiReward: 0,
    repeatable: false,
    enabled: true,
    target: { minBalance: '100000' },
    icon: '🔥🔥',
  },
  {
    id: 'community-burn-gold',
    title: 'Community Burner // Gold',
    description: 'Burn 1,000,000+ $TACHI via community burner',
    platform: 'wallet',
    action: 'link_wallet',
    verification: 'wallet_burn',
    points: 10000,
    tachiReward: 0,
    repeatable: false,
    enabled: true,
    target: { minBalance: '1000000' },
    icon: '🔥🔥🔥',
  },
];

// Daily streak quest
export const DAILY_QUEST: QuestDef = {
  id: 'daily-checkin',
  title: 'Daily Check-in',
  description: 'Complete any quest today to keep your streak alive!',
  platform: 'farcaster',
  action: 'open_external',
  verification: 'manual_open',
  points: 50,
  tachiReward: 0,
  repeatable: true,
  enabled: true,
  target: {},
  icon: '🔥',
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
    action: 'open_external',
    verification: 'fc_cast_viewer_context',
    points: 250,
    tachiReward: 0,
    repeatable: false,
    enabled: true,
    target: { 
      castHash: '0xb9230b95',
      castUrl: 'https://farcaster.xyz/smolekoma/0xb9230b95',
      defaultQuoteText: 'TACHI Quest is live https://farcaster.xyz/miniapps/nLEf2pIdso35/tachi-quest'
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
      castHash: '0xb9230b95',
      castUrl: 'https://farcaster.xyz/smolekoma/0xb9230b95',
      defaultQuoteText: 'TACHI Quest is live https://farcaster.xyz/miniapps/nLEf2pIdso35/tachi-quest'
    },
    icon: '❤️',
  },
  {
    id: 'fc-quote-launch',
    title: 'Quote Launch Cast',
    description: 'Quote the official TACHI Quest launch announcement',
    platform: 'farcaster',
    action: 'open_external',
    verification: 'fc_quote_cast',
    points: 300,
    tachiReward: 0,
    repeatable: false,
    enabled: true,
    target: { 
      castHash: '0xb9230b95',
      castUrl: 'https://farcaster.xyz/smolekoma/0xb9230b95',
      targetFid: 2656205,
      defaultQuoteText: 'TACHI Quest is live https://farcaster.xyz/miniapps/nLEf2pIdso35/tachi-quest'
    },
    icon: '💬',
  },
  {
    id: 'fc-reply-launch',
    title: 'Reply to Launch Cast',
    description: 'Reply to the official TACHI Quest launch announcement',
    platform: 'farcaster',
    action: 'open_external',
    verification: 'fc_reply_cast',
    points: 250,
    tachiReward: 0,
    repeatable: false,
    enabled: true,
    target: { 
      castHash: '0xb9230b95',
      castUrl: 'https://farcaster.xyz/smolekoma/0xb9230b95',
      targetFid: 2656205,
      requiredText: 'Just joined TACHI Quest https://farcaster.xyz/miniapps/nLEf2pIdso35/tachi-quest'
    },
    icon: '↩️',
  },
  {
    id: 'invite-only',
    title: 'Invite Only Access',
    description: 'Join via invite code or meet Farcaster trust thresholds',
    platform: 'farcaster',
    action: 'open_external',
    verification: 'manual_open',
    points: 0,
    tachiReward: 0,
    repeatable: false,
    enabled: true,
    target: {},
    icon: '🔒',
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
  {
    id: 'tachi-hodl',
    title: 'HODL $TACHI',
    description: 'Hold at least 100 $TACHI tokens in your linked wallet',
    platform: 'wallet',
    action: 'link_wallet',
    verification: 'wallet_balance',
    points: 1000,
    tachiReward: 0,
    repeatable: false,
    enabled: true,
    target: { minBalance: '100' },
    icon: '🦀',
  },
  {
    id: 'burn-bronze',
    title: 'CrabBurner // Bronze',
    description: 'Burn at least 10,000 $TACHI in your linked wallet',
    platform: 'wallet',
    action: 'link_wallet',
    verification: 'wallet_burn',
    points: 1000,
    tachiReward: 0,
    repeatable: false,
    enabled: true,
    target: { minBalance: '10000' },
    icon: '🥉',
  },
  {
    id: 'burn-silver',
    title: 'CrabBurner // Silver',
    description: 'Burn at least 100,000 $TACHI in your linked wallet',
    platform: 'wallet',
    action: 'link_wallet',
    verification: 'wallet_burn',
    points: 2500,
    tachiReward: 0,
    repeatable: false,
    enabled: true,
    target: { minBalance: '100000' },
    icon: '🥈',
  },
  {
    id: 'burn-gold',
    title: 'CrabBurner // Gold Degen',
    description: 'Burn at least 1,000,000 $TACHI in your linked wallet',
    platform: 'wallet',
    action: 'link_wallet',
    verification: 'wallet_burn',
    points: 10000,
    tachiReward: 0,
    repeatable: false,
    enabled: true,
    target: { minBalance: '1000000' },
    icon: '🥇',
  },
  {
    id: 'burn-diamond',
    title: 'CrabBurner // Diamond Degen',
    description: 'Burn at least 1,000,000,000 $TACHI in your linked wallet',
    platform: 'wallet',
    action: 'link_wallet',
    verification: 'wallet_burn',
    points: 100000,
    tachiReward: 0,
    repeatable: false,
    enabled: true,
    target: { minBalance: '1000000000' },
    icon: '💎',
  },
];

export function getQuest(id: string): QuestDef | undefined {
  return QUESTS.find((q) => q.id === id);
}

export function getQuests(): QuestDef[] {
  return QUESTS.filter((q) => q.enabled).sort((a, b) => (a.points - b.points));
}
