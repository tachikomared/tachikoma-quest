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

    const [game] = await sql`
      SELECT id, bet_amount, status, commitment, server_secret, created_at
      FROM casino_games
      WHERE id = ${gameId} AND user_id = ${user.id}
    `;

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
      .update(playerSecret + game.bet_amount.toString())
      .digest('hex');

    if (calculatedCommitment !== game.commitment) {
      return NextResponse.json(
        { error: 'Invalid player secret' },
        { status: 400 }
      );
    }

    // Generate random seed
    const seed = createHash('sha256')
      .update(playerSecret + game.server_secret + Math.floor(new Date(game.created_at).getTime() / 1000).toString())
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
      payout = game.bet_amount * 2;
      xpEarned = 50;
    } else {
      // Lose: 90% burned, 10% to community
      burned = Math.floor((game.bet_amount * 90) / 100);
      toCommunity = Math.floor((game.bet_amount * 10) / 100);
      xpEarned = 10; // Consolation XP
    }

    // Update game
    await sql`
      UPDATE casino_games
      SET status = 'resolved',
          is_win = ${isWin},
          payout = ${payout},
          burned = ${burned},
          to_community = ${toCommunity},
          resolved_at = NOW(),
          seed = ${seed}
      WHERE id = ${gameId}
    `;

    // Update user XP
    if (xpEarned > 0) {
      await sql`
        UPDATE users
        SET xp = xp + ${xpEarned}
        WHERE id = ${user.id}
      `;

      // Record XP transaction
      await sql`
        INSERT INTO xp_transactions (user_id, amount, type, description, created_at)
        VALUES (${user.id}, ${xpEarned}, 'casino', ${isWin ? 'Casino win' : 'Casino consolation'}, NOW())
      `;
    }

    // Update user casino stats
    await sql`
      UPDATE users
      SET casino_games_played = casino_games_played + 1,
          casino_games_won = casino_games_won + ${isWin ? 1 : 0},
          casino_total_won = casino_total_won + ${payout},
          casino_total_burned = casino_total_burned + ${burned},
          casino_total_contributed = casino_total_contributed + ${toCommunity}
      WHERE id = ${user.id}
    `;

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