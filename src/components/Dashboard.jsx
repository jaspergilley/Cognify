/**
 * Dashboard Component
 *
 * Shell that orchestrates tabs (Home, Progress, Science) and sub-views
 * (Daily Goals, Session Export, What's New).
 *
 * @module components/Dashboard
 */

import { useMemo, useState, useEffect } from 'react';
import {
  getLatestThreshold, getThresholdHistory, getWeeklyStreak,
  getSelfProgress, getCompletedSessionCount, loadSessions,
  getBestThreshold, getTotalTrainingTime, getLatestAccuracy,
  getAccuracyHistory, getSessionCountByWeek, getConsecutiveDayStreak,
  getLastSessionDate, loadSettings,
} from '../services/dataService.js';
import { applyAudioSettings } from '../engine/audioFeedback.js';
import { useTranslation } from '../i18n/index.jsx';

import { TopAppBar } from './dashboard/TopAppBar.jsx';
import { BottomNav } from './dashboard/BottomNav.jsx';
import { HomeTab } from './dashboard/HomeTab.jsx';
import { ProgressTab } from './dashboard/ProgressTab.jsx';
import { ScienceTab } from './dashboard/ScienceTab.jsx';
import { DailyGoals } from './dashboard/DailyGoals.jsx';
import { SessionExport } from './dashboard/SessionExport.jsx';
import { WhatsNew } from './dashboard/WhatsNew.jsx';
import { SettingsView } from './dashboard/SettingsView.jsx';

/**
 * @param {object} props
 * @param {function} props.onStartSession - Called with exercise type (1, 2, or 3)
 * @param {boolean} props.ex2Available - Whether Exercise 2 is unlocked
 * @param {boolean} props.ex3Available - Whether Exercise 3 is unlocked
 * @param {boolean} props.devUnlock - Dev mode unlock
 * @param {number} props.hz - Display refresh rate
 */
export function Dashboard({ onStartSession, ex2Available, ex3Available, devUnlock, hz, defaultTab }) {
  const { setLocale } = useTranslation();
  const [activeTab, setActiveTab] = useState(defaultTab || 'home');
  const [subView, setSubView] = useState(null); // null | 'goals' | 'export' | 'whats_new' | 'settings'

  // Clear sub-view when tab changes
  useEffect(() => { setSubView(null); }, [activeTab]);

  // Apply saved settings on mount (audio + dark mode + accessibility)
  useEffect(() => {
    const settings = loadSettings();
    applyAudioSettings(settings);
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#1a1c1a');
    }
    if (settings.fontSize && settings.fontSize !== 'normal') {
      document.documentElement.setAttribute('data-font-size', settings.fontSize);
    }
    if (settings.highContrast) {
      document.documentElement.classList.add('high-contrast');
    }
    if (settings.language && settings.language !== 'en') {
      setLocale(settings.language);
    }
  }, [setLocale]);

  const data = useMemo(() => {
    const ex1Count = getCompletedSessionCount(1);
    const ex2Count = getCompletedSessionCount(2);
    const ex3Count = getCompletedSessionCount(3);
    const history = getThresholdHistory(1, 20, hz);
    const best = getBestThreshold(1, hz);
    const threshold = getLatestThreshold(1, hz);

    return {
      threshold,
      best,
      history,
      streak: getWeeklyStreak(),
      selfProgress: getSelfProgress(1, hz),
      ex1Count,
      ex2Count,
      ex3Count,
      recentSessions: loadSessions().slice(-10).reverse(),
      allSessions: loadSessions(),
      totalTime: getTotalTrainingTime(),
      latestAccuracy: getLatestAccuracy(1),
      accuracyHistory: getAccuracyHistory(1, 20),
      weeklyVolume: getSessionCountByWeek(8),
      consecutiveStreak: getConsecutiveDayStreak(),
      lastSessionDate: getLastSessionDate(),
      ex2Threshold: getLatestThreshold(2, hz),
      ex2History: getThresholdHistory(2, 20, hz),
      ex2Accuracy: getLatestAccuracy(2),
      ex3Threshold: getLatestThreshold(3, hz),
      ex3History: getThresholdHistory(3, 20, hz),
      ex3Accuracy: getLatestAccuracy(3),
      isCurrentBest: threshold && best && threshold.thresholdFrames <= best.thresholdFrames,
    };
  }, [hz]);

  const hasData = data.ex1Count > 0;
  const closeSubView = () => setSubView(null);

  return (
    <div className="absolute inset-0 flex justify-center bg-surface-dim">
    <div className="relative flex flex-col bg-background safe-inset w-full max-w-[480px] shadow-xl">
      {/* Top App Bar (hidden during sub-views — sub-views have their own header) */}
      {!subView && (
        <TopAppBar
          devUnlock={devUnlock}
          onOpenSettings={() => setSubView('settings')}
          onOpenWhatsNew={() => setSubView('whats_new')}
        />
      )}

      {/* Main content area */}
      <div className={`flex-1 overflow-y-auto dashboard-scroll tab-content ${!subView ? 'pt-20' : ''}`}>
        {subView === 'goals' && (
          <DailyGoals onBack={closeSubView} />
        )}
        {subView === 'export' && (
          <SessionExport sessions={data.allSessions} hz={hz} onBack={closeSubView} />
        )}
        {subView === 'whats_new' && (
          <WhatsNew onBack={closeSubView} onStartSession={onStartSession} />
        )}
        {subView === 'settings' && (
          <SettingsView
            onBack={closeSubView}
            onOpenExport={() => setSubView('export')}
            onResetComplete={() => window.location.reload()}
          />
        )}

        {!subView && activeTab === 'home' && (
          <HomeTab
            data={data}
            hasData={hasData}
            onStartSession={onStartSession}
            ex2Available={ex2Available}
            ex3Available={ex3Available}
            devUnlock={devUnlock}
            hz={hz}
          />
        )}
        {!subView && activeTab === 'progress' && (
          <ProgressTab data={data} hasData={hasData} hz={hz} onOpenExport={() => setSubView('export')} />
        )}
        {!subView && activeTab === 'science' && (
          <ScienceTab />
        )}
      </div>

      {/* Bottom Navigation Bar */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
    </div>
  );
}
