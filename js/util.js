import * as THREE from 'three';

export const FONT = '"Arial Rounded MT Bold", "Nunito", "Baloo 2", "Comic Sans MS", "Trebuchet MS", system-ui, sans-serif';

// Animates brand palette (taken from the logo)
export const PALETTE = {
  orange: '#E8833A', lavender: '#C5C9DD', navy: '#3F5AA6', teal: '#1F9E96',
  pink: '#EBB8C6', brown: '#C07A4B', mauve: '#A07AA0', sky: '#2FA8E0',
};

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const randInt = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Square text/emoji label used inside answer bubbles. */
export function makeLabelTexture(text, { color = '#22314f', size = 256 } = {}) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let fs = size * 0.62;
  ctx.font = `bold ${fs}px ${FONT}`;
  const maxW = size * 0.9;
  const w = ctx.measureText(text).width;
  if (w > maxW) fs *= maxW / w;
  ctx.font = `bold ${fs}px ${FONT}`;
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(6, fs * 0.16);
  ctx.strokeStyle = '#ffffff';
  ctx.strokeText(text, size / 2, size / 2 + fs * 0.04);
  ctx.fillStyle = color;
  ctx.fillText(text, size / 2, size / 2 + fs * 0.04);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Wide rounded sign: icon + name + level stars. Returns { texture, redraw(level) }. */
export function makeSignTexture(icon, name, bg) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 256;
  const ctx = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  function redraw(level = 1) {
    ctx.clearRect(0, 0, 512, 256);
    roundRect(ctx, 8, 8, 496, 240, 46);
    ctx.fillStyle = '#ffffff'; ctx.fill();
    roundRect(ctx, 20, 20, 472, 216, 36);
    ctx.fillStyle = bg; ctx.fill();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `bold 78px ${FONT}`;
    ctx.fillStyle = '#fff';
    ctx.fillText(icon, 256, 74);
    let fs = 58;
    ctx.font = `bold ${fs}px ${FONT}`;
    const w = ctx.measureText(name).width;
    if (w > 440) { fs *= 440 / w; ctx.font = `bold ${fs}px ${FONT}`; }
    ctx.fillText(name, 256, 152);
    ctx.font = `bold 40px ${FONT}`;
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i < level ? '#FFE066' : 'rgba(255,255,255,0.35)';
      ctx.fillText('★', 256 + (i - 1) * 46, 208);
    }
    tex.needsUpdate = true;
  }
  redraw(1);
  return { texture: tex, redraw };
}

export function makeSkyTexture() {
  const c = document.createElement('canvas');
  c.width = 4; c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#3fa9f5');
  g.addColorStop(0.55, '#8fd3ff');
  g.addColorStop(1, '#e8f7ff');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 4, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
