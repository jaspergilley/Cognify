# S03: Staircase Algorithm

**Goal:** Pure-function staircase module that correctly adapts difficulty and produces stable threshold estimates via reversal averaging
**Demo:** Staircase converges to ~79.4% correct threshold with stable reversal-based estimation

## Must-Haves

- 3-Up/1-Down rule implemented correctly
- Display time clamped between 1 and 30 frames
- No spurious reversals from boundary clamping
- Threshold calculated from reversal point averaging
- Separate staircase instances per exercise type

## Tasks

- [x] **T01: Staircase Module** `est:5min`
  - Pure-function createStaircase, updateStaircase, calculateThreshold, getStaircaseStats
  - Immutable state updates, reversal detection, boundary clamping without spurious reversals
  - Verified via automated node tests: 3-up/1-down, clamping, reversal, threshold calculation

## Files Likely Touched

- src/engine/staircase.js (new)
