# TACHI CASINO — Implementation Progress

## ✅ Completed
- Casino tab added to navigation (5 tabs: missions, warroom, enlist, pilot, casino)
- Database schema and migration (002_add_casino_tables.sql)
- Smart contracts:
  - `contracts/TachiCasino.sol` - Commit-reveal casino game
  - `contracts/CommunityStakingPool.sol` - Pool for community contributions
  - `contracts/CommunityBurner.sol` (already existed)
- Deploy script updated (contracts/deploy.js)
- Keeper service (scripts/keeper.js)
- Contract ABIs (lib/contracts/casino.ts)
- Farcaster share cards (components/casino-result-card.tsx)
- Complete casino page (app/casino/page.tsx) with:
  - Commit/Reveal/Resolve flow
  - Result card (win/loss display)
  - Community pool tracker
  - Stats display

## 🔄 In Progress

### 1. On-Chain Integration
- [x] Add contract ABI to frontend
- [x] Setup wagmi hooks for contract calls
- [ ] **TODO: Deploy contracts to Base**
- [ ] Replace placeholder addresses with real contract addresses
- [ ] Test full transaction flow on testnet
- [ ] Verify token transfers match contract logic

### 2. Keeper Automation
- [x] Basic keeper script (scripts/keeper.js)
- [ ] Start keeper service (requires PRIVATE_KEY, ALCHEMY_API_KEY)
- [ ] Set up cron for automatic reveals
- [ ] Handle timeout auto-resolve

### 3. UI Animations & Polish
- [ ] Add spin/roulette animation
- [ ] Win/lose visual feedback (confetti, fire)
- [ ] Result share cards (Farcaster ready)
- [ ] Community pool TVL display
- [ ] Leaderboard integration

### 4. Farcaster Integration
- [ ] Cast template for wins
- [ ] Cast template for losses
- [ ] Shareable badge cards

### 5. Quest Integration
- [ ] "High Roller" quest
- [ ] "Community Builder" quest
- [ ] "Pyromaniac" quest

### 6. Token-Gated Telegram Community
- [x] Design document (DESIGN_TELEGRAM_COMMUNITY.md)
- [x] Telegram bot script (scripts/telegram-bot.js)
- [x] Tier system implementation
- [x] TACHI balance verification via viem
- [ ] Deploy bot to @BotFather
- [ ] Add bot to @tachiquest group
- [ ] Test end-to-end verification flow

---

## Next Immediate Steps

1. **Deploy contracts to Base Sepolia testnet:**
   ```bash
   cd contracts
   npm install
   npx hardhat compile
   npx hardhat run deploy.js --network base-sepolia
   ```

2. **Update contract addresses** in:
   - `app/casino/page.tsx`
   - `scripts/keeper.js`
   - `TODO_CASINO.md`

3. **Start keeper service:**
   ```bash
   node scripts/keeper.js
   ```

4. **Test on Farcaster mini app** with real wallet

5. **Deploy Telegram bot:**
   ```bash
   # Create bot via @BotFather on Telegram
   # Add bot token to .env
   node scripts/telegram-bot.js
   ```

6. **Add bot to TachiQuest Telegram group**

## Notes
- Player secret currently generated client-side (should be stored in encrypted session)
- Win/loss calculation currently simulated (should come from contract event)
- Community pool TVL hard-coded (should read from contract)
- Telegram bot uses viem to read TACHI balance from blockchain