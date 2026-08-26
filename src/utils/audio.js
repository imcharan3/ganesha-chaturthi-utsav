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

/**
 * Image Compression Utility
 * Compresses images client-side to lightweight, permanent Base64 Data URLs (JPEG).
 * Ensures screenshots are stored permanently in MongoDB Atlas without relying on ephemeral server disks.
 */
export const compressImageToBase64 = (file, maxDimension = 1200, quality = 0.75) => {
  return new Promise((resolve, reject) => {
    if (!file) return resolve(null);

    // Validate if file is an image
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Selected file is not an image. Please choose a JPG or PNG photo.'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read selected image file.'));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image format.'));
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let { width, height } = img;

          if (width > height) {
            if (width > maxDimension) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            }
          } else {
            if (height > maxDimension) {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        } catch (err) {
          reject(err);
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
};

