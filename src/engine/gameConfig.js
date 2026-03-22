/**
 * Game Configuration
 *
 * Centralized constants for exercise types, session modes, age norms,
 * unlock thresholds, and timing conversions. All public-facing values
 * are in milliseconds; the internal engine uses frames.
 *
 * Ported from khush+enrique branch er_cognify.jsx lines 866-880.
 *
 * @module engine/gameConfig
 */

/**
 * Age-group baseline display times in milliseconds.
 * Used to set the starting staircase value for first-time users.
 * Source: ACTIVE study age-norm estimates.
 */
export const AGE_NORMS = {
  '18–29': 180,
  '30–39': 195,
  '40–49': 210,
  '50–59': 250,
  '60–69': 290,
  '70–79': 340,
  '80–89': 400,
  '90+': 460,
};

/**
 * Exercise configuration: trials per block for each exercise type.
 */
export const EXERCISE_CONFIG = {
  1: { trialsPerBlock: 40, name: 'Central Identification' },
  2: { trialsPerBlock: 30, name: 'Divided Attention' },
  3: { trialsPerBlock: 25, name: 'Selective Attention' },
};

/**
 * Session modes: mini (1 block) or full (2 blocks).
 */
export const SESSION_MODES = {
  mini: { blocks: 1, label: 'Mini', estimatedMinutes: 6 },
  full: { blocks: 2, label: 'Full', estimatedMinutes: 12 },
};

/**
 * Threshold-based exercise unlock gates (in ms).
 * Ex2 unlocks when Ex1 best ≤ 150ms.
 * Ex3 unlocks when Ex2 best ≤ 100ms.
 */
export const UNLOCK_THRESHOLDS = {
  2: 150,
  3: 100,
};

/** Number of trials in the baseline assessment. */
export const BASELINE_TRIAL_COUNT = 20;

// --- Timing conversion utilities ---

/**
 * Convert milliseconds to display frames.
 * @param {number} ms - Duration in milliseconds
 * @param {number} hz - Display refresh rate
 * @returns {number} Number of frames (rounded)
 */
export function msToFrames(ms, hz) {
  return Math.round(ms / (1000 / hz));
}

/**
 * Convert display frames to milliseconds.
 * @param {number} frames - Number of frames
 * @param {number} hz - Display refresh rate
 * @returns {number} Duration in milliseconds (rounded)
 */
export function framesToMs(frames, hz) {
  return Math.round(frames * (1000 / hz));
}

/**
 * Get starting display frames for a user's age group.
 * @param {string} ageGroup - Key from AGE_NORMS (e.g., '60–69')
 * @param {number} hz - Display refresh rate
 * @returns {number} Starting display frames
 */
export function getStartingFramesForAge(ageGroup, hz) {
  const ms = AGE_NORMS[ageGroup] || AGE_NORMS['60–69'];
  return msToFrames(ms, hz);
}
