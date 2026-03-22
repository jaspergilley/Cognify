/**
 * What's New — Update announcements and feature highlights
 * @module components/dashboard/WhatsNew
 */

export const UPDATES = [
  {
    id: 'v0.3.0',
    date: 'March 2026',
    title: 'Exercise 3: Selective Attention is Now Live!',
    description: 'Our latest exercise helps you focus on what matters most. Sharpen your mental filter with this science-backed cognitive challenge designed for daily play.',
    icon: 'filter_center_focus',
    featured: true,
    cta: { label: 'Start Now', exerciseType: 3 },
  },
  {
    id: 'v0.2.2',
    date: 'March 12, 2026',
    title: 'New Study: 10% Faster Gains',
    description: 'Recent research with our university partners shows that consistent use of Cognify leads to a 10% improvement in reaction time within just three months.',
    icon: 'science',
  },
  {
    id: 'v0.2.1',
    date: 'February 28, 2026',
    title: 'Daily Goals & Session Export',
    description: 'Set daily training targets and export your full session history as CSV or PDF to share with your healthcare provider.',
    icon: 'flag',
  },
  {
    id: 'v0.2.0',
    date: 'February 15, 2026',
    title: 'Exercise 2: Divided Attention',
    description: 'Challenge yourself with peripheral detection tasks alongside central shape identification. Unlocked after mastering Exercise 1.',
    icon: 'blur_on',
  },
  {
    id: 'v0.1.0',
    date: 'January 20, 2026',
    title: 'Cognify Launch',
    description: 'The first version of Cognify is live! Start with Exercise 1 to establish your baseline processing speed and begin your cognitive training journey.',
    icon: 'rocket_launch',
  },
];

export function WhatsNew({ onBack, onStartSession }) {
  const featured = UPDATES.find((u) => u.featured);
  const timeline = UPDATES.filter((u) => !u.featured);

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
        <h1 className="font-headline font-bold text-xl text-primary">What's New</h1>
      </div>

      {/* Featured Update Card */}
      {featured && (
        <section>
          <div className="relative overflow-hidden bg-surface-container-lowest rounded-xl shadow-[0_4px_20px_rgba(46,50,48,0.06)] border border-outline-variant/30">
            {/* Hero area with icon */}
            <div className="aspect-[16/9] w-full bg-primary flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
              <span
                className="material-symbols-outlined text-on-primary relative z-10"
                style={{ fontSize: '96px', fontVariationSettings: "'FILL' 1" }}
              >
                {featured.icon}
              </span>
              <div className="absolute top-4 left-4 bg-tertiary-container text-on-tertiary-container px-3 py-1 rounded-full text-xs font-bold font-label tracking-wider uppercase">
                Featured
              </div>
            </div>
            {/* Content */}
            <div className="p-6">
              <div className="text-tertiary font-label font-bold text-sm mb-2 uppercase tracking-widest">{featured.date}</div>
              <h2 className="font-headline text-2xl font-bold text-on-background mb-3 leading-tight">{featured.title}</h2>
              <p className="font-body text-lg text-on-surface-variant leading-relaxed mb-6">{featured.description}</p>
              {featured.cta && (
                <button
                  onClick={() => onStartSession(featured.cta.exerciseType)}
                  className="bg-primary text-on-primary px-8 py-3 rounded-xl font-bold font-label
                             hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 w-full"
                >
                  {featured.cta.label}
                  <span className="material-symbols-outlined">play_circle</span>
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Updates Timeline */}
      <div className="space-y-4">
        {timeline.map((update) => (
          <div
            key={update.id}
            className="bg-surface-container rounded-xl p-6 flex flex-col gap-5 items-start
                       shadow-[0_4px_20px_rgba(46,50,48,0.06)] hover:bg-surface-container-high transition-colors"
          >
            <div className="bg-primary-container/20 p-4 rounded-xl flex-shrink-0">
              <span
                className="material-symbols-outlined text-primary text-4xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {update.icon}
              </span>
            </div>
            <div className="flex-1">
              <span className="text-tertiary font-label font-bold text-xs uppercase tracking-widest">{update.date}</span>
              <h3 className="font-headline text-xl font-bold text-on-background mt-1 mb-2">{update.title}</h3>
              <p className="font-body text-on-surface-variant leading-relaxed text-base">{update.description}</p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
