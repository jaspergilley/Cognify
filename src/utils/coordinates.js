/**
 * Coordinate System Module
 *
 * Converts between normalized [0,1] coordinates and integer canvas pixels.
 * All stimulus positions are stored as normalized values and converted to
 * canvas pixels at draw time.
 *
 * CANV-04: Percentage-based coordinate system
 * CANV-08: Integer rounding in toCanvasPixels
 *
 * @module utils/coordinates
 */

/**
 * Converts normalized [0,1] coordinates to integer canvas pixel coordinates.
 * Clamps input values to [0,1] range to prevent out-of-bounds drawing.
 * Uses Math.round() to ensure integer pixel values (no sub-pixel anti-aliasing).
 *
 * @param {number} normalizedX - X position as fraction of canvas width [0,1]
 * @param {number} normalizedY - Y position as fraction of canvas height [0,1]
 * @param {number} canvasWidth - Canvas width in CSS pixels
 * @param {number} canvasHeight - Canvas height in CSS pixels
 * @returns {{ x: number, y: number }} Integer pixel coordinates
 */
export function toCanvasPixels(normalizedX, normalizedY, canvasWidth, canvasHeight) {
  // Clamp normalized values to [0,1] range
  const clampedX = Math.max(0, Math.min(1, normalizedX));
  const clampedY = Math.max(0, Math.min(1, normalizedY));

  return {
    x: Math.round(clampedX * canvasWidth),
    y: Math.round(clampedY * canvasHeight),
  };
}

/**
 * Converts canvas pixel coordinates to normalized [0,1] values.
 * Clamps output values to [0,1] range.
 *
 * @param {number} pixelX - X position in canvas pixels
 * @param {number} pixelY - Y position in canvas pixels
 * @param {number} canvasWidth - Canvas width in CSS pixels
 * @param {number} canvasHeight - Canvas height in CSS pixels
 * @returns {{ x: number, y: number }} Normalized coordinates in [0,1] range
 */
export function toNormalized(pixelX, pixelY, canvasWidth, canvasHeight) {
  return {
    x: Math.max(0, Math.min(1, pixelX / canvasWidth)),
    y: Math.max(0, Math.min(1, pixelY / canvasHeight)),
  };
}
