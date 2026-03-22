# Comparison: Data Architecture -- localStorage-Only vs Supabase-From-Day-One

**Context:** Data architecture and backend strategy for Cognify hackathon MVP
**Recommendation:** Ship localStorage tonight behind a DataService abstraction. Add Supabase on ca-central-1 in a dedicated v1.1 milestone within the first week. The alternative is strategically correct but tactically wrong for tonight.
**Researched:** 2026-03-21
**Confidence:** HIGH

---

## Quick Comparison

| Criterion | localStorage-Only (Original) | Supabase Day-One (Alternative) |
|-----------|-------------------------------|-------------------------------|
| **Ship tonight** | YES -- zero setup overhead | RISKY -- 3.5-5.5h of backend work on top of 57 requirements |
| **Data durability** | POOR -- Safari ITP 7-day eviction, browser clear, device loss | GOOD -- PostgreSQL survives all client-side loss |
| **Offline capability** | NATIVE -- works without network by default | REQUIRES ENGINEERING -- IndexedDB buffer + sync queue + conflict handling |
| **Auth complexity** | None (no accounts) | 1-2h for Supabase Auth + RLS policies |
| **Sync tax (adding backend later)** | REAL but SMALL -- append-only data model makes sync trivial | AVOIDED -- data flows to server from the start |
| **Privacy/compliance** | N/A -- no data leaves device | TRIGGERED -- collecting personal data requires consent, privacy policy, residency |
| **Normative data** | Not possible without server-side tables | Possible but methodologically flawed (see Question 5) |
| **Scope risk** | LOW -- 2 localStorage keys, well-understood | HIGH -- adds auth, RLS, schema, sync, consent, privacy policy |

---

## The Six Questions

### Question 1: Is Adding Supabase Tonight Realistic?

**Verdict: No, not safely.**

Supabase cloud project creation takes about 30 seconds. That is not the bottleneck. The real cost breakdown:

| Task | Time | Notes |
|------|------|-------|
| Create Supabase project, get API keys | 5 min | Trivial |
| Design PostgreSQL schema (profiles, sessions, trials) | 30-45 min | Normalization, foreign keys, indexes, types |
| Write RLS policies for all tables | 30-60 min | One policy per table per operation. RLS bugs are silent -- data disappears without errors |
| Set up Supabase Auth (email/magic link) | 30-45 min | Auth UI, session management, token refresh, protected routes |
| Build offline buffer (IndexedDB via `idb`) | 60-90 min | Queue writes, batch sync on reconnect, handle partial failures |
| Build consent/onboarding flow | 30-45 min | Informed consent for health-adjacent data |
| Integration testing (auth + RLS + sync) | 30-60 min | RLS is notoriously hard to debug |
| **Total additional scope** | **3.5-5.5h** | On top of the existing 57 requirements |

The existing COMPARISON.md estimates 20-30 hours for the original 57 requirements. Adding 4+ hours of backend plumbing to a hackathon evening is how you ship nothing instead of something.

The Supabase quickstart tutorials show simple CRUD apps. They do not show offline-first psychophysics platforms with health data compliance. The complexity is not "can I connect to Supabase" -- it is "can I build a reliable offline buffer, sync queue, auth flow, RLS policies, and consent mechanism while also building a frame-accurate canvas rendering engine."

**Supabase setup time is fast. Supabase integration into an offline-first, health-adjacent, timing-critical application is not.**

---

### Question 2: Is the Data Loss Argument Valid?

**Verdict: Yes, the data loss risk is real and serious. But it does not justify adding Supabase tonight.**

The data loss scenarios for localStorage are all confirmed:

**Safari ITP 7-Day Eviction (CONFIRMED -- HIGH confidence)**
Safari deletes ALL script-writable storage (localStorage, IndexedDB, Service Workers) for origins not visited within 7 days. This has been browser policy since Safari 13.1 / iOS 13.4. For a cognitive training app targeting elderly users where the protocol calls for 3 sessions per week, a user who misses a single week loses everything. This is not hypothetical -- it is documented WebKit policy.

Critically: this also affects IndexedDB. The alternative proposal's "IndexedDB as offline buffer" does not survive Safari's 7-day eviction any better than localStorage. Both are "script-writable storage" under ITP. The only durable client-side option on Safari is requesting persistent storage via `navigator.storage.persist()`, which Safari 17+ supports but does not guarantee.

