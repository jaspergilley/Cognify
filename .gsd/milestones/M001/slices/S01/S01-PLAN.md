# S01: Canvas Rendering Engine

**Goal:** A rock-solid canvas surface that renders at native resolution, counts frames accurately, and handles every browser environment edge case
**Demo:** Canvas fills viewport with 4:3 ratio, frame counter runs, resize recalculates, debug panel shows metrics

## Must-Haves

- Canvas renders sharply on both standard and Retina/HiDPI displays
- rAF frame loop runs continuously with accurate frame counting
- Canvas maintains aspect ratio and minimum size on resize
- Tab visibility pause/resume works cleanly
- Display refresh rate detected at startup

## Tasks

- [x] **T01: Project Scaffold and Engine Modules** `est:3min`
  - Scaffold Vite + React + Tailwind project and build standalone canvas engine modules
- [x] **T02: Canvas React Integration** `est:5min`
  - Wire engine modules into React via custom hook, add debug panel, mobile support, fullscreen toggle

## Files Likely Touched

- src/engine/frameLoop.js
- src/engine/canvasScaler.js
- src/engine/refreshRateDetector.js
- src/engine/visibilityManager.js
- src/utils/coordinates.js
- src/hooks/useCanvasEngine.js
- src/components/CanvasRenderer.jsx
- src/components/DebugPanel.jsx
- src/components/OrientationWarning.jsx
- src/components/SmallScreenWarning.jsx
- src/components/FullscreenToggle.jsx
- src/App.jsx
