import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import { useTranslation, LANGUAGES } from "./src/i18n/index.jsx";

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
  display: flex; align-items: center; justify-content: center;
}
.btn-icon:hover { background: var(--bg-hover); }
.settings-btn { color: var(--text); border: 1.5px solid var(--border); }
.settings-btn:hover { color: var(--accent); border-color: var(--accent); }

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
.nav-icon { width: 22px; height: 22px; }
.nav-icon svg { width: 100%; height: 100%; stroke: currentColor; fill: none; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
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

/* ── Protocol Path ── */
.protocol-path { display: flex; flex-direction: column; gap: 0; position: relative; }
.protocol-node { display: flex; gap: 16px; position: relative; padding-bottom: 24px; }
.protocol-node:last-child { padding-bottom: 0; }
.protocol-node-line { position: absolute; left: 15px; top: 32px; bottom: 0; width: 2px; background: var(--border); }
.protocol-node:last-child .protocol-node-line { display: none; }
.protocol-node[data-completed="true"] .protocol-node-line { background: var(--accent); }
.protocol-node-dot {
  width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  border: 2px solid var(--border); background: var(--bg-card); font-size: 14px; color: var(--text-muted);
  position: relative; z-index: 1; transition: all 0.3s ease;
}
.protocol-node[data-completed="true"] .protocol-node-dot {
  border-color: var(--accent); background: var(--accent-light); color: var(--accent);
}
.protocol-node[data-current="true"] .protocol-node-dot {
  border-color: var(--accent); background: var(--accent); color: white;
  box-shadow: 0 0 0 4px var(--accent-glow);
}
.protocol-node-content { flex: 1; padding-top: 4px; }
.protocol-node-label { font-size: 17px; font-weight: 600; color: var(--text); }
.protocol-node[data-future="true"] .protocol-node-label { color: var(--text-muted); }
.protocol-node-detail { font-size: 15px; color: var(--text-secondary); margin-top: 2px; line-height: 1.5; }
.protocol-node[data-future="true"] .protocol-node-detail { color: var(--text-muted); }
.protocol-node-badge { font-size: 13px; color: var(--accent); font-weight: 600; margin-top: 4px; }

/* ── Badge Reveal Animation ── */
@keyframes badge-reveal { 0% { transform: scale(0.92); opacity: 0.6; } 100% { transform: scale(1); opacity: 1; } }
.badge-new { animation: badge-reveal 0.5s ease-out; }

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

/* ── Font Size Scaling ── */
[data-font-size="normal"] { --font-scale: 1; }
[data-font-size="large"] { --font-scale: 1.15; }
[data-font-size="extraLarge"] { --font-scale: 1.3; }

body { font-size: calc(16px * var(--font-scale, 1)); }
.heading-lg { font-size: calc(28px * var(--font-scale, 1)); }
.heading-md { font-size: calc(24px * var(--font-scale, 1)); }
.heading-sm { font-size: calc(18px * var(--font-scale, 1)); }
.text-body { font-size: calc(18px * var(--font-scale, 1)); }
.text-small { font-size: calc(16px * var(--font-scale, 1)); }
.text-label { font-size: calc(14px * var(--font-scale, 1)); }
.stat-giant { font-size: calc(62px * var(--font-scale, 1)); }
.stat-large { font-size: calc(50px * var(--font-scale, 1)); }
.stat-medium { font-size: calc(26px * var(--font-scale, 1)); }
.btn-primary { font-size: calc(19px * var(--font-scale, 1)); }
.btn-secondary { font-size: calc(18px * var(--font-scale, 1)); }
.btn-start { font-size: calc(20px * var(--font-scale, 1)); }
.input-field { font-size: calc(19px * var(--font-scale, 1)); }
.input-label { font-size: calc(17px * var(--font-scale, 1)); }
.nav-label { font-size: calc(13px * var(--font-scale, 1)); }
.settings-row { font-size: calc(18px * var(--font-scale, 1)); }
.legal-p { font-size: calc(17px * var(--font-scale, 1)); }
.legal-h { font-size: calc(18px * var(--font-scale, 1)); }

/* Cap font scaling on trial elements to avoid layout breakage */
.screen-trial .btn-peripheral { font-size: calc(16px * min(var(--font-scale, 1), 1.15)); }
.screen-trial .btn-choice { font-size: calc(15px * min(var(--font-scale, 1), 1.15)); }

/* ── High Contrast Mode ── */
[data-contrast="high"] {
  --text: #000000;
  --text-secondary: #1A1A1A;
  --text-muted: #444444;
  --bg: #FFFFFF;
  --bg-card: #FFFFFF;
  --bg-card-alt: #F0F0F0;
  --bg-input: #FFFFFF;
  --border: #333333;
  --border-light: #666666;
  --accent: #005500;
  --accent-hover: #004400;
  --accent-light: rgba(0,85,0,0.12);
  --accent-border: rgba(0,85,0,0.35);
  --accent-glow: rgba(0,85,0,0.15);
  --gold: #6B4A00;
  --gold-light: rgba(107,74,0,0.10);
  --gold-border: rgba(107,74,0,0.25);
  --correct: #005500;
  --incorrect: #990000;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.12);
  --shadow-md: 0 3px 10px rgba(0,0,0,0.15);
  --chart-line: #005500;
  --chart-grid: #999999;
  --bar-active: #005500;
  --bar-muted: #AAAAAA;
}
[data-contrast="high"] .card { border-width: 2px; }
[data-contrast="high"] .btn-primary { font-weight: 800; }
[data-contrast="high"] .btn-secondary { border-width: 2px; }
[data-contrast="high"] .input-field { border-width: 2px; }
[data-contrast="high"] .btn-peripheral { border-width: 2px; }

/* ── RTL Support (Arabic) ── */
[dir="rtl"] .flex-between { flex-direction: row-reverse; }
[dir="rtl"] .bottom-nav { direction: rtl; }
[dir="rtl"] .settings-row { flex-direction: row-reverse; }
[dir="rtl"] .global-header { flex-direction: row-reverse; }
[dir="rtl"] .app-content { direction: rtl; text-align: right; }
[dir="rtl"] .hero-cta-row { flex-direction: row-reverse; }
[dir="rtl"] .exercise-grid { direction: rtl; }
[dir="rtl"] .auth-toggle { flex-direction: row-reverse; }
[dir="rtl"] .stat-giant, [dir="rtl"] .stat-large, [dir="rtl"] .stat-medium { direction: ltr; }
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
const SESSION_MODES = {
  mini: { blocks: 1, label: "Mini (~6 min)", minutes: 6 },
  full: { blocks: 2, label: "Full (~12 min)", minutes: 12 },
};
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
const RESEARCH_FACT_COUNT = 13;
const SESSION_ENCOURAGEMENT_COUNT = 8;
const BETWEEN_BLOCK_COUNT = 4;
const MID_BREAK_COUNT = 10;

function getResearchFact(t, index) {
  return { text: t(`researchFact.${index}.text`), source: t(`researchFact.${index}.source`), institution: t(`researchFact.${index}.institution`) };
}
function getEncouragement(t, index) { return t(`encouragement.${index}`); }
function getBetweenBlockMsg(t, index) {
  return { encouragement: t(`betweenBlock.${index}.encouragement`), fact: t(`betweenBlock.${index}.fact`), source: t(`betweenBlock.${index}.source`) };
}
function getMidBreak(t, index) {
  return { text: t(`midBreak.${index}.text`), source: t(`midBreak.${index}.source`) };
}

function getPersonalizedImpactMessage(t, sessions, improvement, baseline) {
  const totalSessions = (sessions || []).length;

  const messages = [];

  if (totalSessions >= 1 && totalSessions < 5) {
    messages.push({ text: t("impact.earlyProgress", { count: totalSessions }), source: "Coe et al., Alzheimer's & Dementia: TRCI, 2026", icon: "📊" });
  }
  if (totalSessions >= 5 && totalSessions < 10) {
    messages.push({ text: t("impact.midProgress", { count: totalSessions }), source: "Coe et al., 2026", icon: "📉" });
  }
  if (totalSessions >= 10) {
    messages.push({ text: t("impact.coreComplete"), source: "Coe et al., 2026; Rebok et al., 2014", icon: "🏅" });
  }
  if (improvement > 20) {
    messages.push({ text: t("impact.speedImprovement", { improvement, percent: Math.round((improvement/baseline)*100) }), source: "Edwards et al., JAGS, 2005", icon: "⚡" });
  }
  if (improvement > 50) {
    messages.push({ text: t("impact.meaningfulImprovement", { improvement }), source: "Ball et al., JAGS, 2010", icon: "🚗" });
  }
  if (totalSessions >= 14) {
    messages.push({ text: t("impact.fullProtocol", { count: totalSessions }), source: "Coe et al., 2026", icon: "🧠" });
  }

  return messages.length > 0 ? messages[Math.floor(Math.random() * messages.length)] : null;
}

const randomFactIndex = () => Math.floor(Math.random() * RESEARCH_FACT_COUNT);
const randomEncouragementIndex = () => Math.floor(Math.random() * SESSION_ENCOURAGEMENT_COUNT);
const randomBetweenBlockIndex = () => Math.floor(Math.random() * BETWEEN_BLOCK_COUNT);

const randomMidBreakIndex = () => Math.floor(Math.random() * MID_BREAK_COUNT);

/* ═══════════════════════════════════════════════════════════
   SCORING & NORMS
   ═══════════════════════════════════════════════════════════ */
const AGE_NORMS = { "18–29": 180, "30–39": 195, "40–49": 210, "50–59": 250, "60–69": 290, "70–79": 340, "80–89": 400, "90+": 460 };


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
  {x:50,y:5,labelKey:"top",label:"Top"}, {x:88,y:28,labelKey:"topRight",label:"Top Right"}, {x:88,y:72,labelKey:"bottomRight",label:"Bottom Right"},
  {x:50,y:95,labelKey:"bottom",label:"Bottom"}, {x:12,y:72,labelKey:"bottomLeft",label:"Bottom Left"}, {x:12,y:28,labelKey:"topLeft",label:"Top Left"},
];

