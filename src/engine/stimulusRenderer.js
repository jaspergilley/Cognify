/**
 * Stimulus Renderer Module
 *
 * Renders all visual elements of the training protocol on the canvas:
 * fixation cross, stimulus shapes, and peripheral targets.
 * All positions use the coordinates module for normalized → pixel conversion.
 *
 * STIM-01: Fixation cross centered
 * STIM-02: Shape rendering via shapePaths registry
 * STIM-03: Consistent stimulus size (~80x80px relative to canvas)
 * STIM-05: Peripheral targets at 8 clock positions
 * STIM-06: Distractor shapes distinct from target triangles
 * STIM-07: High-contrast white on dark background
 * STIM-08: Frame-count-based display duration
 *
 * @module engine/stimulusRenderer
 */

import { SHAPES, drawTriangleDown } from './shapePaths.js';

/** Default stimulus size as fraction of canvas height */
const STIMULUS_SIZE_RATIO = 0.12;

/** Peripheral target distance from center (fraction of half-canvas dimension) */
const PERIPHERAL_DISTANCE = 0.75;

/** Three eccentricity levels matching UFOV protocol */
export const ECCENTRICITIES = {
  PROXIMAL: 0.40,
  MEDIUM:   0.60,
  DISTAL:   0.75,
};

/** Peripheral target size as fraction of canvas height */
const PERIPHERAL_SIZE_RATIO = 0.06;

/** Fixation cross arm length as fraction of canvas height */
const FIXATION_SIZE_RATIO = 0.04;

/** Fixation cross line width in CSS pixels */
const FIXATION_LINE_WIDTH = 3;

/** Stimulus fill color — light-mode default (UFOV-aligned) */
export const STIMULUS_COLOR = '#1E293B';

/** Check if dark mode is active (reads DOM class) */
function isDarkMode() {
  return typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
}

/** Get theme-appropriate stimulus color */
function getStimColor() {
  return isDarkMode() ? '#e4e0d8' : '#1E293B';
}

/** Get theme-appropriate canvas background */
function getBgColor() {
  return isDarkMode() ? '#1a1c1a' : '#FDFBF7';
}

/**
 * Get theme text color at given opacity.
 * @param {number} opacity - 0 to 1
 * @returns {string} rgba color string
 */
export function themeText(opacity) {
  return isDarkMode()
    ? `rgba(228,224,216,${opacity})`
    : `rgba(30,41,59,${opacity})`;
}

/**
 * Get theme accent color at given opacity.
 * @param {number} opacity - 0 to 1
 * @returns {string} rgba color string
 */
export function themeAccent(opacity) {
  return isDarkMode()
    ? `rgba(142,207,158,${opacity})`
    : `rgba(58,134,255,${opacity})`;
}

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
 * Clear canvas with cream background.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} width - Canvas width in CSS pixels
 * @param {number} height - Canvas height in CSS pixels
 * @param {string} [color='#FDFBF7'] - Background color
 */
