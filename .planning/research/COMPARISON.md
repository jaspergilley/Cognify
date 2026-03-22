# Comparison: Original Plan vs Alternative Proposal -- Scope, Timeline, and Shipping Velocity

**Context:** Hackathon project. User says they are shipping TONIGHT.
**Date:** 2026-03-21
**Recommendation:** The original plan is already too large for tonight. The alternative proposal is 3-5x larger. Ship a ruthlessly scoped MVP using the original stack with half the current requirements cut.

---

## 1. Hour-by-Hour Estimate: Original Plan (57 Requirements)

The original plan has 57 v1 requirements across 8 categories. Here is a realistic time breakdown assuming an experienced developer with AI assistance (Claude Code generating code):

| Category | Req Count | Estimated Hours | Rationale |
|----------|-----------|-----------------|-----------|
| Canvas Rendering (CANV-01 to CANV-07) | 7 | 3-4h | DPI scaling, rAF loop, resize handling, refresh rate detection, visibility change. The rAF loop + DPI scaling alone is 1-2h to get right. Refresh rate measurement adds another hour. |
| Stimulus System (STIM-01 to STIM-08) | 8 | 3-4h | 12 distinct programmatic shapes is a lot of canvas path geometry. Fixation cross and mask are simple. Getting shapes visually distinct at small sizes requires iteration. |
| Staircase Algorithm (STRC-01 to STRC-10) | 10 | 2-3h | Pure logic, testable in isolation. But 10 requirements with edge cases (boundary clamping, spurious reversals, separate per exercise, session continuity) need careful unit testing. |
| Trial Engine (TRAL-01 to TRAL-08) | 8 | 3-4h | This is the hardest integration work. Wiring canvas phases to response UI, timing the transitions, disabling buttons at right moments, capturing RT correctly. |
| Session Manager (SESS-01 to SESS-08) | 8 | 2-3h | State machine, block structure, rest screens, stimulus pair rotation, post-session summary. Moderate complexity. |
| Exercise Logic (EXRC-01 to EXRC-09) | 9 | 3-4h | Exercise 1 is simpler (1-2h). Exercise 2 adds peripheral targets, 8-position response UI, two-phase response, and unlock gating -- that is another 2-3h minimum. |
| Data Persistence (DATA-01 to DATA-05) | 5 | 1-1.5h | localStorage wrapper, schema versioning, try-catch. Straightforward. |
| Audio System (AUDO-01 to AUDO-07) | 7 | 1-1.5h | Web Audio API oscillator tones. Singleton context. Gain envelope to avoid clicks. Relatively simple. |

**Subtotals:**
- Optimistic (AI-assisted, everything goes right): **18-20 hours**
- Realistic (debugging, edge cases, visual tuning): **22-28 hours**
- With project setup, Vite config, Tailwind setup, basic app shell, routing: **+1-2 hours**

**Total for original plan: 20-30 hours of focused work.**

That is 2.5 to 4 full working days. NOT one evening.

### Why the Estimates are This High

This is not a CRUD app. The core challenge is frame-accurate canvas rendering integrated with a React UI. Specific time sinks:

1. **12 programmatic shapes** (STIM-02): Drawing a circle is 2 lines. Drawing a pentagon, 5-point star, 6-point star, and arrows with correct canvas path operations, all visually distinct at 80x80px -- that is 30-60 minutes of fiddly geometry per shape.

2. **Trial engine integration** (TRAL-01 to TRAL-08): The canvas rAF loop must hand off to React buttons at exactly the right moment. This boundary is where most bugs will live. Getting the phase transitions right with proper button enable/disable timing is integration work that is hard to parallelize.

3. **Exercise 2 two-phase response** (EXRC-04 + EXRC-05): "Which object?" followed by "Where was the triangle?" with an 8-position radial picker is a non-trivial UI component that needs to work under time pressure.

4. **Session state machine** (SESS-01): Six states with defined transitions, entry/exit actions, and visual screens for each state. This is the orchestration layer that ties everything together.

---

## 2. Hour-by-Hour Estimate: Alternative Proposal Additions

The alternative adds these on top of the original 57 requirements:

