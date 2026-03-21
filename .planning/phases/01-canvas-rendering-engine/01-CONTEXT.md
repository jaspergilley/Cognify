# Phase 1: Canvas Rendering Engine - Context

**Gathered:** 2026-03-21
**Status:** Ready for planning

<domain>
## Phase Boundary

A rock-solid canvas surface that renders at native resolution, counts frames accurately, and handles every browser environment edge case. This phase delivers the rendering pipeline — DPI scaling, rAF frame loop, aspect ratio maintenance, resize handling, visibility change detection, refresh rate measurement, and dropped frame tracking. No stimuli, no trials, no user interaction beyond the canvas itself.

</domain>

<decisions>
## Implementation Decisions

### Canvas shape & sizing
- 4:3 aspect ratio — matches traditional vision research displays, symmetric distance for peripheral stimuli
- Canvas fills available viewport space while maintaining 4:3 ratio, with letterboxing on non-matching viewports
- Minimum effective size 600x450px
- On screens below minimum: show a warning message ("screen too small" / "rotate device") but allow the user to dismiss and continue — don't hard-block
- No visible border — canvas blends seamlessly into page background

### App container & appearance
- Background color: deep navy (#1a1a2e) for both canvas and page — clinical but comfortable, good contrast for white stimuli
- Fully immersive during training — nothing visible except the training canvas (no headers, nav bars, or status indicators)
- Letterbox bars match canvas background color (same #1a1a2e) — user cannot distinguish where canvas ends and page begins
- Offer an opt-in fullscreen toggle button — user can enter browser fullscreen if they want maximum immersion, but it's not forced or automatic

### Device priority
- Desktop and mobile supported equally — not one over the other
- On mobile: lock orientation to landscape during training (via CSS/screen orientation API) since 4:3 canvas needs horizontal space
- Touch input: response buttons overlay the canvas during response phases (tap directly on canvas area)
- Block all default touch behaviors on the canvas element: pinch-to-zoom, double-tap-to-zoom, pull-to-refresh — prevent accidental interruptions during timed trials

### Refresh rate handling
- Use native display refresh rate — don't cap at 60Hz. 120Hz displays get finer timing granularity (8.3ms frames vs 16.7ms). Staircase step sizes adapt to detected frame duration
- Show detected refresh rate in a developer/debug panel accessible via keyboard shortcut (not visible to regular users)

### Claude's Discretion
- Dropped frame handling: threshold for what counts as a "dropped frame" and what action to take (log only vs void trial)
- Refresh rate calibration duration at startup (number of frames to measure before locking in detected rate)
- Exact implementation of the debug/dev panel (keyboard shortcut, what info to show beyond refresh rate)
- Loading skeleton or startup visual while calibrating refresh rate

</decisions>

<specifics>
## Specific Ideas

- The training screen should feel like a vision research lab — dark, focused, nothing distracting
- Seamless blend between canvas and page means the whole viewport IS the training surface
- Fullscreen toggle is a "nice to have" for dedicated trainers, not a core requirement

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-canvas-rendering-engine*
*Context gathered: 2026-03-21*
