// TachiCasino ABI
export const TACHI_CASINO_ABI = [
  {
    inputs: [
      { name: '_tachi', type: 'address' }
    ],
    stateMutability: 'nonpayable',
    type: 'constructor'
  },
  {
    inputs: [],
    name: 'TACHI',
    outputs: [{ type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { name: 'commitment', type: 'bytes32' },
      { name: 'betAmount', type: 'uint256' }
    ],
    name: 'commitGame',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'player', type: 'address' },
      { name: 'serverSecret', type: 'bytes32' }
    ],
    name: 'revealGame',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'playerSecret', type: 'bytes32' }
    ],
    name: 'resolveGame',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'cancelGame',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'withdrawCommunityPool',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getUserStats',
    outputs: [
      { name: 'won', type: 'uint256' },
      { name: 'lost', type: 'uint256' },
      { name: 'contributed', type: 'uint256' },
      { name: 'winRate', type: 'uint256' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'player', type: 'address' }],
    name: 'getGameState',
    outputs: [
      { name: 'hasActiveGame', type: 'bool' },
      { name: 'betAmount', type: 'uint256' },
      { name: 'revealed', type: 'bool' },
      { name: 'resolved', type: 'bool' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'communityPoolBalance',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'totalCommunityWon',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'totalCommunityBurned',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'player', type: 'address' }],
    name: 'activeGames',
    outputs: [
      { name: 'commitment', type: 'bytes32' },
      { name: 'betAmount', type: 'uint256' },
      { name: 'committedAt', type: 'uint256' },
      { name: 'serverSecret', type: 'bytes32' },
      { name: 'resolved', type: 'bool' },
      { name: 'isWin', type: 'bool' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'WIN_MULTIPLIER',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'BURN_PERCENT',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'COMMUNITY_PERCENT',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
];

// CommunityStakingPool ABI
export const COMMUNITY_STAKING_POOL_ABI = [
  {
    inputs: [{ name: '_tachi', type: 'address' }],
    stateMutability: 'nonpayable',
    type: 'constructor'
  },
  {
    inputs: [],
    name: 'TACHI',
    outputs: [{ type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'amount', type: 'uint256' }],
    name: 'deposit',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'player', type: 'address' },
      { name: 'volume', type: 'uint256' }
    ],
    name: 'updatePlayerVolume',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'distribute',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'forceDistribute',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'to', type: 'address' }],
    name: 'emergencyWithdraw',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getPoolStats',
    outputs: [
      { name: 'total', type: 'uint256' },
      { name: 'nextDistributionTime', type: 'uint256' },
      { name: 'availableForDistribution', type: 'uint256' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'totalDeposited',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
];

// CommunityBurner ABI
export const COMMUNITY_BURNER_ABI = [
  {
    inputs: [{ name: '_tachi', type: 'address' }],
    stateMutability: 'nonpayable',
    type: 'constructor'
  },
  {
    inputs: [],
    name: 'TACHI',
    outputs: [{ type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'amount', type: 'uint256' }],
    name: 'burn',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'totalBurned',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'totalCommunityBurned',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'totalBurners',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getStats',
    outputs: [
      { name: 'burned', type: 'uint256' },
      { name: 'tier', type: 'uint256' },
      { name: 'nextTierAmount', type: 'uint256' },
      { name: 'globalRank', type: 'uint256' }
    ],
    stateMutability: 'view',
    type: 'function'
  }
];
