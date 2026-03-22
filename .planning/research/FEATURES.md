# Feature Research: Cognitive Speed Training Engine Infrastructure

**Domain:** Adaptive psychophysics-based cognitive speed training (ACTIVE study protocol)
**Researched:** 2026-03-21
**Confidence:** HIGH (core psychophysics methods are well-established in literature; browser timing constraints well-documented)

## Feature Landscape

### Table Stakes (Protocol Is Invalid Without These)

These are not "nice to have" features. Without any one of them, the training protocol does not faithfully implement the ACTIVE study methodology, and threshold measurements are scientifically meaningless.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Canvas + rAF rendering loop** | DOM elements cannot achieve sub-frame timing precision. Canvas + requestAnimationFrame is the only browser-native path to vsync-aligned stimulus display. The jspsych-psychophysics plugin validates this exact approach for online psychophysics. | MEDIUM | Must run as a continuous rAF loop, not on-demand calls. The loop must be running before stimulus onset to avoid first-frame timing jitter (~30ms shorter first frame documented in PsychoToolbox literature). |
| **Frame-based display duration** | Millisecond-based timing produces multimodal distributions on some hardware (documented on MacBook Pro by jspsych-psychophysics FAQ). Frames are the only unit that maps to actual screen refreshes. At 60Hz: 1 frame = 16.67ms. The jspsych-psychophysics plugin explicitly recommends frames over milliseconds for strict timing control. | LOW | Store and transmit durations as frame counts. Convert to approximate ms only for user-facing display. The minimum meaningful stimulus is 1 frame. |
| **Refresh rate detection and normalization** | rAF fires at monitor refresh rate -- 60Hz, 120Hz, 144Hz all produce different frame durations (16.67ms, 8.33ms, 6.94ms). A 3-frame stimulus at 60Hz (50ms) vs 120Hz (25ms) is a completely different cognitive task. Without detection, thresholds are incomparable across devices. No web API exists to query refresh rate directly (confirmed by WHATWG HTML issue #8031). | MEDIUM | Measure actual frame interval over ~60 frames during initialization. Expose as `msPerFrame`. All duration logic must reference this, not assume 16.67ms. |
| **Fixation cross (pre-stimulus)** | Standard psychophysics protocol: fixation orients gaze to known position before stimulus onset. 500ms is the consensus duration across the literature. Without it, eye position is uncontrolled and peripheral target eccentricity is meaningless. Multiple studies use 500ms fixation as standard (confirmed across ResearchGate scientific diagrams and PsychoPy forums). | LOW | Draw "+" at canvas center. 500ms duration is standard (~30 frames at 60Hz). Must clear completely before stimulus onset -- no overlap. |
| **Pattern mask (post-stimulus)** | Backward masking prevents retinal afterimage from extending effective stimulus duration. Without the mask, a 1-frame stimulus could persist as an afterimage for 100-200ms, completely defeating the adaptive threshold algorithm. The UFOV clinical test uses a random dot pattern mask. This is foundational psychophysics (visual masking literature dates to the 1960s). | LOW | Random noise pattern or random line arrangement covering the stimulus area. Display for ~100ms (6 frames at 60Hz) after stimulus offset. Must spatially overlap the stimulus locations. |
| **Programmatic shape drawing** | The UFOV/Double Decision protocol requires identifying shapes (car/truck in the original; mapped to geometric shapes here). Shapes must be drawn on canvas -- external images introduce async loading that breaks frame-accurate timing. | MEDIUM | Circle, square, triangle, plus, X, diamond, pentagon, star, arrow. All via canvas path operations. Must be visually distinct at small sizes. White on dark background matches UFOV standard (white stimuli on black background). |
| **3-Up / 1-Down adaptive staircase** | This specific transformed staircase rule converges to the 79.4% correct threshold (established by Levitt 1971, "Transformed Up-Down Methods in Psychoacoustics"). The ACTIVE study uses this class of adaptive procedure. Other rules (2-up/1-down at 70.7%, 1-up/1-down at 50%) converge to different thresholds and are not protocol-equivalent. The 3-down/1-up variant is widely used in UFOV-style assessments. | MEDIUM | Decrease display duration after 3 consecutive correct responses. Increase after 1 incorrect response. Step size: 1 frame. Track consecutive-correct counter. Reset counter on any error or after step-down. |
| **Reversal tracking and threshold calculation** | Reversals (direction changes in the staircase) are the standard method for threshold estimation. Per the literature: average reversal points after discarding the first 4-5 (convergence period) for a stable threshold. A typical 80-trial block produces about 12 reversals with a 3-down/1-up rule and 10% step size. Trial-averaging is less stable and not standard practice. | MEDIUM | Record the display-duration value at each reversal. Discard first 4 reversals. Average remaining reversal values (arithmetic mean). Require minimum ~8 reversals for valid threshold. If fewer, flag session as incomplete. |
| **Trial sequence: fixation -> stimulus -> mask -> response -> feedback** | This is the canonical psychophysics trial structure. Each phase must complete fully before the next begins. Overlapping phases invalidate timing measurements. The UFOV protocol follows: fixation -> brief stimulus display -> random dot mask -> response screen -> feedback. | LOW | Strict sequential phases within each trial. No phase should begin until the previous one has completed its frame count. Response window opens only after mask offset. |
| **Per-trial data recording** | Without trial-level data, you cannot debug the staircase, verify timing, or analyze performance patterns. Every psychophysics experiment records trial-level data. jsPsych records per trial: stimulus, response, RT, correctness, trial index, timestamp as JSON key-value pairs. | LOW | Record per trial: trial index, display duration (frames), stimulus identity, stimulus positions, correct answer, given answer, correct (boolean), reaction time (ms via performance.now()), timestamp. Store as array of objects. |
| **Response timing via performance.now()** | Date.now() has only 1ms precision and is subject to clock adjustments. performance.now() provides sub-millisecond monotonic timing (accurate to 5 microseconds, or 100 microseconds without cross-origin isolation per Chrome 91+). Clock must start at response prompt (mask offset), not stimulus onset -- otherwise RT includes display duration and mask duration, which are experimenter-controlled, not participant-controlled. | LOW | Start timer at mask offset (when response buttons appear). Stop on first response input. Use performance.now() for both timestamps. Store difference as RT in milliseconds. |
| **Session data aggregation** | Per-session threshold, accuracy rate, and trial count are the minimum for tracking progress. The ACTIVE study measured improvement via threshold change across sessions, with effect sizes of 1.46 at immediate posttest. | LOW | Compute at session end: threshold (from reversals), overall accuracy (%), total trials, total reversals, session duration. Store alongside trial data. |
| **localStorage persistence** | The project constraint is client-side only, no backend. localStorage is the simplest persistence for small structured data. Two keys: profile (current threshold, session count, exercise unlock state) and session history (array of session summaries). 5MB limit per origin is sufficient -- a session record is ~2-5KB, so ~1000+ sessions fit. | LOW | `cognify_profile`: current state (threshold, session count, exercise progress). `cognify_sessions`: array of session records. JSON.stringify/parse. Write profile on every session completion. |
| **Session-to-session continuity** | The ACTIVE study customized starting difficulty based on previous performance (sessions 5-10 were customized to individual performance levels, targeting ~75% correct). Starting at the previous threshold x 1.1 (slightly harder than threshold) follows the principle of beginning near the expected threshold to minimize convergence trials. | LOW | On session start: read last threshold from profile. Multiply by 1.1 (round to nearest frame). Use as starting display duration. First session: use default starting duration (e.g., 15 frames = ~250ms at 60Hz). |
| **Block structure** | The ACTIVE study used structured sessions (90-minute group sessions with multiple exercise blocks). For this implementation: 30 trials per block, 2 blocks per session, 15s inter-block rest prevents fatigue effects from contaminating threshold measurements. | LOW | State machine tracks current block and trial within block. After 30 trials, transition to inter-block rest (15s countdown). After 2 blocks, transition to post-session. Each block maintains its own trial counter. |
| **Training session state machine** | Without explicit states, the session flow becomes a tangle of flags and conditionals. States: IDLE, PRE_SESSION, RUNNING, INTER_BLOCK, POST_SESSION. Each state has defined entry/exit actions and valid transitions. The game programming patterns literature (gameprogrammingpatterns.com) strongly advocates FSMs for this exact use case. | MEDIUM | Implement as a simple switch/object pattern -- no library needed for 5-6 states. Each state defines: what renders, what inputs are accepted, transition conditions. Prevent invalid transitions (e.g., cannot go from IDLE to INTER_BLOCK). |
| **Audio feedback (correct/incorrect/complete)** | Auditory feedback is standard in cognitive training protocols. It provides immediate reinforcement without requiring visual attention (which would interfere with the next trial's fixation). BrainHQ Double Decision uses audio feedback. The Web Audio API provides low-latency playback (~20ms) suitable for interactive feedback. | MEDIUM | Use Web Audio API with OscillatorNode to synthesize tones (no external audio files): short high beep for correct, short low beep for incorrect, ascending sequence for session complete. Pre-create AudioContext on first user interaction (required by browser autoplay policy). Pre-load AudioBuffers before session start. |

### Differentiators (Competitive Advantage in Accuracy/Reliability)

These features go beyond baseline protocol correctness. They improve measurement precision, user experience, or scientific validity beyond what typical consumer cognitive training implementations achieve.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Frame timing validation / dropped frame detection** | Most browser psychophysics implementations blindly trust rAF timing. In reality, GC pauses, tab switches, and system load cause dropped frames. The jspsych-psychophysics plugin measures frame timing deviations. Detecting corrupted trials prevents garbage data from silently entering the dataset. | MEDIUM | Measure actual elapsed time between rAF callbacks. If delta > 1.5x expected frame interval, flag that trial as timing-compromised. Option to discard and re-run flagged trials. Log frame timing statistics per session for quality assessment. |
| **Warm-up rAF loop** | The first rAF callback after idle can have variable timing (~30ms jitter documented in PsychoToolbox literature). The jspsych-psychophysics plugin uses a continuous rAF loop for this reason. Starting the loop before the first stimulus ensures steady state when timing-critical rendering begins. | LOW | Start rAF loop during PRE_SESSION state (while showing instructions/countdown). By the time the first trial's fixation cross appears, the loop has been running for several seconds. Zero cost, significant reliability improvement. |
| **Separate staircase per exercise type** | Exercise 1 (central identification) and Exercise 2 (divided attention) measure different cognitive abilities with different difficulty profiles. The UFOV clinical test has separate thresholds for each subtest. A single staircase would conflate them, producing meaningless thresholds for both. | LOW | Instantiate independent staircase objects per exercise type. Each maintains its own: consecutive-correct counter, reversal list, current display duration. Store thresholds separately in profile. |
| **Exercise 2 peripheral target placement (8 positions, elliptical)** | The UFOV protocol places peripheral targets at 8 radial positions at fixed eccentricity (12.5cm in clinical version). Elliptical (not circular) path accounts for typical screen aspect ratios, maintaining consistent angular distance from center regardless of direction. BrainHQ's Double Decision uses similar peripheral positioning. | MEDIUM | Calculate 8 positions on an ellipse: major axis = 80% of half-canvas-width, minor axis = 80% of half-canvas-height. Positions at 0, 45, 90, 135, 180, 225, 270, 315 degrees. Randomize target position per trial. |
| **Exercise unlock gating with dev toggle** | The ACTIVE study required baseline competency before advancing (sessions 1-5 standardized, 5-10 customized). 5 sessions of Exercise 1 before unlocking Exercise 2 prevents premature difficulty escalation. Dev toggle enables testing without grinding through 5 sessions. | LOW | Profile tracks session count per exercise. Exercise 2 locked until exerciseOneSessionCount >= 5. Dev toggle: hidden keyboard shortcut or URL param (?unlock=all) bypasses the gate. Toggle state does not persist. |
| **Staircase convergence validation** | A staircase that never converges (all correct or all incorrect) indicates the starting difficulty was wildly wrong or the user is not engaged. Recording a garbage threshold and using it for session continuity would compound the error in every subsequent session. | LOW | After session: check reversal count. If < 6 reversals in 60 trials, flag session as non-convergent. Do not update the stored threshold. Show a different post-session message. Consider adjusting starting difficulty more aggressively for next session. |
| **Reaction time outlier detection** | RTs < 150ms are likely anticipatory (not based on stimulus processing -- fastest possible visual-motor RT is ~150ms). RTs > 5000ms indicate distraction, not cognitive processing speed. Including these in staircase progression contaminates threshold estimates. | LOW | Flag trials with RT < 150ms or RT > 5000ms. Do not count them toward staircase progression (neither correct nor incorrect). Record them in trial data with a flag. Optionally re-run the trial. |
| **Canvas DPI scaling** | On high-DPI displays (Retina, 4K), canvas elements render at CSS pixel size by default, producing blurry stimuli. Since shape discrimination is the task, stimulus clarity directly affects measurement validity. | LOW | Set canvas width/height to CSS size x devicePixelRatio. Scale context by devicePixelRatio. All drawing coordinates remain in CSS pixel space. Shapes render at native display resolution. |
| **Processing speed threshold as primary metric** | Unlike generic "score" or "level," the threshold in milliseconds is a psychophysics measurement with real-world correlates. The UFOV threshold predicts driving safety and functional independence in older adults. Consumer apps hide this behind gamification -- exposing the actual measurement is scientifically honest and differentiating. | LOW | Derived directly from staircase algorithm -- the computation IS the feature. Display as "Your processing speed: Xms" rather than arbitrary points or levels. |

### Anti-Features (Do NOT Build at Infrastructure Level)

These are features that seem useful but would add complexity, compromise measurement validity, or violate project constraints. The "What to Do Instead" column provides the correct alternative.

| Feature | Why Requested | Why Problematic | What to Do Instead |
|---------|---------------|-----------------|-------------------|
| **setTimeout/setInterval for stimulus timing** | Seems simpler than rAF loop | setTimeout has 4ms minimum delay (HTML spec) and is not vsync-aligned. A 16ms setTimeout can fire at 4ms or 25ms depending on system load. Stimulus durations become unpredictable and non-reproducible. jsPsych-psychophysics, PsychoPy, and all psychophysics literature explicitly warn against this for timing-critical display. | Use requestAnimationFrame for all timing-critical rendering. Count frames, not milliseconds. |
| **DOM elements for stimulus display** | React developers naturally reach for JSX/DOM | DOM layout, paint, and composite happen asynchronously from JavaScript. You cannot guarantee when a DOM element becomes visible on screen. Canvas drawing within rAF callback is synchronous with the display refresh. The jspsych-psychophysics plugin uses canvas for this reason. | Use Canvas 2D context exclusively for stimuli. DOM is fine for UI chrome (buttons, text, instructions) that is not timing-critical. |
| **CSS animations or transitions for stimulus timing** | Modern and declarative | CSS timing is not frame-accurate and cannot be measured from JavaScript. You cannot know the exact frame a CSS animation renders a change. Completely unsuitable for psychophysics. | All stimulus timing via rAF frame counting on canvas. |
| **Millisecond-based duration storage** | Feels more precise and universal | Milliseconds do not map to screen refreshes. 17ms and 16ms are both "one frame" at 60Hz. 10ms is impossible to display. Storing ms creates false precision that does not exist in the rendering pipeline. Frame counts are the ground truth. | Store durations as frame counts. Convert to approximate ms for display only: `ms = frames * msPerFrame`. |
| **External audio files for feedback** | Higher quality sounds | Adds network dependency, async loading complexity, and potential CORS issues. Feedback sounds are simple beeps that can be synthesized in < 10 lines of Web Audio API code. The jspsych-psychophysics plugin notes that audio file timing variability is ~50ms -- worse than synthesized tones. | Synthesize feedback tones with OscillatorNode. Pre-create AudioContext on user gesture. |
| **IndexedDB for persistence** | More storage, better for structured data | Async API adds complexity. For this MVP, data fits easily in localStorage's 5MB limit. A session record is ~2-5KB. 1000 sessions = ~5MB worst case. IndexedDB's benefits (transactions, indexes, large blobs) are unnecessary for flat JSON arrays. Auto-versioning and migrations are nice but overkill for two JSON keys. | Use localStorage with JSON.stringify/parse. Monitor total size. If approaching 4MB, warn user and offer export. Migrate to IndexedDB only if storage becomes a real constraint in the future. |
| **Real-time difficulty adjustment within a trial** | More responsive adaptation | The staircase algorithm is inherently trial-by-trial. Adjusting difficulty mid-trial violates the statistical assumptions of threshold estimation. Each trial must complete with its predetermined display duration for the response to be meaningful to the staircase state. | Apply staircase rule between trials only. Current trial's display duration is fixed at trial start. |
| **Undo/replay of individual trials** | Seems user-friendly | Allowing redo invalidates the staircase sequence. The staircase state depends on the complete ordered history of responses. Inserting or replacing trials breaks the statistical properties of the threshold estimate. | Trials are final. If a trial has a timing anomaly (dropped frame), flag it but do not re-run it in the sequence. The staircase is self-correcting over many trials. |
| **Customizable staircase parameters at runtime** | Flexibility for advanced users or researchers | Changing step size, up/down rules, or convergence criteria mid-training invalidates comparison across sessions. The ACTIVE study used a fixed protocol for a reason -- consistency across participants and sessions is essential for measuring real change, not parameter-induced variation. | Hard-code 3-up/1-down with 1-frame step size. If different exercise types need different parameters, configure at build time, not runtime. |
| **Backend/API integration** | Cloud sync, multi-device | Project constraint: no backend. Adding one introduces auth, latency, error handling, offline/online sync, and hosting costs. For health-adjacent data, HIPAA/privacy concerns also arise. For an MVP, this is pure scope creep. | localStorage only. Offer JSON export for data portability. Backend is a future milestone if ever needed. |
| **Animated stimulus transitions** | Smoother visual experience | Animation between fixation/stimulus/mask would extend the trial's temporal footprint unpredictably. Each phase must have a hard onset and offset -- instantaneous transitions are psychophysics standard. Any transition animation means you cannot specify the exact frame the stimulus appears/disappears. | Instantaneous transitions between trial phases. Fixation appears/disappears in one frame. Stimulus appears/disappears in one frame. Mask appears/disappears in one frame. |
| **Complex theming / dark mode toggle** | User preference, modern app expectations | Stimulus perception changes with background color/contrast. Psychophysics requires controlled visual conditions. Allowing theme changes mid-training means thresholds measured under different conditions are not comparable. | Fixed, high-contrast presentation. Choose white-on-black (UFOV standard) or dark-on-light and commit to it. Do not offer a toggle. |
| **Gamification (streaks, badges, XP)** | Engagement and retention | Undermines clinical validity framing. ACTIVE study participants were motivated by health outcomes, not game mechanics. Gamification can also incentivize "gaming" the system (responding randomly for speed) rather than genuine engagement with the task. | Show threshold improvement in ms, session count, and accuracy trends. The real metric IS the reward. |

## Feature Dependencies

```
[Canvas + rAF rendering loop]
    |
    +--requires--> [Frame-based display duration]
    |                  |
    |                  +--requires--> [Refresh rate detection]
    |
    +--enables--> [Fixation cross display]
    +--enables--> [Pattern mask display]
    +--enables--> [Programmatic shape drawing]
    +--enables--> [Frame timing validation / dropped frame detection]
    +--enables--> [Canvas DPI scaling]
    +--enables--> [Warm-up rAF loop]

[3-Up / 1-Down staircase]
    |
    +--requires--> [Per-trial data recording]
    +--requires--> [Frame-based display duration]
    +--enables--> [Reversal tracking + threshold calculation]
    |                  |
    |                  +--enables--> [Staircase convergence validation]
    |                  +--enables--> [Session data aggregation]
    |                  +--enables--> [Session-to-session continuity]
    |
    +--enables--> [Separate staircase per exercise type]

[Trial sequence (fixation -> stimulus -> mask -> response -> feedback)]
    |
    +--requires--> [Canvas + rAF rendering loop]
    +--requires--> [Fixation cross]
    +--requires--> [Pattern mask]
    +--requires--> [Programmatic shape drawing]
    +--requires--> [Response timing (performance.now)]
    +--requires--> [Audio feedback]
    +--enables--> [Per-trial data recording]

[Training session state machine]
    |
    +--requires--> [Trial sequence]
    +--requires--> [Block structure]
    +--enables--> [Warm-up rAF loop] (start loop in PRE_SESSION)
    +--enables--> [Session data aggregation]
    |                  |
    |                  +--requires--> [Reversal tracking + threshold]
    |                  +--enables--> [localStorage persistence]

[Audio feedback]
    |
    +--requires--> [AudioContext init on user gesture]
    +--enhances--> [Trial sequence] (immediate reinforcement)

[Exercise 2 (divided attention)]
    |
    +--requires--> [Exercise 1 (central identification)] -- must work first
    +--requires--> [Peripheral target placement (8 positions)]
    +--requires--> [Separate staircase per exercise type]
    +--requires--> [Exercise unlock gating]

[localStorage persistence]
    |
    +--requires--> [Session data aggregation]
    +--enables--> [Session-to-session continuity]
    +--enables--> [Exercise unlock gating]
```

### Dependency Notes

- **Canvas + rAF is the absolute foundation**: Everything else is built on top of the rendering loop. It must be implemented and validated first, before any other feature work begins.
- **Frame-based timing requires refresh rate detection**: Without knowing the actual frame interval, frame counts cannot be converted to meaningful durations and thresholds across different monitors are incomparable.
- **Staircase requires per-trial recording**: The staircase algorithm needs the response history to determine the next trial's difficulty. Recording is structural, not optional.
- **Session continuity requires persistence**: The threshold from the previous session must be readable at session start. Persistence enables continuity.
- **Exercise 2 requires Exercise 1**: Exercise 2 adds peripheral targets to the Exercise 1 paradigm (central identification + peripheral localization). The central identification task must work fully before adding divided attention.
- **Audio requires user gesture**: Browser autoplay policy requires AudioContext creation during a user-initiated event. Must be initialized during PRE_SESSION or on a "Start" button click.
- **Warm-up rAF loop leverages session state machine**: The PRE_SESSION state is the natural place to start the rendering loop early, achieving frame timing stability before timing-critical trials begin.

## MVP Definition

### Launch With (v1)

Minimum viable implementation that faithfully executes the ACTIVE study protocol for Exercise 1 with scientifically valid timing.

- [ ] Canvas + rAF rendering loop with continuous frame counting -- the timing foundation
- [ ] Refresh rate detection (measure actual frame interval over ~60 frames at startup)
- [ ] Canvas DPI scaling (devicePixelRatio for sharp stimulus rendering)
- [ ] Programmatic shape drawing (circle, square, triangle, plus, X at minimum -- 5 shapes)
- [ ] Trial sequence: fixation (500ms/~30 frames) -> stimulus (N frames) -> mask (~100ms/6 frames) -> response -> audio feedback
- [ ] 3-Up / 1-Down staircase with 1-frame step size
- [ ] Reversal tracking and threshold calculation (discard first 4 reversals, average rest)
- [ ] Per-trial data recording (duration, stimulus, response, correctness, RT)
- [ ] Response timing via performance.now() (clock starts at mask offset)
- [ ] Session state machine (IDLE -> PRE_SESSION -> RUNNING -> INTER_BLOCK -> POST_SESSION)
- [ ] Block structure (30 trials/block, 2 blocks, 15s inter-block rest)
- [ ] Audio feedback via Web Audio API (synthesized tones, AudioContext on user gesture)
- [ ] Warm-up rAF loop (start during PRE_SESSION, before first trial)
- [ ] Session data aggregation (threshold, accuracy, trial count, reversals)
- [ ] localStorage persistence (profile + session history)
- [ ] Session-to-session continuity (start at previous threshold x 1.1)

### Add After Validation (v1.x)

Features to add once Exercise 1 is working and validated against timing expectations.

- [ ] Exercise 2 (divided attention) -- when Exercise 1 staircase is verified correct
- [ ] Peripheral target placement (8 elliptical positions)
- [ ] Separate staircase per exercise type -- required for Exercise 2
- [ ] Exercise unlock gating (5 Exercise 1 sessions) with dev toggle
- [ ] Full shape set (all 9 shapes: circle, square, triangle, plus, X, diamond, pentagon, star, arrow)
- [ ] Frame timing validation / dropped frame detection -- when you want quality metrics
- [ ] Staircase convergence validation -- when you have real session data to analyze
- [ ] Reaction time outlier detection (< 150ms anticipatory, > 5000ms distracted)

### Future Consideration (v2+)

Features to defer until the core protocol is proven and there is user demand.

- [ ] Interleaved staircase (two concurrent staircases per block for reduced bias) -- adds measurement robustness
- [ ] Exercise 3 (selective attention with distractors around peripheral target) -- UFOV subtest 3
- [ ] Data export (JSON download) -- when users want to analyze their own data
- [ ] IndexedDB migration -- only if localStorage limit is hit in practice
- [ ] Cross-session analytics (improvement rate, plateau detection) -- requires sufficient session data
- [ ] Multi-session threshold trend visualization -- deferred to dashboard milestone

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Canvas + rAF rendering loop | HIGH | MEDIUM | P1 |
| Frame-based display duration | HIGH | LOW | P1 |
| Refresh rate detection | HIGH | LOW | P1 |
| Fixation cross | HIGH | LOW | P1 |
| Pattern mask | HIGH | LOW | P1 |
| Programmatic shape drawing (5+ shapes) | HIGH | MEDIUM | P1 |
| 3-Up / 1-Down staircase | HIGH | MEDIUM | P1 |
| Reversal tracking + threshold | HIGH | MEDIUM | P1 |
| Trial sequence (5-phase) | HIGH | LOW | P1 |
| Per-trial data recording | HIGH | LOW | P1 |
| Response timing (performance.now) | HIGH | LOW | P1 |
| Session state machine | HIGH | MEDIUM | P1 |
| Block structure (30/2/15s) | HIGH | LOW | P1 |
| Audio feedback (synthesized) | MEDIUM | MEDIUM | P1 |
| localStorage persistence | HIGH | LOW | P1 |
| Session-to-session continuity | HIGH | LOW | P1 |
| Canvas DPI scaling | MEDIUM | LOW | P1 |
| Warm-up rAF loop | MEDIUM | LOW | P1 |
| Exercise 2 (divided attention) | HIGH | MEDIUM | P2 |
| Peripheral target placement (8 pos) | HIGH | MEDIUM | P2 |
| Separate staircase per exercise | MEDIUM | LOW | P2 |
| Exercise unlock gating + dev toggle | LOW | LOW | P2 |
| Full shape set (9 shapes) | MEDIUM | MEDIUM | P2 |
| Frame timing validation | MEDIUM | MEDIUM | P2 |
| Staircase convergence validation | MEDIUM | LOW | P2 |
| RT outlier detection | LOW | LOW | P2 |
| Processing speed as primary metric | MEDIUM | LOW | P2 |
| Interleaved staircase | LOW | MEDIUM | P3 |
| Exercise 3 (selective attention) | LOW | HIGH | P3 |
| Data export | LOW | LOW | P3 |

**Priority key:**
- P1: Must have for launch -- protocol validity depends on it
- P2: Should have -- adds exercise variety, measurement robustness, and quality safeguards
- P3: Nice to have -- future enhancement if product proves viable

## Competitor Feature Analysis

| Feature | BrainHQ Double Decision | UFOV Clinical Test | Cognify (Our Approach) |
|---------|------------------------|--------------------|-------------------------|
| Central identification | Car vs truck discrimination | Car vs truck pictogram | Geometric shape identification (no image assets needed) |
| Peripheral target | Route 66 sign at 8 positions | Car at 8 radial positions (12.5cm eccentricity) | Shape at 8 elliptical positions (80% eccentricity) |
| Masking | Yes (implied by protocol) | Yes (random dot pattern, explicitly documented) | Yes (random noise pattern on canvas) |
| Adaptive method | Proprietary (not published; adjusts speed, distractors, eccentricity, similarity simultaneously) | Staircase-based threshold at 75% correct | 3-Up/1-Down transformed staircase at 79.4% correct (published method) |
| Display duration range | "Milliseconds" (specific range not published) | 16.67ms - 500ms in 16.67ms steps (1-30 frames at 60Hz) | 1 frame minimum, frame-based units, refresh-rate-aware |
| Difficulty progression | Multiple axes: distractor count, eccentricity, central similarity, background complexity | Fixed protocol per subtest, duration-only adaptation | Duration-only via staircase (clean single-variable adaptation) |
| Platform | Web app (commercial, ~$14/mo subscription) | Clinical software (licensed, requires certified administrator) | Web app (open, free, client-side only, no account) |
| Data persistence | Cloud (account required, server-side) | Clinical database (institutional) | localStorage (no account, fully offline-capable) |
| Scientific basis | Derived from ACTIVE study protocol | Assessment tool used in ACTIVE study | ACTIVE study training protocol (open, faithful implementation) |
| Audio feedback | Yes | N/A (clinical setting with examiner present) | Yes (synthesized tones via Web Audio API) |
| Scoring unit | Milliseconds (lower = better) | Milliseconds at 75% correct threshold | Frames internally, displayed as approximate ms (lower = better) |
| Cost to user | $14/month or $96/year | Clinical fee (varies by institution) | Free |
| Offline capable | No (requires account/server) | Yes (installed software) | Yes (fully client-side, no network needed) |

## Sources

### Psychophysics Methodology (HIGH confidence)
- [Levitt 1971 - Transformed Up-Down Methods in Psychoacoustics](http://bdml.stanford.edu/twiki/pub/Haptics/DetectionThreshold/psychoacoustics.pdf) -- original paper establishing convergence levels for N-up/M-down rules
- [Leek 2001 - Adaptive procedures in psychophysical research](https://link.springer.com/article/10.3758/BF03194543) -- comprehensive review of staircase methods, reversal averaging, threshold estimation
- [PMC - Evaluating staircase performance](https://pmc.ncbi.nlm.nih.gov/articles/PMC6645707/) -- reversal averaging specifics, ~12 reversals per 80-trial block with 3-down/1-up
- [PMC - Determining thresholds using adaptive procedures](https://pmc.ncbi.nlm.nih.gov/articles/PMC4831214/) -- comparing adaptive procedure efficiency
- [Purdue - Adaptive Psychophysical Methods lecture notes](https://engineering.purdue.edu/~ece511/LectureNotes/pp12.pdf) -- step size ratios and convergence properties

### Browser Timing Precision (HIGH confidence)
- [jspsych-psychophysics plugin homepage](https://jspsychophysics.hes.kyushu-u.ac.jp/) -- validates rAF + canvas approach for online psychophysics
- [jspsych-psychophysics FAQ](https://jspsychophysics.hes.kyushu-u.ac.jp/faq/) -- frame vs ms recommendation, platform-dependent timing variability on MacBook
- [jsPsych timing accuracy documentation](https://www.jspsych.org/v7/overview/timing-accuracy/) -- official timing accuracy guidance
- [Springer - Best practices for web-based stimulus presentation](https://link.springer.com/article/10.3758/s13428-018-1126-4) -- rAF timing accuracy comparable to PsychoToolbox in most cases
- [PLOS ONE - Millisecond timing accuracy in online experiments](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0235249) -- validates browser-based timing for psychophysics
- [ResearchGate - Precise display time measurement in JavaScript](https://www.researchgate.net/publication/360674550_Precise_display_time_measurement_in_JavaScript_for_web-based_experiments) -- rAF frame counting produces ~16.7ms precision

### ACTIVE Study Protocol (HIGH confidence)
- [PMC - Speed of Processing Training in ACTIVE](https://pmc.ncbi.nlm.nih.gov/articles/PMC3947605/) -- protocol details: 10 sessions, 90min each, 18+ tasks, customized difficulty in sessions 5-10
- [PMC - ACTIVE Study Overview and Major Findings](https://pmc.ncbi.nlm.nih.gov/articles/PMC3934012/) -- comprehensive trial overview
- [NIH - Cognitive speed training over weeks may delay dementia](https://www.nih.gov/news-events/news-releases/cognitive-speed-training-over-weeks-may-delay-diagnosis-dementia-over-decades) -- 25% dementia risk reduction, 2026 findings
- [Johns Hopkins - 20-year outcome data](https://www.hopkinsmedicine.org/news/newsroom/news-releases/2026/02/cognitive-speed-training-linked-to-lower-dementia-incidence-up-to-20-years-later) -- long-term follow-up results

### UFOV / Double Decision Protocol (MEDIUM confidence)
- [BrainHQ Double Decision exercise page](https://www.brainhq.com/why-brainhq/about-the-brainhq-exercises/attention/double-decision/) -- commercial implementation, difficulty progression mechanisms
- [Visual Awareness Research Group - What is UFOV](https://www.visualawareness.com/what-is-ufov/) -- clinical UFOV protocol overview
- [BrainHQ - UFOV Development](https://www.brainhq.com/partners/brainhq-for-clinicians/ufov/development/) -- UFOV history and subtest structure
- [ResearchGate - UFOV procedure illustration](https://www.researchgate.net/figure/Illustration-of-the-Useful-Field-of-View-UFOV-procedure-The-stimulus-displays-for_fig1_291173964) -- display durations 16.67-500ms, random dot mask, 8 peripheral positions, 75% threshold

### Web APIs (HIGH confidence)
- [MDN - requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame) -- rAF fires at display refresh rate (60/75/120/144 Hz)
- [MDN - performance.now()](https://developer.mozilla.org/en-US/docs/Web/API/Performance/now) -- sub-millisecond monotonic timing, 5us or 100us resolution
- [MDN - High precision timing](https://developer.mozilla.org/en-US/docs/Web/API/Performance_API/High_precision_timing) -- DOMHighResTimeStamp specification
- [Chrome - Cross-origin isolation and timer precision](https://developer.chrome.com/blog/cross-origin-isolated-hr-timers) -- performance.now() reduced to 100us without COOP/COEP headers
- [MDN - Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) -- AudioContext, OscillatorNode for tone synthesis
- [MDN - Web Audio API Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices) -- pre-loading buffers, autoplay policy
- [MDN - localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) -- 5MB limit, no expiration, string-only
- [WHATWG - Refresh rate discovery issue #8031](https://github.com/whatwg/html/issues/8031) -- no web API for querying display refresh rate

### Adaptive Staircase Libraries (MEDIUM confidence)
- [StaircaseJS on GitHub](https://github.com/hadrienj/StaircaseJS) -- JavaScript staircase with x-up y-down, factor-based steps, multi-staircase support
- [how-to-staircase on GitHub](https://github.com/sijiazhao/how-to-staircase) -- JavaScript adaptive staircase thresholding example

### State Management Patterns (HIGH confidence)
- [Game Programming Patterns - State](https://gameprogrammingpatterns.com/state.html) -- FSM patterns for game session management, enter/exit actions
- [Kent C. Dodds - Simple state machine library](https://kentcdodds.com/blog/implementing-a-simple-state-machine-library-in-javascript) -- lightweight JS FSM implementation

### Visual Masking (HIGH confidence)
- [Wikipedia - Visual masking](https://en.wikipedia.org/wiki/Visual_masking) -- backward masking theory and mechanisms
- [Scholarpedia - Visual masking](http://www.scholarpedia.org/article/Visual_masking) -- pattern masking vs metacontrast masking

---
*Feature research for: Cognify -- adaptive cognitive speed training engine infrastructure*
*Researched: 2026-03-21*
