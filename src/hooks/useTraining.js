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
  createDoubleStaircase, getActiveStaircase, updateDoubleStaircase,
  getDoubleStaircaseStats, calculateDoubleThreshold,
} from '../engine/staircase.js';
import {
  drawFixation, drawCentralStimulus, drawPeripheralTarget,
  drawPeripheralMarkers, drawSessionHUD, msToFrames,
  generateConcentricDistractors, drawConcentricDistractors,
  ECCENTRICITIES, themeText, themeAccent,
} from '../engine/stimulusRenderer.js';
import { pickShapePairByDifficulty } from '../engine/shapeDifficulty.js';
import {
  createSession, advanceSession, resumeAfterRest, getSessionSummary,
  SESSION_STATE,
} from '../engine/sessionManager.js';
import {
  saveSession, getStartingFrames, getCompletedSessionCount, loadProfile, saveProfile,
  isExerciseUnlocked, loadSettings,
} from '../services/dataService.js';
import { initAudio, playCorrect, playIncorrect, playSessionComplete, applyAudioSettings } from '../engine/audioFeedback.js';

const RESPONSE_TIMEOUT_MS = 15000; // 15s safety-net timeout
const PRE_TRIAL_MS = 2000; // 2-second pre-trial "Ready?" countdown
const WARMUP_TRIALS = 4; // Practice trials before staircase engages


function drawPreSession(ctx, w, h, session, progress) {
  const cx = Math.round(w / 2);

  ctx.fillStyle = themeText(0.85);
  ctx.font = 'bold 28px "Nunito", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const exLabels = { 1: 'Exercise 1', 2: 'Exercise 2', 3: 'Exercise 3' };
  ctx.fillText(`${exLabels[session.exerciseType] || 'Exercise'} \u2014 Get Ready!`, cx, Math.round(h * 0.42));

  // Exercise 2/3 dual-response instructions (2G)
  if (session.exerciseType === 2 || session.exerciseType === 3) {
    ctx.fillStyle = themeText(0.7);
    ctx.font = '18px "Nunito", sans-serif';
    ctx.fillText('This exercise has TWO responses:', cx, Math.round(h * 0.64));
    ctx.fillStyle = themeText(0.55);
    ctx.font = '16px "Nunito", sans-serif';
    ctx.fillText('1. Identify the central shape', cx, Math.round(h * 0.69));
    ctx.fillText('2. Locate the peripheral triangle', cx, Math.round(h * 0.74));
    if (session.exerciseType === 3) {
      ctx.fillStyle = themeText(0.5);
      ctx.font = '15px "Nunito", sans-serif';
      ctx.fillText('Distractors surround the target \u2014 stay focused!', cx, Math.round(h * 0.79));
    }
  }

  // Progress bar
  const barY = Math.round(h * 0.82);
  const barW = Math.round(w * 0.3);
  const barH = 4;
  const barX = cx - Math.round(barW / 2);
  ctx.fillStyle = themeText(0.1);
  ctx.fillRect(barX, barY, barW, barH);
  ctx.fillStyle = themeAccent(0.5);
  ctx.fillRect(barX, barY, Math.round(barW * progress), barH);

  // Countdown text (2A)
  const secsLeft = Math.max(0, Math.ceil((1 - progress) * (session.preSessionMs / 1000)));
  ctx.fillStyle = themeText(0.45);
  ctx.font = '16px "Nunito", sans-serif';
  ctx.fillText(`Starting in ${secsLeft}s`, cx, barY + 24);
}

/**
 * Draw pre-trial shape preview with countdown.
 * Shows the two shapes the user will choose between and a 3-2-1 countdown.
 */
