/**
 * TrainingApp Component
 *
 * Manages training UI: start screen, response buttons, inter-block rest,
 * and post-session results. Orchestrates the full Exercise 1 flow.
 *
 * @module components/TrainingApp
 */

import { useState, useEffect, useRef } from 'react';
import { useTraining } from '../hooks/useTraining.js';
import { ResponseButtons } from './ResponseButtons.jsx';
import { framesToMs } from '../engine/stimulusRenderer.js';

/**
 * @param {object} props
 * @param {React.RefObject} props.engineData - Engine data ref
 * @param {React.RefObject} props.renderRef - Render callback ref
 */
export function TrainingApp({ engineData, renderRef }) {
  const training = useTraining(engineData, renderRef);
  const {
    uiPhase, startSession, respond, resumeFromRest, finishSession,
    trialRef, sessionRef, staircaseRef,
  } = training;

  return (
    <>
      {/* Start screen */}
      {uiPhase === 'idle' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
          <div className="text-white/40 text-sm font-light tracking-wider">
            COGSPEED
          </div>
          <button
            onClick={startSession}
            className="px-8 py-4 rounded-xl bg-white/10 hover:bg-white/20
                       border border-white/20 hover:border-white/40
                       text-white text-lg font-light tracking-wide
                       transition-colors cursor-pointer"
          >
            Start Training
          </button>
          <div className="text-white/20 text-xs">
            2 blocks &middot; 30 trials each
          </div>
        </div>
      )}

      {/* Response buttons during RESPONSE phase */}
      {uiPhase === 'awaiting_response' && trialRef.current && (
        <ResponseButtons
          choices={trialRef.current.choices}
          onChoose={respond}
        />
      )}

      {/* Inter-block rest screen (SESS-05) */}
      {uiPhase === 'inter_block' && sessionRef.current && (
        <RestScreen
          block={sessionRef.current.currentBlock}
          totalBlocks={sessionRef.current.totalBlocks}
          restMs={sessionRef.current.restMs}
          onResume={resumeFromRest}
        />
      )}

      {/* Post-session results (SESS-07) */}
      {uiPhase === 'post_session' && (
        <PostSessionScreen
          summary={training.getSessionSummary()}
          threshold={training.getThreshold()}
          stats={training.getStats()}
          hz={engineData.current?.hz || 60}
          onFinish={finishSession}
        />
      )}
    </>
  );
}

/**
 * Inter-block rest screen with countdown (SESS-05).
 */
function RestScreen({ block, totalBlocks, restMs, onResume }) {
  const [remaining, setRemaining] = useState(Math.ceil(restMs / 1000));
  const [canContinue, setCanContinue] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    const start = Date.now();
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const left = Math.max(0, Math.ceil((restMs - elapsed) / 1000));
      setRemaining(left);
      if (left <= 0) {
        setCanContinue(true);
        clearInterval(intervalRef.current);
      }
    }, 250);

    return () => clearInterval(intervalRef.current);
  }, [restMs]);

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="flex flex-col items-center gap-6 pointer-events-auto
                      bg-black/60 backdrop-blur-sm rounded-2xl px-10 py-8 max-w-sm">
        <div className="text-white/60 text-sm font-light tracking-wider">
          BLOCK {block} OF {totalBlocks} COMPLETE
        </div>

        <div className="text-white text-lg font-light">
          Take a break
        </div>

        {!canContinue ? (
          <div className="text-white/40 text-4xl font-light tabular-nums">
            {remaining}s
          </div>
        ) : (
          <button
            onClick={onResume}
            className="px-8 py-3 rounded-xl bg-white/10 hover:bg-white/20
                       border border-white/20 hover:border-white/40
                       text-white font-light tracking-wide
                       transition-colors cursor-pointer"
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Post-session results screen (SESS-07).
 */
function PostSessionScreen({ summary, threshold, stats, hz, onFinish }) {
  if (!summary) return null;

  const thresholdMs = Math.round(framesToMs(threshold.threshold, hz));
  const durationMin = Math.round(summary.durationMs / 1000 / 60 * 10) / 10;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="flex flex-col items-center gap-5 pointer-events-auto
                      bg-black/60 backdrop-blur-sm rounded-2xl px-10 py-8 max-w-md">
        <div className="text-white/60 text-sm font-light tracking-wider">
          SESSION COMPLETE
        </div>

        {/* Main metric */}
        <div className="text-center">
          <div className="text-white text-4xl font-light">
            {threshold.threshold} <span className="text-lg text-white/40">frames</span>
          </div>
          <div className="text-white/40 text-sm mt-1">
            {thresholdMs}ms processing speed threshold
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
          <Stat label="Accuracy" value={`${Math.round(summary.accuracy * 100)}%`} />
          <Stat label="Avg RT" value={`${summary.averageRtMs}ms`} />
          <Stat label="Trials" value={`${summary.totalTrials}`} />
          <Stat label="Duration" value={`${durationMin}min`} />
          <Stat label="Reversals" value={`${stats.totalReversals}`} />
          <Stat label="Method" value={threshold.method === 'reversal' ? 'Standard' : 'Fallback'} />
        </div>

        <button
          onClick={onFinish}
          className="mt-2 px-8 py-3 rounded-xl bg-white/10 hover:bg-white/20
                     border border-white/20 hover:border-white/40
                     text-white font-light tracking-wide
                     transition-colors cursor-pointer"
        >
          Done
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <>
      <div className="text-white/40 text-right">{label}</div>
      <div className="text-white font-light">{value}</div>
    </>
  );
}
