# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cognify is an adaptive visual speed-of-processing training web app based on the NIH ACTIVE study protocol. Users identify shapes at progressively shorter display durations using a 3-Up/1-Down staircase algorithm that converges to 79.4% correct. Hackathon MVP — core mechanics complete, UI polish deferred.

## Commands

- `npm run dev` — Start Vite dev server
- `npm run build` — Production build (outputs to `dist/`)
- `npm run preview` — Serve production build locally

No test framework is configured.

## Architecture

### Three-Layer Separation

1. **Engine layer** (`src/engine/`) — Pure JS modules with zero React dependencies. Handles frame-accurate timing, canvas rendering, adaptive difficulty, and trial logic. All engine functions are deterministic factory/mutator patterns (`create*` returns plain objects, update functions mutate passed-in objects).

2. **Hook layer** (`src/hooks/`) — Bridges engine to React. `useCanvasEngine` wires the rAF loop and canvas element; `useTraining` orchestrates the full session lifecycle and phase transitions. Mutable engine data lives in `useRef` (never triggers re-renders); `useState` is reserved for UI phase changes only.

3. **Component layer** (`src/components/`) — React components. `CanvasRenderer` uses render props to pass `{ engineData, renderRef }` to children. Response buttons and overlays are absolutely positioned over the canvas.

### Key State Machines

**Trial phases** (trialEngine.js): `FIXATION → STIMULUS → MASK → RESPONSE_SHAPE → [RESPONSE_LOCATION] → FEEDBACK → ITI → COMPLETE`

**Session phases** (useTraining.js): `idle → exercise_select → pre_session → running → inter_block → post_session`

**Staircase** (staircase.js): 3 consecutive correct → decrease display time by 1 frame; 1 incorrect → increase by 2 frames. Threshold = mean of reversal points (first 4 discarded). New sessions start at `previousThreshold × 1.1`.

### Critical Timing Constraints

- Display durations are measured in **frames** (not milliseconds) to align with screen refresh
- All stimulus rendering uses Canvas 2D + `requestAnimationFrame` — never DOM elements or `setTimeout`
- Refresh rate detected at startup (120 rAF samples, median + coefficient of variation check)
- Dropped frame threshold: 1.5× expected frame duration

### Coordinate System

Canvas positions use normalized `[0,1]` values internally, converted via `toCanvasPixels()`/`toNormalized()` in `src/utils/coordinates.js`. All pixel values are rounded to integers to prevent sub-pixel anti-aliasing artifacts.

### Persistence

`src/services/dataService.js` wraps localStorage with schema versioning (v1). Two keys: `cognify_profile` (session counts) and `cognify_sessions` (trial-level history). All reads use try-catch with fallback defaults.

## Exercises

- **Exercise 1**: Central shape identification only
- **Exercise 2**: Central shape ID + peripheral triangle location (divided attention). Unlocked after 5 Ex1 sessions (dev bypass: `Ctrl+Shift+U`)

## Tech Stack

React 19, Tailwind CSS 4, Vite 8, HTML5 Canvas 2D, Web Audio API (synthesized tones, no audio files), localStorage. No backend.

## Conventions

- Engine files: camelCase `.js`. Components: PascalCase `.jsx`
- Factory functions: `create*`. Canvas drawing: `draw*`. Data access: `get*`
- Ref variables: `*Ref` / `*Ref.current`
- Spec requirement IDs referenced in comments (e.g., `TRAL-01`, `STRC-10`, `AUDO-04`)
- Commit style: `feat(##): description`
- Debug panel: `Ctrl+Shift+D` in dev mode
- Touch targets: minimum 48px, ideally 64px

## Planning & Decision Docs

- `.planning/` — PROJECT.md, ROADMAP.md, REQUIREMENTS.md, STATE.md
- `.gsd/DECISIONS.md` — 10 architectural decisions (D001–D010) with rationale