export function clearCanvas(ctx, width, height, color = getBgColor()) {
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

  ctx.strokeStyle = getStimColor();
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
export function drawCentralStimulus(ctx, shapeId, width, height, color = getStimColor()) {
  const drawFn = SHAPES[shapeId];
  if (!drawFn) return;

  const cx = Math.round(width / 2);
  const cy = Math.round(height / 2);
  const size = Math.round(height * STIMULUS_SIZE_RATIO);

  ctx.fillStyle = color;
  drawFn(ctx, cx, cy, size);
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
export function drawPeripheralTarget(ctx, positionIndex, width, height, color = getStimColor(), distance = PERIPHERAL_DISTANCE) {
  const angle = PERIPHERAL_POSITIONS[positionIndex];
  if (angle === undefined) return;

  const cx = Math.round(width / 2);
  const cy = Math.round(height / 2);

  // Elliptical path: use half-width and half-height for x and y radii
  const rx = (width / 2) * distance;
  const ry = (height / 2) * distance;

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
 * @param {string} [markerColor='rgba(30,41,59,0.25)'] - Default marker color
 * @param {string} [highlightColor='#1E293B'] - Highlighted marker color
 */
export function drawPeripheralMarkers(ctx, width, height, highlightIndex = -1, markerColor = themeText(0.25), highlightColor = getStimColor(), distance = PERIPHERAL_DISTANCE) {
  const cx = Math.round(width / 2);
  const cy = Math.round(height / 2);
  const rx = (width / 2) * distance;
  const ry = (height / 2) * distance;
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
export function drawDistractor(ctx, shapeId, positionIndex, width, height, color = getStimColor(), distance = PERIPHERAL_DISTANCE) {
  const angle = PERIPHERAL_POSITIONS[positionIndex];
  if (angle === undefined) return;

  const drawFn = SHAPES[shapeId];
  if (!drawFn) return;

  const cx = Math.round(width / 2);
  const cy = Math.round(height / 2);
  const rx = (width / 2) * distance;
  const ry = (height / 2) * distance;

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
 * Fisher-Yates shuffle (in-place).
 * @param {any[]} arr
 * @returns {any[]} The same array, shuffled
 */
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Distractor shape pools by difficulty tier for Exercise 3.
 * Higher tiers include shapes more visually similar to the target triangle.
 */
const DISTRACTOR_TIER_POOLS = {
  1: ['square', 'circle', 'diamond'],
  2: ['square', 'circle', 'diamond', 'hexagon', 'plus'],
  3: ['square', 'circle', 'diamond', 'hexagon', 'pentagon', 'arrowUp'],
  4: ['square', 'circle', 'diamond', 'hexagon', 'pentagon', 'arrowUp', 'star5'],
};

/**
 * Generate distractor configurations for Exercise 3.
 *
 * @param {number} targetPosition - The target triangle's position (0-7)
 * @param {number} count - Number of distractors (3, 5, or 7)
 * @param {number} tier - Difficulty tier (1-4), controls shape similarity
 * @returns {{ positionIndex: number, shapeId: string }[]}
 */
export function generateDistractors(targetPosition, count, tier) {
  const available = [];
  for (let i = 0; i < 8; i++) {
    if (i !== targetPosition) available.push(i);
  }
  shuffleArray(available);
  const positions = available.slice(0, Math.min(count, available.length));

  const pool = DISTRACTOR_TIER_POOLS[tier] || DISTRACTOR_TIER_POOLS[1];

  return positions.map((pos) => ({
    positionIndex: pos,
    shapeId: pool[Math.floor(Math.random() * pool.length)],
  }));
}

/**
 * Draw all distractor shapes for Exercise 3.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ positionIndex: number, shapeId: string }[]} distractors
 * @param {number} width
 * @param {number} height
 * @param {string} [color='#ffffff']
 */
export function drawDistractors(ctx, distractors, width, height, color = getStimColor()) {
  for (const d of distractors) {
    drawDistractor(ctx, d.shapeId, d.positionIndex, width, height, color);
  }
}

/**
 * Generate distractors in concentric rings per UFOV protocol.
 * All distractors are downward-pointing triangles (same shape as target
 * but inverted, making the task orientation-discrimination under load).
 *
 * @param {number} targetPosition - Target's clock position (0-7)
 * @param {number} count - Total distractors (0, 8, 24, 47)
 * @param {number} eccentricity - Current eccentricity level (0.40-0.75)
 * @returns {{ angle: number, distance: number }[]}
 */
export function generateConcentricDistractors(targetPosition, count, eccentricity) {
  if (count <= 0) return [];

  const targetAngle = PERIPHERAL_POSITIONS[targetPosition];
  const rings = [
    { distance: eccentricity * 0.45, slots: 8 },
    { distance: eccentricity * 0.70, slots: 16 },
    { distance: eccentricity * 1.0,  slots: 23 },
  ];

  const allPositions = [];
  for (const ring of rings) {
    const step = (Math.PI * 2) / ring.slots;
    for (let i = 0; i < ring.slots; i++) {
      const angle = -Math.PI / 2 + i * step;
      // On the outer ring, exclude positions within ~22.5° of the target
      if (ring.distance >= eccentricity * 0.9) {
        let angleDiff = angle - targetAngle;
        // Normalize to [-π, π]
        angleDiff = ((angleDiff + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
        if (Math.abs(angleDiff) < Math.PI / 8) continue;
      }
      allPositions.push({ angle, distance: ring.distance });
    }
  }

  shuffleArray(allPositions);
  return allPositions.slice(0, Math.min(count, allPositions.length));
}

/**
 * Draw concentric ring distractors (downward-pointing triangles).
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ angle: number, distance: number }[]} distractors
 * @param {number} width
 * @param {number} height
 * @param {string} [color]
 */
export function drawConcentricDistractors(ctx, distractors, width, height, color = getStimColor()) {
  const cx = Math.round(width / 2);
  const cy = Math.round(height / 2);
  const size = Math.round(height * PERIPHERAL_SIZE_RATIO);

  ctx.fillStyle = color;
  for (const d of distractors) {
    const rx = (width / 2) * d.distance;
    const ry = (height / 2) * d.distance;
    const px = Math.round(cx + rx * Math.cos(d.angle));
    const py = Math.round(cy + ry * Math.sin(d.angle));
    drawTriangleDown(ctx, px, py, size);
  }
}

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
 * Draw in-session HUD overlay (progress bar, level, streak dots, block label).
 * Only call during non-stimulus phases to avoid visual interference.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} w - Canvas width
 * @param {number} h - Canvas height
 * @param {object} hud
 * @param {number} hud.progress - 0..1 session completion
 * @param {number} hud.displayTimeMs - Current staircase display time in ms
 * @param {number} hud.streak - Current consecutive correct count (0-3)
 * @param {string} hud.blockLabel - e.g. "Block 1 / 2"
 */
export function drawSessionHUD(ctx, w, h, { progress, displayTimeMs, streak, blockLabel }) {
  // Progress bar at bottom
  const barH = 3;
  const barY = Math.round(h) - barH;
  ctx.fillStyle = themeText(0.08);
  ctx.fillRect(0, barY, Math.round(w), barH);
  ctx.fillStyle = themeAccent(0.4);
  ctx.fillRect(0, barY, Math.round(w * Math.min(progress, 1)), barH);

  // Level indicator — top-right
  ctx.fillStyle = themeText(0.35);
  ctx.font = '14px "Nunito", monospace';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.fillText(`${displayTimeMs}ms`, Math.round(w) - 14, 14);

  // Streak dots — top-left (3 dots for 3-up rule)
  const maxStreak = 3;
  const dotStartX = 18;
  const dotY = 20;
  const dotR = 5;
  const dotGap = 16;
  for (let i = 0; i < maxStreak; i++) {
    ctx.beginPath();
    ctx.arc(dotStartX + i * dotGap, dotY, dotR, 0, Math.PI * 2);
    ctx.fillStyle = i < streak ? themeAccent(0.6) : themeText(0.12);
    ctx.fill();
  }

  // Block label — top-center
  ctx.fillStyle = themeText(0.3);
  ctx.font = '14px "Nunito", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(blockLabel, Math.round(w / 2), 14);
}

/**
 * Standard timing constants in frames (at 60Hz).
 * Actual frame counts are computed from these via msToFrames when Hz differs.
 */
export const TIMING = {
  /** Fixation cross duration — senior-friendly pacing */
  FIXATION_MS: 500,
  /** Feedback duration — enough time to read correct/incorrect */
  FEEDBACK_MS: 500,
  /** Inter-trial interval — breathing room between trials */
  ITI_MS: 500,
};
