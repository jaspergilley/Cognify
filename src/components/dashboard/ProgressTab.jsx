/**
 * Progress Tab — Charts, stats, milestones, session history
 * Terra design system styling
 * @module components/dashboard/ProgressTab
 */

import { useState } from 'react';
import {
  ComposedChart, Area, Bar, BarChart,
  XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts';
import { useTranslation } from '../../i18n/index.jsx';
import { BADGE_DEFINITIONS } from '../../engine/badgeEngine.js';
import { loadBadges } from '../../services/dataService.js';

/** Get chart colors based on current dark/light mode */
function useChartColors() {
  const dark = document.documentElement.classList.contains('dark');
  return {
    primary: dark ? '#8ecf9e' : '#4a7c59',
    tertiary: dark ? '#dcc48e' : '#705c30',
    text: dark ? '#c4c8bc' : '#4a4e4a',
    axis: dark ? 'rgba(68,72,62,0.3)' : 'rgba(196,200,188,0.3)',
    pbLabel: dark ? 'rgba(142,207,158,0.5)' : 'rgba(74,124,89,0.5)',
    pbLine: dark ? 'rgba(142,207,158,0.3)' : 'rgba(74,124,89,0.3)',
    targetLabel: dark ? 'rgba(220,196,142,0.5)' : 'rgba(112,92,48,0.5)',
    targetLine: dark ? 'rgba(220,196,142,0.3)' : 'rgba(112,92,48,0.3)',
    barFill: dark ? 'rgba(142,207,158,0.4)' : 'rgba(74,124,89,0.4)',
    barRef: dark ? 'rgba(142,207,158,0.15)' : 'rgba(74,124,89,0.15)',
    dotGlow: dark ? 'rgba(142,207,158,0.8)' : 'rgba(74,124,89,0.8)',
    dotStroke: dark ? '#1a1c1a' : '#fff',
  };
}

export function ProgressTab({ data, hasData, hz, onOpenExport }) {
  const { t } = useTranslation();
  if (!hasData) {
    return (
      <main className="pt-6 px-6 w-full pb-8">
        <div className="mb-8">
          <h2 className="font-headline text-3xl font-bold text-on-background mb-2">{t('progress.title')}</h2>
          <p className="text-on-surface-variant text-lg font-body">{t('progress.noSessions')}</p>
        </div>
        <div className="bg-surface-container-low rounded-xl p-12 text-center border border-outline-variant/30 shadow-[0_4px_20px_rgba(46,50,48,0.06)]">
          <span className="material-symbols-outlined text-on-surface-variant text-5xl mb-4 block">insights</span>
          <p className="text-on-surface-variant text-xl font-medium font-headline">No data yet</p>
          <p className="text-on-surface-variant mt-2 font-body">Charts and stats will appear after your first training session.</p>
        </div>
      </main>
    );
  }

  const cc = useChartColors();
  const activeDays = data.streak.filter(d => d.hasSession).length;

  // Compute speed change vs earliest session for the stat badge
  const speedDeltaMs = (() => {
    if (!data.history || data.history.length < 2) return null;
    const first = data.history[0]?.thresholdMs;
    const latest = data.history[data.history.length - 1]?.thresholdMs;
    if (first == null || latest == null) return null;
    return first - latest;
  })();

  return (
    <main className="pt-6 px-6 w-full space-y-8 pb-8">
      {/* Header */}
      <div className="mb-2">
        <h2 className="font-headline text-3xl font-bold text-on-background mb-2">{t('progress.title')}</h2>
        <p className="text-on-surface-variant text-lg font-body">Celebrate your consistency and growth.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-6">
        {/* Total Progress */}
        <div className="bg-primary-container/10 p-6 rounded-xl border border-primary/10 flex items-center justify-between shadow-[0_4px_20px_rgba(46,50,48,0.06)]">
          <div>
            <p className="font-label text-primary font-bold uppercase tracking-wider text-sm mb-1">Total Progress</p>
            <p className="font-headline text-4xl font-bold text-on-background">
              {data.selfProgress?.percentFaster > 0 ? `+${data.selfProgress.percentFaster}%` : '--'}
            </p>
            <p className="text-on-surface-variant text-sm mt-1 font-body">speed improvement</p>
          </div>
          <div className="bg-primary/20 p-4 rounded-full">
            <span className="material-symbols-outlined text-primary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
          </div>
        </div>

        {/* Weekly Sessions */}
        <div className="bg-tertiary/10 p-6 rounded-xl border border-tertiary/10 flex items-center justify-between shadow-[0_4px_20px_rgba(46,50,48,0.06)]">
          <div>
            <p className="font-label text-tertiary font-bold uppercase tracking-wider text-sm mb-1">Weekly Sessions</p>
            <p className="font-headline text-4xl font-bold text-on-background">{activeDays}/7</p>
            <p className="text-on-surface-variant text-sm mt-1 font-body">Days completed</p>
          </div>
          <div className="bg-tertiary/20 p-4 rounded-full">
            <span className="material-symbols-outlined text-tertiary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_today</span>
          </div>
        </div>
      </div>

      {/* Processing Speed Chart */}
      {data.history.length >= 2 && (
        <section className="bg-surface-container-low p-8 rounded-xl shadow-[0_4px_20px_rgba(46,50,48,0.06)] border border-outline-variant/30">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="font-headline text-2xl font-bold text-on-background">Processing Speed Threshold</h3>
              <p className="text-on-surface-variant font-body mt-1">Measured in milliseconds (lower is faster)</p>
            </div>
            {speedDeltaMs != null && speedDeltaMs !== 0 && (
              <div className="text-right flex-shrink-0 ml-4">
                <p className={`font-headline text-2xl font-bold ${speedDeltaMs > 0 ? 'text-primary' : 'text-on-surface-variant'}`}>
                  {speedDeltaMs > 0 ? `-${speedDeltaMs}ms` : `+${Math.abs(speedDeltaMs)}ms`}
                </p>
                <p className="font-label text-on-surface-variant text-xs font-bold uppercase tracking-wider mt-0.5">VS First Session</p>
              </div>
            )}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={data.history.map((d, i) => ({
              session: i + 1,
              threshold: d.thresholdMs,
              accuracy: Math.round((d.accuracy || 0) * 100),
            }))} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
              <defs>
                <linearGradient id="thresholdFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={cc.primary} stopOpacity={0.15} />
                  <stop offset="100%" stopColor={cc.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="session" tick={{ fill: cc.text, fontSize: 11 }} axisLine={{ stroke: cc.axis }} tickLine={false} />
              <YAxis tick={{ fill: cc.text, fontSize: 11 }} axisLine={false} tickLine={false} domain={['dataMin - 10', 'dataMax + 10']} />
              <Tooltip content={<ChartTooltip />} />
              {data.best && (
                <ReferenceLine y={data.best.thresholdMs} stroke={cc.pbLine} strokeDasharray="4 4"
                  label={{ value: `PB: ${data.best.thresholdMs}ms`, fill: cc.pbLabel, fontSize: 10, position: 'right' }} />
              )}
              <Area type="monotone" dataKey="threshold" stroke={cc.primary} strokeWidth={2.5} fill="url(#thresholdFill)" dot={false}
                activeDot={{ r: 5, fill: cc.primary, stroke: cc.dotStroke, strokeWidth: 2, style: { filter: `drop-shadow(0 0 6px ${cc.dotGlow})` } }} />
            </ComposedChart>
          </ResponsiveContainer>
          <div className="flex justify-between mt-4 px-2 text-on-surface-variant font-bold text-sm font-body">
            <span>Session 1</span>
            <span>Today</span>
          </div>
        </section>
      )}

      {/* Accuracy Trend */}
      {data.accuracyHistory.length >= 2 && (
        <section className="bg-surface-container-low p-8 rounded-xl shadow-[0_4px_20px_rgba(46,50,48,0.06)] border border-outline-variant/30">
          <div className="mb-6">
            <h3 className="font-headline text-2xl font-bold text-on-background">Accuracy Trend</h3>
            <p className="text-on-surface-variant font-medium font-body mt-1">Goal: Maintain 80% accuracy for optimal challenge</p>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <ComposedChart data={data.accuracyHistory} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
              <XAxis dataKey="sessionIndex" tick={{ fill: cc.text, fontSize: 11 }} axisLine={{ stroke: cc.axis }} tickLine={false} />
              <YAxis tick={{ fill: cc.text, fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <Tooltip content={<AccTooltip />} />
              <ReferenceLine y={79} stroke={cc.targetLine} strokeDasharray="4 4" label={{ value: 'TARGET 80%', fill: cc.targetLabel, fontSize: 9, position: 'right' }} />
              <defs>
                <linearGradient id="accFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={cc.primary} stopOpacity={0.1} />
                  <stop offset="100%" stopColor={cc.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="accuracy" stroke={cc.primary} strokeWidth={2} fill="url(#accFill)" dot={false}
                activeDot={{ r: 4, fill: cc.primary, stroke: cc.dotStroke, strokeWidth: 2 }} />
            </ComposedChart>
          </ResponsiveContainer>
          <div className="flex items-start gap-4 mt-6 p-4 bg-primary/5 rounded-lg border border-primary/10">
            <span className="material-symbols-outlined text-primary mt-0.5 flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
            <p className="text-on-surface text-base leading-relaxed font-body">
              You're hitting the sweet spot! Staying near <span className="font-bold text-primary">80% accuracy</span> means you're challenging your brain just the right amount.
            </p>
          </div>
        </section>
      )}

      {/* Weekly Volume */}
      {data.weeklyVolume.some((w) => w.count > 0) && (
        <section className="bg-surface-container-low p-8 rounded-xl shadow-[0_4px_20px_rgba(46,50,48,0.06)] border border-outline-variant/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-headline text-xl font-bold text-on-background">Weekly Training</h3>
            <span className="font-label text-on-surface-variant text-sm font-bold uppercase tracking-wider">Last 8 Weeks</span>
          </div>
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={data.weeklyVolume} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
              <XAxis dataKey="weekLabel" tick={{ fill: cc.text, fontSize: 9 }} axisLine={{ stroke: cc.axis }} tickLine={false} />
              <YAxis tick={{ fill: cc.text, fontSize: 9 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<VolumeTooltip />} />
              <ReferenceLine y={3} stroke={cc.barRef} strokeDasharray="4 4" />
              <Bar dataKey="count" fill={cc.barFill} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>
      )}

      {/* Exercise-specific stats */}
      {data.ex2Count > 0 && (
        <ExerciseStats label="Exercise 2 - Divided Attention" threshold={data.ex2Threshold} accuracy={data.ex2Accuracy} count={data.ex2Count} />
      )}
      {data.ex3Count > 0 && (
        <ExerciseStats label="Exercise 3 - Selective Attention" threshold={data.ex3Threshold} accuracy={data.ex3Accuracy} count={data.ex3Count} />
      )}

      {/* Milestones */}
      <Milestones data={data} />

      {/* Session List */}
      {data.recentSessions.length > 0 && (
        <SessionList sessions={data.recentSessions} allSessions={data.allSessions} hz={hz} onOpenExport={onOpenExport} />
      )}
    </main>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function ExerciseStats({ label, threshold, accuracy, count }) {
  const { t } = useTranslation();
  return (
    <section className="bg-surface-container-low rounded-xl p-6 shadow-[0_4px_20px_rgba(46,50,48,0.06)] border border-outline-variant/30">
      <h3 className="font-headline text-xl font-bold text-on-background mb-4">{label}</h3>
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-primary-container/10 rounded-xl p-4 border border-primary/10">
          <p className="font-label text-on-surface-variant text-sm font-bold uppercase tracking-wider">{t('chart.speed')}</p>
          <p className="text-on-surface text-xl font-bold tabular-nums mt-1 font-headline">
            {threshold?.thresholdMs ?? '\u2014'}<span className="text-on-surface-variant text-sm ml-0.5 font-body">ms</span>
          </p>
        </div>
        <div className="bg-primary-container/10 rounded-xl p-4 border border-primary/10">
          <p className="font-label text-on-surface-variant text-sm font-bold uppercase tracking-wider">{t('chart.accuracy')}</p>
          <p className="text-on-surface text-xl font-bold tabular-nums mt-1 font-headline">
            {accuracy ?? '\u2014'}<span className="text-on-surface-variant text-sm ml-0.5 font-body">%</span>
          </p>
        </div>
        <div className="bg-primary-container/10 rounded-xl p-4 border border-primary/10">
          <p className="font-label text-on-surface-variant text-sm font-bold uppercase tracking-wider">{t('progress.sessions')}</p>
          <p className="text-on-surface text-xl font-bold tabular-nums mt-1 font-headline">{count}</p>
        </div>
      </div>
    </section>
  );
}

function Milestones({ data }) {
  const { t } = useTranslation();
  const earnedBadgeIds = new Set(loadBadges());

  const milestones = BADGE_DEFINITIONS.map((badge) => ({
    title: t(badge.nameKey),
    icon: badge.icon,
    earned: earnedBadgeIds.has(badge.id),
  }));

  const earnedCount = milestones.filter((m) => m.earned).length;
  if (earnedCount === 0) return null;

  return (
    <section className="bg-surface-container-low rounded-xl p-6 shadow-[0_4px_20px_rgba(46,50,48,0.06)] border border-outline-variant/30">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-headline text-xl font-bold text-on-background">{t('dashboard.milestones')}</h3>
        <span className="font-label text-on-surface-variant text-sm font-bold uppercase tracking-wider">{earnedCount} / {milestones.length}</span>
      </div>
      <div className="scroll-snap-x flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
        {milestones.map((m) => (
          <div
            key={m.title}
            className={`flex-shrink-0 w-24 rounded-xl px-3 py-4 flex flex-col items-center gap-2 border transition-opacity ${
              m.earned
                ? 'bg-primary-container/10 border-primary/10'
                : 'bg-surface-container border-outline-variant/20 opacity-25'
            }`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${m.earned ? 'bg-primary/15' : 'bg-on-surface-variant/5'}`}>
              <span className={`material-symbols-outlined text-xl ${m.earned ? 'text-primary' : 'text-on-surface-variant'}`}
                style={m.earned ? { fontVariationSettings: "'FILL' 1" } : undefined}>{m.icon}</span>
            </div>
            <span className="text-on-surface-variant text-xs text-center font-bold leading-tight font-label">{m.title}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function SessionList({ sessions, allSessions, hz, onOpenExport }) {
  const [showAll, setShowAll] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const visible = showAll ? sessions : sessions.slice(0, 5);

  const bestThreshold = allSessions.reduce((min, s) => {
    if (s.thresholdFrames > 0 && (min === null || s.thresholdFrames < min)) return s.thresholdFrames;
    return min;
  }, null);

  const grouped = groupByDate(visible);

  return (
    <section className="bg-surface-container-low rounded-xl p-6 shadow-[0_4px_20px_rgba(46,50,48,0.06)] border border-outline-variant/30">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-headline text-xl font-bold text-on-background">Recent Sessions</h3>
        <button
          onClick={onOpenExport}
          className="flex items-center gap-1.5 text-primary font-bold text-sm px-3 py-1.5
                     hover:bg-primary/5 rounded-lg transition-colors cursor-pointer active:scale-95"
        >
          <span className="material-symbols-outlined text-lg">download</span>
          Export
        </button>
      </div>
      <div className="flex flex-col gap-1">
        {grouped.map(({ label, sessions: daySessions }) => (
          <div key={label}>
            <div className="font-label text-on-surface-variant text-sm font-bold uppercase tracking-wider px-2 py-2">{label}</div>
            {daySessions.map((s, i) => {
              const ms = Math.round(((s.thresholdFrames || 0) / hz) * 1000);
              const acc = Math.round((s.accuracy || 0) * 100);
              const when = formatTime(s.completedAt);
              const dur = s.durationMs ? `${Math.round(s.durationMs / 60000 * 10) / 10}m` : '';
              const exType = s.exerciseType || 1;
              const isPB = s.thresholdFrames > 0 && s.thresholdFrames === bestThreshold;
              const isExpanded = expandedId === s.id;

              return (
                <div key={s.id || i}>
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : s.id)}
                    className="flex items-center justify-between text-sm px-4 py-3 rounded-xl
                               bg-surface-container hover:bg-surface-container-high
                               border border-outline-variant/10 mb-1
                               transition-colors cursor-pointer font-body"
                  >
                    <span className="text-on-surface font-bold w-10">Ex{exType}</span>
                    <span className="text-on-surface tabular-nums flex-1 text-center font-medium">
                      {ms}ms
                      {isPB && <span className="text-primary ml-1 text-xs font-bold">PB</span>}
                    </span>
                    <span className="text-on-surface-variant tabular-nums w-12 text-center">{acc}%</span>
                    <span className="text-on-surface-variant tabular-nums w-12 text-right">{dur}</span>
                    <span className="text-on-surface-variant w-14 text-right">{when}</span>
                    <span className={`material-symbols-outlined text-on-surface-variant text-lg ml-2 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>expand_more</span>
                  </div>
                  {isExpanded && s.trials && <SessionDetail session={s} />}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {sessions.length > 5 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full text-center text-primary text-sm font-bold mt-3 py-2 hover:bg-primary/5 rounded-lg
                     transition-colors cursor-pointer font-body"
        >
          {showAll ? 'Show less' : `Show all ${sessions.length} sessions`}
        </button>
      )}
    </section>
  );
}

function SessionDetail({ session }) {
  const trials = session.trials || [];
  const block1 = trials.slice(0, 30);
  const block2 = trials.slice(30);

  function blockStats(blockTrials) {
    if (blockTrials.length === 0) return null;
    const correct = blockTrials.filter((t) => t.correct).length;
    const rts = blockTrials.filter((t) => !t.timedOut && t.reactionTimeMs > 0).map((t) => t.reactionTimeMs);
    return {
      acc: Math.round((correct / blockTrials.length) * 100),
      avgRt: rts.length > 0 ? Math.round(rts.reduce((a, b) => a + b, 0) / rts.length) : 0,
      trials: blockTrials.length,
    };
  }

  const b1 = blockStats(block1);
  const b2 = blockStats(block2);

  return (
    <div className="px-4 py-3 bg-surface-container rounded-xl mb-2 text-sm text-on-surface-variant space-y-1 font-body">
      {b1 && <div>Block 1: {b1.acc}% accuracy, {b1.avgRt}ms avg RT ({b1.trials} trials)</div>}
      {b2 && <div>Block 2: {b2.acc}% accuracy, {b2.avgRt}ms avg RT ({b2.trials} trials)</div>}
      <div>Threshold method: {session.thresholdMethod || 'reversal'}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Chart Tooltips                                                     */
/* ------------------------------------------------------------------ */

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="bg-surface-container-lowest rounded-lg px-3 py-2 text-sm shadow-lg border border-outline-variant/20 font-body">
      <div className="text-on-surface tabular-nums font-bold">{d?.threshold}ms</div>
      {d?.accuracy != null && <div className="text-primary tabular-nums">{d.accuracy}% accuracy</div>}
    </div>
  );
}

function AccTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-container-lowest rounded-lg px-3 py-2 text-sm shadow-lg border border-outline-variant/20 font-body">
      <div className="text-primary tabular-nums font-bold">{payload[0].value}%</div>
    </div>
  );
}

function VolumeTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-container-lowest rounded-lg px-3 py-2 text-sm shadow-lg border border-outline-variant/20 font-body">
      <div className="text-on-surface tabular-nums font-bold">{payload[0].value} session{payload[0].value !== 1 ? 's' : ''}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function groupByDate(sessions) {
  const groups = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayMs = today.getTime();
  const yesterdayMs = todayMs - 86400000;

  let currentLabel = null;
  let currentGroup = null;

  for (const s of sessions) {
    const ts = s.completedAt || 0;
    let label;
    if (ts >= todayMs) label = 'Today';
    else if (ts >= yesterdayMs) label = 'Yesterday';
    else label = new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

    if (label !== currentLabel) {
      currentLabel = label;
      currentGroup = { label, sessions: [] };
      groups.push(currentGroup);
    }
    currentGroup.sessions.push(s);
  }

  return groups;
}

function formatTime(timestamp) {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}
