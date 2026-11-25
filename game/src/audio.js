// Arcane Kitchen — audio.js
// One job: tiny synthesized sound effects through WebAudio. No audio files,
// no network, nothing to load — every blip is generated in code.

let context = null;
let muted = false;

export function toggleMute() {
  muted = !muted;
  return muted;
}

function ensureContext() {
  if (context) return context;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    context = new AudioContext();
  } catch {
    context = null;
  }
  return context;
}

export function playTone(freq, seconds, kind, volume) {
  if (muted) return;
  const audio = ensureContext();
  if (!audio) return;
  try {
    if (audio.state === 'suspended') audio.resume();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = kind || 'sine';
    oscillator.frequency.value = freq;
    gain.gain.setValueAtTime(volume || 0.12, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + seconds);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + seconds);
  } catch {
    // Sound is garnish; a failure must never break the game.
  }
}

export const sfx = {
  add() { playTone(520, 0.08, 'triangle', 0.1); },
  chop() { playTone(180, 0.1, 'square', 0.08); playTone(90, 0.12, 'sawtooth', 0.05); },
  cook() { playTone(330, 0.15, 'sine', 0.1); playTone(495, 0.2, 'sine', 0.08); },
  ready() { playTone(660, 0.12, 'triangle', 0.12); setTimeout(() => playTone(880, 0.18, 'triangle', 0.12), 110); },
  serve() {
    playTone(523, 0.1, 'triangle', 0.12);
    setTimeout(() => playTone(659, 0.1, 'triangle', 0.12), 90);
    setTimeout(() => playTone(784, 0.2, 'triangle', 0.12), 180);
  },
  district() {
    [523, 659, 784, 1047].forEach((freq, index) => {
      setTimeout(() => playTone(freq, 0.22, 'triangle', 0.12), index * 110);
    });
  },
  bad() { playTone(140, 0.25, 'sawtooth', 0.07); },
};
