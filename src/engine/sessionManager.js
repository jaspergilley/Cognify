/**
 * Session Manager
 *
 * Pure state tracking for a training session.
 * Manages block/trial progression and session data collection.
 *
 * SESS-01: State machine (PRE_SESSION → RUNNING → INTER_BLOCK → POST_SESSION)
 * SESS-02: Pre-session target display
 * SESS-03: 30 trials per block
 * SESS-04: 2 blocks per session
 * SESS-05: 15-second rest between blocks
 * SESS-07: Post-session summary
 * SESS-08: Per-session data recording
 *
 * @module engine/sessionManager
 */

export const SESSION_STATE = {
  PRE_SESSION: 'PRE_SESSION',
  RUNNING: 'RUNNING',
  INTER_BLOCK: 'INTER_BLOCK',
  POST_SESSION: 'POST_SESSION',
};

const TRIALS_PER_BLOCK = 30;
const TOTAL_BLOCKS = 2;
const REST_MS = 15000;
const PRE_SESSION_MS = 3000;

/**
 * Create a new training session.
 *
 * @param {object} config
 * @param {string} config.targetShape - Shape A for this session
 * @param {string} config.alternativeShape - Shape B for this session
 * @returns {object} Mutable session state
 */
export function createSession({ targetShape, alternativeShape }) {
  return {
    state: SESSION_STATE.PRE_SESSION,
    targetShape,
    alternativeShape,

    currentBlock: 0,
    currentTrial: 0,
    trialsPerBlock: TRIALS_PER_BLOCK,
    totalBlocks: TOTAL_BLOCKS,

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
