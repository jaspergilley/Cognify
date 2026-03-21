/**
 * TrainingApp Component
 *
 * Manages the training UI flow: start button, response buttons, trial results.
 * Uses useTraining hook for trial lifecycle and staircase integration.
 *
 * @module components/TrainingApp
 */

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
  const { uiPhase, startTrial, respond, trialRef, lastTrialData, trialCount } = training;

  return (
    <>
      {/* Start button — shown when idle */}
      {uiPhase === 'idle' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={startTrial}
            className="px-8 py-4 rounded-xl bg-white/10 hover:bg-white/20
                       border border-white/20 hover:border-white/40
                       text-white text-lg font-light tracking-wide
                       transition-colors cursor-pointer"
          >
            Start Trial
          </button>
        </div>
      )}

      {/* Response buttons — shown during RESPONSE phase */}
      {uiPhase === 'awaiting_response' && trialRef.current && (
        <ResponseButtons
          choices={trialRef.current.choices}
          onChoose={respond}
        />
      )}

      {/* Trial result — shown after trial completes */}
      {uiPhase === 'trial_complete' && lastTrialData.current && (
        <TrialResult
          data={lastTrialData.current}
          stats={training.getStats()}
          threshold={training.getThreshold()}
          trialCount={trialCount.current}
          hz={engineData.current?.hz || 60}
          onNext={startTrial}
        />
      )}
    </>
  );
}

function TrialResult({ data, stats, threshold, trialCount, hz, onNext }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="flex flex-col items-center gap-4 pointer-events-auto
                      bg-black/60 backdrop-blur-sm rounded-2xl px-8 py-6 max-w-sm">
        {/* Result */}
        <div className={`text-2xl font-bold ${data.correct ? 'text-green-400' : 'text-red-400'}`}>
          {data.correct ? 'Correct!' : 'Incorrect'}
        </div>

        {/* Stats */}
        <div className="text-white/60 text-sm space-y-1 text-center">
          <div>RT: {data.reactionTimeMs}ms</div>
          <div>Display: {data.displayFrames} frames ({Math.round(framesToMs(data.displayFrames, hz))}ms)</div>
          <div>Trial {trialCount} &middot; Accuracy: {Math.round(stats.accuracy * 100)}%</div>
          <div>Reversals: {stats.totalReversals} &middot; Threshold: {threshold.threshold} frames</div>
        </div>

        {/* Next trial button */}
        <button
          onClick={onNext}
          className="mt-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20
                     border border-white/20 hover:border-white/40
                     text-white font-light tracking-wide
                     transition-colors cursor-pointer"
        >
          Next Trial
        </button>
      </div>
    </div>
  );
}
