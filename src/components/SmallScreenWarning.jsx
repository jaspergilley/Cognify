/**
 * SmallScreenWarning Component
 *
 * Dismissable warning for screens below minimum size (600x450).
 * Non-intrusive banner at the bottom of the viewport.
 * Does NOT hard-block -- user can dismiss and continue.
 *
 * @module components/SmallScreenWarning
 */

import { useState } from 'react';

/**
 * Warning banner shown when screen is below recommended minimum size.
 *
 * @param {object} props
 * @param {boolean} props.isBelowMinimum - Whether current viewport is below 600x450
 * @returns {JSX.Element|null}
 */
export function SmallScreenWarning({ isBelowMinimum }) {
  const [dismissed, setDismissed] = useState(false);

  if (!isBelowMinimum || dismissed) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-amber-900/80 backdrop-blur-sm px-4 py-3 flex items-center justify-between gap-3">
      <p className="text-amber-100/90 text-xs font-light">
        Your screen is smaller than the recommended minimum (600x450). Display quality may be affected.
      </p>
      <button
        onClick={() => setDismissed(true)}
        className="text-amber-100/70 hover:text-amber-100 text-xs whitespace-nowrap px-3 py-1 border border-amber-100/30 rounded hover:border-amber-100/50 transition-colors"
      >
        Continue anyway
      </button>
    </div>
  );
}
