/**
 * ResponseButtons Component
 *
 * Shows shape-choice buttons during the RESPONSE phase of a trial.
 * EXRC-01: User identifies which of 2 target objects was briefly shown.
 * EXRC-02: Response buttons show actual shapes.
 * TRAL-02: Only rendered during RESPONSE phase (parent controls visibility).
 *
 * Phase 2C: Keyboard shortcuts 1/2 for left/right shape.
 *
 * @module components/ResponseButtons
 */

import { useRef, useEffect, useState } from 'react';
import { SHAPES } from '../engine/shapePaths.js';

const ICON_SIZE = 100;

/** Human-readable shape names for senior-friendly labels */
const SHAPE_NAMES = {
  circle: 'Circle',
  diamond: 'Diamond',
  triangle: 'Triangle',
  square: 'Square',
  hexagon: 'Hexagon',
  pentagon: 'Pentagon',
  star5: 'Star',
  plus: 'Plus',
  arrowUp: 'Arrow',
  arrowRight: 'Arrow',
  cross: 'Cross',
  heart: 'Heart',
  star4: 'Star',
  x: 'Cross',
};

/**
 * Renders a shape on a small canvas for use inside a button.
 */
function ShapeIcon({ shapeId, color = '#4a7c59' }) {
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
    ctx.fillStyle = color;
    const drawFn = SHAPES[shapeId];
    if (drawFn) drawFn(ctx, ICON_SIZE / 2, ICON_SIZE / 2, ICON_SIZE * 0.38);
  }, [shapeId, color]);

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
 * @param {boolean} [props.disabled] - Block input (e.g., abort dialog open)
 */
export function ResponseButtons({ choices, onChoose, disabled }) {
  const [chosen, setChosen] = useState(null);

  function handleChoose(shapeId) {
    if (disabled || chosen) return;
    setChosen(shapeId);
    // Brief highlight before forwarding the choice
    setTimeout(() => onChoose(shapeId), 80);
  }

  // Keyboard shortcuts: 1 = left, 2 = right (2C)
  useEffect(() => {
    function onKeyDown(e) {
      if (disabled || chosen) return;
      if (e.key === '1' && choices[0]) handleChoose(choices[0]);
      if (e.key === '2' && choices[1]) handleChoose(choices[1]);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [choices, disabled, chosen]);

  return (
    <div className="absolute inset-0 flex flex-col bg-background overflow-hidden safe-inset">
      {/* Decorative distractor background shapes */}
      <div className="absolute inset-0 pointer-events-none opacity-5">
        <span className="material-symbols-outlined absolute top-1/4 left-1/4 scale-[5]">circle</span>
        <span className="material-symbols-outlined absolute top-1/3 right-1/4 scale-[4]">change_history</span>
        <span className="material-symbols-outlined absolute bottom-1/4 left-1/3 scale-[6]">square</span>
        <span className="material-symbols-outlined absolute top-10 right-10 scale-[3]">circle</span>
        <span className="material-symbols-outlined absolute bottom-20 right-20 scale-[5]">square</span>
      </div>

      {/* Main content — centered, pt-20 clears persistent header + progress bar */}
      <main className="flex-grow flex flex-col items-center justify-center px-6 pt-24 pb-8 safe-bottom">
        <div className="w-full max-w-2xl text-center z-10 animate-in">
          {/* Header */}
          <div className="mb-12">
            <h2 className="font-headline text-3xl text-on-surface mb-2">Shape Response</h2>
            <p className="font-body text-lg text-on-surface-variant opacity-80">Identify the target shape that appeared</p>
          </div>

          {/* Shape Buttons — stacked vertical cards (2 shapes, not 3) */}
          <div className="grid grid-cols-1 gap-6 max-w-md mx-auto">
            {choices.map((shapeId) => {
              const isChosen = chosen === shapeId;
              return (
                <button
                  key={shapeId}
                  onClick={() => handleChoose(shapeId)}
                  aria-label={`Select ${SHAPE_NAMES[shapeId] || shapeId}`}
                  className={`flex flex-col items-center justify-center p-8 rounded-xl
                             border-2 transition-all duration-150 cursor-pointer relative overflow-hidden group
                             ${isChosen
                               ? 'bg-primary-container/15 border-primary shadow-[0_0_30px_rgba(74,124,89,0.25)] scale-[1.02]'
                               : 'bg-surface border-primary-container shadow-[0_4px_20px_rgba(46,50,48,0.06)] hover:bg-primary-container/10 active:scale-95'
                             }`}
                >
                  {isChosen && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent -translate-x-full animate-[shimmer_1s_infinite]" />}
                  <div className="relative z-10 mb-4 group-hover:scale-110 transition-transform">
                    <ShapeIcon shapeId={shapeId} color="#4a7c59" />
                  </div>
                  <span className="font-label font-bold text-lg text-primary tracking-wide relative z-10">
                    {SHAPE_NAMES[shapeId] || shapeId}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
