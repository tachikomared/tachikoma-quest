# TACHI CASINO — Addictive Viral Game Design

## Core Concept
**"TACHI Roulette"** — A simple, addictive, shareable casino game with community staking & burning mechanics.

## Game Mechanics

### 1. Basic Gameplay
- Player stakes `X` TACHI tokens
- Game rolls virtual dice (deterministic commit-reveal)
- **Win**: Get `2X` TACHI back + 50 XP
- **Lose**: 90% burned, 10% goes to community staking pool

### 2. Viral Addictive Elements
- **Double-or-nothing feeling** (50% win chance)
- **Community pool grows** when you lose → creates FOMO
- **Burn animation** with satisfying visual/sound
- **Shareable results**: "I just won 500 TACHI! 🔥" / "Lost 100 TACHI to the burn pool 💀"

### 3. Community Staking Pool
- All losing TACHI (10%) accumulates in a community staking contract
- Pool auto-compounds via DeFi yield (Aave/Compound on Base)
- Weekly: Top 10 players by volume get share of staking rewards
- Creates **positive-sum feel**: even losers contribute to community wealth

### 4. Burn Mechanics
- 90% of losing TACHI gets burned (sent to dead address)
- **Burn leaderboard**: "Top Burners" (who sacrificed most)
- **Burn badges**: "Pyro", "Inferno", "Dragon" tiers
- **Burn quests**: "Burn 10,000 TACHI this week" → exclusive badge

## Smart Contract Architecture

### 1. TachiCasino.sol (Main Game)
```solidity
// Commit-reveal randomness (from ClawdGamesProto)
function commitPlay(bytes32 commitment, uint256 betAmount)
function fulfillSeed(address player, bytes32 keeperSecret)
function resolve(address player, bool isWin)

// Payouts:
// Win: 2× bet to player
// Lose: 90% burn, 10% to community staking pool
```

### 2. CommunityStakingPool.sol
```solidity
// Auto-compounds via Beefy/Yearn strategy on Base
function deposit(uint256 amount) // from casino losses
function claimRewards(address user) // weekly distribution
function getPoolTVL() returns (uint256)
```

### 3. CommunityBurner.sol (Wrapper)
```solidity
// Tracks burns since native pool is locked
function burn(uint256 amount) external
event CommunityBurn(address indexed user, uint256 amount, uint256 totalBurned)
```

## Viral Sharing Features

### 1. Result Cards
```
🎰 TACHI ROULETTE 🎰

@shikamarunft just WON 500 $TACHI! 🔥
Bet: 250 TACHI | Multiplier: 2×
Community Pool: 1,240 TACHI

Play now: https://tachi-quest.vercel.app/casino
```

### 2. Leaderboards
- **Top Winners** (most TACHI won)
- **Top Burners** (most TACHI sacrificed)
- **Top Contributors** (most to community pool)

### 3. Daily/Weekly Challenges
- "Win 3 games today" → 100 XP
- "Lose 5 games this week" → "Unlucky" badge (ironic status)
- "Contribute 1000 TACHI to community pool" → "Philanthropist" badge

## XP & Reward Integration

### XP Awards:
- Win: +50 XP
- Lose: +10 XP (consolation)
- Burn 100+ TACHI: +20 XP
- Daily casino player: +30 XP streak

### Quest Integration:
- **"High Roller"**: Win 500 TACHI in one game (500 XP)
- **"Community Builder"**: Contribute 100 TACHI to staking pool (300 XP)
- **"Pyromaniac"**: Burn 1000 TACHI total (1000 XP + badge)

## UI Flow

### 1. Casino Landing
- Big "SPIN" button with animated wheel
- Bet amount selector: 10, 50, 100, 250, 500, 1000 TACHI
- Current odds display: 50% win, 90% burn on loss
- Community pool TVL + your potential share

### 2. Game Animation
- Wheel spins → dramatic pause → result
- **WIN**: Confetti, TACHI raining animation
- **LOSE**: Fire animation burning tokens, "10% went to community pool"

### 3. Results Screen
- Immediate share button (cast to Farcaster)
- "Play again" button
- View community pool details

## Technical Implementation Order

### Phase 1: Contracts
1. **CommunityBurner.sol** (simple wrapper for tracking burns)
2. **TachiCasino.sol** (adapt ClawdGamesProto LootBoxGame)
3. **CommunityStakingPool.sol** (simple yield accumulator)

### Phase 2: Backend
1. Casino API endpoints: `/api/casino/play`, `/api/casino/stats`
2. Result sharing image generation
3. Leaderboard updates

### Phase 3: Frontend
1. Casino page (`/casino`) with game UI
2. Animations (CSS + Lottie)
3. Integration with existing token balance/XP system

## Expected Viral Loops

### Loop 1: Win Sharing
```
Win → Share cast → Friends see → Try → Win/Lose → Share
```

### Loop 2: Burn Status
```
Lose → Burned tokens → "I sacrificed for the community" → Status → Others want status
```

### Loop 3: Community Wealth
```
Community pool grows → Players want share → Play more → Pool grows more
```

## Monetization (Optional)
- 1% house edge on wins → funds development
- Optional "Turbo Spin" (pay ETH for better odds)
- NFT avatars for top players

## Success Metrics
- **Daily active players in casino**
- **TACHI burned per day**
- **Community pool TVL**
- **Shares/casts generated**
- **Retention: players returning next day**

---

## Immediate Next Steps

1. **Design CommunityBurner contract** (simple, tracks burns)
2. **Adapt ClawdGamesProto** for TACHI token + our burn/staking split
3. **Create casino API route** for game logic
4. **Build basic UI** with spin animation

The game should feel **low-stakes but high-emotion** — like a crypto version of a gacha pull. The community elements make losing feel meaningful rather than purely negative.