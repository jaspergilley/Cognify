---
id: T02
parent: S01
milestone: M001
provides:
  - react-canvas-integration
  - debug-panel
  - orientation-warning
  - small-screen-warning
  - fullscreen-toggle
  - resize-dpi-recalculation
requires: [T01]
affects: [S02, S04]
key_files:
  - src/hooks/useCanvasEngine.js
  - src/components/CanvasRenderer.jsx
  - src/components/DebugPanel.jsx
  - src/components/OrientationWarning.jsx
  - src/components/SmallScreenWarning.jsx
  - src/components/FullscreenToggle.jsx
  - src/App.jsx
  - src/index.css
key_decisions:
  - Render props pattern for CanvasRenderer to pass engine data to overlays
  - Rolling 60-frame FPS tracker in useCanvasEngine to avoid re-renders
  - CSS media query for orientation warning (no JS needed)
  - ResizeObserver on canvas parent for resize detection
  - 100ms throttled polling for DebugPanel reads
patterns_established:
  - Render props for passing engine state to child overlays
  - useRef for mutable engine data to avoid re-renders
  - CSS-driven overlays where possible (orientation warning)
observability_surfaces:
  - DebugPanel (Ctrl+Shift+D): Hz, FPS, frame count, dropped frames, DPR, canvas size
drill_down_paths: []
duration: ~5min
verification_result: passed
completed_at: '2026-03-21'
blocker_discovered: false
---

# T02: Canvas React Integration

**All engine modules wired into React with full responsive canvas surface and developer overlays**

## What Happened

Built useCanvasEngine hook that orchestrates refresh rate detection, canvas DPI scaling, ResizeObserver-based resize handling, and rAF frame loop — all without triggering React re-renders (engine data stored in refs). CanvasRenderer component maintains 4:3 aspect ratio via CSS `aspectRatio` with letterbox bars matching #1a1a2e. Five overlay components added: DebugPanel (Ctrl+Shift+D, polls at 10fps, shows Hz/FPS/frames/dropped/DPR/size), OrientationWarning (CSS media query for portrait + <600px), SmallScreenWarning (dismissable banner when below 600x450), FullscreenToggle (Fullscreen API with error handling). App.jsx composes everything with proper z-index layering.

Git commits: 63b6cf6 (hook + renderer), 825659e (debug panel + overlays). Build passes cleanly (26 modules, 0 errors).

All S01 must-haves complete: CANV-01 through CANV-09.
