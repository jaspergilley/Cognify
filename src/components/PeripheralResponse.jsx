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

/** Peripheral distance as percentage of half-container (matches PERIPHERAL_DISTANCE = 0.75) */
const DISTANCE_PCT = 37.5; // 0.75 * 50%

const BUTTON_SIZE = 48;

/**
 * @param {object} props
 * @param {function} props.onChoose - Callback with position index (0-7)
 */
export function PeripheralResponse({ onChoose }) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Prompt text */}
      <div className="absolute top-[20%] left-0 right-0 text-center">
        <span className="text-white/40 text-base font-light">
          Where was the triangle?
        </span>
      </div>

      {/* 8 position buttons */}
      {PERIPHERAL_POSITIONS.map((angle, i) => {
        const x = 50 + DISTANCE_PCT * Math.cos(angle);
        const y = 50 + DISTANCE_PCT * Math.sin(angle);

        return (
          <button
            key={i}
            onClick={() => onChoose(i)}
            className="absolute pointer-events-auto flex items-center justify-center
                       rounded-full bg-white/10 hover:bg-white/30 active:bg-white/40
                       border border-white/20 hover:border-white/50
                       transition-colors cursor-pointer"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              transform: 'translate(-50%, -50%)',
              width: BUTTON_SIZE,
              height: BUTTON_SIZE,
            }}
          >
            <div className="w-3 h-3 bg-white/60 rounded-full" />
          </button>
        );
      })}
    </div>
  );
}
