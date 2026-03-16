"use server";

import { db } from "@/neynar-db-sdk/db";
import { referrals, questCompletions } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

/**
 * Validate a referral code and return the referrer's FID if valid.
 * Returns null if invalid.
 */
export async function validateReferralCode(
  code: string,
): Promise<{ referrerFid: number } | null> {
  try {
    // Parse the code: last segment after the final dash is the FID
    const parts = code.toUpperCase().split("-");
    const maybeFid = parseInt(parts[parts.length - 1] ?? "", 10);
    if (isNaN(maybeFid) || maybeFid <= 0) return null;
    return { referrerFid: maybeFid };
  } catch {
    return null;
  }
}

/**
 * Create a referral record when a new user joins via referral code.
 * Idempotent: does nothing if referral already exists.
 */
export async function createReferral(
  referrerFid: number,
  referredFid: number,
  code: string,
): Promise<{ success: boolean }> {
  try {
    // Don't allow self-referral
    if (referrerFid === referredFid) return { success: false };

    // Check if this referral already exists
    const existing = await db
      .select()
      .from(referrals)
      .where(eq(referrals.referredFid, referredFid))
      .limit(1);
    if (existing.length > 0) return { success: true }; // Already registered

    await db.insert(referrals).values({
      referrerFid,
      referredFid,
      code,
      status: "pending",
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to create referral:", error);
    return { success: false };
  }
}

/**
 * Activate a referral when the referred user completes their first quest.
 */
export async function activateReferral(referredFid: number): Promise<void> {
  try {
    await db
      .update(referrals)
      .set({ status: "active" })
      .where(
        and(eq(referrals.referredFid, referredFid), eq(referrals.status, "pending")),
      );
  } catch (error) {
    console.error("Failed to activate referral:", error);
  }
}

export type ReferralWithStats = {
  referredFid: number;
  code: string;
  status: "pending" | "active";
  joinedAt: Date;
  questsDone: number;
};

/**
 * Get all referrals made by a referrer, with quest counts for each referred user.
 */
export async function getReferralsByReferrer(
  referrerFid: number,
): Promise<ReferralWithStats[]> {
  try {
    const rows = await db
      .select({
        referredFid: referrals.referredFid,
        code: referrals.code,
        status: referrals.status,
        joinedAt: referrals.joinedAt,
      })
      .from(referrals)
      .where(eq(referrals.referrerFid, referrerFid));

    // Enrich with quest counts
    const enriched = await Promise.all(
      rows.map(async (row) => {
        const countResult = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(questCompletions)
          .where(eq(questCompletions.fid, row.referredFid));
        return {
          referredFid: row.referredFid,
          code: row.code,
          status: row.status as "pending" | "active",
          joinedAt: row.joinedAt,
          questsDone: countResult[0]?.count ?? 0,
        };
      }),
    );

    return enriched;
  } catch (error) {
    console.error("Failed to get referrals:", error);
    return [];
  }
}

/**
 * Count active referrals for a user (for milestone rewards)
 */
export async function getActiveReferralCount(referrerFid: number): Promise<number> {
  try {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(referrals)
      .where(
        and(eq(referrals.referrerFid, referrerFid), eq(referrals.status, "active")),
      );
    return result[0]?.count ?? 0;
  } catch (error) {
    console.error("Failed to count active referrals:", error);
    return 0;
  }
}

