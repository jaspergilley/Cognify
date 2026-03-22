/**
 * PeripheralResponse Component
 *
 * Shows 8 position buttons arranged in an elliptical pattern matching
 * the peripheral target positions on the canvas.
 *
 * EXRC-05: "Where was the triangle?" with 8 position markers.
 *
 * @module components/PeripheralResponse
 */

import { PERIPHERAL_POSITIONS } from '../engine/stimulusRenderer.js';

/** Peripheral distance as percentage of half-container, scaled by eccentricity */
function getDistancePct(eccentricity = 0.75) {
  const base = typeof window !== 'undefined' && window.innerWidth < 600 ? 0.8 : 1.0;
  return eccentricity * 50 * base;
}

/** Clock labels for ARIA accessibility */
const CLOCK_LABELS = [
  '12 o\'clock', '1:30', '3 o\'clock', '4:30',
  '6 o\'clock', '7:30', '9 o\'clock', '10:30',
];

/**
 * @param {object} props
 * @param {function} props.onChoose - Callback with position index (0-7)
 */
export function PeripheralResponse({ onChoose, eccentricity = 0.75 }) {
  return (
    <div className="absolute inset-0 pointer-events-none animate-in">
      {/* Header prompt — offset below persistent session header */}
      <div className="absolute top-[16%] sm:top-[14%] left-0 right-0 text-center z-10 px-4">
        <h2 className="font-headline text-3xl font-bold text-on-surface mb-2">Where was the triangle?</h2>
        <p className="text-on-surface-variant font-medium">Select the location on the peripheral ring</p>
      </div>

      {/* Center focus point */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full
                      border-2 border-dashed border-outline-variant flex items-center justify-center bg-surface-container z-10">
        <span className="material-symbols-outlined text-outline">adjust</span>
      </div>

      {/* 8 position buttons */}
      {PERIPHERAL_POSITIONS.map((angle, i) => {
        const dist = getDistancePct(eccentricity);
        const x = 50 + dist * Math.cos(angle);
        const y = 50 + dist * Math.sin(angle);

        return (
          <button
            key={i}
            onClick={() => onChoose(i)}
            aria-label={`Position ${i + 1}, ${CLOCK_LABELS[i]}`}
            className="absolute pointer-events-auto w-20 h-20 rounded-full
                       bg-surface-container-high border-2 border-transparent
                       hover:border-primary active:scale-95
                       shadow-sm flex items-center justify-center
                       transition-all duration-200 cursor-pointer group"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center
                            group-hover:bg-primary-container transition-colors">
              <span className="material-symbols-outlined text-primary">location_on</span>
            </div>
          </button>
        );
      })}

      {/* Footer status */}
      <div className="absolute bottom-[8%] sm:bottom-[14%] left-0 right-0 px-8 safe-bottom">
        <div className="max-w-sm mx-auto flex justify-between items-center text-sm font-label uppercase tracking-widest text-secondary">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span>Active Trial</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">speed</span>
            <span>Response Required</span>
          </div>
        </div>
      </div>
    </div>
  );
}
