/**
 * DataService
 *
 * Abstraction layer for localStorage persistence.
 * Handles user profile and session history with schema versioning,
 * error-safe reads, and session continuity.
 *
 * DATA-01: cognify_profile key
 * DATA-02: cognify_sessions key
 * DATA-03: Load on mount, save after each session
 * DATA-04: Try-catch with fallback defaults
 * DATA-05: Schema version field
 * DATA-06: DataService abstraction
 * DATA-07: Session IDs via crypto.randomUUID()
 * STRC-10: New session starts at previous threshold × 1.1
 *
 * @module services/dataService
 */

import { MIN_FRAMES, MAX_FRAMES } from '../engine/staircase.js';
import { getStartingFramesForAge } from '../engine/gameConfig.js';
import * as cloud from './supabaseDataService.js';
import { syncQueue } from './syncService.js';

const PROFILE_KEY = 'cognify_profile';
const SESSIONS_KEY = 'cognify_sessions';
const GOALS_KEY = 'cognify_goals';
const SETTINGS_KEY = 'cognify_settings';
const BADGES_KEY = 'cognify_badges';
const ONBOARDING_KEY = 'cognify_onboarding';
const SCHEMA_VERSION = 2;

// --- Cloud sync state ---
let _userId = null;
let _isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => { _isOnline = true; });
  window.addEventListener('offline', () => { _isOnline = false; });
}

/** Set the authenticated user ID (called by AuthContext on login). */
export function setAuthenticatedUser(userId) {
  _userId = userId;
}

/** Clear the authenticated user ID (called by AuthContext on logout). */
export function clearAuthenticatedUser() {
  _userId = null;
}

/** Clear all user data from localStorage on sign-out.
 *  Prevents previous user's data from leaking to the next user. */
export function clearUserDataOnSignOut() {
  _userId = null;
  try {
    localStorage.removeItem(PROFILE_KEY);
    localStorage.removeItem(SESSIONS_KEY);
    localStorage.removeItem(GOALS_KEY);
    localStorage.removeItem(SETTINGS_KEY);
    localStorage.removeItem(BADGES_KEY);
    localStorage.removeItem(ONBOARDING_KEY);
    syncQueue.clear();
  } catch { /* ignore */ }
}

/**
 * Hydrate localStorage from Supabase cloud data.
 * Called once on login — cloud data overwrites local for settings/goals,
 * and merges (union) for sessions.
 *
 * Retries with exponential backoff when DB trigger rows don't exist yet
 * (PostgREST PGRST116 = "no rows returned for .single()").
 *
 * @param {{ retryCount?: number }} options
 * @returns {Promise<{ success: boolean, reason?: string }>}
 */
const HYDRATION_MAX_RETRIES = 4;
const HYDRATION_BASE_DELAY_MS = 300;

