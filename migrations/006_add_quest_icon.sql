-- Add icon column to quests table (if missing)
ALTER TABLE quests ADD COLUMN IF NOT EXISTS icon TEXT;
