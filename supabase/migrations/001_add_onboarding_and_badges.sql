-- Migration 001: Add onboarding fields, extended settings, and badges table
-- Run this in the Supabase SQL Editor for existing databases

-- ============================================================
-- Extend profiles for onboarding
-- ============================================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarded boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS age_group text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS baseline_ms real;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS accepted_terms boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS accepted_privacy boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS research_consent boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarded_at timestamptz;

-- ============================================================
-- Extend settings with new fields
-- ============================================================
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS weekly_goal smallint NOT NULL DEFAULT 3;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS session_mode text NOT NULL DEFAULT 'full';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'en';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS font_size text NOT NULL DEFAULT 'normal';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS high_contrast boolean NOT NULL DEFAULT false;

-- ============================================================
-- Table: badges (earned achievements)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.badges (
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id   text NOT NULL,
  earned_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_badges_user
  ON public.badges(user_id, earned_at DESC);

-- Enable RLS
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

-- Badges policies
CREATE POLICY "Users can view own badges"
  ON public.badges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own badges"
  ON public.badges FOR INSERT WITH CHECK (auth.uid() = user_id);