function drawPreTrial(ctx, w, h, trial, progress, isWarmup = false) {
  const cx = Math.round(w / 2);
  const cy = Math.round(h / 2);

  // "Ready?" prompt
  ctx.fillStyle = themeText(0.8);
  ctx.font = 'bold 36px "Nunito", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Ready?', cx, cy - Math.round(h * 0.08));

  // Countdown number
  const secsLeft = Math.max(1, Math.ceil((1 - progress) * (PRE_TRIAL_MS / 1000)));
  ctx.fillStyle = themeText(0.55);
  ctx.font = 'bold 48px "Nunito", sans-serif';
  ctx.fillText(`${secsLeft}`, cx, cy + Math.round(h * 0.08));

  // Subtle instruction
  ctx.fillStyle = themeText(0.35);
  ctx.font = '15px "Nunito", sans-serif';
  ctx.fillText(isWarmup ? 'Practice — take your time' : '', cx, cy + Math.round(h * 0.2));
}

/**
 * Draw a countdown ring on canvas for response timeout (visual only).
 */
function drawTimeoutRing(ctx, w, h, progress) {
  const cx = Math.round(w / 2);
  const cy = Math.round(h * 0.12);
  const radius = 24;
  const lineWidth = 3;

  // Background ring
  ctx.strokeStyle = themeText(0.1);
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  // Countdown arc (depleting clockwise from 12 o'clock)
  const remaining = 1 - progress;
  if (remaining > 0) {
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + Math.PI * 2 * remaining;
    ctx.strokeStyle = progress > 0.8
      ? 'rgba(239, 68, 68, 0.6)'
      : themeText(0.3);
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.stroke();
  }

  // Remaining seconds
  const secsLeft = Math.max(0, Math.ceil(remaining * (RESPONSE_TIMEOUT_MS / 1000)));
  ctx.fillStyle = progress > 0.8
    ? 'rgba(239, 68, 68, 0.7)'
    : themeText(0.4);
  ctx.font = '14px "Nunito", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${secsLeft}`, cx, cy);
}

/**
 * @param {React.RefObject} engineData
 * @param {React.RefObject} renderRef
 */
