# Stack Research

**Domain:** Frame-accurate canvas-based adaptive cognitive speed training web app
**Researched:** 2026-03-21
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| React | ^19.2.1 | UI framework | Stable, declarative component model. React 19.2 is current stable with improved concurrent rendering. The project spec mandates React + JSX. [HIGH confidence -- verified via react.dev/versions] |
| Vite | ^8.0.1 | Build tool + dev server | Vite 8 (released 2026-03-12) uses Rolldown (Rust-based bundler) for both dev and prod -- massive speed gains. Native ESM dev server with sub-second HMR. The standard React SPA bundler in 2026; CRA is effectively dead. [HIGH confidence -- verified via vite.dev/blog/announcing-vite8] |
| Tailwind CSS | ^4.2.0 | Utility-first CSS | Project spec mandates Tailwind. v4.2 (Feb 2026) is current stable. v4 is a ground-up rewrite: CSS-first config, automatic content detection, no JS config file needed. 5x faster full builds than v3. [HIGH confidence -- verified via github.com/tailwindlabs/tailwindcss/releases] |
| HTML5 Canvas API | Browser native | Stimulus rendering | Required for sub-frame timing precision. Canvas + requestAnimationFrame gives vsync-aligned frame counting -- the only way to get display durations that align with actual screen refreshes. No library needed; use the native 2D context API directly. [HIGH confidence -- this is the standard approach for psychophysics timing on the web] |
| Web Audio API | Browser native | Programmatic sound generation | OscillatorNode + GainNode for correct/incorrect/complete feedback tones. No audio file dependencies. Native browser API with excellent support. [HIGH confidence -- verified via MDN Web Audio API docs] |

### Data Persistence

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| localStorage | Browser native | Structured data persistence | Project spec mandates localStorage-only storage. Synchronous, ~5-10MB limit (more than sufficient for session data). JSON serialization for structured objects. No library needed -- just `JSON.parse`/`JSON.stringify` with a thin wrapper. [HIGH confidence] |

### Data Visualization (Deferred)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Recharts | ^3.8.0 | Progress charts and session history | Project spec declares Recharts. v3.8.0 (March 2026) is current stable with improved TypeScript generics, new hooks API (`useXAxisScale`, etc.), and better performance. Built on React + D3 with a declarative API that matches React patterns. [HIGH confidence -- verified via github.com/recharts/recharts/releases] |

### Development & Testing

| Tool | Version | Purpose | Notes |
|------|---------|---------|-------|
| Vitest | ^4.1.0 | Unit + integration testing | Vite-native test runner. Understands your Vite config, reuses transform pipeline. Jest-compatible API (`expect`, `describe`, `it`). Has `vi.advanceTimersByTimeAsync()` for timing-critical tests and fake timer support for requestAnimationFrame. [HIGH confidence -- verified via vitest.dev] |
| vitest-canvas-mock | ^1.1.3 | Canvas API mocking in tests | Mocks `HTMLCanvasElement` and `CanvasRenderingContext2D` for jsdom environment. Fork of jest-canvas-mock adapted for Vitest. Actively maintained (Dec 2025 release). Essential because jsdom has no native canvas support. [HIGH confidence -- verified via github.com/wobsoriano/vitest-canvas-mock] |
| jsdom | (bundled with Vitest) | DOM environment for tests | Use jsdom (not happy-dom) as Vitest test environment. happy-dom is faster but has incomplete browser API coverage. Canvas mocking via vitest-canvas-mock requires jsdom. [MEDIUM confidence -- jsdom is safer for canvas-heavy code] |
| ESLint | ^10.0.3 | Linting | ESLint 10 is current (March 2026). Use flat config format (`eslint.config.js`). Pair with eslint-plugin-react and eslint-plugin-react-hooks for hooks rules enforcement. [MEDIUM confidence -- version verified via web search] |
| eslint-plugin-react-hooks | latest | React hooks linting | Enforces Rules of Hooks (dependency arrays, hook call order). Critical for a project heavy on useRef/useEffect/useCallback for animation loops. Use `reactHooks.configs.flat.recommended`. [HIGH confidence -- verified via react.dev/reference/eslint-plugin-react-hooks] |

## Installation

