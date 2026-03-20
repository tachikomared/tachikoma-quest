import { NextRequest, NextResponse } from 'next/server';
import { requireCurrentUser } from '@/lib/auth';
import { sql } from '@/lib/db';
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

    const rows = await sql`
      SELECT id, status, commitment, server_secret, bet_amount, created_at
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

    const game = rows[0];

    if (game.status !== 'revealed') {
      return NextResponse.json(
        { error: 'Game not ready for resolution' },
        { status: 400 }
      );
    }

    // Verify commitment matches
    const calculatedCommitment = createHash('sha256')
      .update(playerSecret + game.bet_amount.toString())
      .digest('hex');

    if (calculatedCommitment !== game.commitment) {
      return NextResponse.json(
        { error: 'Invalid player secret' },
        { status: 400 }
      );
    }

    // Generate random seed
    const createdAtEpoch = Math.floor(new Date(game.created_at).getTime() / 1000);
    const seed = createHash('sha256')
      .update(playerSecret + game.server_secret + createdAtEpoch.toString())
      .digest('hex');

    // Determine win/lose (50% chance)
    const seedNumber = BigInt('0x' + seed);
    const isWin = Number(seedNumber % 2n) === 0;

    // Calculate outcomes
    const betAmount = Number(game.bet_amount);
    let payout = 0;
    let burned = 0;
    let toCommunity = 0;
    let xpEarned = 0;

    if (isWin) {
      payout = betAmount * 2;
      xpEarned = 50;
    } else {
      burned = Math.floor((betAmount * 90) / 100);
      toCommunity = Math.floor((betAmount * 10) / 100);
      xpEarned = 10;
    }

    // Update game
    await sql`
      UPDATE casino_games
      SET status = 'resolved',
          is_win = ${isWin},
          payout = ${payout},
          burned = ${burned},
          to_community = ${toCommunity},
          seed = ${seed},
          resolved_at = NOW()
      WHERE id = ${gameId}
    `;

    // Update user casino stats
    if (isWin) {
      await sql`
        UPDATE users
        SET casino_games_played = COALESCE(casino_games_played, 0) + 1,
            casino_games_won = COALESCE(casino_games_won, 0) + 1,
            casino_total_won = COALESCE(casino_total_won, 0) + ${payout}
        WHERE id = ${user.id}
      `;
    } else {
      await sql`
        UPDATE users
        SET casino_games_played = COALESCE(casino_games_played, 0) + 1,
            casino_total_burned = COALESCE(casino_total_burned, 0) + ${burned},
            casino_total_contributed = COALESCE(casino_total_contributed, 0) + ${toCommunity}
        WHERE id = ${user.id}
      `;
    }

    // Award XP via quest_claims
    if (xpEarned > 0) {
      await sql`
        INSERT INTO quest_claims (user_id, quest_id, status, points_awarded)
        VALUES (
          ${user.id},
          ${'casino-' + gameId.slice(0, 8)},
          'verified',
          ${xpEarned}
        )
      `;
    }

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
  } catch (error: any) {
    console.error('Casino resolve error:', error);
    if (error?.message === 'Unauthorized' || error?.message === 'Invalid session') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Failed to resolve game' },
      { status: 500 }
    );
  }
}
