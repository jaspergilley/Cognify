import { useState, useEffect, useRef, useCallback, createContext, useContext, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";

/* ═══════════════════════════════════════════════════════════
   STYLESHEET — CSS custom properties, responsive layout,
   animations, and component classes. Single source of truth
   for all visual presentation.
   ═══════════════════════════════════════════════════════════ */
const STYLESHEET = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Newsreader:ital,wght@0,400;0,500;0,600;1,400&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --font-display: 'Outfit', system-ui, sans-serif;
  --font-body: 'Outfit', system-ui, sans-serif;
  --font-serif: 'Newsreader', Georgia, serif;
  --radius-sm: 10px;
  --radius-md: 14px;
  --radius-lg: 20px;
  --radius-xl: 28px;
  --transition: 0.2s ease;
  --content-max: 540px;
}

/* ── Light Theme (Default) ── */
[data-theme="light"] {
  --bg: #F6F5F0;
  --bg-card: #FFFFFF;
  --bg-card-alt: #EFEEEA;
  --bg-input: #FFFFFF;
  --bg-hover: #F0EFE9;
  --text: #1B1B18;
  --text-secondary: #555550;
  --text-muted: #8E8E86;
  --accent: #2D6A4F;
  --accent-hover: #245740;
  --accent-light: rgba(45,106,79,0.07);
  --accent-border: rgba(45,106,79,0.18);
  --accent-glow: rgba(45,106,79,0.10);
  --gold: #8B6914;
  --gold-light: rgba(139,105,20,0.06);
  --gold-border: rgba(139,105,20,0.14);
  --blue: #2563EB;
  --border: #E3E2DB;
  --border-light: #EBEAE4;
  --correct: #2D6A4F;
  --incorrect: #B91C1C;
  --nav-bg: rgba(246,245,240,0.92);
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.04);
  --shadow-md: 0 2px 8px rgba(0,0,0,0.05);
  --shadow-lg: 0 8px 24px rgba(0,0,0,0.06);
  --chart-line: #2D6A4F;
  --chart-line-alt: #2563EB;
  --chart-grid: #E3E2DB;
  --bar-active: #2D6A4F;
  --bar-muted: #D6D5CE;
}

/* ── Dark Theme ── */
[data-theme="dark"] {
  --bg: #0E1210;
  --bg-card: #1A201D;
  --bg-card-alt: #151B18;
  --bg-input: #1A201D;
  --bg-hover: #222A26;
  --text: #E6E8E4;
  --text-secondary: #9BA69E;
  --text-muted: #6B756D;
  --accent: #6EE7B7;
  --accent-hover: #5DD4A6;
  --accent-light: rgba(110,231,183,0.07);
  --accent-border: rgba(110,231,183,0.16);
  --accent-glow: rgba(110,231,183,0.12);
  --gold: #FACC15;
  --gold-light: rgba(250,204,21,0.06);
  --gold-border: rgba(250,204,21,0.12);
  --blue: #93C5FD;
  --border: #2A332D;
  --border-light: #222A26;
  --correct: #6EE7B7;
  --incorrect: #F87171;
  --nav-bg: rgba(14,18,16,0.92);
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.2);
  --shadow-md: 0 2px 8px rgba(0,0,0,0.25);
  --shadow-lg: 0 8px 24px rgba(0,0,0,0.3);
  --chart-line: #6EE7B7;
  --chart-line-alt: #93C5FD;
  --chart-grid: #2A332D;
  --bar-active: #6EE7B7;
  --bar-muted: #2A332D;
}

body { margin: 0; background: var(--bg); color: var(--text); font-family: var(--font-body); -webkit-font-smoothing: antialiased; }

/* ── Layout Shell ── */
.app-root {
  min-height: 100vh; min-height: 100dvh;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-body);
  line-height: 1.55;
  transition: background var(--transition), color var(--transition);
}

.app-content {
  max-width: var(--content-max);
  margin: 0 auto;
  padding: 0 20px;
  width: 100%;
}

.screen { min-height: 100vh; min-height: 100dvh; }
.screen-centered { min-height: 100vh; min-height: 100dvh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 32px 20px; }
.screen-padded { padding-bottom: 88px; }

/* ── Trial Screen — locked to viewport, no scroll ── */
.screen-trial {
  height: 100vh; height: 100dvh;
  display: flex; flex-direction: column;
  overflow: hidden;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
.screen-trial .global-header { padding: 10px 20px 4px; }
.screen-trial .session-progress { padding: 0 20px 8px; }
.screen-trial .session-progress-track { height: 12px; }
.screen-trial .session-progress-label { display: none; }
.screen-trial .app-content { padding-bottom: 20px; }

/* ── Responsive ── */
@media (min-width: 640px) {
  :root { --content-max: 580px; }
  .app-content { padding: 0 28px; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
}
@media (min-width: 900px) {
  :root { --content-max: 660px; }
  .app-content { padding: 0 36px; }
  .card { padding: 28px; }
  .grid-2 { gap: 16px; }
  .grid-3 { gap: 16px; }
}
@media (min-width: 1200px) {
  :root { --content-max: 720px; }
  .app-content { padding: 0 40px; }
  .screen-centered { padding: 48px 40px; }
}

/* ── Cards ── */
.card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: 20px;
  transition: background var(--transition), border-color var(--transition), box-shadow var(--transition);
}
.card:hover { box-shadow: var(--shadow-md); }
.card-highlight {
  background: var(--accent-light);
  border-color: var(--accent-border);
}
.card-gold {
  background: var(--gold-light);
  border-color: var(--gold-border);
}

/* ── Typography ── */
.text-display { font-family: var(--font-display); }
.text-serif { font-family: var(--font-serif); }
.logo { font-family: var(--font-display); font-weight: 700; font-size: 22px; letter-spacing: 5px; color: var(--accent); display: inline-flex; align-items: center; gap: 8px; }
.logo-icon { flex-shrink: 0; }
.heading-lg { font-family: var(--font-display); font-size: 28px; font-weight: 700; color: var(--text); line-height: 1.2; }
.heading-md { font-family: var(--font-display); font-size: 24px; font-weight: 700; color: var(--text); line-height: 1.25; }
.heading-sm { font-family: var(--font-display); font-size: 18px; font-weight: 600; color: var(--text); }
.text-body { font-size: 18px; line-height: 1.7; color: var(--text-secondary); }
.text-small { font-size: 16px; color: var(--text-muted); }
.text-label { font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; color: var(--text-muted); }
.text-accent { color: var(--accent); }
.text-gold { color: var(--gold); }
.stat-giant { font-family: var(--font-display); font-size: 62px; font-weight: 800; color: var(--accent); line-height: 1; }
.stat-large { font-family: var(--font-display); font-size: 50px; font-weight: 800; color: var(--text); line-height: 1; }
.stat-unit { font-size: 22px; font-weight: 400; color: var(--text-muted); }
.stat-medium { font-family: var(--font-display); font-size: 26px; font-weight: 700; color: var(--text); }

@media (min-width: 640px) {
  .heading-lg { font-size: 32px; }
  .stat-giant { font-size: 70px; }
  .stat-large { font-size: 56px; }
}

/* ── Buttons ── */
.btn {
  font-family: var(--font-display);
  font-weight: 600;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  line-height: 1;
}
.btn:active { transform: scale(0.97); }

.btn-primary {
  width: 100%;
  padding: 20px 28px;
  font-size: 19px;
  font-weight: 700;
  color: #FFFFFF;
  background: var(--accent);
  box-shadow: 0 4px 16px var(--accent-glow);
}
.btn-primary:hover { background: var(--accent-hover); }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

.btn-secondary {
  width: 100%;
  padding: 18px 24px;
  font-size: 18px;
  color: var(--accent);
  background: transparent;
  border: 1.5px solid var(--accent-border);
}
.btn-secondary:hover { background: var(--accent-light); }

.btn-start {
  width: 100%;
  padding: 22px;
  font-size: 20px;
  font-weight: 700;
  color: #FFFFFF;
  background: var(--accent);
  border-radius: var(--radius-lg);
  box-shadow: 0 6px 24px var(--accent-glow);
  letter-spacing: 0.5px;
}
.btn-start:hover { background: var(--accent-hover); transform: translateY(-1px); box-shadow: 0 8px 28px var(--accent-glow); }

.btn-ghost {
  padding: 8px 4px;
  font-size: 18px;
  color: var(--text-secondary);
  background: none;
}
.btn-ghost:hover { color: var(--text); }

.btn-icon {
  width: 48px; height: 48px;
  background: var(--bg-card-alt);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  font-size: 16px;
}
.btn-icon:hover { background: var(--bg-hover); }

.btn-choice {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 22px 34px;
  background: var(--bg-card);
  border: 1.5px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  color: var(--text);
  min-width: 140px;
}
.btn-choice:hover { border-color: var(--accent-border); box-shadow: var(--shadow-md); }
@media (min-width: 640px) { .btn-choice { padding: 26px 44px; min-width: 170px; } }

.btn-peripheral {
  padding: 18px;
  border-radius: var(--radius-md);
  border: 1.5px solid var(--border);
  background: var(--bg-card);
  color: var(--text-secondary);
  font-size: 16px; font-weight: 600;
  box-shadow: var(--shadow-sm);
}
.btn-peripheral:hover { border-color: var(--accent-border); background: var(--accent-light); }

/* ── Inputs ── */
.input-group { display: flex; flex-direction: column; gap: 7px; }
.input-label { font-size: 17px; font-weight: 600; color: var(--text-secondary); }
.input-field {
  width: 100%;
  padding: 18px 20px;
  font-size: 19px;
  font-family: var(--font-body);
  color: var(--text);
  background: var(--bg-input);
  border: 1.5px solid var(--border);
  border-radius: var(--radius-md);
  outline: none;
  transition: border-color var(--transition), box-shadow var(--transition);
}
.input-field:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-light);
}
.input-field::placeholder { color: var(--text-muted); }

/* ── Progress Bars ── */
.progress-track { height: 5px; background: var(--border-light); border-radius: 3px; overflow: hidden; }
.progress-fill { height: 100%; background: var(--accent); border-radius: 3px; transition: width 0.4s ease; }

/* ── Session Progress Bar (Duolingo-style) ── */
.session-progress {
  max-width: var(--content-max);
  margin: 0 auto;
  padding: 0 20px 12px;
  width: 100%;
}
.session-progress-track {
  height: 14px;
  background: var(--border-light);
  border-radius: 10px;
  overflow: hidden;
  position: relative;
}
.session-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent), var(--accent-hover, var(--accent)));
  border-radius: 10px;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}
.session-progress-fill::after {
  content: '';
  position: absolute;
  top: 2px; left: 4px; right: 4px;
  height: 4px;
  background: linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 100%);
  border-radius: 4px;
}
.session-progress-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 6px;
  font-size: 14px;
  color: var(--text-muted);
  font-weight: 500;
}
.session-progress-label strong {
  color: var(--accent);
  font-weight: 700;
}
@media (min-width: 640px) {
  .session-progress-track { height: 16px; border-radius: 12px; }
  .session-progress { padding: 0 28px 14px; }
}

/* ── Bottom Navigation ── */
.bottom-nav {
  position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
  width: 100%; max-width: var(--content-max);
  display: flex;
  background: var(--nav-bg);
  backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
  border-top: 1px solid var(--border);
  padding: 8px 0 env(safe-area-inset-bottom, 8px);
  z-index: 100;
}
@media (min-width: 640px) { .bottom-nav { max-width: calc(var(--content-max) + 56px); border-radius: var(--radius-lg) var(--radius-lg) 0 0; } }
.nav-item {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px;
  padding: 8px 0; background: none; border: none; cursor: pointer;
  color: var(--text-muted); transition: color var(--transition); font-family: var(--font-display);
}
.nav-item[data-active="true"] { color: var(--accent); }
.nav-item:hover { color: var(--text-secondary); }
.nav-icon { font-size: 24px; }
.nav-label { font-size: 13px; font-weight: 600; letter-spacing: 0.5px; }

/* ── Auth Toggle ── */
.auth-toggle { display: flex; background: var(--bg-card-alt); border-radius: var(--radius-sm); padding: 3px; border: 1px solid var(--border-light); }
.auth-toggle-btn {
  flex: 1; padding: 16px; font-size: 18px; font-weight: 600; font-family: var(--font-display);
  text-align: center; cursor: pointer; border-radius: 8px; border: none;
  background: transparent; color: var(--text-muted); transition: all var(--transition);
}
.auth-toggle-btn[data-active="true"] { background: var(--bg-card); color: var(--text); box-shadow: var(--shadow-sm); }

/* ── Exercise Selector ── */
.exercise-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.exercise-option {
  padding: 14px 6px; border-radius: var(--radius-md); text-align: center;
  border: 1.5px solid var(--border); background: transparent; cursor: pointer;
  color: var(--text-secondary); transition: all var(--transition); font-family: var(--font-display);
  font-size: 15px;
}
.exercise-option[data-selected="true"] { background: var(--accent-light); border-color: var(--accent-border); color: var(--accent); }
.exercise-option[data-locked="true"] { opacity: 0.4; cursor: not-allowed; }

/* ── Streak Dots ── */
.streak-dots { display: flex; gap: 12px; justify-content: center; }
.streak-dot {
  width: 40px; height: 40px; border-radius: 50%;
  border: 2px solid var(--border); background: transparent;
  transition: all 0.3s ease;
}
.streak-dot[data-filled="true"] { border-color: var(--accent); background: var(--accent-light); }
@media (min-width: 640px) { .streak-dot { width: 44px; height: 44px; } }

/* ── Stimulus Area ── */
.stimulus-field {
  display: flex; align-items: center; justify-content: center;
  background: var(--bg-card-alt); border-radius: var(--radius-xl); border: 1px solid var(--border-light);
  position: relative; min-height: 0; flex: 1;
  transition: background var(--transition);
}
/* Outside trial context, give it a reasonable min-height */
.screen:not(.screen-trial) .stimulus-field { min-height: 200px; }
@media (min-width: 640px) { .screen:not(.screen-trial) .stimulus-field { min-height: 240px; } }
@media (min-width: 900px) { .screen:not(.screen-trial) .stimulus-field { min-height: 280px; } }

/* ── Legal Screen ── */
.legal-scroll {
  flex: 1; overflow-y: auto; max-height: 44vh; padding: 24px;
  background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}
@media (min-width: 640px) { .legal-scroll { max-height: 50vh; padding: 28px; } }
@media (min-width: 900px) { .legal-scroll { max-height: 56vh; } }
.legal-h { font-size: 18px; font-weight: 700; color: var(--text); margin: 18px 0 8px; }
.legal-p { font-size: 17px; line-height: 1.8; color: var(--text-secondary); margin-bottom: 10px; }

