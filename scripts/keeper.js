#!/usr/bin/env node
/**
 * TACHI Casino Keeper Service
 * 
 * This script monitors the TachiCasino contract for committed games,
 * reveals them with server secrets, and triggers resolution after timeout.
 * 
 * Usage: node scripts/keeper.js
 */

const { ethers } = require('ethers');
require('dotenv').config();

// Contract addresses (deployed on Base)
const TACHI_CASINO_ADDRESS = process.env.TACHI_CASINO_ADDRESS || '0x0000000000000000000000000000000000000000';
const TACHI_TOKEN_ADDRESS = '0x39B4B879b8521d6A8C3a87cda64b969327b7fbA3';

// ABI for TachiCasino
const TACHI_CASINO_ABI = [
  'event GameCommitted(address indexed player, bytes32 commitment, uint256 betAmount)',
  'event GameRevealed(address indexed player, bytes32 serverSecret)',
  'event GameResolved(address indexed player, bool isWin, uint256 payout, uint256 burned, uint256 toCommunity)',
  'function revealGame(address player, bytes32 serverSecret) external',
  'function resolveGame(bytes32 playerSecret) external',
  'function cancelGame() external',
  'function activeGames(address player) view returns (bytes32 commitment, uint256 betAmount, uint256 committedAt, bytes32 serverSecret, bool resolved, bool isWin)',
  'function getGameState(address player) view returns (bool hasActiveGame, uint256 betAmount, bool revealed, bool resolved)',
];

// Configuration
const CONFIG = {
  pollInterval: 5000, // 5 seconds
  timeoutBlocks: 100, // 100 blocks (~15 minutes on Base)
  keeperSecretPrefix: '0xKEEPER_', // Prefix for keeper secrets
};

async function main() {
  console.log('🚀 TACHI Casino Keeper Service Starting...');
  
  // Connect to Base network
  const provider = new ethers.JsonRpcProvider('https://base-mainnet.g.alchemy.com/v2/' + process.env.ALCHEMY_API_KEY);
  const wallet = new ethers.Wallet(process.env.KEEPER_PRIVATE_KEY || '0x0000000000000000000000000000000000000000000000000000000000000000', provider);
  const casino = new ethers.Contract(TACHI_CASINO_ADDRESS, TACHI_CASINO_ABI, wallet);
  
  console.log(`orking with Casino contract: ${casino.target}`);
  console.log(`Keeper address: ${wallet.address}`);
  
  // Filter for GameCommitted events
  const filter = casino.filters.GameCommitted(null, null, null);
  
  console.log('🔍 Listening for GameCommitted events...');
  
  // Process past events (last 1000 blocks)
  const lastBlock = await provider.getBlockNumber();
  const fromBlock = Math.max(0, lastBlock - 1000);
  
  const pastEvents = await casino.queryFilter(filter, fromBlock, 'latest');
  console.log(`📋 Found ${pastEvents.length} past committed games`);
  
  for (const event of pastEvents) {
    await processGame(event);
  }
  
  // Listen for new events
  casino.on(filter, (player, commitment, betAmount, event) => {
    console.log(`🔔 New game committed: ${player}, bet: ${betAmount}`);
    processGame(event);
  });
  
  // Handle uncaught errors
  process.on('uncaughtException', (err) => {
    console.error('❌ Error:', err);
    console.log('⏰ Restarting in 5 seconds...');
    setTimeout(main, 5000);
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌Unhandled rejection:', reason);
  });
}

async function processGame(event) {
  const player = event.args.player;
  const commitment = event.args.commitment;
  const betAmount = event.args.betAmount;
  const committedAt = event.args.committedAt;
  
  console.log(`🔄 Processing game for ${player}`);
  
  try {
    // Check if game is already revealed
    const gameState = await casino.getGameState(player);
    if (gameState.revealed) {
      console.log(`   Game already revealed for ${player}`);
      return;
    }
    
    if (gameState.resolved) {
      console.log(`   Game already resolved for ${player}`);
      return;
    }
    
    // Check timeout
    const currentBlock = await ethers.provider.getBlockNumber();
    const blocksSinceCommit = currentBlock - committedAt;
    
    if (blocksSinceCommit < CONFIG.timeoutBlocks) {
      console.log(`   Game too fresh (${blocksSinceCommit}/${CONFIG.timeoutBlocks} blocks), waiting...`);
      return;
    }
    
    // Generate server secret
    const serverSecret = ethers.hexlify(ethers.randomBytes(32));
    console.log(`   Revealing game for ${player} with secret: ${serverSecret.substring(0, 10)}...`);
    
    // Call revealGame
    const tx = await casino.revealGame(player, serverSecret);
    console.log(`   Reveal transaction: ${tx.hash}`);
    await tx.wait();
    console.log(`   ✅ Game revealed`);
    
  } catch (error) {
    console.error(`   ❌ Error processing game for ${player}:`, error.message);
  }
}

// Auto-reveal if not revealed within timeout
async function autoReveal(player) {
  try {
    const gameState = await casino.getGameState(player);
    if (gameState.revealed || gameState.resolved) return;
    
    const currentBlock = await ethers.provider.getBlockNumber();
    const blocksSinceCommit = currentBlock - gameState.committedAt;
    
    if (blocksSinceCommit >= CONFIG.timeoutBlocks) {
      const serverSecret = ethers.hexlify(ethers.randomBytes(32));
      const tx = await casino.revealGame(player, serverSecret);
      await tx.wait();
      console.log(`   ⏱️ Auto-revealed game for ${player}`);
    }
  } catch (e) {
    console.error(`   Auto-reveal error:`, e.message);
  }
}

// Auto-resolve if revealed but not resolved
async function autoResolve(player) {
  try {
    const gameState = await casino.getGameState(player);
    if (!gameState.revealed || gameState.resolved) return;
    
    // We need to get the player's secret from our database
    // For now, this would require a separate database integration
    console.log(`   Game revealed but not resolved for ${player}`);
    console.log(`   Need to retrieve player secret from DB to resolve`);
    
  } catch (e) {
    console.error(`   Auto-resolve error:`, e.message);
  }
}

main().catch(console.error);
