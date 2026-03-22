---
verified: 2026-03-22T12:00:00Z
scope: Onboarding Welcome Screen (Step 0) vs. Mockup HTML
status: gaps_found
score: 7/10 checks passed
gaps:
  - item: "1. Header — missing hamburger menu button"
    status: failed
    reason: "Mockup includes a hamburger menu button (material-symbols 'menu') to the left of the title. Code omits it entirely."
    artifact:
      path: "src/components/TrainingApp.jsx"
      lines: "313-315"
    fix: "Add a menu button before the h1 inside the left div, matching mockup: <button class='p-2 rounded-full hover:bg-primary/5 transition-colors active:scale-95 duration-200'><span class='material-symbols-outlined text-primary'>menu</span></button>"
  - item: "1. Header — help button missing active:scale-95 duration-200"
    status: failed
    reason: "Mockup help button has 'active:scale-95 duration-200' for press feedback. Code help button only has 'p-2 rounded-full hover:bg-primary/5 transition-colors'."
    artifact:
      path: "src/components/TrainingApp.jsx"
      lines: "316-318"
    fix: "Add 'active:scale-95 duration-200' to the help button className."
  - item: "10. Button container — missing mt-auto"
    status: failed
    reason: "Mockup button container has 'mt-auto' to push it to the bottom of the flex layout. Code only has 'w-full max-w-sm' without mt-auto."
    artifact:
      path: "src/components/TrainingApp.jsx"
      line: "338"
    fix: "Change className from 'w-full max-w-sm' to 'w-full max-w-sm mt-auto'."
---

# Onboarding Welcome Screen -- Mockup Fidelity Verification

**Scope:** Step 0 (Welcome) of the `Onboarding` component vs. provided mockup HTML
**File:** `c:\Users\jaspe\OneDrive\Desktop\Brainmax\src\components\TrainingApp.jsx`, lines 221-401
**Verified:** 2026-03-22
**Status:** GAPS FOUND (7/10 passed, 3 failed)

## Item-by-Item Comparison

### 1. Header: `fixed top-0 left-0 w-full z-50`, branding, help button — FAIL

**Mockup (reference):**
```html
<header class="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 h-20 bg-[#faf6f0] border-b border-[#4a7c59]/10 shadow-[0_4px_20px_rgba(46,50,48,0.06)]">
  <div class="flex items-center gap-4">
    <button class="material-symbols-outlined text-[#4a7c59] hover:bg-[#4a7c59]/5 transition-colors p-2 rounded-full active:scale-95 duration-200">menu</button>
    <h1 class="font-['Literata'] text-2xl font-bold tracking-tight text-[#4a7c59]">CogSpeed</h1>
  </div>
  <div class="flex items-center">
    <button class="material-symbols-outlined text-[#4a7c59] hover:bg-[#4a7c59]/5 transition-colors p-2 rounded-full active:scale-95 duration-200">help</button>
  </div>
</header>
```

**Code (line 312-319):**
```jsx
<header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 h-20 bg-background border-b border-primary/10 shadow-[0_4px_20px_rgba(46,50,48,0.06)]">
  <div className="flex items-center gap-4">
    <h1 className="font-headline text-2xl font-bold tracking-tight text-primary">Cognify</h1>
  </div>
  <button className="p-2 rounded-full hover:bg-primary/5 transition-colors">
    <span className="material-symbols-outlined text-primary text-2xl">help</span>
  </button>
</header>
```

**Discrepancies:**