export async function hydrateFromCloud({ retryCount = 0 } = {}) {
  if (!_userId || !_isOnline) return { success: false, reason: 'offline' };
  try {
    const [sessions, settings, goals, profile, badges] = await Promise.all([
      cloud.fetchSessions(_userId),
      cloud.fetchSettings(_userId),
      cloud.fetchGoals(_userId),
      cloud.fetchProfile(_userId),
      cloud.fetchBadges(_userId).catch(() => []),
    ]);

    // Sessions: union merge (cloud + local, deduplicate by ID)
    if (sessions && sessions.length > 0) {
      const localStore = safeLoad(SESSIONS_KEY, defaultSessions);
      const localIds = new Set(localStore.sessions.map((s) => s.id));
      const cloudMapped = sessions.map(cloud.mapSessionFromCloud);
      for (const cs of cloudMapped) {
        if (!localIds.has(cs.id)) {
          localStore.sessions.push(cs);
        }
      }
      // Sort by completedAt
      localStore.sessions.sort((a, b) => (a.completedAt || 0) - (b.completedAt || 0));
      safeSave(SESSIONS_KEY, localStore);
    }

    // Settings: cloud wins for most fields, local wins for device-specific prefs
    if (settings) {
      const cloudSettings = cloud.mapSettingsFromCloud(settings);
      const localSettings = safeLoad(SETTINGS_KEY, defaultSettings);
      const merged = {
        ...cloudSettings,
        // Device-specific prefs: local wins if non-default
        language: (localSettings.language && localSettings.language !== 'en')
          ? localSettings.language : cloudSettings.language,
        fontSize: (localSettings.fontSize && localSettings.fontSize !== 'normal')
          ? localSettings.fontSize : cloudSettings.fontSize,
        highContrast: localSettings.highContrast || cloudSettings.highContrast,
      };
      safeSave(SETTINGS_KEY, merged);
    }

    // Goals: cloud wins
    if (goals) {
      safeSave(GOALS_KEY, cloud.mapGoalsFromCloud(goals));
    }

    // Profile: merge onboarding fields (cloud wins if onboarded)
    if (profile) {
      const cloudProfile = cloud.mapProfileFromCloud(profile);
      const localProfile = safeLoad(PROFILE_KEY, defaultProfile);
      const mergedProfile = {
        ...localProfile,
        ...cloudProfile,
        // Preserve local session counts if higher (edge case: offline sessions)
        completedEx1Sessions: Math.max(localProfile.completedEx1Sessions || 0, cloudProfile.completedEx1Sessions || 0),
        completedEx2Sessions: Math.max(localProfile.completedEx2Sessions || 0, cloudProfile.completedEx2Sessions || 0),
        completedEx3Sessions: Math.max(localProfile.completedEx3Sessions || 0, cloudProfile.completedEx3Sessions || 0),
        // Onboarding: cloud wins if onboarded=true
        onboarded: cloudProfile.onboarded || localProfile.onboarded,
        ageGroup: cloudProfile.ageGroup || localProfile.ageGroup,
        baselineMs: cloudProfile.baselineMs || localProfile.baselineMs,
        schemaVersion: SCHEMA_VERSION,
      };
      safeSave(PROFILE_KEY, mergedProfile);

      // Also update onboarding cache
      if (cloudProfile.onboarded) {
        try {
          localStorage.setItem(ONBOARDING_KEY, JSON.stringify({
            onboarded: cloudProfile.onboarded,
            ageGroup: cloudProfile.ageGroup,
            baselineMs: cloudProfile.baselineMs,
            acceptedTerms: cloudProfile.acceptedTerms,
            acceptedPrivacy: cloudProfile.acceptedPrivacy,
            researchConsent: cloudProfile.researchConsent,
          }));
        } catch { /* ignore */ }
      }
    }

    // Badges: union merge (cloud + local)
    if (badges && badges.length > 0) {
      const localBadges = loadBadges();
      const cloudBadgeIds = badges.map((b) => b.badge_id);
      const merged = [...new Set([...localBadges, ...cloudBadgeIds])];
      saveBadges(merged);
    }

    return { success: true };
  } catch (err) {
    // PGRST116 = "no rows returned for .single()" — DB trigger hasn't run yet
    if (err?.code === 'PGRST116' && retryCount < HYDRATION_MAX_RETRIES) {
      const delay = HYDRATION_BASE_DELAY_MS * Math.pow(2, retryCount);
      await new Promise((r) => setTimeout(r, delay));
      return hydrateFromCloud({ retryCount: retryCount + 1 });
    }
    console.warn('Cloud hydration failed:', err);
    return { success: false, reason: 'error' };
  }
}

/** Fire-and-forget cloud write with sync queue fallback. */
function cloudWrite(asyncFn, syncOp) {
  if (!_userId) return;
  if (_isOnline) {
    asyncFn().catch(() => {
      syncQueue.enqueue(syncOp);
    });
  } else {
    syncQueue.enqueue(syncOp);
  }
}

/**
 * Default profile when none exists or data is corrupted.
 */
