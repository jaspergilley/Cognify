/**
 * Auth Context
 *
 * Provides authentication state to the entire app.
 * Handles session restoration, auth state changes,
 * and coordinates cloud sync on login.
 *
 * @module contexts/AuthContext
 */

import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../services/supabaseClient.js';
import { setAuthenticatedUser, clearUserDataOnSignOut, hydrateFromCloud } from '../services/dataService.js';
import { syncQueue } from '../services/syncService.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hydrating, setHydrating] = useState(false);
  const [hydrationError, setHydrationError] = useState(null);

  // Prevent double-hydration when getSession + onAuthStateChange both fire SIGNED_IN
  const lastHydratedUserId = useRef(null);

  /** Run sync queue flush + cloud hydration with UI state tracking. */
  const performHydration = useCallback(async () => {
    setHydrating(true);
    setHydrationError(null);
    try {
      await syncQueue.flush();
      const result = await hydrateFromCloud();
      if (!result.success && result.reason === 'error') {
        setHydrationError('Could not sync your data. Using local data for now.');
      }
    } catch {
      setHydrationError('Could not sync your data. Using local data for now.');
    } finally {
      setHydrating(false);
    }
  }, []);

  /** Full sign-out: clear data + reset state. */
  const handleSignOut = useCallback(() => {
    clearUserDataOnSignOut();
    lastHydratedUserId.current = null;
    setUser(null);
    setHydrating(false);
    setHydrationError(null);
  }, []);

  /** Trigger sign-out via Supabase (fires SIGNED_OUT event). */
  const triggerSignOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.warn('Sign out error:', error);
      // Force local sign-out even if Supabase call fails
      handleSignOut();
    }
    // Otherwise the onAuthStateChange SIGNED_OUT event calls handleSignOut
  }, [handleSignOut]);

  useEffect(() => {
    // Check for existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        setAuthenticatedUser(u.id);
        lastHydratedUserId.current = u.id;
        performHydration();
      }
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const u = session?.user ?? null;

        switch (event) {
          case 'SIGNED_IN': {
            setUser(u);
            // Only hydrate if this is a new user (prevents double-hydration on page load)
            if (u && u.id !== lastHydratedUserId.current) {
              setAuthenticatedUser(u.id);
              lastHydratedUserId.current = u.id;
              await performHydration();
            }
            break;
          }

          case 'SIGNED_OUT':
            handleSignOut();
            break;

          case 'TOKEN_REFRESHED':
            // Just update the user object, no re-hydration needed
            setUser(u);
            break;

          case 'USER_UPDATED':
            // User metadata changed (e.g., password update)
            setUser(u);
            break;

          default:
            // PASSWORD_RECOVERY and other events — no action needed
            break;
        }
      },
    );

    return () => subscription.unsubscribe();
  }, [performHydration, handleSignOut]);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      hydrating,
      hydrationError,
      clearHydrationError: () => setHydrationError(null),
      retryHydration: performHydration,
      signOut: triggerSignOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