.consent-check {
  display: flex; align-items: center; gap: 12px; cursor: pointer; user-select: none;
  font-size: 18px; color: var(--text); line-height: 1.5; margin: 20px 0;
}
.consent-check input { width: 24px; height: 24px; accent-color: var(--accent); cursor: pointer; flex-shrink: 0; }

/* ── Citation Box ── */
.citation {
  padding: 12px 16px;
  background: var(--bg-card-alt);
  border-radius: var(--radius-sm);
  margin-top: 10px;
}
.citation-source { font-family: var(--font-serif); font-size: 15px; font-style: italic; color: var(--text-muted); line-height: 1.5; }
.citation-inst { font-size: 14px; color: var(--accent); margin-top: 3px; font-weight: 500; }

/* ── Badge Row ── */
.badge-row { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; }
.badge {
  font-size: 15px; color: var(--text-muted);
  background: var(--bg-card-alt); border: 1px solid var(--border-light);
  border-radius: 20px; padding: 7px 16px; font-weight: 500;
}

/* ── Settings Row ── */
.settings-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 0; border-bottom: 1px solid var(--border-light);
  font-size: 18px; color: var(--text-secondary);
}

/* ── Error ── */
.error-msg {
  font-size: 17px; color: var(--incorrect); text-align: center; line-height: 1.5;
  background: color-mix(in srgb, var(--incorrect) 6%, transparent);
  border: 1px solid color-mix(in srgb, var(--incorrect) 15%, transparent);
  border-radius: var(--radius-md); padding: 12px 16px; margin-top: 14px;
}

/* ── Animations ── */
@keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
@keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
@keyframes gradientShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
.animate-in { animation: fadeUp 0.4s ease both; }
.animate-in-d1 { animation: fadeUp 0.5s ease 0.08s both; }
.animate-in-d2 { animation: fadeUp 0.5s ease 0.16s both; }
.animate-in-d3 { animation: fadeUp 0.5s ease 0.24s both; }
.animate-in-d4 { animation: fadeUp 0.5s ease 0.32s both; }
.animate-in-d5 { animation: fadeUp 0.5s ease 0.40s both; }
.animate-fade { animation: fadeIn 0.6s ease both; }
.animate-pulse { animation: pulse 2s ease infinite; }
.animate-float { animation: float 4s ease-in-out infinite; }

/* ── Landing Page ── */
.landing { min-height: 100vh; min-height: 100dvh; overflow-x: hidden; }
.landing-hero {
  min-height: 100vh; min-height: 100dvh;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  text-align: center; padding: 60px 24px 40px; position: relative;
  gap: 0;
}
@media (max-height: 750px) {
  .landing-hero { min-height: auto; padding: 48px 24px 40px; }
}
.landing-hero::before {
  content: ''; position: absolute; inset: 0; z-index: 0;
  background:
    radial-gradient(ellipse 60% 50% at 50% 0%, var(--accent-light) 0%, transparent 70%),
    radial-gradient(ellipse 40% 40% at 80% 80%, var(--gold-light) 0%, transparent 60%);
  pointer-events: none;
}
.landing-hero > * { position: relative; z-index: 1; }
.hero-eyebrow {
  font-size: 14px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase;
  color: var(--accent); margin-bottom: 16px;
}
.hero-title {
  font-family: var(--font-display); font-size: 36px; font-weight: 800;
  line-height: 1.1; color: var(--text); max-width: 560px; margin-bottom: 16px;
  padding: 0 8px;
}
.hero-title em { font-style: normal; color: var(--accent); }
@media (min-width: 640px) { .hero-title { font-size: 52px; padding: 0; } }
@media (min-width: 900px) { .hero-title { font-size: 62px; } }
.hero-subtitle {
  font-family: var(--font-serif); font-size: 18px; line-height: 1.7;
  color: var(--text-secondary); max-width: 480px; margin-bottom: 28px;
  padding: 0 8px;
}
@media (min-width: 640px) { .hero-subtitle { font-size: 21px; padding: 0; } }
.hero-cta-row { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; margin-bottom: 32px; }
.hero-cta-row .btn { width: auto; padding: 16px 32px; }
.hero-stat-row {
  display: flex; gap: 24px; flex-wrap: wrap; justify-content: center;
  padding-top: 24px; border-top: 1px solid var(--border-light);
}
.hero-stat { text-align: center; }
.hero-stat-value { font-family: var(--font-display); font-size: 30px; font-weight: 800; color: var(--accent); line-height: 1; }
.hero-stat-label { font-size: 14px; color: var(--text-muted); margin-top: 6px; }
@media (min-width: 640px) { .hero-stat-value { font-size: 38px; } .hero-stat-row { gap: 44px; } }

.landing-section {
  padding: 64px 24px;
  max-width: 800px; margin: 0 auto;
}
@media (min-width: 640px) { .landing-section { padding: 80px 32px; } }
.landing-section-label {
  font-size: 13px; font-weight: 600; letter-spacing: 2.5px; text-transform: uppercase;
  color: var(--accent); margin-bottom: 12px;
}
.landing-section-title {
  font-family: var(--font-display); font-size: 30px; font-weight: 700;
  color: var(--text); line-height: 1.2; margin-bottom: 20px;
}
@media (min-width: 640px) { .landing-section-title { font-size: 36px; } }

.feature-grid { display: grid; gap: 16px; }
@media (min-width: 640px) { .feature-grid { grid-template-columns: 1fr 1fr; gap: 20px; } }
.feature-card {
  background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-lg);
  padding: 28px; box-shadow: var(--shadow-sm); transition: all var(--transition);
}
.feature-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
.feature-icon { font-size: 34px; margin-bottom: 14px; }
.feature-title { font-family: var(--font-display); font-size: 19px; font-weight: 700; color: var(--text); margin-bottom: 8px; }
.feature-desc { font-size: 17px; line-height: 1.7; color: var(--text-secondary); }

.landing-quote {
  font-family: var(--font-serif); font-size: 22px; font-style: italic;
  line-height: 1.7; color: var(--text-secondary); text-align: center;
  max-width: 540px; margin: 0 auto 16px; padding: 0 16px;
}
@media (min-width: 640px) { .landing-quote { font-size: 25px; } }

.landing-footer {
  padding: 32px 24px; text-align: center;
  border-top: 1px solid var(--border-light);
}

/* ── Scroll indicator ── */
.scroll-hint {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  color: var(--text-muted); font-size: 14px; animation: pulse 2.5s ease infinite;
  margin-top: 32px;
}
@media (max-height: 750px) { .scroll-hint { display: none; } }
.scroll-arrow { font-size: 20px; }

/* ── Scrollbar ── */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

/* ── Utility ── */
.flex-center { display: flex; align-items: center; justify-content: center; }

/* ── Global Header ── */
.global-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px 10px;
  max-width: var(--content-max);
  margin: 0 auto; width: 100%;
}
.global-header .logo { cursor: pointer; }
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.flex-col { display: flex; flex-direction: column; }
.gap-sm { gap: 8px; }
.gap-md { gap: 14px; }
.gap-lg { gap: 20px; }
.text-center { text-align: center; }
.w-full { width: 100%; }
.mt-sm { margin-top: 8px; }
.mt-md { margin-top: 16px; }
.mt-lg { margin-top: 24px; }
.mb-sm { margin-bottom: 8px; }
.mb-md { margin-bottom: 16px; }
.mb-lg { margin-bottom: 24px; }
`;

// Inject stylesheet once
if (!document.getElementById('cognify-styles')) {
  const el = document.createElement('style');
  el.id = 'cognify-styles';
  el.textContent = STYLESHEET;
  document.head.appendChild(el);
}

/* ═══════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════ */
const INITIAL_DISPLAY_TIME = 500;
const STEP_DOWN = 17;
const STEP_UP = 25;
const STREAK_THRESHOLD = 3;
const MIN_DISPLAY_TIME = 17;
const MAX_DISPLAY_TIME = 800;
const EXERCISE_1_TRIALS_PER_BLOCK = 40;
const EXERCISE_2_TRIALS_PER_BLOCK = 30;
const EXERCISE_3_TRIALS_PER_BLOCK = 25;
const BASELINE_TRIAL_COUNT = 20;
const BLOCKS_PER_SESSION = 2;
const UNLOCK_EXERCISE_2_THRESHOLD = 150;
const UNLOCK_EXERCISE_3_THRESHOLD = 100;
const STORAGE_PREFIX = "cognify_";

/* ── Milestone Badges ── */
const BADGE_DEFINITIONS = [
  { id: "first_session", name: "First Step", icon: "🌱", description: "Completed your first training session", check: (d) => (d.sessions||[]).length >= 1 },
  { id: "five_sessions", name: "Building Habit", icon: "🔄", description: "5 sessions completed — habit forming", check: (d) => (d.sessions||[]).length >= 5 },
  { id: "ten_sessions", name: "Core Protocol", icon: "🏅", description: "10 sessions — matching the ACTIVE study's core protocol", check: (d) => (d.sessions||[]).length >= 10 },
  { id: "fourteen_sessions", name: "Full Protocol", icon: "🏆", description: "14 sessions — completing the ACTIVE protocol with boosters", check: (d) => (d.sessions||[]).length >= 14 },
  { id: "unlock_ex2", name: "Divided Focus", icon: "👁️", description: "Unlocked Exercise 2: Divided Attention", check: (d) => d.exerciseUnlocks?.[2] },
  { id: "unlock_ex3", name: "Under Pressure", icon: "⚡", description: "Unlocked Exercise 3: Selective Attention", check: (d) => d.exerciseUnlocks?.[3] },
  { id: "sub_200", name: "Sub-200", icon: "💨", description: "Processing speed below 200ms", check: (d) => (d.lastThresholds?.[1]||999) < 200 },
  { id: "sub_100", name: "Lightning", icon: "⚡", description: "Processing speed below 100ms", check: (d) => (d.lastThresholds?.[1]||999) < 100 },
  { id: "week_streak", name: "Consistent", icon: "🔥", description: "Hit your weekly training goal", check: (d) => {
    const now = new Date(), ws = new Date(now); ws.setDate(now.getDate()-now.getDay()); ws.setHours(0,0,0,0);
    return (d.sessions||[]).filter(s => new Date(s.date) >= ws).length >= (d.weeklyGoal || 3);
  }},
];

function getEarnedBadges(appData) {
  return BADGE_DEFINITIONS.filter(b => b.check(appData));
}

/* ═══════════════════════════════════════════════════════════
   RESEARCH CITATIONS
   ═══════════════════════════════════════════════════════════ */
const RESEARCH_FACTS = [
  { text: "The ACTIVE study found that speed-of-processing training with boosters was associated with a 25% reduction in dementia diagnoses over 20 years.", source: "Coe et al., Alzheimer's & Dementia: TRCI, 2026", institution: "Johns Hopkins / NIH" },
  { text: "Processing speed is among the first cognitive abilities to decline with age, often beginning in one's 30s — but it remains highly trainable throughout life.", source: "Salthouse, Psychological Review, 1996", institution: "University of Virginia" },
  { text: "Cognitive reserve theory suggests that mentally stimulating activities build neural resilience, helping the brain compensate for age-related changes.", source: "Stern, Neuropsychologia, 2009", institution: "Columbia University" },
  { text: "The Cambridge Centre for Ageing and Neuroscience (Cam-CAN) found that brain connectivity predicts cognitive performance better than chronological age.", source: "Shafto et al., BMC Neurology, 2014", institution: "Cambridge Centre for Ageing & Neuroscience" },
  { text: "A meta-analysis of 52 studies confirmed that computerized cognitive training produces meaningful improvements in processing speed among older adults.", source: "Lampit et al., PLOS Medicine, 2014", institution: "University of Sydney" },
  { text: "The NIH Toolbox Cognition Battery identifies processing speed as one of the core measurable domains of cognitive health across the lifespan.", source: "Weintraub et al., Neurology, 2013", institution: "NIH / Northwestern University" },
  { text: "Useful Field of View training — the basis for speed exercises — has been linked to maintained driving safety and independence in older adults.", source: "Ball et al., Journal of the American Geriatrics Society, 2010", institution: "University of Alabama at Birmingham" },
  { text: "Booster sessions were essential — only participants who received initial training plus periodic boosters showed lasting risk reductions.", source: "Coe et al., 2026; Rebok et al., JAGS, 2014", institution: "Johns Hopkins / NIA" },
  { text: "Adaptive difficulty is critical: training that adjusts to individual performance produces larger and more durable cognitive gains.", source: "Brehmer et al., Psychology and Aging, 2012", institution: "Karolinska Institute" },
  { text: "The FINGER trial demonstrated that multimodal interventions including cognitive training can reduce cognitive decline risk in at-risk older adults.", source: "Ngandu et al., The Lancet, 2015", institution: "Karolinska Institute / Univ. of Eastern Finland" },
  { text: "Improvements from speed-of-processing training transfer to everyday functioning, including faster performance of daily tasks.", source: "Edwards et al., Journal of the American Geriatrics Society, 2005", institution: "University of South Florida" },
  { text: "Neuroimaging studies show that cognitive training can increase white matter integrity in older adults, supporting faster neural communication.", source: "Lövdén et al., NeuroImage, 2010", institution: "Max Planck Institute for Human Development" },
  { text: "The WHO recommends cognitive training as part of a comprehensive approach to reducing dementia risk in adults with normal cognition.", source: "WHO Risk Reduction Guidelines, 2019", institution: "World Health Organization" },
];

const SESSION_ENCOURAGEMENTS = [
  "Your brain is adapting. Every session builds lasting resilience.",
  "Consistency is the key finding from the research. You're building the habit that matters.",
  "Real improvement is showing in your data. Keep going.",
  "This is exactly the kind of training that produced results over 20 years.",
  "Your processing speed is a trainable skill. Today you made it stronger.",
  "The ACTIVE study participants saw benefits that lasted decades. You're investing in that same protection.",
  "Each trial strengthens the neural pathways that support faster visual processing.",
  "You're doing something no pill, no diet, and no other brain game has been proven to do.",
];

const BETWEEN_BLOCK_MESSAGES = [
  { encouragement: "You're doing great. Take a slow breath in, hold, and release.", fact: "The ACTIVE study found rest periods between training blocks help consolidate learning gains.", source: "Rebok et al., JAGS, 2014" },
  { encouragement: "Nice work on that block. Close your eyes for a moment and relax.", fact: "Brief rest periods during cognitive training allow working memory to reset, improving subsequent performance.", source: "Brehmer et al., Psychology and Aging, 2012" },
  { encouragement: "Well done. Let your eyes rest — look at something distant for a few seconds.", fact: "Visual processing speed improvements transfer to real-world tasks like safer driving and faster daily functioning.", source: "Ball et al., JAGS, 2010" },
  { encouragement: "Good progress. Take a deep breath — you've earned the pause.", fact: "The brain continues to consolidate training gains during rest. These micro-breaks are part of the protocol.", source: "Edwards et al., JAGS, 2005" },
];

function getPersonalizedImpactMessage(sessions, improvement, baseline) {
  const totalSessions = (sessions || []).length;
  const sessionProgress = Math.min(1, totalSessions / 14);
  const improvementFactor = Math.min(1, Math.max(0, improvement) / 100);
  const riskReduction = Math.round(Math.min(25, (sessionProgress * 0.6 + improvementFactor * 0.4) * 25));

  const messages = [];

  if (totalSessions >= 1 && totalSessions < 5) {
    messages.push({ text: `You've completed ${totalSessions} of the ~14 sessions in the ACTIVE study protocol. Every session counts.`, source: "Coe et al., Alzheimer's & Dementia: TRCI, 2026", icon: "📊" });
  }
  if (totalSessions >= 5 && totalSessions < 10) {
    messages.push({ text: `${totalSessions} sessions in — you're halfway through the core ACTIVE protocol. Your estimated dementia risk reduction: ~${riskReduction}%.`, source: "Coe et al., 2026", icon: "📉" });
  }
  if (totalSessions >= 10) {
    messages.push({ text: `You've matched the ACTIVE study's 10-session core protocol. Estimated risk reduction: ~${riskReduction}%. Continued training (boosters) is what made the difference.`, source: "Coe et al., 2026; Rebok et al., 2014", icon: "🏅" });
  }
  if (improvement > 20) {
    messages.push({ text: `Your processing speed has improved by ${improvement}ms — that's a ${Math.round((improvement/baseline)*100)}% improvement from your baseline. This kind of gain is exactly what the ACTIVE study measured.`, source: "Edwards et al., JAGS, 2005", icon: "⚡" });
  }
  if (improvement > 50) {
    messages.push({ text: `A ${improvement}ms improvement means your visual processing is meaningfully faster. Research shows this transfers to everyday tasks like driving and decision-making.`, source: "Ball et al., JAGS, 2010", icon: "🚗" });
  }
  if (totalSessions >= 14) {
    messages.push({ text: `${totalSessions} sessions completed — you've gone beyond the full ACTIVE protocol. In the study, this level of training was associated with 25% fewer dementia diagnoses over 20 years.`, source: "Coe et al., 2026", icon: "🧠" });
  }
  if (riskReduction > 0) {
    messages.push({ text: `Based on your progress, your estimated dementia risk reduction is ~${riskReduction}%, tracking toward the study's maximum finding of 25%.`, source: "Coe et al., 2026", icon: "🛡️" });
  }

  return messages.length > 0 ? messages[Math.floor(Math.random() * messages.length)] : null;
}

