# Research Summary: CogSpeed

**Domain:** Frame-accurate canvas-based adaptive cognitive speed training web app
**Researched:** 2026-03-21
**Overall confidence:** HIGH

## Executive Summary

CogSpeed is a client-side React SPA that implements the ACTIVE study's speed-of-processing training protocol using psychophysics-standard techniques. The core technical challenge is frame-accurate stimulus presentation -- displaying visual stimuli for an exact number of screen refresh frames, then masking them. This requires HTML5 Canvas with requestAnimationFrame for rendering, completely bypassing React's render cycle for timing-critical operations.

The 2026 React ecosystem has a clear standard stack for this type of application. Vite 8 (released March 2026) is the unambiguous choice for bundling -- it uses Rolldown (Rust-based) for dramatically faster builds, and CRA is effectively dead. React 19.2 is the current stable release. Tailwind CSS v4.2 brings CSS-first configuration with no JS config file. Vitest 4.1 is the native test runner for Vite projects. All of these are mature, well-documented, and highly compatible with each other.

The project's unique technical constraints center on its psychophysics requirements: frame counting (not setTimeout), pattern masking, reversal-based threshold estimation, and the staircase algorithm. None of these require exotic libraries -- they are implemented with native browser APIs (Canvas 2D, requestAnimationFrame, Web Audio API, localStorage). The challenge is architectural: keeping React's render cycle cleanly separated from the imperative, frame-counted animation loop.

The audio requirements (simple feedback tones) are trivially satisfied by the Web Audio API's OscillatorNode, requiring zero audio file dependencies. The data persistence needs (two localStorage keys) require no state management library. Recharts is declared for future data visualization but is deferred from the MVP scope.

## Key Findings

**Stack:** Vite 8 + React 19.2 + Tailwind CSS v4.2 + native Canvas/Web Audio APIs + Vitest 4.1. No heavyweight libraries needed -- the domain is well-served by browser-native APIs.

**Architecture:** Two-layer design -- React manages screens and UI state, while the Canvas rendering engine operates independently via useRef and requestAnimationFrame. These layers communicate through callback refs, never through setState during animation.

**Critical pitfall:** Using React state (useState) or setTimeout for animation loop variables. This single mistake makes all timing unreliable and would require a complete rewrite of the rendering engine.

## Implications for Roadmap

Based on research, suggested phase structure:

1. **Canvas Rendering Engine** - Build the timing-critical foundation first
   - Addresses: requestAnimationFrame loop, frame counting, DPI scaling, resize handling
   - Avoids: The critical pitfall of React state in animation loop (establishes ref-based pattern from day 1)

2. **Stimulus System** - Shape drawing and trial visual flow
   - Addresses: Programmatic shape drawing, fixation cross, pattern mask
   - Avoids: Blurry rendering on high-DPI, static mask problems

3. **Staircase Algorithm** - Pure logic, independently testable
   - Addresses: 3-Up/1-Down algorithm, reversal tracking, threshold calculation
   - Avoids: Off-by-one reversal bugs (unit test extensively before integration)

4. **Trial and Session Flow** - Wire everything together
   - Addresses: Trial state machine, response handling, reaction timing, block structure, session state machine
   - Avoids: Wrong RT measurement start point

5. **Audio and Persistence** - Feedback and data continuity
   - Addresses: Web Audio feedback tones, localStorage read/write, session-to-session continuity
   - Avoids: Autoplay policy crash, JSON.parse corruption, oscillator click/pop

6. **Exercise 2 and Polish** - Extend to divided attention
   - Addresses: Peripheral targets, second exercise flow, unlock gate
   - Avoids: Hardcoded canvas positions (use relative sizing)

**Phase ordering rationale:**
- Canvas engine must come first because every visual feature depends on it
- Staircase algorithm should be built and tested in isolation before integration (pure function, no dependencies)
- Audio and persistence are relatively independent and can be integrated late
- Exercise 2 extends Exercise 1 patterns -- build it after Exercise 1 is proven

**Research flags for phases:**
- Phase 1 (Canvas Engine): Standard patterns, well-documented. No deeper research needed.
- Phase 3 (Staircase): Algorithm is well-defined in psychophysics literature. May need to verify exact parameters against ACTIVE study protocol papers.
- Phase 6 (Exercise 2): Peripheral target placement geometry needs precise specification. The "70-80% distance on elliptical path at 8 clock positions" is defined in PROJECT.md but implementation details may need refinement.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions verified against official sources (vite.dev, react.dev, npm). Ecosystem is mature and stable. |
| Features | HIGH | Feature set is well-defined by PROJECT.md and grounded in ACTIVE study protocol. |
| Architecture | HIGH | Two-layer React + Canvas pattern is well-documented across multiple authoritative sources. useRef for animation state is the established best practice. |
| Pitfalls | HIGH | Timing pitfalls (setTimeout vs rAF, React state in loops) are extensively documented in the canvas animation community. Audio autoplay policy is well-understood. |

## Gaps to Address

- **ACTIVE study exact parameters:** The staircase step sizes, number of reversals to average, and initial display durations should be verified against the original research protocol. Project context gives good parameters but original paper should be referenced during implementation.
- **High refresh rate displays:** At 120Hz or 144Hz, one frame = ~8.3ms or ~6.9ms. The protocol assumes 60Hz (1 frame = ~16.67ms). Should the app detect refresh rate and adjust, or target 60fps explicitly? This is a design decision, not a research gap.
- **Recharts integration specifics:** Deferred from MVP, but when implemented, the chart design (what metrics to visualize, how to show threshold progression) needs UX research.
- **Mobile performance:** Canvas + rAF timing on mobile browsers (especially Safari) may have different characteristics than desktop. Should be validated during integration testing.

---
*Research summary for: CogSpeed -- adaptive cognitive speed training web app*
*Researched: 2026-03-21*