**Browser Data Clearing (CONFIRMED -- HIGH confidence)**
"Clear browsing data" in every major browser removes localStorage. Elderly users troubleshooting browser issues, or family members "helping" by clearing data, will destroy training history. This is a real scenario for the target demographic.

**Device Changes (CONFIRMED -- HIGH confidence)**
New phone, factory reset, switching browsers, borrowing a family member's device -- localStorage does not sync across devices or browsers. For elderly users who may receive new devices as gifts or have devices set up by family members, this is a real loss vector.

**Private/Incognito Mode (CONFIRMED -- HIGH confidence)**
localStorage in private browsing is isolated and cleared when the session ends. An elderly user who accidentally opens Safari in private mode and completes a training session loses all data on close.

**However, the tactical response is not "add Supabase tonight":**

- Zero users exist yet. There is no data to lose tonight.
- The first priority is proving the timing engine and staircase algorithm work. Invalid psychophysics data in PostgreSQL is not better than valid psychophysics data in localStorage.
- A JSON export button (10 minutes to build) provides immediate manual backup.
- Adding Supabase within the first week keeps the vulnerability window to days, not months.

**Severity: HIGH for the product. LOW for tonight.**

---

### Question 3: Is the "Sync Tax" Argument Valid?

**Verdict: Partially valid, but overstated for Cognify's specific data model.**

The sync tax argument: "Building offline-first with localStorage then adding a backend later is harder than starting with the backend because you must retrofit sync, handle migration, and manage dual storage."

This is true in the general case. Offline-first sync is genuinely hard -- conflict resolution, ordering guarantees, partial failure handling, migration of existing client-only users. The Hacker News thread "I still haven't found the holy grail architecture for offline-first" confirms this is an unsolved problem in the general case.

**But Cognify has four unusual properties that make sync dramatically simpler than the general case:**

1. **Append-only data model.** Sessions are never edited after completion. Trials are never modified. There is no conflict resolution problem -- you only INSERT, never UPDATE. Two devices cannot produce conflicting writes to the same record.

2. **Natural batch boundaries.** A session completes as an atomic unit, then syncs. There is no continuous real-time sync requirement. The sync unit is "one completed session object."

3. **Idempotent writes.** Each session has a UUID. Re-uploading a session is safe via UPSERT on session ID. Network failures are safe to retry.

4. **Small payloads.** A session is 2-5KB of JSON. Network failures retry cheaply. There is no large binary data.

These properties reduce the "sync tax" to approximately:

```javascript
// The entire sync layer for Cognify (~30 lines)
async function syncSession(session) {
  const { error } = await supabase
    .from('sessions')
    .upsert(session, { onConflict: 'id' });
  if (!error) {
    markSessionSynced(session.id); // flip flag in localStorage
  }
}

async function syncPendingSessions() {
  const sessions = getSessions().filter(s => !s.synced);
  for (const session of sessions) {
    await syncSession(session);
  }
}
```

This is not the nightmarish sync engine that offline-first literature warns about. Cognify's data model is append-only and session-batched -- the two properties that make sync trivial.

**The sync tax is real but costs approximately 2 hours of engineering when you add Supabase later. It does not justify adding 4+ hours of scope tonight.**

---

### Question 4: Is ca-central-1 Data Residency Relevant?

**Verdict: Premature for hackathon. Essential before any real deployment with user accounts.**

The Canadian privacy regulatory landscape:

| Law | Scope | Triggered By Cognify? |
|-----|-------|------------------------|
| **PIPEDA** (federal) | Private-sector collection of personal info in commercial activities | NOT TONIGHT -- no data leaves device. YES when accounts are added -- email + cognitive performance = personal information |
| **FIPPA** (Ontario) | Public bodies (universities, government) | Only if operated by a public institution |
| **PIPA** (BC/Alberta) | Provincial private-sector privacy | Same trigger as PIPEDA -- only when collecting data server-side |
| **PHIPA** (Ontario) | Personal health information custodians | Unlikely -- a consumer training app is not a "health information custodian" unless marketed as medical |

