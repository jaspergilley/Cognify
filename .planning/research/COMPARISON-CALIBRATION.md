# Comparison: Clinical Validity & Calibration Approaches

**Context:** Two competing approaches to timing calibration and clinical rigor in CogSpeed
**Recommendation:** Adopt frame-unit staircase and passive dropped-frame logging from the alternative; reject mandatory pre-session calibration, input latency measurement, and session discard as over-engineering
**Researched:** 2026-03-21

## The Two Proposals

| Dimension | Original Plan | Alternative Proposal |
|-----------|---------------|---------------------|
| Step sizes | Fixed ms values (stepDown=17ms, stepUp=25ms) | Frame units converted via detected refresh rate |
| Calibration | Refresh rate detection at startup | Mandatory 2-3s runtime calibration every session |
| Dropped frames | None | Detect and flag/discard sessions |
| Input latency | None | Measure input-to-detection latency |
| Bluetooth audio | None | Check outputLatency, disable if >50ms |
| Timing integrity | visibilitychange pause | Frame consistency verification |
| Validation reference | ACTIVE study protocol | BrainHQ as existence proof |

---

## Question 1: Is mandatory pre-session calibration worth it?

**Verdict: NO for MVP. Partial YES as silent background check in v1.x.**

### What the alternative proposes

A 2-3 second calibration phase every session that:
1. Measures actual refresh rate by counting rAF frames
2. Verifies single-frame rendering consistency (detects dropped frames)
3. Measures input-to-detection latency

### What this actually adds beyond startup refresh rate detection

The current plan already detects refresh rate at startup by measuring rAF frame intervals over ~60 frames. The alternative proposes doing this EVERY session plus two additional checks.

**Refresh rate re-measurement per session:** Marginally useful. Refresh rate does not change between sessions on the same device unless the user has changed monitors or display settings. On laptops (the primary use case), the refresh rate is fixed hardware. On desktops with external monitors, a one-time measurement at app load is sufficient because the app must be reloaded to change displays anyway. Re-measuring adds 2-3 seconds of user-facing delay for no practical benefit in 99% of cases.

**Single-frame rendering consistency check:** This IS genuinely useful. It answers: "Can this device actually render a single frame at the detected refresh rate without dropping?" The existing plan does not check this. A device might report 60Hz but consistently drop every other frame due to GPU load, producing an effective 30Hz display. This is a real problem documented in the timing mega-study (Bridges et al., PMC7512138) -- inter-trial timing variability of 5-10ms is common in browser experiments, and some setups show bimodal distributions where half the frames are doubled.

**However**, this check does not need to be a blocking pre-session UI step. It can run silently during the PRE_SESSION warm-up phase (which already shows target objects for 3 seconds). Measure frame deltas during warm-up. If >15% of frames deviate by more than 50% from expected interval, store a quality flag but do not block the session.

### The BrainHQ model

BrainHQ's UFOV assessment documentation reveals their approach:
- Timing tolerance of +/-5% of requested presentation time with a minimum of 2ms
- If >50% of presentations fail tolerance, a warning is shown
- Any individual trial outside tolerance is **repeated** until it meets tolerance
- There is NO mandatory pre-session calibration step

This is the right model: measure, flag, compensate -- not gate.

### Recommendation

- Keep one-time refresh rate detection at startup (already planned)
- Add silent frame consistency check during PRE_SESSION warm-up (cheap, no UX cost)
- Store frame quality metrics alongside session data (valuable for later analysis)
- Do NOT add a mandatory user-facing calibration step (bad UX, not what BrainHQ does)

**Confidence: HIGH** -- Validated against BrainHQ UFOV technical properties documentation. 140+ peer-reviewed papers validate their approach without mandatory calibration.

---

## Question 2: Is the frame-unit staircase a meaningful distinction?

**Verdict: YES. This is not semantic -- it changes correctness at the boundary conditions.**

### The core difference

