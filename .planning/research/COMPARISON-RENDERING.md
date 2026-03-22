# Comparison: Rendering & Timing Stack Proposals for Cognify

**Context:** Cross-analysis of two competing approaches to the frame-accurate rendering and timing engine for Cognify -- a psychophysics-grade cognitive speed training app where stimulus display timing IS the product.
**Researched:** 2026-03-21
**Recommendation:** Stay with React 19 + useRef isolation. Adopt performance.now() delta timing as a *companion* to frame counting (not a replacement). Adopt integer coordinate rounding. Skip offscreen canvas pre-rendering. Reserve full-screen canvas takeover as an optimization-if-needed.

## The Two Proposals

### Proposal A: Original Plan (React + Mitigations)
- React 19.2 (.jsx) with canvas isolated via useRef
- requestAnimationFrame with pure frame counting
- All shapes drawn directly on canvas per frame
- Timing in frames, converted from ms for display only

### Proposal B: Alternative (Framework Swap + Canvas Optimizations)
- Svelte or Preact instead of React (zero VDOM overhead)
- Full-screen canvas takeover during exercises (unmount all UI)
- Pre-render stimuli onto offscreen canvases, use ctx.drawImage() compositing
- performance.now() delta timing for hardware-agnostic refresh rate handling
- Round all coordinates to integers to avoid sub-pixel anti-aliasing
- Reserve OffscreenCanvas + Web Worker for future only if telemetry shows frame drops

---

## Question 1: Is React's VDOM Reconciliation Actually a Problem?

**Verdict: No. The useRef mitigation is not a bandaid -- it is the architecturally correct approach. VDOM reconciliation does not occur on the timing-critical path when implemented properly.**

### The "Fundamentally Incompatible" Claim is Half-Right

The original research correctly identified that `useState` inside a rAF loop is fundamentally incompatible with frame-accurate timing. Every `setState` call schedules a reconciliation pass. At 60fps, that is 60 reconciliation cycles per second. React's Fiber architecture makes reconciliation interruptible, but each pass still involves:

1. Creating new fiber nodes (memory allocation)
2. Diffing props (shallow comparison)
3. Scheduling commit phase (DOM updates)
4. Running effects (useEffect/useLayoutEffect)

This introduces 1-16ms of unpredictable latency per frame. For a 1-frame stimulus (16.67ms at 60Hz), that jitter can double the display duration.

### But useRef Eliminates This Entirely

The critical insight: **useRef mutations do not trigger reconciliation.** This is not a workaround -- it is by design. React's documentation explicitly states that `useRef` creates a mutable reference object whose `.current` property can be updated without causing re-renders. When the rAF callback reads and writes only via refs:

- Zero fiber nodes are created
- Zero diffing occurs
- Zero effects fire
- Zero DOM updates are scheduled

The rAF callback runs as pure JavaScript, exactly as it would in vanilla JS or any other framework. The VDOM is not on the critical path. React's reconciliation cost is **literally zero** during stimulus presentation because nothing triggers it.

### React.memo Provides the Belt to useRef's Suspenders

Wrapping the canvas host component in `React.memo` with stable props (which it naturally has -- the canvas element does not change) means React's parent re-renders (e.g., session state changes, UI updates) do not cascade into the canvas component. The canvas component returns the same `<canvas>` element every time, so even if reconciliation runs on the parent tree, the canvas subtree is skipped entirely.

### When VDOM *Does* Matter

The VDOM *does* run when transitioning between app screens (IDLE to RUNNING, RUNNING to POST_SESSION), updating response buttons, and showing results. These are low-frequency updates (1-2 per trial, not 60/second) where React's declarative model is genuinely helpful and reconciliation overhead is negligible.

**Confidence: HIGH.** This is well-established React architecture documented across multiple authoritative sources (MDN, CSS-Tricks, React docs). The jspsych-psychophysics plugin validates the identical pattern (rAF + canvas, framework-independent timing loop) for published psychophysics research.

---

## Question 2: Does Svelte/Preact Eliminate Timing Issues That React Cannot?

**Verdict: No. Once canvas is isolated from the framework (which both proposals do), the framework choice is irrelevant to timing. The rAF loop runs identically in React, Svelte, Preact, or vanilla JS.**

