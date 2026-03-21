/**
 * useTraining Hook
 *
 * Manages trial lifecycle, staircase integration, and canvas rendering
 * during training. Sets renderRef on the canvas engine to control
 * what's drawn during active trials.
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
  drawFixation, drawCentralStimulus, drawPatternMask,
} from '../engine/stimulusRenderer.js';
import { SHAPE_IDS } from '../engine/shapePaths.js';

/**
 * Pick two distinct random shapes from the shape pool.
 * @returns {{ target: string, alternative: string }}
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
 * @param {React.RefObject} engineData - Engine data ref from useCanvasEngine
 * @param {React.RefObject} renderRef - Render callback ref from useCanvasEngine
 */
export function useTraining(engineData, renderRef) {
  // UI phase drives which overlay is shown
  const [uiPhase, setUiPhase] = useState('idle');
  // 'idle' | 'running' | 'awaiting_response' | 'trial_complete'

  const trialRef = useRef(null);
  const staircaseRef = useRef(createStaircase(15));
  const lastTrialDataRef = useRef(null);
  const trialCountRef = useRef(0);

  const startTrial = useCallback(() => {
    const hz = engineData.current?.hz || 60;
    const staircase = staircaseRef.current;
    const { target, alternative } = pickShapePair();

    const trial = createTrial({
      targetShape: target,
      alternativeShape: alternative,
      displayFrames: staircase.displayTime,
      hz,
    });

    trialRef.current = trial;
    setUiPhase('running');

    // Set the render callback — called every frame by the canvas engine
    renderRef.current = (ctx, w, h) => {
      const t = trialRef.current;
      if (!t) return;

      const prevPhase = t.phase;
      tickTrial(t);

      // Detect phase transitions that need React state updates
      if (t.phase !== prevPhase) {
        if (t.phase === TRIAL_PHASE.RESPONSE) {
          setUiPhase('awaiting_response');
        }
        if (t.phase === TRIAL_PHASE.COMPLETE) {
          const data = getTrialData(t);
          lastTrialDataRef.current = data;
          staircaseRef.current = updateStaircase(staircaseRef.current, data.correct);
          trialCountRef.current++;
          trialRef.current = null;
          renderRef.current = null;
          setUiPhase('trial_complete');
        }
      }

      // Render based on current phase
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

        case TRIAL_PHASE.RESPONSE:
          // Subtle canvas prompt; actual buttons are HTML overlay
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.font = '18px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('Which shape did you see?', Math.round(w / 2), Math.round(h * 0.35));
          break;

        case TRIAL_PHASE.FEEDBACK: {
          // TRAL-05/06: Green for correct, red for incorrect
          const color = t.correct ? '#22c55e' : '#ef4444';
          const symbol = t.correct ? '\u2713' : '\u2717';
          ctx.fillStyle = color;
          ctx.font = 'bold 72px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(symbol, Math.round(w / 2), Math.round(h / 2));
          break;
        }

        // ITI and COMPLETE: blank canvas (already cleared by engine)
        default:
          break;
      }
    };
  }, [engineData, renderRef]);

  const respond = useCallback((chosenShape) => {
    const trial = trialRef.current;
    if (!trial) return;
    if (submitResponse(trial, chosenShape)) {
      setUiPhase('running'); // feedback + ITI are auto-timed
    }
  }, []);

  return {
    uiPhase,
    startTrial,
    respond,
    trialRef,
    staircaseRef,
    lastTrialData: lastTrialDataRef,
    trialCount: trialCountRef,
    getStats: () => getStaircaseStats(staircaseRef.current),
    getThreshold: () => calculateThreshold(staircaseRef.current),
  };
}