| Addition | Estimated Hours | Rationale |
|----------|-----------------|-----------|
| **Framework switch to Svelte or Preact** | 4-8h | Not just "swap import." The entire architecture pattern changes. The existing research (STACK.md, ARCHITECTURE.md) documents React-specific patterns (useRef for animation state, callback refs, useEffect cleanup). Svelte has different reactive primitives. Preact is API-compatible but has subtle differences. You lose all the researched patterns and start re-discovering them. |
| **Supabase backend (PostgreSQL, Auth, RLS)** | 6-10h | Schema design, table creation, RLS policies, auth flow (sign up, sign in, forgot password, email verification), session data sync, error handling for offline, loading states, auth state management. This is a full backend integration, not a "drop-in." |
| **IndexedDB as offline buffer with sync** | 4-6h | IndexedDB is async, transaction-based, and significantly more complex than localStorage. Building a reliable offline buffer that syncs to Supabase when online requires conflict resolution, retry logic, queue management, and connectivity detection. This is a distributed systems problem. |
| **PWA deployment** | 2-3h | Service worker, manifest.json, offline caching strategy, install prompt. Not hard, but adds testing surface (does offline mode actually work?) and deployment complexity. |
| **Runtime device calibration system** | 3-5h | Measuring display latency, input latency, and frame timing variability per device. Building a calibration UI. Storing calibration results. Adjusting timing thresholds based on calibration. This is real psychophysics engineering. |
| **Bluetooth audio detection and fallback** | 3-5h | Web Bluetooth API is not universally supported (not on Firefox, limited on iOS). Detecting Bluetooth latency is not straightforward -- you cannot directly query audio device latency from JavaScript. Building fallback behavior adds conditional logic throughout the audio system. |
| **Data residency compliance (AWS ca-central-1, FIPPA/PIPA)** | 2-4h | This is not code -- it is infrastructure configuration, legal research, privacy policy drafting, and deployment pipeline setup for a specific AWS region. You need Supabase self-hosted or a Supabase project in the right region. |
| **Normative data integration (Cam-CAN, NIH Toolbox)** | 3-5h | Finding, downloading, parsing, and integrating normative datasets. Building percentile calculation logic. Validating against published norms. Displaying contextual percentile information. These datasets have specific licensing and format requirements. |
| **Privacy policy and informed consent flow** | 2-3h | Legal document drafting, consent checkbox UI, consent state tracking, data deletion capability (right to erasure), consent revocation flow. |
| **Security hardening (RLS, compliance roadmap)** | 2-4h | Writing and testing Row Level Security policies, audit logging, security headers, CORS configuration, API key management. |

**Total for alternative additions: 31-53 additional hours.**

**Combined total (original + alternative): 51-83 hours = 6-10 full working days.**

---

## 3. Which Alternative Additions Are Genuinely Valuable for a Hackathon MVP?

Ranked from "legitimately useful tonight" to "pure post-validation scope creep":

### Genuinely Useful (but still not for tonight)

**None of them.** Every single alternative addition is a post-validation concern. Here is why:

- **Supabase backend**: You do not know if the training protocol works correctly yet. Adding a backend before validating the core timing engine is building infrastructure for a product that might not work.
- **PWA**: Useful for deployment, but `npx serve dist` or Vercel deploy accomplishes "I can show someone" just as well for a hackathon.
- **Normative data**: Impressive for a demo, but the core value proposition is "does the staircase converge to a stable threshold?" You do not need percentile context to validate that.

### Reasonable Post-Validation Additions (Week 2-4)

- **Supabase Auth + basic data sync**: After you know the protocol works, adding cloud persistence and user accounts is the natural next step.
- **PWA with offline support**: After you have a working app worth installing.
- **Normative data percentile display**: After you have validated that your thresholds are in the right ballpark.

### Over-Engineering (Month 2+)