The original plan uses step sizes in milliseconds:
- stepDown = 17ms (roughly 1 frame at 60Hz)
- stepUp = 25ms (roughly 1.5 frames at 60Hz)

The alternative proposes step sizes in frame units:
- stepDown = 1 frame
- stepUp = 1 frame (or 2 frames)

### Why this matters concretely

At 60Hz, 17ms rounds to 1 frame -- so they appear equivalent. But consider higher refresh rates:

**At 120Hz (1 frame = 8.33ms):**
- Original: stepDown = 17ms = `Math.round(17 / 8.33)` = 2 frames. The staircase takes 2-frame steps instead of 1.
- Alternative: stepDown = 1 frame = 8.33ms. The staircase takes 1-frame steps.

These produce DIFFERENT staircases with different convergence properties. The ms-based approach has coarser resolution at higher refresh rates and finer resolution at lower rates -- the opposite of what you want. Higher refresh rate displays SHOULD give finer granularity because you have more discrete duration levels available.

**At the minimum display boundary (1 frame):**
- At 120Hz, the ms-based approach steps down by 17ms = 2 frames, potentially overshooting the perceptual threshold by one frame. The frame-based approach steps by exactly 1 frame.

**The asymmetric step size problem:**
The original plan uses asymmetric steps (17ms down, 25ms up). At 60Hz: down = 1 frame, up = 1.5 frames (rounds to 2). At 120Hz: down = 2 frames, up = 3 frames. The asymmetry ratio changes with refresh rate. This is a subtle bug that produces different staircase behavior on different monitors.

### BrainHQ confirms frame units are correct

BrainHQ's UFOV assessment documentation states: "Presentation times vary between 16.67 ms and 500 ms in steps of 16.67 ms (1 frame on a 60-Hz computer screen)." Their step size is 1 frame, not a fixed millisecond value. This is the clinical standard.

### Current state of the codebase

The existing ARCHITECTURE.md staircase code already uses frame units correctly (`displayFrames - 1` and `displayFrames + 1`). But REQUIREMENTS.md (STRC-02, STRC-03) still references milliseconds. This is a documentation inconsistency that should be resolved in favor of frames.

### Recommendation

Adopt frame-unit step sizes. The staircase should operate entirely in frame space:
- `displayFrames` is the state variable (integer, minimum 1)
- `stepDown = 1` (frame)
- `stepUp = 1` (frame) -- or 2 for faster recovery from lucky guesses
- Convert to milliseconds only for user-facing display: `thresholdMs = thresholdFrames * msPerFrame`

If asymmetric steps are desired for faster convergence, define them as frame units: stepDown = 1 frame, stepUp = 2 frames. This preserves the ratio across all refresh rates.

**Confidence: HIGH** -- BrainHQ UFOV documentation explicitly uses 1-frame steps. The architecture code already implements this. Requirements docs need updating to match.

---

## Question 3: Dropped frame detection -- how to implement? Practical for MVP?

**Verdict: Trivially practical. 4 lines of code. Add it now, act on it later.**

### Implementation

Dropped frame detection using rAF timestamps is straightforward:

```javascript
// Inside the rAF callback
const delta = timestamp - lastTimestampRef.current;
const expectedDelta = msPerFrame; // e.g., 16.67 for 60Hz

if (delta > expectedDelta * 1.5) {
  droppedFrameCountRef.current++;
  if (trialStateRef.current === 'STIMULUS') {
    currentTrialRef.current.timingCompromised = true;
  }
}
lastTimestampRef.current = timestamp;
```

This is 4 lines in the existing rAF loop. Zero performance cost. No architectural changes. No new dependencies.

### How to detect dropped frames specifically

The `timestamp` parameter in the rAF callback is a `DOMHighResTimeStamp` provided by the browser. At 60Hz, consecutive calls should be ~16.67ms apart. If `delta > 25ms` (1.5x expected), the browser skipped a vsync -- a frame was dropped. The stimulus was visible for longer than intended.

