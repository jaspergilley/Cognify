/**
 * Shape Paths Module
 *
 * Programmatic canvas path functions for all 12 geometric stimulus shapes.
 * Each function draws a shape centered at (cx, cy) with the given size.
 * All shapes use ctx.fill() — caller sets fillStyle beforehand.
 *
 * STIM-02: 12 distinct geometric shapes
 * STIM-03: Consistent size (~80x80px equivalent)
 * STIM-07: Caller applies high-contrast white fill
 *
 * @module engine/shapePaths
 */

/**
 * Draw a circle.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} cx - Center X in CSS pixels
 * @param {number} cy - Center Y in CSS pixels
 * @param {number} size - Bounding box size in CSS pixels
 */
export function drawCircle(ctx, cx, cy, size) {
  const r = size / 2;
  ctx.beginPath();
  ctx.arc(Math.round(cx), Math.round(cy), Math.round(r), 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Draw a square.
 */
export function drawSquare(ctx, cx, cy, size) {
  const half = Math.round(size / 2);
  ctx.beginPath();
  ctx.rect(Math.round(cx) - half, Math.round(cy) - half, half * 2, half * 2);
  ctx.fill();
}

/**
 * Draw an upward-pointing triangle.
 */
export function drawTriangle(ctx, cx, cy, size) {
  const half = size / 2;
  const x = Math.round(cx);
  const y = Math.round(cy);
  ctx.beginPath();
  ctx.moveTo(x, Math.round(y - half));
  ctx.lineTo(Math.round(x + half), Math.round(y + half));
  ctx.lineTo(Math.round(x - half), Math.round(y + half));
  ctx.closePath();
  ctx.fill();
}

/**
 * Draw a plus/cross shape.
 */
export function drawPlus(ctx, cx, cy, size) {
  const half = Math.round(size / 2);
  const arm = Math.round(size / 6);
  const x = Math.round(cx);
  const y = Math.round(cy);
  ctx.beginPath();
  // Vertical bar
  ctx.rect(x - arm, y - half, arm * 2, half * 2);
  // Horizontal bar
  ctx.rect(x - half, y - arm, half * 2, arm * 2);
  ctx.fill();
}

/**
 * Draw an X shape.
 */
export function drawX(ctx, cx, cy, size) {
  const half = size / 2;
  const w = size / 6;
  const x = Math.round(cx);
  const y = Math.round(cy);
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  // Draw as two rotated rectangles
  ctx.rotate(Math.PI / 4);
  ctx.rect(-Math.round(w), -Math.round(half), Math.round(w * 2), Math.round(half * 2));
  ctx.rotate(-Math.PI / 2);
  ctx.rect(-Math.round(w), -Math.round(half), Math.round(w * 2), Math.round(half * 2));
  ctx.fill();
  ctx.restore();
}

/**
 * Draw a diamond (rotated square).
 */
export function drawDiamond(ctx, cx, cy, size) {
  const half = size / 2;
  const x = Math.round(cx);
  const y = Math.round(cy);
  ctx.beginPath();
  ctx.moveTo(x, Math.round(y - half));
  ctx.lineTo(Math.round(x + half), y);
  ctx.lineTo(x, Math.round(y + half));
  ctx.lineTo(Math.round(x - half), y);
  ctx.closePath();
  ctx.fill();
}

/**
 * Draw a regular pentagon.
 */
export function drawPentagon(ctx, cx, cy, size) {
  drawRegularPolygon(ctx, cx, cy, size, 5, -Math.PI / 2);
}

/**
 * Draw a 5-pointed star.
 */
export function drawStar5(ctx, cx, cy, size) {
  const outerR = size / 2;
  const innerR = outerR * 0.38;
  const x = Math.round(cx);
  const y = Math.round(cy);
  const points = 5;
  const step = Math.PI / points;

  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = -Math.PI / 2 + i * step;
    const px = Math.round(x + r * Math.cos(angle));
    const py = Math.round(y + r * Math.sin(angle));
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

/**
 * Draw a 4-pointed star.
 */
export function drawStar4(ctx, cx, cy, size) {
  const outerR = size / 2;
  const innerR = outerR * 0.35;
  const x = Math.round(cx);
  const y = Math.round(cy);
  const points = 4;
  const step = Math.PI / points;

  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = -Math.PI / 2 + i * step;
    const px = Math.round(x + r * Math.cos(angle));
    const py = Math.round(y + r * Math.sin(angle));
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

/**
 * Draw an upward-pointing arrow.
 */
export function drawArrowUp(ctx, cx, cy, size) {
  const half = size / 2;
  const headW = size * 0.45;
  const shaftW = size * 0.15;
  const headH = size * 0.4;
  const x = Math.round(cx);
  const y = Math.round(cy);
  ctx.beginPath();
  // Arrow head
  ctx.moveTo(x, Math.round(y - half));
  ctx.lineTo(Math.round(x + headW), Math.round(y - half + headH));
  ctx.lineTo(Math.round(x + shaftW), Math.round(y - half + headH));
  // Shaft
  ctx.lineTo(Math.round(x + shaftW), Math.round(y + half));
  ctx.lineTo(Math.round(x - shaftW), Math.round(y + half));
  ctx.lineTo(Math.round(x - shaftW), Math.round(y - half + headH));
  // Arrow head other side
  ctx.lineTo(Math.round(x - headW), Math.round(y - half + headH));
  ctx.closePath();
  ctx.fill();
}

/**
 * Draw a right-pointing arrow.
 */
export function drawArrowRight(ctx, cx, cy, size) {
  const half = size / 2;
  const headH = size * 0.45;
  const shaftH = size * 0.15;
  const headW = size * 0.4;
  const x = Math.round(cx);
  const y = Math.round(cy);
  ctx.beginPath();
  // Arrow head
  ctx.moveTo(Math.round(x + half), y);
  ctx.lineTo(Math.round(x + half - headW), Math.round(y - headH));
  ctx.lineTo(Math.round(x + half - headW), Math.round(y - shaftH));
  // Shaft
  ctx.lineTo(Math.round(x - half), Math.round(y - shaftH));
  ctx.lineTo(Math.round(x - half), Math.round(y + shaftH));
  ctx.lineTo(Math.round(x + half - headW), Math.round(y + shaftH));
  // Arrow head other side
  ctx.lineTo(Math.round(x + half - headW), Math.round(y + headH));
  ctx.closePath();
  ctx.fill();
}

/**
 * Draw a regular hexagon.
 */
export function drawHexagon(ctx, cx, cy, size) {
  drawRegularPolygon(ctx, cx, cy, size, 6, 0);
}

/**
 * Draw a heart shape.
 */
export function drawHeart(ctx, cx, cy, size) {
  const x = Math.round(cx);
  const y = Math.round(cy);
  const s = size / 2;
  ctx.beginPath();
  ctx.moveTo(x, Math.round(y + s * 0.7));
  // Left curve
  ctx.bezierCurveTo(
    Math.round(x - s), Math.round(y + s * 0.2),
    Math.round(x - s), Math.round(y - s * 0.5),
    Math.round(x), Math.round(y - s * 0.3),
  );
  // Right curve
  ctx.bezierCurveTo(
    Math.round(x + s), Math.round(y - s * 0.5),
    Math.round(x + s), Math.round(y + s * 0.2),
    Math.round(x), Math.round(y + s * 0.7),
  );
  ctx.closePath();
  ctx.fill();
}

/**
 * Helper: draw a regular polygon centered at (cx, cy).
 */
function drawRegularPolygon(ctx, cx, cy, size, sides, startAngle) {
  const r = size / 2;
  const x = Math.round(cx);
  const y = Math.round(cy);
  const step = (Math.PI * 2) / sides;
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const angle = startAngle + i * step;
    const px = Math.round(x + r * Math.cos(angle));
    const py = Math.round(y + r * Math.sin(angle));
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

/**
 * Shape registry — maps shape IDs to draw functions.
 * Used by stimulus renderer to draw shapes by name.
 */
export const SHAPES = {
  circle: drawCircle,
  square: drawSquare,
  triangle: drawTriangle,
  plus: drawPlus,
  x: drawX,
  diamond: drawDiamond,
  pentagon: drawPentagon,
  star5: drawStar5,
  star4: drawStar4,
  arrowUp: drawArrowUp,
  arrowRight: drawArrowRight,
  hexagon: drawHexagon,
  heart: drawHeart,
};

/**
 * All shape IDs in order.
 */
export const SHAPE_IDS = Object.keys(SHAPES);