function defaultProfile() {
  return {
    schemaVersion: SCHEMA_VERSION,
    createdAt: Date.now(),
    completedEx1Sessions: 0,
    completedEx2Sessions: 0,
    completedEx3Sessions: 0,
    onboarded: false,
    ageGroup: null,
    baselineMs: null,
  };
}

/**
 * Default sessions store.
 */
function defaultSessions() {
  return {
    schemaVersion: SCHEMA_VERSION,
    sessions: [],
  };
}

/**
 * Migrate v1 settings to v2 (add new fields from khush+enrique branch).
 */
function migrateSettingsV1toV2(v1) {
  return {
    ...v1,
    schemaVersion: 2,
    weeklyGoal: v1.weeklyGoal ?? 3,
    sessionMode: v1.sessionMode ?? 'full',
    language: v1.language ?? 'en',
    fontSize: v1.fontSize ?? 'normal',
    highContrast: v1.highContrast ?? false,
  };
}

/**
 * Migrate v1 profile to v2 (add onboarding fields).
 */
function migrateProfileV1toV2(v1) {
  return {
    ...v1,
    schemaVersion: 2,
    onboarded: v1.onboarded ?? false,
    ageGroup: v1.ageGroup ?? null,
    baselineMs: v1.baselineMs ?? null,
  };
}

/**
 * Safe JSON parse from localStorage (DATA-04).
 * Supports automatic v1→v2 migration for settings and profiles.
 */
function safeLoad(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback();
    let data = JSON.parse(raw);
    if (!data || typeof data !== 'object') return fallback();

    // Migrate v1 → v2 automatically
    if (data.schemaVersion === 1) {
      if (key === SETTINGS_KEY) {
        data = migrateSettingsV1toV2(data);
        safeSave(key, data);
      } else if (key === PROFILE_KEY) {
        data = migrateProfileV1toV2(data);
        safeSave(key, data);
      } else {
        // Sessions and goals: just bump version, structure unchanged
        data.schemaVersion = 2;
        safeSave(key, data);
      }
    }

    if (data.schemaVersion !== SCHEMA_VERSION) {
      return fallback();
    }
    return data;
  } catch {
    return fallback();
  }
}

/**
 * Safe JSON write to localStorage.
 */
