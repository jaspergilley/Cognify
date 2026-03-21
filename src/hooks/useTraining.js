/**
 * useTraining Hook
 *
 * Manages full training session lifecycle for both Exercise 1 and Exercise 2.
 * Handles pre-session display, trial blocks with staircase, rest periods,
 * and post-session results.
 *
 * EXRC-07: Exercise 2 staircase starts at 250ms (~15 frames at 60Hz)
 * EXRC-08: Exercise 2 unlocks after 5 Exercise 1 sessions
 * EXRC-09: Hidden dev toggle to unlock Exercise 2
 *
 * @module hooks/useTraining
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import {
  createTrial, tickTrial, submitShapeResponse, submitLocationResponse,
  getTrialData, TRIAL_PHASE,
} from '../engine/trialEngine.js';
import {
  createStaircase, updateStaircase, getStaircaseStats, calculateThreshold,
} from '../engine/staircase.js';
import {
  drawFixation, drawCentralStimulus, drawPatternMask, drawPeripheralTarget,
  drawPeripheralMarkers, msToFrames,
} from '../engine/stimulusRenderer.js';
import { SHAPES, SHAPE_IDS } from '../engine/shapePaths.js';
import {
  createSession, advanceSession, resumeAfterRest, getSessionSummary,
  SESSION_STATE,
} from '../engine/sessionManager.js';
import {
  saveSession, getStartingFrames, getCompletedSessionCount, loadProfile, saveProfile,
} from '../services/dataService.js';
import { initAudio, playCorrect, playIncorrect, playSessionComplete } from '../engine/audioFeedback.js';

const EX2_UNLOCK_SESSIONS = 5; // EXRC-08

function pickShapePair() {
  const pool = [...SHAPE_IDS];
  const i = Math.floor(Math.random() * pool.length);
  const target = pool.splice(i, 1)[0];
  const j = Math.floor(Math.random() * pool.length);
  const alternative = pool[j];
  return { target, alternative };
}

function drawPreSession(ctx, w, h, session, progress) {
  const cx = Math.round(w / 2);
  const spacing = Math.round(w * 0.15);
  const shapeSize = Math.round(h * 0.14);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = '20px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const exLabel = session.exerciseType === 2 ? 'Exercise 2' : 'Exercise 1';
  ctx.fillText(`${exLabel} \u2014 Remember these shapes`, cx, Math.round(h * 0.25));

  ctx.fillStyle = '#ffffff';
  SHAPES[session.targetShape](ctx, cx - spacing, Math.round(h * 0.45), shapeSize);
  ctx.fillStyle = '#ffffff';
  SHAPES[session.alternativeShape](ctx, cx + spacing, Math.round(h * 0.45), shapeSize);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.font = '14px sans-serif';
  ctx.fillText(session.targetShape, cx - spacing, Math.round(h * 0.58));
  ctx.fillText(session.alternativeShape, cx + spacing, Math.round(h * 0.58));

  if (session.exerciseType === 2) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = '13px sans-serif';
    ctx.fillText('Also locate the peripheral triangle', cx, Math.round(h * 0.66));
  }

  const barW = Math.round(w * 0.3);
  const barH = 4;
  const barX = cx - Math.round(barW / 2);
  const barY = Math.round(h * 0.76);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.fillRect(barX, barY, barW, barH);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.fillRect(barX, barY, Math.round(barW * progress), barH);
}

/**
 * @param {React.RefObject} engineData
 * @param {React.RefObject} renderRef
 */
