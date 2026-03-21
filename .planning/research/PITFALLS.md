# Domain Pitfalls

**Domain:** Frame-accurate canvas-based adaptive cognitive training app
**Researched:** 2026-03-21
**Updated:** 2026-03-21 (added data architecture pitfalls)

## Critical Pitfalls

Mistakes that cause rewrites or major issues.

### Pitfall 1: Using React State for Animation Loop Variables
**What goes wrong:** Storing frame count, trial phase, or display duration in `useState` causes React to re-render the component tree on every frame (60 times/second). Each re-render takes 1-16ms, which corrupts frame timing. A stimulus meant to display for 1 frame (16.67ms) might display for 2-3 frames because reconciliation delayed the next rAF callback.
**Why it happens:** React developers instinctively reach for `useState` for all mutable data. But the animation loop operates outside React's paradigm -- it needs synchronous, zero-overhead mutation.
**Consequences:** Timing is wrong. The entire psychophysics protocol is invalid. Users train at incorrect difficulty levels. Results are meaningless.
**Prevention:** Use `useRef` for ALL state that is read or written inside `requestAnimationFrame`. Only use `useState` for values that should trigger UI re-renders (screen transitions, results display).
**Detection:** If you see `setState` inside a `requestAnimationFrame` callback, it is wrong. Profile with React DevTools -- if component re-renders > 1/second during stimulus presentation, there is a problem.

### Pitfall 2: setTimeout/setInterval for Stimulus Display Duration
**What goes wrong:** `setTimeout(() => clearStimulus(), 16.67)` does not guarantee the stimulus displays for exactly one frame. The timer may fire 4-32ms late depending on browser task queue congestion, GC pauses, and event loop state.
**Why it happens:** Developers think "16.67ms = 1 frame" and use setTimeout. But setTimeout is not synced to the display refresh cycle. The browser may execute the callback mid-frame or skip a vsync boundary entirely.
**Consequences:** Stimulus durations are inconsistent. A "1 frame" stimulus might show for 0, 1, or 2 actual frames. The staircase algorithm receives incorrect difficulty feedback. Thresholds are unreliable.
**Prevention:** Count frames, not milliseconds. In the rAF loop: `if (frameCount >= targetFrames) { transition to mask }`. The rAF callback fires once per vsync by design.
**Detection:** If your stimulus timing code contains `setTimeout`, `setInterval`, or `Date.now()` for display duration control, it is wrong. Frame counting is the only correct approach.

### Pitfall 3: AudioContext Autoplay Policy Crash
**What goes wrong:** Creating an `AudioContext` outside a user gesture (e.g., on module load or in useEffect) results in a suspended context. Attempting to play sounds produces silence. On some browsers, it throws a warning. The first feedback sound fails silently.
**Why it happens:** Modern browsers (Chrome, Firefox, Safari) enforce autoplay policies that prevent audio playback until the user has interacted with the page. This is a security/UX policy, not a bug.
**Consequences:** No audio feedback on first trial. User thinks the app is broken. If you try to "fix" it by creating the context on page load and hoping `resume()` works, you get inconsistent behavior across browsers.
**Prevention:** Create or resume the AudioContext inside a click/tap event handler. The simplest approach: create a singleton module that lazily initializes the context on first `playTone()` call, which will always happen after a user interaction (tapping the "Start Session" button). Include a `resume()` call if context is suspended.
**Detection:** Audio works on desktop Chrome but not on mobile Safari = autoplay policy issue.

### Pitfall 4: Canvas Not Matching Display Pixel Density
**What goes wrong:** On high-DPI displays (Retina, 2x/3x mobile screens), canvas renders at CSS pixels, not device pixels. Shapes appear blurry. Text is unreadable. The fixation cross looks fuzzy.
**Why it happens:** A `<canvas width="300" height="300">` renders a 300x300 pixel buffer. On a 2x display, that buffer is stretched to 600x600 CSS pixels, causing blur.
**Consequences:** Visual quality is poor. For a psychophysics app where stimulus discriminability matters, blurry shapes could affect task difficulty in uncontrolled ways.
**Prevention:** Scale canvas buffer by `window.devicePixelRatio`:
```jsx
const dpr = window.devicePixelRatio || 1;
canvas.width = canvas.clientWidth * dpr;
canvas.height = canvas.clientHeight * dpr;
ctx.scale(dpr, dpr);
```
**Detection:** Stimuli look blurry on phone/tablet but crisp on a 1x desktop monitor.

