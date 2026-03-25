-- Full users table schema migration
-- Adds all missing columns needed by the app

-- Core Farcaster profile columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS fc_display_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS fc_pfp_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS fc_bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS fc_score NUMERIC;
ALTER TABLE users ADD COLUMN IF NOT EXISTS fc_followers INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS fc_following INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS fc_power_badge BOOLEAN DEFAULT FALSE;

-- Wallet
ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_address TEXT;

-- Referral
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by_code TEXT;

-- Streak tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS streak_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS streak_last_date DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS max_streak INTEGER DEFAULT 0;

-- Invite system
ALTER TABLE users ADD COLUMN IF NOT EXISTS invite_limit INTEGER DEFAULT 5;
ALTER TABLE users ADD COLUMN IF NOT EXISTS invites_used INTEGER DEFAULT 0;

-- Casino stats
ALTER TABLE users ADD COLUMN IF NOT EXISTS casino_games_played INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS casino_games_won INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS casino_total_won NUMERIC DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS casino_total_burned NUMERIC DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS casino_total_contributed NUMERIC DEFAULT 0;

-- Points cache (denormalized for leaderboard performance)
ALTER TABLE users ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

-- Timestamps
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- quest_claims table (if not exists)
CREATE TABLE IF NOT EXISTS quest_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  quest_id TEXT NOT NULL,
  points_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, quest_id)
);

-- wallets table (for linked wallets)
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  address TEXT NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(address)
);

-- notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT,
  body TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL,
  referred_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(referred_id)
);

-- daily_quests table
CREATE TABLE IF NOT EXISTS daily_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  quest_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, quest_date)
);
