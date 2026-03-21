/**
 * ResponseButtons Component
 *
 * Shows two shape-choice buttons during the RESPONSE phase of a trial.
 * EXRC-01: User identifies which of 2 target objects was briefly shown.
 * EXRC-02: Response buttons show actual shapes.
 * TRAL-02: Only rendered during RESPONSE phase (parent controls visibility).
 *
 * @module components/ResponseButtons
 */

import { useRef, useEffect } from 'react';
import { SHAPES } from '../engine/shapePaths.js';

const ICON_SIZE = 64;

/**
 * Renders a shape on a small canvas for use inside a button.
 */
function ShapeIcon({ shapeId }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(ICON_SIZE * dpr);
    canvas.height = Math.round(ICON_SIZE * dpr);
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, ICON_SIZE, ICON_SIZE);
    ctx.fillStyle = '#ffffff';
    const drawFn = SHAPES[shapeId];
    if (drawFn) drawFn(ctx, ICON_SIZE / 2, ICON_SIZE / 2, ICON_SIZE * 0.35);
  }, [shapeId]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: ICON_SIZE, height: ICON_SIZE, pointerEvents: 'none' }}
    />
  );
}

/**
 * @param {object} props
 * @param {string[]} props.choices - Two shape IDs in display order
 * @param {function} props.onChoose - Callback with chosen shape ID
 */
export function ResponseButtons({ choices, onChoose }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="flex gap-8 pointer-events-auto" style={{ marginTop: '30%' }}>
        {choices.map((shapeId) => (
          <button
            key={shapeId}
            onClick={() => onChoose(shapeId)}
            className="flex flex-col items-center gap-2 px-6 py-4 rounded-xl
                       bg-white/10 hover:bg-white/20 active:bg-white/30
                       border border-white/20 hover:border-white/40
                       transition-colors cursor-pointer"
            style={{ minWidth: 96, minHeight: 96 }}
          >
            <ShapeIcon shapeId={shapeId} />
            <span className="text-white/60 text-xs font-light">{shapeId}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
