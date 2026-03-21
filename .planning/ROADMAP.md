# Roadmap: CogSpeed

## Overview

CogSpeed delivers frame-accurate adaptive cognitive speed training by building up from foundational canvas rendering through the complete ACTIVE study protocol. The build order is strictly dependency-driven: the canvas engine must render before stimuli can appear, stimuli must exist before the staircase can adapt them, the staircase must work before trials can sequence, and trials must run before sessions can orchestrate them. Exercise 1 validates the entire pipeline end-to-end before Exercise 2 extends it. Data persistence and audio feedback are layered on once the core training loop is proven.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Canvas Rendering Engine** - rAF frame loop with DPI scaling, aspect ratio, resize handling, and timing infrastructure
- [ ] **Phase 2: Stimulus System** - Fixation cross, geometric shapes, pattern mask, and peripheral targets drawn on canvas
- [ ] **Phase 3: Staircase Algorithm** - 3-Up/1-Down adaptive staircase with reversal-based threshold calculation
- [ ] **Phase 4: Trial Engine** - Single-trial sequence from fixation through response with feedback and data capture
- [ ] **Phase 5: Session Manager and Exercise 1** - Session state machine, block structure, and complete Exercise 1 central identification flow
- [ ] **Phase 6: Exercise 2 Divided Attention** - Peripheral target response, dual-judgment scoring, unlock gating, and separate staircase
- [ ] **Phase 7: Data Persistence** - localStorage abstraction layer with profile, session history, and session continuity
- [ ] **Phase 8: Audio Feedback** - Web Audio API synthesized tones for correct, incorrect, and session complete events

## Phase Details

### Phase 1: Canvas Rendering Engine
**Goal**: A rock-solid canvas surface that renders at native resolution, counts frames accurately, and handles every browser environment edge case
**Depends on**: Nothing (first phase)
**Requirements**: CANV-01, CANV-02, CANV-03, CANV-04, CANV-05, CANV-06, CANV-07, CANV-08, CANV-09
**Success Criteria** (what must be TRUE):
  1. Canvas renders sharply on both standard and Retina/HiDPI displays with no blurriness
  2. The rAF frame loop runs continuously and a frame counter increments exactly once per display refresh
  3. Canvas maintains its aspect ratio and minimum size when the browser window is resized, without losing drawn content
  4. When the browser tab is hidden and re-shown, the frame loop pauses and resumes cleanly (no timing jumps or frozen state)
  5. The app detects the actual display refresh rate at startup and logs the measured frame duration
**Plans**: 2 plans

Plans:
- [ ] 01-01-PLAN.md -- Project scaffold (Vite+React+Tailwind) and standalone canvas engine modules
- [ ] 01-02-PLAN.md -- Canvas React integration, responsive UX, debug panel, and mobile support

### Phase 2: Stimulus System
**Goal**: All visual elements of the training protocol render correctly on the canvas -- shapes are distinct, masks obscure afterimages, and display durations are frame-accurate
**Depends on**: Phase 1
**Requirements**: STIM-01, STIM-02, STIM-03, STIM-04, STIM-05, STIM-06, STIM-07, STIM-08
**Success Criteria** (what must be TRUE):
  1. A fixation cross renders centered on canvas for exactly 30 frames (500ms at 60Hz) before stimulus onset
  2. All 12 geometric shapes (circle, square, triangle-up, triangle-down, plus, X, diamond, pentagon, 5-point star, 6-point star, arrow-left, arrow-right) render as visually distinct white shapes on dark background
  3. A pattern mask appears for exactly 6 frames (100ms at 60Hz) immediately after stimulus offset, preventing retinal afterimage
  4. Peripheral target triangles render at correct positions along the elliptical path at 8 clock positions, visually distinct from distractor shapes
  5. Stimulus display duration is controlled by frame count -- a stimulus set to display for 3 frames appears for exactly 3 frames regardless of refresh rate
**Plans**: TBD

Plans:
- [ ] 02-01: TBD
- [ ] 02-02: TBD

### Phase 3: Staircase Algorithm
**Goal**: A pure-function staircase module that correctly adapts difficulty based on user performance and produces stable threshold estimates via reversal averaging
**Depends on**: Nothing (pure logic, no rendering dependency -- but logically follows Phase 1-2 for build order)
**Requirements**: STRC-01, STRC-02, STRC-03, STRC-04, STRC-05, STRC-06, STRC-07, STRC-08, STRC-09, STRC-10
**Success Criteria** (what must be TRUE):
  1. After 3 consecutive correct responses, display time decreases by 1 frame; after 1 incorrect response, display time increases by 2 frames and the streak resets
  2. Display time never goes below 1 frame or above 30 frames regardless of response sequence
  3. Reversal points are detected when the staircase changes direction, and boundary clamping does not create false reversals
  4. Threshold is calculated by averaging display times at reversal points (discarding the first 4 reversals), with a fallback to last-50%-of-trials averaging when too few reversals exist
  5. Each exercise type maintains its own independent staircase instance with separate state
**Plans**: TBD

Plans:
- [ ] 03-01: TBD

