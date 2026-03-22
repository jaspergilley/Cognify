# M001 Research

Consolidated from `.planning/research/` during migration.

## Summary

Cognify implements the ACTIVE study's speed-of-processing protocol using browser-native technologies. The stack is React (.jsx) + Tailwind CSS + Canvas 2D API + Web Audio API, with Vite as the build tool. All rendering uses the Canvas 2D API with requestAnimationFrame for frame-accurate timing. The staircase algorithm is a standard 3-Up/1-Down transformed staircase from psychophysics.

## Architecture

- Pure JS engine modules (frameLoop, canvasScaler, refreshRateDetector, visibilityManager, coordinates) with no React dependencies
- React serves as the UI host via useRef + useEffect patterns
- All canvas state lives outside React's state system to avoid re-render interference
- Factory function pattern for all engine modules with named exports only

## Stack

| Technology | Purpose |
|-----------|---------|
| React 19 (.jsx) | Component framework |
| Tailwind CSS 4 | Styling |
| Vite 8 | Build tool |
| Canvas 2D API | Stimulus rendering |
| requestAnimationFrame | Frame timing |
| Web Audio API | Sound feedback |
| localStorage | Data persistence |
| Recharts | Progress visualization (future) |

## Key Technical Decisions

- Canvas + rAF for all stimulus timing (no DOM, no setTimeout/setInterval)
- Frame-based duration measurement (frames, not milliseconds)
- DPI-aware rendering via devicePixelRatio
- 4:3 aspect ratio for canvas (matches vision research displays)
- Median-based refresh rate detection with variance fallback
- Reversal-based threshold calculation (standard psychophysics)