function safeSave(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

// --- Public API ---

/**
 * Load user profile (DATA-01).
 * @returns {object} Profile data
 */
export function loadProfile() {
  return safeLoad(PROFILE_KEY, defaultProfile);
}

/**
 * Save user profile.
 * @param {object} profile
 */
export function saveProfile(profile) {
  profile.schemaVersion = SCHEMA_VERSION;
  safeSave(PROFILE_KEY, profile);

  // Write-through to Supabase
  const cloudPayload = {
    completed_ex1_sessions: profile.completedEx1Sessions || 0,
    completed_ex2_sessions: profile.completedEx2Sessions || 0,
    completed_ex3_sessions: profile.completedEx3Sessions || 0,
  };
  // Include onboarding fields if present
  if (profile.onboarded !== undefined) cloudPayload.onboarded = profile.onboarded;
  if (profile.ageGroup !== undefined) cloudPayload.age_group = profile.ageGroup;
  if (profile.baselineMs !== undefined) cloudPayload.baseline_ms = profile.baselineMs;

  cloudWrite(
    () => cloud.updateProfile(_userId, cloudPayload),
    { type: 'UPDATE_PROFILE', payload: profile, userId: _userId },
  );
}

/**
 * Load all session records (DATA-02).
 * @returns {object[]} Array of session records
 */
export function loadSessions() {
  const store = safeLoad(SESSIONS_KEY, defaultSessions);
  return store.sessions || [];
}

/**
 * Save a completed session record (DATA-03).
 *
 * @param {object} sessionRecord - Session data to persist
 * @returns {string} Session ID
 */
export function saveSession(sessionRecord) {
  const store = safeLoad(SESSIONS_KEY, defaultSessions);
  const sessionId = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  sessionRecord.id = sessionId;
  sessionRecord.schemaVersion = SCHEMA_VERSION;
  store.sessions.push(sessionRecord);
  safeSave(SESSIONS_KEY, store);

  // Write-through to Supabase
  cloudWrite(
    () => cloud.insertSession(_userId, sessionRecord),
    { type: 'INSERT_SESSION', payload: sessionRecord, userId: _userId },
  );

  return sessionId;
}

/**
 * Get the starting display frames for a new session (STRC-10).
 * Priority: previous threshold × 1.1 → age-norm baseline → hardcoded default.
 *
 * @param {number} exerciseType - 1, 2, or 3
 * @param {number} hz - Display refresh rate
 * @returns {number} Starting display frames
 */
export function getStartingFrames(exerciseType, hz) {
  const sessions = loadSessions();
  const matching = sessions.filter((s) => s.exerciseType === exerciseType);

  if (matching.length > 0) {
    const last = matching[matching.length - 1];
    if (last.thresholdFrames && last.thresholdFrames > 0) {
      // STRC-10: Start at previous threshold × 1.1 (slightly easier = longer display)
      return Math.max(MIN_FRAMES, Math.min(MAX_FRAMES, Math.round(last.thresholdFrames * 1.1)));
    }
  }

  // For first session: use age-norm baseline if available
  const profile = loadProfile();
  if (profile.ageGroup) {
    const ageFrames = getStartingFramesForAge(profile.ageGroup, hz);
    if (exerciseType === 1) return Math.max(MIN_FRAMES, Math.min(MAX_FRAMES, ageFrames));
    // Ex2/Ex3: start at age norm + 5 frames (harder exercises need more time)
    return Math.max(MIN_FRAMES, Math.min(MAX_FRAMES, ageFrames + 5));
  }

  // Fallback: no age group, no previous sessions
  if (exerciseType === 1) return 30; // ~500ms at 60Hz — senior-friendly start

  // Ex2/Ex3: start at previous exercise's threshold + 5 frames
  const prevExSessions = sessions.filter((s) => s.exerciseType === exerciseType - 1);
  if (prevExSessions.length > 0) {
    const lastPrev = prevExSessions[prevExSessions.length - 1];
    if (lastPrev.thresholdFrames && lastPrev.thresholdFrames > 0) {
      return Math.max(MIN_FRAMES, Math.min(MAX_FRAMES, Math.round(lastPrev.thresholdFrames) + 5));
    }
  }

  return 36; // ~600ms at 60Hz — comfortable fallback for Ex2/Ex3
}

/**
 * Get count of completed sessions for an exercise type.
 * Used for Exercise 2 unlock gate (EXRC-08).
 *
 * @param {number} exerciseType
 * @returns {number}
 */
export function getCompletedSessionCount(exerciseType) {
  const sessions = loadSessions();
  return sessions.filter((s) => s.exerciseType === exerciseType).length;
}

// --- Dashboard query functions (Phase 3A) ---

/**
 * Get the latest threshold for an exercise type (DASH-01).
 * Returns threshold data with direction of change vs previous session.
 *
 * @param {number} exerciseType - 1 or 2
 * @param {number} [hz=60] - Display refresh rate for ms conversion
 * @returns {{ thresholdFrames: number, thresholdMs: number, direction: string|null }}
 */
export function getLatestThreshold(exerciseType, hz = 60) {
  const sessions = loadSessions().filter((s) => s.exerciseType === exerciseType);
  if (sessions.length === 0) return null;

  const latest = sessions[sessions.length - 1];
  const frames = latest.thresholdFrames || 0;
  const ms = Math.round((frames / hz) * 1000);

  let direction = null;
  if (sessions.length >= 2) {
    const prev = sessions[sessions.length - 2];
    const prevFrames = prev.thresholdFrames || 0;
    if (frames < prevFrames) direction = 'improved';
    else if (frames > prevFrames) direction = 'declined';
    else direction = 'same';
  }

  return { thresholdFrames: frames, thresholdMs: ms, direction };
}

/**
 * Get threshold history for sparkline chart (DASH-03).
 *
 * @param {number} exerciseType - 1 or 2
 * @param {number} [limit=20] - Max sessions to return
 * @param {number} [hz=60] - Display refresh rate
 * @returns {{ sessionIndex: number, thresholdFrames: number, thresholdMs: number, completedAt: number, accuracy: number }[]}
 */
export function getThresholdHistory(exerciseType, limit = 20, hz = 60) {
  const sessions = loadSessions().filter((s) => s.exerciseType === exerciseType);
  const recent = sessions.slice(-limit);
  return recent.map((s, i) => ({
    sessionIndex: i,
    thresholdFrames: s.thresholdFrames || 0,
    thresholdMs: Math.round(((s.thresholdFrames || 0) / hz) * 1000),
    completedAt: s.completedAt || 0,
    accuracy: s.accuracy || 0,
  }));
}

/**
 * Get 7-day activity streak (DASH-04).
 *
 * @returns {{ dayLabel: string, hasSession: boolean, sessionCount: number }[]}
 */
export function getWeeklyStreak() {
  const sessions = loadSessions();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const result = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const dayStart = d.getTime();
    const dayEnd = dayStart + 86400000;

    const daySessions = sessions.filter(
      (s) => s.completedAt >= dayStart && s.completedAt < dayEnd,
    );

    result.push({
      dayLabel: days[d.getDay()],
      hasSession: daySessions.length > 0,
      sessionCount: daySessions.length,
    });
  }

  return result;
}

