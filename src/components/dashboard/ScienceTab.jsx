/**
 * Science Tab — Educational content about the NIH ACTIVE study
 * Terra design: bento grid, staircase explainer, spark section, quote
 * @module components/dashboard/ScienceTab
 */

export function ScienceTab() {
  return (
    <main className="pt-6 px-6 w-full space-y-12 pb-8">
      {/* Hero Section */}
      <section className="space-y-6">
        <div className="space-y-2">
          <span className="font-label text-tertiary font-bold tracking-widest uppercase text-sm">
            Educational
          </span>
          <h2 className="text-4xl font-bold text-on-background leading-tight">
            The Science of Cognify
          </h2>
          <p className="text-xl text-on-surface-variant font-body leading-relaxed max-w-2xl">
            Our methods are built on decades of clinical research to help you
            maintain mental sharpness and cognitive independence.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 gap-6">
          {/* NIH ACTIVE Study Card */}
          <div className="bg-surface-container-lowest p-8 rounded-xl shadow-[0_4px_20px_rgba(46,50,48,0.06)] border border-outline-variant/30 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center px-3 py-1 bg-primary/10 text-primary rounded-full mb-4">
                <span className="material-symbols-outlined text-sm mr-2">verified</span>
                <span className="text-xs font-bold uppercase tracking-wider">Clinical Gold Standard</span>
              </div>
              <h3 className="font-headline text-3xl font-bold mb-4 text-on-surface">
                The NIH ACTIVE Study
              </h3>
              <p className="text-lg leading-relaxed text-on-surface-variant mb-6">
                The largest study of its kind proved that targeted cognitive
                training can reduce the risk of dementia by up to{' '}
                <span className="text-primary font-bold">25%</span> over a
                10-year period.
              </p>
            </div>
            <div className="flex items-center gap-4 pt-4 border-t border-outline-variant/30">
              <div className="bg-tertiary-fixed p-3 rounded-lg">
                <span className="material-symbols-outlined text-tertiary">clinical_notes</span>
              </div>
              <p className="text-sm font-semibold italic text-tertiary">
                NIH-funded research spanning 2,800+ participants.
              </p>
            </div>
          </div>

          {/* Neuroplasticity Card */}
          <div className="bg-primary rounded-xl overflow-hidden relative min-h-[300px] flex items-center justify-center p-8">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
            <div className="relative z-10 text-center text-on-primary">
              <span
                className="material-symbols-outlined text-8xl mb-4 block"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                neurology
              </span>
              <h4 className="text-xl font-bold">Neuroplasticity</h4>
              <p className="text-sm opacity-90 mt-2">
                Your brain's ability to rewire and strengthen at any age.
              </p>
            </div>
            <div className="absolute bottom-4 right-4 text-on-primary/20">
              <span className="material-symbols-outlined text-8xl">auto_awesome</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-surface-container rounded-xl p-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <h2 className="font-headline text-3xl font-bold text-on-surface">How it Works</h2>
          <p className="text-lg text-on-surface-variant">
            Cognify uses a "3-Up/1-Down" staircase algorithm. It's like a
            personal trainer for your brain that constantly adjusts to your
            specific needs.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8">
          {/* Step 1 */}
          <div className="bg-background p-6 rounded-lg text-center space-y-4 border border-outline-variant/20 shadow-sm">
            <div className="w-16 h-16 bg-secondary-container rounded-full flex items-center justify-center mx-auto text-primary">
              <span className="material-symbols-outlined text-3xl font-bold">
                keyboard_double_arrow_up
              </span>
            </div>
            <h4 className="font-headline font-bold text-xl leading-tight text-on-surface">
              3 Correct?<br />Level Up.
            </h4>
            <p className="text-on-surface-variant leading-relaxed">
              If you get three challenges right in a row, the difficulty nudges
              up slightly to keep you growing.
            </p>
          </div>
          {/* Step 2 — Focal */}
          <div className="bg-primary text-on-primary p-6 rounded-lg text-center space-y-4 shadow-lg">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-3xl font-bold text-white">bolt</span>
            </div>
            <h4 className="font-headline font-bold text-xl leading-tight">
              The Perfect Challenge
            </h4>
            <p className="text-primary-fixed leading-relaxed">
              This finds your "sweet spot" — where things are challenging enough
              to spark focus, but never frustrating.
            </p>
          </div>
          {/* Step 3 */}
          <div className="bg-background p-6 rounded-lg text-center space-y-4 border border-outline-variant/20 shadow-sm">
            <div className="w-16 h-16 bg-secondary-container rounded-full flex items-center justify-center mx-auto text-error">
              <span className="material-symbols-outlined text-3xl font-bold">
                keyboard_arrow_down
              </span>
            </div>
            <h4 className="font-headline font-bold text-xl leading-tight text-on-surface">
              1 Wrong?<br />Ease Back.
            </h4>
            <p className="text-on-surface-variant leading-relaxed">
              Miss one? We immediately make it a bit easier. This ensures your
              brain stays in the optimal learning zone.
            </p>
          </div>
        </div>
      </section>

      {/* The Spark Section */}
      <section className="flex flex-col items-center gap-12 py-8">
        <div className="w-full">
          <div className="relative">
            <div className="bg-tertiary/10 rounded-full w-64 h-64 absolute -top-8 -left-8 blur-3xl" />
            <div className="bg-primary/10 rounded-full w-64 h-64 absolute -bottom-8 -right-8 blur-3xl" />
            <div className="relative bg-surface-container-lowest p-1 rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-surface-container aspect-square rounded-xl flex items-center justify-center">
                <span
                  className="material-symbols-outlined text-tertiary"
                  style={{ fontSize: '120px', fontVariationSettings: "'FILL' 1" }}
                >
                  flare
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="w-full space-y-6">
          <h3 className="font-headline text-3xl font-bold text-on-surface">The Spark of Focus</h3>
          <p className="text-lg text-on-surface-variant leading-relaxed">
            Research shows that when we engage in "just right" challenges, our
            brain releases chemicals that aid focus and memory retention. This is
            what we call the{' '}
            <span className="text-tertiary font-bold">Cognify Spark</span>.
          </p>
          <ul className="space-y-4">
            {['Strengthens attention filters', 'Improves processing speed', 'Builds cognitive reserve'].map(
              (text) => (
                <li key={text} className="flex items-start gap-4">
                  <div className="mt-1 bg-primary-container/20 p-1 rounded-full text-primary">
                    <span className="material-symbols-outlined text-sm font-bold">check_circle</span>
                  </div>
                  <span className="text-on-surface font-semibold">{text}</span>
                </li>
              )
            )}
          </ul>
        </div>
      </section>

      {/* Quote */}
      <section className="border-t border-stone-200 pt-12 text-center pb-12">
        <blockquote className="text-2xl font-headline italic text-on-surface-variant leading-relaxed max-w-3xl mx-auto">
          "Training your brain is no different than training your body.
          Consistency and the right challenge are the keys to longevity."
        </blockquote>
        <p className="mt-6 font-bold text-primary">— Cognify Science Advisory Board</p>
      </section>
    </main>
  );
}
