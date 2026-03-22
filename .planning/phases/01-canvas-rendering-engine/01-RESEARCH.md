# Phase 1: Canvas Rendering Engine - Research

**Researched:** 2026-03-21
**Domain:** HTML5 Canvas 2D rendering, requestAnimationFrame timing, responsive layout, browser APIs
**Confidence:** HIGH

## Summary

Phase 1 is a pure browser-API phase with no third-party rendering libraries needed. The HTML5 Canvas 2D API, `requestAnimationFrame`, `ResizeObserver`, Page Visibility API, and `devicePixelRatio` are all mature, well-documented, universally-supported browser primitives. The patterns for HiDPI scaling, frame-loop timing, responsive sizing, and visibility-change handling are well-established and have not changed meaningfully in years. The main complexity lies in correctly wiring these primitives together inside a React component without fighting React's rendering model.

The project stack is React (.jsx) with Tailwind CSS. Canvas rendering is entirely imperative (not declarative), so the React integration pattern must use `useRef` for canvas element access and `useEffect` for lifecycle management, keeping all canvas state outside React's state system to avoid re-render interference with the frame loop. The frame loop, timing, and resize logic are vanilla JS -- React is just the host.

**Primary recommendation:** Build a single `<CanvasRenderer>` React component that owns the `<canvas>` element via `useRef`, initializes all rendering infrastructure in a `useEffect` cleanup lifecycle, and exposes canvas state through refs rather than React state. All timing, DPI scaling, and resize handling is vanilla browser API code running inside this component.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- 4:3 aspect ratio -- matches traditional vision research displays, symmetric distance for peripheral stimuli
- Canvas fills available viewport space while maintaining 4:3 ratio, with letterboxing on non-matching viewports
- Minimum effective size 600x450px
- On screens below minimum: show a warning message ("screen too small" / "rotate device") but allow the user to dismiss and continue -- don't hard-block
- No visible border -- canvas blends seamlessly into page background
- Background color: deep navy (#1a1a2e) for both canvas and page -- clinical but comfortable, good contrast for white stimuli
- Fully immersive during training -- nothing visible except the training canvas (no headers, nav bars, or status indicators)
- Letterbox bars match canvas background color (same #1a1a2e) -- user cannot distinguish where canvas ends and page begins
- Offer an opt-in fullscreen toggle button -- user can enter browser fullscreen if they want maximum immersion, but it's not forced or automatic
- Desktop and mobile supported equally -- not one over the other
- On mobile: lock orientation to landscape during training (via CSS/screen orientation API) since 4:3 canvas needs horizontal space
- Touch input: response buttons overlay the canvas during response phases (tap directly on canvas area)
- Block all default touch behaviors on the canvas element: pinch-to-zoom, double-tap-to-zoom, pull-to-refresh -- prevent accidental interruptions during timed trials
- Use native display refresh rate -- don't cap at 60Hz. 120Hz displays get finer timing granularity (8.3ms frames vs 16.7ms). Staircase step sizes adapt to detected frame duration
- Show detected refresh rate in a developer/debug panel accessible via keyboard shortcut (not visible to regular users)

### Claude's Discretion
- Dropped frame handling: threshold for what counts as a "dropped frame" and what action to take (log only vs void trial)
- Refresh rate calibration duration at startup (number of frames to measure before locking in detected rate)
- Exact implementation of the debug/dev panel (keyboard shortcut, what info to show beyond refresh rate)
- Loading skeleton or startup visual while calibrating refresh rate

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CANV-01 | Canvas renders at correct DPI scale on standard and HiDPI/Retina displays (devicePixelRatio handling) | HiDPI scaling pattern: set canvas.width/height to CSS size * dpr, then ctx.scale(dpr, dpr). Well-documented, universal support. |
| CANV-02 | rAF-based frame loop counts frames accurately (never uses setTimeout/setInterval for stimulus timing) | rAF callback receives DOMHighResTimeStamp. Frame counter increments once per callback invocation. Must cancelAnimationFrame on cleanup. |
| CANV-03 | Canvas maintains fixed aspect ratio (4:3) and responsive sizing (minimum 600x450px effective) | Use CSS aspect-ratio: 4/3 on container, constrain with max-width/max-height to fit viewport, enforce min 600x450. ResizeObserver triggers DPI recalculation. |
| CANV-04 | All stimulus positions calculated as percentages of canvas dimensions, not absolute pixels | Architecture pattern: store all coordinates as [0,1] normalized values, multiply by canvas CSS dimensions at draw time. Requires consistent coordinate system. |
| CANV-05 | Canvas handles window resize without losing rendering state | ResizeObserver on canvas container. On resize: recalculate CSS dimensions, update canvas.width/height for DPI, re-apply ctx.scale, redraw. State stored externally (not on canvas). |
| CANV-06 | App detects actual display refresh rate at startup by measuring rAF frame intervals | Measure N frames of rAF timestamps, compute median interval, derive Hz. Recommendation: 120 frames (~2s at 60Hz). Use median (not mean) to reject outliers. |
| CANV-07 | App pauses trial timing when tab loses visibility (visibilitychange listener) and resumes cleanly | Page Visibility API: document.addEventListener('visibilitychange'). Browsers already pause rAF in background tabs. Explicit handling needed to reset timing deltas on resume. |
| CANV-08 | All canvas coordinates rounded to integers (Math.round) to eliminate sub-pixel anti-aliasing | Apply Math.round() to all x, y, width, height values before any ctx draw calls. Prevents blurry rendering from sub-pixel interpolation. |
| CANV-09 | performance.now() delta timing companion tracks actual frame durations for dropped frame detection (~20 lines) | Track lastFrameTime via performance.now() in each rAF callback. Compute delta. If delta > 1.5 * expectedFrameDuration, flag as dropped frame. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 18/19 (.jsx) | Component host for canvas element | Project constraint -- React is the app framework |
| Canvas 2D API | Browser native | All rendering operations | Project constraint -- no DOM elements for stimuli |
| requestAnimationFrame | Browser native | Frame loop synchronized to display refresh | Project constraint -- vsync-aligned frame counting |
| ResizeObserver | Browser native | Responsive canvas sizing | Better than window.resize -- watches actual element size changes |
| Page Visibility API | Browser native | Tab visibility detection | Pause/resume frame loop cleanly on tab switch |
| Fullscreen API | Browser native | Opt-in fullscreen mode | User decision -- optional fullscreen toggle |
| Tailwind CSS | 3.x/4.x | Layout and styling | Project constraint |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| performance.now() | Browser native | High-resolution timing | Delta timing for dropped frame detection |
| devicePixelRatio | Browser native | DPI scaling factor | HiDPI/Retina display handling |
| Screen Orientation API | Browser native | Landscape lock on mobile | Mobile orientation control (limited support) |
| CSS aspect-ratio | Browser native | Container aspect ratio | 4:3 ratio enforcement |
| CSS touch-action | Browser native | Disable touch gestures | Prevent pinch-zoom, double-tap on canvas |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Raw Canvas 2D | PixiJS / Konva | Overkill for geometric shapes; adds bundle weight; this project draws simple paths, not complex scenes |
| ResizeObserver | window.onresize | Misses non-window-triggered resizes (layout shifts, container changes); ResizeObserver is element-specific |
| CSS aspect-ratio | Padding-top hack | Padding hack is legacy; aspect-ratio has universal modern support (Chrome 88+, Firefox 89+, Safari 15.4+) |
| screen.orientation.lock() | CSS media query message | lock() requires fullscreen AND has no iOS Safari support; CSS fallback with rotation message is more reliable |

**Installation:**
```bash
# No additional packages needed for Phase 1
# All APIs are browser-native
# React and Tailwind are already project dependencies
npx create-vite@latest cognify -- --template react
cd cognify
npm install
npm install -D tailwindcss @tailwindcss/vite
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   └── CanvasRenderer.jsx     # React wrapper component
├── engine/
│   ├── frameLoop.js           # rAF loop, frame counting, delta timing
│   ├── canvasScaler.js        # DPI scaling, resize handling, aspect ratio
│   ├── refreshRateDetector.js # Startup calibration routine
│   └── visibilityManager.js   # Page visibility pause/resume
├── hooks/
│   └── useCanvasEngine.js     # Custom hook wiring engine to React lifecycle
├── utils/
│   └── coordinates.js         # Normalized coordinate helpers
└── App.jsx                    # Root app with full-bleed layout
```

### Pattern 1: Imperative Canvas Inside React
**What:** Keep all canvas rendering logic outside React's state/render cycle. React owns the DOM element via `useRef`; all drawing, timing, and state lives in plain JS objects mutated directly.
**When to use:** Always, for any high-frequency canvas rendering in React.
**Example:**
```jsx
// Source: CSS-Tricks, MDN, community patterns
import { useRef, useEffect } from 'react';

function CanvasRenderer() {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: false });

    // Initialize engine (pure JS, no React state)
    engineRef.current = createEngine(canvas, ctx);
    engineRef.current.start();

    return () => {
      engineRef.current.stop();
    };
  }, []);

  return <canvas ref={canvasRef} />;
}
```

### Pattern 2: DPI-Aware Canvas Setup
**What:** Scale canvas internal resolution to match device pixel density while keeping CSS display size unchanged.
**When to use:** On every canvas initialization and every resize.
**Example:**
```javascript
// Source: web.dev/articles/canvas-hidipi, MDN
function setupCanvasDPI(canvas, ctx) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  // Set backing store size to physical pixels
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);

  // Scale context so drawing uses CSS pixel coordinates
  ctx.scale(dpr, dpr);

  return { width: rect.width, height: rect.height, dpr };
}
```

### Pattern 3: Frame Loop with Delta Timing
**What:** A single rAF loop that tracks frame count, measures delta time, and detects dropped frames.
**When to use:** The core rendering heartbeat.
**Example:**
```javascript
// Source: MDN requestAnimationFrame docs, community patterns
function createFrameLoop(onFrame, expectedFrameMs) {
  let frameCount = 0;
  let lastTime = 0;
  let rafId = null;
  let running = false;

  function tick(timestamp) {
    if (!running) return;

    const delta = lastTime ? timestamp - lastTime : expectedFrameMs;
    lastTime = timestamp;
    frameCount++;

    // Dropped frame detection
    const isDropped = delta > expectedFrameMs * 1.5;

    onFrame({ frameCount, delta, timestamp, isDropped });

    rafId = requestAnimationFrame(tick);
  }

  return {
    start() {
      running = true;
      lastTime = 0;
      rafId = requestAnimationFrame(tick);
    },
    stop() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
    },
    getFrameCount: () => frameCount,
    reset() { frameCount = 0; lastTime = 0; }
  };
}
```

### Pattern 4: Responsive Resize with ResizeObserver
**What:** Watch the canvas container for size changes, recalculate dimensions maintaining 4:3 ratio, and re-apply DPI scaling.
**When to use:** On component mount, cleaned up on unmount.
**Example:**
```javascript
// Source: MDN ResizeObserver, web.dev
function createResizeHandler(canvas, ctx, onResize) {
  const observer = new ResizeObserver((entries) => {
    const entry = entries[0];
    const { width, height } = entry.contentRect;

    // Enforce 4:3 aspect ratio within available space
    const targetRatio = 4 / 3;
    let canvasWidth, canvasHeight;

    if (width / height > targetRatio) {
      // Container is wider than 4:3 -- height-constrained
      canvasHeight = height;
      canvasWidth = height * targetRatio;
    } else {
      // Container is taller than 4:3 -- width-constrained
      canvasWidth = width;
      canvasHeight = width / targetRatio;
    }

    // Enforce minimum size
    canvasWidth = Math.max(canvasWidth, 600);
    canvasHeight = Math.max(canvasHeight, 450);

    // Apply CSS size
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;

    // Re-apply DPI scaling
    const dims = setupCanvasDPI(canvas, ctx);
    onResize(dims);
  });

  observer.observe(canvas.parentElement);
  return () => observer.disconnect();
}
```

### Pattern 5: Refresh Rate Detection
**What:** Measure actual display refresh rate by collecting rAF timestamp intervals and computing the median.
**When to use:** Once at app startup, before the main frame loop begins.
**Example:**
```javascript
// Source: Community patterns, ourcodeworld.com, MDN
function detectRefreshRate(sampleCount = 120) {
  return new Promise((resolve) => {
    const intervals = [];
    let lastTimestamp = null;
    let count = 0;

    function measure(timestamp) {
      if (lastTimestamp !== null) {
        intervals.push(timestamp - lastTimestamp);
      }
      lastTimestamp = timestamp;
      count++;

      if (count < sampleCount) {
        requestAnimationFrame(measure);
      } else {
        // Use median to reject outliers (GC pauses, etc.)
        intervals.sort((a, b) => a - b);
        const median = intervals[Math.floor(intervals.length / 2)];
        const hz = Math.round(1000 / median);
        resolve({ hz, frameDurationMs: median });
      }
    }

    requestAnimationFrame(measure);
  });
}
```

### Anti-Patterns to Avoid
- **Storing frame loop state in React useState:** Every setState call triggers a re-render. At 60+ FPS, this thrashes React's reconciler and causes jank. Use `useRef` or plain JS variables instead.
- **Using setTimeout/setInterval for stimulus timing:** These are not synchronized to the display refresh. Frame-based timing via rAF is the project constraint (CANV-02).
- **Scaling canvas by a hardcoded factor of 2:** devicePixelRatio varies (1, 1.5, 2, 3, or higher). Always read the actual value.
- **Forgetting to re-apply ctx.scale after canvas resize:** Changing canvas.width/height resets the entire canvas state, including the transformation matrix. Must re-apply DPI scaling after every resize.
- **Drawing at sub-pixel coordinates:** Causes anti-aliased blurriness. Always Math.round() coordinates (CANV-08).
- **Not canceling rAF on component unmount:** Leads to memory leaks and errors when the callback fires after the component is gone.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| DPI scaling | Custom pixel-doubling logic | `devicePixelRatio` + `ctx.scale()` pattern | DPR varies (1, 1.5, 2, 3+); the standard pattern handles all cases in 5 lines |
| Element resize detection | window.onresize polling | ResizeObserver | Catches all resize causes (viewport, layout, container), debounced natively, element-specific |
| Frame timing | Date.now() or setTimeout | rAF timestamp + performance.now() | rAF is vsync-aligned; Date.now() has millisecond precision at best; setTimeout drifts |
| Visibility detection | focus/blur events | Page Visibility API (document.visibilitychange) | focus/blur misses minimization, tab switching, screen lock; Visibility API covers all cases |
| Fullscreen mode | Manual DOM manipulation | Fullscreen API (element.requestFullscreen()) | Handles browser chrome hiding, escape key, vendor prefixes; 5-line wrapper |
| Aspect ratio enforcement | JavaScript aspect ratio calculation on every resize | CSS aspect-ratio property on container + JS ResizeObserver for canvas dimensions | CSS handles layout natively; JS only needed for canvas buffer sizing |

**Key insight:** Every problem in this phase has a browser-native API solution. The only custom code needed is the glue that wires these APIs together in the correct order with proper cleanup.

## Common Pitfalls

### Pitfall 1: Canvas Blurry on Retina/HiDPI Displays
**What goes wrong:** Canvas renders at 1x resolution on a 2x or 3x display, then gets upscaled by the browser, producing blurry output.
**Why it happens:** Canvas `width`/`height` attributes set the backing store resolution. If these match CSS pixels (not device pixels), the canvas is under-resolved.
**How to avoid:** Always multiply canvas dimensions by `devicePixelRatio` and apply `ctx.scale(dpr, dpr)`. Re-apply after every resize.
**Warning signs:** Text or lines look fuzzy on phones or MacBooks but fine on external monitors.

### Pitfall 2: Canvas State Reset on Resize
**What goes wrong:** After a window resize, the canvas goes blank or rendering looks wrong (colors, transforms, line widths all reset).
**Why it happens:** Setting `canvas.width` or `canvas.height` clears the entire canvas and resets all context state (transforms, styles, composite operations) to defaults.
**How to avoid:** After changing canvas dimensions, always re-apply: `ctx.scale(dpr, dpr)`, any default styles (fillStyle, font, etc.), and immediately redraw. Store rendering state externally, not in canvas context state.
**Warning signs:** Canvas flickers or goes blank during resize, then recovers on next frame.

### Pitfall 3: React Re-render Kills Frame Loop
**What goes wrong:** A React state update causes the component to re-render, which unmounts/remounts the canvas, breaking the frame loop and losing all rendering state.
**Why it happens:** If canvas setup is in a `useEffect` with dependencies that change, the effect re-runs, destroying and recreating everything.
**How to avoid:** Use `useEffect` with an empty dependency array `[]` for canvas initialization. Store all mutable state in `useRef` objects. Never put frame-loop-related data in `useState`.
**Warning signs:** Canvas blinks or resets when unrelated UI state changes.

### Pitfall 4: Timing Jump After Tab Switch
**What goes wrong:** When the user returns to the tab, the first frame's delta time is enormous (seconds or minutes), causing animations to jump forward or trial timing to be wrong.
**Why it happens:** The rAF timestamp continues advancing (or the gap is large) while the tab was hidden, and the first delta calculation includes all the hidden time.
**How to avoid:** On `visibilitychange` to `visible`, reset `lastTime` to 0 or the current timestamp so the first frame after resume computes a normal delta. Also explicitly re-enter the frame loop since rAF stops in background tabs.
**Warning signs:** Stimuli appear to skip phases or animation jumps when switching back to the tab.

### Pitfall 5: Orientation Lock Fails Silently on iOS Safari
**What goes wrong:** `screen.orientation.lock('landscape')` throws or does nothing on iOS Safari, and the app doesn't handle it.
**Why it happens:** iOS Safari does not support `screen.orientation.lock()`. It also requires fullscreen mode (which itself requires user gesture) on browsers that do support it.
**How to avoid:** Feature-detect orientation lock support. Fall back to a CSS-based "please rotate your device" overlay when in portrait mode. Use `@media (orientation: portrait)` to detect.
**Warning signs:** Mobile users in portrait mode see a squished or unusable canvas on iOS.

### Pitfall 6: Refresh Rate Measurement Skewed by GC/Load
**What goes wrong:** The detected refresh rate is wrong (e.g., measures 48 Hz on a 60 Hz display) because initial frames include garbage collection pauses or page load overhead.
**Why it happens:** The first few rAF frames after page load are often irregular as the browser finishes layout, style recalc, and JS compilation.
**How to avoid:** Discard the first 10-20 frames of measurement. Use median (not mean) of intervals to reject outliers. Measure for at least 120 frames (~2 seconds at 60 Hz).
**Warning signs:** Detected frame duration doesn't match any standard rate (16.67ms, 8.33ms, 6.94ms).

### Pitfall 7: touch-action: none Accessibility Concern
**What goes wrong:** Setting `touch-action: none` on the canvas disables browser zoom, which may violate WCAG accessibility guidelines.
**Why it happens:** `touch-action: none` prevents ALL touch gestures including assistive zoom.
**How to avoid:** Only apply `touch-action: none` on the canvas element itself during active training, not on the whole page. The surrounding page should remain zoomable. Document this design decision.
**Warning signs:** Accessibility audits flag the canvas as non-zoomable.

## Code Examples

Verified patterns from official sources:

### Canvas Context Initialization (Opaque Background)
```javascript
// Source: MDN HTMLCanvasElement.getContext()
// alpha: false = opaque canvas, slight perf boost, matches navy background
const ctx = canvas.getContext('2d', { alpha: false });
```

### Page Visibility Pause/Resume
```javascript
// Source: MDN Page Visibility API
function createVisibilityManager(frameLoop) {
  let wasRunning = false;

  function handleVisibilityChange() {
    if (document.hidden) {
      wasRunning = frameLoop.isRunning();
      frameLoop.stop();
    } else if (wasRunning) {
      // Reset timing to avoid delta jump
      frameLoop.resetTiming();
      frameLoop.start();
    }
  }

  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}
```

### Fullscreen Toggle
```javascript
// Source: MDN Fullscreen API
function toggleFullscreen(element) {
  if (!document.fullscreenElement) {
    element.requestFullscreen().catch((err) => {
      console.warn('Fullscreen request failed:', err.message);
    });
  } else {
    document.exitFullscreen();
  }
}
```

### Normalized Coordinate System
```javascript
// Source: Standard game/visualization pattern
// All positions stored as [0,1] fractions of canvas size
function toCanvasPixels(normalizedX, normalizedY, canvasWidth, canvasHeight) {
  return {
    x: Math.round(normalizedX * canvasWidth),
    y: Math.round(normalizedY * canvasHeight),
  };
}

// Example: center of canvas is always (0.5, 0.5)
// Peripheral target at 75% distance, 3 o'clock = (0.875, 0.5)
```

### Mobile Touch Prevention
```css
/* Source: MDN touch-action */
.training-canvas {
  touch-action: none;           /* Block all touch gestures on canvas */
  -webkit-touch-callout: none;  /* Prevent iOS callout menu */
  -webkit-user-select: none;    /* Prevent text selection */
  user-select: none;
}
```

### Orientation Warning (CSS-Based Fallback)
```css
/* Source: Standard responsive pattern */
.orientation-warning {
  display: none;
}

@media (orientation: portrait) and (max-width: 599px) {
  .orientation-warning {
    display: flex;
    /* Full-viewport overlay asking user to rotate device */
  }
}
```

### Dropped Frame Detection
```javascript
// Source: Performance monitoring patterns
function createFrameMonitor(expectedFrameMs) {
  let droppedCount = 0;
  const log = [];

  return {
    recordFrame(delta) {
      const threshold = expectedFrameMs * 1.5;
      if (delta > threshold) {
        droppedCount++;
        log.push({
          timestamp: performance.now(),
          expected: expectedFrameMs,
          actual: delta,
          missedFrames: Math.round(delta / expectedFrameMs) - 1,
        });
      }
    },
    getDroppedCount: () => droppedCount,
    getLog: () => [...log],
    reset() { droppedCount = 0; log.length = 0; },
  };
}
```

### Debug Panel (Discretion: Recommended Implementation)
```javascript
// Keyboard shortcut: Ctrl+Shift+D (or Cmd+Shift+D on Mac)
// Shows: refresh rate, frame count, dropped frames, DPR, canvas size
// Recommendation: overlay a small <div> in the corner, toggled by state
function createDebugPanel() {
  return {
    visible: false,
    data: {
      refreshRateHz: 0,
      frameDurationMs: 0,
      frameCount: 0,
      droppedFrames: 0,
      dpr: window.devicePixelRatio,
      canvasSize: { width: 0, height: 0 },
      fps: 0,
    },
    toggle() { this.visible = !this.visible; },
  };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcode DPR of 2 for Retina | Read `devicePixelRatio` dynamically | ~2018 (as DPR values diversified to 1.5, 2, 3, 3.5) | Must use dynamic value; hardcoding breaks on many modern devices |
| window.onresize for canvas sizing | ResizeObserver on container | 2020 (baseline support) | Catches all resize triggers, not just viewport changes |
| Padding-top hack for aspect ratio | CSS `aspect-ratio` property | 2021 (Chrome 88, Firefox 89, Safari 15.4) | Native, clean, no wrapper div hacks needed |
| Vendor-prefixed fullscreen (webkitRequestFullscreen) | Standard `requestFullscreen()` | ~2022 (Safari 16.4 dropped prefix) | Still wrap in try-catch but prefix is rarely needed |
| screen.lockOrientation() (deprecated) | screen.orientation.lock() | 2017 (spec change) | Old API removed from modern browsers; new API still has gaps (no iOS Safari) |

**Deprecated/outdated:**
- `screen.lockOrientation()`: Deprecated, removed from spec. Use `screen.orientation.lock()` instead (but note iOS Safari gap).
- `mozRequestAnimationFrame` / `webkitRequestAnimationFrame`: Vendor prefixes. Unprefixed `requestAnimationFrame` is universal since 2015.
- `document.mozHidden` / `document.webkitHidden`: Use `document.hidden` (universal since 2016).

## Open Questions

1. **screen.orientation.lock() on iOS Safari**
   - What we know: iOS Safari does not support `screen.orientation.lock()`. The API requires fullscreen mode on browsers that do support it.
   - What's unclear: Whether future iOS versions will add support (unlikely in near term).
   - Recommendation: Use CSS `@media (orientation: portrait)` to show a "rotate your device" overlay on mobile portrait mode. Don't rely on programmatic lock.

2. **Refresh rate detection accuracy on variable-refresh-rate (VRR) displays**
   - What we know: VRR/FreeSync/G-Sync displays can change refresh rate dynamically. The rAF measurement captures the current rate, not a fixed rate.
   - What's unclear: How stable the measured rate is on VRR displays under varying GPU load.
   - Recommendation: Measure at startup with a stable workload (empty canvas). If the variance of measured intervals is high (> 20% coefficient of variation), fall back to assuming 60 Hz and note it in the debug panel.

3. **Timestamp precision reduction in browsers**
   - What we know: Firefox clamps rAF timestamps to 1ms precision (with optional 20ns for COOP/COEP documents). Chrome provides sub-millisecond precision.
   - What's unclear: Whether 1ms precision is sufficient for accurate refresh rate detection at 120+ Hz (8.33ms frames, 1ms jitter is ~12%).
   - Recommendation: Collect more samples (120+) and use median to compensate for timestamp jitter. This is sufficient for detecting the correct Hz bucket (60, 75, 90, 120, 144, 240).

## Discretion Recommendations

These areas were marked as Claude's Discretion in CONTEXT.md. Based on research:

### Dropped Frame Threshold
**Recommendation:** A frame is "dropped" if its delta exceeds **1.5x the expected frame duration**. At 60 Hz, this means any frame longer than 25ms. At 120 Hz, any frame longer than 12.5ms.
**Action:** Log only in Phase 1. In later phases (Trial Engine), dropped frames during stimulus display could void the trial. But that decision belongs to Phase 4, not Phase 1. Phase 1 just needs to detect and record.
**Rationale:** 1.5x is the standard threshold in game engines and animation monitoring. It catches genuinely missed frames without flagging minor timing jitter.

### Refresh Rate Calibration Duration
**Recommendation:** 120 frames with the first 20 discarded (warmup). At 60 Hz this takes ~2 seconds; at 120 Hz it takes ~1 second. Show a brief loading indicator during calibration.
**Rationale:** 100 valid samples with median filtering reliably distinguishes 60/75/90/120/144 Hz. Shorter windows risk measurement noise. Longer windows delay app start unnecessarily.

### Debug Panel Implementation
**Recommendation:** Toggle with `Ctrl+Shift+D` (or `Cmd+Shift+D` on Mac). Show as a semi-transparent dark overlay in the top-right corner. Display: detected Hz, frame duration (ms), current FPS, total frames, dropped frame count, DPR, canvas dimensions (CSS and backing store).
**Rationale:** Standard developer shortcut pattern. Top-right avoids interference with centered stimuli. Semi-transparent so it doesn't fully obscure content.

### Loading Visual During Calibration
**Recommendation:** Show the navy background (#1a1a2e) with a small centered text: "Calibrating display..." in a muted color. No spinner or animation (those would interfere with the rAF measurement). After calibration completes, transition directly to the canvas surface.
**Rationale:** Keep it minimal -- the calibration takes 1-2 seconds, which is short enough that a simple text indicator is sufficient. Animations during calibration would compete for rAF callbacks and potentially skew the measurement.

## Sources

### Primary (HIGH confidence)
- [MDN: Window.requestAnimationFrame()](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame) - rAF API, callback signature, timestamp details, background tab behavior
- [MDN: Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API) - document.hidden, visibilitychange event, browser throttling behavior
- [MDN: Canvas API Optimizing](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas) - Integer coordinates, offscreen canvas, alpha:false, performance tips
- [MDN: touch-action](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/touch-action) - none vs manipulation, browser support, accessibility caveats
- [MDN: ScreenOrientation.lock()](https://developer.mozilla.org/en-US/docs/Web/API/ScreenOrientation/lock) - API signature, fullscreen requirement, browser support gaps
- [MDN: Fullscreen API](https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API) - requestFullscreen(), exitFullscreen(), events
- [MDN: devicePixelRatio](https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio) - Dynamic values, zoom interaction
- [web.dev: High DPI Canvas](https://web.dev/articles/canvas-hidipi) - Canonical HiDPI canvas setup pattern with code
- [MDN: HTMLCanvasElement.getContext()](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/getContext) - Context options: alpha, desynchronized, willReadFrequently
- [MDN: ResizeObserver](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver) - API, cleanup, performance notes

### Secondary (MEDIUM confidence)
- [CSS-Tricks: Using requestAnimationFrame with React Hooks](https://css-tricks.com/using-requestanimationframe-with-react-hooks/) - React + rAF integration pattern, useRef for animation state
- [DEV.to: Animation with Canvas and requestAnimationFrame() in React](https://dev.to/ptifur/animation-with-canvas-and-requestanimationframe-in-react-5ccj) - React canvas component pattern
- [Our Code World: Determine screen refresh rate in Hz](https://ourcodeworld.com/articles/read/1390/how-to-determine-the-screen-refresh-rate-in-hz-of-the-monitor-with-javascript-in-the-browser) - rAF-based refresh rate detection, multi-monitor limitations
- [Can I Use: Screen orientation lock](https://caniuse.com/wf-screen-orientation-lock) - Browser support table confirming no iOS Safari support
- [Chrome Blog: Low-latency rendering with desynchronized hint](https://developer.chrome.com/blog/desynchronized) - desynchronized canvas context option

### Tertiary (LOW confidence)
- Community forum discussions on VRR display behavior with rAF - Limited empirical data, needs testing on actual VRR hardware

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All technologies are mature browser-native APIs with excellent documentation and universal support
- Architecture: HIGH - React + imperative canvas pattern is well-established with many production examples
- Pitfalls: HIGH - All pitfalls are well-documented in MDN and developer blogs with known solutions
- Mobile/orientation: MEDIUM - screen.orientation.lock() has known gaps; CSS fallback is reliable but less elegant
- Refresh rate detection: MEDIUM - Works reliably for standard fixed-rate displays; VRR behavior needs empirical validation

**Research date:** 2026-03-21
**Valid until:** 2026-04-21 (30 days -- stable domain, browser APIs change slowly)
