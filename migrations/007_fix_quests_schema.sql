-- Fix quests table schema to support static fallback
ALTER TABLE quests ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;

-- Migrate enabled column to active if it exists
ALTER TABLE quests ADD COLUMN IF NOT EXISTS enabled BOOLEAN;
UPDATE quests SET active = enabled WHERE enabled IS NOT NULL;

-- Add icon column if missing (should be added by 006_add_quest_icon.sql)
ALTER TABLE quests ADD COLUMN IF NOT EXISTS icon TEXT;

-- Ensure active defaults to true for all existing quests
UPDATE quests SET active = true WHERE active IS NOT NULL AND active = false;