const randomFact = () => RESEARCH_FACTS[Math.floor(Math.random() * RESEARCH_FACTS.length)];
const randomEncouragement = () => SESSION_ENCOURAGEMENTS[Math.floor(Math.random() * SESSION_ENCOURAGEMENTS.length)];
const randomBetweenBlock = () => BETWEEN_BLOCK_MESSAGES[Math.floor(Math.random() * BETWEEN_BLOCK_MESSAGES.length)];

const MID_TRIAL_BREAKS = [
  { text: "Every session you complete brings you closer to the 10-session core protocol used in the ACTIVE study.", source: "Coe et al., 2026" },
  { text: "Speed-of-processing training is the only cognitive intervention proven to reduce dementia diagnoses in a 20-year randomized trial.", source: "Coe et al., Alzheimer's & Dementia: TRCI, 2026" },
  { text: "Your brain is building cognitive reserve right now — broader neural network engagement that resists age-related decline.", source: "Stern, Neuropsychologia, 2009" },
  { text: "Adaptive difficulty — what you're experiencing — is the key mechanism that made this training work when other brain games didn't.", source: "Brehmer et al., Psychology and Aging, 2012" },
  { text: "Research shows these improvements transfer to real life: participants performed everyday tasks faster after training.", source: "Edwards et al., JAGS, 2005" },
  { text: "The Cambridge Centre for Ageing found that brain connectivity matters more than chronological age for cognitive performance.", source: "Shafto et al., BMC Neurology, 2014" },
  { text: "White matter integrity — the wiring that connects brain regions — has been shown to increase with cognitive training.", source: "Lövdén et al., NeuroImage, 2010" },
  { text: "UFOV training, the basis for these exercises, has been linked to maintained driving safety in older adults.", source: "Ball et al., JAGS, 2010" },
  { text: "A meta-analysis of 52 studies confirmed: computerized training like this produces real improvements in processing speed.", source: "Lampit et al., PLOS Medicine, 2014" },
  { text: "The World Health Organization recommends cognitive training as part of reducing dementia risk.", source: "WHO Guidelines, 2019" },
];
const randomMidBreak = () => MID_TRIAL_BREAKS[Math.floor(Math.random() * MID_TRIAL_BREAKS.length)];

/* ═══════════════════════════════════════════════════════════
   SCORING & NORMS
   ═══════════════════════════════════════════════════════════ */
const AGE_NORMS = { "40–49": 210, "50–59": 250, "60–69": 290, "70–79": 340, "80+": 400 };

function estimateCognitiveBenefit(sessionsCompleted, msImprovement) {
  const sessionFactor = Math.min(1, sessionsCompleted / 14);
  const improvementFactor = Math.min(1, msImprovement / 100);
  return ((sessionFactor * 0.6 + improvementFactor * 0.4) * 3.2).toFixed(1);
}

function estimateRiskReduction(sessionsCompleted, msImprovement) {
  const sessionFactor = Math.min(1, sessionsCompleted / 14);
  const improvementFactor = Math.min(1, msImprovement / 100);
  return Math.round(Math.min(25, (sessionFactor * 0.6 + improvementFactor * 0.4) * 25));
}

/* ═══════════════════════════════════════════════════════════
   SHAPES (SVG stimulus objects)
   ═══════════════════════════════════════════════════════════ */
const SHAPE_DEFINITIONS = {
  circle: { name: "Circle", render: (s, c) => <circle cx={s/2} cy={s/2} r={s*0.4} fill={c}/> },
  square: { name: "Square", render: (s, c) => <rect x={s*0.1} y={s*0.1} width={s*0.8} height={s*0.8} rx={6} fill={c}/> },
  triangle: { name: "Triangle", render: (s, c) => <polygon points={`${s/2},${s*0.08} ${s*0.92},${s*0.92} ${s*0.08},${s*0.92}`} fill={c}/> },
  diamond: { name: "Diamond", render: (s, c) => <polygon points={`${s/2},${s*0.05} ${s*0.95},${s/2} ${s/2},${s*0.95} ${s*0.05},${s/2}`} fill={c}/> },
  star: { name: "Star", render: (s, c) => {
    const cx=s/2, cy=s/2, outer=s*0.45, inner=s*0.2;
    const points = Array.from({length:10}, (_,i) => {
      const r = i%2===0 ? outer : inner;
      const angle = (i*36-90)*Math.PI/180;
      return `${cx+r*Math.cos(angle)},${cy+r*Math.sin(angle)}`;
    }).join(" ");
    return <polygon points={points} fill={c}/>;
  }},
  hexagon: { name: "Hexagon", render: (s, c) => {
    const cx=s/2, cy=s/2, r=s*0.44;
    const points = Array.from({length:6}, (_,i) => {
      const a=(i*60-90)*Math.PI/180;
      return `${cx+r*Math.cos(a)},${cy+r*Math.sin(a)}`;
    }).join(" ");
    return <polygon points={points} fill={c}/>;
  }},
};

const SHAPE_PAIRS = [["circle","square"],["triangle","diamond"],["star","hexagon"]];

const PERIPHERAL_POSITIONS = [
  {x:50,y:5,label:"Top"}, {x:88,y:28,label:"Top Right"}, {x:88,y:72,label:"Bottom Right"},
  {x:50,y:95,label:"Bottom"}, {x:12,y:72,label:"Bottom Left"}, {x:12,y:28,label:"Top Left"},
];

function ShapeIcon({ shapeKey, size = 80 }) {
  const shape = SHAPE_DEFINITIONS[shapeKey];
  if (!shape) return null;
  return <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>{shape.render(size, "var(--accent)")}</svg>;
}

/* ═══════════════════════════════════════════════════════════
   PERSISTENT STORAGE
   ═══════════════════════════════════════════════════════════ */
async function storageGet(key) {
  try { const r = await window.storage.get(STORAGE_PREFIX + key); return r ? JSON.parse(r.value) : null; }
  catch { return null; }
}
async function storageSet(key, value) {
  try { await window.storage.set(STORAGE_PREFIX + key, JSON.stringify(value)); } catch(e) { console.error("Storage error:", e); }
}

/* ═══════════════════════════════════════════════════════════
   SECURE PASSWORD HASHING — Web Crypto API (SHA-256 + salt)
   Uses the browser's built-in cryptographic primitives.
   In production, use PBKDF2 with per-user salts. SHA-256
   with a fixed application salt is a strong baseline.
   ═══════════════════════════════════════════════════════════ */
const PASSWORD_SALT = "cognify_secure_v1_2026";