/**
 * Get self-referential progress: % faster than first session.
 *
 * @param {number} exerciseType
 * @returns {{ percentFaster: number, firstMs: number, latestMs: number }|null}
 */
export function getSelfProgress(exerciseType, hz = 60) {
  const sessions = loadSessions().filter((s) => s.exerciseType === exerciseType);
  if (sessions.length < 2) return null;

  const first = sessions[0];
  const latest = sessions[sessions.length - 1];
  const firstMs = Math.round(((first.thresholdFrames || 0) / hz) * 1000);
  const latestMs = Math.round(((latest.thresholdFrames || 0) / hz) * 1000);

  if (firstMs <= 0) return null;
  const percentFaster = Math.round(((firstMs - latestMs) / firstMs) * 100);
  return { percentFaster, firstMs, latestMs };
}

/**
 * Get personal best (lowest) threshold for an exercise type.
 *
 * @param {number} exerciseType
 * @param {number} [hz=60]
 * @returns {{ thresholdFrames: number, thresholdMs: number, sessionIndex: number }|null}
 */
export function getBestThreshold(exerciseType, hz = 60) {
  const sessions = loadSessions().filter(
    (s) => s.exerciseType === exerciseType && s.thresholdFrames > 0,
  );
  if (sessions.length === 0) return null;

  let best = sessions[0];
  let bestIdx = 0;
  for (let i = 1; i < sessions.length; i++) {
    if (sessions[i].thresholdFrames < best.thresholdFrames) {
      best = sessions[i];
      bestIdx = i;
    }
  }

  return {
    thresholdFrames: best.thresholdFrames,
    thresholdMs: Math.round((best.thresholdFrames / hz) * 1000),
    sessionIndex: bestIdx,
  };
}

/**
 * Get total training time across all sessions.
 *
 * @returns {number} Total duration in milliseconds
 */
export function getTotalTrainingTime() {
  const sessions = loadSessions();
  return sessions.reduce((sum, s) => sum + (s.durationMs || 0), 0);
}

/**
 * Get accuracy history for chart display.
 *
 * @param {number} exerciseType
 * @param {number} [limit=20]
 * @returns {{ sessionIndex: number, accuracy: number, completedAt: number }[]}
 */
