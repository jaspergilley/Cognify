# Architecture Patterns

**Domain:** Frame-accurate canvas-based adaptive cognitive training app
**Researched:** 2026-03-21

## Recommended Architecture

Two-layer architecture: a **React UI layer** for screens, buttons, and state management, and a **Canvas engine layer** for frame-accurate stimulus rendering that operates independently of React's render cycle.

```
+------------------------------------------------------------------+
|  React Application Shell (Tailwind CSS)                          |
|  +-----------------------------+  +----------------------------+ |
|  |  Screen Router              |  |  Session State (useState)  | |
|  |  (IDLE/PRE/RUN/REST/POST)   |  |  profile, history, results | |
|  +-----------------------------+  +----------------------------+ |
|                                                                  |
|  +------------------------------------------------------------+ |
|  |  Canvas Viewport Component                                  | |
|  |  +------------------------------------------------------+  | |
|  |  |  Rendering Engine (rAF loop -- NOT React-managed)     |  | |
|  |  |  - Frame counter (useRef)                             |  | |
|  |  |  - Stimulus drawer                                    |  | |
|  |  |  - Mask drawer                                        |  | |
|  |  |  - Fixation cross drawer                              |  | |
|  |  +------------------------------------------------------+  | |
|  +------------------------------------------------------------+ |
|                                                                  |
|  +---------------------------+  +-----------------------------+  |
|  |  Response Panel           |  |  Audio Engine (singleton)   |  |
|  |  (React buttons, 48x48+) |  |  Web Audio API              |  |
|  +---------------------------+  +-----------------------------+  |
|                                                                  |
|  +------------------------------------------------------------+ |
|  |  Persistence Layer (localStorage wrapper)                   | |
|  |  cogspeed_profile | cogspeed_sessions                       | |
|  +------------------------------------------------------------+ |
+------------------------------------------------------------------+
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| App Shell | Top-level routing between screens (idle, training, results) | All components via props/callbacks |
| Session State Machine | Manages IDLE -> PRE_SESSION -> RUNNING -> INTER_BLOCK -> POST_SESSION -> IDLE transitions | Canvas engine (start/stop), response panel (enable/disable), persistence layer (save) |
| Canvas Viewport | Hosts the `<canvas>` element, initializes rAF loop, handles resize | Rendering engine (owns it), React layer (via callbacks for trial completion) |
| Rendering Engine | Frame counting, stimulus drawing, mask drawing, fixation cross. Pure imperative code -- no React. | Canvas context (direct draw calls), trial state (via refs) |
| Staircase Algorithm | Pure function: takes trial result, returns next display duration in frames | Session state machine (called after each trial) |
| Shape Drawer | Pure functions that draw specific shapes on a canvas context given position/size | Rendering engine (called during stimulus frame) |
| Response Panel | React buttons for shape identification. Captures response + reaction time. | Session state machine (reports response), canvas engine (triggers next trial) |
| Audio Engine | Singleton AudioContext. Methods: playCorrect(), playIncorrect(), playComplete() | Response handler (triggered after response evaluation) |
| Persistence Layer | Read/write JSON to localStorage. Schema versioning. | Session state machine (save on session end), app init (load on mount) |

### Data Flow

**Trial cycle (one trial):**
```
1. Session state machine signals: "start trial N"
2. Rendering engine receives trial config via ref:
   { stimulusShape, displayFrames, peripheralTargets? }
3. rAF loop: draw fixation cross for 30 frames (500ms)
4. rAF loop: draw stimulus for N frames (displayFrames)
5. rAF loop: draw pattern mask for 6 frames (100ms)
6. Rendering engine signals React: "ready for response"
   (via callback ref, NOT setState -- avoid re-render during animation)
7. React enables response panel, starts reaction timer
8. User taps response button
9. Response handler:
   a. Stops reaction timer
   b. Evaluates correctness
   c. Calls staircase.update(correct/incorrect)
   d. Calls audioEngine.playCorrect() or playIncorrect()
   e. Records trial data
   f. Signals rendering engine: "start next trial" (or end block)
