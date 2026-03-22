/**
 * Settings View — Full settings page with tangible functionality
 * @module components/dashboard/SettingsView
 */

import { useState, useRef, useCallback } from 'react';
import { loadSettings, saveSettings, clearAllData, clearUserDataOnSignOut } from '../../services/dataService.js';
import { setAudioEnabled, setVolume } from '../../engine/audioFeedback.js';
import { deleteAccount } from '../../services/supabaseClient.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useTranslation } from '../../i18n/index.jsx';

/**
 * Reusable toggle switch component (48px touch target).
 */
function Toggle({ checked, onChange, label }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative w-14 h-12 rounded-full transition-colors duration-200 flex-shrink-0 cursor-pointer
                  ${checked ? 'bg-primary' : 'bg-surface-container-highest'}`}
    >
      <span
        className={`absolute top-[10px] w-6 h-6 rounded-full bg-white shadow-md
                    transition-transform duration-200
                    ${checked ? 'translate-x-7' : 'translate-x-1'}`}
      />
    </button>
  );
}

/**
 * @param {object} props
 * @param {function} props.onBack - Navigate back to dashboard
 * @param {function} props.onOpenExport - Navigate to session export sub-view
 * @param {function} props.onResetComplete - Called after data reset
 */
export function SettingsView({ onBack, onOpenExport, onResetComplete, showHeader = true }) {
  const { user, signOut } = useAuth();
  const { t } = useTranslation();
  const initial = loadSettings();
  const [audioOn, setAudioOn] = useState(initial.audioEnabled);
  const [volume, setVolumeState] = useState(initial.volume);
  const [darkMode, setDarkMode] = useState(initial.darkMode);
  const [sessionLength, setSessionLength] = useState(initial.sessionLength);
  const [difficultyLock, setDifficultyLock] = useState(initial.difficultyLock);
  const [showAbout, setShowAbout] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Debounce volume save to avoid excessive localStorage writes during drag
  const volumeSaveTimer = useRef(null);

  function handleAudioToggle() {
    const newVal = !audioOn;
    setAudioOn(newVal);
    setAudioEnabled(newVal);
    saveSettings({ audioEnabled: newVal });
  }

  const handleVolumeChange = useCallback((e) => {
    const val = parseInt(e.target.value, 10);
    setVolumeState(val);
    setVolume(val); // Immediate audio update
    // Debounce localStorage write
    clearTimeout(volumeSaveTimer.current);
    volumeSaveTimer.current = setTimeout(() => {
      saveSettings({ volume: val });
    }, 300);
  }, []);

  function handleDarkModeToggle() {
    const newVal = !darkMode;
    setDarkMode(newVal);
    document.documentElement.classList.toggle('dark', newVal);
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      'content', newVal ? '#1a1c1a' : '#faf6f0',
    );
    saveSettings({ darkMode: newVal });
  }

  function handleSessionLength(len) {
    setSessionLength(len);
    saveSettings({ sessionLength: len });
  }

  function handleDifficultyLock() {
    const newVal = !difficultyLock;
    setDifficultyLock(newVal);
    saveSettings({ difficultyLock: newVal });
  }

  function handleReset() {
    clearAllData();
    document.documentElement.classList.remove('dark');
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#faf6f0');
    setShowResetConfirm(false);
    onResetComplete();
  }

  async function handleDeleteAccount() {
    setDeletingAccount(true);
    setDeleteError(null);
    try {
      await deleteAccount();
      clearUserDataOnSignOut();
      await signOut();
    } catch (err) {
      setDeleteError(err?.message || 'Failed to delete account. Please try again.');
      setDeletingAccount(false);
    }
  }

  return (
    <main className={`px-6 w-full space-y-6 stagger-in pb-8 ${showHeader ? 'pt-6' : 'pt-2'}`}>
      {/* Header — hidden when accessed via bottom nav tab */}
      {showHeader && (
        <div className="flex items-center gap-4 -mx-2">
          <button
            onClick={onBack}
            className="p-2 rounded-full hover:bg-primary/5 transition-colors active:scale-95"
            aria-label="Go back"
          >
            <span className="material-symbols-outlined text-primary text-2xl">arrow_back</span>
          </button>
          <h1 className="font-headline font-bold text-xl text-primary">{t('settings.title')}</h1>
        </div>
      )}

      {/* ── Account ── */}
      {user && (
        <section className="space-y-3">
          <h2 className="font-headline font-bold text-lg text-on-surface pl-1">{t('settings.account')}</h2>
          <div className="bg-surface-container-low rounded-xl border border-outline-variant/20 p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-container/20 rounded-full flex items-center justify-center flex-shrink-0">
                {user.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-primary text-2xl">person</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-on-surface truncate">
                  {user.user_metadata?.full_name || user.user_metadata?.name || 'User'}
                </p>
                <p className="text-on-surface-variant text-sm truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="w-full mt-4 py-3 rounded-xl border border-outline-variant/30
                         text-on-surface-variant font-bold
                         active:scale-95 transition-transform duration-200"
            >
              {t('settings.signOut')}
            </button>
          </div>
        </section>
      )}

      {/* ── Audio ── */}
      <section className="space-y-3">
        <h2 className="font-headline font-bold text-lg text-on-surface pl-1">Audio</h2>
        <div className="bg-surface-container-low rounded-xl border border-outline-variant/20 divide-y divide-outline-variant/10">
          {/* Sound toggle */}
          <div className="flex items-center justify-between p-5 gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <span className="material-symbols-outlined text-primary text-2xl flex-shrink-0">
                {audioOn ? 'volume_up' : 'volume_off'}
              </span>
              <div className="min-w-0">
                <p className="font-bold text-on-surface">Sound Effects</p>
                <p className="text-on-surface-variant text-sm">Play sounds during training</p>
              </div>
            </div>
            <Toggle checked={audioOn} onChange={handleAudioToggle} label="Toggle sound effects" />
          </div>
          {/* Volume slider */}
          <div className={`p-5 transition-opacity duration-200 ${!audioOn ? 'opacity-40 pointer-events-none' : ''}`}>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-on-surface-variant text-xl">volume_down</span>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={handleVolumeChange}
                disabled={!audioOn}
                className="flex-1 cursor-pointer"
                aria-label="Volume"
              />
              <span className="material-symbols-outlined text-on-surface-variant text-xl">volume_up</span>
              <span className="text-on-surface font-bold text-sm w-10 text-right tabular-nums">{volume}%</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Display ── */}
      <section className="space-y-3">
        <h2 className="font-headline font-bold text-lg text-on-surface pl-1">Display</h2>
        <div className="bg-surface-container-low rounded-xl border border-outline-variant/20">
          <div className="flex items-center justify-between p-5 gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <span className="material-symbols-outlined text-primary text-2xl flex-shrink-0">
                {darkMode ? 'dark_mode' : 'light_mode'}
              </span>
              <div className="min-w-0">
                <p className="font-bold text-on-surface">Dark Mode</p>
                <p className="text-on-surface-variant text-sm">Easier on the eyes at night</p>
              </div>
            </div>
            <Toggle checked={darkMode} onChange={handleDarkModeToggle} label="Toggle dark mode" />
          </div>
        </div>
      </section>

      {/* ── Training ── */}
      <section className="space-y-3">
        <h2 className="font-headline font-bold text-lg text-on-surface pl-1">{t('settings.training')}</h2>
        <div className="bg-surface-container-low rounded-xl border border-outline-variant/20 divide-y divide-outline-variant/10">
          {/* Session length */}
          <div className="p-5 space-y-3">
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-primary text-2xl">timer</span>
              <div>
                <p className="font-bold text-on-surface">{t('training.sessionLength')}</p>
                <p className="text-on-surface-variant text-sm">Adjusts trials and blocks per exercise</p>
              </div>
            </div>
            <div className="flex bg-surface-container rounded-xl p-1 gap-1">
              {[5, 10, 15].map((len) => (
                <button
                  key={len}
                  onClick={() => handleSessionLength(len)}
                  className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all duration-200
                              ${sessionLength === len
                                ? 'bg-primary text-on-primary shadow-sm'
                                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                              }`}
                >
                  {len} min
                </button>
              ))}
            </div>
          </div>
          {/* Difficulty lock */}
          <div className="flex items-center justify-between p-5 gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <span className="material-symbols-outlined text-primary text-2xl flex-shrink-0">lock</span>
              <div className="min-w-0">
                <p className="font-bold text-on-surface">Lock Difficulty</p>
                <p className="text-on-surface-variant text-sm">Prevent automatic level changes</p>
              </div>
            </div>
            <Toggle checked={difficultyLock} onChange={handleDifficultyLock} label="Toggle difficulty lock" />
          </div>
        </div>
      </section>

      {/* ── Data & Privacy ── */}
      <section className="space-y-3">
        <h2 className="font-headline font-bold text-lg text-on-surface pl-1">{t('settings.privacyData')}</h2>
        <div className="bg-surface-container-low rounded-xl border border-outline-variant/20 divide-y divide-outline-variant/10 overflow-hidden">
          {/* Export */}
          <button
            onClick={onOpenExport}
            className="w-full flex items-center justify-between p-5 text-left
                       hover:bg-surface-container-high transition-colors active:scale-[0.99]"
          >
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-primary text-2xl">download</span>
              <p className="font-bold text-on-surface">Export Session Data</p>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
          </button>
          {/* About */}
          <button
            onClick={() => setShowAbout(true)}
            className="w-full flex items-center justify-between p-5 text-left
                       hover:bg-surface-container-high transition-colors active:scale-[0.99]"
          >
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-primary text-2xl">info</span>
              <p className="font-bold text-on-surface">About Cognify</p>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
          </button>
          {/* Privacy */}
          <button
            onClick={() => setShowPrivacy(true)}
            className="w-full flex items-center justify-between p-5 text-left
                       hover:bg-surface-container-high transition-colors active:scale-[0.99]"
          >
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-primary text-2xl">shield</span>
              <p className="font-bold text-on-surface">{t('privacy.title')}</p>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
          </button>
        </div>
      </section>

      {/* ── Danger Zone ── */}
      <section>
        <div className="bg-error-container/20 rounded-xl border border-error/10 overflow-hidden divide-y divide-error/10">
          <button
            onClick={() => setShowResetConfirm(true)}
            className="w-full flex items-center gap-4 p-5 text-left
                       hover:bg-error-container/30 transition-colors active:scale-[0.99]"
          >
            <span className="material-symbols-outlined text-error text-2xl">delete_forever</span>
            <div>
              <p className="font-bold text-error">Reset All Data</p>
              <p className="text-on-surface-variant text-sm">Erase all data and start fresh</p>
            </div>
          </button>
          <button
            onClick={() => { setShowDeleteConfirm(true); setDeleteConfirmText(''); setDeleteError(null); }}
            className="w-full flex items-center gap-4 p-5 text-left
                       hover:bg-error-container/30 transition-colors active:scale-[0.99]"
          >
            <span className="material-symbols-outlined text-error text-2xl">person_remove</span>
            <div>
              <p className="font-bold text-error">Delete Account</p>
              <p className="text-on-surface-variant text-sm">Permanently delete your account and all data</p>
            </div>
          </button>
        </div>
      </section>

      {/* Version footer */}
      <div className="text-center py-4">
        <p className="text-on-surface-variant text-sm">Cognify v0.3.0</p>
        <p className="text-on-surface-variant/60 text-xs mt-1">Crafted for mindful aging</p>
      </div>

      {/* ── About Modal ── */}
      {showAbout && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-inverse-surface/60 px-6">
          <div className="flex flex-col items-center gap-5 bg-surface-container-lowest rounded-2xl px-8 py-10 shadow-xl animate-scale-in max-w-sm w-full">
            <span
              className="material-symbols-outlined text-primary"
              style={{ fontSize: '56px', fontVariationSettings: "'FILL' 1" }}
            >neurology</span>
            <h3 className="font-headline text-2xl font-bold text-on-surface">Cognify</h3>
            <p className="text-on-surface-variant text-center leading-relaxed">
              Adaptive visual speed-of-processing training based on the NIH ACTIVE study protocol.
              Train your brain to process information faster with scientifically-validated exercises.
            </p>
            <p className="text-on-surface-variant text-sm">Version 0.3.0</p>
            <button
              onClick={() => setShowAbout(false)}
              className="w-full py-4 rounded-xl bg-primary text-on-primary font-bold text-lg
                         active:scale-95 transition-transform duration-200"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ── Privacy Policy Modal ── */}
      {showPrivacy && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-inverse-surface/60 px-6">
          <div className="flex flex-col gap-5 bg-surface-container-lowest rounded-2xl px-8 py-10 shadow-xl animate-scale-in max-w-sm w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-primary text-3xl">shield</span>
              <h3 className="font-headline text-2xl font-bold text-on-surface">{t('privacy.title')}</h3>
            </div>
            <div className="text-on-surface-variant leading-relaxed space-y-4">
              <p>
                <strong className="text-on-surface">Your data syncs securely.</strong> Cognify stores training data
                locally on your device and syncs it to the cloud when you're signed in, so you can
                access your progress from any device.
              </p>
              <p>
                <strong className="text-on-surface">Secure authentication.</strong> We use industry-standard
                authentication via Supabase. Your data is protected by row-level security policies.
              </p>
              <p>
                <strong className="text-on-surface">No tracking or analytics.</strong> Cognify does not use
                cookies, analytics services, or third-party trackers.
              </p>
              <p>
                <strong className="text-on-surface">Data export.</strong> You can export your full training
                history at any time via Settings &gt; Export Session Data.
              </p>
              <p>
                <strong className="text-on-surface">Data deletion.</strong> Use the Reset All Data option in
                Settings to permanently delete all stored data.
              </p>
            </div>
            <button
              onClick={() => setShowPrivacy(false)}
              className="w-full py-4 rounded-xl bg-primary text-on-primary font-bold text-lg
                         active:scale-95 transition-transform duration-200"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ── Reset Confirmation Modal ── */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-inverse-surface/60 px-6">
          <div className="flex flex-col items-center gap-6 bg-surface-container-lowest rounded-2xl px-8 py-10 shadow-xl animate-scale-in max-w-sm w-full">
            <span className="material-symbols-outlined text-error" style={{ fontSize: '48px' }}>warning</span>
            <h3 className="font-headline text-2xl font-bold text-on-surface text-center">Reset All Data?</h3>
            <p className="text-on-surface-variant text-center leading-relaxed">
              This will permanently delete all your training history, goals, and settings. This cannot be undone.
            </p>
            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="w-full py-4 rounded-xl bg-primary text-on-primary font-bold text-lg
                           active:scale-95 transition-transform duration-200"
              >
                {t('nav.cancel')}
              </button>
              <button
                onClick={handleReset}
                className="w-full py-4 rounded-xl bg-error text-on-error font-bold text-lg
                           active:scale-95 transition-transform duration-200"
              >
                Delete Everything
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Account Confirmation Modal ── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-inverse-surface/60 px-6">
          <div className="flex flex-col items-center gap-5 bg-surface-container-lowest rounded-2xl px-8 py-10 shadow-xl animate-scale-in max-w-sm w-full">
            <span className="material-symbols-outlined text-error" style={{ fontSize: '48px' }}>person_remove</span>
            <h3 className="font-headline text-2xl font-bold text-on-surface text-center">Delete Account?</h3>
            <p className="text-on-surface-variant text-center leading-relaxed">
              This will permanently delete your account, all training data, and sign you out. This cannot be undone.
            </p>
            <p className="text-on-surface text-sm font-bold text-center">
              Type <span className="text-error">DELETE</span> to confirm:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl p-3
                         font-body text-center text-lg text-on-surface placeholder:text-on-surface-variant/30
                         focus:ring-2 focus:ring-error focus:border-error transition-colors"
            />
            {deleteError && (
              <p className="text-error text-sm text-center">{deleteError}</p>
            )}
            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deletingAccount}
                className="w-full py-4 rounded-xl bg-primary text-on-primary font-bold text-lg
                           active:scale-95 transition-transform duration-200 disabled:opacity-50"
              >
                {t('nav.cancel')}
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || deletingAccount}
                className="w-full py-4 rounded-xl bg-error text-on-error font-bold text-lg
                           active:scale-95 transition-transform duration-200 disabled:opacity-50"
              >
                {deletingAccount ? 'Deleting...' : 'Delete My Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