export function getAccuracyHistory(exerciseType, limit = 20) {
  const sessions = loadSessions().filter((s) => s.exerciseType === exerciseType);
  const recent = sessions.slice(-limit);
  return recent.map((s, i) => ({
    sessionIndex: i + 1,
    accuracy: Math.round((s.accuracy || 0) * 100),
    completedAt: s.completedAt || 0,
  }));
}

/**
 * Get session counts grouped by week.
 *
 * @param {number} [weeks=8] - Number of weeks to look back
 * @returns {{ weekLabel: string, count: number }[]}
 */
export function getSessionCountByWeek(weeks = 8) {
  const sessions = loadSessions();
  const result = [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  // Find start of current week (Sunday)
  const dayOfWeek = now.getDay();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - dayOfWeek);

  for (let i = weeks - 1; i >= 0; i--) {
    const start = new Date(weekStart);
    start.setDate(start.getDate() - i * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    const count = sessions.filter(
      (s) => s.completedAt >= start.getTime() && s.completedAt < end.getTime(),
    ).length;

    const monthDay = `${start.getMonth() + 1}/${start.getDate()}`;
    result.push({ weekLabel: monthDay, count });
  }

  return result;
}

/**
 * Get latest accuracy for an exercise type.
 *
 * @param {number} exerciseType
 * @returns {number|null} Accuracy as 0-100 percentage, or null
 */
export function getLatestAccuracy(exerciseType) {
  const sessions = loadSessions().filter((s) => s.exerciseType === exerciseType);
  if (sessions.length === 0) return null;
  return Math.round((sessions[sessions.length - 1].accuracy || 0) * 100);
}

/**
 * Get current consecutive-day training streak.
 * Walks backwards from today through all sessions.
 *
 * @returns {number} Consecutive days with at least one session
 */
export function getConsecutiveDayStreak() {
  const sessions = loadSessions();
  if (sessions.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let streak = 0;
  const checkDate = new Date(today);

  while (true) {
    const dayStart = checkDate.getTime();
    const dayEnd = dayStart + 86400000;
    const hasSession = sessions.some((s) => s.completedAt >= dayStart && s.completedAt < dayEnd);
    if (hasSession) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

/**
 * Get the timestamp of the most recent session.
 *
 * @returns {number|null} Timestamp or null if no sessions
 */
export function getLastSessionDate() {
  const sessions = loadSessions();
  if (sessions.length === 0) return null;
  return sessions[sessions.length - 1].completedAt || null;
}

/**
 * Check if an exercise is unlocked based on threshold gates.
 * Threshold-only unlock strategy (matching ACTIVE study protocol):
 * Ex1: Always unlocked.
 * Ex2: Unlocked when Ex1 best threshold ≤ 150ms.
 * Ex3: Unlocked when Ex2 best threshold ≤ 100ms.
 * Migration safety: if user already has sessions for an exercise, keep it unlocked.
 *
 * @param {number} exerciseType - 1, 2, or 3
 * @param {number} [hz=60]
 * @returns {{ unlocked: boolean, progressMs: number|null, targetMs: number|null }}
 */
export function isExerciseUnlocked(exerciseType, hz = 60) {
  if (exerciseType === 1) {
    return { unlocked: true, progressMs: null, targetMs: null };
  }

  // Unlock thresholds (ms) — threshold-only strategy
  const thresholds = { 2: 150, 3: 100 };
  const prevExercise = exerciseType - 1;
  const targetMs = thresholds[exerciseType];
  if (!targetMs) return { unlocked: false, progressMs: null, targetMs: null };

  // Migration safety: if user already completed sessions for this exercise, keep unlocked
  const profile = loadProfile();
  const completedKey = `completedEx${exerciseType}Sessions`;
  if ((profile[completedKey] || 0) > 0) {
    return { unlocked: true, progressMs: null, targetMs };
  }

  // Threshold gate: best threshold of previous exercise must be ≤ target
  const best = getBestThreshold(prevExercise, hz);
  if (best && best.thresholdMs <= targetMs) {
    return { unlocked: true, progressMs: best.thresholdMs, targetMs };
  }
  return { unlocked: false, progressMs: best?.thresholdMs || null, targetMs };
}

// --- Settings ---

/**
 * Default settings when none exist.
 */
function defaultSettings() {
  return {
    schemaVersion: SCHEMA_VERSION,
    audioEnabled: true,
    volume: 75,
    darkMode: false,
    sessionLength: 5,
    difficultyLock: false,
    weeklyGoal: 3,
    sessionMode: 'full',
    language: 'en',
    fontSize: 'normal',
    highContrast: false,
    updatedAt: Date.now(),
  };
}

/**
 * Load settings from localStorage.
 * @returns {{ audioEnabled: boolean, volume: number, darkMode: boolean, sessionLength: number, difficultyLock: boolean }}
 */
export function loadSettings() {
  return safeLoad(SETTINGS_KEY, defaultSettings);
}

/**
 * Save settings to localStorage (merges with existing).
 * @param {object} settings - Partial settings to merge
 */
export function saveSettings(settings) {
  const existing = loadSettings();
  const merged = { ...existing, ...settings, schemaVersion: SCHEMA_VERSION, updatedAt: Date.now() };
  safeSave(SETTINGS_KEY, merged);

  // Write-through to Supabase
  cloudWrite(
    () => cloud.updateSettings(_userId, settings),
    { type: 'UPDATE_SETTINGS', payload: settings, userId: _userId },
  );
}

// --- Daily Goals (GOAL-01) ---

/**
 * Default goals when none exist.
 */
function defaultGoals() {
  return {
    schemaVersion: SCHEMA_VERSION,
    dailyTargetMinutes: 10,
    reminderTime: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * Load daily goals from localStorage.
 * @returns {{ dailyTargetMinutes: number, reminderTime: string|null, createdAt: number, updatedAt: number }}
 */
export function loadGoals() {
  return safeLoad(GOALS_KEY, defaultGoals);
}

/**
 * Save daily goals to localStorage.
 * @param {{ dailyTargetMinutes: number, reminderTime: string|null }} goals
 */
export function saveGoals(goals) {
  const existing = loadGoals();
  const merged = { ...existing, ...goals, schemaVersion: SCHEMA_VERSION, updatedAt: Date.now() };
  safeSave(GOALS_KEY, merged);

  // Write-through to Supabase
  cloudWrite(
    () => cloud.updateGoals(_userId, goals),
    { type: 'UPDATE_GOALS', payload: goals, userId: _userId },
  );
}

/**
 * Get today's total training time in minutes.
 * @returns {number}
 */
export function getTodayTrainingMinutes() {
  const sessions = loadSessions();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayStart = today.getTime();
  const dayEnd = dayStart + 86400000;

  const todayMs = sessions
    .filter((s) => s.completedAt >= dayStart && s.completedAt < dayEnd)
    .reduce((sum, s) => sum + (s.durationMs || 0), 0);

  return Math.round(todayMs / 60000);
}

/**
 * Get daily goal progress.
 * @returns {{ targetMinutes: number, completedMinutes: number, percentComplete: number }}
 */
export function getDailyGoalProgress() {
  const goals = loadGoals();
  const completedMinutes = getTodayTrainingMinutes();
  const target = goals.dailyTargetMinutes || 10;
  return {
    targetMinutes: target,
    completedMinutes,
    percentComplete: Math.min(100, Math.round((completedMinutes / target) * 100)),
  };
}

/**
 * Clear all data (for testing/debug).
 */
export function clearAllData() {
  try {
    localStorage.removeItem(PROFILE_KEY);
    localStorage.removeItem(SESSIONS_KEY);
    localStorage.removeItem(GOALS_KEY);
    localStorage.removeItem(SETTINGS_KEY);
    localStorage.removeItem(BADGES_KEY);
    localStorage.removeItem(ONBOARDING_KEY);
    syncQueue.clear();
  } catch {
    // ignore
  }
}

// --- Onboarding ---

/**
 * Check if the current user has completed onboarding (local cache).
 * @returns {boolean}
 */
export function isOnboarded() {
  try {
    const raw = localStorage.getItem(ONBOARDING_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    return data?.onboarded === true;
  } catch {
    return false;
  }
}

/**
 * Load onboarding data from localStorage.
 * @returns {{ onboarded: boolean, ageGroup: string|null, baselineMs: number|null, acceptedTerms: boolean, acceptedPrivacy: boolean, researchConsent: boolean }}
 */
export function loadOnboarding() {
  try {
    const raw = localStorage.getItem(ONBOARDING_KEY);
    if (!raw) return defaultOnboarding();
    const data = JSON.parse(raw);
    return data || defaultOnboarding();
  } catch {
    return defaultOnboarding();
  }
}

function defaultOnboarding() {
  return {
    onboarded: false,
    ageGroup: null,
    baselineMs: null,
    acceptedTerms: false,
    acceptedPrivacy: false,
    researchConsent: false,
  };
}

/**
 * Save onboarding data locally + sync to Supabase profiles table.
 * @param {{ onboarded?: boolean, ageGroup?: string, baselineMs?: number, acceptedTerms?: boolean, acceptedPrivacy?: boolean, researchConsent?: boolean }} data
 */
export function saveOnboarding(data) {
  const existing = loadOnboarding();
  const merged = { ...existing, ...data };
  try {
    localStorage.setItem(ONBOARDING_KEY, JSON.stringify(merged));
  } catch { /* ignore */ }

  // Also update the profile with onboarding fields
  const profile = loadProfile();
  if (data.onboarded !== undefined) profile.onboarded = data.onboarded;
  if (data.ageGroup !== undefined) profile.ageGroup = data.ageGroup;
  if (data.baselineMs !== undefined) profile.baselineMs = data.baselineMs;
  saveProfile(profile);

  // Write-through to Supabase profiles table
  const cloudPayload = {};
  if (data.onboarded !== undefined) cloudPayload.onboarded = data.onboarded;
  if (data.ageGroup !== undefined) cloudPayload.age_group = data.ageGroup;
  if (data.baselineMs !== undefined) cloudPayload.baseline_ms = data.baselineMs;
  if (data.acceptedTerms !== undefined) cloudPayload.accepted_terms = data.acceptedTerms;
  if (data.acceptedPrivacy !== undefined) cloudPayload.accepted_privacy = data.acceptedPrivacy;
  if (data.researchConsent !== undefined) cloudPayload.research_consent = data.researchConsent;
  if (data.onboarded) cloudPayload.onboarded_at = new Date().toISOString();

  cloudWrite(
    () => cloud.updateProfile(_userId, cloudPayload),
    { type: 'UPDATE_ONBOARDING', payload: cloudPayload, userId: _userId },
  );
}

// --- Badges ---

/**
 * Load earned badge IDs from localStorage.
 * @returns {string[]}
 */
export function loadBadges() {
  try {
    const raw = localStorage.getItem(BADGES_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/**
 * Save earned badge IDs to localStorage.
 * @param {string[]} badgeIds
 */
export function saveBadges(badgeIds) {
  try {
    localStorage.setItem(BADGES_KEY, JSON.stringify(badgeIds));
  } catch { /* ignore */ }
}

/**
 * Add a newly earned badge. Persists locally + syncs to Supabase.
 * @param {string} badgeId
 */
export function addBadge(badgeId) {
  const existing = loadBadges();
  if (existing.includes(badgeId)) return;
  existing.push(badgeId);
  saveBadges(existing);

  cloudWrite(
    () => cloud.insertBadge(_userId, badgeId),
    { type: 'INSERT_BADGE', payload: { badgeId }, userId: _userId },
  );
}
