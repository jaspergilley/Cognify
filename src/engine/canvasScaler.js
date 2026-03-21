/**
 * Canvas Scaler Module
 *
 * DPI-aware canvas scaling and aspect ratio calculation.
 * Pure JS -- no React dependencies.
 *
 * CANV-01: DPI scaling via devicePixelRatio
 * CANV-08: All dimensions Math.round() to integers
 *
 * @module engine/canvasScaler
 */

/**
 * Sets up DPI-aware canvas rendering.
 *
 * Reads the device pixel ratio, scales the canvas backing store to physical pixels,
 * and applies ctx.scale so that drawing operations use CSS pixel coordinates.
 * All dimensions are Math.round()'d to integers to prevent sub-pixel anti-aliasing.
 *
 * @param {HTMLCanvasElement} canvas - The canvas element to scale
 * @param {CanvasRenderingContext2D} ctx - The 2D rendering context
 * @returns {{ width: number, height: number, dpr: number }} CSS dimensions and device pixel ratio
 */
export function setupCanvasDPI(canvas, ctx) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  // Set backing store size to physical pixels (integer values)
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);

  // Scale context so drawing uses CSS pixel coordinates
  ctx.scale(dpr, dpr);

  return {
    width: rect.width,
    height: rect.height,
    dpr,
  };
}

/**
 * Calculates the largest rectangle with the target aspect ratio that fits
 * within the given container dimensions, enforcing minimum size constraints.
 *
 * @param {number} containerWidth - Available container width in CSS pixels
 * @param {number} containerHeight - Available container height in CSS pixels
 * @param {number} [targetRatio=4/3] - Target aspect ratio (width/height)
 * @param {number} [minWidth=600] - Minimum canvas width in CSS pixels
 * @param {number} [minHeight=450] - Minimum canvas height in CSS pixels
 * @returns {{ width: number, height: number, isBelowMinimum: boolean }}
 */
export function calculateAspectRatio(
  containerWidth,
  containerHeight,
  targetRatio = 4 / 3,
  minWidth = 600,
  minHeight = 450,
) {
  let width;
  let height;

  if (containerWidth / containerHeight > targetRatio) {
    // Container is wider than target ratio -- height-constrained
    height = containerHeight;
    width = Math.round(containerHeight * targetRatio);
  } else {
    // Container is taller than target ratio -- width-constrained
    width = containerWidth;
    height = Math.round(containerWidth / targetRatio);
  }

  // Check if container can fit minimum dimensions
  const isBelowMinimum = width < minWidth || height < minHeight;

  // Enforce minimum dimensions
  width = Math.round(Math.max(width, minWidth));
  height = Math.round(Math.max(height, minHeight));

  return { width, height, isBelowMinimum };
}