export function useTraining(engineData, renderRef) {
  const [uiPhase, setUiPhase] = useState('idle');
  // 'idle' | 'exercise_select' | 'pre_session' | 'running'
  // | 'awaiting_shape_response' | 'awaiting_location_response'
  // | 'inter_block' | 'post_session'

  const sessionRef = useRef(null);
  const trialRef = useRef(null);
  const staircaseRef = useRef(null);
  const lastTrialDataRef = useRef(null);
  const completedEx1SessionsRef = useRef(getCompletedSessionCount(1));
  const [devUnlock, setDevUnlock] = useState(false);

  // EXRC-09: Dev toggle (Ctrl+Shift+U)
  useEffect(() => {
    function onKey(e) {
      if (e.ctrlKey && e.shiftKey && e.key === 'U') {
        setDevUnlock((prev) => !prev);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const ex2Available = devUnlock || completedEx1SessionsRef.current >= EX2_UNLOCK_SESSIONS;

  /**
   * Show exercise selection screen (or auto-start Ex1 if Ex2 not available).
   */
  const beginTraining = useCallback(() => {
    if (ex2Available) {
      setUiPhase('exercise_select');
    } else {
      startSessionWithType(1);
    }
  }, [ex2Available]);

  /**
   * Start a session with the given exercise type.
   */
  const startSessionWithType = useCallback((exerciseType) => {
    initAudio(); // AUDO-01: Create AudioContext on user gesture
    const { target, alternative } = pickShapePair();
    const session = createSession({
      targetShape: target,
      alternativeShape: alternative,
    });
    session.exerciseType = exerciseType;
    sessionRef.current = session;

    // STRC-10: Start at previous threshold × 1.1 (or default)
    const hz = engineData.current?.hz || 60;
    const startFrames = getStartingFrames(exerciseType, hz);
    staircaseRef.current = createStaircase(startFrames);
    setUiPhase('pre_session');

    const frameCounter = { count: 0 };
    renderRef.current = (ctx, w, h, hz) => {
      frameCounter.count++;
      const totalFrames = msToFrames(session.preSessionMs, hz);
      const progress = Math.min(frameCounter.count / totalFrames, 1);
      drawPreSession(ctx, w, h, session, progress);

      if (frameCounter.count >= totalFrames) {
        session.state = SESSION_STATE.RUNNING;
        startNextTrial();
      }
    };
  }, [engineData, renderRef]);

  const startNextTrial = useCallback(() => {
    const session = sessionRef.current;
    if (!session) return;
    const hz = engineData.current?.hz || 60;
    const staircase = staircaseRef.current;

    const trial = createTrial({
      targetShape: session.targetShape,
      alternativeShape: session.alternativeShape,
      displayFrames: staircase.displayTime,
      hz,
      exerciseType: session.exerciseType || 1,
    });

    trialRef.current = trial;
    setUiPhase('running');

    renderRef.current = (ctx, w, h) => {
      const t = trialRef.current;
      if (!t) return;

      const prevPhase = t.phase;
      tickTrial(t);

      if (t.phase !== prevPhase) {
        if (t.phase === TRIAL_PHASE.RESPONSE_SHAPE) {
          setUiPhase('awaiting_shape_response');
        }
        if (t.phase === TRIAL_PHASE.RESPONSE_LOCATION) {
          setUiPhase('awaiting_location_response');
        }
        if (t.phase === TRIAL_PHASE.COMPLETE) {
          const data = getTrialData(t);
          lastTrialDataRef.current = data;
          staircaseRef.current = updateStaircase(staircaseRef.current, data.correct);
          trialRef.current = null;

          const newState = advanceSession(session, data);
          if (newState === SESSION_STATE.INTER_BLOCK) {
            renderRef.current = null;
            setUiPhase('inter_block');
          } else if (newState === SESSION_STATE.POST_SESSION) {
            // Persist session data (DATA-03)
            const summary = getSessionSummary(session);
            const thresholdResult = calculateThreshold(staircaseRef.current);
            saveSession({
              exerciseType: session.exerciseType,
              targetShape: session.targetShape,
              alternativeShape: session.alternativeShape,
              thresholdFrames: thresholdResult.threshold,
              thresholdMethod: thresholdResult.method,
              accuracy: summary.accuracy,
              totalTrials: summary.totalTrials,
              averageRtMs: summary.averageRtMs,
              durationMs: summary.durationMs,
              trials: session.trials,
              completedAt: Date.now(),
            });

            // Update profile
            const profile = loadProfile();
            if (session.exerciseType === 1) {
              profile.completedEx1Sessions = (profile.completedEx1Sessions || 0) + 1;
              completedEx1SessionsRef.current = profile.completedEx1Sessions;
            } else {
              profile.completedEx2Sessions = (profile.completedEx2Sessions || 0) + 1;
            }
            saveProfile(profile);

            playSessionComplete(); // AUDO-04
            renderRef.current = null;
            setUiPhase('post_session');
          } else {
            startNextTrial();
          }
          return;
        }
      }

      // Render
      switch (t.phase) {
        case TRIAL_PHASE.FIXATION:
          drawFixation(ctx, w, h);
          break;

        case TRIAL_PHASE.STIMULUS:
          drawCentralStimulus(ctx, t.targetShape, w, h);
          // EXRC-03: Exercise 2 shows peripheral target simultaneously
          if (t.exerciseType === 2 && t.peripheralPosition >= 0) {
            drawPeripheralTarget(ctx, t.peripheralPosition, w, h);
          }
          break;

        case TRIAL_PHASE.MASK:
          drawPatternMask(ctx, w, h, t.maskSeed);
          break;

        case TRIAL_PHASE.RESPONSE_SHAPE: {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.font = '18px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('Which shape did you see?', Math.round(w / 2), Math.round(h * 0.35));
          break;
        }

        case TRIAL_PHASE.RESPONSE_LOCATION: {
          // Draw peripheral markers on canvas; HTML buttons provide interaction
          drawPeripheralMarkers(ctx, w, h);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.font = '18px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('Where was the triangle?', Math.round(w / 2), Math.round(h * 0.2));
          break;
        }

        case TRIAL_PHASE.FEEDBACK: {
          const color = t.correct ? '#22c55e' : '#ef4444';
          const symbol = t.correct ? '\u2713' : '\u2717';
          ctx.fillStyle = color;
          ctx.font = 'bold 72px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(symbol, Math.round(w / 2), Math.round(h / 2));
          break;
        }

        default:
          break;
      }

      // Progress indicator
      if (session) {
        const total = session.trialsPerBlock * session.totalBlocks;
        const done = session.currentBlock * session.trialsPerBlock + session.currentTrial;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.font = '12px monospace';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText(`${done + 1}/${total}`, Math.round(w) - 12, Math.round(h) - 12);
      }
    };
  }, [engineData, renderRef]);

  const respondShape = useCallback((chosenShape) => {
    const trial = trialRef.current;
    if (!trial) return;
    if (submitShapeResponse(trial, chosenShape)) {
      if (trial.exerciseType === 2) {
        setUiPhase('awaiting_location_response');
      } else {
        // Exercise 1: play feedback sound now
        if (trial.correct) playCorrect(); else playIncorrect();
        setUiPhase('running');
      }
    }
  }, []);

  const respondLocation = useCallback((position) => {
    const trial = trialRef.current;
    if (!trial) return;
    if (submitLocationResponse(trial, position)) {
      // Exercise 2: play feedback after both responses
      if (trial.correct) playCorrect(); else playIncorrect();
      setUiPhase('running');
    }
  }, []);

  const resumeFromRest = useCallback(() => {
    const session = sessionRef.current;
    if (!session) return;
    resumeAfterRest(session);
    startNextTrial();
  }, [startNextTrial]);

  const finishSession = useCallback(() => {
    sessionRef.current = null;
    renderRef.current = null;
    setUiPhase('idle');
  }, [renderRef]);

  return {
    uiPhase,
    beginTraining,
    startSessionWithType,
    respondShape,
    respondLocation,
    resumeFromRest,
    finishSession,
    trialRef,
    sessionRef,
    staircaseRef,
    lastTrialData: lastTrialDataRef,
    ex2Available,
    devUnlock,
    getStats: () => staircaseRef.current ? getStaircaseStats(staircaseRef.current) : { totalTrials: 0, totalReversals: 0, accuracy: 0, currentDisplayTime: 0 },
    getThreshold: () => staircaseRef.current ? calculateThreshold(staircaseRef.current) : { threshold: 0, method: 'fallback-last', reversalsUsed: 0 },
    getSessionSummary: () => sessionRef.current ? getSessionSummary(sessionRef.current) : null,
  };
}
