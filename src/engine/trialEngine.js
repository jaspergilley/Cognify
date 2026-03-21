/**
 * Trial Engine
 *
 * State machine for a single trial: fixation → stimulus → mask → response → feedback → ITI.
 * Mutable state for frame-loop performance. Pure module (no React).
 *
 * TRAL-01: Complete trial sequence
 * TRAL-02: Response gating (only in RESPONSE phase)
 * TRAL-03: RT measured from response prompt appearance
 * TRAL-04: RT captured as timestamp of first tap/click
 * TRAL-05/06: Visual feedback (green correct, red incorrect)
 * TRAL-07: ITI blank screen
 * TRAL-08: Per-trial data recording
 *
 * @module engine/trialEngine
 */

import { msToFrames, TIMING } from './stimulusRenderer.js';

/** Trial phase constants */
export const TRIAL_PHASE = {
  FIXATION: 'FIXATION',
  STIMULUS: 'STIMULUS',
  MASK: 'MASK',
  RESPONSE: 'RESPONSE',
  FEEDBACK: 'FEEDBACK',
  ITI: 'ITI',
  COMPLETE: 'COMPLETE',
};

const PHASE_ORDER = [
  TRIAL_PHASE.FIXATION,
  TRIAL_PHASE.STIMULUS,
  TRIAL_PHASE.MASK,
  TRIAL_PHASE.RESPONSE,
  TRIAL_PHASE.FEEDBACK,
  TRIAL_PHASE.ITI,
  TRIAL_PHASE.COMPLETE,
];

/**
 * Create a new trial.
 *
 * @param {object} config
 * @param {string} config.targetShape - Shape ID the user must identify
 * @param {string} config.alternativeShape - Decoy shape ID
 * @param {number} config.displayFrames - Stimulus duration in frames (from staircase)
 * @param {number} config.hz - Display refresh rate
 * @returns {object} Mutable trial state
 */
export function createTrial({ targetShape, alternativeShape, displayFrames, hz }) {
  // Randomize button order so target position varies (EXRC-02)
  const choices = Math.random() < 0.5
    ? [targetShape, alternativeShape]
    : [alternativeShape, targetShape];

  return {
    phase: TRIAL_PHASE.FIXATION,
    phaseFrame: 0,

    // Stimulus config
    targetShape,
    alternativeShape,
    choices,
    displayFrames,
    hz,

    // Phase durations (in frames)
    fixationFrames: msToFrames(TIMING.FIXATION_MS, hz),
    maskFrames: msToFrames(TIMING.MASK_MS, hz),
    feedbackFrames: msToFrames(TIMING.FEEDBACK_MS, hz),
    itiFrames: msToFrames(TIMING.ITI_MS, hz),

    // Consistent mask seed across mask frames
    maskSeed: (Math.random() * 0xffff) | 0,

    // Response data (populated during RESPONSE phase)
    responsePromptTime: 0,
    responseTime: 0,
    chosenShape: null,
    correct: null,
    reactionTimeMs: 0,
  };
}

/**
 * Advance trial by one frame. Call once per rAF tick.
 * Mutates trial state for performance.
 *
 * @param {object} trial - Trial state from createTrial
 * @returns {boolean} True if phase changed this frame
 */
export function tickTrial(trial) {
  // Don't tick phases that wait for external input or are done
  if (trial.phase === TRIAL_PHASE.RESPONSE || trial.phase === TRIAL_PHASE.COMPLETE) {
    return false;
  }

  trial.phaseFrame++;

  let duration;
  switch (trial.phase) {
    case TRIAL_PHASE.FIXATION: duration = trial.fixationFrames; break;
    case TRIAL_PHASE.STIMULUS: duration = trial.displayFrames; break;
    case TRIAL_PHASE.MASK:     duration = trial.maskFrames; break;
    case TRIAL_PHASE.FEEDBACK: duration = trial.feedbackFrames; break;
    case TRIAL_PHASE.ITI:      duration = trial.itiFrames; break;
    default: return false;
  }

  if (trial.phaseFrame >= duration) {
    const nextIdx = PHASE_ORDER.indexOf(trial.phase) + 1;
    trial.phase = PHASE_ORDER[nextIdx];
    trial.phaseFrame = 0;

    // TRAL-03: Record when response prompt appears
    if (trial.phase === TRIAL_PHASE.RESPONSE) {
      trial.responsePromptTime = performance.now();
    }

    return true;
  }

  return false;
}

/**
 * Submit user's response. Only works during RESPONSE phase (TRAL-02).
 * TRAL-04: RT captured as timestamp of first tap/click after prompt.
 *
 * @param {object} trial - Trial state
 * @param {string} chosenShape - Shape ID the user selected
 * @returns {boolean} True if response was accepted
 */
export function submitResponse(trial, chosenShape) {
  if (trial.phase !== TRIAL_PHASE.RESPONSE) return false;

  trial.responseTime = performance.now();
  trial.chosenShape = chosenShape;
  trial.correct = chosenShape === trial.targetShape;
  trial.reactionTimeMs = Math.round(trial.responseTime - trial.responsePromptTime);

  // Advance to feedback phase
  trial.phase = TRIAL_PHASE.FEEDBACK;
  trial.phaseFrame = 0;
  return true;
}

/**
 * Extract recorded per-trial data (TRAL-08).
 *
 * @param {object} trial - Trial state
 * @returns {object} Per-trial data record
 */
export function getTrialData(trial) {
  return {
    targetShape: trial.targetShape,
    alternativeShape: trial.alternativeShape,
    displayFrames: trial.displayFrames,
    displayTimeMs: Math.round((trial.displayFrames / trial.hz) * 1000 * 10) / 10,
    chosenShape: trial.chosenShape,
    correct: trial.correct,
    reactionTimeMs: trial.reactionTimeMs,
    timestamp: Date.now(),
  };
}
