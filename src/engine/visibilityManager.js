/**
 * Visibility Manager Module
 *
 * Listens for tab visibility changes and pauses/resumes the frame loop accordingly.
 * Prevents timing jumps when the user switches tabs and returns.
 *
 * CANV-07: Pause on tab hidden, resume cleanly on visible
 *
 * @module engine/visibilityManager
 */

/**
 * Creates a visibility manager that pauses the frame loop when the tab is hidden
 * and resumes it cleanly when the tab becomes visible again.
 *
 * On hidden: records whether the frame loop was running, then stops it.
 * On visible: if the loop was running before, resets timing (to prevent delta jump)
 * and restarts the loop.
 *
 * @param {object} frameLoop - A frame loop instance from createFrameLoop
 * @param {function} frameLoop.isRunning - Returns whether the loop is running
 * @param {function} frameLoop.stop - Stops the frame loop
 * @param {function} frameLoop.start - Starts the frame loop
 * @param {function} frameLoop.resetTiming - Resets lastTime so next frame has normal delta
 * @returns {function} Cleanup function that removes the event listener
 */
export function createVisibilityManager(frameLoop) {
  let wasRunning = false;

  function handleVisibilityChange() {
    if (document.hidden) {
      wasRunning = frameLoop.isRunning();
      frameLoop.stop();
    } else if (wasRunning) {
      // Reset timing to avoid a large delta jump on the first frame back
      frameLoop.resetTiming();
      frameLoop.start();
    }
  }

  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Return cleanup function
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}