export function useTraining(engineData, renderRef) {
  // Check onboarding state on init (Phase 5B)
  const initialPhase = (() => {
    const profile = loadProfile();
    return profile.hasSeenWelcome ? 'idle' : 'onboarding';
  })();

  const [uiPhase, setUiPhase] = useState(initialPhase);
  // 'idle' | 'onboarding' | 'exercise_select' | 'pre_session' | 'pre_trial'
  // | 'running' | 'awaiting_shape_response' | 'awaiting_location_response'
  // | 'inter_block' | 'post_session'

  const sessionRef = useRef(null);
  const trialRef = useRef(null);
  const staircaseRef = useRef(null);
  const lastTrialDataRef = useRef(null);
  const warmupCountRef = useRef(0); // Tracks warm-up trials per block
  const difficultyLockRef = useRef(false); // Cached from settings at session start
  const completedEx1SessionsRef = useRef(getCompletedSessionCount(1));
  const [devUnlock, setDevUnlock] = useState(false);

  // Pause state
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);

  // Abort state (2B)
  const [abortRequested, setAbortRequested] = useState(false);
  const abortRequestedRef = useRef(false);

  // Response timeout (2D)
  const responseStartRef = useRef(null);
  const timeoutTimerRef = useRef(null);

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

  const hz = engineData.current?.hz || 60;
  const ex2Available = devUnlock || isExerciseUnlocked(2, hz).unlocked;
  const ex3Available = devUnlock || isExerciseUnlocked(3, hz).unlocked;

  // --- Abort callbacks (2B) ---
  const requestAbort = useCallback(() => {
    setAbortRequested(true);
    abortRequestedRef.current = true;
  }, []);

  const cancelAbort = useCallback(() => {
    setAbortRequested(false);
    abortRequestedRef.current = false;
  }, []);

  const confirmAbort = useCallback(() => {
    setAbortRequested(false);
    abortRequestedRef.current = false;
    sessionRef.current = null;
    trialRef.current = null;
    staircaseRef.current = null;
    renderRef.current = null;
    if (timeoutTimerRef.current) {
      clearTimeout(timeoutTimerRef.current);
      timeoutTimerRef.current = null;
    }
    responseStartRef.current = null;
    pausedRef.current = false;
    setPaused(false);
    setUiPhase('idle');
  }, [renderRef]);

  // --- Pause callbacks ---
  const togglePause = useCallback(() => {
    const next = !pausedRef.current;
    pausedRef.current = next;
    setPaused(next);
  }, []);

  const resumeGame = useCallback(() => {
    pausedRef.current = false;
    setPaused(false);
  }, []);

  // --- Timeout helper (2D) ---
  const clearResponseTimeout = useCallback(() => {
    if (timeoutTimerRef.current) {
      clearTimeout(timeoutTimerRef.current);
      timeoutTimerRef.current = null;
    }
    responseStartRef.current = null;
  }, []);

  /**
   * Show exercise selection screen (or auto-start Ex1 if Ex2 not available).
   */
  const beginTraining = useCallback(() => {
    if (ex2Available || ex3Available) {
      setUiPhase('exercise_select');
    } else {
      startSessionWithType(1);
    }
  }, [ex2Available, ex3Available]);

  /**
   * Start a session with the given exercise type.
   */
  const startSessionWithType = useCallback((exerciseType) => {
    initAudio(); // AUDO-01: Create AudioContext on user gesture

    // Apply saved audio settings on session start
    const settings = loadSettings();
    applyAudioSettings(settings);

    const sessionCount = getCompletedSessionCount(exerciseType);
    const { target, alternative } = pickShapePairByDifficulty(sessionCount);

    // Cache difficulty lock for this session (avoids per-trial localStorage reads)
    difficultyLockRef.current = !!settings.difficultyLock;

    // Session mode from settings (mini=1 block, full=2 blocks)
    const sessionMode = settings.sessionMode || 'full';

    const session = createSession({
      targetShape: target,
      alternativeShape: alternative,
      exerciseType,
      sessionMode,
    });
    sessionRef.current = session;

    // STRC-10: Start at previous threshold × 1.1 (or default)
    const hz = engineData.current?.hz || 60;
    const startFrames = getStartingFrames(exerciseType, hz);
    staircaseRef.current = createDoubleStaircase(startFrames);
    warmupCountRef.current = 0; // Reset warm-up counter
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

  /**
   * Set up the trial render loop (called after pre-trial countdown completes).
   */
  const setupTrialRender = useCallback((_trial, session, isWarmupTrial = false) => {
    setUiPhase('running');

    renderRef.current = (ctx, w, h) => {
      const t = trialRef.current;
      if (!t) return;

      // Pause support — freeze all timed phases
      if (pausedRef.current) {
        // Draw current phase statically without advancing
        ctx.fillStyle = themeText(0.3);
        ctx.font = 'bold 28px "Nunito", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('PAUSED', Math.round(w / 2), Math.round(h / 2));
        return;
      }

      const prevPhase = t.phase;
      tickTrial(t);

      if (t.phase !== prevPhase) {
        if (t.phase === TRIAL_PHASE.RESPONSE_SHAPE) {
          responseStartRef.current = performance.now();
          clearResponseTimeout();
          timeoutTimerRef.current = setTimeout(() => {
            if (trialRef.current && trialRef.current.phase === TRIAL_PHASE.RESPONSE_SHAPE) {
              respondShape('__TIMEOUT__');
            }
          }, RESPONSE_TIMEOUT_MS);
          setUiPhase('awaiting_shape_response');
        }
        if (t.phase === TRIAL_PHASE.RESPONSE_LOCATION) {
          responseStartRef.current = performance.now();
          clearResponseTimeout();
          timeoutTimerRef.current = setTimeout(() => {
            if (trialRef.current && trialRef.current.phase === TRIAL_PHASE.RESPONSE_LOCATION) {
              respondLocation(-1);
            }
          }, RESPONSE_TIMEOUT_MS);
          setUiPhase('awaiting_location_response');
        }
        if (t.phase === TRIAL_PHASE.COMPLETE) {
          clearResponseTimeout();
          const data = getTrialData(t);
          lastTrialDataRef.current = data;

          // Warm-up trials don't affect staircase
          const isWarmupTrial = warmupCountRef.current < WARMUP_TRIALS;
          if (isWarmupTrial) {
            warmupCountRef.current++;
          } else if (!data.timedOut) {
            // Difficulty lock: skip staircase update when locked (cached at session start)
            if (!difficultyLockRef.current) {
              updateDoubleStaircase(staircaseRef.current, data.correct);
            }
          }
          trialRef.current = null;

          const newState = advanceSession(session, data);
          if (newState === SESSION_STATE.INTER_BLOCK) {
            renderRef.current = null;
            setUiPhase('inter_block');
          } else if (newState === SESSION_STATE.POST_SESSION) {
            const summary = getSessionSummary(session);
            const thresholdResult = calculateDoubleThreshold(staircaseRef.current);
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

            const profile = loadProfile();
            if (session.exerciseType === 1) {
              profile.completedEx1Sessions = (profile.completedEx1Sessions || 0) + 1;
              completedEx1SessionsRef.current = profile.completedEx1Sessions;
            } else if (session.exerciseType === 2) {
              profile.completedEx2Sessions = (profile.completedEx2Sessions || 0) + 1;
            } else if (session.exerciseType === 3) {
              profile.completedEx3Sessions = (profile.completedEx3Sessions || 0) + 1;
            }
            saveProfile(profile);

            playSessionComplete();
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
          drawCentralStimulus(ctx, t.presentedShape, w, h);
          if ((t.exerciseType === 2 || t.exerciseType === 3) && t.peripheralPosition >= 0) {
            drawPeripheralTarget(ctx, t.peripheralPosition, w, h, undefined, t.eccentricity);
          }
          if (t.exerciseType === 3 && t.distractors && t.distractors.length > 0) {
            drawConcentricDistractors(ctx, t.distractors, w, h);
          }
          break;

        case TRIAL_PHASE.RESPONSE_SHAPE: {
          ctx.fillStyle = themeText(0.6);
          ctx.font = '20px "Nunito", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('Which shape did you see?', Math.round(w / 2), Math.round(h * 0.35));
          if (responseStartRef.current) {
            const elapsed = performance.now() - responseStartRef.current;
            const progress = Math.min(elapsed / RESPONSE_TIMEOUT_MS, 1);
            drawTimeoutRing(ctx, w, h, progress);
          }
          break;
        }

        case TRIAL_PHASE.RESPONSE_LOCATION: {
          drawPeripheralMarkers(ctx, w, h, -1, undefined, undefined, t.eccentricity);
          ctx.fillStyle = themeText(0.6);
          ctx.font = '20px "Nunito", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('Where was the triangle?', Math.round(w / 2), Math.round(h * 0.2));
          if (responseStartRef.current) {
            const elapsed = performance.now() - responseStartRef.current;
            const progress = Math.min(elapsed / RESPONSE_TIMEOUT_MS, 1);
            drawTimeoutRing(ctx, w, h, progress);
          }
          break;
        }

        case TRIAL_PHASE.FEEDBACK: {
          const midX = Math.round(w / 2);
          const midY = Math.round(h / 2);

          if (t.exerciseType === 2 || t.exerciseType === 3) {
            const shapeColor = t.shapeCorrect ? '#22c55e' : '#ef4444';
            const shapeSymbol = t.shapeCorrect ? '\u2713' : '\u2717';
            const locColor = t.locationCorrect ? '#22c55e' : '#ef4444';
            const locSymbol = t.locationCorrect ? '\u2713' : '\u2717';

            ctx.font = 'bold 36px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            ctx.fillStyle = shapeColor;
            ctx.fillText(shapeSymbol, midX - 50, midY);
            ctx.fillStyle = themeText(0.55);
            ctx.font = '16px "Nunito", sans-serif';
            ctx.fillText('Shape', midX - 50, midY + 32);

            ctx.fillStyle = locColor;
            ctx.font = 'bold 36px sans-serif';
            ctx.fillText(locSymbol, midX + 50, midY);
            ctx.fillStyle = themeText(0.55);
            ctx.font = '16px "Nunito", sans-serif';
            ctx.fillText('Location', midX + 50, midY + 32);
          } else {
            const color = t.correct ? '#22c55e' : '#ef4444';
            const symbol = t.correct ? '\u2713' : '\u2717';
            ctx.fillStyle = color;
            ctx.font = 'bold 72px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(symbol, midX, midY);
          }
          break;
        }

        default:
          break;
      }

      // Session HUD
      if (session && t.phase !== TRIAL_PHASE.STIMULUS) {
        const total = session.trialsPerBlock * session.totalBlocks;
        const done = session.currentBlock * session.trialsPerBlock + session.currentTrial;
        const hz = engineData.current?.hz || 60;
        const ds = staircaseRef.current;
        const dsStats = ds ? getDoubleStaircaseStats(ds) : null;
        drawSessionHUD(ctx, w, h, {
          progress: (done + 1) / total,
          displayTimeMs: dsStats ? Math.round((dsStats.currentDisplayTime / hz) * 1000) : 0,
          streak: ds ? (ds.staircase1.correctStreak + ds.staircase2.correctStreak) : 0,
          blockLabel: isWarmupTrial
            ? `Practice ${warmupCountRef.current + 1} / ${WARMUP_TRIALS}`
            : `Block ${session.currentBlock + 1} / ${session.totalBlocks}`,
        });
      }
    };
  }, [engineData, renderRef]);

  const startNextTrial = useCallback(() => {
    const session = sessionRef.current;
    if (!session) return;
    const hz = engineData.current?.hz || 60;
    // Select active staircase for this trial (random interleaving)
    const activeStaircase = getActiveStaircase(staircaseRef.current);

    // Pick difficulty-weighted shape pair based on session count
    const sessionCount = getCompletedSessionCount(session.exerciseType || 1);
    const { target, alternative, difficultyLevel } = pickShapePairByDifficulty(sessionCount);

    // Warm-up trials use extra-slow display (excluded from staircase)
    const isWarmup = warmupCountRef.current < WARMUP_TRIALS;
    const displayFrames = isWarmup
      ? activeStaircase.displayTime + 6 // ~100ms slower than starting
      : activeStaircase.displayTime;

    const trialConfig = {
      targetShape: target,
      alternativeShape: alternative,
      displayFrames,
      hz,
      exerciseType: session.exerciseType || 1,
      difficultyLevel,
    };

    // Eccentricity progression for Ex2/Ex3 (proximal → medium → distal)
    if (session.exerciseType === 2 || session.exerciseType === 3) {
      const exCount = getCompletedSessionCount(session.exerciseType);
      if (exCount < 3)      trialConfig.eccentricity = ECCENTRICITIES.PROXIMAL;
      else if (exCount < 6) trialConfig.eccentricity = ECCENTRICITIES.MEDIUM;
      else                  trialConfig.eccentricity = ECCENTRICITIES.DISTAL;
    }

    // Exercise 3: determine distractor count based on completed sessions (UFOV progression)
    if (session.exerciseType === 3) {
      const ex3Count = getCompletedSessionCount(3);
      if (ex3Count < 2)       trialConfig.distractorCount = 0;
      else if (ex3Count < 4)  trialConfig.distractorCount = 8;
      else if (ex3Count < 7)  trialConfig.distractorCount = 24;
      else                    trialConfig.distractorCount = 47;
    }

    const trial = createTrial(trialConfig);

    // Generate concentric ring distractors (downward-pointing triangles per UFOV)
    if (session.exerciseType === 3 && trial.peripheralPosition >= 0 && trial.distractorCount > 0) {
      trial.distractors = generateConcentricDistractors(
        trial.peripheralPosition,
        trial.distractorCount,
        trial.eccentricity,
      );
    }

    trialRef.current = trial;

    // Pre-trial countdown: show the 2 shapes before the trial starts
    setUiPhase('pre_trial');
    const preTrialCounter = { count: 0 };
    const warmup = isWarmup;
    renderRef.current = (ctx, w, h, hz) => {
      if (pausedRef.current) {
        ctx.fillStyle = themeText(0.25);
        ctx.font = '24px "Nunito", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('PAUSED', Math.round(w / 2), Math.round(h / 2));
        return;
      }
      preTrialCounter.count++;
      const totalFrames = msToFrames(PRE_TRIAL_MS, hz);
      const progress = Math.min(preTrialCounter.count / totalFrames, 1);
      drawPreTrial(ctx, w, h, trial, progress, warmup);

      if (preTrialCounter.count >= totalFrames) {
        setupTrialRender(trial, session, warmup);
      }
    };
  }, [engineData, renderRef, setupTrialRender]);

  const respondShape = useCallback((chosenShape) => {
    const trial = trialRef.current;
    if (!trial) return;
    if (abortRequestedRef.current) return;
    clearResponseTimeout();
    if (submitShapeResponse(trial, chosenShape)) {
      if (trial.exerciseType === 2 || trial.exerciseType === 3) {
        setUiPhase('awaiting_location_response');
      } else {
        // Exercise 1: play feedback sound now
        if (trial.correct) playCorrect(); else playIncorrect();
        setUiPhase('running');
      }
    }
  }, [clearResponseTimeout]);

  const respondLocation = useCallback((position) => {
    const trial = trialRef.current;
    if (!trial) return;
    if (abortRequestedRef.current) return;
    clearResponseTimeout();
    if (submitLocationResponse(trial, position)) {
      // Exercise 2: play feedback after both responses
      if (trial.correct) playCorrect(); else playIncorrect();
      setUiPhase('running');
    }
  }, [clearResponseTimeout]);

  const resumeFromRest = useCallback(() => {
    const session = sessionRef.current;
    if (!session) return;
    resumeAfterRest(session);
    warmupCountRef.current = 0; // Reset warm-up for new block
    startNextTrial();
  }, [startNextTrial]);

  const finishSession = useCallback(() => {
    sessionRef.current = null;
    renderRef.current = null;
    setUiPhase('idle');
  }, [renderRef]);

  // --- Onboarding (Phase 5) ---
  const completeOnboarding = useCallback(() => {
    const profile = loadProfile();
    profile.hasSeenWelcome = true;
    saveProfile(profile);
    setUiPhase('idle');
  }, []);

  const skipOnboarding = useCallback(() => {
    const profile = loadProfile();
    profile.hasSeenWelcome = true;
    saveProfile(profile);
    setUiPhase('idle');
  }, []);

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
    ex3Available,
    devUnlock,
    // Abort (2B)
    abortRequested,
    abortRequestedRef,
    requestAbort,
    cancelAbort,
    confirmAbort,
    // Pause
    paused,
    togglePause,
    resumeGame,
    // Onboarding (Phase 5)
    completeOnboarding,
    skipOnboarding,
    getStats: () => staircaseRef.current ? getDoubleStaircaseStats(staircaseRef.current) : { totalTrials: 0, totalReversals: 0, accuracy: 0, currentDisplayTime: 0 },
    getThreshold: () => staircaseRef.current ? calculateDoubleThreshold(staircaseRef.current) : { threshold: 0, method: 'fallback-last', reversalsUsed: 0 },
    getSessionSummary: () => sessionRef.current ? getSessionSummary(sessionRef.current) : null,
  };
}
