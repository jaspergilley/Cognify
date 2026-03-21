/**
 * CanvasRenderer Component
 *
 * React component owning the canvas element with full engine integration.
 * Renders a container div (flex, centered, full-height) with the canvas inside.
 * Container maintains 4:3 aspect ratio and fills available space.
 *
 * CANV-03: 4:3 aspect ratio via container CSS + JS resize calculation
 *
 * @module components/CanvasRenderer
 */

import { useRef } from 'react';
import { useCanvasEngine } from '../hooks/useCanvasEngine.js';

/**
 * Canvas rendering component with full engine integration.
 * Passes engineData and state to child overlays via props.
 *
 * @param {object} props
 * @param {React.ReactNode} [props.children] - Overlay components to render over the canvas
 * @param {function} [props.onEngineReady] - Callback receiving engineData ref when engine initializes
 * @returns {JSX.Element}
 */
export function CanvasRenderer({ children, onEngineReady }) {
  const canvasRef = useRef(null);
  const { calibrating, engineData, isBelowMinimum, renderRef } = useCanvasEngine(canvasRef);

  return (
    <div className="relative flex items-center justify-center w-full h-full">
      {/* Canvas container -- maintains 4:3 ratio, fills available space */}
      <div
        className="relative flex items-center justify-center"
        style={{ aspectRatio: '4 / 3', maxWidth: '100%', maxHeight: '100%' }}
      >
        <canvas
          ref={canvasRef}
          className="block"
          style={{
            touchAction: 'none',
            WebkitTouchCallout: 'none',
            WebkitUserSelect: 'none',
            userSelect: 'none',
          }}
        />

        {/* Calibration overlay */}
        {calibrating && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a2e]">
            <span className="text-white/30 text-sm font-light tracking-wider">
              Calibrating display...
            </span>
          </div>
        )}
      </div>

      {/* Overlay components receive engine state via render props pattern */}
      {typeof children === 'function'
        ? children({ engineData, calibrating, isBelowMinimum, renderRef })
        : children}
    </div>
  );
}