```

**Critical boundary: rAF loop -> React notification.**
The rAF loop must NOT call `setState` during rendering frames. Instead, it sets a ref flag that React reads, or calls a stable callback (via useRef) after the mask phase completes.

## Patterns to Follow

### Pattern 1: Ref-Based Animation State
**What:** Store all animation-loop mutable state in `useRef`, not `useState`.
**When:** Any value read or written inside the rAF callback.
**Why:** `useState` triggers re-renders. At 60fps, that means 60 re-renders/second -- devastating for performance and timing accuracy.

```jsx
function useAnimationLoop(canvasRef, onTrialComplete) {
  const frameIdRef = useRef(null);
  const frameCountRef = useRef(0);
  const trialStateRef = useRef('IDLE'); // FIXATION | STIMULUS | MASK | WAITING
  const displayFramesRef = useRef(1);

  const animate = useCallback((timestamp) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    frameCountRef.current++;

    switch (trialStateRef.current) {
      case 'FIXATION':
        drawFixationCross(ctx);
        if (frameCountRef.current >= 30) { // ~500ms at 60fps
          trialStateRef.current = 'STIMULUS';
          frameCountRef.current = 0;
        }
        break;
      case 'STIMULUS':
        drawStimulus(ctx, /* shape config */);
        if (frameCountRef.current >= displayFramesRef.current) {
          trialStateRef.current = 'MASK';
          frameCountRef.current = 0;
        }
        break;
      case 'MASK':
        drawPatternMask(ctx);
        if (frameCountRef.current >= 6) { // ~100ms
          trialStateRef.current = 'WAITING';
          onTrialComplete.current(); // callback ref, not state
        }
        break;
    }

    if (trialStateRef.current !== 'WAITING') {
      frameIdRef.current = requestAnimationFrame(animate);
    }
  }, []);

  // ... start/stop methods
}
```

### Pattern 2: Singleton Audio Engine
**What:** One `AudioContext` instance, created on first user interaction, reused across the entire session.
**When:** Any sound playback in the app.
**Why:** Browsers enforce autoplay policy -- AudioContext must be created/resumed during a user gesture. Creating multiple contexts wastes resources. Oscillators are single-use (create per sound, not per app).

```jsx
// audioEngine.js -- plain module, not a React component
let audioCtx = null;

function getContext() {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playTone(frequency, duration, type = 'sine') {
  const ctx = getContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
  gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + duration);
}

export function playCorrect() { playTone(880, 0.15); }    // A5, short
export function playIncorrect() { playTone(220, 0.3); }   // A3, longer
export function playComplete() {
  playTone(523, 0.2); // C5
  setTimeout(() => playTone(659, 0.2), 100); // E5
  setTimeout(() => playTone(784, 0.3), 200); // G5
}
```

### Pattern 3: Versioned localStorage Schema
**What:** Include a schema version field in persisted data. Check version on load; migrate if outdated.
**When:** Any localStorage read/write.
**Why:** As the app evolves, stored data shape will change. Without versioning, old data causes crashes or silent data loss.

```jsx
const STORAGE_VERSION = 1;

function loadProfile() {
  try {
    const raw = localStorage.getItem('cogspeed_profile');
    if (!raw) return createDefaultProfile();
    const data = JSON.parse(raw);
    if (data._version !== STORAGE_VERSION) {
      return migrateProfile(data);
    }
    return data;
  } catch (e) {
    console.warn('Corrupt profile data, resetting:', e);
    return createDefaultProfile();
  }
}

function saveProfile(profile) {
  localStorage.setItem('cogspeed_profile', JSON.stringify({
    ...profile,
    _version: STORAGE_VERSION,
  }));
}
```

### Pattern 4: Pure Staircase Algorithm
**What:** Implement the staircase as a pure data structure/function, completely decoupled from UI.
**When:** Calculating next display duration after each trial response.
**Why:** Pure algorithms are trivially testable, have no React dependencies, and can be validated against psychophysics literature.

```jsx
// staircase.js -- zero React dependencies
export function createStaircase(initialFrames = 10) {
  return {
    displayFrames: initialFrames,
    consecutiveCorrect: 0,
    reversals: [],
    lastDirection: null, // 'up' or 'down'
    trialCount: 0,
  };
}

export function updateStaircase(state, isCorrect) {
  const next = { ...state, trialCount: state.trialCount + 1 };

  if (isCorrect) {
    next.consecutiveCorrect = state.consecutiveCorrect + 1;
    if (next.consecutiveCorrect >= 3) { // 3-up
      const newDirection = 'down';
      if (state.lastDirection === 'up') {
        next.reversals = [...state.reversals, state.displayFrames];
      }
      next.displayFrames = Math.max(1, state.displayFrames - 1);
      next.consecutiveCorrect = 0;
      next.lastDirection = newDirection;
    }
  } else {
    const newDirection = 'up'; // 1-down
    if (state.lastDirection === 'down') {
      next.reversals = [...state.reversals, state.displayFrames];
    }
    next.displayFrames = state.displayFrames + 1;
    next.consecutiveCorrect = 0;
    next.lastDirection = newDirection;
  }

  return next;
}

