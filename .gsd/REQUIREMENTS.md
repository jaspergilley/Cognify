# Requirements

## Active

### CANV-01 — Canvas DPI Scaling
- Status: active
- Class: core-capability
- Source: ACTIVE study protocol
- Primary Slice: S01
Canvas renders at correct DPI scale on standard and HiDPI/Retina displays (devicePixelRatio handling)

### CANV-02 — rAF Frame Loop
- Status: active
- Class: core-capability
- Source: ACTIVE study protocol
- Primary Slice: S01
rAF-based frame loop counts frames accurately (never uses setTimeout/setInterval for stimulus timing)

### CANV-03 — Aspect Ratio and Minimum Size
- Status: active
- Class: core-capability
- Source: ACTIVE study protocol
- Primary Slice: S01
Canvas maintains fixed aspect ratio (4:3 or 16:10) and responsive sizing (minimum 600x450px effective)

### CANV-04 — Percentage-Based Coordinates
- Status: active
- Class: core-capability
- Source: ACTIVE study protocol
- Primary Slice: S01
All stimulus positions calculated as percentages of canvas dimensions, not absolute pixels

### CANV-05 — Resize Handling
- Status: active
- Class: core-capability
- Source: ACTIVE study protocol
- Primary Slice: S01
Canvas handles window resize without losing rendering state

### CANV-06 — Refresh Rate Detection
- Status: active
- Class: core-capability
- Source: ACTIVE study protocol
- Primary Slice: S01
App detects actual display refresh rate at startup by measuring rAF frame intervals

### CANV-07 — Visibility Pause/Resume
- Status: active
- Class: core-capability
- Source: ACTIVE study protocol
- Primary Slice: S01
App pauses trial timing when tab loses visibility (visibilitychange listener) and resumes cleanly

### CANV-08 — Integer Coordinates
- Status: active
- Class: core-capability
- Source: ACTIVE study protocol
- Primary Slice: S01
All canvas coordinates rounded to integers (Math.round) to eliminate sub-pixel anti-aliasing

### CANV-09 — Delta Timing and Dropped Frames
- Status: active
- Class: core-capability
- Source: ACTIVE study protocol
- Primary Slice: S01
performance.now() delta timing companion tracks actual frame durations for dropped frame detection

### STIM-01 — Fixation Cross
- Status: active
- Class: core-capability
- Source: ACTIVE study protocol
- Primary Slice: S02
Fixation cross (+) renders centered on canvas for ~30 frames (500ms at 60Hz)

### STIM-02 — Geometric Shapes
- Status: active
- Class: core-capability
- Source: ACTIVE study protocol
- Primary Slice: S02
Central stimuli draw programmatically as distinct geometric shapes (12 types)

### STIM-03 — Stimulus Size
- Status: active
- Class: core-capability
- Source: ACTIVE study protocol
- Primary Slice: S02
Central stimuli render at consistent size (~80x80px equivalent relative to canvas)

### STIM-04 — Pattern Mask
- Status: active
- Class: core-capability
- Source: ACTIVE study protocol
- Primary Slice: S02
Pattern mask renders for ~6 frames (100ms at 60Hz) after stimulus offset

### STIM-05 — Peripheral Targets
- Status: active
- Class: core-capability
- Source: ACTIVE study protocol
- Primary Slice: S02
Peripheral target triangle renders at 8 clock positions at 70-80% distance from center

### STIM-06 — Distractor Shapes
- Status: active
- Class: core-capability
- Source: ACTIVE study protocol
- Primary Slice: S02
Distractor shapes render distinctly from target triangles

