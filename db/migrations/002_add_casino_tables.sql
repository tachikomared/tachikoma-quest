-- Migration 002: Add casino tables and columns
-- Add casino columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS casino_games_played INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS casino_games_won INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS casino_total_won INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS casino_total_burned INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS casino_total_contributed INTEGER NOT NULL DEFAULT 0;

-- Create casino_games table
CREATE TABLE IF NOT EXISTS casino_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  player_secret TEXT NOT NULL,
  commitment TEXT NOT NULL,
  server_secret TEXT,
  bet_amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'committed',
  is_win BOOLEAN,
  payout INTEGER,
  burned INTEGER,
  to_community INTEGER,
  seed TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revealed_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_casino_games_user_id ON casino_games(user_id);
CREATE INDEX IF NOT EXISTS idx_casino_games_status ON casino_games(status);
CREATE INDEX IF NOT EXISTS idx_casino_games_created_at ON casino_games(created_at);