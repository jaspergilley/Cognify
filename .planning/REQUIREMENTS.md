# Requirements: Cognify

**Defined:** 2026-03-21
**Core Value:** Frame-accurate adaptive stimulus presentation that faithfully implements the ACTIVE study's speed-of-processing protocol

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Canvas Rendering

- [x] **CANV-01**: Canvas renders at correct DPI scale on standard and HiDPI/Retina displays (devicePixelRatio handling)
- [x] **CANV-02**: rAF-based frame loop counts frames accurately (never uses setTimeout/setInterval for stimulus timing)
- [ ] **CANV-03**: Canvas maintains fixed aspect ratio (4:3 or 16:10) and responsive sizing (minimum 600x450px effective)
- [x] **CANV-04**: All stimulus positions calculated as percentages of canvas dimensions, not absolute pixels
- [ ] **CANV-05**: Canvas handles window resize without losing rendering state
- [x] **CANV-06**: App detects actual display refresh rate at startup by measuring rAF frame intervals
- [x] **CANV-07**: App pauses trial timing when tab loses visibility (visibilitychange listener) and resumes cleanly
- [x] **CANV-08**: All canvas coordinates rounded to integers (Math.round) to eliminate sub-pixel anti-aliasing
- [x] **CANV-09**: performance.now() delta timing companion tracks actual frame durations for dropped frame detection (~20 lines)

### Stimulus System

