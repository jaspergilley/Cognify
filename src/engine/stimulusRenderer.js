/**
 * Stimulus Renderer Module
 *
 * Renders all visual elements of the training protocol on the canvas:
 * fixation cross, stimulus shapes, pattern mask, and peripheral targets.
 * All positions use the coordinates module for normalized → pixel conversion.
 *
 * STIM-01: Fixation cross centered
 * STIM-02: Shape rendering via shapePaths registry
 * STIM-03: Consistent stimulus size (~80x80px relative to canvas)
 * STIM-04: Pattern mask after stimulus offset
 * STIM-05: Peripheral targets at 8 clock positions
 * STIM-06: Distractor shapes distinct from target triangles
 * STIM-07: High-contrast white on dark background
 * STIM-08: Frame-count-based display duration
 *
 * @module engine/stimulusRenderer
 */

import { SHAPES } from './shapePaths.js';

/** Default stimulus size as fraction of canvas height */
const STIMULUS_SIZE_RATIO = 0.12;

/** Peripheral target distance from center (fraction of half-canvas dimension) */
const PERIPHERAL_DISTANCE = 0.75;

/** Peripheral target size as fraction of canvas height */
const PERIPHERAL_SIZE_RATIO = 0.06;

/** Fixation cross arm length as fraction of canvas height */
const FIXATION_SIZE_RATIO = 0.04;

/** Fixation cross line width in CSS pixels */
const FIXATION_LINE_WIDTH = 3;

/** Mask cell size in CSS pixels */
const MASK_CELL_SIZE = 12;

/**
 * 8 clock positions for peripheral targets (in radians).
 * 12 o'clock = -π/2, then clockwise in 45° steps.
 */
export const PERIPHERAL_POSITIONS = [
  -Math.PI / 2,        // 12 o'clock
  -Math.PI / 4,        // 1:30
  0,                    // 3 o'clock
  Math.PI / 4,         // 4:30
  Math.PI / 2,         // 6 o'clock
  (3 * Math.PI) / 4,   // 7:30
  Math.PI,             // 9 o'clock
  -(3 * Math.PI) / 4,  // 10:30
];

/**
 * Clear canvas with dark background.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} width - Canvas width in CSS pixels
 * @param {number} height - Canvas height in CSS pixels
 * @param {string} [color='#1a1a2e'] - Background color
 */
export function clearCanvas(ctx, width, height, color = '#1a1a2e') {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);
}

/**
 * Draw fixation cross at canvas center.
 * STIM-01: Centered fixation cross.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} width - Canvas width in CSS pixels
 * @param {number} height - Canvas height in CSS pixels
 */
export function drawFixation(ctx, width, height) {
  const cx = Math.round(width / 2);
  const cy = Math.round(height / 2);
  const arm = Math.round(height * FIXATION_SIZE_RATIO);

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = FIXATION_LINE_WIDTH;
  ctx.lineCap = 'round';

  ctx.beginPath();
  // Vertical line
  ctx.moveTo(cx, cy - arm);
  ctx.lineTo(cx, cy + arm);
  // Horizontal line
  ctx.moveTo(cx - arm, cy);
  ctx.lineTo(cx + arm, cy);
  ctx.stroke();
}

/**
 * Draw a stimulus shape at canvas center.
 * STIM-02, STIM-03, STIM-07.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} shapeId - Shape identifier from SHAPE_IDS
 * @param {number} width - Canvas width in CSS pixels
 * @param {number} height - Canvas height in CSS pixels
 * @param {string} [color='#ffffff'] - Fill color
 */
export function drawCentralStimulus(ctx, shapeId, width, height, color = '#ffffff') {
  const drawFn = SHAPES[shapeId];
  if (!drawFn) return;

  const cx = Math.round(width / 2);
  const cy = Math.round(height / 2);
  const size = Math.round(height * STIMULUS_SIZE_RATIO);

  ctx.fillStyle = color;
  drawFn(ctx, cx, cy, size);
}

/**
 * Draw pattern mask covering the stimulus area.
 * Renders a random checkerboard pattern that prevents retinal afterimage.
 * STIM-04.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} width - Canvas width in CSS pixels
 * @param {number} height - Canvas height in CSS pixels
 * @param {number} [seed] - Optional seed for reproducible patterns (not used for crypto)
 */
export function drawPatternMask(ctx, width, height, seed) {
  const cx = Math.round(width / 2);
  const cy = Math.round(height / 2);
  const maskSize = Math.round(height * STIMULUS_SIZE_RATIO * 1.8);
  const halfMask = Math.round(maskSize / 2);

  const startX = cx - halfMask;
  const startY = cy - halfMask;

  // Simple PRNG for reproducible mask patterns
  let rng = seed || (Date.now() & 0xffff);
  function nextRandom() {
    rng = (rng * 1103515245 + 12345) & 0x7fffffff;
    return (rng >> 16) / 32768;
  }

  for (let y = 0; y < maskSize; y += MASK_CELL_SIZE) {
    for (let x = 0; x < maskSize; x += MASK_CELL_SIZE) {
      ctx.fillStyle = nextRandom() > 0.5 ? '#ffffff' : '#555555';
      ctx.fillRect(
        Math.round(startX + x),
        Math.round(startY + y),
        MASK_CELL_SIZE,
        MASK_CELL_SIZE,
      );
    }
  }
}