- **IndexedDB offline buffer with Supabase sync**: This is solving a problem that does not exist yet. localStorage works fine. Sync conflicts are a distributed systems problem.
- **Runtime device calibration**: This is research-grade psychophysics tooling. Consumer cognitive training apps (BrainHQ, Lumosity) do not do this. The rAF loop with frame counting is already "good enough" calibration.
- **Bluetooth audio detection**: Solving a problem that affects <5% of users and has no reliable browser API solution. Just use visual feedback as primary and audio as enhancement.
- **Data residency compliance (FIPPA/PIPA)**: You are building a hackathon MVP with localStorage. There is no data to comply about. This is a concern for a production health-data service, which this is not yet.
- **Privacy policy and informed consent**: Required for a production app handling health data. Not required for a hackathon prototype using localStorage on the user's own device.
- **Framework switch (Svelte/Preact)**: The existing research is React-specific. Switching frameworks throws away all the architectural patterns documented in ARCHITECTURE.md and STACK.md. The performance difference between React and Preact/Svelte is irrelevant -- the canvas rendering engine bypasses the framework entirely for timing-critical operations.

### Actively Harmful for Tonight

- **Framework switch**: You lose velocity. The research, patterns, and code examples are all React. Switching to Svelte means re-researching "how do I do useRef equivalent in Svelte" for every animation pattern.
- **Security hardening and compliance**: Creates a false sense of production-readiness for an unvalidated prototype. Time spent on RLS policies is time not spent on the staircase algorithm.

---

## 4. Is "Comprehensive" Depth (8-12 Phases) Realistic for Shipping Tonight?

**No. It is off by a factor of 5-10x.**

The math is simple:
- 57 requirements at 20-30 hours total
- "Tonight" means roughly 4-6 hours remaining (generous estimate)
- 4-6 hours / 20-30 hours = you can build 15-25% of the original plan

8-12 phases is a multi-week roadmap. It is the right structure for building this project properly over time. It is the wrong structure for a hackathon ship.

The config says `"mode": "yolo"` and `"depth": "comprehensive"`. These are contradictory. YOLO mode means "ship fast, validate later." Comprehensive depth means "plan everything in detail." For tonight, you need YOLO mode with MINIMAL depth -- 1-2 phases, 15-20 requirements, laser focus.

---

## 5. Actual Minimum Viable Scope for Tonight

**Goal: A working Exercise 1 session that a person can complete, with a real staircase that converges to a threshold.**

Cut to these requirements ONLY:

### Must Ship (15 requirements, ~5-7 hours)

| ID | Requirement | Notes |
|----|-------------|-------|
| CANV-01 | DPI scaling | 15 min |
| CANV-02 | rAF frame loop | 30 min (core of everything) |
| STIM-01 | Fixation cross | 10 min |
| STIM-02 | Shapes -- 4 shapes only (circle, square, triangle, plus) | 45 min (skip 8 of the 12 shapes) |
| STIM-03 | Consistent shape size | Included in STIM-02 |
| STIM-04 | Pattern mask | 20 min |
| STIM-08 | Frame-based display duration | Included in CANV-02 |
| STRC-01 | 3-Up/1-Down staircase | 30 min |
| STRC-02 | Step down after 3 correct | Included in STRC-01 |
| STRC-03 | Step up after 1 incorrect | Included in STRC-01 |
| STRC-04 | Display time clamping | 10 min |
| STRC-06 | Reversal detection | 20 min |
| STRC-07 | Threshold from reversals | 15 min |
| TRAL-01 | Trial sequence | 45 min |
| TRAL-03 | RT clock starts at response prompt | 10 min |
| EXRC-01 | Exercise 1 central identification | 30 min (wiring) |
| EXRC-02 | Two-button response | 20 min |

**Session flow (simplified):**
- Single "Start" button -> 20 trials (not 30x2 blocks) -> show threshold result
- No block structure, no rest screens, no session state machine
- No session-to-session continuity
- No localStorage persistence (just show the threshold at the end)

**Total: ~5-6 hours with AI assistance. Tight but achievable.**

### Cut Entirely for Tonight

- CANV-03 through CANV-07 (aspect ratio, resize, refresh rate detection, visibility change)
- STIM-05 through STIM-07 (peripheral targets, distractors, high-contrast theming)
- STRC-05, STRC-08 through STRC-10 (boundary clamping edge cases, fallback threshold, separate staircase, session continuity)
- TRAL-02, TRAL-04 through TRAL-08 (button disable timing, RT capture details, feedback, ITI, trial data recording)
- SESS-01 through SESS-08 (entire session manager)
- EXRC-03 through EXRC-09 (entire Exercise 2)
- DATA-01 through DATA-05 (entire persistence layer)
- AUDO-01 through AUDO-07 (entire audio system)

