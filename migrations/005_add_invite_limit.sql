-- Add invite limit tracking to users table
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS invites_used INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS invite_limit INTEGER NOT NULL DEFAULT 5;

-- Add invitee user_id to referrals table for faster lookup
ALTER TABLE referrals
  ADD COLUMN IF NOT EXISTS invitee_fid BIGINT;

-- Index for invite tracking
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_invitee_fid ON referrals(invitee_fid);