### Phase 4: Trial Engine
**Goal**: A single trial runs from fixation through response capture with correct timing, input gating, visual feedback, and complete data recording
**Depends on**: Phase 1, Phase 2, Phase 3
**Requirements**: TRAL-01, TRAL-02, TRAL-03, TRAL-04, TRAL-05, TRAL-06, TRAL-07, TRAL-08
**Success Criteria** (what must be TRUE):
  1. A trial progresses through the full sequence: fixation cross -> stimulus -> mask -> response prompt -> user response -> feedback -> ITI, with no steps skipped or misordered
  2. Response buttons are disabled during fixation, stimulus, and mask phases -- tapping them does nothing until the response prompt appears
  3. Reaction time is measured from the moment the response prompt appears (not stimulus onset), and the first tap/click timestamp is captured
  4. Correct responses show green feedback for 300ms and incorrect responses show red feedback for 300ms, followed by a 400ms blank ITI
  5. Every trial records a complete data object: trial number, display time, stimulus shown, response given, correctness, and reaction time
**Plans**: TBD

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD

### Phase 5: Session Manager and Exercise 1
**Goal**: Users can run a complete Exercise 1 training session -- 2 blocks of 30 trials each with rest between, seeing their threshold result at the end
**Depends on**: Phase 4
**Requirements**: SESS-01, SESS-02, SESS-03, SESS-04, SESS-05, SESS-06, SESS-07, SESS-08, EXRC-01, EXRC-02
**Success Criteria** (what must be TRUE):
  1. The session state machine transitions through IDLE -> PRE_SESSION -> RUNNING -> INTER_BLOCK -> RUNNING -> POST_SESSION -> IDLE with correct screens at each state
  2. PRE_SESSION shows the two target shapes side by side for 3 seconds before trials begin
  3. Each block runs exactly 30 trials, with a 15-second rest screen between the two blocks
  4. The user identifies which of 2 target objects was shown by tapping one of two shape buttons, and the staircase adapts accordingly
  5. POST_SESSION displays the session threshold, overall accuracy, and improvement compared to the previous session
**Plans**: TBD

Plans:
- [ ] 05-01: TBD
- [ ] 05-02: TBD

### Phase 6: Exercise 2 Divided Attention
**Goal**: Users who have completed 5 Exercise 1 sessions can run Exercise 2, which adds peripheral target location to the central identification task
**Depends on**: Phase 5
**Requirements**: EXRC-03, EXRC-04, EXRC-05, EXRC-06, EXRC-07, EXRC-08, EXRC-09
**Success Criteria** (what must be TRUE):
  1. Exercise 2 presents both a central stimulus and a peripheral target triangle simultaneously, then asks the user to identify the central object AND locate the peripheral target in sequence
  2. The user responds in two phases: first "Which object?" (two shape buttons), then "Where was the triangle?" (8 position markers around the canvas)
  3. A trial counts as correct only when BOTH the central and peripheral responses are correct; the staircase adjusts based on this combined judgment
  4. Exercise 2 is locked until the user completes 5 Exercise 1 sessions, with a hidden dev toggle (keyboard shortcut or console command) to bypass the gate
  5. Exercise 2 runs its own staircase instance starting at 250ms (higher initial display time than Exercise 1)
**Plans**: TBD

Plans:
- [ ] 06-01: TBD
- [ ] 06-02: TBD

### Phase 7: Data Persistence
**Goal**: All training data persists across browser sessions -- users return to find their history intact, and sessions resume at appropriate difficulty
**Depends on**: Phase 5 (needs session data structure to persist)
**Requirements**: DATA-01, DATA-02, DATA-03, DATA-04, DATA-05, DATA-06, DATA-07, STRC-10
**Success Criteria** (what must be TRUE):
  1. After completing a session and closing the browser, reopening the app shows the user's session history and correct unlock status
  2. A new session starts at the previous session's threshold multiplied by 1.1 (10% easier than where they ended)
  3. If localStorage is unavailable or contains corrupted data, the app falls back to sensible defaults without crashing
  4. A DataService abstraction layer wraps all localStorage access, so swapping to a different storage backend later requires no changes to app code
  5. Each session has a unique ID generated via crypto.randomUUID() and stored data includes a schema version field
**Plans**: TBD

Plans:
- [ ] 07-01: TBD
- [ ] 07-02: TBD

### Phase 8: Audio Feedback
**Goal**: Users receive subtle audio cues during training -- a high tone for correct, a low tone for incorrect, and a chime when a session completes
**Depends on**: Phase 4 (needs trial feedback integration point)
**Requirements**: AUDO-01, AUDO-02, AUDO-03, AUDO-04, AUDO-05, AUDO-06, AUDO-07
**Success Criteria** (what must be TRUE):
  1. Audio plays on correct and incorrect responses without any user-facing "enable audio" step (AudioContext created silently on first user gesture)
  2. Correct answers produce a brief high-pitched tone (~600Hz) and incorrect answers produce a brief low-pitched tone (~300Hz), both quiet and non-intrusive
  3. Session completion produces a distinct pleasant chime (compound tone) that feels like an achievement signal
  4. All sounds are synthesized via OscillatorNode -- no audio files are loaded or bundled
**Plans**: TBD

Plans:
- [ ] 08-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Canvas Rendering Engine | 0/2 | Not started | - |
| 2. Stimulus System | 0/2 | Not started | - |
| 3. Staircase Algorithm | 0/1 | Not started | - |
| 4. Trial Engine | 0/2 | Not started | - |
| 5. Session Manager and Exercise 1 | 0/2 | Not started | - |
| 6. Exercise 2 Divided Attention | 0/2 | Not started | - |
| 7. Data Persistence | 0/2 | Not started | - |
| 8. Audio Feedback | 0/1 | Not started | - |
