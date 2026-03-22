/**
 * Trial Engine
 *
 * State machine for a single trial supporting both Exercise 1 (central ID)
 * and Exercise 2 (central ID + peripheral location).
 *
 * Exercise 1: FIXATION → STIMULUS → RESPONSE_SHAPE → FEEDBACK → ITI → COMPLETE
 * Exercise 2: FIXATION → STIMULUS → RESPONSE_SHAPE → RESPONSE_LOCATION → FEEDBACK → ITI → COMPLETE
 *
 * TRAL-01 through TRAL-08, EXRC-01 through EXRC-06
 *
 * @module engine/trialEngine
 */

import { msToFrames, TIMING } from './stimulusRenderer.js';

export const TRIAL_PHASE = {
  FIXATION: 'FIXATION',
  STIMULUS: 'STIMULUS',
  RESPONSE_SHAPE: 'RESPONSE_SHAPE',
  RESPONSE_LOCATION: 'RESPONSE_LOCATION',
  FEEDBACK: 'FEEDBACK',
  ITI: 'ITI',
  COMPLETE: 'COMPLETE',
};

/**
 * Get next timed phase (non-response phases only).
 */
function getNextTimedPhase(phase) {
  switch (phase) {
    case TRIAL_PHASE.FIXATION: return TRIAL_PHASE.STIMULUS;
    case TRIAL_PHASE.STIMULUS: return TRIAL_PHASE.RESPONSE_SHAPE;
    case TRIAL_PHASE.FEEDBACK: return TRIAL_PHASE.ITI;
    case TRIAL_PHASE.ITI:      return TRIAL_PHASE.COMPLETE;
    default: return null;
  }
}

/**
 * Create a new trial.
 *
 * @param {object} config
 * @param {string} config.targetShape - Shape the user must identify
 * @param {string} config.alternativeShape - Decoy shape
 * @param {number} config.displayFrames - Stimulus duration in frames
 * @param {number} config.hz - Display refresh rate
 * @param {number} [config.exerciseType=1] - 1 = central only, 2 = central + peripheral, 3 = selective attention
 * @param {number} [config.peripheralPosition] - Target position (0-7) for Exercise 2/3
 * @param {number} [config.distractorCount] - Number of distractors for Exercise 3
 * @param {number} [config.distractorTier] - Distractor difficulty tier for Exercise 3
 * @returns {object} Mutable trial state
 */
export function createTrial({ targetShape, alternativeShape, displayFrames, hz, exerciseType = 1, peripheralPosition, distractorCount, distractorTier, difficultyLevel, eccentricity }) {
  const choices = Math.random() < 0.5
    ? [targetShape, alternativeShape]
    : [alternativeShape, targetShape];

  const hasPeripheral = exerciseType === 2 || exerciseType === 3;

  return {
    phase: TRIAL_PHASE.FIXATION,
    phaseFrame: 0,
    exerciseType,

    // Stimulus config
    targetShape,
    alternativeShape,
    presentedShape: Math.random() < 0.5 ? targetShape : alternativeShape,
    choices,
    displayFrames,
    hz,

    // Exercise 2/3: peripheral target
    peripheralPosition: hasPeripheral
      ? (peripheralPosition ?? Math.floor(Math.random() * 8))
      : -1,

    // Shape pair difficulty level (1-4)
    difficultyLevel: difficultyLevel || 1,

    // Exercise 2/3: eccentricity (distance ratio for peripheral target)
    eccentricity: eccentricity || 0.75,

    // Exercise 3: distractor data (populated by caller after creation)
    distractors: [],
    distractorCount: exerciseType === 3 ? (distractorCount || 3) : 0,
    distractorTier: exerciseType === 3 ? (distractorTier || 1) : 0,

    // Phase durations
    fixationFrames: msToFrames(TIMING.FIXATION_MS, hz),
    feedbackFrames: msToFrames(hasPeripheral ? 700 : TIMING.FEEDBACK_MS, hz),
    itiFrames: msToFrames(TIMING.ITI_MS, hz),

    // Response data
    responsePromptTime: 0,
    chosenShape: null,
    shapeCorrect: null,
    shapeReactionTimeMs: 0,

    // Exercise 2/3 location response
    locationPromptTime: 0,
    chosenPosition: -1,
    locationCorrect: null,
    locationReactionTimeMs: 0,

    // Combined result
    correct: null,
    reactionTimeMs: 0,

    // Timeout flag (2D) — excluded from staircase
    timedOut: false,
  };
}

/**
 * Advance trial by one frame (timed phases only).
 *
 * @param {object} trial
 * @returns {boolean} True if phase changed
 */