| Sub-item | Mockup | Code | Match? |
|----------|--------|------|--------|
| Header container classes | `fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 h-20` | Same | YES (bg-background = bg-[#faf6f0], border-primary/10 = border-[#4a7c59]/10) |
| Hamburger menu button | Present (`menu` icon with hover/active states) | **ABSENT** | **NO** |
| Title text | "CogSpeed" | "Cognify" | YES (intentional rename, not a defect) |
| Title font | `font-['Literata'] text-2xl font-bold tracking-tight text-[#4a7c59]` | `font-headline text-2xl font-bold tracking-tight text-primary` | YES (font-headline = Literata, text-primary = #4a7c59) |
| Help button hover | `hover:bg-[#4a7c59]/5` | `hover:bg-primary/5` | YES |
| Help button active | `active:scale-95 duration-200` | **ABSENT** | **NO** |

---

### 2. Main content container — PASS

**Mockup:** `flex-grow flex flex-col items-center justify-center pt-24 pb-12 px-6 max-w-2xl mx-auto w-full`
**Code (line 322):** `flex-grow flex flex-col items-center justify-center pt-24 pb-12 px-6 max-w-2xl mx-auto w-full animate-in`

All mockup classes present. Code adds `animate-in` (fade-in animation) which is a non-breaking enhancement.

---

### 3. Illustration container — PASS

**Mockup:** `w-full aspect-square max-w-md bg-surface-container rounded-xl flex items-center justify-center relative overflow-hidden mb-10 shadow-[0_4px_20px_rgba(46,50,48,0.06)]`
**Code (line 229):** `w-full aspect-square max-w-md bg-surface-container rounded-xl flex items-center justify-center relative overflow-hidden mb-10 shadow-[0_4px_20px_rgba(46,50,48,0.06)]`

Exact class match. Blur blobs also verified:
- Top-left blob: `absolute -top-12 -left-12 w-64 h-64 bg-primary-container/20 rounded-full blur-3xl` -- MATCH
- Bottom-right blob: `absolute -bottom-12 -right-12 w-48 h-48 bg-tertiary-container/20 rounded-full blur-3xl` -- MATCH

---

### 4. Typography wrapper — PASS

**Mockup:** `text-center space-y-6`
**Code (line 234):** `text-center space-y-6`

Exact match.

---

### 5. Title — PASS

**Mockup:** `font-headline text-4xl md:text-5xl font-bold text-on-surface tracking-tight leading-tight`
**Code (line 235):** `font-headline text-4xl md:text-5xl font-bold text-on-surface tracking-tight leading-tight`

Exact class match. Text content "Welcome to Cognify" vs. "Welcome to CogSpeed" is the intentional rename.

---

### 6. Description — PASS

**Mockup:** `font-body text-lg md:text-xl text-on-surface-variant leading-relaxed max-w-lg mx-auto`
**Code (line 238):** `font-body text-lg md:text-xl text-on-surface-variant leading-relaxed max-w-lg mx-auto`

Exact class match. Text content is identical: "Train your brain in just 10 minutes a day to improve your speed and focus."

---

### 7. Progress dots — PASS

**Mockup:** Container `flex gap-3 my-10`, each dot `w-3 h-3 rounded-full`, active `bg-primary`, inactive `bg-outline-variant`
**Code (line 326-334):** Container `flex gap-3 my-10`, each dot `w-3 h-3 rounded-full transition-colors`, active `bg-primary`, inactive `bg-outline-variant`

All mockup classes present. Code adds `transition-colors` for smooth color transitions -- non-breaking enhancement. 4 dots instead of 3 (noted as acceptable in instructions).

---

### 8. Next button — PASS

**Mockup:** `w-full py-5 bg-primary text-on-primary font-body text-xl font-bold rounded-xl shadow-lg active:scale-95 transition-all duration-200 flex items-center justify-center gap-2`
**Code (lines 362-363):** `w-full py-5 bg-primary text-on-primary font-body text-xl font-bold rounded-xl shadow-lg active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer`

All mockup classes present. Code adds `cursor-pointer` -- non-breaking enhancement. Button text "Next" with `arrow_forward` icon matches.

---

### 9. Skip button — PASS

**Mockup:** `w-full mt-4 py-3 text-primary font-body text-base font-semibold hover:bg-primary/5 rounded-lg transition-colors`
**Code (lines 382-383):** `w-full mt-4 py-3 text-primary font-body text-base font-semibold hover:bg-primary/5 rounded-lg transition-colors cursor-pointer`

All mockup classes present. Code adds `cursor-pointer` -- non-breaking enhancement. Text "Skip Introduction" matches.

---

### 10. Button container — FAIL

**Mockup:** `w-full max-w-sm mt-auto`
**Code (line 338):** `w-full max-w-sm`

**Missing `mt-auto`.** This class pushes the button container to the bottom of the flex parent. Without it, the buttons sit directly below the progress dots rather than being anchored at the bottom. This affects the vertical spacing/layout of the entire Welcome screen.

---

## Summary of Discrepancies

| # | Item | Severity | Description |
|---|------|----------|-------------|
| 1a | Header menu button | Medium | Hamburger menu button entirely absent from Onboarding header. Mockup has it to the left of the title. |
| 1b | Header help button active state | Low | Missing `active:scale-95 duration-200` on help button for press feedback. |
| 10 | Button container mt-auto | Medium | Missing `mt-auto` on button container div. Buttons will not be pushed to bottom of flex layout as designed. |

### Severity definitions
- **Medium**: Visually noticeable layout difference from mockup. Affects spatial composition.
- **Low**: Interactive feedback difference. Not visible in static screenshots.

## Non-Breaking Enhancements in Code (Not Defects)

These classes appear in code but not in the mockup. They are improvements, not discrepancies:

| Addition | Where | Purpose |
|----------|-------|---------|
| `animate-in` | Main container | Fade-in entrance animation |
| `transition-colors` | Progress dots | Smooth dot color transitions |
| `cursor-pointer` | Next button, Skip button | Explicit pointer cursor on clickable elements |

---

_Verified: 2026-03-22_
_Verifier: Claude (gsd-verifier)_
