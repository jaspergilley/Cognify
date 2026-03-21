/**
 * DebugPanel Component
 *
 * Developer debug overlay showing timing and rendering metrics.
 * Toggled by Ctrl+Shift+D (or Cmd+Shift+D on Mac).
 * Reads from engineData ref at ~10fps to avoid unnecessary re-renders.
 *
 * @module components/DebugPanel
 */

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Debug overlay displaying engine metrics.
 *
 * @param {object} props
 * @param {React.RefObject} props.engineData - Ref to mutable engine data object
 * @returns {JSX.Element|null}
 */
export function DebugPanel({ engineData }) {
  const [visible, setVisible] = useState(false);
  const [displayData, setDisplayData] = useState(null);
  const rafIdRef = useRef(null);
  const lastUpdateRef = useRef(0);

  // Toggle with Ctrl+Shift+D / Cmd+Shift+D
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setVisible((prev) => !prev);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Read engineData ref at ~10fps when visible
  useEffect(() => {
    if (!visible || !engineData) {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      return;
    }

    function readLoop(timestamp) {
      // Throttle to ~10fps (100ms intervals)
      if (timestamp - lastUpdateRef.current >= 100) {
        lastUpdateRef.current = timestamp;
        const data = engineData.current;
        if (data) {
          setDisplayData({
            hz: data.hz,
            frameDurationMs: data.frameDurationMs,
            fps: data.fps,
            frameCount: data.frameCount,
            droppedFrames: data.droppedFrames,
            dpr: data.dpr,
            canvasWidth: data.canvasWidth,
            canvasHeight: data.canvasHeight,
          });
        }
      }
      rafIdRef.current = requestAnimationFrame(readLoop);
    }

    rafIdRef.current = requestAnimationFrame(readLoop);

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [visible, engineData]);

  if (!visible || !displayData) return null;

  const backingWidth = Math.round(displayData.canvasWidth * displayData.dpr);
  const backingHeight = Math.round(displayData.canvasHeight * displayData.dpr);

  return (
    <div className="fixed top-2 right-2 z-50 bg-black/70 text-green-400 font-mono text-xs p-3 rounded-md min-w-48 select-none pointer-events-none">
      <div className="mb-1 text-green-300 font-bold text-[10px] uppercase tracking-wider">
        Debug
      </div>
      <div className="space-y-0.5">
        <Row label="Refresh Rate" value={`${displayData.hz} Hz`} />
        <Row label="Frame Duration" value={`${displayData.frameDurationMs.toFixed(2)} ms`} />
        <Row label="FPS" value={displayData.fps} />
        <Row label="Frame Count" value={displayData.frameCount} />
        <Row label="Dropped Frames" value={displayData.droppedFrames} />
        <Row label="DPR" value={displayData.dpr} />
        <Row
          label="Canvas"
          value={`${displayData.canvasWidth}x${displayData.canvasHeight} / ${backingWidth}x${backingHeight}`}
        />
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-green-400/60">{label}</span>
      <span>{value}</span>
    </div>
  );
}
