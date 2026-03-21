/**
 * Audio Feedback Module
 *
 * Synthesized audio cues via Web Audio API OscillatorNode.
 * No external audio files — all sounds generated programmatically.
 *
 * AUDO-01: AudioContext created on first user gesture
 * AUDO-02: Correct answer ~600Hz soft tone
 * AUDO-03: Incorrect answer ~300Hz soft tone
 * AUDO-04: Session complete pleasant chime
 * AUDO-05: All synthesized via OscillatorNode
 * AUDO-06: New OscillatorNode per sound
 * AUDO-07: Quiet and non-intrusive
 *
 * @module engine/audioFeedback
 */

let audioCtx = null;

/**
 * Ensure AudioContext exists (AUDO-01).
 * Must be called from a user gesture handler.
 */
function ensureContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  // Resume if suspended (browser autoplay policy)
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Play a single tone (AUDO-05, AUDO-06).
 *
 * @param {number} frequency - Hz
 * @param {number} duration - Seconds
 * @param {string} [type='sine'] - Oscillator type
 * @param {number} [volume=0.12] - Gain (AUDO-07: quiet)
 */
function playTone(frequency, duration, type = 'sine', volume = 0.12) {
  const ctx = ensureContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.value = frequency;
  gain.gain.value = volume;

  // Smooth envelope to avoid clicks
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.02);
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

/**
 * Correct answer tone (AUDO-02): soft high-pitched ~600Hz.
 */
export function playCorrect() {
  playTone(600, 0.15, 'sine', 0.1);
}

/**
 * Incorrect answer tone (AUDO-03): soft low-pitched ~300Hz.
 */
export function playIncorrect() {
  playTone(300, 0.2, 'sine', 0.08);
}

/**
 * Session complete chime (AUDO-04): ascending two-note chime.
 */
export function playSessionComplete() {
  const ctx = ensureContext();
  const now = ctx.currentTime;

  // Note 1: C5 (523Hz)
  playChimeNote(ctx, 523, now, 0.25);
  // Note 2: E5 (659Hz)
  playChimeNote(ctx, 659, now + 0.2, 0.35);
}

function playChimeNote(ctx, freq, startTime, duration) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.value = freq;
  gain.gain.value = 0;
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(0.1, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + duration);
}

/**
 * Initialize audio context on first user gesture.
 * Call this from a click/touch handler to satisfy browser autoplay policy.
 */
export function initAudio() {
  ensureContext();
}