**The key threshold:** The moment you add user accounts and store cognitive performance data on a server, you are collecting personal information (email address) linked to health-adjacent data (processing speed thresholds, cognitive performance trends). At that point:

- Data residency becomes legally relevant
- Privacy policy becomes required
- Informed consent for data collection is advisable
- ca-central-1 is the correct AWS region for Canadian users

**Tonight, with localStorage-only and no accounts, none of this is triggered.** The data never leaves the user's device. There is no "collection" by an organization under any Canadian privacy law.

**Recommendation:** When Supabase is added in v1.1, deploy to ca-central-1 from the start. It costs nothing extra (Supabase supports ca-central-1 natively). Choosing the wrong region initially and migrating later is painful. But do not let compliance concerns block the hackathon.

---

### Question 5: Normative Data Integration -- Table Stakes or v2?

**Verdict: Firmly v2 or later. Not table stakes. Methodologically problematic if done naively.**

Normative data (Cam-CAN, NIH Toolbox) would enable percentile rankings: "Your processing speed of 120ms is faster than 85% of people your age." This sounds compelling, but there are serious problems:

**Problem 1: Cognify does not measure the same construct as NIH Toolbox.**
The NIH Toolbox Pattern Comparison Processing Speed Test uses a same/different pattern-matching paradigm. Cognify uses a shape-identification paradigm derived from UFOV/Double Decision. The scores are not directly comparable. Showing "85th percentile based on NIH Toolbox norms" for a fundamentally different test would be scientifically misleading. The NIH Toolbox normative sample (4,859 participants ages 3-85) is calibrated to their specific task, not yours.

**Problem 2: Normative data requires demographic input.**
Percentile lookup requires age at minimum, and ideally education level and demographic factors. The current MVP has no user profile beyond training state. Adding age collection means forms, validation, and storing demographic data (increasing privacy obligations).

**Problem 3: The raw threshold IS the metric.**
"Your processing speed: 83ms" is meaningful on its own. "12ms faster than last week" is meaningful on its own. Improvement over time is the core outcome measure. The ACTIVE study measured treatment effects via threshold change, not via percentile position.

**Problem 4: Building valid normative tables requires statistical work.**
You cannot simply copy a table from a published paper and present it as your app's norms. The scoring methodology, task parameters, display characteristics, and participant demographics all differ.

**Recommendation:** Defer normative data to v2+. When implemented, use Cognify's own collected data from consenting users to build norms. In the interim, hardcoded age-bracket reference ranges (e.g., "typical range for 60-70 year-olds: 150-250ms based on published UFOV thresholds") can provide rough context without false precision.

---

### Question 6: Minimum Viable Data Architecture That Does Not Paint You Into a Corner

**Verdict: localStorage tonight behind a DataService abstraction layer. This costs 15 minutes and saves hours of refactoring later.**

The architecture:

```
+-------------------------------------------+
|  Application Code                         |
|  (sessions, profile, staircase state)     |
+-------------------------------------------+
          |  calls only DataService methods
          v
+-------------------------------------------+
|  DataService (abstraction layer)          |
|                                           |
|  saveSession(session): void               |
|  getSessions(): Session[]                 |
|  getProfile(): Profile                    |
|  updateProfile(updates): void             |
|  exportData(): string  (JSON)             |
+-------------------------------------------+
          |  tonight            |  v1.1
          v                     v
+--------------------+  +---------------------+
| LocalStorageAdapter|  | SupabaseAdapter     |
| cognify_profile   |  | Writes to Supabase  |
| cognify_sessions  |  | Falls back to local |
+--------------------+  | Migrates old data   |
                        +---------------------+
```

**What to build tonight (adds approximately 15 minutes):**

1. **DataService module** -- 4-5 methods abstracting over localStorage. All application code calls DataService, never `localStorage` directly. This is the critical architectural decision that prevents lock-in.

2. **Schema version field** -- already in the original plan (DATA-05). Include `_version: 1` in all persisted objects.

3. **Session UUIDs** -- already in the original plan (SESS-08 records sessionId). Use `crypto.randomUUID()`. Makes deduplication trivial when syncing later.

4. **JSON export button** -- "Download My Data" triggers `DataService.exportData()` as a file download. Takes 10 minutes. Provides manual backup until Supabase exists.