// Display order for the 3-column grid so buttons match their spatial positions:
// Row 1: [Top Left]    [Top]     [Top Right]
// Row 2: [Bottom Left] [Bottom]  [Bottom Right]
const PERIPHERAL_DISPLAY_ORDER = [5, 0, 1, 4, 3, 2];

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
   SHARED COMPONENTS
   ═══════════════════════════════════════════════════════════ */
function GlobalHeader({ setScreen, rightContent }) {
  return (
    <div className="global-header">
      <div className="logo" onClick={() => setScreen("landing")}>
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
          <span>{current} / {total}</span>
          <span><strong>{Math.round(percent)}%</strong></span>
        </div>
      )}
    </div>
  );
}

function ResearchSnippet() {
  const { t } = useTranslation();
  const [factIdx] = useState(randomFactIndex);
  const fact = getResearchFact(t, factIdx);
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

const NavIcons = {
  home: <svg viewBox="0 0 24 24"><path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>,
  progress: <svg viewBox="0 0 24 24"><path d="M3 20h4V10H3zM10 20h4V4h-4zM17 20h4v-8h-4z"/></svg>,
  science: <svg viewBox="0 0 24 24"><path d="M9 3v7.4L4.2 18.2A1.5 1.5 0 0 0 5.5 21h13a1.5 1.5 0 0 0 1.3-2.8L15 10.4V3"/><path d="M9 3h6"/><path d="M8.5 14h7"/></svg>,
};

function BottomNav({ current, onNavigate }) {
  const { t } = useTranslation();
  const items = [
    { key: "home", label: t("nav.home"), screen: "dashboard" },
    { key: "progress", label: t("nav.progress"), screen: "progress" },
    { key: "science", label: t("nav.science"), screen: "science" },
  ];
  return (
    <nav className="bottom-nav">
      {items.map(item => (
        <button key={item.key} className="nav-item" data-active={current === item.key} onClick={() => onNavigate(item.screen)}>
          <span className="nav-icon">{NavIcons[item.key]}</span>
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
const DEFAULT_AGE_GROUP = "60–69";
const DEFAULT_APP_DATA = {
  onboarded: false, baseline: null, sessions: [],
  exerciseUnlocks: { 1: true, 2: false, 3: false },
  lastThresholds: { 1: null, 2: null, 3: null },
  currentExercise: 1, ageGroup: DEFAULT_AGE_GROUP, weeklyGoal: 3, sessionMode: "full",
  acceptedTerms: false, acceptedPrivacy: false, researchConsent: false,
  language: "en", fontSize: "normal", highContrast: false,
};

export default function CognifyApp() {
  const [user, setUser] = useState(null);
  const [appData, setAppData] = useState(null);
  const [screen, setScreen] = useState("loading");
  const [loading, setLoading] = useState(true);
  const { setLocale } = useTranslation();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "light");
    (async () => {
      const session = await storageGet("session");
      if (session) {
        setUser(session);
        const data = await storageGet("data_" + session.username);
        const merged = data || { ...DEFAULT_APP_DATA };
        setAppData(merged);
        setScreen(merged.onboarded ? "dashboard" : "terms");
        // Restore accessibility preferences
        if (merged.language && merged.language !== "en") setLocale(merged.language);
        document.documentElement.setAttribute("data-font-size", merged.fontSize || "normal");
        if (merged.highContrast) document.documentElement.setAttribute("data-contrast", "high");
      } else {
        setScreen("landing");
      }
      setLoading(false);
    })();
  }, []);

  const updateAppData = useCallback(async (updates) => {
    setAppData(prev => {
      const next = { ...prev, ...updates };
      if (user) storageSet("data_" + user.username, next);
      // Apply accessibility changes immediately
      if (updates.fontSize !== undefined) document.documentElement.setAttribute("data-font-size", updates.fontSize);
      if (updates.highContrast !== undefined) {
        if (updates.highContrast) document.documentElement.setAttribute("data-contrast", "high");
        else document.documentElement.removeAttribute("data-contrast");
      }
      if (updates.language !== undefined) setLocale(updates.language);
      return next;
    });
  }, [user, setLocale]);

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
        COGNIFY
      </div>
    </div>
  );

  const props = { appData, updateAppData, setScreen, user, handleLogout };

  return (
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
  );
}

/* ═══════════════════════════════════════════════════════════
   LANDING PAGE
   ═══════════════════════════════════════════════════════════ */
function LandingPage({ setScreen }) {
  const { t } = useTranslation();
  return (
    <div className="landing">
      {/* ── Hero ── */}
      <section className="landing-hero">
        <div className="animate-in">
          <svg width="56" height="56" viewBox="0 0 56 56" className="animate-float" style={{marginBottom:20}}>
            <circle cx="28" cy="28" r="24" fill="none" stroke="var(--accent)" strokeWidth="2.5"/>
            <circle cx="28" cy="28" r="13" fill="none" stroke="var(--accent)" strokeWidth="1.5" opacity="0.35"/>
            <circle cx="28" cy="28" r="4.5" fill="var(--accent)"/>
          </svg>
        </div>
        <div className="hero-eyebrow animate-in-d1">{t("landing.eyebrow")}</div>
        <h1 className="hero-title animate-in-d2">{t("landing.title.1")}<em>{t("landing.title.speed")}</em>{t("landing.title.2")}<em>{t("landing.title.future")}</em>{t("landing.title.3")}</h1>
        <p className="hero-subtitle animate-in-d3">
          {t("landing.subtitle")}
        </p>
        <div className="hero-cta-row animate-in-d4">
          <button className="btn btn-primary" onClick={() => setScreen("auth")}>{t("landing.cta.getStarted")}</button>
          <button className="btn btn-secondary" onClick={() => {
            document.getElementById('landing-science')?.scrollIntoView({ behavior: 'smooth' });
          }}>{t("landing.cta.seeScience")}</button>
        </div>
        <div className="hero-stat-row animate-in-d5">
          <div className="hero-stat"><div className="hero-stat-value">25%</div><div className="hero-stat-label">{t("landing.stat.riskReduction")}</div></div>
          <div className="hero-stat"><div className="hero-stat-value">2,802</div><div className="hero-stat-label">{t("landing.stat.participants")}</div></div>
          <div className="hero-stat"><div className="hero-stat-value">20</div><div className="hero-stat-label">{t("landing.stat.years")}</div></div>
        </div>
        <div className="scroll-hint">
          <span>{t("landing.scrollHint")}</span>
          <span className="scroll-arrow">↓</span>
        </div>
      </section>

      {/* ── The Science ── */}
      <section className="landing-section" id="landing-science" style={{borderTop:"1px solid var(--border-light)"}}>
        <div className="landing-section-label">{t("landing.research.label")}</div>
        <div className="landing-section-title">{t("landing.research.title")}</div>
        <p className="text-body mb-lg" style={{fontSize:16,maxWidth:600}}>
          {t("landing.research.body")}
        </p>
        <div className="card mb-md" style={{maxWidth:540}}>
          <div className="landing-quote" style={{margin:0,padding:0,textAlign:"left",fontSize:17}} dangerouslySetInnerHTML={{__html: t("landing.research.highlight")}}/>
        </div>
        <div className="citation" style={{maxWidth:540}}>
          <div className="citation-source">Coe et al., "Impact of Cognitive Training on Claims-Based Diagnosed Dementia Over 20 Years." Alzheimer's & Dementia: TRCI, 2026</div>
          <div className="citation-inst">Johns Hopkins University / National Institutes of Health</div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="landing-section" style={{borderTop:"1px solid var(--border-light)"}}>
        <div className="landing-section-label">{t("landing.howItWorks.label")}</div>
        <div className="landing-section-title">{t("landing.howItWorks.title")}</div>
        <p className="text-body mb-lg" style={{fontSize:16,maxWidth:560}}>
          {t("landing.howItWorks.body")}
        </p>
        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon">👁️</div>
            <div className="feature-title">{t("landing.exercise.centralId.title")}</div>
            <div className="feature-desc">{t("landing.exercise.centralId.desc")}</div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <div className="feature-title">{t("landing.exercise.dividedAttention.title")}</div>
            <div className="feature-desc">{t("landing.exercise.dividedAttention.desc")}</div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <div className="feature-title">{t("landing.exercise.selectiveAttention.title")}</div>
            <div className="feature-desc">{t("landing.exercise.selectiveAttention.desc")}</div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <div className="feature-title">{t("landing.exercise.adaptiveDifficulty.title")}</div>
            <div className="feature-desc">{t("landing.exercise.adaptiveDifficulty.desc")}</div>
          </div>
        </div>
      </section>

      {/* ── Why This Is Different ── */}
      <section className="landing-section" style={{borderTop:"1px solid var(--border-light)"}}>
        <div className="landing-section-label">{t("landing.whyCognify.label")}</div>
        <div className="landing-section-title">{t("landing.whyCognify.title")}</div>
        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-title">{t("landing.whyCognify.rct.title")}</div>
            <div className="feature-desc">{t("landing.whyCognify.rct.desc")}</div>
          </div>
          <div className="feature-card">
            <div className="feature-title">{t("landing.whyCognify.focused.title")}</div>
            <div className="feature-desc">{t("landing.whyCognify.focused.desc")}</div>
          </div>
          <div className="feature-card">
            <div className="feature-title">{t("landing.whyCognify.progress.title")}</div>
            <div className="feature-desc">{t("landing.whyCognify.progress.desc")}</div>
          </div>
          <div className="feature-card">
            <div className="feature-title">{t("landing.whyCognify.transparent.title")}</div>
            <div className="feature-desc">{t("landing.whyCognify.transparent.desc")}</div>
          </div>
        </div>
      </section>

      {/* ── Endorsement ── */}
      <section className="landing-section text-center" style={{borderTop:"1px solid var(--border-light)"}}>
        <div className="landing-quote">
          {t("landing.endorsement.quote")}
        </div>
        <div className="text-small">{t("landing.endorsement.source")}</div>
      </section>

      {/* ── CTA ── */}
      <section className="landing-section text-center" style={{borderTop:"1px solid var(--border-light)"}}>
        <div className="landing-section-title" style={{marginBottom:12}}>{t("landing.cta.title")}</div>
        <p className="text-body mb-lg" style={{maxWidth:440,margin:"0 auto 24px"}}>
          {t("landing.cta.body")}
        </p>
        <div style={{maxWidth:320,margin:"0 auto"}}>
          <button className="btn btn-primary" onClick={() => setScreen("auth")}>{t("landing.cta.createAccount")}</button>
        </div>
        <p className="text-body mt-md">
          {t("landing.cta.haveAccount")} <span style={{color:"var(--accent)",cursor:"pointer",fontWeight:600}} onClick={() => setScreen("auth")}>{t("landing.cta.signIn")}</span>
        </p>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="logo mb-sm" style={{fontSize:16,justifyContent:"center"}}>
          COGNIFY
        </div>
        <p className="text-small">{t("landing.footer.tagline")}</p>
        <p className="text-small mt-sm">{t("landing.footer.disclaimer")}</p>
        <div style={{marginTop:20,paddingTop:16,borderTop:"1px solid var(--border-light)"}}>
          <p className="text-small" style={{color:"var(--text-muted)",marginBottom:4}}>{t("landing.footer.builtBy")}</p>
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
  const { t } = useTranslation();
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
    if (!username.trim() || !password.trim()) return setError(t("auth.error.fillAll"));
    setLoading(true);
    const hashed = await secureHashPassword(password);
    const stored = await storageGet("user_" + username.toLowerCase());
    setLoading(false);
    if (!stored) return setError(t("auth.error.accountNotFound"));
    if (stored.passwordHash !== hashed) return setError(t("auth.error.incorrectPassword"));
    onAuth(stored);
  };

  const handleSignup = async () => {
    setError("");
    if (!username.trim() || !password.trim() || !confirmPassword.trim()) return setError(t("auth.error.fillAll"));
    if (username.trim().length < 3) return setError(t("auth.error.usernameLength"));
    if (password.length < 6) return setError(t("auth.error.passwordLength"));
    if (password !== confirmPassword) return setError(t("auth.error.passwordMismatch"));

    const existing = await storageGet("user_" + username.toLowerCase());
    if (existing) return setError(t("auth.error.usernameTaken"));

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
          <button className="auth-toggle-btn" data-active={isLogin} onClick={() => { setIsLogin(true); clearForm(); }}>{t("auth.signIn")}</button>
          <button className="auth-toggle-btn" data-active={!isLogin} onClick={() => { setIsLogin(false); clearForm(); }}>{t("auth.createAccount")}</button>
        </div>

        <div className="flex-col gap-md" style={{textAlign:"left"}}>
          <div className="input-group">
            <label className="input-label">{t("auth.username")}</label>
            <input className="input-field" value={username} onChange={e => setUsername(e.target.value)}
              placeholder={isLogin ? t("auth.placeholder.username.login") : t("auth.placeholder.username.signup")} onKeyDown={onKeyDown} autoFocus/>
          </div>
          <div className="input-group">
            <label className="input-label">{t("auth.password")}</label>
            <div style={{position:"relative"}}>
              <input className="input-field" style={{paddingRight:56}} type={showPassword ? "text" : "password"}
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder={isLogin ? t("auth.placeholder.password.login") : t("auth.placeholder.password.signup")} onKeyDown={onKeyDown}/>
              <button className="btn btn-ghost" onClick={() => setShowPassword(!showPassword)}
                style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",fontSize:16,fontWeight:600}}>
                {showPassword ? t("auth.hide") : t("auth.show")}
              </button>
            </div>
          </div>
          {!isLogin && (
            <div className="input-group">
              <label className="input-label">{t("auth.confirmPassword")}</label>
              <input className="input-field" type={showPassword ? "text" : "password"} value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)} placeholder={t("auth.placeholder.confirmPassword")} onKeyDown={onKeyDown}/>
            </div>
          )}
        </div>

        {error && <div className="error-msg">{error}</div>}

        <button className="btn btn-primary mt-lg" onClick={isLogin ? handleLogin : handleSignup} disabled={loading}>
          {loading ? (isLogin ? t("auth.signingIn") : t("auth.creatingAccount")) : (isLogin ? t("auth.signIn") : t("auth.createAccount"))}
        </button>

        <p className="text-body text-center mt-md">
          {isLogin ? t("auth.newHere") : t("auth.haveAccount")}
          <span style={{color:"var(--accent)",cursor:"pointer",fontWeight:600}} onClick={() => { setIsLogin(!isLogin); clearForm(); }}>
            {isLogin ? t("auth.createAnAccount") : t("auth.signIn")}
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
  const { t } = useTranslation();
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
        <button className="btn btn-primary" disabled={!accepted} onClick={onAccept}>{t("nav.continue")}</button>
      </div>
    </div>
  );
}

