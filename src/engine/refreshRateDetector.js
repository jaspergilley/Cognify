/**
 * Refresh Rate Detector Module
 *
 * Measures the display's actual refresh rate by collecting rAF timestamp intervals
 * and computing the median. Falls back to 60Hz if variance is too high.
 *
 * CANV-06: Refresh rate detection at startup
 *
 * @module engine/refreshRateDetector
 */

/**
 * Detects the display's refresh rate by measuring requestAnimationFrame intervals.
 *
 * Collects `sampleCount` rAF timestamp intervals, discards the first `warmupFrames`
 * to avoid page-load jitter, sorts the remaining intervals, and takes the median.
 * If the coefficient of variation exceeds 0.2 (indicating an unreliable measurement,
 * e.g., on VRR displays), falls back to 60Hz with a `fallback: true` flag.
 *
 * @param {number} [sampleCount=120] - Total rAF frames to measure
 * @param {number} [warmupFrames=20] - Initial frames to discard (page load jitter)
 * @returns {Promise<{ hz: number, frameDurationMs: number, fallback?: boolean }>}
 */
export function detectRefreshRate(sampleCount = 120, warmupFrames = 20) {
  return new Promise((resolve) => {
    const intervals = [];
    let lastTimestamp = null;
    let count = 0;

    function measure(timestamp) {
      if (lastTimestamp !== null) {
        intervals.push(timestamp - lastTimestamp);
      }
      lastTimestamp = timestamp;
      count++;

      if (count < sampleCount) {
        requestAnimationFrame(measure);
      } else {
        // Discard warmup frames (page load jitter)
        const validIntervals = intervals.slice(warmupFrames);

        if (validIntervals.length === 0) {
          resolve({ hz: 60, frameDurationMs: 16.667, fallback: true });
          return;
        }

        // Sort and take median (rejects outliers like GC pauses)
        validIntervals.sort((a, b) => a - b);
        const median = validIntervals[Math.floor(validIntervals.length / 2)];

        // Calculate coefficient of variation to detect unreliable measurements
        const mean =
          validIntervals.reduce((sum, v) => sum + v, 0) / validIntervals.length;
        const variance =
          validIntervals.reduce((sum, v) => sum + (v - mean) ** 2, 0) /
          validIntervals.length;
        const stdDev = Math.sqrt(variance);
        const cv = stdDev / mean;

        if (cv > 0.2) {
          // High variance -- unreliable measurement, fall back to 60Hz
          resolve({ hz: 60, frameDurationMs: 16.667, fallback: true });
          return;
        }

        const hz = Math.round(1000 / median);
        resolve({ hz, frameDurationMs: median });
      }
    }

    requestAnimationFrame(measure);
  });
}