Chrome is the most consistent browser for rAF timing (mean 16.632ms, sd 0.364ms per Springer research). Firefox is slightly less consistent (mean 17.217ms, sd 0.898ms). Safari is worst (mean 17.757ms, sd 1.796ms). Using a 1.5x threshold accommodates normal variance while catching genuine drops.

### What NOT to do with dropped frame data

**Do NOT discard and re-run trials.** This changes the staircase sequence, violating the statistical assumptions of threshold estimation. The staircase is self-correcting over many trials -- one dropped frame on one trial does not invalidate the session.

**Do NOT block sessions.** BrainHQ's approach is more nuanced: they retry individual out-of-tolerance presentations, but they do not discard entire sessions.

**Do NOT attempt BrainHQ's trial-retry model for MVP.** Retrying a trial means pausing the staircase, re-presenting the same stimulus at the same duration, and only advancing when the trial meets timing tolerance. This adds significant state machine complexity. It is the right approach for a clinical product. It is over-engineering for an MVP.

### What to do with dropped frame data

1. Flag individual trials with `timingCompromised: true` in trial data (MVP)
2. Count total dropped frames per session, store in session metadata (MVP)
3. After session, if >30% of stimulus-phase frames were dropped, show a note: "Timing quality was reduced this session. Close other tabs for better accuracy." (v1.x)
4. In session data export, include timing quality metrics for post-hoc analysis (v1.x)

### Recommendation

Add the delta check to the rAF loop from day 1. It is trivial to implement and captures valuable data quality information. Defer any user-facing warnings or behavioral changes (retry, discard) to v1.x.

**Confidence: HIGH** -- rAF timestamp delta approach is documented on MDN and used by jspsych-psychophysics. The timing mega-study confirms 5-10ms inter-trial variability is normal and does not invalidate psychophysics results.

---

## Question 4: Input latency measurement -- relevant for CogSpeed?

**Verdict: NO. Not relevant. Do not build it.**

### Why the alternative proposes it

The idea is to measure the delay between a user's physical input (tap/click) and when JavaScript registers the event. This matters in reaction-time experiments where absolute RT accuracy is the primary dependent variable.

### Why it does not matter for CogSpeed

The critical fact is in the project spec (TRAL-03): "Reaction time clock starts when response prompt appears (after mask), not at stimulus onset."

CogSpeed is a **stimulus detection threshold** experiment, not a reaction time experiment. The dependent variable is the display duration at which the user can still identify the stimulus -- measured in frames, controlled by the staircase. The staircase algorithm's input is binary: correct or incorrect. It does not use reaction time at all.

Reaction time IS recorded as metadata, but:
1. RT does not feed the staircase
2. Input latency creates a constant offset (10-40ms per jsPsych documentation) that is identical across trials on the same device
3. CogSpeed does not compare RT values across different devices
4. For within-subject comparisons (which is all CogSpeed does), constant offsets cancel out

### What jsPsych says

jsPsych's timing accuracy documentation states that response times in browser-based experiments tend to be 10-40ms longer than lab software with "similar variance." This constant offset is the input latency. They do NOT recommend measuring or correcting for it, because it does not affect within-subject experimental designs.

### Recommendation

Do not build it. The alternative is solving a problem that CogSpeed does not have. If reaction time were the dependent variable (as in a simple RT task), input latency compensation would matter. For a threshold estimation task with binary correct/incorrect input, it is irrelevant.

**Confidence: HIGH** -- jsPsych documentation and the timing mega-study both confirm that input latency offsets are constant and irrelevant for within-subject designs. CogSpeed's staircase is binary, not RT-dependent.

---

## Question 5: Bluetooth audio disable -- clever or over-engineering?

**Verdict: Genuinely clever edge case. The detection is trivial. The fallback UI is not. Defer the full solution.**

### The problem is real

