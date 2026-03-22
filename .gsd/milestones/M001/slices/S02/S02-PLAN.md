# S02: Stimulus System

**Goal:** All visual elements of the training protocol render correctly — shapes are distinct, masks obscure afterimages, display durations are frame-accurate
**Demo:** All 12 shapes render distinctly, fixation cross displays for 30 frames, pattern mask obscures afterimage, peripheral targets at 8 positions

## Must-Haves

- Fixation cross renders centered for ~30 frames (STIM-01)
- All 12 geometric shapes render as visually distinct at ~80x80px (STIM-02, STIM-03)
- Pattern mask renders for ~6 frames after stimulus offset (STIM-04)
- Peripheral targets at 8 clock positions at 70-80% distance (STIM-05)
- Distractor shapes distinct from target triangles (STIM-06)
- High-contrast white fill on dark background (STIM-07)
- Display duration controlled by frame count (STIM-08)

## Tasks

- [x] **T01: Shape Library and Stimulus Renderer** `est:8min`
  - Build shapePaths.js with all 13 geometric shapes as canvas path functions
  - Build stimulusRenderer.js with fixation cross, stimulus drawing, pattern mask, and peripheral targets
  - All pure JS, no React dependency, uses coordinates module
- [x] **T02: Visual Verification Demo** `est:5min`
  - Wire stimulus renderer into useCanvasEngine's onFrame to cycle through all shapes
  - Auto-cycling demo: fixation → shape + peripheral target → mask for each of 13 shapes

## Files Likely Touched

- src/engine/shapePaths.js (new)
- src/engine/stimulusRenderer.js (new)
- src/hooks/useCanvasEngine.js (modify onFrame)
- src/components/DebugPanel.jsx (add shape gallery toggle)