### STIM-07 — High Contrast
- Status: active
- Class: core-capability
- Source: ACTIVE study protocol
- Primary Slice: S02
All shapes use high-contrast white fill on dark background (#1a1a2e)

### STIM-08 — Frame-Based Display Duration
- Status: active
- Class: core-capability
- Source: ACTIVE study protocol
- Primary Slice: S02
Stimulus display duration controlled in frame counts

### STRC-01 — Staircase State
- Status: active
- Class: core-capability
- Source: ACTIVE study protocol
- Primary Slice: S03
3-Up / 1-Down transformed staircase tracks displayTime, correctStreak, and trialHistory

### STRC-02 — Step Down Rule
- Status: active
- Class: core-capability
- Source: ACTIVE study protocol
- Primary Slice: S03
After 3 consecutive correct, displayTime decreases by 1 frame

### STRC-03 — Step Up Rule
- Status: active
- Class: core-capability
- Source: ACTIVE study protocol
- Primary Slice: S03
After 1 incorrect, displayTime increases by 2 frames and streak resets

### STRC-04 — Display Time Clamping
- Status: active
- Class: core-capability
- Source: ACTIVE study protocol
- Primary Slice: S03
displayTime clamps between 1 frame and ~30 frames

### STRC-05 — No Spurious Reversals
- Status: active
- Class: core-capability
- Source: ACTIVE study protocol
- Primary Slice: S03
Boundary clamping does not generate spurious reversal points

### STRC-06 — Reversal Detection
- Status: active
- Class: core-capability
- Source: ACTIVE study protocol
- Primary Slice: S03
Reversals detected when staircase direction changes

### STRC-07 — Threshold Calculation
- Status: active
- Class: core-capability
- Source: ACTIVE study protocol
- Primary Slice: S03
Processing speed threshold calculated by averaging displayTime at reversal points (discarding first 4)

### STRC-08 — Fallback Threshold
- Status: active
- Class: core-capability
- Source: ACTIVE study protocol
- Primary Slice: S03
Fallback threshold calculation when insufficient reversals

### STRC-09 — Separate Staircases
- Status: active
- Class: core-capability
- Source: ACTIVE study protocol
- Primary Slice: S03
Each exercise type maintains a separate staircase instance

### STRC-10 — Session Continuity
- Status: active
- Class: core-capability
- Source: ACTIVE study protocol
- Primary Slice: S07
New session starts at previous session's threshold x 1.1

### TRAL-01 — Trial Sequence
- Status: active
- Class: core-capability
- Source: ACTIVE study protocol
- Primary Slice: S04
Trial follows sequence: fixation -> stimulus -> mask -> response prompt -> user response -> feedback -> ITI

### TRAL-02 — Response Gating
- Status: active
- Class: core-capability
- Source: ACTIVE study protocol
- Primary Slice: S04
Response buttons disabled during fixation, stimulus, and mask phases

### TRAL-03 — Reaction Time Start
- Status: active
- Class: core-capability
- Source: ACTIVE study protocol
- Primary Slice: S04
Reaction time clock starts when response prompt appears, not at stimulus onset

### TRAL-04 — Reaction Time Capture
- Status: active
- Class: core-capability
- Source: ACTIVE study protocol
- Primary Slice: S04
Reaction time captured as timestamp of first tap/click after response prompt

### TRAL-05 — Correct Feedback
- Status: active
- Class: core-capability
- Source: ACTIVE study protocol
- Primary Slice: S04
Correct response shows green feedback for ~300ms

### TRAL-06 — Incorrect Feedback
- Status: active
- Class: core-capability
- Source: ACTIVE study protocol
- Primary Slice: S04
Incorrect response shows red feedback for ~300ms

### TRAL-07 — Inter-Trial Interval
- Status: active
- Class: core-capability
- Source: ACTIVE study protocol
- Primary Slice: S04
Inter-trial interval of ~400ms blank screen

### TRAL-08 — Trial Data Recording
- Status: active
- Class: core-capability
- Source: ACTIVE study protocol
- Primary Slice: S04
Per-trial data recorded with all fields

### SESS-01 — Session State Machine
- Status: active
- Class: core-capability
- Source: ACTIVE study protocol
- Primary Slice: S05
Session state machine: IDLE -> PRE_SESSION -> RUNNING -> INTER_BLOCK -> POST_SESSION -> IDLE

### SESS-02 — Pre-Session Display
- Status: active
- Class: core-capability
- Source: ACTIVE study protocol
- Primary Slice: S05
PRE_SESSION shows target objects side by side for 3 seconds

### SESS-03 — Block Size
- Status: active
- Class: core-capability
- Source: ACTIVE study protocol
- Primary Slice: S05
Each block contains 30 trials

### SESS-04 — Session Structure
- Status: active
- Class: core-capability
- Source: ACTIVE study protocol
- Primary Slice: S05
Each session contains 2 blocks

### SESS-05 — Inter-Block Rest
- Status: active
- Class: core-capability
- Source: ACTIVE study protocol
- Primary Slice: S05
15-second rest screen between blocks

### SESS-06 — Stimulus Rotation
- Status: active
- Class: core-capability
- Source: ACTIVE study protocol
- Primary Slice: S05
Stimulus pair rotates across sessions

### SESS-07 — Post-Session Summary
- Status: active
- Class: core-capability
- Source: ACTIVE study protocol
- Primary Slice: S05
POST_SESSION shows session summary

### SESS-08 — Session Data Recording
- Status: active
- Class: core-capability
- Source: ACTIVE study protocol
- Primary Slice: S05
Per-session data recorded with all fields

### EXRC-01 — Exercise 1 Central Identification
- Status: active
- Class: core-capability
- Source: ACTIVE study protocol
- Primary Slice: S05
User identifies which of 2 target objects was briefly shown

### EXRC-02 — Exercise 1 Response
- Status: active
- Class: core-capability
- Source: ACTIVE study protocol
- Primary Slice: S05
Exercise 1 response via two buttons showing actual shapes

### EXRC-03 — Exercise 2 Divided Attention
- Status: active
- Class: core-capability
- Source: ACTIVE study protocol
- Primary Slice: S06
User identifies central object AND locates peripheral target

### EXRC-04 — Exercise 2 Response Phase 1
- Status: active
- Class: core-capability
- Source: ACTIVE study protocol
- Primary Slice: S06
"Which object?" response

### EXRC-05 — Exercise 2 Response Phase 2
- Status: active
- Class: core-capability
- Source: ACTIVE study protocol
- Primary Slice: S06
"Where was the triangle?" response with 8 position markers

### EXRC-06 — Exercise 2 Dual Judgment
- Status: active
- Class: core-capability
- Source: ACTIVE study protocol
- Primary Slice: S06
Trial correct only if BOTH central and peripheral responses correct

### EXRC-07 — Exercise 2 Starting Threshold
- Status: active
- Class: core-capability
- Source: ACTIVE study protocol
- Primary Slice: S06
Exercise 2 staircase starts at 250ms

### EXRC-08 — Exercise 2 Unlock Gate
- Status: active
- Class: core-capability
- Source: ACTIVE study protocol
- Primary Slice: S06
Exercise 2 unlocks after 5 completed Exercise 1 sessions

### EXRC-09 — Exercise 2 Dev Toggle
- Status: active
- Class: core-capability
- Source: ACTIVE study protocol
- Primary Slice: S06
Hidden dev toggle to instantly unlock Exercise 2

### DATA-01 — User Profile Storage
- Status: active
- Class: core-capability
- Source: architecture
- Primary Slice: S07
User profile stored in localStorage under cognify_profile

### DATA-02 — Session Data Storage
- Status: active
- Class: core-capability
- Source: architecture
- Primary Slice: S07
All session data stored in localStorage under cognify_sessions

### DATA-03 — Data Load/Save
- Status: active
- Class: core-capability
- Source: architecture
- Primary Slice: S07
Data loads on app mount and saves after each session

### DATA-04 — Error Handling
- Status: active
- Class: core-capability
- Source: architecture
- Primary Slice: S07
All localStorage reads wrapped in try-catch with fallback defaults

### DATA-05 — Schema Version
- Status: active
- Class: core-capability
- Source: architecture
- Primary Slice: S07
Schema version field in stored data

### DATA-06 — DataService Abstraction
- Status: active
- Class: core-capability
- Source: architecture
- Primary Slice: S07
DataService abstraction layer wrapping localStorage

### DATA-07 — Session IDs
- Status: active
- Class: core-capability
- Source: architecture
- Primary Slice: S07
Session IDs generated via crypto.randomUUID()

### AUDO-01 — AudioContext Creation
- Status: active
- Class: core-capability
- Source: UX
- Primary Slice: S08
Singleton AudioContext created on first user gesture

### AUDO-02 — Correct Sound
- Status: active
- Class: core-capability
- Source: UX
- Primary Slice: S08
Correct answer produces soft high-pitched tone (~600Hz)

### AUDO-03 — Incorrect Sound
- Status: active
- Class: core-capability
- Source: UX
- Primary Slice: S08
Incorrect answer produces soft low-pitched tone (~300Hz)

### AUDO-04 — Session Complete Sound
- Status: active
- Class: core-capability
- Source: UX
- Primary Slice: S08
Session complete produces pleasant chime

### AUDO-05 — Synthesized Sounds
- Status: active
- Class: core-capability
- Source: UX
- Primary Slice: S08
All sounds generated via OscillatorNode synthesis

### AUDO-06 — Single-Use Oscillators
- Status: active
- Class: core-capability
- Source: UX
- Primary Slice: S08
New OscillatorNode created per sound

### AUDO-07 — Non-Intrusive Volume
- Status: active
- Class: core-capability
- Source: UX
- Primary Slice: S08
Sounds are quiet and non-intrusive

## Deferred

(None — all v1 requirements are active)

## Out of Scope

| Feature | Reason |
|---------|--------|
| User accounts / authentication | Client-side only, no backend |
| Backend / API calls | localStorage-only architecture |
| Social features / leaderboards | Not relevant to training protocol |
| Exercise 3 (selective attention) | Stretch goal, not in current milestone |
