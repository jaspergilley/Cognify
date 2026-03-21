/**
 * Staircase Algorithm Module
 *
 * 3-Up / 1-Down transformed staircase for adaptive difficulty.
 * Converges to the 79.4% correct threshold (standard psychophysics).
 * Pure functions — no side effects, no React dependency.
 *
 * STRC-01: State tracking (displayTime, correctStreak, trialHistory)
 * STRC-02: Step down after 3 consecutive correct (-1 frame)
 * STRC-03: Step up after 1 incorrect (+2 frames, reset streak)
 * STRC-04: Clamping between MIN_FRAMES and MAX_FRAMES
 * STRC-05: No spurious reversals from boundary clamping
 * STRC-06: Reversal detection on direction change
 * STRC-07: Threshold from reversal averaging (discard first 4)
 * STRC-08: Fallback threshold when insufficient reversals
 * STRC-09: Separate instances per exercise type
 *
 * @module engine/staircase
 */

/** Minimum display duration in frames */
const MIN_FRAMES = 1;

/** Maximum display duration in frames */
const MAX_FRAMES = 30;

/** Consecutive correct answers needed to step down */
const UP_COUNT = 3;

/** Frames to decrease on step down (easier → harder) */
const STEP_DOWN = 1;

/** Frames to increase on step up (harder → easier) */
const STEP_UP = 2;

/** Number of initial reversals to discard for threshold calculation */
const REVERSALS_TO_DISCARD = 4;

/** Minimum reversals needed for standard threshold (after discarding) */
const MIN_REVERSALS_FOR_THRESHOLD = 2;

/**
 * Direction constants for reversal detection.
 * null = no direction yet, 'down' = getting harder, 'up' = getting easier
 * @typedef {'down'|'up'|null} Direction
 */

/**
 * @typedef {object} StaircaseState
 * @property {number} displayTime - Current display duration in frames
 * @property {number} correctStreak - Consecutive correct count
 * @property {Direction} lastDirection - Last step direction for reversal detection
 * @property {number[]} reversalPoints - displayTime values at each reversal
 * @property {Array<{correct: boolean, displayTime: number, trialIndex: number}>} trialHistory
 * @property {number} trialCount - Total trials processed
 * @property {boolean} didStep - Whether last update caused a step
 * @property {boolean} didReverse - Whether last update caused a reversal
 */

/**
 * Create a fresh staircase state.
 * STRC-09: Call once per exercise type for separate instances.
 *
 * @param {number} [startFrames=15] - Initial display duration in frames
 * @returns {StaircaseState}
 */
export function createStaircase(startFrames = 15) {
  return {
    displayTime: clamp(startFrames),
    correctStreak: 0,
    lastDirection: null,
    reversalPoints: [],
    trialHistory: [],
    trialCount: 0,
    didStep: false,
    didReverse: false,
  };
}

/**
 * Process a trial result and return the updated staircase state.
 * Pure function — does not mutate the input state.
 *
 * STRC-02: 3 correct → step down (displayTime - 1)
 * STRC-03: 1 incorrect → step up (displayTime + 2), reset streak
 * STRC-04: Clamp to [1, 30]
 * STRC-05: No reversal recorded if step was blocked by clamping
 * STRC-06: Reversal when direction changes
 *
 * @param {StaircaseState} state - Current staircase state
 * @param {boolean} correct - Whether the trial response was correct
 * @returns {StaircaseState} New state (original is not mutated)
 */
export function updateStaircase(state, correct) {
  const next = {
    displayTime: state.displayTime,
    correctStreak: correct ? state.correctStreak + 1 : 0,
    lastDirection: state.lastDirection,
    reversalPoints: [...state.reversalPoints],
    trialHistory: [
      ...state.trialHistory,
      { correct, displayTime: state.displayTime, trialIndex: state.trialCount },
    ],
    trialCount: state.trialCount + 1,
    didStep: false,
    didReverse: false,
  };

  let direction = null;

  if (correct && next.correctStreak >= UP_COUNT) {
    // STRC-02: Step down — decrease display time (harder)
    const newTime = clamp(state.displayTime - STEP_DOWN);

    // STRC-05: Only record step if clamping didn't block the change
    if (newTime !== state.displayTime) {
      next.displayTime = newTime;
      next.didStep = true;
      direction = 'down';
    }

    next.correctStreak = 0;
  } else if (!correct) {
    // STRC-03: Step up — increase display time (easier)
    const newTime = clamp(state.displayTime + STEP_UP);

    // STRC-05: Only record step if clamping didn't block the change
    if (newTime !== state.displayTime) {
      next.displayTime = newTime;
      next.didStep = true;
      direction = 'up';
    }
  }

  // STRC-06: Detect reversal — direction changed from previous step
  if (direction !== null && state.lastDirection !== null && direction !== state.lastDirection) {
    next.reversalPoints.push(state.displayTime);
    next.didReverse = true;
  }

  // Update direction only if a step actually occurred
  if (direction !== null) {
    next.lastDirection = direction;
  }

  return next;
}

/**
 * Calculate processing speed threshold from reversal points.
 * STRC-07: Average reversal points after discarding first 4.
 * STRC-08: Fallback to all reversals or last displayTime if insufficient.
 *
 * @param {StaircaseState} state - Current staircase state
 * @returns {{ threshold: number, method: 'reversal'|'fallback-all'|'fallback-last', reversalsUsed: number }}
 */
export function calculateThreshold(state) {
  const reversals = state.reversalPoints;

  if (reversals.length > REVERSALS_TO_DISCARD + MIN_REVERSALS_FOR_THRESHOLD) {
    // Standard: discard first 4, average the rest
    const usable = reversals.slice(REVERSALS_TO_DISCARD);
    const avg = usable.reduce((sum, v) => sum + v, 0) / usable.length;
    return {
      threshold: Math.round(avg * 10) / 10,
      method: 'reversal',
      reversalsUsed: usable.length,
    };
  }

  if (reversals.length >= MIN_REVERSALS_FOR_THRESHOLD) {
    // Fallback: use all reversals (not enough to discard 4)
    const avg = reversals.reduce((sum, v) => sum + v, 0) / reversals.length;
    return {
      threshold: Math.round(avg * 10) / 10,
      method: 'fallback-all',
      reversalsUsed: reversals.length,
    };
  }

  // Last resort: use current display time
  return {
    threshold: state.displayTime,
    method: 'fallback-last',
    reversalsUsed: 0,
  };
}

/**
 * Get summary statistics for the staircase.
 *
 * @param {StaircaseState} state
 * @returns {{ totalTrials: number, totalReversals: number, accuracy: number, currentDisplayTime: number }}
 */
export function getStaircaseStats(state) {
  const correctCount = state.trialHistory.filter((t) => t.correct).length;
  return {
    totalTrials: state.trialCount,
    totalReversals: state.reversalPoints.length,
    accuracy: state.trialCount > 0 ? correctCount / state.trialCount : 0,
    currentDisplayTime: state.displayTime,
  };
}

/**
 * Clamp display time to valid range.
 * @param {number} frames
 * @returns {number}
 */
function clamp(frames) {
  return Math.max(MIN_FRAMES, Math.min(MAX_FRAMES, frames));
}
