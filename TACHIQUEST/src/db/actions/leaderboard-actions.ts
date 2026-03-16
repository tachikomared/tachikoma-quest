"use server";

import { db } from "@/neynar-db-sdk/db";
import { userXp } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export type LeaderboardRow = {
  fid: number;
  username: string;
  pfpUrl: string;
  xp: number;
  tachi: number;
  rank: number;
};

/**
 * Get the top users by XP for the leaderboard
 */
export async function getLeaderboard(limit: number = 20): Promise<LeaderboardRow[]> {
  try {
    const results = await db
      .select()
      .from(userXp)
      .orderBy(desc(userXp.xp))
      .limit(limit);

    return results.map((row, index) => ({
      fid: row.fid,
      username: row.username,
      pfpUrl: row.pfpUrl,
      xp: row.xp,
      tachi: row.tachi,
      rank: index + 1,
    }));
  } catch (error) {
    console.error("Failed to get leaderboard:", error);
    return [];
  }
}

/**
 * Get the rank of a specific user
 */
export async function getUserRank(fid: number): Promise<number | null> {
  try {
    const userRow = await db
      .select({ xp: userXp.xp })
      .from(userXp)
      .where(eq(userXp.fid, fid))
      .limit(1);

    if (!userRow[0]) return null;

    const userXpValue = userRow[0].xp;

    const rankResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(userXp)
      .where(sql`${userXp.xp} > ${userXpValue}`);

    return (rankResult[0]?.count ?? 0) + 1;
  } catch (error) {
    console.error("Failed to get user rank:", error);
    return null;
  }
}