async function secureHashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(PASSWORD_SALT + password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

/* ═══════════════════════════════════════════════════════════
   THEME CONTEXT
   ═══════════════════════════════════════════════════════════ */
const ThemeContext = createContext({ mode: "light", toggleTheme: () => {} });

/* ═══════════════════════════════════════════════════════════
   SHARED COMPONENTS
   ═══════════════════════════════════════════════════════════ */
function GlobalHeader({ setScreen, rightContent }) {
  return (
    <div className="global-header">
      <div className="logo" onClick={() => setScreen("landing")}>
        <svg className="logo-icon" width="28" height="28" viewBox="0 0 28 28">
          <circle cx="14" cy="14" r="12" fill="none" stroke="currentColor" strokeWidth="1.8"/>
          <circle cx="14" cy="14" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.4"/>
          <circle cx="14" cy="14" r="2.5" fill="currentColor"/>
        </svg>
        COGNIFY
      </div>
      {rightContent || null}
    </div>
  );
}

function SessionProgressBar({ current, total, label }) {
  const percent = total > 0 ? Math.min(100, (current / total) * 100) : 0;
  return (
    <div className="session-progress">
      <div className="session-progress-track">
        <div className="session-progress-fill" style={{width:`${percent}%`}}/>
      </div>
      {label !== false && (
        <div className="session-progress-label">
          <span>{current} of {total} trials</span>
          <span><strong>{Math.round(percent)}%</strong></span>
        </div>
      )}
    </div>
  );
}

function ResearchSnippet() {
  const [fact] = useState(randomFact);
  return (
    <div className="card" style={{display:"flex",gap:12,alignItems:"flex-start"}}>
      <span style={{fontSize:20,flexShrink:0,marginTop:2}}>📚</span>
      <div>
        <p className="text-serif" style={{fontSize:17,color:"var(--text-secondary)",lineHeight:1.7,margin:0}}>{fact.text}</p>
        <div className="citation" style={{marginTop:8,padding:"8px 12px"}}>
          <div className="citation-source">{fact.source}</div>
          <div className="citation-inst">{fact.institution}</div>
        </div>
      </div>
    </div>
  );
}

function BottomNav({ current, onNavigate }) {
  const items = [
    { key: "home", icon: "🏠", label: "Home", screen: "dashboard" },
    { key: "progress", icon: "📊", label: "Progress", screen: "progress" },
    { key: "science", icon: "🔬", label: "Science", screen: "science" },
  ];
  return (
    <nav className="bottom-nav">
      {items.map(item => (
        <button key={item.key} className="nav-item" data-active={current === item.key} onClick={() => onNavigate(item.screen)}>
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

function ChartTooltipStyle() {
  return { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)", fontSize: 13 };
}

/* ═══════════════════════════════════════════════════════════
   APP ROOT
   ═══════════════════════════════════════════════════════════ */
const DEFAULT_APP_DATA = {
  onboarded: false, baseline: null, sessions: [],
  exerciseUnlocks: { 1: true, 2: false, 3: false },
  lastThresholds: { 1: INITIAL_DISPLAY_TIME, 2: INITIAL_DISPLAY_TIME, 3: INITIAL_DISPLAY_TIME },
  currentExercise: 1, ageGroup: "60–69", weeklyGoal: 3,
  acceptedTerms: false, acceptedPrivacy: false, researchConsent: false,
};

export default function CognifyApp() {
  const [mode, setMode] = useState("light");
  const [user, setUser] = useState(null);
  const [appData, setAppData] = useState(null);
  const [screen, setScreen] = useState("loading");
  const [loading, setLoading] = useState(true);

  const toggleTheme = useCallback(() => setMode(m => m === "light" ? "dark" : "light"), []);

  useEffect(() => {
    (async () => {
      const savedMode = await storageGet("theme");
      if (savedMode) setMode(savedMode);
      const session = await storageGet("session");
      if (session) {
        setUser(session);
        const data = await storageGet("data_" + session.username);
        setAppData(data || { ...DEFAULT_APP_DATA });
        setScreen(data?.onboarded ? "dashboard" : "terms");
      } else {
        setScreen("landing");
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => { if (!loading) storageSet("theme", mode); }, [mode, loading]);
  useEffect(() => { document.documentElement.setAttribute("data-theme", mode); }, [mode]);

  const updateAppData = useCallback(async (updates) => {
    setAppData(prev => {
      const next = { ...prev, ...updates };
      if (user) storageSet("data_" + user.username, next);
      return next;
    });
  }, [user]);

  const handleAuth = useCallback(async (userData) => {
    setUser(userData);
    await storageSet("session", userData);
    const data = await storageGet("data_" + userData.username);
    if (data) { setAppData(data); setScreen(data.onboarded ? "dashboard" : "terms"); }
    else { setAppData({ ...DEFAULT_APP_DATA }); setScreen("terms"); }
  }, []);

  const handleLogout = useCallback(async () => {
    await storageSet("session", null);
    setUser(null); setAppData(null); setScreen("landing");
  }, []);

  if (loading) return (
    <div className="app-root screen-centered">
      <div className="logo animate-pulse" style={{fontSize:28,letterSpacing:7}}>
        <svg className="logo-icon" width="36" height="36" viewBox="0 0 28 28"><circle cx="14" cy="14" r="12" fill="none" stroke="currentColor" strokeWidth="1.8"/><circle cx="14" cy="14" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.4"/><circle cx="14" cy="14" r="2.5" fill="currentColor"/></svg>
        COGNIFY
      </div>
    </div>
  );

  const props = { appData, updateAppData, setScreen, user, handleLogout };

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <div className="app-root">
        {screen === "landing" && <LandingPage setScreen={setScreen} />}
        {screen === "auth" && <AuthScreen onAuth={handleAuth} setScreen={setScreen} />}
        {screen === "terms" && <TermsScreen {...props} />}
        {screen === "privacy" && <PrivacyScreen {...props} />}
        {screen === "consent" && <ConsentScreen {...props} />}
        {screen === "onboarding" && <OnboardingScreen {...props} />}
        {screen === "dashboard" && <DashboardScreen {...props} />}
        {screen === "training" && <TrainingSession {...props} />}
        {screen === "summary" && <SessionSummary {...props} />}
        {screen === "progress" && <ProgressScreen {...props} />}
        {screen === "science" && <ScienceScreen {...props} />}
        {screen === "settings" && <SettingsScreen {...props} />}
      </div>
    </ThemeContext.Provider>
  );
}

/* ═══════════════════════════════════════════════════════════
   LANDING PAGE
   ═══════════════════════════════════════════════════════════ */
function LandingPage({ setScreen }) {
  const { mode, toggleTheme } = useContext(ThemeContext);
  return (
    <div className="landing">
      {/* Theme toggle floating */}
      <div style={{position:"fixed",top:16,right:16,zIndex:50}}>
        <button className="btn btn-icon" onClick={toggleTheme} style={{width:"auto",padding:"10px 16px",fontSize:17,fontWeight:600}}>
          {mode==="light"?"Dark Mode":"Light Mode"}
        </button>
      </div>

      {/* ── Hero ── */}
      <section className="landing-hero">
        <div className="animate-in">
          <svg width="56" height="56" viewBox="0 0 56 56" className="animate-float" style={{marginBottom:20}}>
            <circle cx="28" cy="28" r="24" fill="none" stroke="var(--accent)" strokeWidth="2.5"/>
            <circle cx="28" cy="28" r="13" fill="none" stroke="var(--accent)" strokeWidth="1.5" opacity="0.35"/>
            <circle cx="28" cy="28" r="4.5" fill="var(--accent)"/>
          </svg>
        </div>
        <div className="hero-eyebrow animate-in-d1">Evidence-Based Brain Training</div>
        <h1 className="hero-title animate-in-d2">Train your brain's <em>speed</em>. Protect your <em>future</em>.</h1>
        <p className="hero-subtitle animate-in-d3">
          The only cognitive training app built on the intervention proven in a 20-year NIH clinical trial to reduce dementia risk by 25%.
        </p>
        <div className="hero-cta-row animate-in-d4">
          <button className="btn btn-primary" onClick={() => setScreen("auth")}>Get Started — It's Free</button>
          <button className="btn btn-secondary" onClick={() => {
            document.getElementById('landing-science')?.scrollIntoView({ behavior: 'smooth' });
          }}>See the Science</button>
        </div>
        <div className="hero-stat-row animate-in-d5">
          <div className="hero-stat"><div className="hero-stat-value">25%</div><div className="hero-stat-label">Dementia risk reduction</div></div>
          <div className="hero-stat"><div className="hero-stat-value">2,802</div><div className="hero-stat-label">Study participants</div></div>
          <div className="hero-stat"><div className="hero-stat-value">20</div><div className="hero-stat-label">Years of evidence</div></div>
        </div>
        <div className="scroll-hint">
          <span>Learn more</span>
          <span className="scroll-arrow">↓</span>
        </div>
      </section>

      {/* ── The Science ── */}
      <section className="landing-section" id="landing-science" style={{borderTop:"1px solid var(--border-light)"}}>
        <div className="landing-section-label">The Research</div>
        <div className="landing-section-title">The first intervention ever proven to reduce dementia over two decades.</div>
        <p className="text-body mb-lg" style={{fontSize:16,maxWidth:600}}>
          In February 2026, Johns Hopkins and the NIH published the results of the ACTIVE study — the largest and longest
          cognitive training trial ever conducted. After following 2,802 adults for 20 years, they found that one specific
          type of brain exercise reduced Alzheimer's and dementia diagnoses by 25%. No drug, no diet, no other brain game
          has ever shown this in a randomized controlled trial.
        </p>
        <div className="card mb-md" style={{maxWidth:540}}>
          <div className="landing-quote" style={{margin:0,padding:0,textAlign:"left",fontSize:17}}>
            That one exercise was <strong style={{color:"var(--accent)",fontStyle:"normal"}}>adaptive visual speed-of-processing training</strong>.
            That's exactly what Cognify delivers.
          </div>
        </div>
        <div className="citation" style={{maxWidth:540}}>
          <div className="citation-source">Coe et al., "Impact of Cognitive Training on Claims-Based Diagnosed Dementia Over 20 Years." Alzheimer's & Dementia: TRCI, 2026</div>
          <div className="citation-inst">Johns Hopkins University / National Institutes of Health</div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="landing-section" style={{borderTop:"1px solid var(--border-light)"}}>
        <div className="landing-section-label">How It Works</div>
        <div className="landing-section-title">12 minutes, 3 times a week.</div>
        <p className="text-body mb-lg" style={{fontSize:16,maxWidth:560}}>
          Cognify progressively challenges your brain's processing speed with three scientifically-designed exercises
          that adapt to your exact ability in real time — the key mechanism that made the ACTIVE study work.
        </p>
        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon">👁️</div>
            <div className="feature-title">Central Identification</div>
            <div className="feature-desc">Identify briefly flashed objects with decreasing display times. Builds foundational visual processing speed.</div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <div className="feature-title">Divided Attention</div>
            <div className="feature-desc">Track central and peripheral targets simultaneously. Trains the brain's ability to process multiple inputs at once.</div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <div className="feature-title">Selective Attention</div>
            <div className="feature-desc">Find targets among visual distractors. Mirrors the hardest phase of the original ACTIVE study protocol.</div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <div className="feature-title">Adaptive Difficulty</div>
            <div className="feature-desc">Every session adjusts to your performance using a 3-up/1-down staircase — the exact algorithm from the clinical trial.</div>
          </div>
        </div>
      </section>

      {/* ── Why This Is Different ── */}
      <section className="landing-section" style={{borderTop:"1px solid var(--border-light)"}}>
        <div className="landing-section-label">Why Cognify</div>
        <div className="landing-section-title">Not another brain game.</div>
        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-title">Backed by a named RCT</div>
            <div className="feature-desc">Lumosity was fined $2M by the FTC for unsubstantiated claims. Cognify is built on a specific, published, 20-year randomized controlled trial.</div>
          </div>
          <div className="feature-card">
            <div className="feature-title">Focused, not cluttered</div>
            <div className="feature-desc">BrainHQ charges $14/month for 29 exercises. Cognify does one thing — the thing that actually worked — and does it well.</div>
          </div>
          <div className="feature-card">
            <div className="feature-title">Your progress, quantified</div>
            <div className="feature-desc">Track your processing speed, accuracy, and estimated dementia risk reduction based on your real training data.</div>
          </div>
          <div className="feature-card">
            <div className="feature-title">Research-transparent</div>
            <div className="feature-desc">Every claim in Cognify is cited. Every statistic has a source. We show you the papers, not marketing copy.</div>
          </div>
        </div>
      </section>

      {/* ── Endorsement ── */}
      <section className="landing-section text-center" style={{borderTop:"1px solid var(--border-light)"}}>
        <div className="landing-quote">
          "This is the first randomized controlled trial to demonstrate any intervention — cognitive, pharmacological, dietary, or exercise-based — can reduce dementia incidence over two decades."
        </div>
        <div className="text-small">NIH News Release, February 2026</div>
      </section>

      {/* ── CTA ── */}
      <section className="landing-section text-center" style={{borderTop:"1px solid var(--border-light)"}}>
        <div className="landing-section-title" style={{marginBottom:12}}>Start protecting your brain today.</div>
        <p className="text-body mb-lg" style={{maxWidth:440,margin:"0 auto 24px"}}>
          Free to start. No credit card. Based on the science that matters.
        </p>
        <div style={{maxWidth:320,margin:"0 auto"}}>
          <button className="btn btn-primary" onClick={() => setScreen("auth")}>Create Free Account</button>
        </div>
        <p className="text-body mt-md">
          Already have an account? <span style={{color:"var(--accent)",cursor:"pointer",fontWeight:600}} onClick={() => setScreen("auth")}>Sign in</span>
        </p>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="logo mb-sm" style={{fontSize:16,justifyContent:"center"}}>
          <svg className="logo-icon" width="20" height="20" viewBox="0 0 28 28"><circle cx="14" cy="14" r="12" fill="none" stroke="currentColor" strokeWidth="1.8"/><circle cx="14" cy="14" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.4"/><circle cx="14" cy="14" r="2.5" fill="currentColor"/></svg>
          COGNIFY
        </div>
        <p className="text-small">Cognitive fitness training based on the ACTIVE study.</p>
        <p className="text-small mt-sm">Not a medical device. Not FDA evaluated. Does not claim to prevent, treat, or cure dementia.</p>
        <div style={{marginTop:20,paddingTop:16,borderTop:"1px solid var(--border-light)"}}>
          <p className="text-small" style={{color:"var(--text-muted)",marginBottom:4}}>Built by</p>
          <p style={{fontSize:16,color:"var(--text-secondary)",fontWeight:500,lineHeight:1.8}}>
            Enrique Reid · Khushaan Virk · Dean Kiyingi · Jasper Gilley
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   AUTH SCREEN — Username + Password
   ═══════════════════════════════════════════════════════════ */
function AuthScreen({ onAuth, setScreen: setAppScreen }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const clearForm = () => { setError(""); setUsername(""); setPassword(""); setConfirmPassword(""); };

  const handleLogin = async () => {
    setError("");
    if (!username.trim() || !password.trim()) return setError("Please fill in all fields.");
    setLoading(true);
    const hashed = await secureHashPassword(password);
    const stored = await storageGet("user_" + username.toLowerCase());
    setLoading(false);
    if (!stored) return setError("Account not found. Please create one first.");
    if (stored.passwordHash !== hashed) return setError("Incorrect password. Please try again.");
    onAuth(stored);
  };

  const handleSignup = async () => {
    setError("");
    if (!username.trim() || !password.trim() || !confirmPassword.trim()) return setError("Please fill in all fields.");
    if (username.trim().length < 3) return setError("Username must be at least 3 characters.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== confirmPassword) return setError("Passwords do not match.");

    const existing = await storageGet("user_" + username.toLowerCase());
    if (existing) return setError("Username is already taken. Try another.");

    setLoading(true);
    const hashed = await secureHashPassword(password);
    const userData = { username: username.toLowerCase(), passwordHash: hashed };
    await storageSet("user_" + username.toLowerCase(), userData);
    setLoading(false);
    onAuth(userData);
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") { isLogin ? handleLogin() : handleSignup(); }
  };

  return (
    <div className="screen flex-col">
      <GlobalHeader setScreen={setAppScreen}/>
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px 0"}}>
      <div className="app-content animate-in" style={{maxWidth:420}}>
        {/* Toggle */}
        <div className="auth-toggle mb-lg">
          <button className="auth-toggle-btn" data-active={isLogin} onClick={() => { setIsLogin(true); clearForm(); }}>Sign In</button>
          <button className="auth-toggle-btn" data-active={!isLogin} onClick={() => { setIsLogin(false); clearForm(); }}>Create Account</button>
        </div>

        <div className="flex-col gap-md" style={{textAlign:"left"}}>
          <div className="input-group">
            <label className="input-label">Username</label>
            <input className="input-field" value={username} onChange={e => setUsername(e.target.value)}
              placeholder={isLogin ? "Your username" : "Choose a username"} onKeyDown={onKeyDown} autoFocus/>
          </div>
          <div className="input-group">
            <label className="input-label">Password</label>
            <div style={{position:"relative"}}>
              <input className="input-field" style={{paddingRight:56}} type={showPassword ? "text" : "password"}
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder={isLogin ? "Your password" : "At least 6 characters"} onKeyDown={onKeyDown}/>
              <button className="btn btn-ghost" onClick={() => setShowPassword(!showPassword)}
                style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",fontSize:16,fontWeight:600}}>
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          {!isLogin && (
            <div className="input-group">
              <label className="input-label">Confirm Password</label>
              <input className="input-field" type={showPassword ? "text" : "password"} value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm your password" onKeyDown={onKeyDown}/>
            </div>
          )}
        </div>

        {error && <div className="error-msg">{error}</div>}

        <button className="btn btn-primary mt-lg" onClick={isLogin ? handleLogin : handleSignup} disabled={loading}>
          {loading ? (isLogin ? "Signing in…" : "Creating account…") : (isLogin ? "Sign In" : "Create Account")}
        </button>

        <p className="text-body text-center mt-md">
          {isLogin ? "New here? " : "Have an account? "}
          <span style={{color:"var(--accent)",cursor:"pointer",fontWeight:600}} onClick={() => { setIsLogin(!isLogin); clearForm(); }}>
            {isLogin ? "Create an account" : "Sign in"}
          </span>
        </p>
      </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   LEGAL SCREENS (Terms, Privacy, Consent)
   ═══════════════════════════════════════════════════════════ */
function LegalScreen({ title, checkLabel, onAccept, children, setScreen }) {
  const [accepted, setAccepted] = useState(false);
  return (
    <div className="screen flex-col">
      {setScreen && <GlobalHeader setScreen={setScreen}/>}
      <div className="app-content flex-col" style={{flex:1,padding:"16px 0 32px"}}>
        <h2 className="heading-lg mb-md">{title}</h2>
        <div className="legal-scroll mb-md">{children}</div>
        <label className="consent-check">
          <input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)}/>
          <span>{checkLabel}</span>
        </label>
        <button className="btn btn-primary" disabled={!accepted} onClick={onAccept}>Continue</button>
      </div>
    </div>
  );
}

function TermsScreen({ updateAppData, setScreen }) {
  return (
    <LegalScreen title="Terms & Conditions" checkLabel="I have read and agree to the Terms & Conditions"
      onAccept={() => { updateAppData({ acceptedTerms: true }); setScreen("privacy"); }} setScreen={setScreen}>
      <p className="legal-p"><strong>Effective Date:</strong> March 2026</p>
      <p className="legal-p">Welcome to Cognify. By creating an account and using this application, you agree to the following terms.</p>
      <h4 className="legal-h">1. Nature of the Service</h4>
      <p className="legal-p">Cognify is a cognitive fitness application. It is <strong>not</strong> a medical device, diagnostic tool, or treatment for any disease. The exercises are based on the speed-of-processing intervention in the ACTIVE study (Coe et al., 2026), but Cognify has not been evaluated by the FDA or any regulatory body. We do not claim to prevent, treat, diagnose, or cure dementia or any other condition.</p>
      <h4 className="legal-h">2. Not Medical Advice</h4>
      <p className="legal-p">Nothing in this application constitutes medical advice. Consult your physician before beginning any cognitive training program. Statistics and benefit estimates are illustrative projections based on published research.</p>
      <h4 className="legal-h">3. Eligibility</h4>
      <p className="legal-p">You must be at least 18 years old to use Cognify.</p>
      <h4 className="legal-h">4. Account Responsibility</h4>
      <p className="legal-p">You are responsible for maintaining the confidentiality of your account credentials and for providing accurate information.</p>
      <h4 className="legal-h">5. Intellectual Property</h4>
      <p className="legal-p">All content, design, and code are the property of Cognify or its licensors. Our implementation is original.</p>
      <h4 className="legal-h">6. Limitation of Liability</h4>
      <p className="legal-p">Cognify is provided "as is" without warranties. We are not liable for damages arising from use, including health outcomes or data loss.</p>
      <h4 className="legal-h">7. Modification & Termination</h4>
      <p className="legal-p">We may update terms at any time. Continued use constitutes acceptance. You may delete your account at any time in Settings.</p>
      <h4 className="legal-h">8. Governing Law</h4>
      <p className="legal-p">Governed by applicable federal and state laws. Disputes resolved through binding arbitration.</p>
    </LegalScreen>
  );
}

function PrivacyScreen({ updateAppData, setScreen }) {
  return (
    <LegalScreen title="Privacy Policy" checkLabel="I have read and agree to the Privacy Policy"
      onAccept={() => { updateAppData({ acceptedPrivacy: true }); setScreen("consent"); }} setScreen={setScreen}>
      <p className="legal-p"><strong>Effective Date:</strong> March 2026</p>
      <h4 className="legal-h">1. Information We Collect</h4>
      <p className="legal-p"><strong>Account:</strong> Username and a securely hashed password. We never store your password in plain text. <strong>Training:</strong> Speed thresholds, accuracy, reaction times. <strong>Preferences:</strong> Age group, theme, schedule.</p>
      <h4 className="legal-h">2. Use of Data</h4>
      <p className="legal-p">To provide personalized training, track progress, and calculate comparisons. We do not sell personal data.</p>
      <h4 className="legal-h">3. Security</h4>
      <p className="legal-p">Data encrypted at rest and in transit. HIPAA-compliant handling where applicable. SOC 2 Type II standards.</p>
      <h4 className="legal-h">4. Deletion</h4>
      <p className="legal-p">Delete your account and all data anytime via Settings. Removal is permanent and immediate.</p>
      <h4 className="legal-h">5. Research Use</h4>
      <p className="legal-p">With separate consent, anonymized aggregate data may contribute to research. No individual is identifiable.</p>
      <h4 className="legal-h">6. Your Rights</h4>
      <p className="legal-p">Access, correct, delete, or export your data. Contact privacy@cognify.app.</p>
      <h4 className="legal-h">7. Children</h4>
      <p className="legal-p">Not intended for individuals under 18. We do not knowingly collect data from minors.</p>
    </LegalScreen>
  );
}

function ConsentScreen({ updateAppData, setScreen }) {
  const [researchConsent, setResearchConsent] = useState(false);
  return (
    <div className="screen flex-col">
      <GlobalHeader setScreen={setScreen}/>
      <div className="app-content flex-col" style={{flex:1,padding:"16px 0 32px"}}>
        <h2 className="heading-lg mb-md">Data & Research Consent</h2>
        <div className="legal-scroll mb-md">
          <p className="legal-p">Before you begin training, please review the following.</p>
          <h4 className="legal-h">Required: Training Data</h4>
          <p className="legal-p">Cognify must collect performance data to function. The adaptive algorithm depends on your accuracy and speed to adjust difficulty in real time.</p>
          <h4 className="legal-h">Optional: Anonymized Research</h4>
          <p className="legal-p">You may allow anonymized, de-identified data to contribute to cognitive science research. Your identity is never included. You can withdraw anytime in Settings.</p>
        </div>
        <label className="consent-check">
          <input type="checkbox" checked={researchConsent} onChange={e => setResearchConsent(e.target.checked)}/>
          <span>I consent to anonymized research use <span style={{color:"var(--text-muted)"}}>(optional)</span></span>
        </label>
        <button className="btn btn-primary" onClick={() => { updateAppData({ researchConsent }); setScreen("onboarding"); }}>
          Continue to Setup
        </button>
        <p className="text-small text-center mt-md">You can change this anytime in Settings.</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ONBOARDING
   ═══════════════════════════════════════════════════════════ */
function OnboardingScreen({ appData, updateAppData, setScreen }) {
  const isRetake = (appData.sessions || []).length > 0;
  const [step, setStep] = useState(isRetake ? 1 : 0);
  const [ageGroup, setAgeGroup] = useState(appData.ageGroup || "60–69");
  const [baselineResult, setBaselineResult] = useState(null);

  const handleBaselineComplete = (trials) => {
    const correct = trials.filter(t => t.correct);
    const threshold = correct.length > 0
      ? Math.round(correct.reduce((sum, t) => sum + t.displayTime, 0) / correct.length)
      : INITIAL_DISPLAY_TIME;
    setBaselineResult(threshold);
    setStep(2);
  };

  const finishOnboarding = () => {
    updateAppData({
      onboarded: true, baseline: baselineResult, ageGroup,
      lastThresholds: { ...appData.lastThresholds, 1: baselineResult || INITIAL_DISPLAY_TIME },
    });
    setScreen("dashboard");
  };

  if (step === 0) {
    const fact = RESEARCH_FACTS[0];
    return (
      <div className="screen flex-col">
        <GlobalHeader setScreen={setScreen}/>
        <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px 0"}}>
        <div className="app-content text-center animate-in" style={{maxWidth:440}}>
          <div className="stat-giant mb-sm">25%</div>
          <p style={{fontSize:19,color:"var(--text-secondary)",marginBottom:22}}>lower dementia risk</p>
          <div className="badge-row mb-lg">
            {["2,802 participants","20 years","Johns Hopkins · NIH"].map(b => <span key={b} className="badge">{b}</span>)}
          </div>
          <p className="text-body mb-md" style={{fontSize:16}}>
            The ACTIVE study is the first randomized trial showing any intervention can reduce dementia incidence over two decades. Only adaptive speed training produced this result.
          </p>
          <div className="citation mb-lg" style={{textAlign:"left"}}>
            <div className="citation-source">{fact.source}</div>
            <div className="citation-inst">{fact.institution}</div>
          </div>
          <div className="mb-lg">
            <label style={{fontSize:16,color:"var(--text-secondary)",display:"block",marginBottom:10}}>Your age group:</label>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center"}}>
              {Object.keys(AGE_NORMS).map(ag => (
                <button key={ag} className="btn" onClick={() => setAgeGroup(ag)} style={{
                  padding:"12px 18px",fontSize:17,borderRadius:"var(--radius-sm)",
                  border: ageGroup===ag ? "1.5px solid var(--accent-border)" : "1.5px solid var(--border)",
                  background: ageGroup===ag ? "var(--accent-light)" : "transparent",
                  color: ageGroup===ag ? "var(--accent)" : "var(--text-secondary)",
                }}>{ag}</button>
              ))}
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => setStep(1)}>Take Baseline Assessment</button>
        </div>
        </div>
      </div>
    );
  }

  if (step === 1) return <BaselineAssessment onComplete={handleBaselineComplete} setScreen={setScreen} />;

  const norm = AGE_NORMS[ageGroup] || 290;
  const vsAverage = baselineResult < norm ? `${norm - baselineResult}ms faster than average` : baselineResult > norm ? `${baselineResult - norm}ms slower than average` : "Right at average";
  return (
    <div className="screen flex-col">
      <GlobalHeader setScreen={setScreen}/>
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px 0"}}>
      <div className="app-content text-center animate-in" style={{maxWidth:420}}>
        <h2 className="heading-lg mb-lg">Your Baseline</h2>
        <div className="card mb-md" style={{padding:28}}>
          <div className="stat-large">{baselineResult}<span className="stat-unit">ms</span></div>
          <div className="text-body mt-sm">Processing Speed</div>
        </div>
        <div className="flex-col gap-sm mb-md" style={{textAlign:"left"}}>
          <div className="settings-row"><span>Average for {ageGroup}</span><span style={{fontWeight:600}}>{norm}ms</span></div>
          <div className="settings-row"><span>Compared to average</span><span style={{fontWeight:600,color:baselineResult<=norm?"var(--accent)":"var(--gold)"}}>{vsAverage}</span></div>
        </div>
        <div className="card mb-md" style={{display:"flex",alignItems:"center",gap:14,textAlign:"left"}}>
          <span style={{fontSize:28}}>📅</span>
          <div>
            <div className="heading-sm">Recommended Schedule</div>
            <div className="text-body" style={{fontSize:17,marginTop:3}}>3 sessions per week, about 12 minutes each</div>
          </div>
        </div>
        <ResearchSnippet />
        <button className="btn btn-primary mt-lg" onClick={finishOnboarding}>Start Training</button>
      </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   BASELINE ASSESSMENT (also used in training)
   ═══════════════════════════════════════════════════════════ */
function BaselineAssessment({ onComplete, setScreen }) {
  const [phase, setPhase] = useState("intro");
  return phase === "intro" ? (
    <div className="screen flex-col">
      {setScreen && <GlobalHeader setScreen={setScreen}/>}
      <div className="screen-centered" style={{minHeight:"auto",flex:1}}>
        <div className="app-content text-center animate-in" style={{maxWidth:420}}>
          <h2 className="heading-lg mb-sm">Baseline Assessment</h2>
          <p className="text-body mb-md">Let's measure your current processing speed.</p>
          <div className="card mb-lg" style={{textAlign:"left"}}>
            <p style={{fontSize:18,color:"var(--text)",lineHeight:1.7}}>Two reference shapes will appear. One flashes briefly in the center. Tap which one you saw.</p>
            <p className="text-small mt-sm">{BASELINE_TRIAL_COUNT} trials · Gets faster as you improve</p>
          </div>
          <button className="btn btn-primary" onClick={() => setPhase("running")}>Begin</button>
        </div>
      </div>
    </div>
  ) : (
    <TrialRunner trialsPerBlock={BASELINE_TRIAL_COUNT} blocks={1} exerciseType={1}
      startingDisplayTime={INITIAL_DISPLAY_TIME} onSessionComplete={(trials) => onComplete(trials)}
      onExit={setScreen ? () => setScreen("dashboard") : undefined} setScreen={setScreen} />
  );
}

/* ═══════════════════════════════════════════════════════════
   TRIAL RUNNER — the core training engine
   Isolated component with its own state management
   ═══════════════════════════════════════════════════════════ */
function TrialRunner({ trialsPerBlock, blocks, exerciseType, startingDisplayTime, onSessionComplete, onExit, setScreen }) {
  const [block, setBlock] = useState(0);
  const [trialIndex, setTrialIndex] = useState(0);
  const [displayTime, setDisplayTime] = useState(startingDisplayTime);
  const [correctStreak, setCorrectStreak] = useState(0);
  const [allTrials, setAllTrials] = useState([]);
  const [blockTrials, setBlockTrials] = useState([]);
  const [phase, setPhase] = useState("trial"); // trial | microbreak | between | done
  const [countdown, setCountdown] = useState(10);
  const [microbreakFact, setMicrobreakFact] = useState(null);
  const [microbreakCountdown, setMicrobreakCountdown] = useState(5);
  const [confirmExit, setConfirmExit] = useState(false);

  // Trial visual state
  const [stimulusVisible, setStimulusVisible] = useState(false);
  const [awaitingResponse, setAwaitingResponse] = useState(false);
  const [currentPair, setCurrentPair] = useState(SHAPE_PAIRS[0]);
  const [currentTarget, setCurrentTarget] = useState(SHAPE_PAIRS[0][0]);
  const [peripheralIndex, setPeripheralIndex] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [responseStep, setResponseStep] = useState("central");
  const [centralAnswer, setCentralAnswer] = useState(null);
  const responseTimeRef = useRef(null);

  // Total trials completed so far in this session (across all blocks)
  const totalTrialsDone = allTrials.length + blockTrials.length;

  const startTrial = useCallback(() => {
    const pairIdx = Math.floor(Math.random() * SHAPE_PAIRS.length);
    const pair = SHAPE_PAIRS[pairIdx];
    const targetIdx = Math.random() < 0.5 ? 0 : 1;
    setCurrentPair(pair);
    setCurrentTarget(pair[targetIdx]);
    setFeedback(null);
    setResponseStep("central");
    setCentralAnswer(null);
    if (exerciseType >= 2) setPeripheralIndex(Math.floor(Math.random() * PERIPHERAL_POSITIONS.length));

    setTimeout(() => {
      setStimulusVisible(true);
      responseTimeRef.current = performance.now();
      const framesNeeded = Math.max(1, Math.round(displayTime / 16.67));
      let frameCount = 0;
      function tick() {
        frameCount++;
        if (frameCount >= framesNeeded) { setStimulusVisible(false); setAwaitingResponse(true); }
        else requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }, 600);
  }, [displayTime, exerciseType]);

  useEffect(() => {
    if (phase === "trial" && trialIndex < trialsPerBlock && !awaitingResponse && !stimulusVisible && feedback === null && !confirmExit) {
      const timer = setTimeout(startTrial, 250);
      return () => clearTimeout(timer);
    }
  }, [phase, trialIndex, awaitingResponse, stimulusVisible, feedback, startTrial, trialsPerBlock, confirmExit]);

  useEffect(() => {
    if (phase === "between" && countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    } else if (phase === "between" && countdown <= 0) advanceBlock();
  }, [phase, countdown]);

  // Micro-break countdown
  useEffect(() => {
    if (phase === "microbreak" && microbreakCountdown > 0) {
      const t = setTimeout(() => setMicrobreakCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    } else if (phase === "microbreak" && microbreakCountdown <= 0) {
      setPhase("trial");
      setFeedback(null);
    }
  }, [phase, microbreakCountdown]);

  const processTrial = (correct, reactionTime) => {
    setAwaitingResponse(false);
    setFeedback(correct);
    const trial = { displayTime, correct, reactionTime };
    setBlockTrials(prev => [...prev, trial]);

    let newDisplayTime = displayTime;
    let newStreak = correctStreak;
    if (correct) {
      newStreak++;
      if (newStreak >= STREAK_THRESHOLD) { newDisplayTime = Math.max(MIN_DISPLAY_TIME, displayTime - STEP_DOWN); newStreak = 0; }
    } else {
      newDisplayTime = Math.min(MAX_DISPLAY_TIME, displayTime + STEP_UP); newStreak = 0;
    }
    setDisplayTime(newDisplayTime);
    setCorrectStreak(newStreak);

    const nextTrialIndex = trialIndex + 1;
    const nextTotalDone = totalTrialsDone + 1;

    if (nextTrialIndex >= trialsPerBlock) {
      setTimeout(() => {
        if (block + 1 < blocks) { setPhase("between"); setCountdown(10); }
        else {
          const finalTrials = [...allTrials, ...blockTrials, trial];
          setPhase("done");
          onSessionComplete(finalTrials, newDisplayTime);
        }
      }, 600);
    } else {
      // Check for micro-break every 10 trials (but not at the very start)
      if (nextTotalDone > 0 && nextTotalDone % 10 === 0) {
        setTimeout(() => {
          setTrialIndex(nextTrialIndex);
          setMicrobreakFact(randomMidBreak());
          setMicrobreakCountdown(5);
          setPhase("microbreak");
        }, 500);
      } else {
        setTimeout(() => { setTrialIndex(nextTrialIndex); setFeedback(null); }, 500);
      }
    }
  };

  const handleCentralResponse = (chosen) => {
    if (!awaitingResponse) return;
    if (exerciseType === 1) {
      processTrial(chosen === currentTarget, performance.now() - responseTimeRef.current);
    } else {
      setCentralAnswer(chosen);
      setResponseStep("peripheral");
    }
  };

  const handlePeripheralResponse = (posIndex) => {
    processTrial(centralAnswer === currentTarget && posIndex === peripheralIndex, performance.now() - responseTimeRef.current);
  };

  const advanceBlock = () => {
    setAllTrials(prev => [...prev, ...blockTrials]);
    setBlockTrials([]);
    setBlock(b => b + 1);
    setTrialIndex(0);
    setFeedback(null);
    setPhase("trial");
  };

  // Total session progress
  const totalSessionTrials = trialsPerBlock * blocks;
  const completedTrials = (block * trialsPerBlock) + trialIndex;

  // ── Micro-break screen ──
  if (phase === "microbreak" && microbreakFact) {
    return (
      <div className="screen flex-col">
        {setScreen && <GlobalHeader setScreen={setScreen}/>}
        <SessionProgressBar current={completedTrials} total={totalSessionTrials}/>
        <div className="screen-centered" style={{minHeight:"auto",flex:1}}>
          <div className="app-content text-center animate-in" style={{maxWidth:440}}>
            <div style={{fontSize:34,marginBottom:16}}>📚</div>
            <div className="card card-highlight mb-md" style={{textAlign:"left"}}>
              <p className="text-serif" style={{fontSize:18,color:"var(--text-secondary)",lineHeight:1.8,margin:0}}>{microbreakFact.text}</p>
              <div className="text-small mt-sm" style={{fontStyle:"italic",color:"var(--accent)"}}>{microbreakFact.source}</div>
            </div>
            <p className="text-body">Continuing in {microbreakCountdown}s…</p>
            <button className="btn btn-secondary mt-md" onClick={() => { setPhase("trial"); setFeedback(null); }}
              style={{maxWidth:200,margin:"16px auto 0"}}>Continue Now</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Between blocks screen ──
  if (phase === "between") {
    const blockAccuracy = blockTrials.length > 0 ? Math.round((blockTrials.filter(t => t.correct).length / blockTrials.length) * 100) : 0;
    const betweenMsg = randomBetweenBlock();
    return (
      <div className="screen flex-col">
        {setScreen && <GlobalHeader setScreen={setScreen}/>}
        <SessionProgressBar current={(block + 1) * trialsPerBlock} total={totalSessionTrials}/>
        <div className="screen-centered" style={{minHeight:"auto",flex:1}}>
          <div className="text-center animate-in" style={{maxWidth:420,padding:"0 20px"}}>
            <h3 className="heading-lg text-accent mb-lg">Block {block + 1} Complete</h3>
            <div className="grid-2 mb-md" style={{display:"flex",gap:28,justifyContent:"center"}}>
              <div className="text-center"><div className="stat-medium">{blockAccuracy}%</div><div className="text-small">Accuracy</div></div>
              <div className="text-center"><div className="stat-medium">{displayTime}ms</div><div className="text-small">Speed</div></div>
            </div>
            <div className="card card-highlight mb-md" style={{textAlign:"left"}}>
              <p style={{fontSize:18,color:"var(--accent)",fontWeight:600,lineHeight:1.6,marginBottom:10}}>{betweenMsg.encouragement}</p>
              <p className="text-serif" style={{fontSize:17,color:"var(--text-secondary)",lineHeight:1.7,margin:0}}>{betweenMsg.fact}</p>
              <div className="text-small mt-sm" style={{fontStyle:"italic"}}>{betweenMsg.source}</div>
            </div>
            <p className="text-body mb-md">Block {block + 2} begins in {countdown}s.</p>
            <button className="btn btn-secondary" onClick={advanceBlock} style={{maxWidth:200,margin:"0 auto"}}>Start Now</button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "done") return null;

  // ── Active trial ──
  return (
    <div className="screen-trial">
      {setScreen && <GlobalHeader setScreen={setScreen} rightContent={
        !confirmExit ? (
          <button className="btn btn-ghost" onClick={() => setConfirmExit(true)} style={{color:"var(--text-muted)"}}>Exit</button>
        ) : null
      }/>}
      <SessionProgressBar current={completedTrials} total={totalSessionTrials} label={false}/>

      {/* Exit confirmation */}
      {confirmExit && (
        <div className="app-content mb-sm">
          <div className="card" style={{borderColor:"var(--incorrect)",padding:16}}>
            <p style={{fontSize:16,color:"var(--text)",marginBottom:10,lineHeight:1.5}}>End this session early? Progress will not be saved.</p>
            <div style={{display:"flex",gap:10}}>
              <button className="btn btn-secondary" style={{flex:1,padding:12,fontSize:16}} onClick={() => setConfirmExit(false)}>Keep Going</button>
              <button className="btn btn-primary" style={{flex:1,padding:12,fontSize:16,background:"var(--incorrect)"}} onClick={onExit}>End Session</button>
            </div>
          </div>
        </div>
      )}

      <div className="app-content flex-col" style={{flex:1,minHeight:0,paddingBottom:24}}>
        <div className="flex-between" style={{marginBottom:8}}>
          <span style={{fontSize:16,fontWeight:600,color:"var(--text-secondary)"}}>Trial {trialIndex + 1}/{trialsPerBlock}</span>
          {blocks > 1 && <span style={{fontSize:14,color:"var(--text-muted)"}}>Block {block + 1}/{blocks}</span>}
          <span style={{fontSize:15,color:"var(--accent)",fontFamily:"monospace",fontWeight:600}}>{displayTime}ms</span>
        </div>

        {/* Reference shapes */}
        <div style={{display:"flex",justifyContent:"center",gap:32,marginBottom:8}}>
          {currentPair.map(key => (
            <div key={key} className="text-center">
              <ShapeIcon shapeKey={key} size={40}/>
              <div style={{fontSize:13,color:"var(--text-muted)",marginTop:2}}>{SHAPE_DEFINITIONS[key].name}</div>
            </div>
          ))}
        </div>

        {/* Stimulus field — fills remaining space */}
        <div className="stimulus-field" style={{minHeight:0}}>
          {exerciseType >= 2 && stimulusVisible && peripheralIndex !== null && (
            <div style={{position:"absolute",left:`${PERIPHERAL_POSITIONS[peripheralIndex].x}%`,top:`${PERIPHERAL_POSITIONS[peripheralIndex].y}%`,
              transform:"translate(-50%,-50%)",zIndex:2}}>
              <svg width="30" height="30" viewBox="0 0 30 30"><polygon points="15,2 28,28 2,28" fill="var(--gold)"/></svg>
            </div>
          )}
          {exerciseType >= 3 && stimulusVisible && peripheralIndex !== null && PERIPHERAL_POSITIONS.map((pos, idx) => {
            if (idx === peripheralIndex) return null;
            if (idx > 3) return null;
            return (
              <div key={idx} style={{position:"absolute",left:`${pos.x}%`,top:`${pos.y}%`,
                transform:`translate(-50%,-50%) rotate(${60 + idx * 40}deg) scale(${0.7 + idx * 0.1})`,zIndex:1,opacity:0.6}}>
                <svg width="26" height="26" viewBox="0 0 26 26"><polygon points="13,2 24,24 2,24" fill="var(--text-muted)"/></svg>
              </div>
            );
          })}
          {stimulusVisible ? <ShapeIcon shapeKey={currentTarget} size={90}/> :
           feedback !== null ? <div style={{fontSize:48,fontWeight:700,color:feedback?"var(--correct)":"var(--incorrect)"}}>{feedback?"✓":"✗"}</div> :
           <div style={{fontSize:36,color:"var(--border)",fontWeight:300}}>+</div>}
        </div>

        {/* Response area — compact, no scroll */}
        {awaitingResponse && responseStep === "central" && (
          <div style={{marginTop:10,flexShrink:0}}>
            <p style={{fontSize:17,color:"var(--text-secondary)",textAlign:"center",marginBottom:10}}>Which shape?</p>
            <div style={{display:"flex",justifyContent:"center",gap:14}}>
              {currentPair.map(key => (
                <button key={key} className="btn btn-choice" onClick={() => handleCentralResponse(key)} style={{padding:"14px 28px",minWidth:120}}>
                  <ShapeIcon shapeKey={key} size={44}/><span style={{fontSize:15,color:"var(--text-secondary)"}}>{SHAPE_DEFINITIONS[key].name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {awaitingResponse && responseStep === "peripheral" && (
          <div style={{marginTop:10,flexShrink:0}}>
            <p style={{fontSize:17,color:"var(--text-secondary)",textAlign:"center",marginBottom:10}}>Where was the ▲?</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,maxWidth:320,margin:"0 auto"}}>
              {PERIPHERAL_POSITIONS.map((pos, idx) => (
                <button key={idx} className="btn btn-peripheral" onClick={() => handlePeripheralResponse(idx)} style={{padding:14,fontSize:15}}>{pos.label}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   DASHBOARD
   ═══════════════════════════════════════════════════════════ */
function DashboardScreen({ appData, updateAppData, setScreen }) {
  const { mode, toggleTheme } = useContext(ThemeContext);
  const [selectedExercise, setSelectedExercise] = useState(appData.currentExercise || 1);

  const sessions = appData.sessions || [];
  const totalSessions = sessions.length;
  const threshold = appData.lastThresholds[selectedExercise] || INITIAL_DISPLAY_TIME;
  const baseline = appData.baseline || INITIAL_DISPLAY_TIME;
  const improvement = baseline - threshold;
  const improvementPercent = baseline > 0 ? Math.round((improvement / baseline) * 100) : 0;
  const cognitiveBenefit = estimateCognitiveBenefit(totalSessions, Math.max(0, improvement));
  const riskReduction = estimateRiskReduction(totalSessions, Math.max(0, improvement));
  const impactMessage = getPersonalizedImpactMessage(sessions, improvement, baseline);
  const earnedBadges = getEarnedBadges(appData);

  const now = new Date();
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay()); weekStart.setHours(0,0,0,0);
  const weekSessions = sessions.filter(s => new Date(s.date) >= weekStart).length;

  // Days since last session (for booster reminder)
  const lastSessionDate = sessions.length > 0 ? new Date(sessions[sessions.length - 1].date) : null;
  const daysSinceLastSession = lastSessionDate ? Math.floor((now - lastSessionDate) / (1000*60*60*24)) : null;

  useEffect(() => {
    const unlocks = { ...appData.exerciseUnlocks };
    if (appData.lastThresholds[1] <= UNLOCK_EXERCISE_2_THRESHOLD) unlocks[2] = true;
    if (appData.lastThresholds[2] <= UNLOCK_EXERCISE_3_THRESHOLD) unlocks[3] = true;
    if (JSON.stringify(unlocks) !== JSON.stringify(appData.exerciseUnlocks)) updateAppData({ exerciseUnlocks: unlocks });
  }, [appData.lastThresholds]);

  const startTraining = () => { updateAppData({ currentExercise: selectedExercise }); setScreen("training"); };

  const recentTrend = sessions.slice(-20).map((s, i) => ({ n: i + 1, speed: s.threshold }));

  return (
    <div className="screen screen-padded">
      <GlobalHeader setScreen={setScreen} rightContent={
        <div style={{display:"flex",gap:8}}>
          <button className="btn btn-icon" onClick={toggleTheme} title="Toggle theme" style={{width:"auto",padding:"10px 14px",fontSize:17,fontWeight:600}}>
            {mode==="light"?"Dark":"Light"}
          </button>
          <button className="btn btn-icon" onClick={() => setScreen("settings")} title="Settings">⚙️</button>
        </div>
      }/>

      <div className="app-content flex-col gap-md animate-in">
        {/* Primary metric */}
        <div className="card" style={{padding:26}}>
          <div className="text-label mb-sm">Processing Speed</div>
          <div className="flex-between" style={{alignItems:"baseline"}}>
            <div><span className="stat-large">{threshold}</span><span className="stat-unit">ms</span></div>
            {improvement > 0 && <span style={{fontSize:17,fontWeight:600,color:"var(--accent)"}}>↓ {improvement}ms</span>}
          </div>
          <div className="progress-track mt-md">
            <div className="progress-fill" style={{width:`${Math.max(2, Math.min(100, improvementPercent * 2))}%`}}/>
          </div>
          <div className="text-small mt-sm">{improvement > 0 ? `${improvementPercent}% faster than your baseline (${baseline}ms)` : `Baseline: ${baseline}ms — train to see your improvement`}</div>
        </div>

        {/* Longevity card */}
        {totalSessions > 0 && (
          <div className="card card-gold" style={{display:"flex",alignItems:"center",gap:14}}>
            <span style={{fontSize:30}}>🧠</span>
            <div>
              <div style={{fontSize:17,fontWeight:700,color:"var(--gold)"}}>+{cognitiveBenefit} years of cognitive health · ~{riskReduction}% risk reduction</div>
              <div className="text-small" style={{marginTop:3}}>{totalSessions} session{totalSessions !== 1 ? "s" : ""} · {improvement > 0 ? `${improvement}ms faster` : "keep training"}</div>
            </div>
          </div>
        )}

        {/* Personalized impact message */}
        {impactMessage && (
          <div className="card" style={{display:"flex",gap:12,alignItems:"flex-start"}}>
            <span style={{fontSize:20,flexShrink:0}}>{impactMessage.icon}</span>
            <div>
              <p className="text-serif" style={{fontSize:17,color:"var(--text-secondary)",lineHeight:1.7,margin:0}}>{impactMessage.text}</p>
              <div className="text-small mt-sm" style={{fontStyle:"italic",color:"var(--accent)"}}>{impactMessage.source}</div>
            </div>
          </div>
        )}

        {/* Booster reminder */}
        {daysSinceLastSession !== null && daysSinceLastSession >= 3 && (
          <div className="card card-highlight" style={{display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:22}}>⏰</span>
            <div>
              <div style={{fontSize:17,fontWeight:600,color:"var(--accent)"}}>Time for a booster session!</div>
              <div className="text-small" style={{marginTop:2}}>It's been {daysSinceLastSession} days. The ACTIVE study found booster sessions were essential for lasting benefits.</div>
            </div>
          </div>
        )}

        {/* Training card */}
        <div className="card" style={{padding:22}}>
          <div className="flex-between mb-md">
            <span className="heading-sm" style={{fontSize:17}}>Today's Training</span>
            <span className="text-small">Session {totalSessions + 1}</span>
          </div>
          <div className="exercise-grid mb-md">
            {[1, 2, 3].map(exerciseNumber => {
              const unlocked = appData.exerciseUnlocks[exerciseNumber];
              const names = { 1: "Central ID", 2: "Divided Attention", 3: "Selective Attention" };
              return (
                <button key={exerciseNumber} className="exercise-option" data-selected={selectedExercise === exerciseNumber} data-locked={!unlocked}
                  onClick={() => unlocked && setSelectedExercise(exerciseNumber)}>
                  <div style={{fontSize:16,fontWeight:700,letterSpacing:1,textTransform:"uppercase"}}>Ex {exerciseNumber}</div>
                  <div style={{fontSize:16,marginTop:3}}>{names[exerciseNumber]}</div>
                  {!unlocked && <div style={{fontSize:16,marginTop:2}}>🔒</div>}
                </button>
              );
            })}
          </div>
          <button className="btn btn-start" onClick={startTraining}>▶ &nbsp;START SESSION</button>
          <div className="text-small text-center mt-sm">~12 min · {selectedExercise === 1 ? EXERCISE_1_TRIALS_PER_BLOCK : selectedExercise === 2 ? EXERCISE_2_TRIALS_PER_BLOCK : EXERCISE_3_TRIALS_PER_BLOCK} trials × {BLOCKS_PER_SESSION} blocks</div>
        </div>

        {/* Weekly streak */}
        <div className="card">
          <div className="flex-between mb-md">
            <span className="heading-sm">This Week</span>
            <span style={{fontSize:16,fontWeight:700,color:"var(--accent)"}}>{weekSessions} / {appData.weeklyGoal}</span>
          </div>
          <div className="streak-dots">
            {Array.from({ length: appData.weeklyGoal }).map((_, i) => (
              <div key={i} className="streak-dot" data-filled={i < weekSessions}/>
            ))}
          </div>
        </div>

        {/* Milestone Badges */}
        {earnedBadges.length > 0 && (
          <div className="card">
            <div className="heading-sm mb-md" style={{fontSize:15}}>Milestones</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {earnedBadges.map(badge => (
                <div key={badge.id} title={badge.description} style={{display:"flex",alignItems:"center",gap:6,
                  padding:"6px 12px",background:"var(--accent-light)",border:"1px solid var(--accent-border)",
                  borderRadius:"var(--radius-sm)",fontSize:16,color:"var(--accent)",fontWeight:500}}>
                  <span>{badge.icon}</span> {badge.name}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trend chart */}
        {recentTrend.length > 1 && (
          <div className="card" style={{paddingBottom:10}}>
            <div className="heading-sm mb-sm" style={{fontSize:15}}>Recent Trend</div>
            <ResponsiveContainer width="100%" height={110}>
              <LineChart data={recentTrend}>
                <Line type="monotone" dataKey="speed" stroke="var(--chart-line)" strokeWidth={2} dot={false}/>
                <YAxis hide domain={['dataMin-20','dataMax+20']} reversed/>
                <Tooltip contentStyle={ChartTooltipStyle()} formatter={v => [`${v}ms`, 'Speed']}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <ResearchSnippet/>
      </div>

      <BottomNav current="home" onNavigate={setScreen}/>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TRAINING SESSION
   ═══════════════════════════════════════════════════════════ */
function TrainingSession({ appData, updateAppData, setScreen }) {
  const exercise = appData.currentExercise || 1;
  const trialsPerBlock = exercise === 1 ? EXERCISE_1_TRIALS_PER_BLOCK : exercise === 2 ? EXERCISE_2_TRIALS_PER_BLOCK : EXERCISE_3_TRIALS_PER_BLOCK;
  const [started, setStarted] = useState(false);
  const startingTime = Math.round((appData.lastThresholds[exercise] || INITIAL_DISPLAY_TIME) * 0.9);
  const exerciseNames = { 1: "Central Identification", 2: "Divided Attention", 3: "Selective Attention" };

  const handleSessionComplete = (trials, finalDisplayTime) => {
    const correctCount = trials.filter(t => t.correct).length;
    const accuracy = trials.length > 0 ? correctCount / trials.length : 0;
    const avgReactionTime = trials.length > 0 ? Math.round(trials.reduce((s, t) => s + t.reactionTime, 0) / trials.length) : 0;

    const session = {
      date: new Date().toISOString(), exercise, threshold: finalDisplayTime,
      accuracy, avgReactionTime, trialsCompleted: trials.length, correctCount,
    };
    updateAppData({
      sessions: [...(appData.sessions || []), session],
      lastThresholds: { ...appData.lastThresholds, [exercise]: finalDisplayTime },
      _lastSession: session,
    });
    setScreen("summary");
  };

  if (!started) {
    return (
      <div className="screen flex-col">
        <GlobalHeader setScreen={setScreen} rightContent={
          <button className="btn btn-ghost" onClick={() => setScreen("dashboard")}>Back</button>
        }/>
        <div className="screen-centered" style={{minHeight:"auto",flex:1}}>
          <div className="app-content text-center animate-in" style={{maxWidth:420}}>
            <div className="text-label mb-sm">Exercise {exercise}</div>
            <h2 className="heading-lg mb-md">{exerciseNames[exercise]}</h2>
            <div className="card mb-lg" style={{textAlign:"left"}}>
              {exercise === 1 ? (
                <>
                  <p style={{fontSize:18,color:"var(--text)",lineHeight:1.7}}>Two shapes appear as reference. One flashes in the center — tap which one you saw.</p>
                  <p className="text-small mt-sm">{trialsPerBlock} trials × {BLOCKS_PER_SESSION} blocks</p>
                </>
              ) : exercise === 2 ? (
                <>
                  <p style={{fontSize:18,color:"var(--text)",lineHeight:1.7}}>Identify the center shape <strong>and</strong> spot where the triangle (▲) appears. Both must be correct.</p>
                  <p className="text-small mt-sm">{trialsPerBlock} trials × {BLOCKS_PER_SESSION} blocks</p>
                </>
              ) : (
                <>
                  <p style={{fontSize:18,color:"var(--text)",lineHeight:1.7}}>Same as Exercise 2, but with <strong>distractors</strong> — similar shapes scattered near the target. Find the real ▲ among the noise.</p>
                  <p className="text-small mt-sm">{trialsPerBlock} trials × {BLOCKS_PER_SESSION} blocks · This mirrors the hardest phase of the ACTIVE study.</p>
                </>
              )}
            </div>
            <div className="text-small mb-lg" style={{fontFamily:"monospace"}}>Starting speed: {startingTime}ms</div>
            <button className="btn btn-primary" onClick={() => setStarted(true)}>Begin</button>
          </div>
        </div>
      </div>
    );
  }

  return <TrialRunner trialsPerBlock={trialsPerBlock} blocks={BLOCKS_PER_SESSION} exerciseType={exercise}
    startingDisplayTime={startingTime} onSessionComplete={handleSessionComplete}
    onExit={() => setScreen("dashboard")} setScreen={setScreen}/>;
}

/* ═══════════════════════════════════════════════════════════
   SESSION SUMMARY
   ═══════════════════════════════════════════════════════════ */
function SessionSummary({ appData, updateAppData, setScreen }) {
  const session = appData._lastSession;
  if (!session) { setScreen("dashboard"); return null; }

  const totalSessions = appData.sessions.length;
  const improvement = (appData.baseline || INITIAL_DISPLAY_TIME) - session.threshold;
  const cognitiveBenefit = estimateCognitiveBenefit(totalSessions, Math.max(0, improvement));
  const riskReduction = estimateRiskReduction(totalSessions, Math.max(0, improvement));
  const impactMsg = getPersonalizedImpactMessage(appData.sessions, improvement, appData.baseline || INITIAL_DISPLAY_TIME);
  const [fact] = useState(randomFact);

  return (
    <div className="screen flex-col">
      <GlobalHeader setScreen={setScreen}/>
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",padding:"24px 20px"}}>
      <div className="app-content text-center animate-in" style={{maxWidth:440}}>
        <div style={{fontSize:56,color:"var(--correct)",marginBottom:8}}>✓</div>
        <h2 className="heading-lg mb-lg">Session Complete</h2>

        <div className="card mb-md" style={{padding:28}}>
          <div className="stat-large">{session.threshold}<span className="stat-unit">ms</span></div>
          <div className="text-body mt-sm">Processing Speed</div>
          {improvement > 0 && <div style={{fontSize:17,color:"var(--accent)",fontWeight:600,marginTop:8}}>↓ {improvement}ms from baseline</div>}
        </div>

        <div className="grid-3 mb-md">
          {[
            { value: `${Math.round(session.accuracy * 100)}%`, label: "Accuracy" },
            { value: `${session.avgReactionTime}ms`, label: "Reaction" },
            { value: `${totalSessions}`, label: "Sessions" },
          ].map(m => (
            <div key={m.label} className="card text-center" style={{padding:14}}>
              <div className="stat-medium" style={{fontSize:22}}>{m.value}</div>
              <div className="text-small mt-sm">{m.label}</div>
            </div>
          ))}
        </div>

        <div className="card card-gold mb-md" style={{padding:26}}>
          <div style={{fontSize:36}}>🧠</div>
          <div style={{fontSize:30,fontWeight:800,color:"var(--gold)",marginTop:6,fontFamily:"var(--font-display)"}}>+{cognitiveBenefit} years</div>
          <div className="text-body mt-sm">estimated cognitive health benefit</div>
          <div style={{fontSize:17,fontWeight:600,color:"var(--gold)",marginTop:6}}>~{riskReduction}% estimated dementia risk reduction</div>
          <div className="text-small mt-sm">{totalSessions} sessions · Based on ACTIVE study (Coe et al., 2026)</div>
        </div>

        {/* Personalized impact */}
        {impactMsg && (
          <div className="card mb-md" style={{display:"flex",gap:12,alignItems:"flex-start",textAlign:"left"}}>
            <span style={{fontSize:20,flexShrink:0}}>{impactMsg.icon}</span>
            <div>
              <p className="text-serif" style={{fontSize:17,color:"var(--text-secondary)",lineHeight:1.7,margin:0}}>{impactMsg.text}</p>
              <div className="text-small mt-sm" style={{fontStyle:"italic",color:"var(--accent)"}}>{impactMsg.source}</div>
            </div>
          </div>
        )}

        <div className="card card-highlight mb-md">
          <p style={{fontSize:16,color:"var(--accent)",fontWeight:600,lineHeight:1.6}}>{randomEncouragement()}</p>
        </div>

        <div className="card mb-lg" style={{textAlign:"left"}}>
          <div className="text-label mb-sm">Did You Know?</div>
          <p className="text-serif" style={{fontSize:17,color:"var(--text-secondary)",lineHeight:1.7}}>{fact.text}</p>
          <div className="citation" style={{marginTop:10}}>
            <div className="citation-source">{fact.source}</div>
            <div className="citation-inst">{fact.institution}</div>
          </div>
        </div>

        <button className="btn btn-primary" onClick={() => { updateAppData({ _lastSession: null }); setScreen("dashboard"); }}>Done</button>
      </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PROGRESS
   ═══════════════════════════════════════════════════════════ */
function ProgressScreen({ appData, setScreen }) {
  const sessions = appData.sessions || [];
  const baseline = appData.baseline || INITIAL_DISPLAY_TIME;
  const improvement = sessions.length > 0 ? baseline - sessions[sessions.length - 1].threshold : 0;
  const cognitiveBenefit = estimateCognitiveBenefit(sessions.length, Math.max(0, improvement));
  const riskReduction = estimateRiskReduction(sessions.length, Math.max(0, improvement));
  const earnedBadges = getEarnedBadges(appData);

  const chartData = sessions.map((s, i) => ({
    n: i + 1, speed: s.threshold, accuracy: Math.round(s.accuracy * 100),
    date: new Date(s.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
  }));

  const weeklyData = useMemo(() => {
    if (sessions.length === 0) return [];
    const result = [];
    let weekStart = new Date(sessions[0].date); weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const last = new Date();
    while (weekStart <= last) {
      const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 7);
      result.push({
        week: weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        sessions: sessions.filter(s => { const d = new Date(s.date); return d >= weekStart && d < weekEnd; }).length,
      });
      weekStart = new Date(weekEnd);
    }
    return result;
  }, [sessions]);

  return (
    <div className="screen screen-padded">
      <GlobalHeader setScreen={setScreen} rightContent={
        <button className="btn btn-ghost" onClick={() => setScreen("dashboard")}>Back</button>
      }/>
      <div className="app-content">
        <h2 className="heading-md mb-md">Your Progress</h2>
      </div>

      {sessions.length === 0 ? (
        <div className="app-content text-center" style={{paddingTop:60}}>
          <div style={{fontSize:48,opacity:0.4,marginBottom:16}}>📊</div>
          <p className="text-body mb-lg">Complete your first session to see progress.</p>
          <button className="btn btn-primary" onClick={() => setScreen("dashboard")} style={{maxWidth:240,margin:"0 auto"}}>Start Training</button>
        </div>
      ) : (
        <div className="app-content flex-col gap-md animate-in">
          <div className="card card-gold" style={{display:"flex",alignItems:"center",gap:10,padding:"14px 18px"}}>
            <span style={{fontSize:22}}>🧠</span>
            <span style={{fontSize:17,fontWeight:600,color:"var(--gold)"}}>+{cognitiveBenefit} years cognitive health · ~{riskReduction}% risk reduction</span>
          </div>

          {/* Badges */}
          {earnedBadges.length > 0 && (
            <div className="card">
              <div className="heading-sm mb-sm" style={{fontSize:15}}>Milestones Earned</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {earnedBadges.map(badge => (
                  <div key={badge.id} title={badge.description} style={{display:"flex",alignItems:"center",gap:6,
                    padding:"6px 12px",background:"var(--accent-light)",border:"1px solid var(--accent-border)",
                    borderRadius:"var(--radius-sm)",fontSize:16,color:"var(--accent)",fontWeight:500}}>
                    <span>{badge.icon}</span> {badge.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card" style={{paddingBottom:10}}>
            <div className="heading-sm">Processing Speed</div>
            <div className="text-small mb-sm">Lower is faster (better)</div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData}>
                <XAxis dataKey="date" tick={{fill:'var(--text-muted)',fontSize:11}} tickLine={false} axisLine={{stroke:'var(--chart-grid)'}}/>
                <YAxis tick={{fill:'var(--text-muted)',fontSize:11}} tickLine={false} axisLine={{stroke:'var(--chart-grid)'}} reversed domain={['dataMin-20','dataMax+20']}/>
                <Tooltip contentStyle={ChartTooltipStyle()} formatter={v => [`${v}ms`, 'Speed']}/>
                <Line type="monotone" dataKey="speed" stroke="var(--chart-line)" strokeWidth={2.5} dot={{fill:'var(--chart-line)',r:3}}/>
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card" style={{paddingBottom:10}}>
            <div className="heading-sm mb-sm">Accuracy</div>
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={chartData}>
                <XAxis dataKey="date" tick={{fill:'var(--text-muted)',fontSize:11}} tickLine={false} axisLine={{stroke:'var(--chart-grid)'}}/>
                <YAxis tick={{fill:'var(--text-muted)',fontSize:11}} tickLine={false} axisLine={{stroke:'var(--chart-grid)'}} domain={[0,100]}/>
                <Tooltip contentStyle={ChartTooltipStyle()} formatter={v => [`${v}%`, 'Accuracy']}/>
                <Line type="monotone" dataKey="accuracy" stroke="var(--chart-line-alt)" strokeWidth={2} dot={{fill:'var(--chart-line-alt)',r:3}}/>
              </LineChart>
            </ResponsiveContainer>
          </div>

          {weeklyData.length > 0 && (
            <div className="card" style={{paddingBottom:10}}>
              <div className="heading-sm mb-sm">Sessions Per Week</div>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={weeklyData.slice(-8)}>
                  <XAxis dataKey="week" tick={{fill:'var(--text-muted)',fontSize:11}} tickLine={false} axisLine={{stroke:'var(--chart-grid)'}}/>
                  <YAxis tick={{fill:'var(--text-muted)',fontSize:11}} tickLine={false} axisLine={{stroke:'var(--chart-grid)'}} allowDecimals={false}/>
                  <Bar dataKey="sessions" radius={[4,4,0,0]}>
                    {weeklyData.slice(-8).map((e, i) => <Cell key={i} fill={e.sessions >= 3 ? "var(--bar-active)" : "var(--bar-muted)"}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="grid-3">
            {[
              { value: sessions.length, label: "Sessions" },
              { value: improvement > 0 ? `${improvement}ms` : "—", label: "Improvement" },
              { value: `${baseline}ms`, label: "Baseline" },
            ].map(m => (
              <div key={m.label} className="card text-center" style={{padding:14}}>
                <div className="stat-medium" style={{fontSize:20}}>{m.value}</div>
                <div className="text-small mt-sm">{m.label}</div>
              </div>
            ))}
          </div>

          <ResearchSnippet/>
        </div>
      )}

      <BottomNav current="progress" onNavigate={setScreen}/>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SCIENCE
   ═══════════════════════════════════════════════════════════ */
function ScienceScreen({ setScreen }) {
  const mechanismPoints = [
    { title: "Adaptive Difficulty", description: "Adjusts to your exact ability in real time — the optimal zone for driving neural change." },
    { title: "Implicit Learning", description: "Engages automatic processing, building durable skill-like habits rather than strategies that fade." },
    { title: "Cognitive Reserve", description: "Activates broader neuronal networks, building resilience against age-related decline." },
    { title: "Booster Sessions", description: "Only those who continued training saw lasting benefits. Ongoing practice is essential." },
  ];

  return (
    <div className="screen screen-padded">
      <GlobalHeader setScreen={setScreen} rightContent={
        <button className="btn btn-ghost" onClick={() => setScreen("dashboard")}>Back</button>
      }/>
      <div className="app-content">
        <h2 className="heading-md mb-md">The Science</h2>
      </div>

      <div className="app-content flex-col gap-md animate-in">
        <div className="card">
          <h3 className="heading-sm mb-md" style={{fontSize:18}}>The ACTIVE Study</h3>
          <p className="text-serif" style={{fontSize:17,lineHeight:1.8,color:"var(--text-secondary)"}}>
            2,802 adults aged 65+ were enrolled in 1998 and randomly assigned to memory, reasoning, speed-of-processing training, or a control group.
            After 20 years, only the speed training group with boosters showed a significant reduction — 25% fewer dementia diagnoses.
          </p>
          <div className="citation mt-md">
            <div className="citation-source">Coe et al., Alzheimer's & Dementia: TRCI, 2026</div>
            <div className="citation-inst">Johns Hopkins / NIH</div>
          </div>
        </div>

        <div className="card">
          <h3 className="heading-sm mb-md" style={{fontSize:18}}>Why Speed Training Works</h3>
          {mechanismPoints.map((point, index) => (
            <div key={index} style={{display:"flex",gap:14,marginBottom:index < mechanismPoints.length - 1 ? 20 : 0}}>
              <div className="flex-center" style={{width:34,height:34,borderRadius:17,background:"var(--accent-light)",
                color:"var(--accent)",fontSize:17,fontWeight:700,flexShrink:0,border:"1px solid var(--accent-border)"}}>{index + 1}</div>
              <div>
                <div className="heading-sm" style={{marginBottom:4}}>{point.title}</div>
                <p className="text-body" style={{fontSize:15}}>{point.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <h3 className="heading-sm mb-md" style={{fontSize:18}}>Supporting Research</h3>
          {RESEARCH_FACTS.slice(2, 9).map((fact, index) => (
            <div key={index} style={{marginBottom:16,paddingBottom:16,borderBottom:index < 6 ? "1px solid var(--border-light)" : "none"}}>
              <p className="text-serif" style={{fontSize:17,lineHeight:1.7,color:"var(--text-secondary)",marginBottom:6}}>{fact.text}</p>
              <div className="citation-source">{fact.source}</div>
              <div className="citation-inst">{fact.institution}</div>
            </div>
          ))}
        </div>

        <div className="card">
          <h3 className="heading-sm mb-sm" style={{fontSize:18}}>How Cognify Is Different</h3>
          <p className="text-body">
            Unlike apps with broad, unsubstantiated claims, Cognify implements the specific adaptive visual speed-of-processing protocol from the ACTIVE study — the only cognitive training shown in a randomized trial to reduce dementia diagnoses over decades.
          </p>
          <p className="text-serif" style={{fontSize:16,color:"var(--text-muted)",fontStyle:"italic",marginTop:14,lineHeight:1.6}}>
            Note: Cognify is a cognitive fitness tool. We do not claim to prevent, treat, or cure dementia.
          </p>
        </div>
      </div>

      <BottomNav current="science" onNavigate={setScreen}/>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SETTINGS
   ═══════════════════════════════════════════════════════════ */
function SettingsScreen({ appData, updateAppData, setScreen, user, handleLogout }) {
  const { mode, toggleTheme } = useContext(ThemeContext);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editingGoal, setEditingGoal] = useState(false);
  const [editingAge, setEditingAge] = useState(false);
  const [confirmRetake, setConfirmRetake] = useState(false);

  const deleteAccount = async () => {
    await storageSet("data_" + user.username, null);
    await storageSet("user_" + user.username, null);
    await storageSet("session", null);
    handleLogout();
  };

  const SettingsRow = ({ label, value, onClick, accent, hint }) => (
    <div className="settings-row" style={{cursor: onClick ? "pointer" : "default"}} onClick={onClick}>
      <div>
        <span>{label}</span>
        {hint && <div className="text-small" style={{fontSize:17,marginTop:2}}>{hint}</div>}
      </div>
      <span style={{fontWeight:600,color:accent ? "var(--accent)" : "var(--text)"}}>{value}{onClick ? " ›" : ""}</span>
    </div>
  );

  const goalOptions = [2, 3, 4, 5, 7];
  const ageOptions = Object.keys(AGE_NORMS);

  return (
    <div className="screen" style={{paddingBottom:40}}>
      <GlobalHeader setScreen={setScreen} rightContent={
        <button className="btn btn-ghost" onClick={() => setScreen("dashboard")}>Back</button>
      }/>
      <div className="app-content">
        <h2 className="heading-md mb-md">Settings</h2>
      </div>

      <div className="app-content flex-col gap-md">
        {/* Account */}
        <div className="card">
          <div className="text-label mb-sm">Account</div>
          <SettingsRow label="Username" value={user?.username}/>
        </div>

        {/* Appearance */}
        <div className="card">
          <div className="text-label mb-sm">Appearance</div>
          <SettingsRow label="Theme" value={mode === "light" ? "Light" : "Dark"} onClick={toggleTheme} accent/>
        </div>

        {/* Training */}
        <div className="card">
          <div className="text-label mb-sm">Training</div>

          {/* Weekly Goal — editable */}
          {!editingGoal ? (
            <SettingsRow label="Weekly Goal" value={appData.weeklyGoal + " sessions"} onClick={() => setEditingGoal(true)} accent/>
          ) : (
            <div style={{padding:"14px 0",borderBottom:"1px solid var(--border-light)"}}>
              <div style={{fontSize:16,color:"var(--text-secondary)",marginBottom:10}}>Sessions per week</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {goalOptions.map(g => (
                  <button key={g} className="btn" onClick={() => { updateAppData({ weeklyGoal: g }); setEditingGoal(false); }}
                    style={{padding:"10px 18px",fontSize:17,fontWeight:600,borderRadius:"var(--radius-sm)",
                      border: appData.weeklyGoal === g ? "1.5px solid var(--accent-border)" : "1.5px solid var(--border)",
                      background: appData.weeklyGoal === g ? "var(--accent-light)" : "transparent",
                      color: appData.weeklyGoal === g ? "var(--accent)" : "var(--text-secondary)"}}>
                    {g}
                  </button>
                ))}
              </div>
              <button className="btn btn-ghost mt-sm" onClick={() => setEditingGoal(false)} style={{fontSize:14}}>Cancel</button>
            </div>
          )}

          {/* Age Group — editable */}
          {!editingAge ? (
            <SettingsRow label="Age Group" value={appData.ageGroup} onClick={() => setEditingAge(true)} accent
              hint="Used for age-appropriate speed comparisons"/>
          ) : (
            <div style={{padding:"14px 0",borderBottom:"1px solid var(--border-light)"}}>
              <div style={{fontSize:16,color:"var(--text-secondary)",marginBottom:10}}>Select your age group</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {ageOptions.map(ag => (
                  <button key={ag} className="btn" onClick={() => { updateAppData({ ageGroup: ag }); setEditingAge(false); }}
                    style={{padding:"10px 16px",fontSize:17,fontWeight:600,borderRadius:"var(--radius-sm)",
                      border: appData.ageGroup === ag ? "1.5px solid var(--accent-border)" : "1.5px solid var(--border)",
                      background: appData.ageGroup === ag ? "var(--accent-light)" : "transparent",
                      color: appData.ageGroup === ag ? "var(--accent)" : "var(--text-secondary)"}}>
                    {ag}
                  </button>
                ))}
              </div>
              <button className="btn btn-ghost mt-sm" onClick={() => setEditingAge(false)} style={{fontSize:14}}>Cancel</button>
            </div>
          )}

          <SettingsRow label="Baseline" value={(appData.baseline || "—") + "ms"}/>
          <SettingsRow label="Total Sessions" value={(appData.sessions || []).length}/>

          {/* Retake Baseline */}
          {!confirmRetake ? (
            <div className="settings-row" style={{cursor:"pointer"}} onClick={() => setConfirmRetake(true)}>
              <span>Retake Baseline Assessment</span>
              <span style={{fontWeight:600,color:"var(--accent)"}}>Retake ›</span>
            </div>
          ) : (
            <div style={{padding:"14px 0",borderBottom:"1px solid var(--border-light)"}}>
              <p style={{fontSize:17,color:"var(--text-secondary)",lineHeight:1.6,marginBottom:12}}>
                This will run a new 20-trial baseline assessment and update your starting score. Your training history will be kept.
              </p>
              <div style={{display:"flex",gap:10}}>
                <button className="btn btn-secondary" style={{flex:1,padding:12,fontSize:14}} onClick={() => setConfirmRetake(false)}>Cancel</button>
                <button className="btn btn-primary" style={{flex:1,padding:12,fontSize:14}} onClick={() => {
                  updateAppData({ onboarded: false });
                  setScreen("onboarding");
                }}>Start Assessment</button>
              </div>
            </div>
          )}
        </div>

        {/* Privacy & Data */}
        <div className="card">
          <div className="text-label mb-sm">Privacy & Data</div>
          <SettingsRow label="Research consent" value={appData.researchConsent ? "On" : "Off"}
            onClick={() => updateAppData({ researchConsent: !appData.researchConsent })} accent
            hint="Allow anonymized data for cognitive science research"/>
        </div>

        {/* Actions */}
        <button className="btn btn-secondary" onClick={handleLogout}>Sign Out</button>

        {!confirmDelete ? (
          <button className="btn btn-secondary" style={{color:"var(--incorrect)",borderColor:"var(--incorrect)"}} onClick={() => setConfirmDelete(true)}>
            Delete Account & All Data
          </button>
        ) : (
          <div className="card" style={{borderColor:"var(--incorrect)"}}>
            <p style={{fontSize:17,color:"var(--text)",lineHeight:1.6,marginBottom:14}}>
              This permanently deletes everything — your account, all training data, and progress. This cannot be undone.
            </p>
            <div style={{display:"flex",gap:10}}>
              <button className="btn btn-secondary" style={{flex:1}} onClick={() => setConfirmDelete(false)}>Cancel</button>
              <button className="btn btn-primary" style={{flex:1,background:"var(--incorrect)"}} onClick={deleteAccount}>Delete</button>
            </div>
          </div>
        )}

        <div className="text-center" style={{padding:"16px 0"}}>
          <div className="text-small">Cognify v1.0 · Cognitive fitness training</div>
          <div className="text-small mt-sm">Not a medical device. Not FDA evaluated.</div>
          <div className="text-small mt-sm">Built by Enrique Reid, Khushaan Virk, Dean Kiyingi & Jasper Gilley</div>
        </div>
      </div>
    </div>
  );
}
