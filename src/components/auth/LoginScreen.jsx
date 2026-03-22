/**
 * Login Screen
 *
 * Email + password authentication UI with password
 * strength validation on signup.
 *
 * @module components/auth/LoginScreen
 */

import { useState } from 'react';
import { signInWithEmail, signUpWithEmail } from '../../services/supabaseClient.js';

function validatePassword(pw) {
  if (pw.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(pw)) return 'Password must include an uppercase letter';
  if (!/[a-z]/.test(pw)) return 'Password must include a lowercase letter';
  if (!/[0-9]/.test(pw)) return 'Password must include a number';
  return null;
}

function getPasswordStrength(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { label: 'Weak', color: 'bg-error', percent: 20 };
  if (score <= 3) return { label: 'Fair', color: 'bg-warning', percent: 60 };
  return { label: 'Strong', color: 'bg-primary', percent: 100 };
}

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !password) return;

    // Client-side password validation for signup
    if (isSignUp) {
      const pwError = validatePassword(password);
      if (pwError) { setError(pwError); return; }
    }

    setLoading(true);
    setError(null);

    const result = isSignUp
      ? await signUpWithEmail(email.trim(), password)
      : await signInWithEmail(email.trim(), password);

    setLoading(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    // Defensive: check that a session was actually created
    if (!result.data?.session) {
      setError(
        isSignUp
          ? 'Account created. Please check your email to confirm, then sign in.'
          : 'Sign-in failed. Please check your credentials and try again.'
      );
    }
    // Success: AuthContext's onAuthStateChange listener takes over
  }

  const strength = getPasswordStrength(password);

  return (
    <div className="fixed inset-0 flex justify-center bg-surface-dim">
      <div className="relative w-full max-w-[480px] bg-background flex flex-col items-center justify-center px-8 py-12 overflow-y-auto">
        {/* Logo & Branding */}
        <div className="flex flex-col items-center gap-3 mb-10">
          <span
            className="material-symbols-outlined text-primary"
            style={{ fontSize: '72px', fontVariationSettings: "'FILL' 1" }}
          >
            neurology
          </span>
          <h1 className="font-headline text-4xl font-extrabold text-on-background tracking-tight">Cognify</h1>
          <p className="font-body text-on-surface-variant text-center text-lg max-w-[280px]">
            Adaptive speed-of-processing training for a sharper mind.
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="w-full bg-error-container/30 border border-error/20 rounded-xl p-4 mb-6 flex items-start gap-3">
            <span className="material-symbols-outlined text-error text-xl flex-shrink-0 mt-0.5">error</span>
            <p className="text-on-surface text-sm">{error}</p>
          </div>
        )}

        {/* Email + Password form */}
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl p-4
                       font-body text-lg text-on-surface placeholder:text-on-surface-variant/50
                       focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          />
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl p-4
                         font-body text-lg text-on-surface placeholder:text-on-surface-variant/50
                         focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
            />

            {/* Password strength indicator (signup only) */}
            {isSignUp && password.length > 0 && (
              <div className="mt-3 space-y-2 px-1">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                      style={{ width: `${strength.percent}%` }}
                    />
                  </div>
                  <span className="text-xs text-on-surface-variant font-bold w-12 text-right">{strength.label}</span>
                </div>
                <ul className="text-xs text-on-surface-variant space-y-0.5">
                  <li className={password.length >= 8 ? 'text-primary' : ''}>
                    {password.length >= 8 ? '\u2713' : '\u25CB'} At least 8 characters
                  </li>
                  <li className={/[A-Z]/.test(password) ? 'text-primary' : ''}>
                    {/[A-Z]/.test(password) ? '\u2713' : '\u25CB'} Uppercase letter
                  </li>
                  <li className={/[a-z]/.test(password) ? 'text-primary' : ''}>
                    {/[a-z]/.test(password) ? '\u2713' : '\u25CB'} Lowercase letter
                  </li>
                  <li className={/[0-9]/.test(password) ? 'text-primary' : ''}>
                    {/[0-9]/.test(password) ? '\u2713' : '\u25CB'} Number
                  </li>
                </ul>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-on-primary py-4 rounded-xl font-bold text-lg
                       active:scale-95 transition-transform duration-200 shadow-md
                       disabled:opacity-50"
          >
            {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
          <button
            type="button"
            onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
            className="w-full text-center text-primary font-bold py-2"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </form>

        {/* Footer */}
        <p className="text-on-surface-variant/60 text-sm text-center mt-10">
          Your training data syncs securely across devices.
        </p>
      </div>
    </div>
  );
}
