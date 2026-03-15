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
