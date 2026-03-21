/**
 * FullscreenToggle Component
 *
 * Small, subtle button in the bottom-right corner for entering/exiting
 * browser fullscreen mode. Semi-transparent, appears on hover.
 * Uses the Fullscreen API with try-catch for browser policy denial.
 *
 * @module components/FullscreenToggle
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * Fullscreen toggle button.
 *
 * @returns {JSX.Element}
 */
export function FullscreenToggle() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Track fullscreen state changes
  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch((err) => {
          console.warn('Fullscreen request denied:', err.message);
        });
      } else {
        document.exitFullscreen().catch((err) => {
          console.warn('Exit fullscreen failed:', err.message);
        });
      }
    } catch (err) {
      console.warn('Fullscreen API not available:', err.message);
    }
  }, []);

  return (
    <button
      onClick={toggleFullscreen}
      className="fixed bottom-3 right-3 z-40 p-2 rounded bg-white/5 hover:bg-white/15 text-white/30 hover:text-white/70 transition-all duration-200 opacity-30 hover:opacity-100"
      title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
      aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
    >
      {isFullscreen ? (
        // Collapse icon (exit fullscreen)
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 1 6 6 1 6" />
          <polyline points="10 15 10 10 15 10" />
          <polyline points="15 6 10 6 10 1" />
          <polyline points="1 10 6 10 6 15" />
        </svg>
      ) : (
        // Expand icon (enter fullscreen)
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="1 6 1 1 6 1" />
          <polyline points="15 10 15 15 10 15" />
          <polyline points="10 1 15 1 15 6" />
          <polyline points="6 15 1 15 1 10" />
        </svg>
      )}
    </button>
  );
}
