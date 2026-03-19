#!/usr/bin/env node
/**
 * TACHI Quest Telegram Bot
 * 
 * Token-gated community bot that verifies users' TACHI holdings
 * and assigns appropriate community tiers.
 */

const { Telegraf, Markup, session } = require('telegraf');
const { http, publicActions, createWalletClient, custom } = require('viem');
const { base } = require('viem/chains');

require('dotenv').config();

// TACHI Token Contract on Base
const TACHI_CONTRACT = '0x39B4B879b8521d6A8C3a87cda64b969327b7fbA3';

// Tier thresholds (in TACHI wei, 18 decimals)
const TIERS = {
  bronze: 100n * 10n ** 18n,
  silver: 1000n * 10n ** 18n,
  gold: 10000n * 10n ** 18n,
  diamond: 100000n * 10n ** 18n,
};

// Tier names and emojis
const TIER_NAMES = {
  bronze: { name: 'Bronze', emoji: '🥉' },
  silver: { name: 'Silver', emoji: '🥈' },
  gold: { name: 'Gold', emoji: '🥇' },
  diamond: { name: 'Diamond', emoji: '💎' },
};

// Bot configuration
const botToken = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

if (!botToken) {
  console.error('❌ TELEGRAM_BOT_TOKEN not set in .env');
  process.exit(1);
}

const bot = new Telegraf(botToken);

// Simple session storage for verification flow
const userVerifications = new Map();