Bluetooth A2DP audio latency is typically 150-180ms, confirmed by real measurements:
- Bluetooth headphones: ~178ms (0.178s outputLatency)
- Built-in speakers: ~15-24ms
- Wired headphones: ~15-30ms

For feedback tones that should play immediately after a response, 150ms delay is perceptibly jarring. The user taps, sees a visual green flash instantly, but hears the beep 150ms later. It feels broken.

### AudioContext.outputLatency is the right API

This property reached Baseline 2025 status (Chrome, Firefox, Edge as of March 2025). It returns hardware output latency in seconds:

```javascript
const audioCtx = new AudioContext();
if (audioCtx.outputLatency > 0.05) {
  // High-latency output detected (Bluetooth)
  useVisualOnlyFeedback = true;
}
```

The alternative's 50ms threshold is well-chosen. It cleanly separates wired devices (<30ms) from Bluetooth A2DP (>150ms) with wide margin.

### Why NOT for MVP

1. Audio feedback is not timing-critical for protocol validity. The staircase does not use audio timing.
2. The detection code is ~5 lines. But the visual-only fallback indicator requires design and implementation of an alternative feedback mechanism (screen flash? border pulse? icon animation?). That is not trivial.
3. Bluetooth users are a minority subset. The consequence of delayed audio is mild annoyance, not data corruption.
4. Safari support for `outputLatency` may still be incomplete on older iOS versions. If the property returns `undefined`, you need a fallback path anyway -- which means more conditional logic.

### What to do instead for MVP

Play audio feedback on all devices. Bluetooth users get slightly delayed beeps. This is acceptable. The visual feedback (green/red flash for 300ms) is the primary feedback channel anyway.

### Recommendation for v1.x

When adding this feature, the implementation is:
1. Check `audioCtx.outputLatency` after AudioContext creation (during first user gesture)
2. If >50ms OR if property is undefined: set a flag `highLatencyAudio = true`
3. When `highLatencyAudio` is true: skip `playCorrect()`/`playIncorrect()` calls, substitute a more prominent visual indicator (brighter flash, screen border pulse, or haptic feedback via `navigator.vibrate()` on mobile)
4. Store audio latency in session metadata

**Confidence: MEDIUM** -- API confirmed via MDN (Baseline 2025). Bluetooth latency values confirmed via multiple independent measurements. Safari/iOS support needs real-device verification.

---

## Question 6: Does BrainHQ validate the simpler or more rigorous approach?

**Verdict: BrainHQ validates a MIDDLE ground -- more rigorous than the original on step units and timing verification, less rigorous than the alternative on calibration and session gating.**

### BrainHQ's actual technology

BrainHQ is a browser-based web application running on standard web technology. Confirmed evidence:
- System requirements page recommends Chrome, also supports Firefox and Edge
- UFOV assessment runs "on any Internet-connected computer" via browser
- Available as iOS and Android native apps alongside the web version
- No Flash, WebGL, or native plugin requirements documented anywhere
- 100+ patents cover their exercise technologies

This IS standard web tech. HTML5 Canvas + JavaScript, running in mainstream browsers.

### What BrainHQ's UFOV actually does for timing quality

From the UFOV technical properties documentation (the most revealing source):

1. **Frame-unit steps:** "Presentation times vary between 16.67 ms and 500 ms in steps of 16.67 ms (1 frame on a 60-Hz computer screen)"
2. **Timing tolerance with retry:** "+/- 5% of requested presentation time with a minimum of 2 ms. Any trial that is outside the display tolerance is repeated until it meets the tolerance limitations."
3. **Session-level quality warning:** "If more than 50% of the presentations fail to meet the tolerance level, a warning will be shown"
4. **Double staircase:** "Performance on all subtests is scored as the display presentation time at which the test taker achieves an accuracy of 75% as determined by a double-staircase procedure"
5. **Early termination:** "The assessment ends early if there are three consecutive trials at fastest (17 ms) or at slowest (500 ms) presentation times, but the algorithm only exits early if at least 10 trials have been done"

