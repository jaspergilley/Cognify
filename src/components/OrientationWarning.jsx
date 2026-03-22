/**
 * OrientationWarning Component
 *
 * Mobile portrait mode rotate-device overlay.
 * CSS-driven: only shows on portrait orientation with small screen width.
 * Full-viewport overlay that blocks interaction until device is rotated.
 *
 * @module components/OrientationWarning
 */

/**
 * Orientation warning overlay for mobile portrait mode.
 * Uses CSS media queries to show/hide -- no JavaScript orientation detection needed.
 *
 * @returns {JSX.Element}
 */
export function OrientationWarning() {
  // Disabled to allow mobile portrait play
  return null;

  return (
    <div className="orientation-warning fixed inset-0 z-[100] bg-surface flex flex-col items-center justify-center gap-6">
      {/* Rotate device icon */}
      <svg
        width="64"
        height="64"
        viewBox="0 0 64 64"
        fill="none"
        className="text-charcoal/70"
        aria-hidden="true"
      >
        {/* Phone outline in portrait */}
        <rect
          x="18"
          y="8"
          width="28"
          height="48"
          rx="4"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
        {/* Home button indicator */}
        <circle cx="32" cy="50" r="2" fill="currentColor" />
        {/* Rotation arrow */}
        <path
          d="M52 32 C52 18 42 10 32 10"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M35 7 L32 10 L35 13"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <p className="text-charcoal/70 text-sm font-medium tracking-wider text-center px-8">
        Please rotate your device to landscape
      </p>
    </div>
  );
}
