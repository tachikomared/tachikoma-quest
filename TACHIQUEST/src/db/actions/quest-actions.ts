use server";

import { db } from "@/neynar-db-sdk/db";
import { questCompletions, userXp } from "@/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Check if a user has already completed a specific quest
 */
export async function hasCompletedQuest(fid: number, questId: number): Promise<boolean> {
  try {
    const result = await db
      .select()
      .from(questCompletions)
      .where(and(eq(questCompletions.fid, fid), eq(questCompletions.questId, questId)))
      .limit(1);
    return result.length > 0;
  } catch (error) {
    console.error("Failed to check quest completion:", error);
    return false;
  }
}

/**
 * Get all quest IDs completed by a user
 */
export async function getUserQuestCompletions(fid: number): Promise<number[]> {
  try {
    const result = await db
      .select({ questId: questCompletions.questId })
      .from(questCompletions)
      .where(eq(questCompletions.fid, fid));
    return result.map((r) => r.questId);
  } catch (error) {
    console.error("Failed to get quest completions:", error);
    return [];
  }
}

/**
 * Mark a quest as complete and update the user's XP totals.
 * Returns false if already completed (idempotent).
 */
export async function markQuestComplete(
  fid: number,
  questId: number,
  xpEarned: number,
  tachiEarned: number,
  username: string,
  pfpUrl: string,
): Promise<{ success: boolean; alreadyCompleted: boolean }> {
  try {
    // Idempotency check
    const already = await hasCompletedQuest(fid, questId);
    if (already) {
      return { success: false, alreadyCompleted: true };
    }

    // Insert completion record
    await db.insert(questCompletions).values({ fid, questId });

    // Fetch current XP totals
    const current = await db
      .select({ xp: userXp.xp, tachi: userXp.tachi })
      .from(userXp)
      .where(eq(userXp.fid, fid))
      .limit(1);

    if (current.length > 0) {
      // Update existing row
      await db
        .update(userXp)
        .set({
          username,
          pfpUrl,
          xp: (current[0]?.xp ?? 0) + xpEarned,
          tachi: (current[0]?.tachi ?? 0) + tachiEarned,
          updatedAt: new Date(),
        })
        .where(eq(userXp.fid, fid));
    } else {
      // Insert new row
      await db.insert(userXp).values({
        fid,
        username,
        pfpUrl,
        xp: xpEarned,
        tachi: tachiEarned,
      });
    }

    return { success: true, alreadyCompleted: false };
  } catch (error) {
    console.error("Failed to mark quest complete:", error);
    return { success: false, alreadyCompleted: false };
  }
}

/**
 * Get a user's total XP and $TACHI stats
 */
export async function getUserStats(
  fid: number,
): Promise<{ xp: number; tachi: number } | null> {
  try {
    const result = await db
      .select({ xp: userXp.xp, tachi: userXp.tachi })
      .from(userXp)
      .where(eq(userXp.fid, fid))
      .limit(1);
    return result[0] ?? null;
  } catch (error) {
    console.error("Failed to get user stats:", error);
    return null;
  }
}