### The Timing-Critical Path is Framework-Independent

Here is what executes during each frame of stimulus presentation:

```
rAF callback fires ->
  read frameCount from ref/variable ->
  compare to target frames ->
  call ctx.clearRect() ->
  call ctx.beginPath() / ctx.arc() / ctx.fill() ->
  increment frameCount ->
  call requestAnimationFrame(self)
```

This is pure imperative JavaScript + Canvas API calls. There is no framework code in this path. In React, this code lives inside a `useCallback` that reads from `useRef`. In Svelte, it would live inside an `onMount` callback that reads from a `let` variable. In Preact, identical to React. In vanilla JS, it lives in a module-scoped function.

**The generated machine code is the same.** The browser's JS engine does not know or care whether the function was created inside a React component, a Svelte component, or a plain `<script>` tag.

### What Svelte/Preact Actually Eliminate

Svelte and Preact eliminate overhead in the **UI layer** -- the response buttons, screen transitions, session state display. This overhead is:

- In React: ~1-5ms per reconciliation pass on a component tree of this size (~10-20 components)
- In Svelte: ~0.1-0.5ms for surgical DOM updates
- In Preact: ~0.5-2ms for lightweight VDOM diff

This 1-5ms difference occurs **between trials** (when the user taps a response button and the UI updates), not during stimulus presentation. At that moment, the user is looking at buttons and reading feedback -- an extra 4ms of UI update time is imperceptible.

### Svelte's Advantage is Real but Misplaced

Svelte genuinely produces smaller bundles (~6.8KB vs ~40KB for React+ReactDOM compressed), uses ~20% less memory, and renders DOM updates 3-7x faster in synthetic benchmarks. These are real advantages -- for apps where DOM manipulation frequency is the bottleneck. Cognify's bottleneck is not DOM manipulation. It is canvas frame timing. Svelte's compiler cannot optimize `ctx.arc()` or `requestAnimationFrame()` -- those are browser-native APIs that execute identically regardless of framework.

### Preact's rAF Timing Quirk

