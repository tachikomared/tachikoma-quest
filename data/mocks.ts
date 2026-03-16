// TACHI Token Contract on Base
export const TACHI_CONTRACT = '0x39B4B879b8521d6A8C3a87cda64b969327b7fbA3';

export const ERC20_BALANCE_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Mock leaderboard for fallback
export const MOCK_LEADERBOARD = [
  { rank: 1, username: 'smolekoma', displayName: 'smolekoma', pfpUrl: 'https://i.imgur.com/smolekoma.png', xp: 12500, badge: '🥇' },
  { rank: 2, username: 'tachikoma', displayName: 'Tachikoma', pfpUrl: 'https://i.imgur.com/tachikoma.png', xp: 9800, badge: '🥈' },
  { rank: 3, username: 'ghostshell', displayName: 'Ghost Shell', pfpUrl: 'https://i.imgur.com/ghostshell.png', xp: 8200, badge: '🥉' },
];

// Referral milestone rewards
export const MOCK_REFERRAL_REWARDS = [
  { milestone: 1, label: 'First Recruit', xp: 200, tachi: 100, claimed: false },
  { milestone: 3, label: 'Squad Leader', xp: 500, tachi: 250, claimed: false },
  { milestone: 5, label: 'Captain', xp: 1000, tachi: 500, claimed: false },
  { milestone: 10, label: 'Commander', xp: 2500, tachi: 1000, claimed: false },
];

// Mock user for fallback
export const MOCK_USER = {
  fid: 2656205,
  username: 'smolekoma',
  displayName: 'smolekoma',
  pfpUrl: 'https://i.imgur.com/smolekoma.png',
  bio: 'Building TACHI Quest 🦀',
  followers: 1250,
  following: 450,
  casts: 3200,
  walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
  isVerified: true,
  neynarScore: 0.85,
};
