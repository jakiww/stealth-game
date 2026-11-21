// Sounds: everything is synthesized with WebAudio oscillators, so the game
// ships no audio files and makes no network request. The context is created
// on the first user gesture; every call is safe before that.

let ctx = null;
let muted = false;

export function ensureAudio() {
  if (!ctx) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctx = new AC();
    } catch {
      ctx = null;
    }
  }
  if (ctx && ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

export function isMuted() {
  return muted;
}

function tone(freq, dur, type = 'sine', vol = 0.08, when = 0, slideTo = null) {
  if (muted) return;
  const ac = ensureAudio();
  if (!ac) return;
  const t0 = ac.currentTime + when;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(vol, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noiseBurst(dur, vol = 0.05, when = 0) {
  if (muted) return;
  const ac = ensureAudio();
  if (!ac) return;
  const t0 = ac.currentTime + when;
  const len = Math.max(1, Math.floor(ac.sampleRate * dur));
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ac.createBufferSource();
  src.buffer = buf;
  const gain = ac.createGain();
  gain.gain.value = vol;
  const filter = ac.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 900;
  src.connect(filter).connect(gain).connect(ac.destination);
  src.start(t0);
}

export const sfx = {
  step() { noiseBurst(0.05, 0.02); },
  coin() { tone(1320, 0.07, 'sine', 0.06); tone(1760, 0.12, 'sine', 0.06, 0.06); },
  pickup() { tone(660, 0.1, 'triangle', 0.09); tone(880, 0.12, 'triangle', 0.09, 0.08); tone(1320, 0.16, 'triangle', 0.08, 0.16); },
  alert() { tone(220, 0.28, 'sawtooth', 0.07, 0, 440); tone(440, 0.22, 'sawtooth', 0.06, 0.18, 660); },
  caught() { tone(392, 0.3, 'sawtooth', 0.08, 0, 196); tone(196, 0.5, 'sawtooth', 0.08, 0.25, 98); },
  unlock() { tone(523, 0.12, 'triangle', 0.09); tone(784, 0.2, 'triangle', 0.09, 0.1); },
  levelClear() { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.18, 'triangle', 0.09, i * 0.11)); },
  win() { [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.24, 'triangle', 0.09, i * 0.13)); },
};
