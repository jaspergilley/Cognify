/**
 * Session Manager
 *
 * Pure state tracking for a training session.
 * Manages block/trial progression and session data collection.
 *
 * SESS-01: State machine (PRE_SESSION → RUNNING → INTER_BLOCK → POST_SESSION)
 * SESS-02: Pre-session target display
 * SESS-03: Configurable trials per block via EXERCISE_CONFIG
 * SESS-04: Configurable blocks per session via SESSION_MODES
 * SESS-05: 15-second rest between blocks
 * SESS-07: Post-session summary
 * SESS-08: Per-session data recording
 *
 * @module engine/sessionManager
 */

import { EXERCISE_CONFIG, SESSION_MODES } from './gameConfig.js';

export const SESSION_STATE = {
  PRE_SESSION: 'PRE_SESSION',
  RUNNING: 'RUNNING',
  INTER_BLOCK: 'INTER_BLOCK',
  POST_SESSION: 'POST_SESSION',
};

const REST_MS = 15000;
const PRE_SESSION_MS = 3000;

/**
 * Create a new training session.
 *
 * @param {object} config
 * @param {string} config.targetShape - Shape A for this session
 * @param {string} config.alternativeShape - Shape B for this session
 * @param {number} [config.exerciseType=1] - Exercise type (1, 2, or 3) for trial count lookup
 * @param {string} [config.sessionMode='full'] - Session mode ('mini' or 'full') for block count
 * @param {number} [config.trialsPerBlock] - Explicit override (takes precedence over exerciseType)
 * @param {number} [config.totalBlocks] - Explicit override (takes precedence over sessionMode)
 * @returns {object} Mutable session state
 */
export function createSession({ targetShape, alternativeShape, exerciseType = 1, sessionMode = 'full', trialsPerBlock, totalBlocks }) {
  const exerciseCfg = EXERCISE_CONFIG[exerciseType] || EXERCISE_CONFIG[1];
  const modeCfg = SESSION_MODES[sessionMode] || SESSION_MODES.full;

  return {
    state: SESSION_STATE.PRE_SESSION,
    targetShape,
    alternativeShape,
    exerciseType,

    currentBlock: 0,
    currentTrial: 0,
    trialsPerBlock: trialsPerBlock || exerciseCfg.trialsPerBlock,
    totalBlocks: totalBlocks || modeCfg.blocks,

    preSessionMs: PRE_SESSION_MS,
    restMs: REST_MS,

    trials: [],
    startTime: Date.now(),
    endTime: null,
  };
}

/**
 * Advance session after a trial completes.
 * Mutates session state.
 *
 * @param {object} session
 * @param {object} trialData - From getTrialData()
 * @returns {string} New session state
 */
export function advanceSession(session, trialData) {
  session.trials.push(trialData);
  session.currentTrial++;

  if (session.currentTrial >= session.trialsPerBlock) {
    session.currentBlock++;
    session.currentTrial = 0;

    if (session.currentBlock >= session.totalBlocks) {
      session.state = SESSION_STATE.POST_SESSION;
      session.endTime = Date.now();
    } else {
      session.state = SESSION_STATE.INTER_BLOCK;
    }
  }

  return session.state;
}

/**
 * Resume session after rest period.
 * @param {object} session
 */
export function resumeAfterRest(session) {
  session.state = SESSION_STATE.RUNNING;
}

/**
 * Get session summary for post-session display (SESS-07, SESS-08).
 * @param {object} session
 * @returns {object} Session summary
 */
export function getSessionSummary(session) {
  const correct = session.trials.filter((t) => t.correct).length;
  const totalTrials = session.trials.length;
  const avgRt = totalTrials > 0
    ? Math.round(session.trials.reduce((sum, t) => sum + t.reactionTimeMs, 0) / totalTrials)
    : 0;

  return {
    totalTrials,
    correctTrials: correct,
    accuracy: totalTrials > 0 ? correct / totalTrials : 0,
    averageRtMs: avgRt,
    durationMs: (session.endTime || Date.now()) - session.startTime,
    blocks: session.totalBlocks,
    trialsPerBlock: session.trialsPerBlock,
  };
}
