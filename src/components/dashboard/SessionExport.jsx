/**
 * Session History Export — Export sessions as CSV/PDF, browse session cards
 * @module components/dashboard/SessionExport
 */

import { sessionsToCSV, downloadCSV, printSessions } from '../../utils/exportSessions.js';

export function SessionExport({ sessions, hz, onBack }) {
  function handleCSV() {
    const csv = sessionsToCSV(sessions, hz);
    const date = new Date().toISOString().split('T')[0];
    downloadCSV(csv, `cognify-sessions-${date}.csv`);
  }

  function handlePDF() {
    printSessions(sessions, hz);
  }

  return (
    <main className="pt-6 px-6 w-full space-y-8 stagger-in pb-8">
      {/* Header with back button */}
      <div className="flex items-center gap-4 -mx-2">
        <button
          onClick={onBack}
          className="p-2 rounded-full hover:bg-primary/5 transition-colors active:scale-95"
          aria-label="Go back"
        >
          <span className="material-symbols-outlined text-primary text-2xl">arrow_back</span>
        </button>
        <h1 className="font-headline font-bold text-xl text-primary">Session History</h1>
      </div>

      {/* Informational Blurb */}
      <section className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/30 flex gap-4 items-start shadow-sm">
        <div className="bg-tertiary-fixed p-3 rounded-full flex-shrink-0">
          <span className="material-symbols-outlined text-tertiary">info</span>
        </div>
        <div>
          <p className="text-on-surface-variant font-body leading-relaxed text-lg">
            Share this data with your doctor or healthcare provider to track your cognitive progress over time.
          </p>
        </div>
      </section>

      {/* Export Actions */}
      <section className="grid grid-cols-1 gap-4">
        <button
          onClick={handleCSV}
          className="bg-primary text-on-primary py-5 px-8 rounded-xl font-bold flex items-center justify-center gap-3
                     shadow-md active:scale-95 transition-transform text-lg"
        >
          <span className="material-symbols-outlined">description</span>
          Export as CSV
        </button>
        <button
          onClick={handlePDF}
          className="bg-surface-container text-primary border-2 border-primary py-5 px-8 rounded-xl font-bold
                     flex items-center justify-center gap-3 shadow-sm active:scale-95 transition-transform text-lg"
        >
          <span className="material-symbols-outlined">picture_as_pdf</span>
          Export as PDF
        </button>
      </section>

      {/* Session Cards */}
      {sessions.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-primary font-headline mb-6">Recent Sessions</h2>
          {sessions.slice(0, 10).map((s, i) => {
            const date = s.completedAt ? new Date(s.completedAt) : null;
            const dateStr = date
              ? date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
              : '';
            const timeStr = date
              ? date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
              : '';
            const exType = s.exerciseType || 1;
            const exLabel = exType === 1 ? 'Ex 1: Central Focus'
              : exType === 2 ? 'Ex 2: Divided Attention'
              : 'Ex 3: Selective Attention';
            const thresholdMs = Math.round(((s.thresholdFrames || 0) / hz) * 1000);
            const accuracy = Math.round((s.accuracy || 0) * 100);

            return (
              <div
                key={s.id || i}
                className="bg-surface-container-lowest p-6 rounded-xl
                           shadow-[0_4px_20px_rgba(46,50,48,0.06)] border border-outline-variant/10
                           flex items-center justify-between active:bg-surface-container transition-colors"
              >
                <div className="space-y-1">
                  <p className="text-sm font-bold text-tertiary tracking-wide uppercase font-label">
                    {dateStr} {timeStr && `\u2022 ${timeStr}`}
                  </p>
                  <h3 className="text-xl font-bold text-on-surface">{exLabel}</h3>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-extrabold text-primary font-body">{thresholdMs}ms</div>
                  <p className="text-sm text-on-surface-variant font-label">{accuracy}% accuracy</p>
                </div>
              </div>
            );
          })}
        </section>
      ) : (
        <div className="bg-surface-container-low rounded-xl p-12 text-center border border-outline-variant/20">
          <span className="material-symbols-outlined text-on-surface-variant text-5xl mb-4 block">history</span>
          <p className="text-on-surface-variant text-xl font-medium">No sessions yet</p>
          <p className="text-on-surface-variant mt-2">Complete a training session to see your history here.</p>
        </div>
      )}
    </main>
  );
}
