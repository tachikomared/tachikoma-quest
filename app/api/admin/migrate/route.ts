export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

const MIGRATION_KEY = process.env.MIGRATION_SECRET || 'tachi-migrate-008';

export async function POST(req: Request) {
  const { key } = await req.json().catch(() => ({}));
  if (key !== MIGRATION_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: string[] = [];

  const statements = [
    // Users extended columns
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS fc_display_name TEXT`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS fc_pfp_url TEXT`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS fc_bio TEXT`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS fc_score NUMERIC`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS fc_followers INTEGER DEFAULT 0`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS fc_following INTEGER DEFAULT 0`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS fc_power_badge BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_address TEXT`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code TEXT`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by_code TEXT`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS streak_count INTEGER DEFAULT 0`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS streak_last_date DATE`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS max_streak INTEGER DEFAULT 0`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS invite_limit INTEGER DEFAULT 5`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS invites_used INTEGER DEFAULT 0`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS casino_games_played INTEGER DEFAULT 0`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS casino_games_won INTEGER DEFAULT 0`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS casino_total_won NUMERIC DEFAULT 0`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS casino_total_burned NUMERIC DEFAULT 0`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS casino_total_contributed NUMERIC DEFAULT 0`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()`,
    // quest_claims
    `CREATE TABLE IF NOT EXISTS quest_claims (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      quest_id TEXT NOT NULL,
      points_awarded INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, quest_id)
    )`,
    // wallets
    `CREATE TABLE IF NOT EXISTS wallets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      address TEXT NOT NULL,
      verified BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(address)
    )`,
    // notifications
    `CREATE TABLE IF NOT EXISTS notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      title TEXT,
      body TEXT,
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    )`,
    // referrals
    `CREATE TABLE IF NOT EXISTS referrals (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      referrer_id UUID NOT NULL,
      referred_id UUID NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(referred_id)
    )`,
    // daily_quests
    `CREATE TABLE IF NOT EXISTS daily_quests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      quest_date DATE NOT NULL DEFAULT CURRENT_DATE,
      completed BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, quest_date)
    )`,
  ];

  for (const stmt of statements) {
    try {
      await sql.unsafe(stmt);
      results.push(`OK: ${stmt.substring(0, 60)}`);
    } catch (e: any) {
      results.push(`ERR: ${stmt.substring(0, 60)} → ${e.message}`);
    }
  }

  return NextResponse.json({ results });
}
