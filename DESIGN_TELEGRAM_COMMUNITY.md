# Token-Gated Telegram Community for TACHI Quest

## Overview
Create a token-gated Telegram group where only TACHI token holders can join, inspired by clawdbotatg's approach.

## Implementation Plan

### 1. Community Tier Structure
- **Bronze Tier**: 100+ $TACHI held → Community member access
- **Silver Tier**: 1,000+ $TACHI held → Community + Discord role
- **Gold Tier**: 10,000+ $TACHI held → Community + Discord + special quests
- **Diamond Tier**: 100,000+ $TACHI held → Community + Discord + private channels

### 2. Token Verification Methods

#### Option A: Self-Service Verification (Simple)
- User enters wallet address in Telegram
- Bot checks if wallet holds 100+ $TACHI
- Auto-assigns role if eligible

#### Option B: Farcaster Verification (Recommended for TACHI Quest)
- User signs Farcaster message with wallet
- Bot verifies:
  1. Farcaster account ownership
  2. Wallet linked to Farcaster
  3. Wallet holds 100+ $TACHI
- Auto-assigns role

#### Option C: Wallet Verification via TachiQuest App
- User clicks "Verify Wallet" in TachiQuest
- App checks TACHI balance
- Returns verification proof to Telegram bot

### 3. Telegram Bot Features

#### Core Commands:
- `/verify` - Check and verify wallet TACHI balance
- `/status` - Show current community tier
- `/rank` - Show ranking vs other holders
- `/claim` - Claim daily XP bonus (community members only)
- `/quests` - View exclusive community quests

#### Automatic Actions:
- Detect wallet links in messages → auto-check TACHI balance
- Welcome message for new members with tier info
- Daily XP distribution to verified holders

### 4. Integration with TachiQuest

#### Sync Tasks:
- [ ] Add Telegram token-gating to community quests
- [ ] XP bonuses for community members
- [ ] Exclusive "Community Builder" quests
- [ ] Leaderboard sync (Telegram top holders)

#### Data Flow:
```
Wallet ↔ TachiQuest App ↔ Telegram Bot
     ↓              ↓              ↓
  TACHI Balance  ↔  API Call  ↔  Role Assignment
```

### 5. Technical Implementation

#### Telegram Bot Setup:
```bash
# Create bot via @BotFather
# Get bot token from Telegram

# Install dependencies
npm install telegraf
npm install viem
```

#### Bot Logic:
```javascript
// Check TACHI balance
const tachiContract = '0x39B4B879b8521d6A8C3a87cda64b969327b7fbA3';
const balance = await readContract({
  address: tachiContract,
  abi: [ ERC20_ABI ],
  functionName: 'balanceOf',
  args: [walletAddress],
});

// Assign tier based on balance
const tier = getTier(balance);
await tg.setChatMemberStatus(chatId, userId, tier);
```

### 6. Security Considerations

- Verify wallet ownership before assigning roles
- Prevent Sybil attacks (multiple wallet checks)
- Rate limit verification requests
- Log all verification actions for audit trail

### 7. UI/UX in TachiQuest

#### Verification Page:
```
┌─────────────────────────────┐
│  🤖 Telegram Verification  │
├─────────────────────────────┤
│ Wallet: 0x123...456         │
│ TACHI Balance: 1,250        │
│ Tier: Silver ✅             │
│                             │
│ [LINK TO TELEGRAM]        │
└─────────────────────────────┘
```

### 8. Benefits for Community

- **Exclusivity**: Only serious holders can join
- **Value**: Holding TACHI = real community access
- **Engagement**: Daily XP, exclusive quests
- **Social Proof**: Visible tier system

---

## Next Steps

1. **Create Telegram Bot** via @BotFather
2. **Add bot to TachiQuest group** with admin permissions
3. **Implement verification logic** using TACHI contract
4. **Add tier system** with role assignments
5. **Integrate with TachiQuest app** for Farcaster verification
6. **Test end-to-end flow**
7. **Announce to community**

## Potential Bot Names

- @TachiQuestBot
- @TachiGuardBot  
- @TachiCommunityBot
- @TachiClawBot

---

## References

- clawdbotatg Telegram: https://t.me/clawdbotatg
- Token gating guide: https://blocksurvey.io/token-gating/how-to-token-gate-telegram
- Telegram bot docs: https://docs.openclaw.ai/channels/telegram