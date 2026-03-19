import { NextRequest, NextResponse } from 'next/server';
import { requireCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import crypto from 'crypto';
import { createHash } from 'crypto';

/**
 * Resolve a game with player secret
 * POST /api/casino/resolve
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireCurrentUser();
    const { gameId, playerSecret } = await request.json();

    if (!gameId || !playerSecret) {
      return NextResponse.json(
        { error: 'Game ID and player secret required' },
        { status: 400 }
      );
    }

    const game = await db.casinoGame.findUnique({
      where: { id: gameId, userId: user.id },
    });

    if (!game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }

    if (game.status !== 'revealed') {
      return NextResponse.json(
        { error: 'Game not ready for resolution' },
        { status: 400 }
      );
    }

    // Verify commitment matches
    const calculatedCommitment = createHash('sha256')
      .update(playerSecret + game.betAmount.toString())
      .digest('hex');

    if (calculatedCommitment !== game.commitment) {
      return NextResponse.json(
        { error: 'Invalid player secret' },
        { status: 400 }
      );
    }

    // Generate random seed
    const seed = createHash('sha256')
      .update(playerSecret + game.serverSecret! + Math.floor(game.createdAt.getTime() / 1000).toString())
      .digest('hex');

    // Determine win/lose (50% chance)
    const seedNumber = BigInt('0x' + seed);
    const isWin = Number(seedNumber % 2n) === 0;

    // Calculate outcomes
    let payout = 0;
    let burned = 0;
    let toCommunity = 0;
    let xpEarned = 0;

    if (isWin) {
      // Win: 2× payout
      payout = game.betAmount * 2;
      xpEarned = 50;
    } else {
      // Lose: 90% burned, 10% to community
      burned = Math.floor((game.betAmount * 90) / 100);
      toCommunity = Math.floor((game.betAmount * 10) / 100);
      xpEarned = 10; // Consolation XP
    }

    // Update game
    await db.casinoGame.update({
      where: { id: gameId },
      data: {
        status: 'resolved',
        isWin,
        payout,
        burned,
        toCommunity,
        resolvedAt: new Date(),
        seed,
      },
    });

    // Update user XP
    if (xpEarned > 0) {
      await db.user.update({
        where: { id: user.id },
        data: {
          xp: { increment: xpEarned },
        },
      });

      // Record XP transaction
      await db.xpTransaction.create({
        data: {
          userId: user.id,
          amount: xpEarned,
          type: 'casino',
          description: isWin ? 'Casino win' : 'Casino consolation',
        },
      });
    }

    // Update user casino stats
    await db.user.update({
      where: { id: user.id },
      data: {
        casinoGamesPlayed: { increment: 1 },
        casinoGamesWon: isWin ? { increment: 1 } : undefined,
        casinoTotalWon: isWin ? { increment: payout } : undefined,
        casinoTotalBurned: !isWin ? { increment: burned } : undefined,
        casinoTotalContributed: !isWin ? { increment: toCommunity } : undefined,
      },
    });

    // TODO: Call contract resolveGame(playerSecret)
    // TODO: In production, contract would handle token transfers

    return NextResponse.json({
      success: true,
      isWin,
      payout,
      burned,
      toCommunity,
      xpEarned,
      seed,
      message: isWin 
        ? `🎉 You won ${payout} TACHI! +${xpEarned} XP` 
        : `💀 You lost. ${burned} TACHI burned, ${toCommunity} to community pool. +${xpEarned} XP`,
    });
  } catch (error) {
    console.error('Casino resolve error:', error);
    return NextResponse.json(
      { error: 'Failed to resolve game' },
      { status: 500 }
    );
  }
}