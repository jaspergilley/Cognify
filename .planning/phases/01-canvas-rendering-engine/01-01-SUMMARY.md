---
phase: 01-canvas-rendering-engine
plan: 01
subsystem: rendering
tags: [vite, react, tailwind, canvas, raf, dpi, frame-loop]

# Dependency graph
requires:
  - phase: none
    provides: first phase - no dependencies
provides:
  - Vite + React + Tailwind project scaffold with immersive navy theme
  - rAF frame loop with frame counting and dropped frame detection (createFrameLoop)
  - DPI-aware canvas scaling and 4:3 aspect ratio calculation (setupCanvasDPI, calculateAspectRatio)
  - Display refresh rate measurement via rAF interval median (detectRefreshRate)
  - Tab visibility pause/resume with timing reset (createVisibilityManager)
  - Normalized coordinate conversion to integer canvas pixels (toCanvasPixels, toNormalized)
affects: [01-02-PLAN, stimulus-system, trial-engine]

# Tech tracking
tech-stack:
  added: [vite@8, react@19, react-dom@19, tailwindcss@4, "@tailwindcss/vite@4", "@vitejs/plugin-react@6"]
  patterns: [imperative-canvas-outside-react, raf-frame-loop, dpi-scaling, normalized-coordinates]

key-files:
  created:
    - package.json
    - vite.config.js
    - index.html
    - src/main.jsx
    - src/index.css
    - src/App.jsx
    - src/engine/frameLoop.js
    - src/engine/canvasScaler.js
    - src/engine/refreshRateDetector.js
    - src/engine/visibilityManager.js
    - src/utils/coordinates.js
    - .gitignore
  modified: []

key-decisions:
  - "Manual project scaffold instead of create-vite due to non-empty directory (existing .git and .planning)"
  - "Dropped frame threshold set at 1.5x expected frame duration per research recommendation"
  - "Refresh rate detector uses 120 samples with 20 warmup frames discarded, falls back to 60Hz on high variance (CV > 0.2)"
  - "All engine modules are pure JS factory functions with named exports only -- no React, no default exports"
  - "Coordinate clamping on both toCanvasPixels and toNormalized to prevent out-of-bounds values"

patterns-established:
  - "Factory function pattern: all engine modules export factory functions (createFrameLoop, createVisibilityManager) that return controller objects"
  - "Named exports only: no default exports in engine/utils modules for explicit import clarity"
  - "Pure JS engine modules: rendering infrastructure has zero React dependency -- React is just the host"
  - "Integer pixel coordinates: all canvas dimensions and positions use Math.round() to prevent sub-pixel anti-aliasing"

requirements-completed: [CANV-01, CANV-02, CANV-04, CANV-06, CANV-07, CANV-08, CANV-09]

# Metrics
duration: 3min
completed: 2026-03-21
---

# Phase 1 Plan 1: Project Scaffold and Canvas Engine Modules Summary

**Vite 8 + React 19 + Tailwind 4 scaffold with five standalone canvas engine modules: rAF frame loop, DPI scaler, refresh rate detector, visibility manager, and normalized coordinate converter**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-21T22:01:33Z
- **Completed:** 2026-03-21T22:04:58Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments
- Complete Vite + React + Tailwind project scaffold with deep navy (#1a1a2e) immersive theme and mobile-safe viewport
- Five standalone canvas engine modules (frameLoop, canvasScaler, refreshRateDetector, visibilityManager, coordinates) -- all pure JS, no React dependencies
- Frame loop with rAF-based timing, per-frame delta calculation, dropped frame detection at 1.5x threshold, and frame monitoring log
- DPI-aware canvas scaling that reads devicePixelRatio and rounds all dimensions to integers
- Refresh rate detector that measures 120 rAF intervals, discards warmup, uses median, and falls back to 60Hz on high variance

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Vite + React + Tailwind project with immersive theme** - `55f6fa6` (feat)
2. **Task 2: Build standalone canvas engine modules** - `2c69694` (feat)

## Files Created/Modified
- `package.json` - Vite + React + Tailwind project manifest
- `vite.config.js` - Vite config with React and Tailwind plugins
- `index.html` - Entry HTML with viewport meta and theme-color
- `src/main.jsx` - React entry point with StrictMode
- `src/index.css` - Tailwind import + immersive navy theme styles
- `src/App.jsx` - Placeholder app with centered "Cognify" text
- `src/engine/frameLoop.js` - rAF frame loop with delta timing and dropped frame detection
- `src/engine/canvasScaler.js` - DPI scaling and 4:3 aspect ratio calculation
- `src/engine/refreshRateDetector.js` - Display refresh rate measurement via rAF median
- `src/engine/visibilityManager.js` - Tab visibility pause/resume with timing reset
- `src/utils/coordinates.js` - Normalized [0,1] to integer pixel coordinate conversion
- `.gitignore` - Excludes node_modules, dist, env files

## Decisions Made
- Manually scaffolded project files instead of using `create-vite` since the directory was non-empty (had .git and .planning directories)
- Set dropped frame detection threshold at 1.5x expected frame duration (standard in game engines and animation monitoring)
- Refresh rate detector collects 120 frames, discards first 20 (warmup), uses median of remaining intervals, falls back to 60Hz if coefficient of variation exceeds 0.2
- All engine modules use the factory function pattern with named exports only -- no default exports, no React imports
- Added clamping to both coordinate conversion functions to prevent out-of-bounds values

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added .gitignore file**
- **Found during:** Task 1 (Project scaffold)
- **Issue:** Plan did not specify .gitignore; without it, node_modules (100MB+) and env files would be committed
- **Fix:** Created .gitignore excluding node_modules, dist, .env files, editor files, and OS files
- **Files modified:** .gitignore
- **Verification:** File exists, git status shows node_modules not tracked
- **Committed in:** 55f6fa6 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Essential for repository hygiene. No scope creep.

## Issues Encountered
- `create-vite` refused to scaffold in a non-empty directory (interactive prompt blocked in CLI). Resolved by manually creating all scaffold files (package.json, vite.config.js, index.html, src/main.jsx, etc.) with identical content to what create-vite would generate.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All five engine modules are ready for React integration in Plan 02
- Plan 02 will create CanvasRenderer component, useCanvasEngine hook, responsive resize handling, debug panel, and mobile support
- No blockers or concerns

## Self-Check: PASSED

All 12 created files verified present. Both task commits (55f6fa6, 2c69694) verified in git log. Build passes cleanly.

---
*Phase: 01-canvas-rendering-engine*
*Completed: 2026-03-21*
