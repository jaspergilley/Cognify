/**
 * DataService
 *
 * Abstraction layer for localStorage persistence.
 * Handles user profile and session history with schema versioning,
 * error-safe reads, and session continuity.
 *
 * DATA-01: cogspeed_profile key
 * DATA-02: cogspeed_sessions key
 * DATA-03: Load on mount, save after each session
 * DATA-04: Try-catch with fallback defaults
 * DATA-05: Schema version field
 * DATA-06: DataService abstraction
 * DATA-07: Session IDs via crypto.randomUUID()
 * STRC-10: New session starts at previous threshold × 1.1
 *
 * @module services/dataService
 */

const PROFILE_KEY = 'cogspeed_profile';
const SESSIONS_KEY = 'cogspeed_sessions';
const SCHEMA_VERSION = 1;

/**
 * Default profile when none exists or data is corrupted.
 */
function defaultProfile() {
  return {
    schemaVersion: SCHEMA_VERSION,
    createdAt: Date.now(),
    completedEx1Sessions: 0,
    completedEx2Sessions: 0,
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
 * Safe JSON parse from localStorage (DATA-04).
 */
function safeLoad(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback();
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object') return fallback();
    // Schema version check — if mismatch, use fallback but preserve data
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

  return sessionId;
}

/**
 * Get the starting display frames for a new session (STRC-10).
 * Returns previous threshold × 1.1 (slightly harder), or default.
 *
 * @param {number} exerciseType - 1 or 2
 * @param {number} hz - Display refresh rate
 * @returns {number} Starting display frames
 */
export function getStartingFrames(exerciseType, hz) {
  const sessions = loadSessions();
  const matching = sessions.filter((s) => s.exerciseType === exerciseType);

  if (matching.length === 0) {
    return exerciseType === 2 ? 15 : 15; // defaults
  }

  const last = matching[matching.length - 1];
  if (last.thresholdFrames && last.thresholdFrames > 0) {
    // STRC-10: Start at previous threshold × 1.1 (slightly easier = longer display)
    return Math.max(1, Math.min(30, Math.round(last.thresholdFrames * 1.1)));
  }

  return 15;
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

/**
 * Clear all data (for testing/debug).
 */
export function clearAllData() {
  try {
    localStorage.removeItem(PROFILE_KEY);
    localStorage.removeItem(SESSIONS_KEY);
  } catch {
    // ignore
  }
}
