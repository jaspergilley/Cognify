/**
 * Home Tab — Quick start, stats, activity, exercises, pro tips
 * @module components/dashboard/HomeTab
 */

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../../i18n/index.jsx';

export function HomeTab({ data, hasData, onStartSession, ex2Available, ex3Available, devUnlock, hz }) {
  const { t } = useTranslation();
  const greeting = getGreeting();
  const bestExercise = ex3Available ? 3 : ex2Available ? 2 : 1;

  return (
    <main className="pt-24 px-6 w-full space-y-8 pb-8">
      {/* Welcome Greeting */}
      <section className="py-4">
        <h2 className="font-headline text-4xl font-extrabold text-on-background tracking-tight">{greeting}</h2>
        <p className="font-body text-xl text-on-surface-variant mt-2">Ready to sharpen your focus today?</p>
      </section>

      {/* Quick Start Card */}
      <section className="relative overflow-hidden bg-primary rounded-xl p-8 shadow-[0_8px_30px_rgba(74,124,89,0.2)]">
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary-fixed text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
            <h3 className="font-headline text-2xl font-bold text-on-primary">Daily Speed Drill</h3>
          </div>
          <p className="text-primary-fixed text-lg font-medium opacity-90 max-w-[80%]">
            Focus on the center and tap as fast as you can.
          </p>
          <button
            onClick={() => onStartSession(bestExercise)}
            className="mt-4 w-full bg-surface-bright text-primary font-bold py-5 px-10 rounded-xl text-xl
                       flex items-center justify-center gap-3 active:scale-95 transition-transform duration-200 shadow-lg cursor-pointer"
          >
            <span>Start Session</span>
            <span className="material-symbols-outlined font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
          </button>
        </div>
        {/* Decorative Organic Shapes */}
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-primary-container/30 rounded-full blur-3xl" />
        <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-on-primary-fixed-variant/20 rounded-full blur-2xl" />
      </section>

      {/* Bento Grid Stats */}
      {hasData ? (
        <div className="grid grid-cols-2 gap-4">
          {/* Personal Best */}
          <div className={`bg-surface-container-high rounded-xl p-6 flex flex-col justify-between shadow-sm min-h-[160px] ${data.isCurrentBest ? 'glow-best' : ''}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-tertiary text-2xl">trophy</span>
              <span className="font-label font-bold text-sm text-on-surface-variant tracking-wider">PERSONAL BEST</span>
            </div>
            <div>
              <AnimatedNumber value={data.best?.thresholdMs ?? 0} className="font-headline text-4xl font-extrabold text-on-background" />
              <span className="font-body text-xl text-on-surface-variant ml-1">ms</span>
            </div>
          </div>
          {/* Progress */}
          <div className="bg-surface-container-high rounded-xl p-6 flex flex-col justify-between shadow-sm min-h-[160px]">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-primary text-2xl">trending_up</span>
              <span className="font-label font-bold text-sm text-on-surface-variant tracking-wider">PROGRESS</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="font-headline text-4xl font-extrabold text-on-background">
                {data.selfProgress?.percentFaster > 0 ? `+${data.selfProgress.percentFaster}%` : '--'}
              </span>
              {data.selfProgress?.percentFaster > 0 && (
                <span className="material-symbols-outlined text-primary text-3xl mb-1">arrow_upward</span>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface-container-high rounded-xl p-6 flex flex-col justify-between shadow-sm min-h-[160px]">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-tertiary text-2xl">trophy</span>
              <span className="font-label font-bold text-sm text-on-surface-variant tracking-wider">PERSONAL BEST</span>
            </div>
            <div>
              <span className="font-headline text-4xl font-extrabold text-on-surface-variant">--</span>
              <span className="font-body text-xl text-on-surface-variant ml-1">ms</span>
            </div>
          </div>
          <div className="bg-surface-container-high rounded-xl p-6 flex flex-col justify-between shadow-sm min-h-[160px]">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-primary text-2xl">trending_up</span>
              <span className="font-label font-bold text-sm text-on-surface-variant tracking-wider">PROGRESS</span>
            </div>
            <div>
              <span className="font-headline text-4xl font-extrabold text-on-surface-variant">--</span>
            </div>
          </div>
        </div>
      )}

      {/* Today's Activity */}
      <section className="space-y-4">
        <div className="flex justify-between items-end">
          <h3 className="font-headline text-2xl font-bold text-on-background">Today's Activity</h3>
          {hasData && data.recentSessions.length > 0 && (
            <button className="text-primary font-bold text-lg hover:underline px-2 py-1">
              View All
            </button>
          )}
        </div>
        {hasData && data.recentSessions.length > 0 ? (
          <div className="space-y-3">
            {data.recentSessions.slice(0, 3).map((s, i) => {
              const ms = Math.round(((s.thresholdFrames || 0) / hz) * 1000);
              const exType = s.exerciseType || 1;
              const when = s.completedAt ? new Date(s.completedAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : '';
              const acc = Math.round((s.accuracy || 0) * 100);
              const label = exType === 1 ? 'Focus Sprint' : exType === 2 ? t('training.dividedAttention') : 'Selective Focus';
              const icon = exType === 1 ? 'timer' : exType === 2 ? 'psychology' : 'target';
              const statusLabel = acc >= 85 ? 'Excellent' : acc >= 75 ? 'Improved' : 'Steady';

              return (
                <div key={s.id || i} className="bg-surface-container-low rounded-xl p-5 flex items-center justify-between border border-outline-variant/20">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center ${exType === 1 ? 'bg-primary-container/20' : 'bg-tertiary-container/20'}`}>
                      <span className={`material-symbols-outlined text-3xl ${exType === 1 ? 'text-primary' : 'text-tertiary'}`}>{icon}</span>
                    </div>
                    <div>
                      <p className="font-bold text-xl text-on-surface">{label}</p>
                      <p className="text-on-surface-variant">{when}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold text-2xl text-on-surface">{ms} ms</p>
                    <p className="text-primary font-bold text-sm">{statusLabel}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-surface-container-low rounded-xl p-8 text-center border border-outline-variant/20">
            <span className="material-symbols-outlined text-on-surface-variant text-4xl mb-3 block">fitness_center</span>
            <p className="text-on-surface-variant text-lg">Complete your first session to see your activity here.</p>
          </div>
        )}
      </section>

      {/* Daily Tip */}
      <div className="bg-tertiary-fixed rounded-xl p-6 flex gap-4 items-start border border-tertiary/20">
        <div className="bg-tertiary text-on-tertiary p-2 rounded-lg shrink-0">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>lightbulb</span>
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-lg text-on-tertiary-container">Daily Tip</h4>
          <p className="text-on-tertiary-container/80 text-lg leading-relaxed">
            {getProTip(data)}
          </p>
        </div>
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

export function AnimatedNumber({ value, className }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    if (typeof value !== 'number' || isNaN(value)) { setDisplay(value); return; }
    const duration = 600;
    const startTime = performance.now();
    function tick(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) ref.current = requestAnimationFrame(tick);
    }
    ref.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(ref.current);
  }, [value]);

  return <span className={className}>{display}</span>;
}


/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function getProTip(data) {
  const tips = [
    'Early morning sessions are shown to be 20% more effective for cognitive retention.',
    'Train 3 times per week for best results. Consistency beats intensity.',
    'Taking short breaks between blocks helps consolidate learning.',
    'Your brain continues improving even after your session ends.',
    'Speed training builds cognitive reserve that protects against age-related decline.',
  ];
  const { consecutiveStreak, ex1Count } = data;
  if (consecutiveStreak >= 5) return `Amazing ${consecutiveStreak}-day streak! Consistency is the key to lasting cognitive benefits.`;
  if (consecutiveStreak >= 3) return `Great ${consecutiveStreak}-day streak! Keep going for maximum benefit.`;
  const idx = (ex1Count + (data.ex2Count || 0)) % tips.length;
  return tips[idx];
}
