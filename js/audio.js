// Music (the Bam Bam theme tune), little synthesised sound effects, and a read-aloud voice
// so children who are still learning to read can play on their own.

export function createSound() {
  const music = new Audio('assets/theme.mp3');
  music.loop = true;
  music.volume = 0.32;
  music.preload = 'auto';

  let ctx = null;
  let musicOn = true, voiceOn = true;
  let voice = null;

  function ensureCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctx = new AC();
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, start, dur, { type = 'sine', vol = 0.18, slideTo = null } = {}) {
    const c = ensureCtx();
    if (!c) return;
    const t0 = c.currentTime + start;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  const sfx = {
    correct() { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.08, 0.22, { type: 'triangle' })); },
    wrong() { tone(300, 0, 0.28, { type: 'sine', slideTo: 170, vol: 0.14 }); },
    star() { tone(1175, 0, 0.1, { type: 'triangle', vol: 0.12 }); tone(1568, 0.07, 0.16, { type: 'triangle', vol: 0.12 }); },
    jump() { tone(280, 0, 0.2, { type: 'sine', slideTo: 620, vol: 0.1 }); },
    pop() { tone(700, 0, 0.09, { type: 'sine', slideTo: 300, vol: 0.12 }); },
    enter() { [392, 523, 659].forEach((f, i) => tone(f, i * 0.09, 0.2, { type: 'triangle', vol: 0.14 })); },
    fanfare() {
      [523, 523, 523, 659, 784, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.13, 0.26, { type: 'triangle', vol: 0.16 }));
    },
  };

  function pickVoice() {
    if (!('speechSynthesis' in window)) return;
    const voices = window.speechSynthesis.getVoices();
    voice = voices.find((v) => /en[-_]GB/i.test(v.lang) && /female|libby|sonia|kate|serena|martha|google uk english female/i.test(v.name))
      || voices.find((v) => /en[-_]GB/i.test(v.lang))
      || voices.find((v) => /^en/i.test(v.lang))
      || null;
  }
  if ('speechSynthesis' in window) {
    pickVoice();
    window.speechSynthesis.addEventListener?.('voiceschanged', pickVoice);
  }

  function speak(text, { queue = false } = {}) {
    if (!voiceOn || !('speechSynthesis' in window)) return;
    try {
      if (!queue) window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      if (voice) u.voice = voice;
      u.lang = voice ? voice.lang : 'en-GB';
      u.rate = 0.92; u.pitch = 1.25; u.volume = 1;
      window.speechSynthesis.speak(u);
    } catch (e) { /* no voice on this device — the game still works */ }
  }

  function startMusic() {
    ensureCtx();
    if (musicOn) music.play().catch(() => {});
  }
  function setMusic(on) {
    musicOn = on;
    if (on) music.play().catch(() => {}); else music.pause();
  }
  function setVoice(on) {
    voiceOn = on;
    if (!on && 'speechSynthesis' in window) window.speechSynthesis.cancel();
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) music.pause(); else if (musicOn && ctx) music.play().catch(() => {});
  });

  return {
    sfx, speak, startMusic, setMusic, setVoice,
    get musicOn() { return musicOn; },
    get voiceOn() { return voiceOn; },
  };
}
