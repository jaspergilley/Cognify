/**
 * Badge Engine
 *
 * Pure JS module with badge definitions and evaluation logic.
 * No React dependencies — follows engine layer convention.
 *
 * @module engine/badgeEngine
 */

export const BADGE_DEFINITIONS = [
  { id: 'first_session', icon: 'play_circle', nameKey: 'badge.first_session.name', descKey: 'badge.first_session.description', check: (s) => s.totalSessions >= 1 },
  { id: 'five_sessions', icon: 'fitness_center', nameKey: 'badge.five_sessions.name', descKey: 'badge.five_sessions.description', check: (s) => s.totalSessions >= 5 },
  { id: 'ten_sessions', icon: 'workspace_premium', nameKey: 'badge.ten_sessions.name', descKey: 'badge.ten_sessions.description', check: (s) => s.totalSessions >= 10 },
  { id: 'fourteen_sessions', icon: 'military_tech', nameKey: 'badge.fourteen_sessions.name', descKey: 'badge.fourteen_sessions.description', check: (s) => s.totalSessions >= 14 },
  { id: 'unlock_ex2', icon: 'blur_on', nameKey: 'badge.unlock_ex2.name', descKey: 'badge.unlock_ex2.description', check: (s) => s.ex2Unlocked },
  { id: 'unlock_ex3', icon: 'filter_center_focus', nameKey: 'badge.unlock_ex3.name', descKey: 'badge.unlock_ex3.description', check: (s) => s.ex3Unlocked },
  { id: 'sub_200', icon: 'speed', nameKey: 'badge.sub_200.name', descKey: 'badge.sub_200.description', check: (s) => s.bestThresholdMs != null && s.bestThresholdMs <= 200 },
  { id: 'sub_100', icon: 'flash_on', nameKey: 'badge.sub_100.name', descKey: 'badge.sub_100.description', check: (s) => s.bestThresholdMs != null && s.bestThresholdMs <= 100 },
  { id: 'week_streak', icon: 'local_fire_department', nameKey: 'badge.week_streak.name', descKey: 'badge.week_streak.description', check: (s) => s.hitWeeklyGoal },
];

export const PROTOCOL_MILESTONES = [
  { session: 1, nameKey: 'badge.first_session.name' },
  { session: 5, nameKey: 'badge.five_sessions.name' },
  { session: 10, nameKey: 'badge.ten_sessions.name' },
  { session: 14, nameKey: 'badge.fourteen_sessions.name' },
];

/**
 * Evaluate all badges against current stats.
 * @param {object} stats - { totalSessions, ex2Unlocked, ex3Unlocked, bestThresholdMs, hitWeeklyGoal }
 * @returns {string[]} Array of earned badge IDs
 */
export function evaluateBadges(stats) {
  return BADGE_DEFINITIONS
    .filter((badge) => badge.check(stats))
    .map((badge) => badge.id);
}

/**
 * Detect newly earned badges by comparing previous set with current stats.
 * @param {string[]} previousBadgeIds - Previously earned badge IDs
 * @param {object} currentStats - Current stats object
 * @returns {string[]} Newly earned badge IDs
 */
export function detectNewBadges(previousBadgeIds, currentStats) {
  const prev = new Set(previousBadgeIds);
  const current = evaluateBadges(currentStats);
  return current.filter((id) => !prev.has(id));
}