```bash
# Scaffold project
npm create vite@latest cogspeed -- --template react

# Core dependencies
npm install react react-dom recharts

# Tailwind CSS v4 (simplified v4 install -- no PostCSS config needed)
npm install tailwindcss @tailwindcss/vite

# Dev dependencies
npm install -D vitest vitest-canvas-mock jsdom
npm install -D eslint eslint-plugin-react eslint-plugin-react-hooks
```

### Vite Config for Tailwind v4

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
});
```

### Vitest Config for Canvas Testing

```javascript
// vitest.config.js (or in vite.config.js)
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
  },
});
```

```javascript
// src/test/setup.js
import 'vitest-canvas-mock';
```

### CSS Entry Point (Tailwind v4)

```css
/* src/index.css */
@import "tailwindcss";
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Vite 8 | Next.js | Only if you need SSR/SSG. CogSpeed is a pure client-side SPA with no backend -- Next.js adds unnecessary server complexity. |
| Vite 8 | Create React App (CRA) | Never. CRA is unmaintained (last meaningful update was 2022). React team officially recommends frameworks or Vite. |
| Vite 8 | Webpack | Only in legacy codebases. Vite is faster in dev (native ESM) and prod (Rolldown). Webpack requires extensive config. |
| Tailwind CSS v4 | CSS Modules | If you philosophically oppose utility-first CSS. But project spec mandates Tailwind, and v4's CSS-first config eliminates the JS config overhead. |
| Recharts | Victory / Nivo | Recharts is simpler and spec-mandated. Victory offers more customization. Nivo is heavier but beautiful. For progress charts this simple, Recharts is ideal. |
| Vitest | Jest 30 | If you are not using Vite. Vitest shares Vite's transform pipeline -- zero extra config for JSX/ESM. Jest requires separate Babel/SWC setup. |
| jsdom | happy-dom | If you need faster tests and don't use canvas. happy-dom is 3-10x faster but has gaps in browser API coverage and no canvas mock ecosystem. |
| localStorage (raw) | Zustand persist middleware | If state management becomes complex enough to warrant a store. For CogSpeed's two storage keys (`cogspeed_profile`, `cogspeed_sessions`), a thin custom hook is simpler and has zero dependencies. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Create React App | Unmaintained since ~2022. Slow dev server (Webpack). React team no longer recommends it. | Vite 8 with `react` template |
| setTimeout/setInterval for stimulus timing | Cannot guarantee vsync alignment. Timing jitter of 4-16ms makes frame-accurate display impossible. This is the single most important constraint in the project. | requestAnimationFrame with frame counting |
| DOM elements for stimulus display | DOM layout/paint cycle introduces variable delays. Cannot guarantee single-frame display at 60fps. | HTML5 Canvas with direct 2D context drawing |
| Pixi.js / Three.js / Konva | Massive overkill for 2D shape drawing. Adds 100KB-500KB for functionality you won't use. WebGL context adds complexity. CogSpeed draws circles, squares, and triangles -- native Canvas 2D path operations handle this trivially. | Native Canvas 2D API (`ctx.beginPath()`, `ctx.arc()`, `ctx.fill()`) |
| Howler.js / Tone.js for sound | Audio file dependencies and library overhead for what amounts to 3 simple tones. CogSpeed needs ~200ms sine wave beeps, not a music production toolkit. | Native Web Audio API with OscillatorNode + GainNode |
| React state for animation loop data | Re-renders on every frame (60fps) would destroy performance. React's reconciliation cycle adds unpredictable latency to frame timing. | useRef for mutable animation state (frame count, timing, canvas ref) |
| Zustand / Redux / Jotai | Over-engineering for an app with 2 localStorage keys and simple component tree. Adds dependencies and patterns that don't earn their complexity. | Custom `usePersistedState` hook wrapping useState + useEffect + localStorage |
| TypeScript | Project spec mandates `.jsx` files. TypeScript would add compile step overhead and configuration complexity for a hackathon MVP. Can be migrated later. | Plain JavaScript with JSX |

## Stack Patterns by Variant

**For the timing engine (core):**
- Use `useRef` for ALL mutable state (frame count, timestamps, animation frame IDs, canvas element reference)
- Use `useEffect` with empty dependency array for one-time animation loop setup
- Use `cancelAnimationFrame` in cleanup function to prevent memory leaks
- NEVER trigger React re-renders from the animation loop -- push display updates to canvas directly

