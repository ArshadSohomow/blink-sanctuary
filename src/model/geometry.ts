// Deterministic stone geometry and stack layout. Same stones in → same picture out.
import type { Stone, StoneShape } from '../types';
import { rng } from './util';

const ASPECT: Record<StoneShape, number> = { round: 0.6, flat: 0.36, oval: 0.48, pebble: 0.54, slab: 0.3, wedge: 0.42 };

export interface PlacedStone {
  stone: Stone;
  cx: number; cy: number; w: number; h: number; rot: number;
  path: string;
  speckles: { x: number; y: number; r: number; o: number }[];
  bottomY: number; topY: number;
}

/** Smooth closed path through points (Catmull-Rom → cubic Bézier). */
function smoothPath(pts: [number, number][]) {
  const n = pts.length;
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d + 'Z';
}

/** An organic stone outline centred on (0,0), width w and height h. Bottoms are flatter so they can rest. */
export function stonePath(seed: number, shape: StoneShape, w: number, h: number) {
  const r = rng(seed);
  const N = 14;
  const pts: [number, number][] = [];
  const tilt = (r() - 0.5) * 0.25; // asymmetry: one shoulder higher
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    let rx = w / 2, ry = h / 2;
    const jitter = 1 + (r() - 0.5) * (shape === 'pebble' ? 0.2 : 0.14);
    let x = Math.cos(a) * rx * jitter;
    let y = Math.sin(a) * ry * jitter;
    // flatten the bottom (y>0 is down) so the stone sits believably
    if (y > 0) y *= shape === 'round' ? 0.82 : 0.7;
    // squarer shoulders for slabs
    if (shape === 'slab' || shape === 'flat') { x = Math.sign(x) * Math.pow(Math.abs(x) / rx, 0.8) * rx; }
    // wedge: one side taller
    if (shape === 'wedge') y -= (x / rx) * h * 0.12;
    y += (x / rx) * h * tilt * 0.4;
    pts.push([x, y]);
  }
  return smoothPath(pts);
}

/**
 * Lay out the stack bottom-up. Coordinates are in a 400-wide space with the base
 * resting at y = 0 (stones go into negative y).
 */
export function layoutStack(stones: Stone[]): { placed: PlacedStone[]; height: number } {
  const placed: PlacedStone[] = [];
  let y = 0;
  let comX = 0; // running x of the stone beneath — keep the stack plausibly balanced
  stones.forEach((stone, i) => {
    const r = rng(stone.seed + 17);
    const shrink = Math.max(0.5, 1 - i * 0.04);
    const w = 168 * shrink * (0.84 + r() * 0.26) * (stone.shape === 'pebble' ? 0.78 : stone.shape === 'round' ? 0.82 : 1);
    const h = w * ASPECT[stone.shape] * (0.92 + r() * 0.16);
    const below = placed[i - 1];
    const maxShift = below ? below.w * 0.1 : 0;
    let cx = comX + (r() - 0.5) * 2 * maxShift;
    // nudge back toward the centre line so the whole stack never looks impossible
    cx = cx * 0.75;
    const overlap = below ? Math.min(h, below.h) * 0.16 : 0;
    const bottomY = y + overlap;
    const cy = bottomY - h * 0.42; // bottom is flattened, so centre sits a bit lower
    const rot = (r() - 0.5) * 5;
    const speckles = Array.from({ length: 10 + Math.floor(r() * 14) }, () => ({
      x: (r() - 0.5) * w * 0.85, y: (r() - 0.5) * h * 0.75, r: 0.6 + r() * 1.8, o: 0.12 + r() * 0.25,
    }));
    const path = stonePath(stone.seed, stone.shape, w, h);
    const topY = bottomY - h * 0.92;
    placed.push({ stone, cx, cy, w, h, rot, path, speckles, bottomY, topY });
    y = topY;
    comX = cx;
  });
  return { placed, height: -y };
}

export const TEXTURE_TONES: Record<string, [string, string, string][]> = {
  // [highlight, body, shadow] variants per texture
  river: [['#c9c6bd', '#8f918a', '#55584f'], ['#cfc8b9', '#9a9384', '#5d574b'], ['#bfc3bd', '#848a84', '#4b514d']],
  granite: [['#d6d2cb', '#a19c94', '#615d58'], ['#cbc5bf', '#8f8984', '#56524f'], ['#ddd6cc', '#aaa195', '#6a6258']],
  sandstone: [['#e5cfb2', '#b99a78', '#7a5f45'], ['#e0c7ad', '#ae8f72', '#6f5643'], ['#ecd8bc', '#c3a684', '#82684d']],
  slate: [['#a9b1b4', '#6c757a', '#3a4247'], ['#b0b3b3', '#73787a', '#3f4345'], ['#9fa8ab', '#626c71', '#353c40']],
};
