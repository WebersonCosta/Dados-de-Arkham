import { THREE } from '../vendor.js';
import { rnd, rand, pick, TAU } from './util.js';

// Ajudantes para pintar texturas à mão num <canvas> (madeira, papel, faces dos dados…).

export function mkCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

export function speckle(ctx, w, h, colors, count, rmin, rmax, alpha) {
  for (let i = 0; i < count; i++) {
    ctx.globalAlpha = alpha * rnd();
    ctx.fillStyle = pick(colors);
    ctx.beginPath(); ctx.arc(rand(0, w), rand(0, h), rand(rmin, rmax), 0, TAU); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function canvasTexture(canvas, { srgb = true, anisotropy = 1 } = {}) {
  const t = new THREE.CanvasTexture(canvas);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = anisotropy;
  return t;
}