### Pitfall 5: Staircase Algorithm Off-by-One in Direction Tracking
**What goes wrong:** The 3-Up/1-Down staircase must track "reversals" -- moments when the direction of difficulty change reverses (getting harder -> getting easier, or vice versa). Off-by-one errors in tracking consecutive correct responses or reversal detection cause incorrect threshold estimates.
**Why it happens:** The logic "3 correct in a row = decrease duration" and "1 incorrect = increase duration" seems simple, but edge cases abound: what happens at the minimum display (1 frame)? When do you count a reversal -- before or after the step? Do you reset the consecutive counter on reversal?
**Consequences:** Threshold converges to wrong value. Training is too easy or too hard. Clinical validity is compromised.
**Prevention:** Implement the staircase as a pure function with comprehensive unit tests. Test: 3 correct -> step down, 1 incorrect -> step up, reversal on direction change, minimum clamp at 1 frame, consecutive counter reset after step.
**Detection:** Run a simulated session with known response patterns and verify reversal points match expected values.

### Pitfall 6: Safari ITP 7-Day localStorage Eviction
**What goes wrong:** Safari deletes ALL script-writable storage -- localStorage, IndexedDB, and Service Worker registrations -- for origins not visited within 7 days. A user who misses one week of training loses their entire profile and session history. This has been WebKit policy since Safari 13.1 / iOS 13.4.
**Why it happens:** Apple's Intelligent Tracking Prevention (ITP) originally targeted third-party cookies, then expanded to cap all script-writable storage at 7 days. This is a privacy feature designed to prevent cross-site tracking, but it catches single-page training apps as collateral damage.
**Consequences:** Total data loss. User loses baseline threshold, session history, Exercise 2 unlock progress, and training continuity. For elderly users who are the target demographic, this could mean losing weeks of training data after a hospital stay or vacation.
**Prevention:**
1. **Short term (v1):** Add a JSON export/download button so users can manually back up data. Include a "last active" timestamp and warn users who return after 6+ days that their data may be at risk.
2. **Medium term (v1.1):** Add server-side persistence (Supabase) so data survives client-side eviction. localStorage becomes a cache, not the source of truth.
3. **Long term:** Request persistent storage via `navigator.storage.persist()` (Safari 17+ supports this). Note: this requests but does not guarantee persistence -- the browser may still deny.
**Detection:** User reports "all my progress is gone" after not using the app for a week, specifically on Safari/iOS. Reproduce by not visiting the origin for 7 days in Safari.
**Note:** IndexedDB is equally affected by ITP. The alternative proposal's "IndexedDB as offline buffer" does NOT survive Safari's 7-day eviction any better than localStorage. Both are "script-writable storage" under ITP. Server-side persistence is the only reliable solution.

## Moderate Pitfalls

### Pitfall 1: Canvas Resize Handling on Window/Orientation Change
**What goes wrong:** Canvas dimensions are set once on mount but not updated when window resizes or device orientation changes. Shapes render at wrong positions or get clipped.
**Prevention:** Listen for `resize` events (debounced). Recalculate canvas dimensions with DPI scaling. Recompute peripheral target positions (they depend on canvas size for the 70-80% edge distance calculation).

### Pitfall 2: Memory Leak from Uncleared requestAnimationFrame
**What goes wrong:** Component unmounts but the rAF loop keeps running. The callback references the old canvas context. Browser throws errors or leaks memory.
**Prevention:** Store the rAF ID in a ref. Cancel it in the useEffect cleanup function: `return () => cancelAnimationFrame(frameIdRef.current)`. ALWAYS cancel before starting a new loop.

