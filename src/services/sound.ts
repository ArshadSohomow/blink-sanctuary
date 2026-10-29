// Optional ambient sound: a soft, generated breeze (no audio files). Never autoplays —
// it only starts after the user switches it on, which counts as a user gesture.
let ctx: AudioContext | null = null;
let gain: GainNode | null = null;
let src: AudioBufferSourceNode | null = null;
let lfo: OscillatorNode | null = null;

export function startAmbient() {
  try {
    if (src) return;
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    ctx = ctx ?? new AC();
    const len = ctx.sampleRate * 4;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) { const white = Math.random() * 2 - 1; last = (last + 0.02 * white) / 1.02; data[i] = last * 3.2; }
    src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 520;
    gain = ctx.createGain(); gain.gain.value = 0;
    lfo = ctx.createOscillator(); lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain(); lfoGain.gain.value = 0.035;
    lfo.connect(lfoGain).connect(gain.gain);
    src.connect(filter).connect(gain).connect(ctx.destination);
    src.start(); lfo.start();
    gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 3);
  } catch { /* audio unavailable */ }
}

export function stopAmbient() {
  try {
    if (gain && ctx) gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);
    const s = src, l = lfo;
    setTimeout(() => { try { s?.stop(); l?.stop(); } catch { /* */ } }, 900);
  } catch { /* */ }
  src = null; lfo = null;
}

export function suspendAmbient(hidden: boolean) {
  try { if (ctx) hidden ? ctx.suspend() : ctx.resume(); } catch { /* */ }
}
