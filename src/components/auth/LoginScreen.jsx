/**
 * Login Screen
 *
 * Username + password authentication UI matching the
 * khush+enrique branch flow. Username is converted to
 * a synthetic email for Supabase auth internally.
 *
 * @module components/auth/LoginScreen
 */

import { useState } from 'react';
import { signInWithEmail, signUpWithEmail } from '../../services/supabaseClient.js';
import { useTranslation } from '../../i18n/index.jsx';

/** Convert username to synthetic email for Supabase auth. */
function toEmail(username) {
  return `${username.toLowerCase().trim()}@cognify.app`;
}

export function LoginScreen() {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  function clearForm() {
    setError(null);
    setUsername('');
    setPassword('');
    setConfirmPassword('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError(t('auth.error.fillAll') || 'Please fill in all fields.');
      return;
    }

    if (isSignUp) {
      if (username.trim().length < 3) {
        setError(t('auth.error.usernameLength') || 'Username must be at least 3 characters.');
        return;
      }
      if (password.length < 6) {
        setError(t('auth.error.passwordLength') || 'Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError(t('auth.error.passwordMismatch') || 'Passwords do not match.');
        return;
      }
    }

    setLoading(true);
    setError(null);

    const email = toEmail(username);
    const result = isSignUp
      ? await signUpWithEmail(email, password)
      : await signInWithEmail(email, password);

    setLoading(false);

    if (result.error) {
      // Friendlier error messages
      const msg = result.error.message;
      if (msg.includes('Invalid login')) {
        setError(t('auth.error.incorrectPassword') || 'Incorrect username or password.');
      } else if (msg.includes('User already registered')) {
        setError(t('auth.error.usernameTaken') || 'That username is already taken.');
      } else {
        setError(msg);
      }
      return;
    }

    // Success: AuthContext's onAuthStateChange listener takes over
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleSubmit(e);
  }

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

        {/* Toggle tabs */}
        <div className="w-full flex bg-surface-container rounded-xl p-1 gap-1 mb-6">
          <button
            type="button"
            onClick={() => { setIsSignUp(false); clearForm(); }}
            className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all duration-200
                        ${!isSignUp
                          ? 'bg-primary text-on-primary shadow-sm'
                          : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                        }`}
          >
            {t('auth.signIn')}
          </button>
          <button
            type="button"
            onClick={() => { setIsSignUp(true); clearForm(); }}
            className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all duration-200
                        ${isSignUp
                          ? 'bg-primary text-on-primary shadow-sm'
                          : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                        }`}
          >
            {t('auth.createAccount')}
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="w-full bg-error-container/30 border border-error/20 rounded-xl p-4 mb-6 flex items-start gap-3">
            <span className="material-symbols-outlined text-error text-xl flex-shrink-0 mt-0.5">error</span>
            <p className="text-on-surface text-sm">{error}</p>
          </div>
        )}

        {/* Username + Password form */}
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div>
            <label className="block text-on-surface text-sm font-bold mb-2 pl-1">
              {t('auth.username') || 'Username'}
            </label>
            <input
              type="text"
              placeholder={isSignUp
                ? (t('auth.placeholder.username.signup') || 'Choose a username')
                : (t('auth.placeholder.username.login') || 'Your username')}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={handleKeyDown}
              required
              autoFocus
              autoComplete="username"
              className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl p-4
                         font-body text-lg text-on-surface placeholder:text-on-surface-variant/50
                         focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
            />
          </div>

          <div>
            <label className="block text-on-surface text-sm font-bold mb-2 pl-1">
              {t('auth.password') || 'Password'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder={isSignUp
                  ? (t('auth.placeholder.password.signup') || 'Create a password')
                  : (t('auth.placeholder.password.login') || 'Your password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                required
                minLength={6}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl p-4 pr-16
                           font-body text-lg text-on-surface placeholder:text-on-surface-variant/50
                           focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-primary font-bold text-sm
                           px-2 py-1 rounded hover:bg-primary/10 transition-colors"
              >
                {showPassword ? (t('auth.hide') || 'Hide') : (t('auth.show') || 'Show')}
              </button>
            </div>
          </div>

          {/* Confirm password (signup only) */}
          {isSignUp && (
            <div>
              <label className="block text-on-surface text-sm font-bold mb-2 pl-1">
                {t('auth.confirmPassword') || 'Confirm Password'}
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder={t('auth.placeholder.confirmPassword') || 'Re-enter your password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                required
                minLength={6}
                autoComplete="new-password"
                className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl p-4
                           font-body text-lg text-on-surface placeholder:text-on-surface-variant/50
                           focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-on-primary py-4 rounded-xl font-bold text-lg
                       active:scale-95 transition-transform duration-200 shadow-md
                       disabled:opacity-50"
          >
            {loading
              ? (isSignUp ? t('auth.creatingAccount') : t('auth.signingIn'))
              : (isSignUp ? t('auth.createAccount') : t('auth.signIn'))}
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
