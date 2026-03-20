import { NextRequest, NextResponse } from 'next/server';
import { requireCurrentUser } from '@/lib/auth';
import { sql } from '@/lib/db';
import crypto from 'crypto';

/**
 * Reveal server secret for a game
 * POST /api/casino/reveal
 * (This would be called by a keeper service, but for MVP we'll do it manually)
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Add keeper authentication
    const user = await requireCurrentUser();
    const { gameId } = await request.json();

    if (!gameId) {
      return NextResponse.json(
        { error: 'Game ID required' },
        { status: 400 }
      );
    }

    const [game] = await sql`
      SELECT id, status
      FROM casino_games
      WHERE id = ${gameId} AND user_id = ${user.id}
    `;

    if (!game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }

    if (game.status !== 'committed') {
      return NextResponse.json(
        { error: 'Game already revealed or resolved' },
        { status: 400 }
      );
    }

    // Generate server secret
    const serverSecret = crypto.randomBytes(32).toString('hex');

    // Update game with server secret
    await sql`
      UPDATE casino_games
      SET server_secret = ${serverSecret},
          status = 'revealed',
          revealed_at = NOW()
      WHERE id = ${gameId}
    `;

    // TODO: Call contract revealGame(user.address, serverSecret)

    return NextResponse.json({
      success: true,
      gameId,
      serverSecret,
      message: 'Game revealed. Player can now resolve.',
    });
  } catch (error) {
    console.error('Casino reveal error:', error);
    return NextResponse.json(
      { error: 'Failed to reveal game' },
      { status: 500 }
    );
  }
}