---
id: T01
parent: S01
milestone: M001
provides:
  - vite-react-tailwind-scaffold
  - raf-frame-loop
  - dpi-canvas-scaling
  - refresh-rate-detection
  - visibility-pause-resume
  - normalized-coordinates
requires: []
affects: [T02, S02, S04]
key_files:
  - src/engine/frameLoop.js
  - src/engine/canvasScaler.js
  - src/engine/refreshRateDetector.js
  - src/engine/visibilityManager.js
  - src/utils/coordinates.js
key_decisions:
  - Manual project scaffold instead of create-vite due to non-empty directory
  - Dropped frame threshold at 1.5x expected frame duration
  - All engine modules are pure JS factory functions with named exports only
  - Refresh rate detector falls back to 60Hz on high variance (CV > 0.2)
patterns_established:
  - Factory function pattern for engine modules
  - Named exports only
  - Pure JS engine modules with zero React dependency
  - Integer pixel coordinates via Math.round()
observability_surfaces: []
drill_down_paths: []
duration: 3min
verification_result: passed
completed_at: '2026-03-21'
blocker_discovered: false
---

# T01: Project Scaffold and Engine Modules

**Vite 8 + React 19 + Tailwind 4 scaffold with five standalone canvas engine modules**

## What Happened

Complete Vite + React + Tailwind project scaffold with deep navy (#1a1a2e) immersive theme and mobile-safe viewport. Five standalone canvas engine modules built: frameLoop (rAF-based timing, delta calculation, dropped frame detection at 1.5x threshold), canvasScaler (DPI scaling via devicePixelRatio, 4:3 aspect ratio calculation), refreshRateDetector (120 rAF intervals, median filtering, 60Hz fallback), visibilityManager (tab pause/resume with timing reset), and coordinates (normalized [0,1] to integer pixel conversion with clamping).

Git commits: 55f6fa6 (feat: scaffold), 2c69694 (feat: engine modules). Build passes cleanly.

Requirements completed: CANV-01, CANV-02, CANV-04, CANV-06, CANV-07, CANV-08, CANV-09.
