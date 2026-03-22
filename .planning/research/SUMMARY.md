# Research Summary: Cognify

**Domain:** Frame-accurate canvas-based adaptive cognitive speed training web app
**Researched:** 2026-03-21 (updated with cross-analysis)
**Overall confidence:** HIGH

## Executive Summary

Cognify is a client-side React SPA that implements the ACTIVE study's speed-of-processing training protocol using psychophysics-standard techniques. The core technical challenge is frame-accurate stimulus presentation -- displaying visual stimuli for an exact number of screen refresh frames, then masking them. This requires HTML5 Canvas with requestAnimationFrame for rendering, completely bypassing React's render cycle for timing-critical operations.

The 2026 React ecosystem has a clear standard stack for this type of application. Vite 8 (released March 2026) is the unambiguous choice for bundling -- it uses Rolldown (Rust-based) for dramatically faster builds, and CRA is effectively dead. React 19.2 is the current stable release. Tailwind CSS v4.2 brings CSS-first configuration with no JS config file. Vitest 4.1 is the native test runner for Vite projects. All of these are mature, well-documented, and highly compatible with each other.

A cross-analysis of the original plan (57 requirements, React/Tailwind/localStorage) against an alternative proposal (framework switch, Supabase backend, IndexedDB sync, PWA, device calibration, Bluetooth audio, data residency compliance, normative data, privacy policy, security hardening) reveals a critical scope problem. The original plan alone requires 20-30 hours of focused work. The alternative proposal adds 31-53 hours on top. Neither can ship tonight as specified. The project needs aggressive scope reduction to ~15 core requirements for a same-day ship.

The project's unique technical constraints center on its psychophysics requirements: frame counting (not setTimeout), pattern masking, reversal-based threshold estimation, and the staircase algorithm. None of these require exotic libraries -- they are implemented with native browser APIs (Canvas 2D, requestAnimationFrame, Web Audio API, localStorage). The challenge is architectural: keeping React's render cycle cleanly separated from the imperative, frame-counted animation loop.

## Key Findings

**Stack:** Vite 8 + React 19.2 + Tailwind CSS v4.2 + native Canvas/Web Audio APIs. No framework switch. No backend. The original stack has a massive velocity advantage because all research, patterns, and anti-pattern documentation assumes React.

**Architecture:** Two-layer design -- React manages screens and UI state, while the Canvas rendering engine operates independently via useRef and requestAnimationFrame. These layers communicate through callback refs, never through setState during animation.

**Critical pitfall:** Scope. The original plan has 57 requirements across 8 categories. At hackathon velocity (~5-7 productive hours remaining), only ~15 requirements can ship. The alternative proposal would require 51-83 total hours (6-10 working days).

**Timeline reality:** "Comprehensive" depth (8-12 phases) contradicts "shipping tonight." The config says `mode: yolo` but `depth: comprehensive` -- these are mutually exclusive for a same-day ship.

## Implications for Roadmap

Based on cross-analysis, the roadmap should be restructured into two tiers: a hackathon-night ship and a post-validation expansion.

### Tonight (1 phase, ~15 requirements, 5-7 hours)

1. **Working Exercise 1 with Staircase** - Prove the core protocol works
   - Canvas rAF loop with DPI scaling
   - 4 shapes (circle, square, triangle, plus -- skip the other 8)
   - Fixation cross, pattern mask, frame-based display
   - 3-Up/1-Down staircase with reversal-based threshold
   - Simplified trial flow (20 trials, no blocks, no rest screens)
   - Two-button response UI
   - Show threshold result at end
   - NO audio, NO persistence, NO session management, NO Exercise 2

### Post-Validation (Phases 2-6, subsequent days/weeks)

2. **Session Structure and Persistence** - Make it reusable
   - Session state machine, block structure, rest screens
   - localStorage persistence, session continuity
   - Audio feedback

3. **Full Stimulus Set and Polish** - Complete the visual system
   - All 12 shapes, resize handling, refresh rate detection
   - Full trial data recording, reaction time capture
   - Visual feedback (correct/incorrect indicators)

4. **Exercise 2** - Extend to divided attention
   - Peripheral targets, 8-position response, unlock gating

5. **Dashboard and Visualization** - Show progress
   - Recharts integration, threshold history, accuracy trends

6. **Backend and Cloud Features** (from alternative proposal, if validated)
   - Supabase Auth + data sync
   - PWA deployment
   - Normative data percentile context

**Phase ordering rationale:**
- Phase 1 must prove the protocol works (staircase converges, threshold is meaningful) before any other investment
- Persistence comes second because without it, users cannot track progress
- Exercise 2 requires Exercise 1 to be solid
- Backend/cloud is only justified after the core product is validated with real users
- The alternative proposal additions (compliance, calibration, Bluetooth) are Phase 7+ concerns

**Research flags for phases:**
- Phase 1 (Canvas Engine + Staircase): Well-researched, patterns documented, no deeper research needed
- Phase 4 (Exercise 2): Peripheral target geometry needs precise specification during implementation
- Phase 6 (Supabase): Will need fresh research on Supabase RLS patterns, offline sync strategies

## Cross-Analysis: Original vs Alternative Proposal

| Dimension | Original Plan | Alternative Proposal |
|-----------|--------------|---------------------|
| Total hours | 20-30h | 51-83h |
| Can ship tonight | 15 of 57 requirements, yes | No |
| Stack risk | LOW (React is well-understood, all patterns documented) | HIGH (framework switch invalidates all existing research) |
| Backend complexity | Zero (localStorage only) | HIGH (Supabase + IndexedDB + sync + auth) |
| Compliance burden | Zero (client-side, no PII) | HIGH (FIPPA/PIPA, data residency, privacy policy) |
| Scientific validity | Same (canvas + rAF + staircase is identical) | Same (the alternative does not improve timing accuracy) |
| Demo impressiveness | "Look, it adapts to your speed" | "Look, it has user accounts and cloud sync" |
| Post-hackathon value | Core protocol validated, easy to extend | Nothing ships, nothing validated |

**Verdict:** The alternative proposal is a reasonable 6-month product roadmap disguised as a hackathon plan. The original plan, aggressively scoped down, is the only path to shipping tonight.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions verified. React is correct choice -- no framework switch justified. |
| Features | HIGH | Feature set well-defined by ACTIVE study protocol. MVP scope clearly delineated. |
| Architecture | HIGH | Two-layer React + Canvas pattern well-documented. useRef for animation state is established best practice. |
| Pitfalls | HIGH | Timing pitfalls extensively documented. Scope is the biggest risk, not technology. |
| Timeline estimates | MEDIUM | Hour estimates assume experienced developer with AI assistance. Could be faster or slower depending on skill level and tooling. |
| Alternative proposal assessment | HIGH | Each addition estimated based on well-understood implementation patterns. The total is directionally correct even if individual estimates are +/- 30%. |

## Gaps to Address

- **ACTIVE study exact parameters:** Staircase step sizes and initial display durations should be verified against original protocol papers during Phase 1 implementation.
- **High refresh rate displays:** Design decision needed -- detect and normalize, or target 60fps explicitly.
- **Recharts integration specifics:** Deferred from MVP. When implemented, chart design needs UX consideration.
- **Mobile Safari canvas timing:** Should be validated during integration testing, but is not a blocker for tonight.
- **Post-validation priorities:** After tonight's ship, need to decide whether to pursue the alternative proposal's backend additions or focus on completing the original 57 requirements first.

---
*Research summary for: Cognify -- adaptive cognitive speed training web app*
*Updated: 2026-03-21 with cross-analysis of original vs alternative proposal*