```javascript
// dataService.js -- the 15-minute investment that saves hours later
const STORAGE_VERSION = 1;
const PROFILE_KEY = 'cognify_profile';
const SESSIONS_KEY = 'cognify_sessions';

const DEFAULT_PROFILE = {
  _version: STORAGE_VERSION,
  totalSessions: 0,
  exercise2Unlocked: false,
  lastThreshold: null,
};

export function getProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return { ...DEFAULT_PROFILE };
    const data = JSON.parse(raw);
    if (data._version !== STORAGE_VERSION) return migrateProfile(data);
    return data;
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

export function updateProfile(updates) {
  const profile = getProfile();
  const merged = { ...profile, ...updates, _version: STORAGE_VERSION };
  localStorage.setItem(PROFILE_KEY, JSON.stringify(merged));
}

export function getSessions() {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSession(session) {
  const sessions = getSessions();
  sessions.push({ ...session, _version: STORAGE_VERSION, synced: false });
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export function exportData() {
  return JSON.stringify({
    profile: getProfile(),
    sessions: getSessions(),
    exportedAt: new Date().toISOString(),
  }, null, 2);
}
```

**What to build in v1.1 (2-3 days after hackathon):**

1. Supabase project on ca-central-1
2. PostgreSQL schema: `profiles`, `sessions`, `trials` tables
3. SupabaseAdapter implementing the same DataService interface
4. One-time migration: on first auth, read localStorage, upload all sessions, mark as migrated
5. Auth flow: Supabase Auth with magic link (lower friction than email/password for elderly users)
6. RLS policies: user owns their own rows
7. Privacy policy page and consent checkbox

**The DataService abstraction is the entire bridge.** Application code never touches localStorage or Supabase directly. Swapping the backing store is a single import change.

---

## Is the Original Plan's Contradiction Justified?

The original plan says:
- "No backend or API calls" -- Out of Scope
- "No user accounts or authentication" -- Out of Scope

The alternative contradicts both. Is the contradiction justified?

**The contradiction is justified in direction but not in timing.**

- **Direction:** A cognitive training app for elderly users MUST eventually have server-side persistence. localStorage is too fragile. The alternative correctly identifies this.
- **Timing:** The hackathon MVP does not need accounts or a backend. The core value -- "does the staircase algorithm produce valid thresholds with frame-accurate timing?" -- is entirely client-side. Proving this is the prerequisite for everything else.

The original plan's constraints should be read as "v1 scope boundaries" not as "permanent architecture decisions." The alternative's features belong in a v1.1/v1.2 roadmap, planned from the start but not blocking the initial ship.

---

## Recommended Timeline

| When | What | Why |
|------|------|-----|
| **Tonight (v1)** | localStorage + DataService abstraction + JSON export + schema versioning | Ship the core timing engine and staircase. Zero backend risk. Prove the protocol works. |
| **Days 2-4 (v1.1)** | Supabase on ca-central-1 + Auth (magic link) + RLS + localStorage migration | Address data durability before real users accumulate significant training data. |
| **Week 2 (v1.2)** | Privacy policy + informed consent flow + data deletion capability | Formalize privacy obligations before public distribution. |
| **Month 2+ (v2)** | Normative data from own users + percentile context + cross-device sync | Build your own normative dataset. Do not borrow from incompatible tests. |

---

## Key Architectural Decisions

| Decision | Tonight | Rationale |
|----------|---------|-----------|
| DataService abstraction over localStorage | YES | 15 minutes investment prevents lock-in, enables clean Supabase swap |
| Schema version in persisted data | YES | Already in original plan. Migration support from day 1 |
| Session UUIDs via crypto.randomUUID() | YES | Already in original plan. Enables idempotent sync later |
| JSON export button | YES | 10 min, manual backup bridge |
| Supabase backend | NO (v1.1) | 4+ hours of scope, not needed to prove core value |
| User accounts/auth | NO (v1.1) | Same as above |
| IndexedDB offline buffer | NO (v1.1) | localStorage works offline natively. IndexedDB adds async complexity. |
| Normative data tables | NO (v2+) | Methodologically flawed without own norms |
| Data residency compliance | NO (choose region in v1.1) | No server-side data tonight |
| Privacy policy/consent | NO (v1.2) | No data collection tonight |

