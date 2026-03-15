export type QuestPlatform = 'farcaster' | 'x' | 'wallet' | 'referral';
export type QuestAction =
  | 'follow_user'
  | 'recast_cast'
  | 'like_cast'
  | 'link_wallet'
  | 'open_external'
  | 'referral_qualified';

export type QuestVerification =
  | 'fc_follow_user'
  | 'fc_cast_viewer_context'
  | 'wallet_signature'
  | 'manual_open'
  | 'referral_qualified';

export type QuestTarget = {
  targetFid?: number;
  castHash?: string;
  castUrl?: string;
  url?: string;
};

export type QuestDef = {
  id: string;
  title: string;
  description: string;
  platform: QuestPlatform;
  action: QuestAction;
  verification: QuestVerification;
  points: number;
  repeatable: boolean;
  enabled: boolean;
  target: QuestTarget;
};

export const QUESTS: QuestDef[] = [
  {
    id: 'fc-follow-main',
    title: 'Follow on Farcaster',
    description: 'Follow @smolekoma on Farcaster',
    platform: 'farcaster',
    action: 'follow_user',
    verification: 'fc_follow_user',
    points: 150,
    repeatable: false,
    enabled: true,
    target: { targetFid: Number(process.env.FC_TARGET_FID || 2656205) },
  },
  {
    id: 'fc-recast-launch',
    title: 'Recast launch cast',
    description: 'Recast the official launch cast',
    platform: 'farcaster',
    action: 'recast_cast',
    verification: 'fc_cast_viewer_context',
    points: 250,
    repeatable: false,
    enabled: true,
    target: {
      castHash: process.env.FC_LAUNCH_CAST_HASH,
      castUrl: process.env.FC_LAUNCH_CAST_URL,
    },
  },
  {
    id: 'wallet-link',
    title: 'Link wallet',
    description: 'Link a Base wallet for airdrop eligibility',
    platform: 'wallet',
    action: 'link_wallet',
    verification: 'wallet_signature',
    points: 500,
    repeatable: false,
    enabled: true,
    target: {},
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
  },
  {
    id: 'x-like-tweet',
    title: 'Like the announcement tweet',
    description: 'Open and like the announcement tweet',
    platform: 'x',
    action: 'open_external',
    verification: 'manual_open',
    points: 0,
    repeatable: false,
    enabled: true,
    target: { url: 'https://x.com/smolekoma/status/2029672279416721648?s=20' },
  },
];

export function getQuest(id: string) {
  return QUESTS.find((q) => q.id === id);
}
