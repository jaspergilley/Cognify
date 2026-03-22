# M001 Context

Cognify MVP — web-based adaptive cognitive speed training app based on the ACTIVE study (NIH, 2026).

Migrated from GSD v1 (.planning/) on 2026-03-21. Original project initialized on 2026-03-21.

## Scope

Deliver a complete training application implementing the ACTIVE study's speed-of-processing protocol with:
- Canvas-based stimulus rendering with frame-accurate timing
- 3-Up/1-Down adaptive staircase algorithm
- Two exercise types (Central Identification and Divided Attention)
- Session management with block structure
- localStorage persistence
- Audio feedback

## Constraints

- Stack: React (.jsx), Tailwind CSS, Recharts, Canvas, Web Audio API, Vite
- Timing: Must use Canvas + rAF (no DOM elements for stimuli)
- Storage: localStorage only (no backend)
- All shapes drawn programmatically (no image assets)
