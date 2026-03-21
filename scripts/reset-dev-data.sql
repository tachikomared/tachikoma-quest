-- DEV/TEST ONLY: destructive reset for TACHI Quest
-- This clears user-facing data while preserving schema.
-- Do NOT run on production unless you explicitly intend to wipe it.

BEGIN;

TRUNCATE TABLE
  notifications,
  user_quest_completions,
  referrals,
  quest_claims,
  wallets,
  casino_games,
  daily_quests
RESTART IDENTITY CASCADE;

UPDATE users SET
  fc_username = NULL,
  fc_display_name = NULL,
  fc_pfp_url = NULL,
  fc_bio = NULL,
  fc_score = NULL,
  referred_by_code = NULL,
  streak_count = 0,
  streak_last_date = NULL,
  max_streak = 0,
  invites_used = 0,
  invite_limit = 5,
  casino_games_played = 0,
  casino_games_won = 0,
  casino_total_won = 0,
  casino_total_burned = 0,
  casino_total_contributed = 0,
  points = 0
WHERE TRUE;

COMMIT;
