/**
 * Supabase Data Service
 *
 * Cloud CRUD operations that mirror the localStorage dataService API.
 * All functions are async and talk to Postgres via the Supabase client.
 *
 * @module services/supabaseDataService
 */

import { supabase } from './supabaseClient.js';

// --- Profile ---

export async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

export async function updateProfile(userId, updates) {
  const { error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId);
  if (error) throw error;
}

// --- Sessions ---

export async function fetchSessions(userId) {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .order('completed_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function insertSession(userId, sessionRecord) {
  const row = {
    id: sessionRecord.id,
    user_id: userId,
    exercise_type: sessionRecord.exerciseType,
    target_shape: sessionRecord.targetShape,
    alternative_shape: sessionRecord.alternativeShape,
    threshold_frames: sessionRecord.thresholdFrames,
    threshold_method: sessionRecord.thresholdMethod || 'reversal',
    accuracy: sessionRecord.accuracy,
    total_trials: sessionRecord.totalTrials || (sessionRecord.trials?.length ?? 0),
    average_rt_ms: sessionRecord.averageRtMs ?? null,
    duration_ms: sessionRecord.durationMs,
    refresh_rate: sessionRecord.refreshRate ?? null,
    block_count: sessionRecord.blockCount ?? null,
    trials_per_block: sessionRecord.trialsPerBlock ?? null,
    trials: sessionRecord.trials || [],
    completed_at: new Date(sessionRecord.completedAt).toISOString(),
  };

  const { data, error } = await supabase
    .from('sessions')
    .insert(row)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// --- Settings ---

export async function fetchSettings(userId) {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error) throw error;
  return data;
}

export async function updateSettings(userId, settings) {
  // Map camelCase JS keys to snake_case DB columns
  const row = {};
  if (settings.audioEnabled !== undefined) row.audio_enabled = settings.audioEnabled;
  if (settings.volume !== undefined) row.volume = settings.volume;
  if (settings.darkMode !== undefined) row.dark_mode = settings.darkMode;
  if (settings.sessionLength !== undefined) row.session_length = settings.sessionLength;
  if (settings.difficultyLock !== undefined) row.difficulty_lock = settings.difficultyLock;
  if (settings.weeklyGoal !== undefined) row.weekly_goal = settings.weeklyGoal;
  if (settings.sessionMode !== undefined) row.session_mode = settings.sessionMode;
  if (settings.language !== undefined) row.language = settings.language;
  if (settings.fontSize !== undefined) row.font_size = settings.fontSize;
  if (settings.highContrast !== undefined) row.high_contrast = settings.highContrast;
  row.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from('settings')
    .update(row)
    .eq('user_id', userId);
  if (error) throw error;
}

// --- Goals ---

export async function fetchGoals(userId) {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error) throw error;
  return data;
}

export async function updateGoals(userId, goals) {
  const row = {};
  if (goals.dailyTargetMinutes !== undefined) row.daily_target_minutes = goals.dailyTargetMinutes;
  if (goals.reminderTime !== undefined) row.reminder_time = goals.reminderTime;
  row.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from('goals')
    .update(row)
    .eq('user_id', userId);
  if (error) throw error;
}

// --- Mapping helpers (cloud → local format) ---

export function mapSessionFromCloud(row) {
  return {
    id: row.id,
    exerciseType: row.exercise_type,
    targetShape: row.target_shape,
    alternativeShape: row.alternative_shape,
    thresholdFrames: row.threshold_frames,
    thresholdMethod: row.threshold_method,
    accuracy: row.accuracy,
    totalTrials: row.total_trials,
    averageRtMs: row.average_rt_ms,
    durationMs: row.duration_ms,
    refreshRate: row.refresh_rate,
    blockCount: row.block_count,
    trialsPerBlock: row.trials_per_block,
    trials: row.trials || [],
    completedAt: new Date(row.completed_at).getTime(),
    schemaVersion: 2,
  };
}

export function mapSettingsFromCloud(row) {
  return {
    schemaVersion: 2,
    audioEnabled: row.audio_enabled,
    volume: row.volume,
    darkMode: row.dark_mode,
    sessionLength: row.session_length,
    difficultyLock: row.difficulty_lock,
    weeklyGoal: row.weekly_goal ?? 3,
    sessionMode: row.session_mode ?? 'full',
    language: row.language ?? 'en',
    fontSize: row.font_size ?? 'normal',
    highContrast: row.high_contrast ?? false,
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

export function mapGoalsFromCloud(row) {
  return {
    schemaVersion: 2,
    dailyTargetMinutes: row.daily_target_minutes,
    reminderTime: row.reminder_time,
    createdAt: Date.now(),
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

export function mapProfileFromCloud(row) {
  return {
    schemaVersion: 2,
    createdAt: new Date(row.created_at).getTime(),
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    onboarded: row.onboarded ?? false,
    ageGroup: row.age_group ?? null,
    baselineMs: row.baseline_ms ?? null,
    acceptedTerms: row.accepted_terms ?? false,
    acceptedPrivacy: row.accepted_privacy ?? false,
    researchConsent: row.research_consent ?? false,
  };
}

// --- Badges ---

export async function fetchBadges(userId) {
  const { data, error } = await supabase
    .from('badges')
    .select('badge_id, earned_at')
    .eq('user_id', userId)
    .order('earned_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function insertBadge(userId, badgeId) {
  const { error } = await supabase
    .from('badges')
    .upsert(
      { user_id: userId, badge_id: badgeId, earned_at: new Date().toISOString() },
      { onConflict: 'user_id,badge_id' },
    );
  if (error) throw error;
}