**For UI chrome (buttons, screens, results):**
- Use standard React state (`useState`) for UI-level state (current screen, session results, user responses)
- Use Tailwind utility classes for layout and styling
- Keep React rendering separate from canvas rendering -- they operate on different update cycles

**For audio feedback:**
- Create a single `AudioContext` instance (singleton, created on first user interaction due to autoplay policy)
- Create new `OscillatorNode` per sound (oscillators are single-use by design)
- Use `GainNode` for volume envelope (fade in/out to avoid clicks)
- Use `setValueAtTime()` / `linearRampToValueAtTime()` for precise scheduling

**For data persistence:**
- Serialize to JSON, store under namespaced keys (`cogspeed_profile`, `cogspeed_sessions`)
- Always wrap `JSON.parse` in try-catch (corrupt data must not crash the app)
- Debounce writes if updating frequently (localStorage is synchronous and blocks the main thread)
- Include a schema version field for future migration support

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| Vite ^8.0.1 | Node.js 20.19+ or 22.12+ | Requires Node with `require(esm)` support. Will not work on Node 18. |
| Vite ^8.0.1 | @vitejs/plugin-react latest | Full plugin compatibility maintained from Vite 7. |
| Tailwind CSS ^4.2.0 | @tailwindcss/vite latest | v4 uses a Vite plugin instead of PostCSS. No `tailwind.config.js` needed -- config is CSS-first via `@theme` directives. |
| React ^19.2.1 | react-dom ^19.2.1 | Must match versions. React 19 includes the new compiler (optional, not needed here). |
| Vitest ^4.1.0 | Vite ^8.0.1 | Vitest 4 is Vite-native and shares its config. |
| Recharts ^3.8.0 | React ^19.2.1 | Recharts 3.x has full React 19 support. |
| vitest-canvas-mock ^1.1.3 | Vitest ^4.1.0 + jsdom | Must use jsdom environment (not happy-dom). Configure via setupFiles. |

## Node.js Requirement

**Use Node.js 22.x LTS** (22.12+). Vite 8 requires either Node 20.19+ or 22.12+. Node 22 is the active LTS line as of 2026 and provides the best compatibility with the modern ESM-first tooling stack.

## Sources

- [Vite 8 announcement](https://vite.dev/blog/announcing-vite8) -- Rolldown migration, Node.js requirements, release date (HIGH confidence)
- [Vite getting started](https://vite.dev/guide/) -- scaffolding commands, templates (HIGH confidence)
- [React versions page](https://react.dev/versions) -- React 19.2.1 as current stable (HIGH confidence)
- [Recharts GitHub releases](https://github.com/recharts/recharts/releases) -- v3.8.0 current (HIGH confidence)
- [Tailwind CSS v4 blog post](https://tailwindcss.com/blog/tailwindcss-v4) -- v4 architecture, CSS-first config (HIGH confidence)
- [Tailwind CSS releases](https://github.com/tailwindlabs/tailwindcss/releases) -- v4.2.0 as latest (HIGH confidence)
- [Vitest homepage](https://vitest.dev/) -- v4.1.0 current, features (HIGH confidence)
- [vitest-canvas-mock](https://github.com/wobsoriano/vitest-canvas-mock) -- v1.1.3, setup instructions (HIGH confidence)
- [MDN requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame) -- timing precision, callback behavior (HIGH confidence)
- [MDN Web Audio API best practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices) -- AudioContext autoplay policy, oscillator usage (HIGH confidence)
- [MDN OscillatorNode](https://developer.mozilla.org/en-US/docs/Web/API/OscillatorNode) -- waveform types, single-use design (HIGH confidence)
- [eslint-plugin-react-hooks](https://react.dev/reference/eslint-plugin-react-hooks) -- flat config support (HIGH confidence)
- [Vitest rAF issue #6346](https://github.com/vitest-dev/vitest/issues/6346) -- advanceTimersToNextFrame discussion (MEDIUM confidence)
- [jsdom canvas threading issues](https://xebia.com/blog/how-to-solve-canvas-crash-in-vitest-with-threads-and-jsdom/) -- jsdom vs happy-dom for canvas (MEDIUM confidence)

---
*Stack research for: CogSpeed -- adaptive cognitive speed training web app*
*Researched: 2026-03-21*