There is an open issue (preactjs/preact#4826) documenting that Preact's requestAnimationFrame behavior differs from React 19's in edge cases around batching. For a project where rAF timing is the core product, introducing a framework with known rAF behavioral differences is an unnecessary risk.

**Confidence: HIGH.** The architectural isolation of canvas from framework is well-documented. The jspsych-psychophysics plugin runs inside jsPsych (which uses vanilla JS for its core) and achieves the same timing accuracy as any framework-based implementation -- because the canvas/rAF path is framework-independent.

---

## Question 3: Is Offscreen Canvas Pre-Rendering Worth It?

**Verdict: No, not for Cognify. The shapes are too simple and too few for pre-rendering to provide meaningful benefit. It adds complexity with no measurable gain.**

### Cognify's Rendering Workload Per Frame

During stimulus presentation, the canvas draws:

- **1 central shape** (circle, square, triangle, etc.) -- 3-8 canvas path operations
- **0-1 peripheral targets** (small triangle) -- 3-5 path operations
- **0-2 distractor shapes** (in Exercise 3, future) -- 3-5 path operations each

Total per frame: **3-18 canvas path operations.** At 60fps, that is ~180-1080 path operations per second.

### The Pre-Rendering Break-Even Point

MDN and web.dev both recommend offscreen canvas pre-rendering "when you repeat the same drawing operations on each animation frame." The performance benefit comes from replacing N path operations with a single `drawImage()` call.

But `drawImage()` itself is not free. It involves:
1. Source rectangle calculation
2. Pixel data transfer between canvas buffers
3. Destination compositing

For a single 80x80px shape, `drawImage()` from an offscreen canvas and `beginPath() + arc() + fill()` are comparable in cost. The break-even point is roughly **50-100 path operations per shape** (complex SVG-like drawings, text rendering, gradient fills). Cognify's shapes use 3-8 path operations each -- well below the threshold where pre-rendering pays off.

### The Complexity Cost

Pre-rendering requires:
- Creating and managing offscreen canvas elements per shape
- Sizing them correctly (MDN: "the temporary canvas should fit snugly around the image")
- Scaling them for DPI (devicePixelRatio on the offscreen canvas too)
- Invalidating them on resize
- Managing a cache lifecycle

For 3-18 path operations per frame, this is over-engineering. The rendering budget at 60fps is 16.67ms per frame. Drawing 18 canvas paths takes approximately 0.1-0.3ms. There is no performance problem to solve.

### When Offscreen Canvas *Would* Be Worth It

- Pattern mask with hundreds of random noise elements (possible -- but even 200 random rectangles is ~1ms)
- Exercise 3 with multiple complex distractor shapes (future, and even then marginal)
- If telemetry shows frame drops during stimulus rendering (the alternative proposal correctly reserves this as a future optimization)

### Integer Coordinate Rounding: Adopt This

The alternative proposal's suggestion to round coordinates to integers IS worth adopting. Sub-pixel coordinates force the browser to perform anti-aliasing interpolation, which:
- Adds processing time per draw operation
- Makes shape edges fuzzy (directly relevant to shape discrimination tasks)
- Is trivially implemented: `Math.round(x)` or `(x + 0.5) | 0`

This is a zero-cost, zero-complexity optimization that improves both performance AND stimulus clarity. Adopt it unconditionally.

**Confidence: HIGH for the recommendation to skip pre-rendering. MDN and web.dev documentation align.** MEDIUM for the exact performance numbers (these are estimates from documentation, not measured in Cognify specifically).

---

## Question 4: performance.now() Delta Timing vs. Pure Frame Counting

**Verdict: Use both. They serve complementary purposes. Frame counting is the primary timing mechanism for stimulus display duration. performance.now() delta timing is the validation and telemetry layer.**

### Why Frame Counting Must Remain Primary for Stimulus Display

The psychophysics literature is unambiguous: **stimulus durations should be specified in frames, not milliseconds.** This is because:

1. The minimum displayable duration IS one frame. You cannot display a stimulus for 10ms at 60Hz -- you get either 0ms (nothing) or 16.67ms (one frame).
2. Frame counting aligns with vsync. When you say "display for 3 frames," the browser guarantees 3 vertical refresh cycles of display. When you say "display for 50ms," the browser rounds to the nearest frame boundary anyway.
3. Frame counts are reproducible across identical hardware. A "3 frame" stimulus is exactly 3 frames. A "50ms" stimulus might be 3 frames (49.95ms) or sometimes 2 frames (33.3ms) due to rounding at the vsync boundary.

The jspsych-psychophysics plugin explicitly recommends specifying presentation times in frames rather than milliseconds for strict timing control. Their FAQ states this based on empirical measurement of multimodal duration distributions when using millisecond targets.

### Why performance.now() Delta Timing Is Valuable as a Companion

Delta timing (measuring `performance.now()` difference between rAF callbacks) serves critical purposes that pure frame counting cannot:

1. **Refresh rate detection.** There is no Web API to query display refresh rate (confirmed by WHATWG HTML issue #8031). Measuring rAF callback deltas over ~60 frames is the standard approach to determine `msPerFrame`. Cognify already plans to do this (CANV-06).

2. **Dropped frame detection.** If `deltaTime > 1.5 * expectedFrameTime`, a frame was dropped. The frame counter still incremented once (one rAF callback), but the stimulus was visible for 2 physical frames. Without delta timing, you would not know the trial's timing was corrupted. With it, you can flag the trial.

3. **Cross-device threshold comparison.** A "3 frame" stimulus is 50ms at 60Hz but 25ms at 120Hz. To compare thresholds across devices meaningfully, you need the actual millisecond duration: `thresholdMs = thresholdFrames * measuredMsPerFrame`.

4. **Variable refresh rate displays (VRR/FreeSync/G-Sync).** On VRR monitors, frame duration is not constant. A "3 frame" stimulus could be 45ms, 50ms, or 55ms depending on GPU load. Delta timing provides the actual elapsed time for each trial, enabling post-hoc timing validation.

### The Combined Approach

```javascript
// In rAF callback:
const now = performance.now();
const deltaMs = now - lastTimestamp;
lastTimestamp = now;

// Frame counting drives stimulus display (PRIMARY):
frameCount++;
if (frameCount >= targetFrames) {
  transitionToNextPhase();
}

// Delta timing provides validation (SECONDARY):
if (deltaMs > expectedFrameTime * 1.5) {
  currentTrial.droppedFrames++;
  currentTrial.timingCompromised = true;
}

// Record actual elapsed time for the stimulus phase:
if (phase === 'STIMULUS' && frameCount === targetFrames) {
  currentTrial.actualDisplayMs = now - stimulusOnsetTimestamp;
}
```

This gives you:
- Frame counting for deterministic stimulus control (primary)
- Delta timing for quality validation (secondary)
- Actual elapsed milliseconds for cross-device comparison (telemetry)

### Why performance.now() Should NOT Replace Frame Counting

The alternative proposal suggests "performance.now() delta timing for hardware-agnostic refresh rate handling." This implies using elapsed milliseconds as the primary timing unit:

```javascript
// PROBLEMATIC approach:
elapsedMs += deltaMs;
if (elapsedMs >= targetDurationMs) {
  transitionToNextPhase();
}
```

This has a subtle but critical flaw: **it can cause a stimulus to display for N or N+1 frames unpredictably.** If `targetDurationMs = 50` and `msPerFrame = 16.67`:
- Frame 1: elapsed = 16.67 (< 50, continue)
- Frame 2: elapsed = 33.34 (< 50, continue)
- Frame 3: elapsed = 50.01 (>= 50, transition) -- 3 frames, correct
- BUT if frame 2 was slightly delayed: elapsed = 34.2, then frame 3: elapsed = 50.87 -- still 3 frames, correct
- BUT if frame 2 was slightly early: elapsed = 32.8, then frame 3: elapsed = 49.47 (< 50!), frame 4: elapsed = 66.14 -- **4 frames, wrong!**

The 1ms jitter around the frame boundary creates a coin-flip between N and N+1 frames. Frame counting eliminates this entirely: 3 frames is always 3 frames.

**Confidence: HIGH.** The psychophysics literature, jspsych-psychophysics implementation, and PsychoPy documentation all agree that frame counting is the correct primary mechanism for stimulus duration control. Delta timing as validation is standard practice.

---

## Question 5: Shipping Velocity Impact of Svelte vs React

**Verdict: Switching to Svelte would cost 2-5 days of velocity on a hackathon project. The performance benefit is zero for the timing-critical path. Stay with React.**

### The Hard Constraints

From PROJECT.md:
- **Stack constraint:** "React (.jsx), Tailwind CSS, Recharts"
- **Timeline:** "Hackathon -- shipping tonight"
- **Team familiarity:** Implied React knowledge (project spec was written in React terms)

### Velocity Cost of Svelte Migration

Even though Svelte has a gentler learning curve than React, and experienced React developers can transition in days, the switch involves:

1. **New project scaffolding** -- Vite + Svelte template instead of Vite + React (~30 min)
2. **Learning Svelte's reactivity model** -- `$state`, `$derived`, `$effect` runes in Svelte 5 differ significantly from `useState`/`useEffect` (~2-4 hours to be productive)
3. **Component architecture translation** -- All planned component boundaries (Session State Machine, Response Panel, etc.) need rethinking in Svelte's paradigm (~2-4 hours)
4. **Recharts is React-only** -- Would need to find a Svelte charting alternative (chart.js, layercake) or build custom (~2-4 hours when needed)
5. **Vitest canvas mock setup** -- Different for Svelte component testing (requires @testing-library/svelte instead of React) (~1-2 hours)
6. **Existing research invalidated** -- STACK.md, ARCHITECTURE.md code examples are all React-specific. Patterns need re-derivation. (~unknown)
7. **Unknown unknowns** -- First project in a new framework always has surprises (~2-8 hours of debugging)

Total estimated overhead: **8-22 hours** -- on a project with a "shipping tonight" deadline.

### Velocity Cost of Preact Migration

Preact is closer to React (preact/compat provides React API compatibility), so the migration cost is lower:

1. **Alias setup** -- Configure Vite to alias react/react-dom to preact/compat (~15 min)
2. **Compatibility testing** -- Verify Recharts, vitest-canvas-mock, etc. work with preact/compat (~1-2 hours)
3. **rAF timing quirk investigation** -- Documented behavioral difference (issue #4826) requires testing (~1-2 hours)
4. **Risk of subtle incompatibilities** -- preact/compat is "mostly" compatible, not fully compatible (~unknown debugging time)

Total estimated overhead: **2-5 hours** -- lower risk but nonzero, and the performance benefit during stimulus presentation is zero.

### The Blunt Answer

Switching frameworks to optimize UI rendering when the UI rendering is not the bottleneck is a textbook premature optimization. The bottleneck is canvas frame timing. Both proposals isolate canvas from the framework. The framework is irrelevant to the bottleneck.

React's VDOM overhead during response button updates (~3-5ms) is invisible to the user. Svelte's surgical DOM updates during response button updates (~0.3-0.5ms) are equally invisible to the user. Neither affects stimulus timing.

**Confidence: HIGH.** The velocity costs are well-established in framework migration literature. The irrelevance of framework choice to canvas timing is demonstrated by the architecture analysis in Questions 1-2.

---

## Quick Comparison Matrix

| Criterion | Proposal A (React + mitigations) | Proposal B (Svelte/Preact + optimizations) | Verdict |
|-----------|----------------------------------|-------------------------------------------|---------|
| **Stimulus timing accuracy** | Frame counting via useRef -- identical to vanilla JS | Frame counting via let/variable -- identical to vanilla JS | **Tie.** Both achieve frame-accurate timing. |
| **VDOM overhead during stimulus** | Zero (useRef + React.memo bypass reconciliation) | Zero (Svelte has no VDOM; Preact's is lighter but also bypassed) | **Tie.** Neither runs framework code during rAF. |
| **VDOM overhead during UI updates** | ~1-5ms per reconciliation | ~0.1-2ms per update | **Proposal B wins, but irrelevant.** UI updates happen between trials. |
| **Bundle size** | ~40KB React+ReactDOM (compressed) | ~6.8KB Svelte / ~3KB Preact (compressed) | **Proposal B wins, but marginal impact.** App loads once. |
| **Memory usage** | ~20% higher than Svelte | ~20% lower (Svelte) | **Proposal B wins slightly.** Not relevant at this app's scale. |
| **Offscreen canvas pre-rendering** | Not proposed | Proposed | **Unnecessary.** 3-18 path ops/frame, well under benefit threshold. |
| **performance.now() delta timing** | Not proposed (frame-only) | Proposed as primary | **Partial adopt.** Use as companion/validation, not replacement. |
| **Integer coordinate rounding** | Not proposed | Proposed | **Adopt.** Zero cost, improves clarity + slight perf gain. |
| **Full-screen canvas takeover** | Not proposed | Proposed (unmount all UI during exercise) | **Unnecessary.** React.memo + useRef already isolates canvas. |
| **Shipping velocity** | Zero migration cost | 8-22h (Svelte) / 2-5h (Preact) | **Proposal A wins decisively.** |
| **Recharts compatibility** | Native | Requires alternative library | **Proposal A wins.** Recharts is spec-mandated. |
| **Team knowledge** | Assumed known | Unknown / learning curve | **Proposal A wins.** Known stack ships faster. |
| **Ecosystem maturity** | Largest (npm packages, tutorials, hiring) | Growing but smaller | **Proposal A wins.** More resources for debugging. |

---

## Addressing the "Full-Screen Canvas Takeover" Idea

The alternative proposal suggests unmounting all React UI during exercises, leaving only the canvas. This deserves separate analysis because it sounds architecturally clean.

### Why It Sounds Good

- Zero possibility of React reconciliation interfering with canvas
- Simpler mental model: "canvas mode" vs "UI mode"
- Maximum GPU/CPU budget for canvas rendering

### Why It Does Not Work for Cognify

1. **Response buttons must appear immediately after the mask phase.** The trial sequence is: fixation -> stimulus -> mask -> **response prompt** -> user response. The response prompt is React UI (buttons showing shapes, or an 8-position picker for Exercise 2). If you unmounted all React UI, you now need to remount it within the same rAF frame that ends the mask phase. React's mount lifecycle is not instant -- it involves component creation, effect scheduling, and DOM insertion. This introduces 5-50ms of latency between mask offset and response availability, which corrupts reaction time measurements.

2. **Response buttons need to be disabled during stimulus phases, not absent.** The requirement TRAL-02 specifies "response buttons disabled during fixation, stimulus, and mask phases." Disabled buttons (CSS `pointer-events: none` or `disabled` attribute) are different from unmounted buttons. Disabled buttons have zero rendering cost (no re-renders needed) and are available instantly when re-enabled.

3. **React.memo already achieves the same isolation.** A `React.memo`-wrapped canvas component with stable props will not re-render when parent state changes. The canvas component's `useRef`-based rAF loop runs independently. There is no reconciliation to prevent because there is nothing triggering it.

4. **You lose layout stability.** Unmounting UI around the canvas means the canvas potentially resizes (layout reflow) as surrounding elements appear/disappear. This is the opposite of stable stimulus presentation conditions.

### The Correct Approach

Keep React UI mounted but inert during stimulus phases. Disable interactions via state (`isResponseEnabled`). The canvas renders on its own canvas element via rAF. React's reconciliation never touches the canvas element because nothing about it changes. This is the pattern documented in ARCHITECTURE.md and it is correct.

---

## Final Recommendation

**Stay with React 19.2. Cherry-pick two ideas from Proposal B. Discard the rest.**

### Adopt from Proposal B

1. **Integer coordinate rounding.** Add `Math.round()` (or `(x + 0.5) | 0` for micro-optimization) to all canvas coordinate calculations. Zero effort, measurable benefit to both rendering performance and stimulus visual clarity. Shapes are the task -- crisp edges matter.

2. **performance.now() delta timing as a companion layer.** Keep frame counting as the primary mechanism for stimulus display control. Add delta timing for: refresh rate detection at startup, dropped frame detection during trials, actual elapsed time recording for cross-device threshold comparison. This is approximately 20 lines of additional code in the rAF callback.

### Discard from Proposal B

1. **Framework swap (Svelte/Preact).** Zero benefit to timing accuracy. Significant velocity cost. Breaks Recharts compatibility. Solves a problem that does not exist once canvas is isolated via useRef.

2. **Full-screen canvas takeover (unmount all UI).** React.memo + useRef already achieves zero reconciliation overhead during stimulus presentation. Unmounting UI means remounting it for response capture, introducing latency at the worst possible moment (reaction time measurement onset).

3. **Offscreen canvas pre-rendering for geometric shapes.** Cognify draws 1-3 shapes per frame with 3-8 path operations each. The rendering budget consumed is approximately 0.1-0.3ms out of a 16.67ms frame. Pre-rendering adds complexity (offscreen canvas management, DPI scaling, resize invalidation, cache lifecycle) for zero measurable benefit.

### The Architecture That Ships

```
React 19.2 (declarative UI) <----> Canvas Engine (imperative rAF loop)
                                    |
         useRef bridge              |-- Frame counting (primary timing)
         React.memo barrier         |-- performance.now() deltas (validation)
                                    |-- Integer coordinates (all draws)
                                    |-- Dropped frame detection (telemetry)
```

This architecture gives you:
- Frame-accurate stimulus timing (proven by jspsych-psychophysics in published research)
- Zero framework overhead during stimulus presentation
- Declarative UI for screens, buttons, and results
- Cross-device timing validation via delta measurements
- Shipping velocity on a known stack with a known ecosystem

---

## Impact on Existing Research Files

This comparison analysis does not change the recommendations in STACK.md, ARCHITECTURE.md, FEATURES.md, or PITFALLS.md. It does suggest two minor additions:

### Addition to ARCHITECTURE.md Pattern 1 (Ref-Based Animation State)

Add delta timing validation inside the rAF callback:

```javascript
// Inside animate():
const now = performance.now();
const deltaMs = now - lastTimestampRef.current;
lastTimestampRef.current = now;

// Flag dropped frames
if (deltaMs > expectedFrameTimeRef.current * 1.5) {
  trialDataRef.current.droppedFrames++;
}
```

### Addition to PITFALLS.md

**Minor Pitfall: Sub-pixel coordinate anti-aliasing.**
Canvas coordinates at non-integer values force anti-aliasing interpolation, producing fuzzy shape edges. Since shape discrimination is the cognitive task, fuzzy edges could affect measurement validity. Round all coordinates with `Math.round()` before drawing.

---

## Sources

### React Architecture and VDOM
- [Mastering useRef: Why it Does Not Trigger Re-renders](https://dev.to/samabaasi/mastering-useref-why-it-doesnt-trigger-re-renders-and-how-it-persists-across-re-renders-1l2b) -- useRef does not trigger reconciliation (HIGH confidence)
- [CSS-Tricks: requestAnimationFrame with React Hooks](https://css-tricks.com/using-requestanimationframe-with-react-hooks/) -- established pattern for canvas animation in React (HIGH confidence)
- [DEV Community: Animation with Canvas and requestAnimationFrame in React](https://dev.to/ptifur/animation-with-canvas-and-requestanimationframe-in-react-5ccj) -- useRef isolation pattern (HIGH confidence)
- [React 19 Concurrent Rendering Deep Dive](https://medium.com/@ignatovich.dm/react-19s-engine-a-quick-dive-into-concurrent-rendering-6436d39efe2b) -- concurrent rendering default in React 19, double-buffering architecture (MEDIUM confidence)

### Svelte/Preact Comparison
- [DEV Community: React vs Svelte Performance Benchmarking](https://dev.to/im_sonujangra/react-vs-svelte-a-performance-benchmarking-33n4) -- 3-7.5x faster DOM updates, 6x smaller bundle (MEDIUM confidence)
- [Preact rAF timing issue #4826](https://github.com/preactjs/preact/issues/4826) -- documented behavioral difference from React 19 (HIGH confidence)
- [The Frontend Company: Svelte vs React 2026](https://www.thefrontendcompany.com/posts/svelte-vs-react) -- learning curve and migration costs (MEDIUM confidence)
- [Svelte vs React: Which Framework for 2026](https://www.aceinfoway.com/blog/svelte-vs-react-guide) -- ecosystem comparison (MEDIUM confidence)

### Canvas Optimization
- [MDN: Optimizing Canvas](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas) -- pre-rendering, integer coordinates, state changes (HIGH confidence)
- [web.dev: Improving Canvas Performance](https://web.dev/articles/canvas-performance) -- offscreen canvas sizing, batch rendering (HIGH confidence)
- [AG Grid: Optimising HTML5 Canvas Rendering](https://blog.ag-grid.com/optimising-html5-canvas-rendering-best-practices-and-techniques/) -- pre-rendering break-even analysis (MEDIUM confidence)

### Timing and Psychophysics
- [jspsych-psychophysics FAQ](https://jspsychophysics.hes.kyushu-u.ac.jp/faq/) -- frames over milliseconds for strict timing (HIGH confidence)
- [jspsych-psychophysics plugin paper (Behavior Research Methods)](https://link.springer.com/article/10.3758/s13428-020-01445-w) -- rAF + canvas timing accuracy validation (HIGH confidence)
- [jsPsych Timing Accuracy](https://www.jspsych.org/v7/overview/timing-accuracy/) -- official timing guidance (HIGH confidence)
- [PLOS ONE: Millisecond Timing in Online Experiments](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0235249) -- rAF achieves PsychoToolbox-comparable accuracy (HIGH confidence)
- [WHATWG HTML issue #8031](https://github.com/whatwg/html/issues/8031) -- no web API for refresh rate query (HIGH confidence)
- [Springer: Psychophysics in a Web Browser](https://link.springer.com/article/10.3758/s13428-015-0567-2) -- browser-based timing validation (HIGH confidence)
- [Chris Courses: Standardize Framerate](https://chriscourses.com/blog/standardize-your-javascript-games-framerate-for-different-monitors) -- delta timing for variable refresh rates (MEDIUM confidence)
- [Kirupa: Consistent Animation Speeds](https://www.kirupa.com/animations/ensuring_consistent_animation_speeds.htm) -- delta time approach (MEDIUM confidence)

---
*Rendering and timing stack comparison for: Cognify -- adaptive cognitive speed training web app*
*Researched: 2026-03-21*