### What BrainHQ does NOT do

- NO mandatory pre-session calibration UI
- NO input latency measurement
- NO Bluetooth audio detection
- NO session discard based on hardware capability
- NO explicit device calibration step

### What this means for CogSpeed

BrainHQ proves that **standard web tech + frame-unit timing + per-trial tolerance checking** is sufficient for clinical-grade cognitive training validated by 140+ peer-reviewed papers. Their approach is:

| BrainHQ Practice | Original Plan | Alternative | Verdict |
|-----------------|---------------|-------------|---------|
| Frame-unit steps | NO (ms-based) | YES | **Alternative is correct.** Adopt frame units. |
| Per-trial timing tolerance | NO | Partial (session-level) | **Neither has it right.** BrainHQ checks per-trial. For MVP, passive logging is sufficient. |
| Trial retry on bad timing | NO | NO | **BrainHQ does this but it is v1.x scope.** Adds state machine complexity. |
| Mandatory pre-session calibration | NO | YES | **Original is correct.** BrainHQ does not do this. |
| Session quality warning | NO | YES (session discard) | **Alternative goes too far.** BrainHQ warns, does not discard. |
| Input latency measurement | NO | YES | **Original is correct.** BrainHQ does not measure this. |

### The key takeaway

BrainHQ has achieved clinical validation using an approach that is closer to the original plan's simplicity, augmented with frame-unit timing and per-trial tolerance checking. The alternative overestimates what is needed for clinical validity. BrainHQ does not need mandatory calibration, input latency measurement, or session discard to produce outcomes validated by 140+ peer-reviewed papers.

**Confidence: HIGH** -- Direct from BrainHQ UFOV technical properties documentation and system requirements.

---

## Synthesis: What to adopt from each proposal

### Adopt from the alternative (3 elements)

| Element | Why | When | Cost |
|---------|-----|------|------|
| Frame-unit step sizes | Clinically correct (BrainHQ uses this). Handles multi-refresh-rate correctly. Architecture code already does this. | MVP | Zero -- already implemented in architecture code |
| Per-trial timing delta check | 4 lines of code captures dropped frames for data quality. Passive, no UX cost. | MVP | ~15 minutes |
| Store timing quality metrics with session data | Enables post-hoc analysis. Adds a few fields to existing data objects. | MVP | ~10 minutes |

### Defer from the alternative (2 elements)

| Element | Why defer | When |
|---------|----------|------|
| Session quality warning | Useful but needs UX design. Not protocol-critical. | v1.x |
| Bluetooth audio detection + visual fallback | Real edge case, clean API, but needs fallback UI design work. | v1.x |

### Reject from the alternative (3 elements)

| Element | Why reject |
|---------|-----------|
| Mandatory pre-session calibration UI | BrainHQ does not do this. Bad UX. Startup detection is sufficient. |
| Input latency measurement | CogSpeed staircase is binary correct/incorrect. RT is metadata, not the dependent variable. Irrelevant. |
| Session discard on bad hardware | Too aggressive. BrainHQ warns, does not discard. The staircase self-corrects over many trials. |

### Keep from the original (4 elements)

| Element | Why |
|---------|-----|
| Refresh rate detection at startup | Sufficient. No need to re-measure every session. |
| visibilitychange pause handling | Correct and important. Prevents corrupted trials when tab is backgrounded. |
| Reversal averaging with first-4 discard | Standard psychophysics. Consistent with BrainHQ's staircase approach. |
| Overall simplicity | BrainHQ validates that simple web tech achieves clinical outcomes. Complexity is not rigor. |

### Fix in the original (2 elements)

| Element | Issue | Fix |
|---------|-------|-----|
| Step sizes in milliseconds (STRC-02, STRC-03) | Should be frame units, not ms. Ms-based steps produce inconsistent behavior across refresh rates. | Change to stepDown=1 frame, stepUp=1 frame (or 2 for faster recovery) |
| No dropped frame awareness | Misses free data quality information | Add 4-line rAF timestamp delta check; flag compromised trials |