### Pitfall 3: Reaction Time Measurement Starting at Wrong Point
**What goes wrong:** Timer starts at stimulus onset instead of response prompt appearance. This conflates processing speed with reaction time, corrupting the data.
**Prevention:** Start the reaction timer ONLY when the response panel becomes visible (after mask phase). The timestamp should use `performance.now()` for sub-millisecond precision.

### Pitfall 4: JSON.parse Crash on Corrupt localStorage Data
**What goes wrong:** User clears localStorage partially, another tab writes incompatible data, or storage fills up. `JSON.parse(localStorage.getItem('key'))` throws, crashing the app.
**Prevention:** ALWAYS wrap localStorage reads in try-catch. Return default values on parse failure. Validate schema version after successful parse.

### Pitfall 5: Oscillator Click/Pop on Sound Start/Stop
**What goes wrong:** Starting or stopping an oscillator abruptly creates an audible click or pop sound. This is distracting and sounds unprofessional.
**Prevention:** Use GainNode to create a short envelope: ramp gain from 0 to target over ~5ms at start, and from target to 0 over ~10ms at end. Never start an oscillator at full volume.

### Pitfall 6: Peripheral Target Positions Hardcoded to Specific Canvas Size
**What goes wrong:** Exercise 2 places peripheral targets at 8 positions around an elliptical path at "70-80% distance from center to edge." If positions are calculated for a 400x400 canvas but the canvas is 800x600, targets appear at wrong proportions.
**Prevention:** Calculate positions as percentages of canvas dimensions, not absolute pixels. Use `canvasWidth * 0.75` and `canvasHeight * 0.75` for the ellipse radii.

### Pitfall 7: Calling localStorage Directly Instead of Through an Abstraction
**What goes wrong:** Application code calls `localStorage.getItem()` and `localStorage.setItem()` directly in components, hooks, and utilities. When you later need to add server-side persistence (Supabase, Firebase, etc.), you must find and modify every call site. Some get missed, causing data to split between localStorage and the backend.
**Why it happens:** localStorage is simple and direct. The abstraction feels unnecessary when you only have 2 keys. But the number of call sites grows faster than expected.
**Consequences:** Painful backend migration. Data inconsistencies. Some sessions saved locally but not synced. Some profile updates missed.
**Prevention:** Build a DataService module from day one. All application code calls `DataService.saveSession()`, never `localStorage.setItem()` directly. The DataService internally uses localStorage tonight and can be swapped to Supabase later without touching any callers.
**Detection:** Grep the codebase for `localStorage.` -- if it appears anywhere outside the DataService module, it is wrong.

### Pitfall 8: Premature Backend Integration Blocking Core Validation
**What goes wrong:** Developer spends hours integrating Supabase Auth, RLS policies, sync logic, and consent flows before the core timing engine and staircase algorithm are validated. The backend works, but the psychophysics protocol has subtle bugs (wrong reversal tracking, incorrect frame counting, bad mask timing) that go undetected because effort was spent on infrastructure instead of core logic.
**Why it happens:** The backend feels like "real engineering" and the data loss risk feels urgent. But the data you are persisting has no value if the measurements are wrong.
**Consequences:** Scientifically invalid data stored durably in PostgreSQL. Worse than losing valid data from localStorage -- you now have a false sense of validated data.
**Prevention:** Validate the core protocol first. Ship localStorage-only. Verify: does the staircase converge? Are thresholds in the expected range (50-500ms)? Does frame counting match actual display time? Only then add server-side persistence.

## Minor Pitfalls

### Pitfall 1: Pattern Mask Not Random Enough
**What goes wrong:** A static or low-entropy mask fails to effectively disrupt the retinal afterimage. The stimulus remains partially visible after offset.
**Prevention:** Generate random rectangles/pixels across the stimulus area. Different random seed each trial. The mask should be visually noisy, not patterned.

### Pitfall 2: Touch Targets Too Small on Mobile
**What goes wrong:** Response buttons below 48x48px are hard to tap accurately on touchscreens, causing accidental mis-taps that corrupt staircase data.
**Prevention:** Minimum 48x48px touch targets (per WCAG). Project spec suggests 64x64px as ideal. Use Tailwind spacing utilities to enforce.

