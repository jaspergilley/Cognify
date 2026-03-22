# T02: Canvas React Integration

**Slice:** S01 — **Milestone:** M001

## Description

Wire all engine modules into React via a custom hook and canvas component, creating the complete immersive training surface with responsive 4:3 layout, resize handling, debug panel, mobile support, and fullscreen toggle.

## Must-Haves

- [ ] Canvas maintains 4:3 aspect ratio when browser window is resized, with letterbox bars matching #1a1a2e background
- [ ] Canvas enforces minimum 600x450 effective size; below that a dismissable warning appears
- [ ] Resizing the window recalculates canvas dimensions and re-applies DPI scaling without losing the running frame loop
- [ ] Debug panel toggles with Ctrl+Shift+D showing refresh rate, FPS, frame count, dropped frames, DPR, and canvas size
- [ ] Mobile portrait orientation shows a rotate-device overlay; touch gestures blocked on canvas
- [ ] Fullscreen toggle button allows users to enter/exit browser fullscreen

## Files

- src/hooks/useCanvasEngine.js
- src/components/CanvasRenderer.jsx
- src/components/DebugPanel.jsx
- src/components/OrientationWarning.jsx
- src/components/SmallScreenWarning.jsx
- src/components/FullscreenToggle.jsx
- src/App.jsx
- src/index.css