- [ ] **STIM-01**: Fixation cross (+) renders centered on canvas for ~30 frames (500ms at 60Hz)
- [ ] **STIM-02**: Central stimuli draw programmatically as distinct geometric shapes (circle, square, triangle-up, triangle-down, plus, X, diamond, pentagon, 5-point star, 6-point star, arrow-left, arrow-right)
- [ ] **STIM-03**: Central stimuli render at consistent size (~80x80px equivalent relative to canvas)
- [ ] **STIM-04**: Pattern mask (random visual noise or symbol grid) renders for ~6 frames (100ms at 60Hz) after stimulus offset
- [ ] **STIM-05**: Peripheral target (small solid inward-pointing triangle, ~30x30px) renders at any of 8 clock positions at 70-80% distance from center to edge
- [ ] **STIM-06**: Distractor shapes (hollow/outlined or 180-degree-rotated triangles) render distinctly from target triangles
- [ ] **STIM-07**: All shapes use high-contrast white fill on dark background (#1a1a2e or similar)
- [ ] **STIM-08**: Stimulus display duration is controlled in frame counts (converted from ms via `frames = Math.max(1, Math.round(ms / frameDuration))`)

### Staircase Algorithm

- [ ] **STRC-01**: 3-Up / 1-Down transformed staircase tracks displayTime, correctStreak, and trialHistory per session
- [ ] **STRC-02**: After 3 consecutive correct responses, displayTime decreases by stepDown (1 frame, adapted to detected refresh rate)
- [ ] **STRC-03**: After 1 incorrect response, displayTime increases by stepUp (2 frames, adapted to detected refresh rate) and correctStreak resets
- [ ] **STRC-04**: displayTime clamps between minDisplayTime (1 frame) and maxDisplayTime (~30 frames / 500ms at 60Hz)
- [ ] **STRC-05**: Boundary clamping does not generate spurious reversal points
- [ ] **STRC-06**: Reversals detected when staircase direction changes (stepping-down -> stepping-up or vice versa)
- [ ] **STRC-07**: Processing speed threshold calculated by averaging displayTime at reversal points (discarding first 4 reversals)
- [ ] **STRC-08**: Fallback threshold calculation (average of last 50% of trials) used when insufficient reversals
- [ ] **STRC-09**: Each exercise type maintains a separate staircase instance
- [ ] **STRC-10**: New session starts at previous session's threshold x 1.1 (10% easier than ending point)

### Trial Engine

- [ ] **TRAL-01**: Trial follows sequence: fixation -> stimulus -> mask -> response prompt -> user response -> feedback -> ITI
- [ ] **TRAL-02**: Response buttons disabled during fixation, stimulus, and mask phases (prevents premature input)
- [ ] **TRAL-03**: Reaction time clock starts when response prompt appears (after mask), not at stimulus onset
- [ ] **TRAL-04**: Reaction time captured as timestamp of first tap/click after response prompt
- [ ] **TRAL-05**: Correct response shows subtle green feedback for ~300ms
- [ ] **TRAL-06**: Incorrect response shows subtle red feedback for ~300ms
- [ ] **TRAL-07**: Inter-trial interval of ~400ms blank screen between trials
- [ ] **TRAL-08**: Per-trial data recorded: trialNumber, displayTimeMs, centralStimulus, centralResponse, centralCorrect, peripheralPosition (Ex2), peripheralResponse (Ex2), peripheralCorrect (Ex2), overallCorrect, reactionTimeMs

### Session Manager

- [ ] **SESS-01**: Session state machine: IDLE -> PRE_SESSION -> RUNNING -> INTER_BLOCK -> POST_SESSION -> IDLE
- [ ] **SESS-02**: PRE_SESSION shows target objects side by side for 3 seconds before starting
- [ ] **SESS-03**: Each block contains 30 trials
- [ ] **SESS-04**: Each session contains 2 blocks
- [ ] **SESS-05**: 15-second rest screen between blocks (INTER_BLOCK state)
- [ ] **SESS-06**: Stimulus pair rotates across sessions (randomly selects 2 pairs from pool for 2 blocks)
- [ ] **SESS-07**: POST_SESSION shows session summary (threshold, accuracy, improvement from last)
- [ ] **SESS-08**: Per-session data recorded: sessionId, date, exerciseType, blocks (with trials), threshold, overallAccuracy, improvementFromLast

### Exercise Logic

- [ ] **EXRC-01**: Exercise 1 (Central Identification) -- user identifies which of 2 target objects was briefly shown
- [ ] **EXRC-02**: Exercise 1 response via two buttons showing actual shapes with labels
- [ ] **EXRC-03**: Exercise 2 (Divided Attention) -- user identifies central object AND locates peripheral target
- [ ] **EXRC-04**: Exercise 2 response Phase 1: "Which object?" (same as Exercise 1)
- [ ] **EXRC-05**: Exercise 2 response Phase 2: "Where was the triangle?" (8 position markers)
- [ ] **EXRC-06**: Exercise 2 trial counts as correct only if BOTH central and peripheral responses are correct
- [ ] **EXRC-07**: Exercise 2 staircase starts at 250ms (harder task, needs higher initial value)
- [ ] **EXRC-08**: Exercise 2 unlocks after 5 completed Exercise 1 sessions
- [ ] **EXRC-09**: Hidden dev toggle to instantly unlock Exercise 2

### Data Persistence

- [ ] **DATA-01**: User profile stored in localStorage under cognify_profile (hasOnboarded, baselineThreshold, exercise2Unlocked, totalSessions)
- [ ] **DATA-02**: All session data stored in localStorage under cognify_sessions (array of session objects)
- [ ] **DATA-03**: Data loads on app mount and saves after each session completes
- [ ] **DATA-04**: All localStorage reads wrapped in try-catch with validation and fallback defaults
- [ ] **DATA-05**: Schema version field in stored data for future migration support
- [ ] **DATA-06**: DataService abstraction layer wrapping localStorage (swappable to Supabase later without touching app code)
- [ ] **DATA-07**: Session IDs generated via crypto.randomUUID()

### Audio System

- [ ] **AUDO-01**: Singleton AudioContext created on first user gesture (respects autoplay policy)
- [ ] **AUDO-02**: Correct answer produces soft high-pitched tone (~600Hz, short duration)
- [ ] **AUDO-03**: Incorrect answer produces soft low-pitched tone (~300Hz, short duration)
- [ ] **AUDO-04**: Session complete produces pleasant chime (compound tone)
- [ ] **AUDO-05**: All sounds generated via OscillatorNode synthesis (no audio files)
- [ ] **AUDO-06**: New OscillatorNode created per sound (single-use constraint)
- [ ] **AUDO-07**: Sounds are quiet and non-intrusive (low gain, short duration)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Dashboard & UI

- **DASH-01**: Hero metric showing current processing speed threshold with directional indicator
- **DASH-02**: Percentile context using hardcoded age norms
- **DASH-03**: Progress chart (Recharts LineChart) showing threshold over last 20 sessions
- **DASH-04**: Weekly streak indicator (dots for each day, target 3 sessions/week)
- **DASH-05**: Exercise selector with lock icon for Exercise 2

### Onboarding

- **ONBD-01**: Welcome screen with ACTIVE study context
- **ONBD-02**: How It Works explanation screen
- **ONBD-03**: Baseline assessment (20 trials of Exercise 1 at default settings)
- **ONBD-04**: Baseline result screen with recommended schedule

### Visual Polish

- **VISL-01**: Dark mode theme (#0f172a background, teal accent #06b6d4)
- **VISL-02**: Medical-grade typography and spacing
- **VISL-03**: Glass-morphism card styling
- **VISL-04**: Smooth transitions between app screens

## Out of Scope

| Feature | Reason |
|---------|--------|
| User accounts / authentication | Client-side only, no backend |
| Backend / API calls | localStorage-only architecture |
| Social features / leaderboards | Not relevant to training protocol |
| Exercise 3 (selective attention) | Stretch goal, not in current milestone |
| Settings page | Hardcode sensible defaults |
| Tutorial beyond 3 screens | Keep onboarding minimal |
| Complex animations / transitions | Focus on timing precision, not visual effects |
| Mobile native app | Web-first approach |
| Real-time chat | Not relevant |
| Video content | Not relevant |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CANV-01 | Phase 1 | Complete |
| CANV-02 | Phase 1 | Complete |
| CANV-03 | Phase 1 | Pending |
| CANV-04 | Phase 1 | Complete |
| CANV-05 | Phase 1 | Pending |
| CANV-06 | Phase 1 | Complete |
| CANV-07 | Phase 1 | Complete |
| CANV-08 | Phase 1 | Complete |
| CANV-09 | Phase 1 | Complete |
| STIM-01 | Phase 2 | Pending |
| STIM-02 | Phase 2 | Pending |
| STIM-03 | Phase 2 | Pending |
| STIM-04 | Phase 2 | Pending |
| STIM-05 | Phase 2 | Pending |
| STIM-06 | Phase 2 | Pending |
| STIM-07 | Phase 2 | Pending |
| STIM-08 | Phase 2 | Pending |
| STRC-01 | Phase 3 | Pending |
| STRC-02 | Phase 3 | Pending |
| STRC-03 | Phase 3 | Pending |
| STRC-04 | Phase 3 | Pending |
| STRC-05 | Phase 3 | Pending |
| STRC-06 | Phase 3 | Pending |
| STRC-07 | Phase 3 | Pending |
| STRC-08 | Phase 3 | Pending |
| STRC-09 | Phase 3 | Pending |
| STRC-10 | Phase 7 | Pending |
| TRAL-01 | Phase 4 | Pending |
| TRAL-02 | Phase 4 | Pending |
| TRAL-03 | Phase 4 | Pending |
| TRAL-04 | Phase 4 | Pending |
| TRAL-05 | Phase 4 | Pending |
| TRAL-06 | Phase 4 | Pending |
| TRAL-07 | Phase 4 | Pending |
| TRAL-08 | Phase 4 | Pending |
| SESS-01 | Phase 5 | Pending |
| SESS-02 | Phase 5 | Pending |
| SESS-03 | Phase 5 | Pending |
| SESS-04 | Phase 5 | Pending |
| SESS-05 | Phase 5 | Pending |
| SESS-06 | Phase 5 | Pending |
| SESS-07 | Phase 5 | Pending |
| SESS-08 | Phase 5 | Pending |
| EXRC-01 | Phase 5 | Pending |
| EXRC-02 | Phase 5 | Pending |
| EXRC-03 | Phase 6 | Pending |
| EXRC-04 | Phase 6 | Pending |
| EXRC-05 | Phase 6 | Pending |
| EXRC-06 | Phase 6 | Pending |
| EXRC-07 | Phase 6 | Pending |
| EXRC-08 | Phase 6 | Pending |
| EXRC-09 | Phase 6 | Pending |
| DATA-01 | Phase 7 | Pending |
| DATA-02 | Phase 7 | Pending |
| DATA-03 | Phase 7 | Pending |
| DATA-04 | Phase 7 | Pending |
| DATA-05 | Phase 7 | Pending |
| DATA-06 | Phase 7 | Pending |
| DATA-07 | Phase 7 | Pending |
| AUDO-01 | Phase 8 | Pending |
| AUDO-02 | Phase 8 | Pending |
| AUDO-03 | Phase 8 | Pending |
| AUDO-04 | Phase 8 | Pending |
| AUDO-05 | Phase 8 | Pending |
| AUDO-06 | Phase 8 | Pending |
| AUDO-07 | Phase 8 | Pending |

**Coverage:**
- v1 requirements: 66 total
- Mapped to phases: 66
- Unmapped: 0

---
*Requirements defined: 2026-03-21*
*Last updated: 2026-03-21 after roadmap creation*
