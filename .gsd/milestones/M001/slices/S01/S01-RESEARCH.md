# S01 Research: Canvas Rendering Engine

Phase 1 is a pure browser-API phase with no third-party rendering libraries. HTML5 Canvas 2D, requestAnimationFrame, ResizeObserver, Page Visibility API, and devicePixelRatio are all mature, well-documented, universally-supported browser primitives.

## Key Patterns

1. **Imperative Canvas Inside React** — Keep all canvas rendering logic outside React's state/render cycle. React owns the DOM element via useRef; all drawing, timing, and state lives in plain JS objects.

2. **DPI-Aware Canvas Setup** — Scale canvas internal resolution to match device pixel density: canvas.width = rect.width * dpr, then ctx.scale(dpr, dpr).

3. **Frame Loop with Delta Timing** — Single rAF loop that tracks frame count, measures delta time, and detects dropped frames at 1.5x threshold.

4. **Responsive Resize** — ResizeObserver on canvas container, recalculate 4:3 dimensions, re-apply DPI scaling on every resize without restarting frame loop.

5. **Refresh Rate Detection** — Measure 120 rAF intervals, discard 20 warmup, take median, derive Hz. Fall back to 60Hz if CV > 0.2.

## Anti-Patterns to Avoid

- Storing frame loop state in React useState (causes re-render thrashing)
- Using setTimeout/setInterval for stimulus timing
- Hardcoding DPR of 2
- Forgetting to re-apply ctx.scale after resize
- Drawing at sub-pixel coordinates
