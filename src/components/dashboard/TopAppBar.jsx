/**
 * Top App Bar for Dashboard
 * @module components/dashboard/TopAppBar
 */

export function TopAppBar({ devUnlock, onOpenSettings, onOpenWhatsNew }) {
  return (
    <header className="absolute top-0 left-0 w-full z-50 flex justify-between items-center px-6 h-20 safe-top safe-inset
                        bg-background border-b border-primary/10
                        shadow-[0_4px_20px_rgba(46,50,48,0.06)]">
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-full hover:bg-primary/5 transition-colors active:scale-95 duration-200"
          aria-label="Settings"
        >
          <span className="material-symbols-outlined text-primary text-2xl">menu</span>
        </button>
        <h1 className="font-headline text-2xl font-bold tracking-tight text-primary">CogSpeed</h1>
        {devUnlock && (
          <span className="text-tertiary text-xs px-2 py-0.5 rounded border border-tertiary/30 bg-tertiary-fixed/30 font-bold">DEV</span>
        )}
      </div>
      <button
        onClick={onOpenWhatsNew}
        className="p-2 rounded-full hover:bg-primary/5 transition-colors active:scale-95 duration-200"
        aria-label="Help & Updates"
      >
        <span className="material-symbols-outlined text-primary text-2xl">help</span>
      </button>
    </header>
  );
}
