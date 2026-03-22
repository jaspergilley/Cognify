/**
 * Frame Loop Module
 *
 * rAF-based frame loop with frame counting, delta timing, and dropped frame detection.
 * Pure JS -- no React, no DOM dependencies beyond requestAnimationFrame.
 *
 * @module engine/frameLoop
 */

/**
 * Creates a frame monitor that tracks dropped frames.
 *
 * @param {number} expectedFrameMs - Expected frame duration in milliseconds
 * @returns {object} Frame monitor with recordFrame, getDroppedCount, getLog, and reset methods
 */
function createFrameMonitor(expectedFrameMs) {
  let droppedCount = 0;
  const log = [];

  return {
    /**
     * Record a frame's delta and check if it was dropped.
     * A frame is considered dropped if delta exceeds 1.5x the expected duration.
     *
     * @param {number} delta - Actual frame duration in milliseconds
     * @returns {boolean} Whether the frame was dropped
     */
    recordFrame(delta) {
      const threshold = expectedFrameMs * 1.5;
      if (delta > threshold) {
        droppedCount++;
        log.push({
          timestamp: performance.now(),
          expected: expectedFrameMs,
          actual: delta,
          missedFrames: Math.round(delta / expectedFrameMs) - 1,
        });
        return true;
      }
      return false;
    },

    /** @returns {number} Total count of dropped frames */
    getDroppedCount() {
      return droppedCount;
    },

    /** @returns {Array} Copy of the dropped frame log */
    getLog() {
      return [...log];
    },

    /** Reset dropped frame count and log */
    reset() {
      droppedCount = 0;
      log.length = 0;
    },
  };
}

/**
 * Creates a requestAnimationFrame-based frame loop.
 *
 * The loop increments a frame counter exactly once per rAF callback, tracks delta
 * timing using the rAF-provided timestamp, and detects dropped frames when delta
 * exceeds 1.5x the expected frame duration.
 *
 * CANV-02: rAF-only, no setTimeout/setInterval
 * CANV-09: Delta timing via timestamp comparison, dropped frame detection at 1.5x threshold
 *
 * @param {function} onFrame - Callback receiving { frameCount, delta, timestamp, isDropped }
 * @param {number} expectedFrameMs - Expected frame duration in ms (e.g., 16.667 for 60Hz)
 * @returns {object} Frame loop controller
 */
export function createFrameLoop(onFrame, expectedFrameMs) {
  let frameCount = 0;
  let lastTime = 0;
  let rafId = null;
  let running = false;

  const monitor = createFrameMonitor(expectedFrameMs);

  /**
   * The rAF tick function. Uses the timestamp provided by requestAnimationFrame
   * (not performance.now()) for delta calculation.
   *
   * @param {DOMHighResTimeStamp} timestamp - High-resolution timestamp from rAF
   */
  function tick(timestamp) {
    if (!running) return;

    const delta = lastTime ? timestamp - lastTime : expectedFrameMs;
    lastTime = timestamp;
    frameCount++;

    const isDropped = monitor.recordFrame(delta);

    onFrame({ frameCount, delta, timestamp, isDropped });

    rafId = requestAnimationFrame(tick);
  }

  return {
    /** Start the frame loop. Requests the first animation frame. */
    start() {
      if (running) return;
      running = true;
      rafId = requestAnimationFrame(tick);
    },

    /** Stop the frame loop. Cancels any pending animation frame. */
    stop() {
      running = false;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    },

    /** @returns {boolean} Whether the loop is currently running */
    isRunning() {
      return running;
    },

    /** @returns {number} Total frames rendered since last reset */
    getFrameCount() {
      return frameCount;
    },

    /** @returns {number} Total dropped frames since last reset */
    getDroppedFrames() {
      return monitor.getDroppedCount();
    },

    /** @returns {Array} Log of dropped frame events */
    getDroppedLog() {
      return monitor.getLog();
    },

    /**
     * Reset timing state so the next frame computes a normal delta.
     * Used after visibility resume to prevent a large delta jump.
     */
    resetTiming() {
      lastTime = 0;
    },

    /** Reset all state: frame count, dropped frames, and timing. */
    reset() {
      frameCount = 0;
      lastTime = 0;
      monitor.reset();
    },
  };
}
