/**
 * TrainingApp Component
 *
 * Full training UI: exercise selection, response buttons (shape + location),
 * inter-block rest, abort dialog, and post-session results for both Exercise 1 and 2.
 *
 * @module components/TrainingApp
 */

import { useState, useEffect, useRef } from 'react';
import { useTraining } from '../hooks/useTraining.js';
import { ResponseButtons } from './ResponseButtons.jsx';
import { PeripheralResponse } from './PeripheralResponse.jsx';
import { Dashboard } from './Dashboard.jsx';
import { framesToMs } from '../engine/stimulusRenderer.js';
import { getBestThreshold, getLatestThreshold, getCompletedSessionCount, loadBadges, addBadge, loadSettings } from '../services/dataService.js';
import { evaluateBadges, detectNewBadges, BADGE_DEFINITIONS } from '../engine/badgeEngine.js';
import { UNLOCK_THRESHOLDS } from '../engine/gameConfig.js';
import { getBetweenBlockMessage, getPersonalizedImpactMessage, getEncouragement, randomFactIndex } from '../engine/scienceContent.js';
import { TopAppBar } from './dashboard/TopAppBar.jsx';
import { BottomNav } from './dashboard/BottomNav.jsx';
import { useTranslation } from '../i18n/index.jsx';

export function TrainingApp({ engineData, renderRef }) {
  const { t } = useTranslation();
  const training = useTraining(engineData, renderRef);
  const {
    uiPhase, beginTraining, startSessionWithType, respondShape, respondLocation,
    resumeFromRest, finishSession, trialRef, sessionRef, ex2Available, ex3Available, devUnlock,
    abortRequested, requestAbort, cancelAbort, confirmAbort, abortRequestedRef,
    paused, togglePause, resumeGame,
    completeOnboarding, skipOnboarding,
    getStats,
  } = training;

  const [returnTab, setReturnTab] = useState('home');

  // Escape key → request abort (2B)
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') {
        const phase = uiPhase;
        if (phase === 'running' || phase === 'awaiting_shape_response' ||
            phase === 'awaiting_location_response' || phase === 'pre_session' ||
            phase === 'pre_trial') {
          if (abortRequestedRef.current) {
            cancelAbort();
          } else {
            requestAbort();
          }
        }
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [uiPhase, requestAbort, cancelAbort, abortRequestedRef]);

  return (
    <>
      {/* ARIA live region for phase announcements */}
      <div aria-live="polite" className="sr-only">
        {uiPhase === 'idle' && 'Dashboard loaded'}
        {uiPhase === 'running' && 'Training in progress'}
        {uiPhase === 'inter_block' && 'Rest break'}
        {uiPhase === 'post_session' && 'Session complete'}
      </div>

      {/* Dashboard (replaces idle screen) */}
      {uiPhase === 'idle' && (
        <Dashboard
          onStartSession={startSessionWithType}
          ex2Available={ex2Available}
          ex3Available={ex3Available}
          devUnlock={devUnlock}
          hz={engineData.current?.hz || 60}
          defaultTab={returnTab}
        />
      )}

      {/* Onboarding */}
      {uiPhase === 'onboarding' && (
        <Onboarding
          onStart={(type) => { completeOnboarding(); startSessionWithType(type); }}
          onSkip={skipOnboarding}
        />
      )}

      {/* Exercise selection (when Exercise 2 is available) */}
      {uiPhase === 'exercise_select' && (
        <ExerciseSelect
          onSelect={startSessionWithType}
          devUnlock={devUnlock}
          ex3Available={ex3Available}
        />
      )}

      {/* Shape response buttons */}
      {uiPhase === 'awaiting_shape_response' && trialRef.current && (
        <ResponseButtons
          choices={trialRef.current.choices}
          onChoose={respondShape}
          disabled={abortRequested}
        />
      )}

      {/* Peripheral location response (Exercise 2) */}
      {uiPhase === 'awaiting_location_response' && trialRef.current && (
        <PeripheralResponse onChoose={respondLocation} eccentricity={trialRef.current?.eccentricity} />
      )}

      {/* In-session header bar — visible during ALL active session phases */}
      {(uiPhase === 'running' || uiPhase === 'pre_session' || uiPhase === 'pre_trial' ||
        uiPhase === 'awaiting_shape_response' || uiPhase === 'awaiting_location_response' ||
        uiPhase === 'inter_block') && !abortRequested && !paused && (() => {
        const s = sessionRef.current;
        const hz = engineData?.current?.hz || 60;
        const ds = getStats();
        const thresholdMs = ds.currentDisplayTime ? Math.round((ds.currentDisplayTime / hz) * 1000) : 0;
        const totalTrials = s ? s.trialsPerBlock * s.totalBlocks : 1;
        const doneSoFar = s ? s.currentBlock * s.trialsPerBlock + Math.min(s.currentTrial, s.trialsPerBlock) : 0;
        const progressPct = Math.min(Math.round((doneSoFar / totalTrials) * 100), 100);
        return (
          <>
            <header className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-6 h-20 safe-top safe-inset
                               bg-background border-b border-primary/10
                               shadow-[0_4px_20px_rgba(46,50,48,0.06)]">
              <button
                onClick={requestAbort}
                aria-label="Quit session"
                className="p-3 min-w-12 min-h-12 rounded-full hover:bg-surface-container-high transition-colors active:scale-95 duration-150 cursor-pointer flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-on-surface-variant text-2xl">close</span>
              </button>
              <span className="font-headline font-bold text-xl text-primary tracking-tight italic">
                {s?.exerciseType === 2 ? t('training.dividedAttention') :
                 s?.exerciseType === 3 ? t('training.selectiveAttention') :
                 t('training.centralId')}
              </span>
              <div className="flex items-center gap-3">
                {s && (
                  <span className="font-label font-semibold tracking-wide text-primary tabular-nums">
                    Trial {Math.min((s.currentTrial || 0) + 1, s.trialsPerBlock || 0)}/{s.trialsPerBlock || 0}
                    {thresholdMs > 0 && <span className="text-on-surface-variant font-normal"> · ~{thresholdMs}ms</span>}
                  </span>
                )}
                <button
                  onClick={togglePause}
                  aria-label="Pause session"
                  className="p-3 min-w-12 min-h-12 rounded-full hover:bg-surface-container-high transition-colors active:scale-95 duration-150 cursor-pointer flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-primary text-2xl">pause_circle</span>
                </button>
              </div>
            </header>
            {/* Persistent progress bar below header */}
            <div className="fixed top-20 left-0 w-full z-50 h-1 bg-surface-container safe-top">
              <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progressPct}%` }} />
            </div>
          </>
        );
      })()}

      {/* Pre-session countdown overlay */}
      {uiPhase === 'pre_session' && !abortRequested && !paused && (
        <PreSessionOverlay />
      )}

      {/* Pause overlay */}
      {paused && !abortRequested && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-inverse-surface/70 px-4">
          <div className="flex flex-col items-center gap-6 bg-surface-container-lowest rounded-xl px-8 py-8 shadow-xl animate-scale-in max-w-sm w-full">
            <span className="material-symbols-outlined text-primary text-5xl">pause_circle</span>
            <h3 className="font-headline text-2xl font-bold text-on-surface tracking-wide">PAUSED</h3>
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button
                onClick={resumeGame}
                className="flex-1 py-4 rounded-xl bg-primary text-on-primary font-bold text-lg
                           active:scale-95 transition-transform duration-200 cursor-pointer
                           shadow-[0_4px_20px_rgba(74,124,89,0.2)]"
              >
                Resume
              </button>
              <button
                onClick={() => { resumeGame(); requestAbort(); }}
                className="flex-1 py-4 rounded-xl bg-surface-container-high text-on-surface-variant font-bold text-lg
                           border border-outline-variant/30 hover:bg-surface-container-highest
                           active:scale-95 transition-all duration-200 cursor-pointer"
              >
                Quit Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Abort confirmation dialog (2B) */}
      {abortRequested && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-inverse-surface/60 px-4">
          <div className="flex flex-col items-center gap-6 bg-surface-container-lowest rounded-xl px-8 py-8 shadow-xl animate-scale-in max-w-sm w-full">
            <span className="material-symbols-outlined text-error text-5xl">warning</span>
            <h3 className="font-headline text-2xl font-bold text-on-surface">{t('trial.exitConfirm').split('?')[0]}?</h3>
            <p className="text-on-surface-variant text-lg text-center">
              {t('trial.exitConfirm')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button
                onClick={cancelAbort}
                className="flex-1 py-4 rounded-xl bg-primary text-on-primary font-bold text-lg
                           active:scale-95 transition-transform duration-200 cursor-pointer
                           shadow-[0_4px_20px_rgba(74,124,89,0.2)]"
              >
                {t('trial.keepGoing')}
              </button>
              <button
                onClick={confirmAbort}
                className="flex-1 py-4 rounded-xl bg-error-container text-on-error-container font-bold text-lg
                           border border-error/20
                           active:scale-95 transition-all duration-200 cursor-pointer"
              >
                {t('trial.endSession')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inter-block rest */}
      {uiPhase === 'inter_block' && sessionRef.current && (
        <RestScreen
          block={sessionRef.current.currentBlock}
          totalBlocks={sessionRef.current.totalBlocks}
          restMs={sessionRef.current.restMs}
          session={sessionRef.current}
          onResume={resumeFromRest}
          onFinishEarly={confirmAbort}
        />
      )}

      {/* Post-session results */}
      {uiPhase === 'post_session' && (
        <PostSessionScreen
          summary={training.getSessionSummary()}
          threshold={training.getThreshold()}
          stats={training.getStats()}
          hz={engineData.current?.hz || 60}
          exerciseType={sessionRef.current?.exerciseType || 1}
          onFinish={() => { setReturnTab('home'); finishSession(); }}
          onViewHistory={() => { setReturnTab('progress'); finishSession(); }}
        />
      )}
    </>
  );
}

function Onboarding({ onStart, onSkip }) {
  const [step, setStep] = useState(0);
  const totalSteps = 4;

  const steps = [
    // Step 0: Welcome
    <div key="welcome" className="flex flex-col items-center gap-6 text-center">
      {/* Illustration area */}
      <div className="w-full aspect-square max-w-md bg-surface-container rounded-xl flex items-center justify-center relative overflow-hidden mb-10 shadow-[0_4px_20px_rgba(46,50,48,0.06)]">
        <div className="absolute -top-12 -left-12 w-64 h-64 bg-primary-container/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-tertiary-container/20 rounded-full blur-3xl" />
        <span className="material-symbols-outlined text-primary relative z-10" style={{ fontSize: '140px', fontVariationSettings: "'FILL' 1" }}>neurology</span>
      </div>
      <div className="text-center space-y-6">
        <h2 className="font-headline text-4xl md:text-5xl font-bold text-on-surface tracking-tight leading-tight">
          Welcome to CogSpeed
        </h2>
        <p className="font-body text-lg md:text-xl text-on-surface-variant leading-relaxed max-w-lg mx-auto">
          Train your brain in just 10 minutes a day to improve your speed and focus.
        </p>
      </div>
    </div>,

    // Step 1: How It Works
    <div key="how" className="flex flex-col items-center gap-6">
      <h2 className="font-headline text-3xl font-bold text-on-surface text-center">How It Works</h2>
      <div className="flex items-center gap-4">
        {[
          { icon: 'add', label: 'Focus', desc: 'Cross appears' },
          { icon: 'visibility', label: 'See', desc: 'Shape flashes' },
          { icon: 'touch_app', label: 'Choose', desc: 'Pick the shape' },
        ].map((s) => (
          <div key={s.label} className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-xl bg-surface-container-high border border-outline-variant/20
                            flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-2xl">{s.icon}</span>
            </div>
            <span className="text-on-surface text-sm font-bold">{s.label}</span>
            <span className="text-on-surface-variant text-xs font-medium max-w-[80px] text-center">{s.desc}</span>
          </div>
        ))}
      </div>
      <p className="text-on-surface-variant text-base text-center max-w-xs leading-relaxed">
        Get 3 correct in a row and the display gets faster. The app adapts to find your speed.
      </p>
    </div>,

    // Step 2: Baseline Assessment
    <div key="baseline" className="flex flex-col items-center gap-6 text-center">
      <div className="relative w-52 h-52 flex items-center justify-center">
        <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl" />
        <div className="relative z-10 w-40 h-40 bg-surface-container-lowest rounded-full shadow-lg flex items-center justify-center border-4 border-primary-fixed">
          <div className="flex flex-col items-center text-primary">
            <span className="material-symbols-outlined" style={{ fontSize: '72px' }}>timer</span>
            <div className="mt-2 h-1.5 w-12 bg-tertiary-container rounded-full overflow-hidden">
              <div className="h-full bg-primary w-2/3" />
            </div>
          </div>
        </div>
        <div className="absolute -top-3 -right-1 bg-tertiary text-on-tertiary px-3 py-1 rounded-full text-sm font-bold shadow-md">
          1 Minute
        </div>
      </div>
      <h2 className="font-headline text-3xl font-bold text-on-surface leading-tight">Quick Check-In</h2>
      <p className="font-body text-lg text-on-surface-variant leading-relaxed max-w-sm">
        To give you the best experience, we'll start with a 1-minute baseline test. This helps us find the "just right" speed for you.
      </p>
    </div>,

    // Step 3: Ready
    <div key="ready" className="flex flex-col items-center gap-6">
      <span className="material-symbols-outlined text-primary text-6xl" style={{ fontVariationSettings: "'FILL' 1" }}>rocket_launch</span>
      <h2 className="font-headline text-3xl font-bold text-on-surface text-center">Ready to Start</h2>
      <ul className="text-on-surface text-lg space-y-4 self-start font-medium w-full">
        {[
          'Each session has 60 trials in 2 blocks',
          'Takes about 5 minutes to complete',
          'Train regularly for best results',
        ].map((text) => (
          <li key={text} className="flex items-start gap-3">
            <span className="material-symbols-outlined text-primary text-xl mt-0.5">check_circle</span>
            <span>{text}</span>
          </li>
        ))}
      </ul>
    </div>,
  ];

  return (
    <div className="absolute inset-0 flex flex-col bg-background safe-inset">
      {/* Top App Bar */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 h-20 safe-top safe-inset bg-background border-b border-primary/10 shadow-[0_4px_20px_rgba(46,50,48,0.06)]">
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-full hover:bg-primary/5 transition-colors active:scale-95 duration-200">
            <span className="material-symbols-outlined text-primary text-2xl">menu</span>
          </button>
          <h1 className="font-headline text-2xl font-bold tracking-tight text-primary">CogSpeed</h1>
        </div>
        <button className="p-2 rounded-full hover:bg-primary/5 transition-colors active:scale-95 duration-200">
          <span className="material-symbols-outlined text-primary text-2xl">help</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center pt-24 pb-12 px-6 max-w-2xl mx-auto w-full safe-bottom animate-in">
        {steps[step]}

        {/* Progress Dots */}
        <div className="flex gap-3 my-10">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <span
              key={i}
              className={`w-3 h-3 rounded-full transition-colors ${
                i === step ? 'bg-primary' : 'bg-outline-variant'
              }`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="w-full max-w-sm mt-auto">
          {step === 2 ? (
            /* Baseline Assessment step — special buttons */
            <>
              <button
                onClick={() => onStart(1)}
                className="w-full py-5 bg-primary text-on-primary font-body text-xl font-bold rounded-xl shadow-lg
                           active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer
                           shadow-[0_8px_30px_rgba(74,124,89,0.3)]"
              >
                Start Baseline Test
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
              </button>
              <button
                onClick={() => setStep(step + 1)}
                className="w-full mt-4 py-3 text-primary font-body text-base font-semibold
                           hover:bg-primary/5 rounded-lg transition-colors cursor-pointer"
              >
                Skip for now
              </button>
            </>
          ) : step < totalSteps - 1 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="w-full py-5 bg-primary text-on-primary font-body text-xl font-bold rounded-xl shadow-lg
                         active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
            >
              Next
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          ) : (
            <button
              onClick={() => onStart(1)}
              className="w-full py-5 bg-primary text-on-primary font-body text-xl font-bold rounded-xl shadow-lg
                         active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer
                         shadow-[0_8px_30px_rgba(74,124,89,0.3)]"
            >
              Start Training
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
            </button>
          )}
          {step === 0 && (
            <button
              onClick={onSkip}
              className="w-full mt-4 py-3 text-primary font-body text-base font-semibold
                         hover:bg-primary/5 rounded-lg transition-colors cursor-pointer"
            >
              Skip Introduction
            </button>
          )}
          {step > 0 && step !== 2 && (
            <button
              onClick={() => setStep(step - 1)}
              className="w-full mt-4 py-3 text-on-surface-variant font-body text-base font-semibold
                         hover:bg-surface-container-high rounded-lg transition-colors cursor-pointer"
            >
              Back
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

function ExerciseSelect({ onSelect, devUnlock, ex3Available }) {
  const ex3Unlocked = ex3Available || devUnlock;

  return (
    <div className="absolute inset-0 flex flex-col bg-background safe-inset">
      {/* Top App Bar */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 h-20 safe-top safe-inset
                          bg-background border-b border-primary/10
                          shadow-[0_4px_20px_rgba(46,50,48,0.06)]">
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-full hover:bg-primary/5 transition-colors active:scale-95 duration-200" aria-label="Menu">
            <span className="material-symbols-outlined text-primary text-2xl">menu</span>
          </button>
          <h1 className="font-headline text-2xl font-bold tracking-tight text-primary">CogSpeed</h1>
        </div>
        <button className="p-2 rounded-full hover:bg-primary/5 transition-colors active:scale-95 duration-200" aria-label="Help">
          <span className="material-symbols-outlined text-primary text-2xl">help</span>
        </button>
      </header>

      <main className="flex-grow overflow-y-auto pt-24 px-6 pb-32 safe-bottom max-w-2xl mx-auto w-full">
        {/* Header */}
        <div className="mt-8 mb-10">
          <h2 className="font-headline text-3xl font-bold text-on-surface mb-2 leading-tight">Training Mode</h2>
          <p className="text-on-surface-variant text-lg leading-relaxed">
            Select an exercise to begin your daily cognitive training. Focus and maintain accuracy.
          </p>
        </div>

        {/* Exercise Cards */}
        <div className="space-y-6">
          {/* Exercise 1 — Center Target */}
          <button
            onClick={() => onSelect(1)}
            className="w-full text-left bg-surface-container-low rounded-xl p-6
                       shadow-[0_4px_20px_rgba(46,50,48,0.06)] border border-outline-variant/20
                       hover:bg-surface-container transition-all active:scale-[0.98] group cursor-pointer"
          >
            <div className="flex gap-6 items-center">
              <div className="w-28 h-28 bg-surface-container-highest rounded-xl flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                <div className="w-10 h-10 bg-primary rounded-lg" />
                <div className="absolute inset-0 border-2 border-primary/10 rounded-xl" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-tertiary font-bold text-sm tracking-widest uppercase font-label">Unlocked</span>
                  <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                </div>
                <h3 className="text-xl font-bold text-on-surface mb-2 leading-tight">Exercise 1: Center Target</h3>
                <p className="text-on-surface-variant text-base">Focus on the shape in the middle. React as soon as it appears.</p>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-center w-full py-3 bg-primary text-on-primary rounded-lg font-bold group-hover:bg-primary-fixed-dim transition-colors">
              Start Exercise
            </div>
          </button>

          {/* Exercise 2 — Peripheral Target */}
          <button
            onClick={() => onSelect(2)}
            className="w-full text-left bg-surface-container-low rounded-xl p-6
                       shadow-[0_4px_20px_rgba(46,50,48,0.06)] border border-outline-variant/20
                       hover:bg-surface-container transition-all active:scale-[0.98] group cursor-pointer"
          >
            <div className="flex gap-6 items-center">
              <div className="relative w-28 h-28 bg-surface-container-highest rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                <div className="w-6 h-6 bg-primary/40 rounded-sm" />
                <div className="absolute top-4 right-4 w-6 h-6 bg-primary rounded-full" />
                <div className="absolute inset-0 border-2 border-primary/10 rounded-xl" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-on-surface-variant font-bold text-sm tracking-widest uppercase font-label">
                    {devUnlock ? 'DEV UNLOCK' : 'Ready'}
                  </span>
                  <span className="material-symbols-outlined text-outline text-xl">lock_open</span>
                </div>
                <h3 className="text-xl font-bold text-on-surface mb-2 leading-tight">Exercise 2: Peripheral Target</h3>
                <p className="text-on-surface-variant text-base">Watch the center while looking for shapes at the edges.</p>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-center w-full py-3 bg-primary text-on-primary rounded-lg font-bold group-hover:bg-primary-fixed-dim transition-colors">
              Start Exercise
            </div>
          </button>

          {/* Exercise 3 — Tracking */}
          {ex3Unlocked ? (
            <button
              onClick={() => onSelect(3)}
              className="w-full text-left bg-surface-container-low rounded-xl p-6
                         shadow-[0_4px_20px_rgba(46,50,48,0.06)] border border-outline-variant/20
                         hover:bg-surface-container transition-all active:scale-[0.98] group cursor-pointer"
            >
              <div className="flex gap-6 items-center">
                <div className="w-28 h-28 bg-surface-container-highest rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-primary text-4xl">filter_center_focus</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`font-bold text-sm tracking-widest uppercase font-label ${devUnlock && !ex3Available ? 'text-tertiary' : 'text-tertiary'}`}>
                      {devUnlock && !ex3Available ? 'DEV UNLOCK' : 'Unlocked'}
                    </span>
                    <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  </div>
                  <h3 className="text-xl font-bold text-on-surface mb-2 leading-tight">Exercise 3: Tracking</h3>
                  <p className="text-on-surface-variant text-base">Focused attention with peripheral distractors.</p>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-center w-full py-3 bg-primary text-on-primary rounded-lg font-bold group-hover:bg-primary-fixed-dim transition-colors">
                Start Exercise
              </div>
            </button>
          ) : (
            <div className="w-full text-left bg-surface-container-lowest/50 rounded-xl p-6 border border-dashed border-outline-variant/40 opacity-70">
              <div className="flex gap-6 items-center">
                <div className="w-28 h-28 bg-surface-dim rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-outline text-4xl">lock</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="mb-1">
                    <span className="text-outline font-bold text-sm tracking-widest uppercase font-label">Locked</span>
                  </div>
                  <h3 className="text-xl font-bold text-on-surface mb-2 leading-tight">Exercise 3: Tracking</h3>
                  <p className="text-on-surface-variant text-base">Complete daily goals to unlock more cognitive challenges.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Daily Tip */}
        <div className="mt-10 bg-tertiary-fixed rounded-xl p-6 flex gap-4 items-start border border-tertiary/20">
          <div className="bg-tertiary text-on-tertiary p-2 rounded-lg shrink-0">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>lightbulb</span>
          </div>
          <div>
            <p className="text-on-tertiary-container font-bold mb-1">Daily Tip</p>
            <p className="text-on-tertiary-container/80 text-sm leading-relaxed">Consistent practice is key. Just 10 minutes a day can improve your reaction time significantly.</p>
          </div>
        </div>
      </main>
      <BottomNav activeTab="home" onTabChange={() => {}} />
    </div>
  );
}

function RestScreen({ block, totalBlocks, restMs, session, onResume, onFinishEarly }) {
  const { t } = useTranslation();
  const [remaining, setRemaining] = useState(Math.ceil(restMs / 1000));
  const [progress, setProgress] = useState(0);
  const [canContinue, setCanContinue] = useState(false);
  const [blockMsgIndex] = useState(() => Math.floor(Math.random() * 4));
  const intervalRef = useRef(null);

  useEffect(() => {
    const start = Date.now();
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const left = Math.max(0, Math.ceil((restMs - elapsed) / 1000));
      setRemaining(left);
      setProgress(Math.min(elapsed / restMs, 1));
      if (left <= 0) {
        setCanContinue(true);
        setProgress(1);
        clearInterval(intervalRef.current);
      }
    }, 100);
    return () => clearInterval(intervalRef.current);
  }, [restMs]);

  const sessionStats = (() => {
    if (!session || !session.trials || session.trials.length === 0) return null;
    const trials = session.trials;
    const blockTrials = trials.slice(-session.trialsPerBlock);
    const blockCorrect = blockTrials.filter((t) => t.correct).length;
    const blockAcc = Math.round((blockCorrect / blockTrials.length) * 100);
    const totalCorrect = trials.filter((t) => t.correct).length;
    const totalAcc = Math.round((totalCorrect / trials.length) * 100);
    return { blockCorrect, blockTrials: blockTrials.length, blockAcc, totalAcc };
  })();

  const r = 110;
  const circumference = 2 * Math.PI * r;

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background px-8 pt-24 safe-inset safe-bottom animate-in">
      {/* Status badge */}
      <div className="text-center mb-8">
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-semibold text-sm mb-4">
          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>timer</span>
          Resting...
        </span>
        <h1 className="text-4xl font-headline font-bold text-on-surface leading-tight">
          Block {block} of {totalBlocks} Complete
        </h1>
        <p className="text-on-surface-variant mt-2 text-lg">Take a moment to breathe deeply.</p>
      </div>

      {/* Large circular countdown */}
      <div className="relative flex items-center justify-center mb-12">
        <svg className="w-64 h-64 -rotate-90">
          <circle cx="128" cy="128" r={r} fill="transparent" stroke="currentColor"
                  strokeWidth="12" className="text-surface-container-highest" />
          <circle cx="128" cy="128" r={r} fill="transparent" stroke="currentColor"
                  strokeWidth="12" strokeLinecap="round" className="text-primary"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - progress)} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-6xl font-headline font-bold text-primary tabular-nums">{remaining}</span>
          <span className="text-sm font-label font-bold text-on-surface-variant uppercase tracking-widest mt-1">Seconds</span>
        </div>
      </div>

      {/* Performance summary card */}
      {sessionStats && (
        <div className="w-full max-w-sm bg-surface-container-low rounded-xl p-6
                        shadow-[0_4px_20px_rgba(46,50,48,0.06)] border border-outline-variant/20 mb-10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-label font-semibold text-on-surface-variant">Your Score</p>
              <p className="text-3xl font-headline font-bold text-on-surface">
                {sessionStats.blockCorrect}/{sessionStats.blockTrials} Correct
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-primary-container/20 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-outline-variant/30 flex justify-between items-center">
            <span className="text-sm text-on-surface-variant">Accuracy: {sessionStats.blockAcc}%</span>
            <span className="text-sm text-on-surface-variant">Overall: {sessionStats.totalAcc}%</span>
          </div>
        </div>
      )}

      {/* Between-block research fact */}
      <div className="w-full max-w-sm bg-tertiary-fixed rounded-xl p-5 border border-tertiary/20 mb-8">
        <p className="text-on-tertiary-container font-bold text-sm mb-2">{getBetweenBlockMessage(t, blockMsgIndex).encouragement}</p>
        <p className="text-on-tertiary-container/80 text-xs leading-relaxed">{getBetweenBlockMessage(t, blockMsgIndex).fact}</p>
        <p className="text-on-tertiary-container/60 text-xs mt-1 italic">{getBetweenBlockMessage(t, blockMsgIndex).source}</p>
      </div>

      {/* Resume button */}
      <button
        onClick={canContinue ? onResume : undefined}
        disabled={!canContinue}
        className={`w-full max-w-sm py-5 rounded-xl text-xl font-bold flex items-center justify-center gap-3
                    active:scale-95 duration-150 cursor-pointer shadow-lg shadow-primary/20 transition-all
                    ${canContinue
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container-high text-on-surface-variant cursor-not-allowed opacity-60'}`}
      >
        <span className="material-symbols-outlined">play_arrow</span>
        Resume Now
      </button>

      {/* Finish early link */}
      <button
        onClick={onFinishEarly}
        className="mt-6 text-primary font-bold text-lg hover:underline decoration-2 underline-offset-4 cursor-pointer"
      >
        Finish Training Early
      </button>
    </div>
  );
}

function PostSessionScreen({ summary, threshold, stats, hz, exerciseType, onFinish, onViewHistory }) {
  const { t } = useTranslation();
  if (!summary) return null;

  const thresholdMs = Math.round(framesToMs(threshold.threshold, hz));
  const durationMin = Math.round(summary.durationMs / 1000 / 60 * 10) / 10;

  const best = getBestThreshold(exerciseType, hz);
  const isPersonalBest = best && threshold.threshold <= best.thresholdFrames;
  const prev = getLatestThreshold(exerciseType, hz);
  const improvement = prev && prev.direction === 'improved'
    ? Math.round(((prev.thresholdMs - thresholdMs) / prev.thresholdMs) * 100) || null
    : null;

  // Badge evaluation
  const totalSessions = getCompletedSessionCount(1) + getCompletedSessionCount(2) + getCompletedSessionCount(3);
  const bestEx1 = getBestThreshold(1, hz);
  const bestEx2 = getBestThreshold(2, hz);
  const settings = loadSettings();
  const badgeStats = {
    totalSessions,
    ex2Unlocked: bestEx1 && bestEx1.thresholdMs <= UNLOCK_THRESHOLDS[2],
    ex3Unlocked: bestEx2 && bestEx2.thresholdMs <= UNLOCK_THRESHOLDS[3],
    bestThresholdMs: best?.thresholdMs ?? null,
    hitWeeklyGoal: false, // TODO: compute from weekly streak data
  };
  const previousBadges = loadBadges();
  const newBadges = detectNewBadges(previousBadges, badgeStats);
  // Persist newly earned badges
  if (newBadges.length > 0) {
    newBadges.forEach((id) => addBadge(id));
  }

  return (
    <div className="absolute inset-0 flex flex-col bg-background overflow-y-auto safe-inset animate-in">
      <TopAppBar devUnlock={false} onOpenSettings={() => {}} onOpenWhatsNew={() => {}} />

      <main className="max-w-xl mx-auto px-6 pt-28 pb-32 safe-bottom w-full">
        {/* Celebration section */}
        <div className="text-center mt-4 mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-container/20 rounded-full mb-6">
            <span className="material-symbols-outlined text-primary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-headline font-bold text-on-surface mb-4">{t('summary.sessionComplete')}</h1>
          <p className="text-xl text-on-surface-variant font-body">
            {isPersonalBest ? 'New Personal Best! Keep pushing!' : 'Great job! You are getting faster.'}
          </p>
        </div>

        {/* Personal best badge */}
        {isPersonalBest && (
          <div className="flex justify-center mb-8">
            <div className="px-5 py-2 rounded-full bg-primary/15 border border-primary/30 flex items-center gap-2 glow-best">
              <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
              <span className="text-primary text-base font-bold tracking-wider">New Personal Best!</span>
            </div>
          </div>
        )}

        {/* Main score card */}
        <div className="bg-surface-container rounded-xl p-8 mb-8
                        shadow-[0_4px_20px_rgba(46,50,48,0.06)] border border-outline-variant/30
                        text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-tertiary to-primary" />
          <p className="text-secondary font-label uppercase tracking-widest text-sm mb-2">{t('summary.processingSpeed')}</p>
          <div className="flex items-center justify-center gap-1">
            <span className="text-7xl font-headline font-black text-primary tabular-nums">{thresholdMs}</span>
            <span className="text-2xl font-headline font-medium text-on-surface-variant mt-4">ms</span>
          </div>
          {improvement > 0 && (
            <div className="mt-6 flex justify-center">
              <div className="bg-primary/10 text-primary px-4 py-1 rounded-full text-sm font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">trending_up</span>
                <span>{improvement}% faster than last session</span>
              </div>
            </div>
          )}
        </div>

        {/* Stats — stacked column cards */}
        <div className="grid grid-cols-3 gap-4 mb-12">
          <div className="bg-surface-container-high rounded-lg p-6 flex flex-col items-center text-center">
            <span className="material-symbols-outlined text-tertiary mb-3">target</span>
            <span className="text-2xl font-headline font-bold text-on-surface tabular-nums">{Math.round(summary.accuracy * 100)}%</span>
            <span className="text-sm text-on-surface-variant font-label">{t('summary.accuracy')}</span>
          </div>
          <div className="bg-surface-container-high rounded-lg p-6 flex flex-col items-center text-center">
            <span className="material-symbols-outlined text-tertiary mb-3">rebase_edit</span>
            <span className="text-2xl font-headline font-bold text-on-surface tabular-nums">{summary.totalTrials}</span>
            <span className="text-sm text-on-surface-variant font-label">{t('summary.sessions')}</span>
          </div>
          <div className="bg-surface-container-high rounded-lg p-6 flex flex-col items-center text-center">
            <span className="material-symbols-outlined text-tertiary mb-3">timer</span>
            <span className="text-2xl font-headline font-bold text-on-surface tabular-nums">{durationMin}m</span>
            <span className="text-sm text-on-surface-variant font-label">{t('chart.speed')}</span>
          </div>
        </div>

        {/* Newly earned badges */}
        {newBadges.length > 0 && (
          <div className="mb-8 space-y-3">
            <h3 className="font-headline text-xl font-bold text-on-surface text-center">{t('summary.newMilestone')}</h3>
            <div className="flex flex-wrap justify-center gap-3">
              {newBadges.map((badgeId) => {
                const def = BADGE_DEFINITIONS.find((b) => b.id === badgeId);
                if (!def) return null;
                return (
                  <div key={badgeId} className="flex flex-col items-center gap-2 px-4 py-3 bg-primary-container/10 rounded-xl border border-primary/20 animate-scale-in">
                    <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>{def.icon}</span>
                    </div>
                    <span className="text-on-surface font-bold text-sm text-center">{t(def.nameKey)}</span>
                    <span className="text-on-surface-variant text-xs text-center">{t(def.descKey)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-4">
          <button
            onClick={onFinish}
            className="w-full bg-primary text-on-primary py-5 rounded-lg font-bold text-xl
                       shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer"
          >
            {t('summary.done')}
          </button>
          <button
            onClick={onViewHistory}
            className="w-full bg-transparent border-2 border-primary/20 text-primary py-4 rounded-lg
                       font-bold text-lg hover:bg-primary/5 transition-colors cursor-pointer"
          >
            {t('progress.title')}
          </button>
        </div>

        {/* Personalized impact message */}
        <div className="mt-12 bg-tertiary-fixed rounded-xl p-6 border border-tertiary/20 flex gap-4 items-start">
          <div className="bg-tertiary text-on-tertiary p-2 rounded-lg shrink-0">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>science</span>
          </div>
          <div>
            <h3 className="font-bold text-on-tertiary-container mb-1">{t('summary.didYouKnow')}</h3>
            <p className="text-sm text-on-tertiary-container/80">
              {getPersonalizedImpactMessage(t, totalSessions, improvement ? (prev?.thresholdMs - thresholdMs) : null, prev?.thresholdMs)}
            </p>
          </div>
        </div>
      </main>
      <BottomNav activeTab="progress" onTabChange={() => {}} />
    </div>
  );
}

function PreSessionOverlay() {
  const [countdown, setCountdown] = useState(3);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const totalMs = 3000;
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const left = Math.max(0, Math.ceil((totalMs - elapsed) / 1000));
      setCountdown(left);
      setProgress(Math.min(elapsed / totalMs, 1));
      if (elapsed >= totalMs) clearInterval(interval);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const r = 120;
  const circumference = 2 * Math.PI * r;

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-background/95 px-6 safe-inset select-none">
      {/* Background blobs */}
      <div className="fixed top-0 right-0 -z-10 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] opacity-60" />
      <div className="fixed bottom-0 left-0 -z-10 w-[400px] h-[400px] bg-tertiary/5 rounded-full blur-[100px] opacity-40" />

      {/* Instructions */}
      <div className="text-center mb-12">
        <h2 className="font-headline text-2xl font-semibold text-primary mb-2">Get Ready</h2>
        <p className="font-body text-on-surface-variant text-base">Clear your mind and prepare your posture.</p>
      </div>

      {/* Large countdown circle */}
      <div className="relative flex items-center justify-center">
        <div className="absolute w-[300px] h-[300px] bg-primary/5 rounded-full blur-3xl" />
        <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-full bg-surface-container
                        flex items-center justify-center
                        shadow-[0_10px_40px_rgba(46,50,48,0.04)] border border-outline-variant/20">
          <span className="font-headline text-[120px] md:text-[160px] font-bold text-primary leading-none tabular-nums">
            {countdown}
          </span>
          <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
            <circle cx="50%" cy="50%" r="48%" fill="none" stroke="currentColor"
                    strokeWidth="4" className="text-primary/20" />
            <circle cx="50%" cy="50%" r="48%" fill="none" stroke="currentColor"
                    strokeWidth="4" strokeLinecap="round" className="text-primary"
                    strokeDasharray="1000"
                    strokeDashoffset={1000 * (1 - progress)} />
          </svg>
        </div>
      </div>

      {/* Lower instruction */}
      <div className="mt-16 text-center max-w-xs">
        <p className="font-body text-on-surface-variant text-lg leading-relaxed">
          Focus on the center of the screen.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`w-2 h-2 rounded-full ${i < (3 - countdown) ? 'bg-primary' : 'bg-outline-variant'}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
