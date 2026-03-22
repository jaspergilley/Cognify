/**
 * useCanvasEngine Hook
 *
 * Custom React hook wiring all engine modules to the React lifecycle.
 * Manages frame loop, DPI scaling, resize handling, refresh rate detection,
 * and visibility pause/resume.
 *
 * CRITICAL: No React useState for frame-loop data. All mutable engine state
 * lives in useRef or plain variables. Only useState for calibrating and
 * isBelowMinimum (rare re-renders).
 *
 * @module hooks/useCanvasEngine
 */

import { useRef, useState, useEffect, useCallback } from 'react';
import { createFrameLoop } from '../engine/frameLoop.js';
import { setupCanvasDPI, calculateAspectRatio } from '../engine/canvasScaler.js';
import { detectRefreshRate } from '../engine/refreshRateDetector.js';
import { createVisibilityManager } from '../engine/visibilityManager.js';
import { clearCanvas } from '../engine/stimulusRenderer.js';

/**
 * Wires all engine modules to a canvas element via React lifecycle.
 *
 * @param {React.RefObject<HTMLCanvasElement>} canvasRef - Ref to the canvas element
 * @returns {{ calibrating: boolean, engineData: React.RefObject, isBelowMinimum: boolean }}
 */
export function useCanvasEngine(canvasRef) {
  const [calibrating, setCalibrating] = useState(true);
  const [isBelowMinimum, setIsBelowMinimum] = useState(false);

  // Mutable engine data ref -- updated every frame, never triggers re-render
  const engineData = useRef({
    hz: 0,
    frameDurationMs: 0,
    frameCount: 0,
    droppedFrames: 0,
    dpr: window.devicePixelRatio || 1,
    canvasWidth: 0,
    canvasHeight: 0,
    fps: 0,
  });

  // Rolling FPS tracker -- stores last 60 deltas
  const fpsDeltas = useRef([]);

  // External render callback — when set, replaces demo rendering
  const renderRef = useRef(null);

  // Refs for cleanup
  const frameLoopRef = useRef(null);
  const resizeObserverRef = useRef(null);
  const visibilityCleanupRef = useRef(null);
  const ctxRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;
    ctxRef.current = ctx;

    let mounted = true;

    async function initEngine() {
      // Step 1: Detect refresh rate
      const { hz, frameDurationMs } = await detectRefreshRate();

      if (!mounted) return;

      // Store detection results
      engineData.current.hz = hz;
      engineData.current.frameDurationMs = frameDurationMs;
      setCalibrating(false);

      // Step 2: Set up initial canvas dimensions
      const container = canvas.parentElement;
      if (container) {
        const rect = container.getBoundingClientRect();
        applyDimensions(canvas, ctx, rect.width, rect.height);
      }

      // Step 3: Create frame loop
      const frameLoop = createFrameLoop(onFrame, frameDurationMs);
      frameLoopRef.current = frameLoop;

      // Step 4: Set up ResizeObserver on canvas parent
      const observer = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;
        const { width, height } = entry.contentRect;
        applyDimensions(canvas, ctx, width, height);
      });

      if (container) {
        observer.observe(container);
      }
      resizeObserverRef.current = observer;

      // Step 5: Create visibility manager
      const cleanupVisibility = createVisibilityManager(frameLoop);
      visibilityCleanupRef.current = cleanupVisibility;

      // Step 6: Start the frame loop
      frameLoop.start();
    }

    /**
     * Apply calculated dimensions to canvas and re-apply DPI scaling.
     * CANV-05: Resize recalculates and re-applies DPI without restarting the frame loop.
     */
    function applyDimensions(canvas, ctx, containerWidth, containerHeight) {
      // Mobile native optimization: use full container dimensions instead of constrained 4:3
      const width = containerWidth;
      const height = containerHeight;
      const belowMin = false; // Warnings permanently disabled

      // Apply CSS dimensions
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      // Re-apply DPI scaling
      const dims = setupCanvasDPI(canvas, ctx);

      // Update engine data
      engineData.current.dpr = dims.dpr;
      engineData.current.canvasWidth = Math.round(width);
      engineData.current.canvasHeight = Math.round(height);

      // Update isBelowMinimum state (rare, won't thrash re-renders)
      setIsBelowMinimum(belowMin);
    }

    /**
     * Frame callback -- runs every rAF tick.
     * Clears canvas, renders stimulus demo, updates engine data ref.
     */
    function onFrame({ frameCount, delta, timestamp, isDropped }) {
      const canvas = canvasRef.current;
      const ctx = ctxRef.current;
      if (!canvas || !ctx) return;

      const w = engineData.current.canvasWidth;
      const h = engineData.current.canvasHeight;
      const hz = engineData.current.hz || 60;

      // Clear canvas with cream background
      clearCanvas(ctx, w, h);

      // Delegate to external render callback if set (training mode)
      if (renderRef.current) {
        renderRef.current(ctx, w, h, hz);
      }
      // When idle, clearCanvas already filled the cream background — no demo rendering

      // Track FPS via rolling deltas
      const deltas = fpsDeltas.current;
      deltas.push(delta);
      if (deltas.length > 60) {
        deltas.shift();
      }
      const avgDelta = deltas.reduce((sum, d) => sum + d, 0) / deltas.length;
      const fps = avgDelta > 0 ? Math.round(1000 / avgDelta) : 0;

      // Update engine data ref (no re-render)
      const data = engineData.current;
      data.frameCount = frameCount;
      data.fps = fps;

      // Get dropped frames from frame loop
      if (frameLoopRef.current) {
        data.droppedFrames = frameLoopRef.current.getDroppedFrames();
      }
    }

    initEngine();

    // Cleanup
    return () => {
      mounted = false;

      if (frameLoopRef.current) {
        frameLoopRef.current.stop();
        frameLoopRef.current = null;
      }
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      if (visibilityCleanupRef.current) {
        visibilityCleanupRef.current();
        visibilityCleanupRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { calibrating, engineData, isBelowMinimum, renderRef };
}
