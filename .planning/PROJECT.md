# Cognify

## What This Is

Cognify is a web-based adaptive cognitive speed training app based on the ACTIVE study (NIH, 2026), which found that adaptive visual speed-of-processing training reduced dementia diagnoses by 25% over 20 years. It trains users to identify visual stimuli at progressively shorter display durations using psychophysics-standard staircase algorithms. This is a hackathon MVP — infrastructure and core mechanics first.

## Core Value

Frame-accurate adaptive stimulus presentation that faithfully implements the ACTIVE study's speed-of-processing protocol — if the timing engine and staircase algorithm don't work correctly, nothing else matters.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Canvas-based stimulus rendering engine with requestAnimationFrame timing
- [ ] Frame-based display duration (frames, not milliseconds; 1 frame = ~16.67ms at 60fps)
- [ ] Programmatic shape drawing (circle, square, triangle, plus, X, diamond, pentagon, stars, arrows)
- [ ] Fixation cross display (500ms pre-stimulus)
- [ ] Pattern mask after stimulus offset (100ms)
- [ ] 3-Up / 1-Down adaptive staircase algorithm
- [ ] Processing speed threshold calculation via reversal averaging
- [ ] Session-to-session continuity (start at previous threshold × 1.1)
- [ ] Exercise 1 — Central identification trial flow
- [ ] Exercise 2 — Divided attention with peripheral targets (8 positions)
- [ ] Separate staircase per exercise type
- [ ] Exercise 2 unlock gate (5 Exercise 1 sessions, with hidden dev toggle)
- [ ] Training session state machine (IDLE → PRE_SESSION → RUNNING → INTER_BLOCK → POST_SESSION → IDLE)
- [ ] Block structure (30 trials/block, 2 blocks/session, 15s rest between)
- [ ] Response timing capture (clock starts at response prompt, not stimulus)
- [ ] Per-trial data recording (display time, stimuli, responses, correctness, reaction time)
- [ ] Per-session data recording (threshold, accuracy, improvement)
- [ ] localStorage persistence (cognify_profile, cognify_sessions)
- [ ] Audio feedback system (soft correct/incorrect/complete sounds)

### Out of Scope

- Dashboard design and visual polish — deferred to later milestone
- Onboarding UX flow — deferred to later milestone
- Progress charts and streak indicators — deferred to later milestone
- Theming and typography — deferred to later milestone
- Exercise 3 (selective attention with distractors) — stretch goal
- User accounts or authentication — not planned
- Backend or API calls — not planned
- Social features or leaderboards — not planned

## Context

- Based on the ACTIVE study (Advanced Cognitive Training for Independent and Vital Elderly), a landmark 20-year NIH trial
- The key mechanism is adaptive visual speed-of-processing training using a transformed staircase method
- Psychophysics standards apply: pattern masking prevents retinal afterimage, reversal-based threshold estimation provides stable measurements
- At 60fps, one frame = ~16.67ms — this is the minimum display duration and the unit of measurement for the rendering engine
- Stimulus shapes are drawn programmatically on canvas (no external image assets)
- Peripheral targets placed at 70-80% distance from center to edge on an elliptical path (8 clock positions)

## Constraints

- **Stack**: React (.jsx), Tailwind CSS, Recharts — single-page app, no backend
- **Timing**: Must use HTML5 Canvas + requestAnimationFrame — no DOM elements for stimuli, no setTimeout/setInterval for display timing
- **Timeline**: Hackathon — shipping tonight
- **Storage**: localStorage only — all state client-side
- **Rendering**: All shapes drawn via canvas path operations — no external images
- **Touch targets**: Response buttons minimum 48×48px, ideally 64×64px

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Canvas + rAF for stimulus rendering | DOM elements too slow for sub-frame timing; rAF gives vsync-aligned frame counting | — Pending |
| 3-Up / 1-Down staircase | Standard transformed staircase from psychophysics; converges to 79.4% correct threshold | — Pending |
| Reversal-based threshold calculation | More stable than trial averaging; standard in psychophysics research | — Pending |
| Infrastructure-first build order | Core mechanics must work correctly before any UI polish | — Pending |
| Dev toggle for Exercise 2 unlock | Keeps real protocol (5 sessions) but allows demo/testing | — Pending |
| Frame-based timing over milliseconds | Ensures display durations align with actual screen refreshes | — Pending |

---
*Last updated: 2026-03-21 after initialization*