function TermsScreen({ updateAppData, setScreen }) {
  const { t } = useTranslation();
  return (
    <LegalScreen title={t("terms.title")} checkLabel={t("terms.checkLabel")}
      onAccept={() => { updateAppData({ acceptedTerms: true }); setScreen("privacy"); }} setScreen={setScreen}>
      <p className="legal-p"><strong>{t("terms.effectiveDate")}</strong> {t("terms.effectiveDateValue")}</p>
      <p className="legal-p">{t("terms.intro")}</p>
      <h4 className="legal-h">{t("terms.s1.title")}</h4>
      <p className="legal-p" dangerouslySetInnerHTML={{__html: t("terms.s1.body")}}/>
      <h4 className="legal-h">{t("terms.s2.title")}</h4>
      <p className="legal-p">{t("terms.s2.body")}</p>
      <h4 className="legal-h">{t("terms.s3.title")}</h4>
      <p className="legal-p">{t("terms.s3.body")}</p>
      <h4 className="legal-h">{t("terms.s4.title")}</h4>
      <p className="legal-p">{t("terms.s4.body")}</p>
      <h4 className="legal-h">{t("terms.s5.title")}</h4>
      <p className="legal-p">{t("terms.s5.body")}</p>
      <h4 className="legal-h">{t("terms.s6.title")}</h4>
      <p className="legal-p">{t("terms.s6.body")}</p>
      <h4 className="legal-h">{t("terms.s7.title")}</h4>
      <p className="legal-p">{t("terms.s7.body")}</p>
      <h4 className="legal-h">{t("terms.s8.title")}</h4>
      <p className="legal-p">{t("terms.s8.body")}</p>
    </LegalScreen>
  );
}

function PrivacyScreen({ updateAppData, setScreen }) {
  const { t } = useTranslation();
  return (
    <LegalScreen title={t("privacy.title")} checkLabel={t("privacy.checkLabel")}
      onAccept={() => { updateAppData({ acceptedPrivacy: true }); setScreen("consent"); }} setScreen={setScreen}>
      <p className="legal-p"><strong>{t("privacy.effectiveDate")}</strong> {t("privacy.effectiveDateValue")}</p>
      <h4 className="legal-h">{t("privacy.s1.title")}</h4>
      <p className="legal-p" dangerouslySetInnerHTML={{__html: t("privacy.s1.body")}}/>
      <h4 className="legal-h">{t("privacy.s2.title")}</h4>
      <p className="legal-p">{t("privacy.s2.body")}</p>
      <h4 className="legal-h">{t("privacy.s3.title")}</h4>
      <p className="legal-p">{t("privacy.s3.body")}</p>
      <h4 className="legal-h">{t("privacy.s4.title")}</h4>
      <p className="legal-p">{t("privacy.s4.body")}</p>
      <h4 className="legal-h">{t("privacy.s5.title")}</h4>
      <p className="legal-p">{t("privacy.s5.body")}</p>
      <h4 className="legal-h">{t("privacy.s6.title")}</h4>
      <p className="legal-p">{t("privacy.s6.body")}</p>
      <h4 className="legal-h">{t("privacy.s7.title")}</h4>
      <p className="legal-p">{t("privacy.s7.body")}</p>
    </LegalScreen>
  );
}

