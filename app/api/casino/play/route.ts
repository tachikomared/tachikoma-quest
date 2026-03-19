import { NextRequest, NextResponse } from 'next/server';
import { requireCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import crypto from 'crypto';

// For now, mock contract addresses - will be replaced with real ones
const MOCK_CASINO_ADDRESS = '0x0000000000000000000000000000000000000000';
const MOCK_TACHI_ADDRESS = '0x39B4B879b8521d6A8C3a87cda64b969327b7fbA3';

/**
 * Start a new casino game
 * POST /api/casino/play
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireCurrentUser();
    const { betAmount } = await request.json();

    if (!betAmount || betAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid bet amount' },
        { status: 400 }
      );
    }

    // TODO: Check user has enough TACHI balance
    // TODO: Generate player secret
    const playerSecret = crypto.randomBytes(32).toString('hex');
    const commitment = crypto
      .createHash('sha256')
      .update(playerSecret + betAmount.toString())
      .digest('hex');

    // Store game in database
    const game = await db.casinoGame.create({
      data: {
        userId: user.id,
        playerSecret,
        commitment,
        betAmount,
        status: 'committed',
        // Server secret will be added later
      },
    });

    // TODO: Call contract commitGame(commitment, betAmount)

    return NextResponse.json({
      success: true,
      gameId: game.id,
      commitment,
      playerSecret, // In production, this would be stored client-side only
      betAmount,
      message: 'Game committed. Waiting for server reveal...',
    });
  } catch (error) {
    console.error('Casino play error:', error);
    return NextResponse.json(
      { error: 'Failed to start game' },
      { status: 500 }
    );
  }
}

/**
 * Get current game status
 * GET /api/casino/play
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireCurrentUser();
    
    const activeGame = await db.casinoGame.findFirst({
      where: {
        userId: user.id,
        status: { in: ['committed', 'revealed'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!activeGame) {
      return NextResponse.json({
        hasActiveGame: false,
      });
    }

    return NextResponse.json({
      hasActiveGame: true,
      gameId: activeGame.id,
      betAmount: activeGame.betAmount,
      status: activeGame.status,
      commitment: activeGame.commitment,
      serverSecret: activeGame.serverSecret,
      createdAt: activeGame.createdAt,
    });
  } catch (error) {
    console.error('Casino status error:', error);
    return NextResponse.json(
      { error: 'Failed to get game status' },
      { status: 500 }
    );
  }
}