That is 42 requirements deferred. Ship with 15.

### Why This Minimal Scope Still Demonstrates the Core Value

The core value is: "frame-accurate adaptive stimulus presentation that faithfully implements the ACTIVE study's staircase algorithm." The minimal scope above proves:
1. Canvas renders shapes at frame-accurate durations (the hardest technical challenge)
2. The staircase algorithm adapts difficulty based on responses
3. A threshold is computed from reversal points
4. The user can see their processing speed measurement

Everything else -- audio, persistence, Exercise 2, session structure, polish -- is enhancement to a working protocol. If the protocol does not work, none of the rest matters.

---

## 6. Alternative Additions Ranked by ROI (Value per Hour)

| Rank | Addition | Hours | Value for Hackathon | ROI | Verdict |
|------|----------|-------|---------------------|-----|---------|
| 1 | PWA manifest (basic) | 0.5h | "Install to home screen" wow factor | MEDIUM | Do it if you have 30 min to spare after core works |
| 2 | Normative data (hardcoded table, not integration) | 1h | "Your speed is in the Xth percentile for your age" | MEDIUM | Impressive for demo, but hardcode a lookup table, do not integrate datasets |
| 3 | Supabase Auth + basic save | 6-10h | Cloud persistence, multi-device | LOW | Not tonight. This is week 2. |
| 4 | Runtime device calibration | 3-5h | Better measurement accuracy | LOW | Nice-to-have for scientific validity, not for demo |
| 5 | IndexedDB + sync | 4-6h | Offline resilience | VERY LOW | Solving a non-existent problem |
| 6 | Bluetooth audio detection | 3-5h | Edge case handling | VERY LOW | Affects tiny user segment, no reliable API |
| 7 | Framework switch | 4-8h | None. Negative value. | NEGATIVE | Throws away all research and patterns |
| 8 | Data residency compliance | 2-4h | Legal/regulatory | ZERO tonight | No data to protect yet |
| 9 | Privacy policy + consent | 2-3h | Legal/regulatory | ZERO tonight | Not needed for client-side prototype |
| 10 | Security hardening | 2-4h | Security posture | ZERO tonight | No backend to secure yet |

---

## Clear Velocity Advantage

**The original plan (React + Tailwind + localStorage) has a massive velocity advantage** because:

1. **Research is done.** STACK.md, ARCHITECTURE.md, FEATURES.md, and PITFALLS.md are all React-specific. Every code pattern, every anti-pattern warning, every integration approach assumes React. Switching frameworks means re-doing this research.

2. **No backend means no integration.** Every API call, every auth state, every loading/error state, every offline fallback is code you do not write. localStorage is synchronous and never fails (unless quota exceeded).

3. **The canvas engine is framework-agnostic.** The hardest part of this project (the rAF rendering loop, shape drawing, frame counting) lives entirely outside React. It would be the same code in Svelte, Preact, or vanilla JS. The framework choice only affects the thin UI wrapper around the canvas.

4. **Complexity is the enemy of shipping.** The alternative proposal turns a focused psychophysics training app into a full-stack health-data platform with compliance requirements. That is a different product on a different timeline.

---

## Final Recommendation

**Ship tonight with ~15 requirements using the original stack (React, Tailwind, no backend). Get a working Exercise 1 with a real staircase and threshold calculation. Everything else is Phase 2.**

The alternative proposal is a good roadmap for months 2-6 of a serious product. It is not a hackathon plan. Trying to build it tonight will result in shipping nothing.

The "Comprehensive" depth setting should be changed to "rapid" or "minimal" for this milestone. Save comprehensive planning for after you have validated that the core protocol works.

---

## Sources

- Time estimates based on the 57 requirements documented in `REQUIREMENTS.md` (2026-03-21)
- Architecture complexity assessed from `ARCHITECTURE.md` two-layer pattern documentation
- Feature dependencies from `FEATURES.md` dependency graph
- Pitfall time sinks from `PITFALLS.md` critical and moderate pitfalls
- Stack analysis from `STACK.md` recommended technologies
- Alternative proposal features as described in user prompt

---
*Cross-analysis for: Cognify -- Original Plan vs Alternative Proposal*
*Analyzed: 2026-03-21*
