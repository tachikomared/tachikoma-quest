create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  fc_fid bigint unique,
  fc_username text,
  fc_display_name text,
  fc_pfp_url text,
  fc_bio text,
  fc_score numeric(6,3),
  referral_code text not null unique,
  referred_by_code text,
  created_at timestamptz not null default now()
);

create table if not exists wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  address text not null unique,
  chain text not null default 'base',
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists quests (
  id text primary key,
  title text not null,
  description text not null,
  platform text not null,
  action text not null,
  verification text not null,
  points integer not null,
  repeatable boolean not null default false,
  enabled boolean not null default true,
  target jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists quest_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  quest_id text not null references quests(id) on delete cascade,
  status text not null default 'verified',
  proof jsonb not null default '{}'::jsonb,
  points_awarded integer not null default 0,
  verified_at timestamptz not null default now(),
  unique (user_id, quest_id)
);

create table if not exists referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_user_id uuid not null references users(id) on delete cascade,
  referee_user_id uuid not null unique references users(id) on delete cascade,
  code text not null,
  qualified_at timestamptz,
  points_awarded integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_users_fc_fid on users(fc_fid);
create index if not exists idx_wallets_user_id on wallets(user_id);
create index if not exists idx_claims_user_id on quest_claims(user_id);
create index if not exists idx_claims_quest_id on quest_claims(quest_id);

-- Casino tables
create table if not exists casino_games (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  player_secret text not null,
  commitment text not null,
  server_secret text,
  bet_amount integer not null,
  status text not null default 'committed',
  is_win boolean,
  payout integer,
  burned integer,
  to_community integer,
  seed text,
  created_at timestamptz not null default now(),
  revealed_at timestamptz,
  resolved_at timestamptz
);

-- Add casino stats to users table
alter table users add column if not exists casino_games_played integer not null default 0;
alter table users add column if not exists casino_games_won integer not null default 0;
alter table users add column if not exists casino_total_won integer not null default 0;
alter table users add column if not exists casino_total_burned integer not null default 0;
alter table users add column if not exists casino_total_contributed integer not null default 0;

create index if not exists idx_casino_games_user_id on casino_games(user_id);
create index if not exists idx_casino_games_status on casino_games(status);
create index if not exists idx_casino_games_created_at on casino_games(created_at);
