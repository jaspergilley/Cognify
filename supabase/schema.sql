-- Cognify Database Schema
-- Run this in the Supabase SQL Editor or via `supabase db push`

-- ============================================================
-- Table: profiles
-- ============================================================
create table if not exists public.profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  display_name      text,
  avatar_url        text,
  onboarded         boolean not null default false,
  age_group         text,
  baseline_ms       real,
  accepted_terms    boolean not null default false,
  accepted_privacy  boolean not null default false,
  research_consent  boolean not null default false,
  onboarded_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ============================================================
-- Table: sessions (append-only training records)
-- ============================================================
create table if not exists public.sessions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  exercise_type     smallint not null check (exercise_type in (1, 2, 3)),
  target_shape      text,
  alternative_shape text,
  threshold_frames  real not null,
  threshold_method  text not null default 'reversal',
  accuracy          real not null check (accuracy >= 0 and accuracy <= 1),
  total_trials      integer not null,
  average_rt_ms     real,
  duration_ms       integer not null,
  refresh_rate      real,
  block_count       smallint,
  trials_per_block  smallint,
  trials            jsonb not null default '[]'::jsonb,
  completed_at      timestamptz not null default now(),
  created_at        timestamptz not null default now()
);

create index if not exists idx_sessions_user_exercise
  on public.sessions(user_id, exercise_type, completed_at desc);

create index if not exists idx_sessions_user_completed
  on public.sessions(user_id, completed_at desc);

-- ============================================================
-- Table: settings (one row per user)
-- ============================================================
create table if not exists public.settings (
  user_id           uuid primary key references public.profiles(id) on delete cascade,
  audio_enabled     boolean not null default true,
  volume            smallint not null default 75 check (volume >= 0 and volume <= 100),
  dark_mode         boolean not null default false,
  session_length    smallint not null default 5 check (session_length in (5, 10, 15)),
  difficulty_lock   boolean not null default false,
  weekly_goal       smallint not null default 3,
  session_mode      text not null default 'full',
  language          text not null default 'en',
  font_size         text not null default 'normal',
  high_contrast     boolean not null default false,
  updated_at        timestamptz not null default now()
);

-- ============================================================
-- Table: goals (one row per user)
-- ============================================================
create table if not exists public.goals (
  user_id               uuid primary key references public.profiles(id) on delete cascade,
  daily_target_minutes  smallint not null default 10,
  reminder_time         text,
  updated_at            timestamptz not null default now()
);

-- ============================================================
-- Table: badges (earned achievements)
-- ============================================================
create table if not exists public.badges (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  badge_id   text not null,
  earned_at  timestamptz not null default now(),
  primary key (user_id, badge_id)
);

create index if not exists idx_badges_user
  on public.badges(user_id, earned_at desc);

-- ============================================================
-- Trigger: auto-create profile + settings + goals on signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  );
  insert into public.settings (user_id) values (new.id);
  insert into public.goals (user_id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

-- Drop existing trigger if it exists, then create
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Row Level Security
-- ============================================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.sessions enable row level security;
alter table public.settings enable row level security;
alter table public.goals enable row level security;
alter table public.badges enable row level security;

-- profiles
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- sessions (insert-only: no update/delete for data integrity)
create policy "Users can view own sessions"
  on public.sessions for select using (auth.uid() = user_id);
create policy "Users can insert own sessions"
  on public.sessions for insert with check (auth.uid() = user_id);

-- settings
create policy "Users can view own settings"
  on public.settings for select using (auth.uid() = user_id);
create policy "Users can update own settings"
  on public.settings for update using (auth.uid() = user_id);

-- goals
create policy "Users can view own goals"
  on public.goals for select using (auth.uid() = user_id);
create policy "Users can update own goals"
  on public.goals for update using (auth.uid() = user_id);

-- badges
create policy "Users can view own badges"
  on public.badges for select using (auth.uid() = user_id);
create policy "Users can insert own badges"
  on public.badges for insert with check (auth.uid() = user_id);

-- ============================================================
-- RPC: Self-service account deletion
-- ============================================================
create or replace function public.delete_own_account()
returns void as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$ language plpgsql security definer;
