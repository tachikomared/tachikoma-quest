-- Community Burns Table
CREATE TABLE IF NOT EXISTS community_burns (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tx_hash VARCHAR(66) NOT NULL UNIQUE,
  amount NUMERIC(78, 0) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for leaderboard queries
CREATE INDEX idx_community_burns_user_amount ON community_burns(user_id, amount DESC);
CREATE INDEX idx_community_burns_created ON community_burns(created_at DESC);

-- Daily Quests Table (for streak system)
CREATE TABLE IF NOT EXISTS daily_quests (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  quest_id INTEGER REFERENCES quests(id),
  bonus_multiplier INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Streak tracking (add to existing users table)
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS streak_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS streak_last_date DATE,
  ADD COLUMN IF NOT EXISTS max_streak INTEGER DEFAULT 0;

-- User Quest Completions (for tracking daily quest participation)
CREATE TABLE IF NOT EXISTS user_quest_completions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quest_id INTEGER NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, quest_id, completed_at::DATE)
);

CREATE INDEX idx_user_quest_completions_user_date ON user_quest_completions(user_id, completed_at DESC);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  target_url TEXT,
  read BOOLEAN DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX idx_notifications_sent ON notifications(sent_at DESC);
