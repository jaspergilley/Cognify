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
export function CanvasRenderer({ children }) {
  const canvasRef = useRef(null);
  const { calibrating, engineData, isBelowMinimum, renderRef } = useCanvasEngine(canvasRef);

  return (
    <div className="relative flex items-center justify-center w-full h-full flex-1">
      {/* Canvas container -- fills available space */}
      <div
        className="relative flex items-center justify-center w-full h-full"
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
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background gap-6">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full border-2 border-outline-variant/30" />
              <div className="absolute inset-0 rounded-full border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin" style={{ animationDuration: '1.2s' }} />
              <div className="absolute inset-3 rounded-full border-2 border-t-transparent border-r-primary/40 border-b-transparent border-l-transparent animate-spin" style={{ animationDuration: '1.8s', animationDirection: 'reverse' }} />
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className="text-on-surface-variant text-base font-headline font-medium tracking-wider">
                Detecting your display
              </span>
              <span className="text-on-surface-variant text-sm font-medium">
                Measuring refresh rate...
              </span>
            </div>
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
