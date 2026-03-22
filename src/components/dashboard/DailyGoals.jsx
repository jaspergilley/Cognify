/**
 * Daily Goals Setup — Set daily training target and reminder
 * @module components/dashboard/DailyGoals
 */

import { useState } from 'react';
import { loadGoals, saveGoals } from '../../services/dataService.js';

const GOAL_OPTIONS = [
  { minutes: 10, label: 'Light', icon: 'energy_savings_leaf', color: 'tertiary' },
  { minutes: 20, label: 'Recommended', icon: 'psychology', color: 'primary', recommended: true },
  { minutes: 30, label: 'Intense', icon: 'bolt', color: 'secondary' },
];

export function DailyGoals({ onBack }) {
  const existing = loadGoals();
  const [selectedMinutes, setSelectedMinutes] = useState(existing.dailyTargetMinutes);
  const [reminderTime, setReminderTime] = useState(existing.reminderTime || '09:00');
  const [saved, setSaved] = useState(false);

  function handleSave() {
    saveGoals({ dailyTargetMinutes: selectedMinutes, reminderTime });
    setSaved(true);
    setTimeout(() => onBack(), 600);
  }

  return (
    <main className="pt-6 px-6 w-full space-y-8 stagger-in pb-8">
      {/* Header with back button */}
      <div className="flex items-center gap-4 -mx-2">
        <button
          onClick={onBack}
          className="p-2 rounded-full hover:bg-primary/5 transition-colors active:scale-95"
          aria-label="Go back"
        >
          <span className="material-symbols-outlined text-primary text-2xl">arrow_back</span>
        </button>
        <h1 className="font-headline font-bold text-xl text-primary">Daily Goals</h1>
      </div>

      {/* Section Title & Intro */}
      <section className="space-y-2">
        <h2 className="font-headline font-bold text-3xl text-on-background leading-tight">Set Your Daily Target</h2>
        <p className="font-body text-on-surface-variant text-lg leading-relaxed">
          Consistency is key for brain health. Choose a pace that feels right for you today.
        </p>
      </section>

      {/* Goal Selection Cards */}
      <section className="grid grid-cols-1 gap-4">
        {GOAL_OPTIONS.map((option) => {
          const isSelected = selectedMinutes === option.minutes;

          if (isSelected) {
            return (
              <button
                key={option.minutes}
                onClick={() => setSelectedMinutes(option.minutes)}
                className="group relative flex items-center justify-between p-6 bg-primary text-on-primary
                           rounded-xl shadow-[0_4px_20px_rgba(74,124,89,0.2)] transition-all text-left
                           active:scale-95 duration-150 ring-4 ring-primary/10"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-label text-sm font-bold text-primary-fixed uppercase tracking-wider">{option.label}</span>
                    {option.recommended && (
                      <span className="material-symbols-outlined text-sm text-primary-fixed" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    )}
                  </div>
                  <h3 className="font-headline text-2xl font-bold">{option.minutes} Minutes</h3>
                </div>
                <div className="w-12 h-12 rounded-full bg-on-primary/20 flex items-center justify-center text-on-primary">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{option.icon}</span>
                </div>
              </button>
            );
          }

          return (
            <button
              key={option.minutes}
              onClick={() => setSelectedMinutes(option.minutes)}
              className="group relative flex items-center justify-between p-6 bg-surface-container
                         rounded-xl border border-transparent hover:border-primary/20
                         transition-all text-left active:scale-95 duration-150"
            >
              <div className="space-y-1">
                <span className={`font-label text-sm font-bold text-${option.color} uppercase tracking-wider`}>{option.label}</span>
                <h3 className="font-headline text-2xl font-bold text-on-surface">{option.minutes} Minutes</h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-surface-variant flex items-center justify-center text-on-surface-variant">
                <span className="material-symbols-outlined">{option.icon}</span>
              </div>
            </button>
          );
        })}
      </section>

      {/* Reminder Setup */}
      <section className="space-y-4">
        <h2 className="font-headline font-bold text-2xl text-on-background">Stay Consistent</h2>
        <div className="bg-secondary-container/50 p-6 rounded-xl space-y-4">
          <label className="font-body font-semibold text-on-secondary-container block" htmlFor="reminder-time">
            Daily reminder preference
          </label>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <input
                className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg p-4
                           font-headline text-2xl text-on-surface focus:ring-2 focus:ring-primary focus:border-primary
                           transition-colors"
                id="reminder-time"
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
              />
            </div>
            <div className="bg-primary-container/30 p-4 rounded-lg">
              <span className="material-symbols-outlined text-primary">notifications_active</span>
            </div>
          </div>
          <p className="text-on-surface-variant text-sm font-medium">
            <span className="material-symbols-outlined text-sm align-middle mr-1">info</span>
            Push notifications coming soon. Your preference is saved.
          </p>
        </div>
      </section>

      {/* Encouragement Card */}
      <div className="bg-tertiary-fixed/30 p-6 rounded-xl flex gap-4 items-start">
        <div className="mt-1">
          <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>lightbulb</span>
        </div>
        <div>
          <p className="font-body text-on-surface leading-relaxed">
            <strong>Pro Tip:</strong> Setting a morning goal helps prime your brain for focus and memory retention throughout the entire day.
          </p>
        </div>
      </div>

      {/* Save CTA */}
      <div className="pt-4">
        <button
          onClick={handleSave}
          disabled={saved}
          className={`w-full py-5 font-body font-bold text-xl rounded-xl shadow-lg
                      active:scale-95 transition-all duration-200 flex items-center justify-center gap-3
                      ${saved
                        ? 'bg-primary-container text-on-primary-container'
                        : 'bg-primary text-on-primary'
                      }`}
        >
          {saved ? 'Saved!' : 'Save Goals'}
          <span className="material-symbols-outlined">
            {saved ? 'check' : 'check_circle'}
          </span>
        </button>
      </div>
    </main>
  );
}
