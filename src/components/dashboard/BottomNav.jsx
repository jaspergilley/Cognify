/**
 * Bottom Navigation Bar for Dashboard
 * @module components/dashboard/BottomNav
 */

export function BottomNav({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'progress', label: 'Progress', icon: 'insights' },
    { id: 'science', label: 'Science', icon: 'psychology' },
  ];

  return (
    <nav className="absolute bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 h-24
                     bg-background border-t border-primary/10
                     shadow-[0_-4px_20px_rgba(46,50,48,0.08)] rounded-t-[24px] bottom-nav">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            aria-current={isActive ? 'page' : undefined}
            className={`flex flex-col items-center justify-center px-6 py-2
                        touch-manipulation active:scale-90 transition-all duration-300
                        ${isActive
                          ? 'text-primary bg-primary/10 rounded-2xl'
                          : 'text-on-surface-variant hover:text-primary'
                        }`}
          >
            <span
              className="material-symbols-outlined"
              style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {tab.icon}
            </span>
            <span className="font-label text-sm font-bold tracking-wide">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
