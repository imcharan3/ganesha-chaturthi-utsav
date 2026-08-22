/**
 * Synthesize a resonant authentic Temple Bell / Ghanta sound using Web Audio API
 */
export function playTempleBell() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    // Harmonic frequencies that mimic bronze temple bell harmonics
    const bellFrequencies = [520, 1040, 1560, 2080, 2600, 3120];
    const gains = [0.6, 0.4, 0.25, 0.15, 0.08, 0.04];
    const decayTimes = [3.5, 2.5, 1.8, 1.2, 0.8, 0.5];

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.7, now);
    masterGain.connect(ctx.destination);

    bellFrequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      // Slight detuning for rich natural acoustic resonance
      osc.frequency.setValueAtTime(freq + (i * 1.5), now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(gains[i], now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + decayTimes[i]);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(now);
      osc.stop(now + decayTimes[i]);
    });
  } catch (e) {
    console.warn('Audio context playback failed:', e);
  }
}

/**
 * Synthesize an auspicious Shankha (Conch) sound simulation
 */
export function playDevotionalChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.3);
    osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.8);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 1.6);
  } catch (e) {
    console.warn('Devotional chime playback failed:', e);
  }
}
