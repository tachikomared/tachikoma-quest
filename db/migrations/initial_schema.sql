-- Quests table
CREATE TABLE IF NOT EXISTS quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  gating_rules JSONB DEFAULT '{}',
  reward_points INT DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  starts_at TIMESTAMP,
  ends_at TIMESTAMP
);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  quest_id UUID,
  action TEXT,
  result JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
