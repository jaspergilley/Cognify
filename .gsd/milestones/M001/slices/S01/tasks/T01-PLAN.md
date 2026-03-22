# T01: Project Scaffold and Engine Modules

**Slice:** S01 — **Milestone:** M001

## Description

Scaffold the Cognify Vite + React + Tailwind project and build all standalone canvas engine modules — the frame loop, DPI scaler, refresh rate detector, visibility manager, and coordinate system.

## Must-Haves

- [x] frameLoop.js creates a rAF-based loop that increments a frame counter exactly once per callback and tracks delta timing
- [x] canvasScaler.js reads devicePixelRatio, sets canvas backing store to physical pixels, applies ctx.scale(dpr, dpr), and Math.round()s all dimensions
- [x] refreshRateDetector.js measures 120 rAF intervals (discarding first 20), computes median, and resolves with detected Hz and frameDurationMs
- [x] visibilityManager.js listens for visibilitychange, stops the frame loop on hidden, resets timing and restarts on visible
- [x] coordinates.js converts normalized [0,1] coordinates to integer canvas pixels via Math.round()

## Files

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