---

## Impact on Requirements Documents

The following requirements should be updated:

| Requirement | Current Text | Recommended Change |
|-------------|-------------|-------------------|
| STRC-02 | "displayTime decreases by stepDown (~1 frame / 17ms)" | "displayFrames decreases by 1 frame" |
| STRC-03 | "displayTime increases by stepUp (~25ms)" | "displayFrames increases by 1 frame" (or 2 for faster recovery) |
| STRC-04 | "displayTime clamps between minDisplayTime (1 frame) and maxDisplayTime (500ms)" | "displayFrames clamps between 1 and maxFrames (calculated as `Math.round(500 / msPerFrame)`)" |
| NEW | N/A | Add: "Per-trial rAF timestamp delta recorded. Trials where stimulus-phase frame delta exceeds 1.5x expected interval flagged as `timingCompromised: true`" |

---

## Sources

### BrainHQ / UFOV (HIGH confidence)
- [BrainHQ UFOV Technical Properties](https://support.brainhq.com/hc/en-us/articles/28374425042061-What-are-the-technical-properties-of-the-UFOV-assessment) -- frame-unit steps, +/-5% tolerance, trial retry, double staircase, session warning threshold
- [BrainHQ System Requirements](https://support.brainhq.com/hc/en-us/articles/360018503852-System-requirements) -- Chrome recommended, standard web technology
- [BrainHQ World Class Science](https://www.brainhq.com/world-class-science/) -- 140+ peer-reviewed publications
- [BrainHQ Double Decision](https://www.brainhq.com/why-brainhq/about-the-brainhq-exercises/attention/double-decision/) -- speed-of-processing exercise details, ACTIVE study lineage

### Web Timing Research (HIGH confidence)
- [Timing Mega-Study, Bridges et al. (PMC7512138)](https://pmc.ncbi.nlm.nih.gov/articles/PMC7512138/) -- 5-10ms inter-trial variability in browser experiments, rAF comparable to PsychoToolbox, Chrome most consistent
- [jsPsych Timing Accuracy](https://www.jspsych.org/v7/overview/timing-accuracy/) -- RT offset of 10-40ms, display timing 17-33ms variability, frame-level control possible
- [Best Practices for Web-Based Stimulus Presentation, Springer](https://link.springer.com/article/10.3758/s13428-018-1126-4) -- rAF timing accuracy, Chrome consistency (sd=0.364ms)
- [PLOS ONE - Millisecond Timing in Online Experiments](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0235249) -- rAF with real-time priority matches PsychoToolbox accuracy

### Web Audio API (MEDIUM confidence)
- [MDN AudioContext.outputLatency](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/outputLatency) -- Baseline 2025, hardware latency estimation in seconds
- [jamieonkeys.dev - Web Audio Output Latency](https://www.jamieonkeys.dev/posts/web-audio-api-output-latency/) -- Bluetooth ~178ms vs built-in ~24ms, real measurements
- [blog.paul.cx - Audio/Video Synchronization](https://blog.paul.cx/post/audio-video-synchronization-with-the-web-audio-api/) -- outputLatency practical usage patterns
- [web.dev - Audio Output Latency](https://web.dev/articles/audio-output-latency) -- synchronization strategies

### Browser Timer Precision (HIGH confidence)
- [MDN performance.now()](https://developer.mozilla.org/en-US/docs/Web/API/Performance/now) -- sub-ms precision, 100us without cross-origin isolation
- [MDN High Precision Timing](https://developer.mozilla.org/en-US/docs/Web/API/Performance_API/High_precision_timing) -- DOMHighResTimeStamp specification
- [MDN requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame) -- timestamp parameter, vsync alignment

---
*Clinical validity and calibration comparison for: CogSpeed*
*Researched: 2026-03-21*
