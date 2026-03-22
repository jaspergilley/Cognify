<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 80">
  <circle cx="36" cy="40" r="28" fill="none" stroke="#2D6A4F" stroke-width="3"/>
  <circle cx="36" cy="40" r="15" fill="none" stroke="#2D6A4F" stroke-width="2" opacity="0.4"/>
  <circle cx="36" cy="40" r="5.5" fill="#2D6A4F"/>
  <text x="80" y="52" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif" font-weight="700" font-size="38" letter-spacing="6" fill="#2D6A4F">COGNIFY</text>
</svg>
# Cognify

**Evidence-based cognitive speed training built on a 20-year NIH clinical trial.**

[**Launch Cognify →**](https://cognify-eta-eight.vercel.app/)

---

## What is Cognify?

Cognify is the only brain training app built on the specific intervention proven in the ACTIVE study — a 20-year randomized controlled trial conducted by Johns Hopkins and the NIH — to reduce dementia diagnoses by 25%.

The app delivers adaptive visual speed-of-processing training through three progressive exercises, using the exact staircase algorithm described in the published research. It's designed for adults 50+ with large text, simple flows, and research citations woven throughout.

## The Science

In February 2026, the ACTIVE study published its 20-year follow-up results:

- **2,802 adults** aged 65+ enrolled starting in 1998
- **Only speed-of-processing training with boosters** reduced dementia diagnoses
- **25% reduction** (40% diagnosed vs. 49% in the control group)
- Memory and reasoning training showed **no lasting effect**
- This is the **first RCT** to demonstrate any intervention — cognitive, pharmacological, dietary, or exercise-based — can reduce dementia incidence over two decades

> Coe, N.B. et al. "Impact of Cognitive Training on Claims-Based Diagnosed Dementia Over 20 Years." *Alzheimer's & Dementia: Translational Research and Clinical Interventions*, 2026.

## Features

**Training Engine**
- Three exercises: Central Identification, Divided Attention, Selective Attention
- 3-up/1-down adaptive staircase algorithm converging on ~79% accuracy threshold
- Frame-accurate stimulus timing via `requestAnimationFrame`
- Micro-break research pauses every 10 trials with cited facts

**Progress Tracking**
- Processing speed threshold over time
- Accuracy trends and weekly session frequency
- Personalized dementia risk reduction estimates based on training progress
- Milestone badges tied to the ACTIVE study protocol (10 sessions, 14 sessions, etc.)
- Booster session reminders

**Research Throughout**
- 14 cited studies from Johns Hopkins, NIH, Cambridge Cam-CAN, Karolinska Institute, WHO, and others
- Every statistic sourced inline — no uncited claims
- Honest medical disclaimers on every screen

**Designed for Seniors**
- 18px+ body text, 20px+ buttons, 48px+ tap targets
- Light mode default with optional dark mode (text toggle, no emoji)
- Clean layouts with minimal cognitive load
- Breathing prompts and encouragement between training blocks

**Accounts & Privacy**
- Username/password authentication with SHA-256 hashing (Web Crypto API)
- Persistent cross-session storage
- Terms & Conditions, Privacy Policy, and Data Consent flows
- Account deletion with full data removal

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React (hooks, context) |
| Language | JavaScript, HTML, CSS |
| Styling | CSS Custom Properties (light/dark theming) |
| Charts | Recharts |
| Timing | requestAnimationFrame |
| Security | Web Crypto API (SHA-256) |
| Storage | Persistent Storage API |
| Graphics | SVG |
| Hosting | Vercel |

## Getting Started

Visit [**cognify-eta-eight.vercel.app**](https://cognify-eta-eight.vercel.app/) to start training. No installation required.

1. Create an account (username + password)
2. Accept the Terms, Privacy Policy, and Data Consent
3. Complete the 20-trial baseline assessment
4. Train 3 times per week, ~12 minutes per session

## Project Structure

The entire application is a single React component file (`cognify.jsx`) containing:

- CSS stylesheet with custom properties and responsive breakpoints
- Adaptive staircase algorithm engine
- Trial runner with frame-accurate timing
- Account system with secure hashing
- 12 screen components (landing, auth, legal, onboarding, dashboard, training, summary, progress, science, settings)
- Research citation database (14 studies)
- Personalized impact calculation system

## Research Citations

All statistics used in the app are documented with full sources in [`cognify_statistics_and_sources.md`](cognify_statistics_and_sources.md).

Key sources include:
- Coe et al., *Alzheimer's & Dementia: TRCI*, 2026 (Johns Hopkins / NIH)
- Salthouse, *Psychological Review*, 1996 (University of Virginia)
- Stern, *Neuropsychologia*, 2009 (Columbia University)
- Shafto et al., *BMC Neurology*, 2014 (Cambridge Cam-CAN)
- Lampit et al., *PLOS Medicine*, 2014 (University of Sydney)
- Ngandu et al., *The Lancet*, 2015 (Karolinska Institute)
- WHO Risk Reduction Guidelines, 2019

## Disclaimer

Cognify is a cognitive fitness tool. It is **not** a medical device, diagnostic tool, or treatment for any disease. It has not been evaluated by the FDA or any regulatory body. We do not claim to prevent, treat, diagnose, or cure dementia or any other condition. All estimates are illustrative projections based on published population-level research. Consult your physician before beginning any cognitive training program.

## Team

Built by **Enrique Reid**, **Jasper Gilley**, **Khushaan Virk**, and **Dean Kiyingi**

---

[**Launch Cognify →**](https://cognify-eta-eight.vercel.app/)
