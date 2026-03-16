import { pgTable, text, uuid, integer, timestamp, boolean, jsonb, serial, numeric } from "drizzle-orm/pg-core";

// Users table - main user identity from Farcaster
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  fcFid: integer("fc_fid").notNull().unique(),
  fcUsername: text("fc_username"),
  fcDisplayName: text("fc_display_name"),
  fcPfpUrl: text("fc_pfp_url"),
  fcBio: text("fc_bio"),
  fcScore: numeric("fc_score"),
  fcFollowers: integer("fc_followers").default(0),
  fcFollowing: integer("fc_following").default(0),
  fcPowerBadge: boolean("fc_power_badge").default(false),
  referralCode: text("referral_code").notNull().unique(),
  referredByCode: text("referred_by_code"),
  walletAddress: text("wallet_address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Wallets table - linked wallets per user
export const wallets = pgTable("wallets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  address: text("address").notNull().unique(),
  chain: text("chain").notNull().default("base"),
  verified: boolean("verified").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Quests table - quest definitions
export const quests = pgTable("quests", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  platform: text("platform").notNull(), // 'farcaster', 'x', 'wallet', 'referral'
  action: text("action").notNull(), // 'follow_user', 'recast_cast', 'like_cast', 'link_wallet', etc.
  verification: text("verification").notNull(), // 'fc_follow_user', 'fc_cast_viewer_context', etc.
  points: integer("points").notNull().default(0),
  tachiReward: integer("tachi_reward").default(0),
  repeatable: boolean("repeatable").default(false),
  enabled: boolean("enabled").default(true),
  target: jsonb("target").notNull().default({}),
  sortOrder: integer("sort_order").default(0),
});

// Quest claims - completed quests
export const questClaims = pgTable("quest_claims", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  questId: text("quest_id").notNull().references(() => quests.id),
  status: text("status").notNull().default("verified"), // 'verified', 'pending'
  proof: jsonb("proof").default({}),
  pointsAwarded: integer("points_awarded").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueUserQuest: { unique: ["userId", "questId"] },
}));

// Referrals table - referral relationships
export const referrals = pgTable("referrals", {
  id: uuid("id").primaryKey().defaultRandom(),
  referrerUserId: uuid("referrer_user_id").notNull().references(() => users.id),
  refereeUserId: uuid("referee_user_id").notNull().references(() => users.id).unique(),
  code: text("code").notNull(),
  qualifiedAt: timestamp("qualified_at"),
  pointsAwarded: integer("points_awarded").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Key-Value store for app settings
export const kv = pgTable("kv", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});