---

## Sources

### Supabase Setup and Capabilities
- [Supabase Getting Started](https://supabase.com/docs/guides/getting-started) -- project creation, quickstart (HIGH confidence)
- [Supabase Available Regions](https://supabase.com/docs/guides/platform/regions) -- ca-central-1 confirmed available (HIGH confidence)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) -- RLS implementation patterns (HIGH confidence)
- [Supabase React Auth Quickstart](https://supabase.com/docs/guides/auth/quickstarts/react) -- auth setup for React apps (HIGH confidence)
- [Supabase React User Management Tutorial](https://supabase.com/docs/guides/getting-started/tutorials/with-react) -- full tutorial with RLS (HIGH confidence)

### localStorage and Data Eviction
- [Apple ITP 7-Day Storage Cap](https://support.didomi.io/apple-adds-a-7-day-cap-on-all-script-writable-storage) -- Safari deletes all script-writable storage after 7 days of non-interaction (HIGH confidence)
- [WebKit Storage Policy Updates](https://webkit.org/blog/14403/updates-to-storage-policy/) -- official WebKit blog, storage eviction details, navigator.storage.persist() support (HIGH confidence)
- [Apple Developer Forums - localStorage iOS 13 Issues](https://developer.apple.com/forums/thread/125627) -- data deletion reports on iOS 13+ (HIGH confidence)
- [PWA iOS Limitations 2026](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide) -- 50MB cache limit, 7-day eviction scope (MEDIUM confidence)

### Offline-First Architecture Tradeoffs
- [PowerSync: Offline-First for Supabase](https://www.powersync.com/blog/bringing-offline-first-to-supabase) -- Supabase has no native offline support (HIGH confidence)
- [RxDB Supabase Replication Plugin](https://rxdb.info/replication-supabase.html) -- IndexedDB + Supabase two-way sync via RxDB (MEDIUM confidence)
- [Supabase Offline Discussion #357](https://github.com/orgs/supabase/discussions/357) -- community confirms no built-in offline support (HIGH confidence)
- [Hacker News: Offline-First Architecture](https://news.ycombinator.com/item?id=28691771) -- "still haven't found the holy grail" for offline-first sync (MEDIUM confidence)
- [RxDB Offline-First Article](https://rxdb.info/offline-first.html) -- comprehensive offline-first patterns and tradeoffs (MEDIUM confidence)

### Canadian Privacy Law
- [PIPEDA Requirements in Brief](https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/pipeda_brief/) -- federal privacy law scope and triggers (HIGH confidence -- official government source)
- [PIPEDA and Other Canadian Privacy Laws](https://jane.app/guide/pipeda-and-other-privacy-laws-in-canada) -- overview of federal and provincial privacy frameworks (MEDIUM confidence)
- [BC Privacy Compliance for Clinics](https://jane.app/guide/privacy-compliance-for-clinics-in-british-columbia) -- PIPA scope and health data context (MEDIUM confidence)

### Normative Data
- [NIH Toolbox Processing Speed Test Normative Data](https://pmc.ncbi.nlm.nih.gov/articles/PMC4542749/) -- 4,859 participants ages 3-85, scaled score methodology, normative tables (HIGH confidence -- peer-reviewed)
- [NIH Toolbox Scoring and Interpretation Guide](https://www.epicrehab.com/epic/documents/crc/crc-201307-nih-toolbox-scoring-and-interpretation-manual%209-27-12.pdf) -- official scoring methodology (HIGH confidence)

### Supabase Offline Sync Patterns
- [Building Offline-First PWA with IndexedDB and Supabase](https://oluwadaprof.medium.com/building-an-offline-first-pwa-notes-app-with-next-js-indexeddb-and-supabase-f861aa3a06f9) -- sync queue architecture, SyncQueueItem pattern (MEDIUM confidence)
- [RxDB-Supabase Offline Support](https://github.com/marceljuenemann/rxdb-supabase) -- community library for offline Supabase (LOW confidence -- third-party)

---
*Data architecture comparison for: Cognify -- localStorage vs Supabase backend strategy*
*Researched: 2026-03-21*