// Helper: Get TACHI balance for a wallet
async function getTachiBalance(walletAddress) {
  try {
    const client = createWalletClient({
      chain: base,
      transport: http(),
    });

    // ERC20 balanceOf ABI
    const abi = [
      {
        inputs: [{ name: 'account', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
      },
    ];

    const balance = await client.readContract({
      address: TACHI_CONTRACT,
      abi,
      functionName: 'balanceOf',
      args: [walletAddress],
    });

    return BigInt(balance);
  } catch (error) {
    console.error(`Error fetching balance for ${walletAddress}:`, error.message);
    return 0n;
  }
}

// Helper: Get tier from balance
function getTier(balance) {
  if (balance >= TIERS.diamond) return 'diamond';
  if (balance >= TIERS.gold) return 'gold';
  if (balance >= TIERS.silver) return 'silver';
  if (balance >= TIERS.bronze) return 'bronze';
  return 'none';
}

// Helper: Format balance
function formatBalance(balance) {
  const formatted = Number(balance) / 1e18;
  return formatted.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

// Start command - Welcome message
bot.start(async (ctx) => {
  const userId = ctx.message.from.id;
  const username = ctx.message.from.username || 'User';

  await ctx.reply(
    `✨ *TachiQuest Community Bot* ✨\n\n` +
    `Welcome to the token-gated TACHI Quest Telegram community!\n\n` +
    `To join our exclusive community and unlock rewards:\n` +
    `1. Link your wallet\n` +
    `2. Verify you hold 100+ $TACHI\n` +
    `3. Get your community tier assigned!\n\n` +
    `Use /verify to start verification.`,
    { parse_mode: 'Markdown' }
  );
});

// Verify command - Start verification flow
bot.command('verify', async (ctx) => {
  const userId = ctx.message.from.id;
  
  await ctx.reply(
    `🔗 *Wallet Verification*\n\n` +
    `To verify your TACHI holdings and join our community:\n\n` +
    `1. Copy your wallet address\n` +
    `2. Send it to me (or paste in reply to this message)\n\n` +
    `I'll check your balance and assign your community tier!`,
    { parse_mode: 'Markdown' }
  );

  // Wait for wallet address
  const messages = await ctx.telegram.getUpdates({
    offset: ctx.update.update_id + 1,
    limit: 1,
    timeout: 60,
  });

  if (messages.length > 0) {
    const walletAddress = messages[0].message.text?.trim();
    
    if (walletAddress && walletAddress.startsWith('0x') && walletAddress.length === 42) {
      await ctx.reply(`🔍 Checking balance for:\n\`${walletAddress}\``, {
        parse_mode: 'Markdown',
      });

      const balance = await getTachiBalance(walletAddress);
      const tier = getTier(balance);
      const tierInfo = TIER_NAMES[tier];

      if (tier !== 'none') {
        await ctx.reply(
          `🎉 *Verified!* ${tierInfo.emoji}\n\n` +
          `Wallet: \`${walletAddress}\`\n` +
          `Balance: ${formatBalance(balance)} $TACHI\n` +
          `Tier: ${tierInfo.emoji} ${tierInfo.name}\n\n` +
          `You're now eligible for our community! 🚀`,
          { parse_mode: 'Markdown' }
        );
      } else {
        await ctx.reply(
          `⚠️ *Insufficient Balance*\n\n` +
          `You hold ${formatBalance(balance)} $TACHI\n\n` +
          `To join the community, you need at least 100 $TACHI.\n\n` +
          `Keep stacking to unlock exclusive rewards!`,
          { parse_mode: 'Markdown' }
        );
      }
    } else {
      await ctx.reply('❌ Invalid wallet address. Please send a valid 0x address.');
    }
  }
});

// Status command - Show current tier
bot.command('status', async (ctx) => {
  // For now, show placeholder (would fetch from database in production)
  await ctx.reply(
    `📊 *Community Status*\n\n` +
    `Use /verify to check and verify your wallet.\n\n` +
    `Tiers:\n` +
    `🥉 Bronze: 100+ $TACHI\n` +
    `🥈 Silver: 1,000+ $TACHI\n` +
    `🥇 Gold: 10,000+ $TACHI\n` +
    `💎 Diamond: 100,000+ $TACHI`,
    { parse_mode: 'Markdown' }
  );
});

// Rank command - Show ranking info
bot.command('rank', async (ctx) => {
  await ctx.reply(
    `🏆 *Community Rankings*\n\n` +
    `Ranking based on:\n` +
    `• TACHI holdings\n` +
    `• XP earned in TachiQuest\n` +
    `• Community contributions\n\n` +
    `Use /verify to join and start earning!`,
    { parse_mode: 'Markdown' }
  );
});

// Help command
bot.command('help', async (ctx) => {
  await ctx.reply(
    `❓ *Help*\n\n` +
    `/verify - Verify your wallet and join community\n` +
    `/status - Show your community status\n` +
    `/rank - View community rankings\n` +
    `/quests - View community quests\n\n` +
    `Need help? Ask in @tachiquest`,
    { parse_mode: 'Markdown' }
  );
});

// Default message handler - Auto-check wallet links
bot.on('text', async (ctx) => {
  const text = ctx.message.text;
  
  // Check if message contains a wallet address
  const walletMatch = text.match(/0x[a-fA-F0-9]{40}/);
  
  if (walletMatch) {
    const walletAddress = walletMatch[0];
    
    // Check balance automatically
    const balance = await getTachiBalance(walletAddress);
    const tier = getTier(balance);
    
    if (tier !== 'none') {
      const tierInfo = TIER_NAMES[tier];
      await ctx.reply(
        `✅ *Auto-detected wallet:*\n\n` +
        `\`${walletAddress}\`\n` +
        `Balance: ${formatBalance(balance)} $TACHI\n` +
        `Tier: ${tierInfo.emoji} ${tierInfo.name}\n\n` +
        `To join the community, use /verify`,
        { parse_mode: 'Markdown' }
      );
    }
  }
});

// Start the bot
async function startBot() {
  console.log('🚀 Starting TachiQuest Telegram Bot...');
  
  try {
    // Set bot commands
    await bot.telegram.setMyCommands([
      { command: 'start', description: 'Start the bot' },
      { command: 'verify', description: 'Verify your wallet' },
      { command: 'status', description: 'Show community status' },
      { command: 'rank', description: 'View rankings' },
      { command: 'help', description: 'Show help' },
    ]);

    // Start polling
    await bot.launch();
    console.log('✅ Bot is running!');
    
    // Graceful stop
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
    
  } catch (error) {
    console.error('❌ Error starting bot:', error);
    process.exit(1);
  }
}

startBot();