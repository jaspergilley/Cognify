# S08: Audio Feedback

**Goal:** Users receive audio cues — high tone for correct, low tone for incorrect, chime for session complete
**Demo:** Hear distinct tones on correct/incorrect responses and a pleasant chime at session end

## Must-Haves

- AudioContext created on first user gesture
- Correct: ~600Hz tone, Incorrect: ~300Hz tone
- Session complete: compound chime
- All synthesized via OscillatorNode (no audio files)
- Quiet and non-intrusive

## Tasks

- [ ] **T01: TBD**

## Files Likely Touched

- src/engine/audioFeedback.js (new)
