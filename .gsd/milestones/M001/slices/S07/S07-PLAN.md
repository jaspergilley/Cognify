# S07: Data Persistence

**Goal:** All training data persists across browser sessions with appropriate difficulty resumption
**Demo:** Close browser, reopen — history intact, new session starts at previous threshold x 1.1

## Must-Haves

- Session history survives browser close/reopen
- New session starts at previous threshold x 1.1
- Graceful fallback on corrupted/missing data
- DataService abstraction layer
- Schema versioning and unique session IDs

## Tasks

- [ ] **T01: TBD**
- [ ] **T02: TBD**

## Files Likely Touched

- src/services/dataService.js (new)
- src/services/localStorage.js (new)
