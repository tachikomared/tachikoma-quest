export type QuestStatus = 'completed' | 'in_progress';

export type QuestType = 'recast' | 'follow' | 'quote' | 'like' | 'cast';

export type QuestTarget = {
  type: 'cast' | 'profile';
  authorName: string;
  authorUsername: string;
  authorPfp: string;
  content: string;
  /** Cast hash for recast/like/quote quests (0x-prefixed Farcaster cast hash) */
  castHash?: string;
  /** Farcaster FID for follow quests */
  targetFid?: number;
  /** Pre-filled quote text for quote quests */
  defaultQuoteText?: string;
};

export type Quest = {
  id: number;
  type: QuestType;
  icon: string;
  label: string;
  description: string;
  xp: number;
  tachi?: number;
  status: QuestStatus;
  actionLabel: string;
  target: QuestTarget;
  /** For 'cast' quests: the channel to post in */
  channelId?: string;
};

export type LeaderboardEntry = {
  rank: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  xp: number;
  badge: string;
};

export type Referral = {
  username: string;
  displayName: string;
  pfpUrl: string;
  joinedAt: string;
  questsDone: number;
  status: 'active' | 'pending';
};

export type ReferralReward = {
  milestone: number;
  label: string;
  xp: number;
  tachi?: number;
  claimed: boolean;
};

export type AccessState = 'checking' | 'granted' | 'blocked' | 'ref-entry' | 'ref-success';

export type Tab = 'quests' | 'refer' | 'leaderboard' | 'profile';