export function calculateThreshold(state, skipFirst = 4) {
  const usable = state.reversals.slice(skipFirst);
  if (usable.length === 0) return state.displayFrames;
  return usable.reduce((a, b) => a + b, 0) / usable.length;
}
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: React State in the Render Loop
**What:** Using `useState` to store frame count, trial phase, or any value mutated inside `requestAnimationFrame`.
**Why bad:** Every `setState` call triggers React reconciliation. At 60fps, that is 60 re-renders per second. Reconciliation takes unpredictable time (1-16ms), making frame timing unreliable. The stimulus might display for 2 frames instead of 1.
**Instead:** Use `useRef` for ALL animation loop state. Only call `setState` when transitioning out of the animation loop (e.g., trial complete, block complete).

### Anti-Pattern 2: setTimeout for Display Duration
**What:** `setTimeout(() => clearStimulus(), displayMs)` to control how long a stimulus appears.
**Why bad:** setTimeout resolution is ~4ms minimum, but actual firing can be delayed 0-16ms by the browser's task queue. A 16.67ms display (one frame) could become 20-33ms (2 frames). This fundamentally breaks the psychophysics protocol.
**Instead:** Count frames in the rAF loop. `if (frameCount >= targetFrames) { clearAndMask(); }`.

### Anti-Pattern 3: Drawing Shapes with DOM Elements
**What:** Using `<div>` or `<svg>` elements styled with CSS for stimulus shapes, then toggling `display: none`.
**Why bad:** DOM updates go through layout -> paint -> composite pipeline. You cannot guarantee a shape appears/disappears on the exact frame you intend. CSS transitions, layout reflows, and paint coalescing add unpredictable delays.
**Instead:** Draw shapes directly on `<canvas>` via 2D context path operations. Canvas updates are synchronous within the rAF callback -- what you draw IS what appears on the next vsync.

### Anti-Pattern 4: Creating AudioContext on Every Sound
**What:** `new AudioContext()` each time you play a feedback tone.
**Why bad:** Browser resource waste, potential "too many AudioContexts" errors, and each new context may be suspended (requiring user gesture to resume).
**Instead:** Singleton AudioContext module. Create once, resume if suspended, reuse forever.

### Anti-Pattern 5: Storing Raw Trial Arrays in React State
**What:** `setTrials([...trials, newTrial])` after every trial, keeping the full trial history in component state.
**Why bad:** Growing arrays in state cause increasingly expensive re-renders. 60 trials per session x multiple sessions = large objects triggering deep equality checks.
**Instead:** Accumulate trial data in a ref during the session. Only move to state (or directly to localStorage) at session end.

## Scalability Considerations

This is a client-side SPA with no backend. "Scalability" means: how does the architecture handle growth in features and data, not users.

| Concern | Current (MVP) | After 100 sessions | After 500+ sessions |
|---------|--------------|---------------------|---------------------|
| localStorage size | ~2KB (profile + 1 session) | ~50KB (manageable) | ~250KB+ (still under 5MB limit, but should consider pruning old raw trial data) |
| Session load time | Instant | Instant (JSON.parse of larger object) | May need pagination or summary-only storage for old sessions |
| Canvas performance | Trivial (few shapes) | No change (rendering doesn't scale with history) | No change |
| State complexity | Simple (1 exercise type) | Manageable (2 exercise types, unlock gate) | If Exercise 3 added: consider moving to a more formal state machine library |

## Sources

- [MDN requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame) -- callback timing, vsync alignment
- [MDN Canvas API tutorials](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Basic_animations) -- animation loop patterns
- [MDN Web Audio API best practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices) -- AudioContext lifecycle, autoplay policy
- [CSS-Tricks: requestAnimationFrame with React Hooks](https://css-tricks.com/using-requestanimationframe-with-react-hooks/) -- useRef pattern for animation state
- [OpenReplay: requestAnimationFrame in React](https://blog.openreplay.com/use-requestanimationframe-in-react-for-smoothest-animations/) -- cleanup patterns, memory leak prevention

---
*Architecture patterns for: CogSpeed -- adaptive cognitive speed training web app*
*Researched: 2026-03-21*
