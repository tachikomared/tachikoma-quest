import { NextRequest, NextResponse } from 'next/server';
import { requireCurrentUser } from '@/lib/auth';
import { sql } from '@/lib/db';
import crypto from 'crypto';

/**
 * Reveal server secret for a game
 * POST /api/casino/reveal
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireCurrentUser();
    const { gameId } = await request.json();

    if (!gameId) {
      return NextResponse.json(
        { error: 'Game ID required' },
        { status: 400 }
      );
    }

    const rows = await sql`
      SELECT id, status
      FROM casino_games
      WHERE id = ${gameId} AND user_id = ${user.id}
      LIMIT 1
    `;

    if (!rows.length) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }

    if (rows[0].status !== 'committed') {
      return NextResponse.json(
        { error: 'Game already revealed or resolved' },
        { status: 400 }
      );
    }

    // Generate server secret
    const serverSecret = crypto.randomBytes(32).toString('hex');

    await sql`
      UPDATE casino_games
      SET server_secret = ${serverSecret},
          status = 'revealed',
          revealed_at = NOW()
      WHERE id = ${gameId}
    `;

    return NextResponse.json({
      success: true,
      gameId,
      serverSecret,
      message: 'Game revealed. Player can now resolve.',
    });
  } catch (error: any) {
    console.error('Casino reveal error:', error);
    if (error?.message === 'Unauthorized' || error?.message === 'Invalid session') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Failed to reveal game' },
      { status: 500 }
    );
  }
}