### Pitfall 3: Session Data Growing Unbounded
**What goes wrong:** Each session stores per-trial data (30 trials x 2 blocks = 60 objects). After 100+ sessions, localStorage approaches its ~5MB limit.
**Prevention:** Store summary data (threshold, accuracy, improvement) for all sessions. Store per-trial detail only for the last N sessions (e.g., 20). Prune on save.

### Pitfall 4: Dev Toggle Left Enabled in Production
**What goes wrong:** The Exercise 2 unlock gate bypass is meant for testing but accidentally shipped enabled, allowing users to skip the progressive protocol.
**Prevention:** Gate behind a specific localStorage flag or URL parameter that is not discoverable by normal users. Do not use a visible UI toggle in production.

### Pitfall 5: Applying External Normative Data to an Incompatible Test
**What goes wrong:** Using NIH Toolbox or Cam-CAN percentile tables to rank CogSpeed users. The NIH Toolbox Pattern Comparison test measures same/different pattern matching; CogSpeed measures shape identification under time pressure. These are different cognitive tasks with different score distributions. A user's CogSpeed threshold does not map to NIH Toolbox percentiles.
**Prevention:** Do not present percentile rankings from external normative datasets. If percentile context is desired, either (a) use CogSpeed's own normative data collected from consenting users, or (b) show only rough age-bracket reference ranges with clear disclaimers about approximate comparability.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Canvas rendering engine | React state in rAF loop, setTimeout for timing | Ref-only architecture from day 1; frame counting pattern |
| Shape drawing | Blurry on high-DPI, wrong coordinates on resize | DPI scaling on init, resize handler |
| Staircase algorithm | Off-by-one in reversals, wrong threshold calculation | Pure function + exhaustive unit tests before integration |
| Audio feedback | Autoplay policy, oscillator click/pop | Lazy AudioContext init, gain envelope |
| Trial flow | Wrong reaction time start point, state machine bugs | Clear documentation of state transitions, integration tests |
| localStorage persistence | JSON.parse crash, unbounded growth, Safari ITP eviction | Try-catch everywhere, schema versioning, DataService abstraction, plan for server-side persistence |
| Exercise 2 | Peripheral positions wrong on resize, hardcoded canvas size | Relative positioning (percentages), resize recalculation |
| Data architecture | Direct localStorage calls scattered across codebase, premature backend | DataService abstraction from day 1, validate protocol before adding backend |
| Backend integration (v1.1) | RLS policy bugs (silent data loss), auth state management complexity | Test RLS policies exhaustively, use Supabase auth helpers |

## Sources

- [MDN requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame) -- timing precision, vsync behavior
- [MDN Web Audio API best practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices) -- autoplay policy, oscillator lifecycle
- [CSS-Tricks: requestAnimationFrame with React Hooks](https://css-tricks.com/using-requestanimationframe-with-react-hooks/) -- cleanup patterns, ref usage
- [OpenReplay: requestAnimationFrame in React](https://blog.openreplay.com/use-requestanimationframe-in-react-for-smoothest-animations/) -- memory leak prevention
- [Canvas devicePixelRatio handling](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Basic_animations) -- DPI scaling
- [Josh Comeau: localStorage in React](https://www.joshwcomeau.com/react/persisting-react-state-in-localstorage/) -- persistence patterns, error handling
- [Apple ITP 7-Day Storage Cap](https://support.didomi.io/apple-adds-a-7-day-cap-on-all-script-writable-storage) -- Safari script-writable storage eviction (HIGH confidence)
- [WebKit Storage Policy Updates](https://webkit.org/blog/14403/updates-to-storage-policy/) -- official eviction policies, navigator.storage.persist() (HIGH confidence)
- [NIH Toolbox Normative Data](https://pmc.ncbi.nlm.nih.gov/articles/PMC4542749/) -- why external norms do not apply (HIGH confidence)

---
*Domain pitfalls for: CogSpeed -- adaptive cognitive speed training web app*
*Researched: 2026-03-21*
*Updated: 2026-03-21 -- added Safari ITP eviction, DataService abstraction, premature backend, normative data pitfalls*
