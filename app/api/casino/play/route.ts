import { NextRequest, NextResponse } from 'next/server';
import { requireCurrentUser } from '@/lib/auth';
import { sql } from '@/lib/db';
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
    const [game] = await sql`
      INSERT INTO casino_games (user_id, player_secret, commitment, bet_amount, status, created_at)
      VALUES (${user.id}, ${playerSecret}, ${commitment}, ${betAmount}, 'committed', NOW())
      RETURNING id, player_secret, commitment, bet_amount, status, created_at
    `;

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
    
    const [activeGame] = await sql`
      SELECT id, bet_amount, status, commitment, server_secret, created_at
      FROM casino_games
      WHERE user_id = ${user.id}
        AND status IN ('committed', 'revealed')
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (!activeGame) {
      return NextResponse.json({
        hasActiveGame: false,
      });
    }

    return NextResponse.json({
      hasActiveGame: true,
      gameId: activeGame.id,
      betAmount: activeGame.bet_amount,
      status: activeGame.status,
      commitment: activeGame.commitment,
      serverSecret: activeGame.server_secret,
      createdAt: activeGame.created_at,
    });
  } catch (error) {
    console.error('Casino status error:', error);
    return NextResponse.json(
      { error: 'Failed to get game status' },
      { status: 500 }
    );
  }
}