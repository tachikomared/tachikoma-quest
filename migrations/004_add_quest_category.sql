-- Add category column to quests table (if missing)
ALTER TABLE quests ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'farcaster';

-- Index for quest filtering
CREATE INDEX IF NOT EXISTS idx_quests_category ON quests(category);