/**
 * Draw a peripheral target at one of 8 clock positions.
 * STIM-05: Target triangle at 70-80% distance from center.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} positionIndex - Clock position index (0-7, 0 = 12 o'clock)
 * @param {number} width - Canvas width in CSS pixels
 * @param {number} height - Canvas height in CSS pixels
 * @param {string} [color='#ffffff'] - Fill color
 */
export function drawPeripheralTarget(ctx, positionIndex, width, height, color = '#ffffff') {
  const angle = PERIPHERAL_POSITIONS[positionIndex];
  if (angle === undefined) return;

  const cx = Math.round(width / 2);
  const cy = Math.round(height / 2);

  // Elliptical path: use half-width and half-height for x and y radii
  const rx = (width / 2) * PERIPHERAL_DISTANCE;
  const ry = (height / 2) * PERIPHERAL_DISTANCE;

  const targetX = Math.round(cx + rx * Math.cos(angle));
  const targetY = Math.round(cy + ry * Math.sin(angle));
  const size = Math.round(height * PERIPHERAL_SIZE_RATIO);

  // Peripheral target is always a triangle (upward-pointing)
  ctx.fillStyle = color;
  SHAPES.triangle(ctx, targetX, targetY, size);
}

/**
 * Draw all 8 peripheral position markers (for response UI).
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} width - Canvas width in CSS pixels
 * @param {number} height - Canvas height in CSS pixels
 * @param {number} [highlightIndex=-1] - Position to highlight (-1 = none)
 * @param {string} [markerColor='rgba(255,255,255,0.3)'] - Default marker color
 * @param {string} [highlightColor='#ffffff'] - Highlighted marker color
 */
export function drawPeripheralMarkers(ctx, width, height, highlightIndex = -1, markerColor = 'rgba(255,255,255,0.3)', highlightColor = '#ffffff') {
  const cx = Math.round(width / 2);
  const cy = Math.round(height / 2);
  const rx = (width / 2) * PERIPHERAL_DISTANCE;
  const ry = (height / 2) * PERIPHERAL_DISTANCE;
  const dotR = 6;

  for (let i = 0; i < 8; i++) {
    const angle = PERIPHERAL_POSITIONS[i];
    const x = Math.round(cx + rx * Math.cos(angle));
    const y = Math.round(cy + ry * Math.sin(angle));

    ctx.fillStyle = i === highlightIndex ? highlightColor : markerColor;
    ctx.beginPath();
    ctx.arc(x, y, dotR, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Draw a distractor shape at a peripheral position.
 * STIM-06: Distractors are distinct from target triangles.
 * Uses non-triangle shapes (squares, circles, diamonds) as distractors.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} shapeId - Distractor shape ID (should NOT be 'triangle')
 * @param {number} positionIndex - Clock position index (0-7)
 * @param {number} width - Canvas width in CSS pixels
 * @param {number} height - Canvas height in CSS pixels
 * @param {string} [color='#ffffff'] - Fill color
 */
export function drawDistractor(ctx, shapeId, positionIndex, width, height, color = '#ffffff') {
  const angle = PERIPHERAL_POSITIONS[positionIndex];
  if (angle === undefined) return;

  const drawFn = SHAPES[shapeId];
  if (!drawFn) return;

  const cx = Math.round(width / 2);
  const cy = Math.round(height / 2);
  const rx = (width / 2) * PERIPHERAL_DISTANCE;
  const ry = (height / 2) * PERIPHERAL_DISTANCE;

  const targetX = Math.round(cx + rx * Math.cos(angle));
  const targetY = Math.round(cy + ry * Math.sin(angle));
  const size = Math.round(height * PERIPHERAL_SIZE_RATIO);

  ctx.fillStyle = color;
  drawFn(ctx, targetX, targetY, size);
}

/**
 * Distractor shape IDs — all shapes except triangle.
 * Used for Exercise 2 to generate distractors distinct from the target.
 */
export const DISTRACTOR_SHAPES = ['square', 'circle', 'diamond'];

/**
 * Convert frame count to approximate milliseconds.
 *
 * @param {number} frames - Number of frames
 * @param {number} hz - Display refresh rate
 * @returns {number} Duration in milliseconds
 */
export function framesToMs(frames, hz) {
  return (frames / hz) * 1000;
}

/**
 * Convert milliseconds to frame count (rounded).
 *
 * @param {number} ms - Duration in milliseconds
 * @param {number} hz - Display refresh rate
 * @returns {number} Number of frames (integer)
 */
export function msToFrames(ms, hz) {
  return Math.round((ms / 1000) * hz);
}

/**
 * Standard timing constants in frames (at 60Hz).
 * Actual frame counts are computed from these via msToFrames when Hz differs.
 */
export const TIMING = {
  /** Fixation cross duration: ~500ms = 30 frames at 60Hz */
  FIXATION_MS: 500,
  /** Pattern mask duration: ~100ms = 6 frames at 60Hz */
  MASK_MS: 100,
  /** Feedback duration: ~300ms */
  FEEDBACK_MS: 300,
  /** Inter-trial interval: ~400ms */
  ITI_MS: 400,
};