function ConsentScreen({ updateAppData, setScreen }) {
  const { t } = useTranslation();
  const [researchConsent, setResearchConsent] = useState(false);
  return (
    <div className="screen flex-col">
      <GlobalHeader setScreen={setScreen}/>
      <div className="app-content flex-col" style={{flex:1,padding:"16px 0 32px"}}>
        <h2 className="heading-lg mb-md">{t("consent.title")}</h2>
        <div className="legal-scroll mb-md">
          <p className="legal-p">{t("consent.intro")}</p>
          <h4 className="legal-h">{t("consent.required.title")}</h4>
          <p className="legal-p">{t("consent.required.body")}</p>
          <h4 className="legal-h">{t("consent.optional.title")}</h4>
          <p className="legal-p">{t("consent.optional.body")}</p>
        </div>
        <label className="consent-check">
          <input type="checkbox" checked={researchConsent} onChange={e => setResearchConsent(e.target.checked)}/>
          <span>{t("consent.checkbox")} <span style={{color:"var(--text-muted)"}}>{t("consent.checkboxOptional")}</span></span>
        </label>
        <button className="btn btn-primary" onClick={() => { updateAppData({ researchConsent }); setScreen("onboarding"); }}>
          {t("consent.continue")}
        </button>
        <p className="text-small text-center mt-md">{t("consent.changeAnytime")}</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ONBOARDING
   ═══════════════════════════════════════════════════════════ */
function OnboardingScreen({ appData, updateAppData, setScreen }) {
  const { t } = useTranslation();
  const isRetake = (appData.sessions || []).length > 0;
  const [step, setStep] = useState(isRetake ? 1 : 0);
  const [ageGroup, setAgeGroup] = useState(appData.ageGroup || "60–69");
  const [baselineResult, setBaselineResult] = useState(null);

  const handleBaselineComplete = (trials) => {
    const correct = trials.filter(t => t.correct);
    const norm = AGE_NORMS[ageGroup] || AGE_NORMS["60–69"];
    const threshold = correct.length > 0
      ? Math.round(correct.reduce((sum, t) => sum + t.displayTime, 0) / correct.length)
      : norm;
    setBaselineResult(threshold);
    setStep(2);
  };

  const finishOnboarding = () => {
    const norm = AGE_NORMS[ageGroup] || AGE_NORMS["60–69"];
    updateAppData({
      onboarded: true, baseline: baselineResult, ageGroup,
      lastThresholds: { ...appData.lastThresholds, 1: baselineResult || norm },
    });
    setScreen("dashboard");
  };

  if (step === 0) {
    const fact = getResearchFact(t, 0);
    return (
      <div className="screen flex-col">
        <GlobalHeader setScreen={setScreen}/>
        <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px 0"}}>
        <div className="app-content text-center animate-in" style={{maxWidth:440}}>
          <div className="stat-giant mb-sm">25%</div>
          <p style={{fontSize:19,color:"var(--text-secondary)",marginBottom:4}}>{t("onboarding.lowerDementiaRisk")}</p>
          <p className="text-small" style={{color:"var(--text-muted)",marginBottom:22}}>{t("onboarding.riskContext")}</p>
          <div className="badge-row mb-lg">
            {[t("onboarding.participants"), t("onboarding.twentyYears"), t("onboarding.institution")].map(b => <span key={b} className="badge">{b}</span>)}
          </div>
          <p className="text-body mb-md" style={{fontSize:16}}>
            {t("onboarding.description")}
          </p>
          <div className="citation mb-lg" style={{textAlign:"left"}}>
            <div className="citation-source">{fact.source}</div>
            <div className="citation-inst">{fact.institution}</div>
          </div>
          <div className="mb-lg">
            <label style={{fontSize:16,color:"var(--text-secondary)",display:"block",marginBottom:10}}>{t("onboarding.ageGroupLabel")}</label>
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
            {["18–29","30–39","40–49","50–59"].includes(ageGroup) && (
              <p className="text-small" style={{color:"var(--text-muted)", marginTop:12, lineHeight:1.6}}>
                {t("onboarding.ageDisclaimer")}
              </p>
            )}
          </div>
          <button className="btn btn-primary" onClick={() => setStep(1)}>{t("onboarding.takeBaseline")}</button>
        </div>
        </div>
      </div>
    );
  }

  if (step === 1) return <BaselineAssessment onComplete={handleBaselineComplete} setScreen={setScreen} />;

  const norm = AGE_NORMS[ageGroup] || 290;
  const vsAverage = baselineResult < norm ? t("baseline.results.fasterThanAvg", {ms: norm - baselineResult}) : baselineResult > norm ? t("baseline.results.slowerThanAvg", {ms: baselineResult - norm}) : t("baseline.results.atAverage");
  return (
    <div className="screen flex-col">
      <GlobalHeader setScreen={setScreen}/>
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px 0"}}>
      <div className="app-content text-center animate-in" style={{maxWidth:420}}>
        <h2 className="heading-lg mb-lg">{t("baseline.results.title")}</h2>
        <div className="card mb-md" style={{padding:28}}>
          <div className="stat-large">{baselineResult}<span className="stat-unit">ms</span></div>
          <div className="text-body mt-sm">{t("baseline.results.processingSpeed")}</div>
        </div>
        <div className="flex-col gap-sm mb-md" style={{textAlign:"left"}}>
          <div className="settings-row"><span>{t("baseline.results.averageFor", {ageGroup})}</span><span style={{fontWeight:600}}>{norm}ms</span></div>
          <div className="settings-row"><span>{t("baseline.results.comparedToAvg")}</span><span style={{fontWeight:600,color:baselineResult<=norm?"var(--accent)":"var(--gold)"}}>{vsAverage}</span></div>
        </div>
        <div className="card mb-md" style={{display:"flex",alignItems:"center",gap:14,textAlign:"left"}}>
          <span style={{fontSize:28}}>📅</span>
          <div>
            <div className="heading-sm">{t("baseline.results.recommendedSchedule")}</div>
            <div className="text-body" style={{fontSize:17,marginTop:3}}>{t("baseline.results.scheduleDetail")}</div>
          </div>
        </div>
        <ResearchSnippet />
        <button className="btn btn-primary mt-lg" onClick={finishOnboarding}>{t("baseline.results.startTraining")}</button>
      </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   BASELINE ASSESSMENT (also used in training)
   ═══════════════════════════════════════════════════════════ */
function BaselineAssessment({ onComplete, setScreen, ageGroup }) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState("intro");
  const startTime = AGE_NORMS[ageGroup] || AGE_NORMS["60–69"];
  return phase === "intro" ? (
    <div className="screen flex-col">
      {setScreen && <GlobalHeader setScreen={setScreen}/>}
      <div className="screen-centered" style={{minHeight:"auto",flex:1}}>
        <div className="app-content text-center animate-in" style={{maxWidth:420}}>
          <h2 className="heading-lg mb-sm">{t("baseline.title")}</h2>
          <p className="text-body mb-md">{t("baseline.subtitle")}</p>
          <div className="card mb-lg" style={{textAlign:"left"}}>
            <p style={{fontSize:18,color:"var(--text)",lineHeight:1.7}}>{t("baseline.instructions")}</p>
            <p className="text-small mt-sm">{t("baseline.trialInfo", {count: BASELINE_TRIAL_COUNT})}</p>
          </div>
          <button className="btn btn-primary" onClick={() => setPhase("running")}>{t("baseline.begin")}</button>
        </div>
      </div>
    </div>
  ) : (
    <TrialRunner trialsPerBlock={BASELINE_TRIAL_COUNT} blocks={1} exerciseType={1}
      startingDisplayTime={startTime} onSessionComplete={(trials) => onComplete(trials)}
      onExit={setScreen ? () => setScreen("dashboard") : undefined} setScreen={setScreen} />
  );
}

/* ═══════════════════════════════════════════════════════════
   TRIAL RUNNER — the core training engine
   Isolated component with its own state management
   ═══════════════════════════════════════════════════════════ */
function TrialRunner({ trialsPerBlock, blocks, exerciseType, startingDisplayTime, onSessionComplete, onExit, setScreen }) {
  const { t } = useTranslation();
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
      const stimulusStart = performance.now();
      responseTimeRef.current = stimulusStart;
      function tick() {
        if (performance.now() - stimulusStart >= displayTime) {
          setStimulusVisible(false);
          setAwaitingResponse(true);
        } else {
          requestAnimationFrame(tick);
        }
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
          setMicrobreakFact(getMidBreak(t, randomMidBreakIndex()));
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
            <p className="text-body">{t("trial.continueIn", {seconds: microbreakCountdown})}</p>
            <button className="btn btn-secondary mt-md" onClick={() => { setPhase("trial"); setFeedback(null); }}
              style={{maxWidth:200,margin:"16px auto 0"}}>{t("trial.continueNow")}</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Between blocks screen ──
  if (phase === "between") {
    const blockAccuracy = blockTrials.length > 0 ? Math.round((blockTrials.filter(t => t.correct).length / blockTrials.length) * 100) : 0;
    const betweenMsg = getBetweenBlockMsg(t, randomBetweenBlockIndex());
    return (
      <div className="screen flex-col">
        {setScreen && <GlobalHeader setScreen={setScreen}/>}
        <SessionProgressBar current={(block + 1) * trialsPerBlock} total={totalSessionTrials}/>
        <div className="screen-centered" style={{minHeight:"auto",flex:1}}>
          <div className="text-center animate-in" style={{maxWidth:420,padding:"0 20px"}}>
            <h3 className="heading-lg text-accent mb-lg">{t("trial.blockComplete", {n: block + 1})}</h3>
            <div className="grid-2 mb-md" style={{display:"flex",gap:28,justifyContent:"center"}}>
              <div className="text-center"><div className="stat-medium">{blockAccuracy}%</div><div className="text-small">{t("trial.accuracy")}</div></div>
              <div className="text-center"><div className="stat-medium">{displayTime}ms</div><div className="text-small">{t("trial.speed")}</div></div>
            </div>
            <div className="card card-highlight mb-md" style={{textAlign:"left"}}>
              <p style={{fontSize:18,color:"var(--accent)",fontWeight:600,lineHeight:1.6,marginBottom:10}}>{betweenMsg.encouragement}</p>
              <p className="text-serif" style={{fontSize:17,color:"var(--text-secondary)",lineHeight:1.7,margin:0}}>{betweenMsg.fact}</p>
              <div className="text-small mt-sm" style={{fontStyle:"italic"}}>{betweenMsg.source}</div>
            </div>
            <p className="text-body mb-md">{t("trial.nextBlockIn", {n: block + 2, seconds: countdown})}</p>
            <button className="btn btn-secondary" onClick={advanceBlock} style={{maxWidth:200,margin:"0 auto"}}>{t("trial.startNow")}</button>
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
          <button className="btn btn-ghost" onClick={() => setConfirmExit(true)} style={{color:"var(--text-muted)"}}>{t("trial.exit")}</button>
        ) : null
      }/>}
      <SessionProgressBar current={completedTrials} total={totalSessionTrials} label={false}/>

      {/* Exit confirmation */}
      {confirmExit && (
        <div className="app-content mb-sm">
          <div className="card" style={{borderColor:"var(--incorrect)",padding:16}}>
            <p style={{fontSize:16,color:"var(--text)",marginBottom:10,lineHeight:1.5}}>{t("trial.exitConfirm")}</p>
            <div style={{display:"flex",gap:10}}>
              <button className="btn btn-secondary" style={{flex:1,padding:12,fontSize:16}} onClick={() => setConfirmExit(false)}>{t("trial.keepGoing")}</button>
              <button className="btn btn-primary" style={{flex:1,padding:12,fontSize:16,background:"var(--incorrect)"}} onClick={onExit}>{t("trial.endSession")}</button>
            </div>
          </div>
        </div>
      )}

      <div className="app-content flex-col" style={{flex:1,minHeight:0,paddingBottom:24}}>
        <div className="flex-between" style={{marginBottom:8}}>
          <span style={{fontSize:16,fontWeight:600,color:"var(--text-secondary)"}}>{t("trial.trialCount", {current: trialIndex + 1, total: trialsPerBlock})}</span>
          {blocks > 1 && <span style={{fontSize:14,color:"var(--text-muted)"}}>{t("trial.blockCount", {current: block + 1, total: blocks})}</span>}
          <span style={{fontSize:15,color:"var(--accent)",fontFamily:"monospace",fontWeight:600}}>{displayTime}ms</span>
        </div>

        {/* Reference shapes */}
        <div style={{display:"flex",justifyContent:"center",gap:32,marginBottom:8}}>
          {currentPair.map(key => (
            <div key={key} className="text-center">
              <ShapeIcon shapeKey={key} size={40}/>
              <div style={{fontSize:13,color:"var(--text-muted)",marginTop:2}}>{t("shape." + key)}</div>
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
            <p style={{fontSize:17,color:"var(--text-secondary)",textAlign:"center",marginBottom:10}}>{t("trial.whichShape")}</p>
            <div style={{display:"flex",justifyContent:"center",gap:14}}>
              {currentPair.map(key => (
                <button key={key} className="btn btn-choice" onClick={() => handleCentralResponse(key)} style={{padding:"14px 28px",minWidth:120}}>
                  <ShapeIcon shapeKey={key} size={44}/><span style={{fontSize:15,color:"var(--text-secondary)"}}>{t("shape." + key)}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {awaitingResponse && responseStep === "peripheral" && (
          <div style={{marginTop:10,flexShrink:0}}>
            <p style={{fontSize:17,color:"var(--text-secondary)",textAlign:"center",marginBottom:10}}>{t("trial.whereWasTriangle")}</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,maxWidth:320,margin:"0 auto"}}>
              {PERIPHERAL_DISPLAY_ORDER.map(origIdx => (
                <button key={origIdx} className="btn btn-peripheral" onClick={() => handlePeripheralResponse(origIdx)} style={{padding:14,fontSize:15}}>{t("peripheral." + PERIPHERAL_POSITIONS[origIdx].labelKey)}</button>
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
  const { t } = useTranslation();
  const [selectedExercise, setSelectedExercise] = useState(appData.currentExercise || 1);

  const sessions = appData.sessions || [];
  const totalSessions = sessions.length;
  const ageNorm = AGE_NORMS[appData.ageGroup] || AGE_NORMS["60–69"];
  const threshold = appData.lastThresholds[selectedExercise] || ageNorm;
  const baseline = appData.baseline || ageNorm;
  const improvement = baseline - threshold;
  const improvementPercent = baseline > 0 ? Math.round((improvement / baseline) * 100) : 0;
  const impactMessage = getPersonalizedImpactMessage(t, sessions, improvement, baseline);
  const earnedBadges = getEarnedBadges(appData);

  const now = new Date();
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay()); weekStart.setHours(0,0,0,0);
  const weekSessions = sessions.filter(s => new Date(s.date) >= weekStart).length;

  // Days since last session (for booster reminder)
  const lastSessionDate = sessions.length > 0 ? new Date(sessions[sessions.length - 1].date) : null;
  const daysSinceLastSession = lastSessionDate ? Math.floor((now - lastSessionDate) / (1000*60*60*24)) : null;

  useEffect(() => {
    const unlocks = { ...appData.exerciseUnlocks };
    if (appData.lastThresholds[1] !== null && appData.lastThresholds[1] <= UNLOCK_EXERCISE_2_THRESHOLD) unlocks[2] = true;
    if (appData.lastThresholds[2] !== null && appData.lastThresholds[2] <= UNLOCK_EXERCISE_3_THRESHOLD) unlocks[3] = true;
    if (JSON.stringify(unlocks) !== JSON.stringify(appData.exerciseUnlocks)) updateAppData({ exerciseUnlocks: unlocks });
  }, [appData.lastThresholds]);

  const startTraining = () => { updateAppData({ currentExercise: selectedExercise }); setScreen("training"); };

  const recentTrend = sessions.slice(-20).map((s, i) => ({ n: i + 1, speed: s.threshold }));

  return (
    <div className="screen screen-padded">
      <GlobalHeader setScreen={setScreen} rightContent={
        <button className="btn btn-icon settings-btn" onClick={() => setScreen("settings")} title={t("nav.settings")}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></button>
      }/>

      <div className="app-content flex-col gap-md animate-in">
        {/* Primary metric */}
        <div className="card" style={{padding:26}}>
          <div className="text-label mb-sm">{t("dashboard.processingSpeed")}</div>
          <div className="flex-between" style={{alignItems:"baseline"}}>
            <div><span className="stat-large">{threshold}</span><span className="stat-unit">ms</span></div>
            {improvement > 0 && <span style={{fontSize:17,fontWeight:600,color:"var(--accent)"}}>{t("dashboard.improvement", {ms: improvement})}</span>}
          </div>
          <div className="progress-track mt-md">
            <div className="progress-fill" style={{width:`${Math.max(2, Math.min(100, improvementPercent * 2))}%`}}/>
          </div>
          <div className="text-small mt-sm">{improvement > 0 ? t("dashboard.fasterThanBaseline", {percent: improvementPercent, baseline}) : t("dashboard.baselinePrompt", {baseline})}</div>
        </div>

        {/* Protocol progress card */}
        {totalSessions > 0 && (
          <div className={totalSessions >= 14 ? "card card-gold" : "card card-highlight"} style={{padding:20}}>
            <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:10}}>
              <span style={{fontSize:30}}>🧠</span>
              <div>
                <div style={{fontSize:17,fontWeight:700,color:totalSessions >= 14 ? "var(--gold)" : "var(--text)"}}>{totalSessions >= 14 ? t("dashboard.protocolComplete") : t("dashboard.protocolProgress", {count: totalSessions})}</div>
              </div>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{width:`${Math.min(100, (totalSessions / 14) * 100)}%`}}/>
            </div>
            <div className="text-small mt-sm" style={{color:"var(--text-muted)",lineHeight:1.6}}>{t("dashboard.activeStudyFinding")}</div>
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
              <div style={{fontSize:17,fontWeight:600,color:"var(--accent)"}}>{t("dashboard.boosterTitle")}</div>
              <div className="text-small" style={{marginTop:2}}>{t("dashboard.boosterDetail", {days: daysSinceLastSession})}</div>
            </div>
          </div>
        )}

        {/* Training card */}
        <div className="card" style={{padding:22}}>
          <div className="flex-between mb-md">
            <span className="heading-sm" style={{fontSize:17}}>{t("dashboard.todaysTraining")}</span>
            <span className="text-small">{t("dashboard.sessionNumber", {n: totalSessions + 1})}</span>
          </div>
          <div className="exercise-grid mb-md">
            {[1, 2, 3].map(exerciseNumber => {
              const unlocked = appData.exerciseUnlocks[exerciseNumber];
              const names = { 1: t("dashboard.exercise.centralId"), 2: t("dashboard.exercise.dividedAttention"), 3: t("dashboard.exercise.selectiveAttention") };
              return (
                <button key={exerciseNumber} className="exercise-option" data-selected={selectedExercise === exerciseNumber} data-locked={!unlocked}
                  onClick={() => unlocked && setSelectedExercise(exerciseNumber)}
                  title={!unlocked ? (exerciseNumber === 2 ? t("dashboard.unlockHint.ex2", {threshold: UNLOCK_EXERCISE_2_THRESHOLD}) : t("dashboard.unlockHint.ex3", {threshold: UNLOCK_EXERCISE_3_THRESHOLD})) : undefined}>
                  <div style={{fontSize:16,fontWeight:700,letterSpacing:1,textTransform:"uppercase"}}>Ex {exerciseNumber}</div>
                  <div style={{fontSize:16,marginTop:3}}>{names[exerciseNumber]}</div>
                  {!unlocked && <div style={{fontSize:16,marginTop:2}}>🔒</div>}
                </button>
              );
            })}
          </div>
          <button className="btn btn-start" onClick={startTraining}>{t("dashboard.startSession")}</button>
          <div className="text-small text-center mt-sm">{t("dashboard.sessionDetail", {label: SESSION_MODES[appData.sessionMode || "full"].label, trials: selectedExercise === 1 ? EXERCISE_1_TRIALS_PER_BLOCK : selectedExercise === 2 ? EXERCISE_2_TRIALS_PER_BLOCK : EXERCISE_3_TRIALS_PER_BLOCK, blocks: SESSION_MODES[appData.sessionMode || "full"].blocks})}</div>
        </div>

        {/* Weekly streak */}
        <div className="card">
          <div className="flex-between mb-md">
            <span className="heading-sm">{t("dashboard.thisWeek")}</span>
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
            <div className="heading-sm mb-md" style={{fontSize:15}}>{t("dashboard.milestones")}</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {earnedBadges.map(badge => (
                <div key={badge.id} title={t("badge." + badge.id + ".description")} style={{display:"flex",alignItems:"center",gap:6,
                  padding:"6px 12px",background:"var(--accent-light)",border:"1px solid var(--accent-border)",
                  borderRadius:"var(--radius-sm)",fontSize:16,color:"var(--accent)",fontWeight:500}}>
                  <span>{badge.icon}</span> {t("badge." + badge.id + ".name")}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trend chart */}
        {recentTrend.length > 1 && (
          <div className="card" style={{paddingBottom:10}}>
            <div className="heading-sm mb-sm" style={{fontSize:15}}>{t("dashboard.recentTrend")}</div>
            <ResponsiveContainer width="100%" height={110}>
              <LineChart data={recentTrend}>
                <Line type="monotone" dataKey="speed" stroke="var(--chart-line)" strokeWidth={2} dot={false}/>
                <YAxis hide domain={['dataMin-20','dataMax+20']} reversed/>
                <Tooltip contentStyle={ChartTooltipStyle()} formatter={v => [`${v}ms`, t("chart.speed")]}/>
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
  const { t } = useTranslation();
  const exercise = appData.currentExercise || 1;
  const trialsPerBlock = exercise === 1 ? EXERCISE_1_TRIALS_PER_BLOCK : exercise === 2 ? EXERCISE_2_TRIALS_PER_BLOCK : EXERCISE_3_TRIALS_PER_BLOCK;
  const [started, setStarted] = useState(false);
  const [sessionMode, setSessionMode] = useState(appData.sessionMode || "full");
  const ageNorm = AGE_NORMS[appData.ageGroup] || AGE_NORMS["60–69"];
  const startingTime = Math.round((appData.lastThresholds[exercise] || ageNorm) * 0.9);
  const exerciseNames = { 1: t("training.centralId"), 2: t("training.dividedAttention"), 3: t("training.selectiveAttention") };
  const mode = SESSION_MODES[sessionMode];
  const sessionStartRef = useRef(null);

  const handleSessionComplete = (trials, finalDisplayTime) => {
    const correctCount = trials.filter(t => t.correct).length;
    const accuracy = trials.length > 0 ? correctCount / trials.length : 0;
    const avgReactionTime = trials.length > 0 ? Math.round(trials.reduce((s, t) => s + t.reactionTime, 0) / trials.length) : 0;
    const elapsedMinutes = sessionStartRef.current ? Math.round((Date.now() - sessionStartRef.current) / 60000) : mode.minutes;

    const session = {
      date: new Date().toISOString(), exercise, threshold: finalDisplayTime,
      accuracy, avgReactionTime, trialsCompleted: trials.length, correctCount,
      durationMinutes: Math.max(1, elapsedMinutes),
    };
    updateAppData({
      sessions: [...(appData.sessions || []), session],
      lastThresholds: { ...appData.lastThresholds, [exercise]: finalDisplayTime },
      _lastSession: session,
    });
    setScreen("summary");
  };

  const handleStart = () => {
    updateAppData({ sessionMode });
    sessionStartRef.current = Date.now();
    setStarted(true);
  };

  if (!started) {
    return (
      <div className="screen flex-col">
        <GlobalHeader setScreen={setScreen} rightContent={
          <button className="btn btn-ghost" onClick={() => setScreen("dashboard")}>{t("nav.back")}</button>
        }/>
        <div className="screen-centered" style={{minHeight:"auto",flex:1}}>
          <div className="app-content text-center animate-in" style={{maxWidth:420}}>
            <div className="text-label mb-sm">{t("training.exercise", {n: exercise})}</div>
            <h2 className="heading-lg mb-md">{exerciseNames[exercise]}</h2>
            <div className="card mb-md" style={{textAlign:"left"}}>
              {exercise === 1 ? (
                <p style={{fontSize:18,color:"var(--text)",lineHeight:1.7}}>{t("training.ex1.instructions")}</p>
              ) : exercise === 2 ? (
                <p style={{fontSize:18,color:"var(--text)",lineHeight:1.7}} dangerouslySetInnerHTML={{__html: t("training.ex2.instructions")}}/>
              ) : (
                <p style={{fontSize:18,color:"var(--text)",lineHeight:1.7}} dangerouslySetInnerHTML={{__html: t("training.ex3.instructions")}}/>
              )}
            </div>

            {/* Session length selector */}
            <div className="card mb-md" style={{textAlign:"left"}}>
              <div style={{fontSize:15,fontWeight:600,color:"var(--text-secondary)",marginBottom:10}}>{t("training.sessionLength")}</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {Object.entries(SESSION_MODES).map(([key, m]) => (
                  <button key={key} className="btn" onClick={() => setSessionMode(key)} style={{
                    flex:1,padding:"12px 10px",fontSize:15,borderRadius:"var(--radius-sm)",textAlign:"center",
                    border: sessionMode===key ? "1.5px solid var(--accent-border)" : "1.5px solid var(--border)",
                    background: sessionMode===key ? "var(--accent-light)" : "transparent",
                    color: sessionMode===key ? "var(--accent)" : "var(--text-secondary)",
                  }}>{m.label}</button>
                ))}
              </div>
              <p className="text-small mt-sm">{t("training.trialDetail", {trials: trialsPerBlock, blocks: mode.blocks})}{sessionMode === "full" ? t("training.fullProtocolNote") : ""}</p>
            </div>

            <div className="text-small mb-lg" style={{fontFamily:"monospace"}}>{t("training.startingSpeed", {ms: startingTime})}</div>
            <button className="btn btn-primary" onClick={handleStart}>{t("training.begin")}</button>
          </div>
        </div>
      </div>
    );
  }

  return <TrialRunner trialsPerBlock={trialsPerBlock} blocks={mode.blocks} exerciseType={exercise}
    startingDisplayTime={startingTime} onSessionComplete={handleSessionComplete}
    onExit={() => setScreen("dashboard")} setScreen={setScreen}/>;
}

/* ═══════════════════════════════════════════════════════════
   SESSION SUMMARY
   ═══════════════════════════════════════════════════════════ */
function SessionSummary({ appData, updateAppData, setScreen }) {
  const { t } = useTranslation();
  const session = appData._lastSession;
  if (!session) { setScreen("dashboard"); return null; }

  const sessions = appData.sessions || [];
  const totalSessions = sessions.length;
  const ageNorm = AGE_NORMS[appData.ageGroup] || AGE_NORMS["60–69"];
  const improvement = (appData.baseline || ageNorm) - session.threshold;
  const impactMsg = getPersonalizedImpactMessage(t, appData.sessions, improvement, appData.baseline || ageNorm);
  const [factIdx] = useState(randomFactIndex);
  const fact = getResearchFact(t, factIdx);
  const [encouragementIdx] = useState(randomEncouragementIndex);
  const encouragement = getEncouragement(t, encouragementIdx);

  // Detect newly earned badges by comparing before/after this session
  const [newBadges] = useState(() => {
    const prevData = { ...appData, sessions: sessions.slice(0, -1) };
    const prevBadges = getEarnedBadges(prevData);
    const currentBadges = getEarnedBadges(appData);
    return currentBadges.filter(b => !prevBadges.find(p => p.id === b.id));
  });

  return (
    <div className="screen flex-col">
      <GlobalHeader setScreen={setScreen}/>
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",padding:"24px 20px"}}>
      <div className="app-content text-center animate-in" style={{maxWidth:440}}>
        <div style={{fontSize:56,color:"var(--correct)",marginBottom:8}}>✓</div>
        <h2 className="heading-lg mb-lg">{t("summary.sessionComplete")}</h2>

        <div className="card mb-md" style={{padding:28}}>
          <div className="stat-large">{session.threshold}<span className="stat-unit">ms</span></div>
          <div className="text-body mt-sm">{t("summary.processingSpeed")}</div>
          {improvement > 0 && <div style={{fontSize:17,color:"var(--accent)",fontWeight:600,marginTop:8}}>{t("summary.fromBaseline", {ms: improvement})}</div>}
        </div>

        <div className="grid-3 mb-md">
          {[
            { value: `${Math.round(session.accuracy * 100)}%`, label: t("summary.accuracy") },
            { value: `${session.avgReactionTime}ms`, label: t("summary.reaction") },
            { value: `${totalSessions}`, label: t("summary.sessions") },
          ].map(m => (
            <div key={m.label} className="card text-center" style={{padding:14}}>
              <div className="stat-medium" style={{fontSize:22}}>{m.value}</div>
              <div className="text-small mt-sm">{m.label}</div>
            </div>
          ))}
        </div>

        {/* New badge celebration */}
        {newBadges.length > 0 && (
          <div className="badge-new mb-md">
            {newBadges.map(badge => (
              <div key={badge.id} className="card card-gold" style={{padding:22,textAlign:"center",marginBottom:newBadges.length > 1 ? 8 : 0}}>
                <div className="text-label mb-sm" style={{color:"var(--gold)"}}>{t("summary.newMilestone")}</div>
                <div style={{fontSize:40,marginBottom:6}}>{badge.icon}</div>
                <div style={{fontSize:20,fontWeight:700,color:"var(--text)"}}>{t("badge." + badge.id + ".name")}</div>
                <div className="text-small mt-sm" style={{color:"var(--text-secondary)"}}>{t("badge." + badge.id + ".description")}</div>
              </div>
            ))}
          </div>
        )}

        <div className="card card-gold mb-md" style={{padding:26,textAlign:"center"}}>
          <div style={{fontSize:36}}>🧠</div>
          <div className="stat-large" style={{color:"var(--gold)",marginTop:6}}>{t("summary.protocolFraction", {count: totalSessions})}</div>
          <div className="text-body mt-sm">{t("summary.protocolLabel")}</div>
          <div className="text-small mt-sm" style={{color:"var(--text-muted)",lineHeight:1.6}}>{t("summary.studyFinding")}</div>
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
          <p style={{fontSize:16,color:"var(--accent)",fontWeight:600,lineHeight:1.6}}>{encouragement}</p>
        </div>

        <div className="card mb-lg" style={{textAlign:"left"}}>
          <div className="text-label mb-sm">{t("summary.didYouKnow")}</div>
          <p className="text-serif" style={{fontSize:17,color:"var(--text-secondary)",lineHeight:1.7}}>{fact.text}</p>
          <div className="citation" style={{marginTop:10}}>
            <div className="citation-source">{fact.source}</div>
            <div className="citation-inst">{fact.institution}</div>
          </div>
        </div>

        <button className="btn btn-primary" onClick={() => { updateAppData({ _lastSession: null }); setScreen("dashboard"); }}>{t("summary.done")}</button>
      </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PROTOCOL PATH — visual timeline of the ACTIVE study journey
   ═══════════════════════════════════════════════════════════ */
const PROTOCOL_MILESTONES = [
  { session: 1, label: "First Step", detail: "Baseline established" },
  { session: 5, label: "Building Habit", detail: "Consistent training matters most" },
  { session: 10, label: "Core Protocol", detail: "Matched the ACTIVE study's 10-session core" },
  { session: 14, label: "Full Protocol", detail: "Full ACTIVE protocol with boosters — the study found 25% relative risk reduction in this group" },
  { session: Infinity, label: "Ongoing Boosters", detail: "Maintaining your gains with continued training" },
];

function ProtocolPath({ sessionCount }) {
  const { t } = useTranslation();
  return (
    <div className="card">
      <div className="heading-sm mb-md" style={{fontSize:15}}>{t("progress.protocolTitle")}</div>
      <div className="protocol-path">
        {PROTOCOL_MILESTONES.map((milestone, i) => {
          const target = milestone.session === Infinity ? 15 : milestone.session;
          const completed = sessionCount >= target;
          const isLast = milestone.session === Infinity;
          const isCurrent = !isLast
            ? sessionCount >= milestone.session && (i === PROTOCOL_MILESTONES.length - 2 || sessionCount < PROTOCOL_MILESTONES[i + 1].session)
            : sessionCount >= 14;
          const future = !completed && !isCurrent;
          const isFirstAndEmpty = i === 0 && sessionCount === 0;

          return (
            <div key={i} className="protocol-node"
              data-completed={completed && !isCurrent ? "true" : "false"}
              data-current={isCurrent || isFirstAndEmpty ? "true" : "false"}
              data-future={future && !isFirstAndEmpty ? "true" : "false"}>
              <div className="protocol-node-line"/>
              <div className="protocol-node-dot">
                {completed && !isCurrent ? "✓" : isLast ? "∞" : milestone.session}
              </div>
              <div className="protocol-node-content">
                <div className="protocol-node-label">
                  {isLast ? milestone.label : `Session ${milestone.session} — ${milestone.label}`}
                </div>
                <div className="protocol-node-detail">{milestone.detail}</div>
                {isCurrent && !isLast && (
                  <div className="protocol-node-badge">
                    {sessionCount}/{milestone.session} sessions{sessionCount < milestone.session ? ` — ${milestone.session - sessionCount} to go` : " — Complete!"}
                  </div>
                )}
                {isCurrent && isLast && (
                  <div className="protocol-node-badge">{sessionCount} sessions completed</div>
                )}
                {isFirstAndEmpty && (
                  <div className="protocol-node-badge">Start here</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PROGRESS
   ═══════════════════════════════════════════════════════════ */
function ProgressScreen({ appData, setScreen }) {
  const { t } = useTranslation();
  const sessions = appData.sessions || [];
  const ageNorm = AGE_NORMS[appData.ageGroup] || AGE_NORMS["60–69"];
  const baseline = appData.baseline || ageNorm;
  const improvement = sessions.length > 0 ? baseline - sessions[sessions.length - 1].threshold : 0;
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
        <button className="btn btn-ghost" onClick={() => setScreen("dashboard")}>{t("nav.back")}</button>
      }/>
      <div className="app-content">
        <h2 className="heading-md mb-md">{t("progress.title")}</h2>
      </div>

      {sessions.length === 0 ? (
        <div className="app-content flex-col gap-md animate-in" style={{paddingTop:20}}>
          <ProtocolPath sessionCount={0}/>
          <button className="btn btn-primary" onClick={() => setScreen("dashboard")} style={{maxWidth:240,margin:"0 auto"}}>{t("progress.startTraining")}</button>
        </div>
      ) : (
        <div className="app-content flex-col gap-md animate-in">
          <ProtocolPath sessionCount={sessions.length}/>

          <div className={sessions.length >= 14 ? "card card-gold" : "card card-highlight"} style={{display:"flex",alignItems:"center",gap:10,padding:"14px 18px"}}>
            <span style={{fontSize:22}}>🧠</span>
            <span style={{fontSize:17,fontWeight:600,color:sessions.length >= 14 ? "var(--gold)" : "var(--text)"}}>{sessions.length >= 14 ? t("progress.protocolComplete", {count: sessions.length}) : t("progress.protocolStatus", {count: sessions.length})}</span>
          </div>

          {/* Badges */}
          {earnedBadges.length > 0 && (
            <div className="card">
              <div className="heading-sm mb-sm" style={{fontSize:15}}>{t("progress.milestonesEarned")}</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {earnedBadges.map(badge => (
                  <div key={badge.id} title={t("badge." + badge.id + ".description")} style={{display:"flex",alignItems:"center",gap:6,
                    padding:"6px 12px",background:"var(--accent-light)",border:"1px solid var(--accent-border)",
                    borderRadius:"var(--radius-sm)",fontSize:16,color:"var(--accent)",fontWeight:500}}>
                    <span>{badge.icon}</span> {t("badge." + badge.id + ".name")}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card" style={{paddingBottom:10}}>
            <div className="heading-sm">{t("progress.processingSpeed")}</div>
            <div className="text-small mb-sm">{t("progress.lowerIsFaster")}</div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData}>
                <XAxis dataKey="date" tick={{fill:'var(--text-muted)',fontSize:11}} tickLine={false} axisLine={{stroke:'var(--chart-grid)'}}/>
                <YAxis tick={{fill:'var(--text-muted)',fontSize:11}} tickLine={false} axisLine={{stroke:'var(--chart-grid)'}} reversed domain={['dataMin-20','dataMax+20']}/>
                <Tooltip contentStyle={ChartTooltipStyle()} formatter={v => [`${v}ms`, t("chart.speed")]}/>
                <Line type="monotone" dataKey="speed" stroke="var(--chart-line)" strokeWidth={2.5} dot={{fill:'var(--chart-line)',r:3}}/>
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card" style={{paddingBottom:10}}>
            <div className="heading-sm mb-sm">{t("progress.accuracy")}</div>
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
              <div className="heading-sm mb-sm">{t("progress.sessionsPerWeek")}</div>
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
              { value: sessions.length, label: t("progress.sessions") },
              { value: improvement > 0 ? `${improvement}ms` : "—", label: t("progress.improvement") },
              { value: `${baseline}ms`, label: t("progress.baseline") },
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
  const { t } = useTranslation();
  const mechanismKeys = ["adaptiveDifficulty", "implicitLearning", "cognitiveReserve", "boosterSessions"];

  return (
    <div className="screen screen-padded">
      <GlobalHeader setScreen={setScreen} rightContent={
        <button className="btn btn-ghost" onClick={() => setScreen("dashboard")}>{t("nav.back")}</button>
      }/>
      <div className="app-content">
        <h2 className="heading-md mb-md">{t("science.title")}</h2>
      </div>

      <div className="app-content flex-col gap-md animate-in">
        <div className="card">
          <h3 className="heading-sm mb-md" style={{fontSize:18}}>{t("science.activeStudy.title")}</h3>
          <p className="text-serif" style={{fontSize:17,lineHeight:1.8,color:"var(--text-secondary)"}}>
            {t("science.activeStudy.body")}
          </p>
          <div className="citation mt-md">
            <div className="citation-source">Coe et al., Alzheimer's & Dementia: TRCI, 2026</div>
            <div className="citation-inst">Johns Hopkins / NIH</div>
          </div>
        </div>

        <div className="card">
          <h3 className="heading-sm mb-md" style={{fontSize:18}}>{t("science.whyItWorks.title")}</h3>
          {mechanismKeys.map((key, index) => (
            <div key={index} style={{display:"flex",gap:14,marginBottom:index < mechanismKeys.length - 1 ? 20 : 0}}>
              <div className="flex-center" style={{width:34,height:34,borderRadius:17,background:"var(--accent-light)",
                color:"var(--accent)",fontSize:17,fontWeight:700,flexShrink:0,border:"1px solid var(--accent-border)"}}>{index + 1}</div>
              <div>
                <div className="heading-sm" style={{marginBottom:4}}>{t("science.mechanism." + key + ".title")}</div>
                <p className="text-body" style={{fontSize:15}}>{t("science.mechanism." + key + ".desc")}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <h3 className="heading-sm mb-md" style={{fontSize:18}}>{t("science.supportingResearch")}</h3>
          {[2,3,4,5,6,7,8].map((factIdx, index) => {
            const fact = getResearchFact(t, factIdx);
            return (
              <div key={index} style={{marginBottom:16,paddingBottom:16,borderBottom:index < 6 ? "1px solid var(--border-light)" : "none"}}>
                <p className="text-serif" style={{fontSize:17,lineHeight:1.7,color:"var(--text-secondary)",marginBottom:6}}>{fact.text}</p>
                <div className="citation-source">{fact.source}</div>
                <div className="citation-inst">{fact.institution}</div>
              </div>
            );
          })}
        </div>

        <div className="card">
          <h3 className="heading-sm mb-sm" style={{fontSize:18}}>{t("science.howDifferent.title")}</h3>
          <p className="text-body">
            {t("science.howDifferent.body")}
          </p>
          <p className="text-serif" style={{fontSize:16,color:"var(--text-muted)",fontStyle:"italic",marginTop:14,lineHeight:1.6}}>
            {t("science.howDifferent.disclaimer")}
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
  const { t, locale } = useTranslation();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editingGoal, setEditingGoal] = useState(false);
  const [editingAge, setEditingAge] = useState(false);
  const [editingSessionMode, setEditingSessionMode] = useState(false);
  const [confirmRetake, setConfirmRetake] = useState(false);
  const [editingLanguage, setEditingLanguage] = useState(false);

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
      <span style={{fontWeight:600,color:accent ? "var(--accent)" : "var(--text)"}}>{value}{onClick ? " >" : ""}</span>
    </div>
  );

  const goalOptions = [2, 3, 4, 5, 7];
  const ageOptions = Object.keys(AGE_NORMS);

  return (
    <div className="screen" style={{paddingBottom:40}}>
      <GlobalHeader setScreen={setScreen} rightContent={
        <button className="btn btn-ghost" onClick={() => setScreen("dashboard")}>{t("nav.back")}</button>
      }/>
      <div className="app-content">
        <h2 className="heading-md mb-md">{t("settings.title")}</h2>
      </div>

      <div className="app-content flex-col gap-md">
        {/* Account */}
        <div className="card">
          <div className="text-label mb-sm">{t("settings.account")}</div>
          <SettingsRow label={t("settings.username")} value={user?.username}/>
        </div>

        {/* Accessibility */}
        <div className="card">
          <div className="text-label mb-sm">{t("settings.accessibility")}</div>

          {/* Language */}
          {!editingLanguage ? (
            <SettingsRow label={t("settings.language")} value={LANGUAGES.find(l => l.code === locale)?.nativeName || "English"} onClick={() => setEditingLanguage(true)} accent/>
          ) : (
            <div style={{padding:"14px 0",borderBottom:"1px solid var(--border-light)"}}>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {LANGUAGES.map(lang => (
                  <button key={lang.code} className="btn" onClick={() => { updateAppData({ language: lang.code }); setEditingLanguage(false); }}
                    style={{padding:"10px 16px",fontSize:17,fontWeight:600,borderRadius:"var(--radius-sm)",
                      border: locale === lang.code ? "1.5px solid var(--accent-border)" : "1.5px solid var(--border)",
                      background: locale === lang.code ? "var(--accent-light)" : "transparent",
                      color: locale === lang.code ? "var(--accent)" : "var(--text-secondary)"}}>
                    {lang.nativeName}
                  </button>
                ))}
              </div>
              <button className="btn btn-ghost mt-sm" onClick={() => setEditingLanguage(false)} style={{fontSize:14}}>{t("nav.cancel")}</button>
            </div>
          )}

          {/* Font Size */}
          <div style={{padding:"14px 0",borderBottom:"1px solid var(--border-light)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <span>{t("settings.fontSize")}</span>
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {["normal","large","extraLarge"].map(size => (
                <button key={size} className="btn" onClick={() => updateAppData({ fontSize: size })}
                  style={{padding:"10px 18px",fontSize:17,fontWeight:600,borderRadius:"var(--radius-sm)",
                    border: (appData.fontSize || "normal") === size ? "1.5px solid var(--accent-border)" : "1.5px solid var(--border)",
                    background: (appData.fontSize || "normal") === size ? "var(--accent-light)" : "transparent",
                    color: (appData.fontSize || "normal") === size ? "var(--accent)" : "var(--text-secondary)"}}>
                  {t("settings.fontSize." + size)}
                </button>
              ))}
            </div>
          </div>

          {/* High Contrast */}
          <SettingsRow label={t("settings.highContrast")} value={appData.highContrast ? t("settings.on") : t("settings.off")}
            onClick={() => updateAppData({ highContrast: !appData.highContrast })} accent/>
        </div>

        {/* Training */}
        <div className="card">
          <div className="text-label mb-sm">{t("settings.training")}</div>

          {/* Weekly Goal — editable */}
          {!editingGoal ? (
            <SettingsRow label={t("settings.weeklyGoal")} value={appData.weeklyGoal + " " + t("settings.sessions")} onClick={() => setEditingGoal(true)} accent/>
          ) : (
            <div style={{padding:"14px 0",borderBottom:"1px solid var(--border-light)"}}>
              <div style={{fontSize:16,color:"var(--text-secondary)",marginBottom:10}}>{t("settings.sessionsPerWeek")}</div>
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
              <button className="btn btn-ghost mt-sm" onClick={() => setEditingGoal(false)} style={{fontSize:14}}>{t("nav.cancel")}</button>
            </div>
          )}

          {/* Age Group — editable */}
          {!editingAge ? (
            <SettingsRow label={t("settings.ageGroup")} value={appData.ageGroup} onClick={() => setEditingAge(true)} accent
              hint={t("settings.ageGroupHint")}/>
          ) : (
            <div style={{padding:"14px 0",borderBottom:"1px solid var(--border-light)"}}>
              <div style={{fontSize:16,color:"var(--text-secondary)",marginBottom:10}}>{t("settings.selectAgeGroup")}</div>
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
              {["18–29","30–39","40–49","50–59"].includes(appData.ageGroup) && (
                <p className="text-small" style={{color:"var(--text-muted)", marginTop:12, lineHeight:1.6}}>
                  {t("onboarding.ageDisclaimer")}
                </p>
              )}
              <button className="btn btn-ghost mt-sm" onClick={() => setEditingAge(false)} style={{fontSize:14}}>{t("nav.cancel")}</button>
            </div>
          )}

          {/* Session Length — editable */}
          {!editingSessionMode ? (
            <SettingsRow label={t("training.sessionLength")} value={SESSION_MODES[appData.sessionMode || "full"].label} onClick={() => setEditingSessionMode(true)} accent/>
          ) : (
            <div style={{padding:"14px 0",borderBottom:"1px solid var(--border-light)"}}>
              <div style={{fontSize:16,color:"var(--text-secondary)",marginBottom:10}}>{t("training.sessionLength")}</div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {Object.entries(SESSION_MODES).map(([key, m]) => (
                  <button key={key} className="btn" onClick={() => { updateAppData({ sessionMode: key }); setEditingSessionMode(false); }}
                    style={{padding:"12px 16px",fontSize:16,fontWeight:500,borderRadius:"var(--radius-sm)",textAlign:"left",
                      border: (appData.sessionMode || "full") === key ? "1.5px solid var(--accent-border)" : "1.5px solid var(--border)",
                      background: (appData.sessionMode || "full") === key ? "var(--accent-light)" : "transparent",
                      color: (appData.sessionMode || "full") === key ? "var(--accent)" : "var(--text-secondary)"}}>
                    {m.label}
                  </button>
                ))}
              </div>
              <button className="btn btn-ghost mt-sm" onClick={() => setEditingSessionMode(false)} style={{fontSize:14}}>{t("nav.cancel")}</button>
            </div>
          )}

          <SettingsRow label={t("settings.baseline")} value={(appData.baseline || "—") + "ms"}/>
          <SettingsRow label={t("settings.totalSessions")} value={(appData.sessions || []).length}/>

          {/* Retake Baseline */}
          {!confirmRetake ? (
            <div className="settings-row" style={{cursor:"pointer"}} onClick={() => setConfirmRetake(true)}>
              <span>{t("settings.retakeBaseline")}</span>
              <span style={{fontWeight:600,color:"var(--accent)"}}>{t("settings.retake")} {"›"}</span>
            </div>
          ) : (
            <div style={{padding:"14px 0",borderBottom:"1px solid var(--border-light)"}}>
              <p style={{fontSize:17,color:"var(--text-secondary)",lineHeight:1.6,marginBottom:12}}>
                {t("settings.retakeConfirm")}
              </p>
              <div style={{display:"flex",gap:10}}>
                <button className="btn btn-secondary" style={{flex:1,padding:12,fontSize:14}} onClick={() => setConfirmRetake(false)}>{t("nav.cancel")}</button>
                <button className="btn btn-primary" style={{flex:1,padding:12,fontSize:14}} onClick={() => {
                  updateAppData({ onboarded: false });
                  setScreen("onboarding");
                }}>{t("settings.startAssessment")}</button>
              </div>
            </div>
          )}
        </div>

        {/* Privacy & Data */}
        <div className="card">
          <div className="text-label mb-sm">{t("settings.privacyData")}</div>
          <SettingsRow label={t("settings.researchConsent")} value={appData.researchConsent ? t("settings.on") : t("settings.off")}
            onClick={() => updateAppData({ researchConsent: !appData.researchConsent })} accent
            hint={t("settings.researchConsentHint")}/>
        </div>

        {/* Actions */}
        <button className="btn btn-secondary" onClick={handleLogout}>{t("settings.signOut")}</button>

        {!confirmDelete ? (
          <button className="btn btn-secondary" style={{color:"var(--incorrect)",borderColor:"var(--incorrect)"}} onClick={() => setConfirmDelete(true)}>
            {t("settings.deleteAccount")}
          </button>
        ) : (
          <div className="card" style={{borderColor:"var(--incorrect)"}}>
            <p style={{fontSize:17,color:"var(--text)",lineHeight:1.6,marginBottom:14}}>
              {t("settings.deleteConfirm")}
            </p>
            <div style={{display:"flex",gap:10}}>
              <button className="btn btn-secondary" style={{flex:1}} onClick={() => setConfirmDelete(false)}>{t("nav.cancel")}</button>
              <button className="btn btn-primary" style={{flex:1,background:"var(--incorrect)"}} onClick={deleteAccount}>{t("settings.delete")}</button>
            </div>
          </div>
        )}

        <div className="text-center" style={{padding:"16px 0"}}>
          <div className="text-small">{t("settings.version")}</div>
          <div className="text-small mt-sm">{t("settings.disclaimer")}</div>
          <div className="text-small mt-sm">{t("settings.builtBy")}</div>
        </div>
      </div>
    </div>
  );
}
