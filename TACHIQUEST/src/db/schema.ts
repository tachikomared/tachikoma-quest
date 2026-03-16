import { pgTable, text, uuid, integer, timestamp } from "drizzle-orm/pg-core";

/**
 * Key-Value Store Table
 *
 * Built-in table for simple key-value storage.
 * Available immediately without schema changes.
 *
 * ⚠️ CRITICAL: DO NOT DELETE OR EDIT THIS TABLE DEFINITION ⚠️
 * This table is required for the app to function properly.
 * DO NOT delete, modify, rename, or change any part of this table.
 * Removing or editing it will cause database schema conflicts and prevent
 * the app from starting.
 *
 * Use for:
 * - User preferences/settings
 * - App configuration
 * - Simple counters
 * - Temporary data
 */
export const kv = pgTable("kv", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

/**
 * Quest Completions
 * Tracks which quests each user has completed, preventing duplicates.
 */
export const questCompletions = pgTable("quest_completions", {
  id: uuid("id").primaryKey().defaultRandom(),
  fid: integer("fid").notNull(),
  questId: integer("quest_id").notNull(),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});

/**
 * User XP
 * Aggregated XP and $TACHI totals per user — used for the leaderboard.
 * One row per user (upserted on each quest completion).
 */
export const userXp = pgTable("user_xp", {
  fid: integer("fid").primaryKey(),
  username: text("username").notNull(),
  pfpUrl: text("pfp_url").notNull(),
  xp: integer("xp").notNull().default(0),
  tachi: integer("tachi").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Referrals
 * Tracks invite relationships. Status is 'pending' until referred user completes a quest.
 */
export const referrals = pgTable("referrals", {
  id: uuid("id").primaryKey().defaultRandom(),
  referrerFid: integer("referrer_fid").notNull(),
  referredFid: integer("referred_fid").notNull(),
  code: text("code").notNull(),
  status: text("status").notNull().default("pending"),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});