export function tickTrial(trial) {
  const { phase } = trial;

  // Response and complete phases don't tick
  if (phase === TRIAL_PHASE.RESPONSE_SHAPE ||
      phase === TRIAL_PHASE.RESPONSE_LOCATION ||
      phase === TRIAL_PHASE.COMPLETE) {
    return false;
  }

  trial.phaseFrame++;

  let duration;
  switch (phase) {
    case TRIAL_PHASE.FIXATION: duration = trial.fixationFrames; break;
    case TRIAL_PHASE.STIMULUS: duration = trial.displayFrames; break;
    case TRIAL_PHASE.FEEDBACK: duration = trial.feedbackFrames; break;
    case TRIAL_PHASE.ITI:      duration = trial.itiFrames; break;
    default: return false;
  }

  if (trial.phaseFrame >= duration) {
    const nextPhase = getNextTimedPhase(phase);
    if (!nextPhase) return false;

    trial.phase = nextPhase;
    trial.phaseFrame = 0;

    if (nextPhase === TRIAL_PHASE.RESPONSE_SHAPE) {
      trial.responsePromptTime = performance.now();
    }

    return true;
  }

  return false;
}

/**
 * Submit shape identification response (EXRC-01, EXRC-04).
 * For Exercise 1: advances to FEEDBACK.
 * For Exercise 2: advances to RESPONSE_LOCATION.
 *
 * @param {object} trial
 * @param {string} chosenShape
 * @returns {boolean} True if accepted
 */
export function submitShapeResponse(trial, chosenShape) {
  if (trial.phase !== TRIAL_PHASE.RESPONSE_SHAPE) return false;

  const now = performance.now();
  trial.chosenShape = chosenShape;

  // Handle timeout (2D)
  if (chosenShape === '__TIMEOUT__') {
    trial.timedOut = true;
    trial.shapeCorrect = false;
  } else {
    trial.shapeCorrect = chosenShape === trial.presentedShape;
  }
  trial.shapeReactionTimeMs = Math.round(now - trial.responsePromptTime);

  if (trial.exerciseType === 2 || trial.exerciseType === 3) {
    // EXRC-04/05: Move to peripheral location response
    trial.phase = TRIAL_PHASE.RESPONSE_LOCATION;
    trial.phaseFrame = 0;
    trial.locationPromptTime = performance.now();
  } else {
    // Exercise 1: shape response is the only response
    trial.correct = trial.shapeCorrect;
    trial.reactionTimeMs = trial.shapeReactionTimeMs;
    trial.phase = TRIAL_PHASE.FEEDBACK;
    trial.phaseFrame = 0;
  }

  return true;
}

/**
 * Submit peripheral location response (EXRC-05, Exercise 2 only).
 * EXRC-06: Trial correct only if BOTH shape AND location are correct.
 *
 * @param {object} trial
 * @param {number} chosenPosition - Position index (0-7)
 * @returns {boolean} True if accepted
 */
export function submitLocationResponse(trial, chosenPosition) {
  if (trial.phase !== TRIAL_PHASE.RESPONSE_LOCATION) return false;

  const now = performance.now();
  trial.chosenPosition = chosenPosition;
  trial.locationCorrect = chosenPosition === trial.peripheralPosition;
  trial.locationReactionTimeMs = Math.round(now - trial.locationPromptTime);

  // EXRC-06: Combined judgment
  trial.correct = trial.shapeCorrect && trial.locationCorrect;
  trial.reactionTimeMs = trial.shapeReactionTimeMs + trial.locationReactionTimeMs;

  trial.phase = TRIAL_PHASE.FEEDBACK;
  trial.phaseFrame = 0;
  return true;
}

/**
 * Legacy alias — calls submitShapeResponse.
 */
export function submitResponse(trial, chosenShape) {
  return submitShapeResponse(trial, chosenShape);
}

/**
 * Extract per-trial data record (TRAL-08).
 *
 * @param {object} trial
 * @returns {object}
 */
export function getTrialData(trial) {
  const data = {
    exerciseType: trial.exerciseType,
    targetShape: trial.targetShape,
    alternativeShape: trial.alternativeShape,
    presentedShape: trial.presentedShape,
    displayFrames: trial.displayFrames,
    displayTimeMs: Math.round((trial.displayFrames / trial.hz) * 1000 * 10) / 10,
    chosenShape: trial.chosenShape,
    shapeCorrect: trial.shapeCorrect,
    correct: trial.correct,
    reactionTimeMs: trial.reactionTimeMs,
    difficultyLevel: trial.difficultyLevel,
    timedOut: trial.timedOut,
    timestamp: Date.now(),
  };

  if (trial.exerciseType === 2 || trial.exerciseType === 3) {
    data.eccentricity = trial.eccentricity;
    data.peripheralPosition = trial.peripheralPosition;
    data.chosenPosition = trial.chosenPosition;
    data.locationCorrect = trial.locationCorrect;
    data.shapeReactionTimeMs = trial.shapeReactionTimeMs;
    data.locationReactionTimeMs = trial.locationReactionTimeMs;
  }

  if (trial.exerciseType === 3) {
    data.distractors = trial.distractors;
    data.distractorCount = trial.distractorCount;
    data.distractorTier = trial.distractorTier;
  }

  return data;
}
