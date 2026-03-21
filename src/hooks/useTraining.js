/**
 * useTraining Hook
 *
 * Manages full training session lifecycle: pre-session display, trial blocks
 * with staircase integration, inter-block rest, and post-session results.
 *
 * @module hooks/useTraining
 */

import { useRef, useState, useCallback } from 'react';
import {
  createTrial, tickTrial, submitResponse, getTrialData, TRIAL_PHASE,
} from '../engine/trialEngine.js';
import {
  createStaircase, updateStaircase, getStaircaseStats, calculateThreshold,
} from '../engine/staircase.js';
import {
  drawFixation, drawCentralStimulus, drawPatternMask, msToFrames,
} from '../engine/stimulusRenderer.js';
import { SHAPES, SHAPE_IDS } from '../engine/shapePaths.js';
import {
  createSession, advanceSession, resumeAfterRest, getSessionSummary,
  SESSION_STATE,
} from '../engine/sessionManager.js';

/**
 * Pick two distinct random shapes.
 */
function pickShapePair() {
  const pool = [...SHAPE_IDS];
  const i = Math.floor(Math.random() * pool.length);
  const target = pool.splice(i, 1)[0];
  const j = Math.floor(Math.random() * pool.length);
  const alternative = pool[j];
  return { target, alternative };
}

/**
 * Draw pre-session display: both target shapes side by side (SESS-02).
 */
function drawPreSession(ctx, w, h, session, progress) {
  const cx = Math.round(w / 2);
  const spacing = Math.round(w * 0.15);
  const shapeSize = Math.round(h * 0.14);

  // Title
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = '20px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Remember these shapes', cx, Math.round(h * 0.25));

  // Draw shape A (left)
  ctx.fillStyle = '#ffffff';
  SHAPES[session.targetShape](ctx, cx - spacing, Math.round(h * 0.45), shapeSize);

  // Draw shape B (right)
  ctx.fillStyle = '#ffffff';
  SHAPES[session.alternativeShape](ctx, cx + spacing, Math.round(h * 0.45), shapeSize);

  // Shape labels
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.font = '14px sans-serif';
  ctx.fillText(session.targetShape, cx - spacing, Math.round(h * 0.58));
  ctx.fillText(session.alternativeShape, cx + spacing, Math.round(h * 0.58));

  // Progress bar
  const barW = Math.round(w * 0.3);
  const barH = 4;
  const barX = cx - Math.round(barW / 2);
  const barY = Math.round(h * 0.72);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.fillRect(barX, barY, barW, barH);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.fillRect(barX, barY, Math.round(barW * progress), barH);
}

/**
 * @param {React.RefObject} engineData - Engine data ref from useCanvasEngine
 * @param {React.RefObject} renderRef - Render callback ref from useCanvasEngine
 */
export function useTraining(engineData, renderRef) {
  const [uiPhase, setUiPhase] = useState('idle');
  // 'idle' | 'pre_session' | 'running' | 'awaiting_response'
  // | 'inter_block' | 'post_session'

  const sessionRef = useRef(null);
  const trialRef = useRef(null);
  const staircaseRef = useRef(createStaircase(15));
  const lastTrialDataRef = useRef(null);

  /**
   * Start a new training session.
   */
  const startSession = useCallback(() => {
    const { target, alternative } = pickShapePair();
    const session = createSession({
      targetShape: target,
      alternativeShape: alternative,
    });
    sessionRef.current = session;
    staircaseRef.current = createStaircase(15);
    setUiPhase('pre_session');

    // Pre-session display: show both shapes for 3 seconds
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
   * Start the next trial in the current block.
   */
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
    });

    trialRef.current = trial;
    setUiPhase('running');

    renderRef.current = (ctx, w, h) => {
      const t = trialRef.current;
      if (!t) return;

      const prevPhase = t.phase;
      tickTrial(t);

      // Handle phase transitions
      if (t.phase !== prevPhase) {
        if (t.phase === TRIAL_PHASE.RESPONSE) {
          setUiPhase('awaiting_response');
        }
        if (t.phase === TRIAL_PHASE.COMPLETE) {
          const data = getTrialData(t);
          lastTrialDataRef.current = data;
          staircaseRef.current = updateStaircase(staircaseRef.current, data.correct);
          trialRef.current = null;

          // Advance session
          const newState = advanceSession(session, data);

          if (newState === SESSION_STATE.INTER_BLOCK) {
            renderRef.current = null;
            setUiPhase('inter_block');
          } else if (newState === SESSION_STATE.POST_SESSION) {
            renderRef.current = null;
            setUiPhase('post_session');
          } else {
            // Auto-start next trial
            startNextTrial();
          }
          return;
        }
      }

      // Render based on trial phase
      switch (t.phase) {
        case TRIAL_PHASE.FIXATION:
          drawFixation(ctx, w, h);
          break;
        case TRIAL_PHASE.STIMULUS:
          drawCentralStimulus(ctx, t.targetShape, w, h);
          break;
        case TRIAL_PHASE.MASK:
          drawPatternMask(ctx, w, h, t.maskSeed);
          break;
        case TRIAL_PHASE.RESPONSE: {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.font = '18px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('Which shape did you see?', Math.round(w / 2), Math.round(h * 0.35));
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

      // Trial progress indicator
      if (session) {
        const totalInSession = session.trialsPerBlock * session.totalBlocks;
        const completedInSession = session.currentBlock * session.trialsPerBlock + session.currentTrial;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.font = '12px monospace';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText(
          `${completedInSession + 1}/${totalInSession}`,
          Math.round(w) - 12,
          Math.round(h) - 12,
        );
      }
    };
  }, [engineData, renderRef]);

  /**
   * Submit response during a trial.
   */
  const respond = useCallback((chosenShape) => {
    const trial = trialRef.current;
    if (!trial) return;
    if (submitResponse(trial, chosenShape)) {
      setUiPhase('running');
    }
  }, []);

  /**
   * Resume after inter-block rest (SESS-05).
   */
  const resumeFromRest = useCallback(() => {
    const session = sessionRef.current;
    if (!session) return;
    resumeAfterRest(session);
    startNextTrial();
  }, [startNextTrial]);

  /**
   * Return to idle after viewing results.
   */
  const finishSession = useCallback(() => {
    sessionRef.current = null;
    renderRef.current = null;
    setUiPhase('idle');
  }, [renderRef]);

  return {
    uiPhase,
    startSession,
    respond,
    resumeFromRest,
    finishSession,
    trialRef,
    sessionRef,
    staircaseRef,
    lastTrialData: lastTrialDataRef,
    getStats: () => getStaircaseStats(staircaseRef.current),
    getThreshold: () => calculateThreshold(staircaseRef.current),
    getSessionSummary: () => sessionRef.current ? getSessionSummary(sessionRef.current) : null,
  };
}
