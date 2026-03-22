/**
 * Auth Gate
 *
 * Conditionally renders the app or the login screen
 * based on authentication state. Shows non-blocking
 * hydration/error banners during cloud sync.
 *
 * @module components/AuthGate
 */

import { useAuth } from '../contexts/AuthContext.jsx';
import { LoginScreen } from './auth/LoginScreen.jsx';

export function AuthGate({ children }) {
  const { user, loading, hydrating, hydrationError, clearHydrationError, retryHydration } = useAuth();

  if (loading) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center gap-4">
        <span
          className="material-symbols-outlined text-primary animate-pulse"
          style={{ fontSize: '64px', fontVariationSettings: "'FILL' 1" }}
        >
          neurology
        </span>
        <p className="text-on-surface-variant font-body text-lg">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <>
      {children}

      {/* Non-blocking sync banner */}
      {hydrating && (
        <div className="fixed top-0 left-0 right-0 z-[60] flex justify-center pointer-events-none">
          <div className="bg-primary-container text-on-primary-container px-4 py-2
                          rounded-b-xl text-sm font-body flex items-center gap-2 shadow-md
                          pointer-events-auto">
            <span className="material-symbols-outlined text-base animate-spin">sync</span>
            Syncing your data...
          </div>
        </div>
      )}

      {/* Hydration error banner */}
      {hydrationError && !hydrating && (
        <div className="fixed top-0 left-0 right-0 z-[60] flex justify-center">
          <div className="bg-error-container text-on-error-container px-4 py-2
                          rounded-b-xl text-sm font-body flex items-center gap-2 shadow-md">
            <span className="material-symbols-outlined text-base">cloud_off</span>
            {hydrationError}
            <button
              onClick={retryHydration}
              className="underline font-bold ml-1"
            >
              Retry
            </button>
            <button onClick={clearHydrationError} className="ml-1">
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
