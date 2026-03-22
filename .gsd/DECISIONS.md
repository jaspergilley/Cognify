# Decisions

<!-- Append-only register of architectural and pattern decisions -->

| ID | Decision | Rationale | Date |
|----|----------|-----------|------|
| D001 | Canvas + rAF for stimulus rendering | DOM elements too slow for sub-frame timing; rAF gives vsync-aligned frame counting | 2026-03-21 |
| D002 | 3-Up / 1-Down staircase | Standard transformed staircase from psychophysics; converges to 79.4% correct threshold | 2026-03-21 |
| D003 | Reversal-based threshold calculation | More stable than trial averaging; standard in psychophysics research | 2026-03-21 |
| D004 | Infrastructure-first build order | Core mechanics must work correctly before any UI polish | 2026-03-21 |
| D005 | Dev toggle for Exercise 2 unlock | Keeps real protocol (5 sessions) but allows demo/testing | 2026-03-21 |
| D006 | Frame-based timing over milliseconds | Ensures display durations align with actual screen refreshes | 2026-03-21 |
| D007 | Manual project scaffold instead of create-vite | Non-empty directory (existing .git and .planning) | 2026-03-21 |
| D008 | Dropped frame threshold at 1.5x expected frame duration | Standard in game engines and animation monitoring | 2026-03-21 |
| D009 | All engine modules are pure JS factory functions with named exports only | No React dependencies in engine layer | 2026-03-21 |
| D010 | Refresh rate detector falls back to 60Hz on high variance (CV > 0.2) | Prevents incorrect Hz on VRR displays or during load | 2026-03-21 |
