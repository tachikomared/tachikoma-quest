import { NextRequest, NextResponse } from 'next/server';
import { requireCurrentUser } from '@/lib/auth';
import { sql } from '@/lib/db';
import crypto from 'crypto';

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

    // Generate player secret & commitment
    const playerSecret = crypto.randomBytes(32).toString('hex');
    const commitment = crypto
      .createHash('sha256')
      .update(playerSecret + betAmount.toString())
      .digest('hex');

    // Store game in database
    const rows = await sql`
      INSERT INTO casino_games (user_id, player_secret, commitment, bet_amount, status)
      VALUES (${user.id}, ${playerSecret}, ${commitment}, ${betAmount}, 'committed')
      RETURNING id
    `;

    return NextResponse.json({
      success: true,
      gameId: rows[0].id,
      commitment,
      playerSecret,
      betAmount,
      message: 'Game committed. Waiting for server reveal...',
    });
  } catch (error: any) {
    console.error('Casino play error:', error);
    if (error?.message === 'Unauthorized' || error?.message === 'Invalid session') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
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

    const rows = await sql`
      SELECT id, bet_amount, status, commitment, server_secret, created_at
      FROM casino_games
      WHERE user_id = ${user.id}
        AND status IN ('committed', 'revealed')
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (!rows.length) {
      return NextResponse.json({ hasActiveGame: false });
    }

    const game = rows[0];
    return NextResponse.json({
      hasActiveGame: true,
      gameId: game.id,
      betAmount: game.bet_amount,
      status: game.status,
      commitment: game.commitment,
      serverSecret: game.server_secret,
      createdAt: game.created_at,
    });
  } catch (error: any) {
    console.error('Casino status error:', error);
    if (error?.message === 'Unauthorized' || error?.message === 'Invalid session') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Failed to get game status' },
      { status: 500 }
    );
  }
}
