// The rock-stack progression model. Transparent, deterministic, never punitive.
//
// Height      → number of stones. Grows from accumulated `growth` (1.0 = one stone).
// Stability   → recent consistency. Drifts gently with time away, never below FLOOR.
// Composition → variety of kinds of care in the last 7 days.
// Pressure    → time away + passing gusts of wind (visual only, never destructive).
// Restoration → returning to an activity after time away restores stability quickly.

import type { ActivityRecord, ActivityType, AppState, CareKind, Contribution, Stone, StoneShape, StackState } from '../types';
import { DAY, clamp, dayKey, randSeed, uid } from './util';

export const STABILITY_FLOOR = 0.42;
export const DAILY_GROWTH_CAP = 2.4; // at most ~2 stones a day, so the tower can't be farmed

export const CARE_OF: Record<ActivityType, CareKind> = {
  breathing: 'breathe', grounding: 'breathe', puzzle: 'think', lesson: 'learn',
  journal: 'reflect', mood: 'reflect', focus: 'focus', intention: 'focus',
  movement: 'move', care: 'rest', antiscroll: 'rest', checkin: 'talk',
};

export const CARE_LABEL: Record<CareKind, string> = {
  breathe: 'Breathing', think: 'Thinking', learn: 'Learning', reflect: 'Reflection',
  focus: 'Focus', move: 'Movement', rest: 'Rest', talk: 'Speaking',
};

interface Rule { growth: number; stability: number; detail?: Contribution['detail']; newShape?: boolean; note: string }

const RULES: Record<ActivityType, Rule> = {
  breathing:  { growth: 0.45, stability: 0.14, note: 'The stack settles a little.' },
  grounding:  { growth: 0.45, stability: 0.14, note: 'The stones settle into place.' },
  puzzle:     { growth: 0.5,  stability: 0.06, newShape: true, note: 'A new kind of stone is forming.' },
  lesson:     { growth: 0.4,  stability: 0.05, detail: 'sprout', note: 'Something new takes root nearby.' },
  journal:    { growth: 0.3,  stability: 0.07, detail: 'flower', note: 'A small flower opens near the base.' },
  mood:       { growth: 0.1,  stability: 0.04, note: 'Noted, quietly.' },
  focus:      { growth: 0.6,  stability: 0.08, note: 'The stack’s composition grows more solid.' },
  intention:  { growth: 0.25, stability: 0.05, note: 'A clear intention steadies things.' },
  movement:   { growth: 0.35, stability: 0.18, detail: 'grass', note: 'Fresh grass grows around the base.' },
  care:       { growth: 0.15, stability: 0.22, note: 'You steady the stones by hand.' },
  antiscroll: { growth: 0.3,  stability: 0.12, note: 'A conscious choice. The stack steadies.' },
  checkin:    { growth: 0.3,  stability: 0.06, detail: 'sprout', note: 'A small green shoot appears.' },
};

/** Stability shown to the user — drifts slowly with time away, but has a floor. */
export function effectiveStability(stack: StackState, now = Date.now()) {
  const daysAway = (now - stack.lastMeaningfulAt) / DAY;
  const drift = clamp((daysAway - 1) * 0.05, 0, 0.3);
  return clamp(stack.stability - drift, STABILITY_FLOOR, 1);
}

export function balanceWord(s: number) {
  if (s >= 0.86) return 'Settled';
  if (s >= 0.72) return 'Steady';
  if (s >= 0.58) return 'Leaning slightly';
  return 'Ready for a small reset';
}

export const LEVELS = [
  { at: 0, name: 'First Stone' },
  { at: 5, name: 'Finding Balance' },
  { at: 7, name: 'Steady Ground' },
  { at: 10, name: 'Growing Roots' },
  { at: 13, name: 'Quiet Momentum' },
  { at: 17, name: 'Living Sanctuary' },
];

export function levelFor(stones: number) {
  let idx = 0;
  LEVELS.forEach((l, i) => { if (stones >= l.at) idx = i; });
  const next = LEVELS[idx + 1];
  return { idx, name: LEVELS[idx].name, next: next?.name, nextAt: next?.at };
}

export function varietyLast7(activities: ActivityRecord[], now = Date.now()) {
  const kinds = new Set<CareKind>();
  activities.forEach(a => { if (now - a.completedAt < 7 * DAY) kinds.add(CARE_OF[a.type]); });
  return kinds;
}

export function initialStack(now = Date.now()): StackState {
  const base: StoneShape[] = ['slab', 'flat', 'oval'];
  return {
    stones: base.map((shape, i) => ({ id: uid(), seed: 1000 + i * 7919 + randSeed() % 1000, shape, texture: 'river', addedAt: now - 1000, source: 'start' })),
    growth: 0.2,
    stability: 0.8,
    lastMeaningfulAt: now,
    texture: 'river',
    details: { flower: 0, grass: 1, sprout: 0, moss: 0 },
  };
}

const SHAPES: StoneShape[] = ['round', 'flat', 'oval', 'pebble', 'slab', 'wedge'];
const SHAPE_FOR: Partial<Record<CareKind, StoneShape[]>> = {
  breathe: ['oval', 'round'], think: ['wedge', 'pebble'], learn: ['pebble', 'oval'],
  reflect: ['round', 'pebble'], focus: ['slab', 'flat'], move: ['flat', 'oval'], rest: ['round', 'flat'], talk: ['pebble', 'oval'],
};

/**
 * Apply a completed activity. Returns the new stack and the contribution actually made
 * (after diminishing returns and the daily cap).
 */
export function applyActivity(state: AppState, type: ActivityType, opts: { minutes?: number; partial?: boolean } = {}, now = Date.now()) {
  const rule = RULES[type];
  const today = dayKey(now);
  const todays = state.activities.filter(a => dayKey(a.completedAt) === today);
  const sameToday = todays.filter(a => a.type === type).length;
  const growthToday = todays.reduce((s, a) => s + a.contribution.growth, 0);

  let growth = rule.growth / (1 + sameToday * 0.8);       // repeating the same thing gives less
  if (type === 'focus' && opts.minutes) growth += Math.min(0.3, opts.minutes / 60);
  if (opts.partial) growth *= 0.6;
  growth = clamp(Math.min(growth, DAILY_GROWTH_CAP - growthToday), 0, 1);

  // Restoration: returning after time away settles things faster.
  const before = effectiveStability(state.stack, now);
  const restoreBonus = before < 0.7 ? 0.1 : 0;
  const stability = rule.stability + restoreBonus;

  const stack: StackState = { ...state.stack, details: { ...state.stack.details } };
  stack.stability = clamp(before + stability, STABILITY_FLOOR, 1);
  stack.lastMeaningfulAt = now;
  stack.lastSettleAt = now;
  stack.growth = stack.growth + growth;

  if (rule.detail) stack.details[rule.detail] = Math.min(stack.details[rule.detail] + 1, 9);

  let stoneAdded = false;
  if (stack.growth >= 1) {
    stack.growth -= 1;
    const care = CARE_OF[type];
    const recent = stack.stones.slice(-3).map(s => s.shape);
    let pool = rule.newShape ? SHAPES.filter(s => !recent.includes(s)) : (SHAPE_FOR[care] ?? SHAPES);
    if (!pool.length) pool = SHAPES;
    const seed = randSeed();
    const stone: Stone = { id: uid(), seed, shape: pool[seed % pool.length], texture: stack.texture, addedAt: now, source: type };
    stack.stones = [...stack.stones, stone];
    stack.lastStoneEventId = stone.id;
    stoneAdded = true;
  }
  // Moss gathers slowly on older stones as the sanctuary matures.
  const old = stack.stones.filter(s => now - s.addedAt > 4 * DAY).length;
  stack.details.moss = Math.min(old, 6);

  const contribution: Contribution = {
    growth: Math.round(growth * 100) / 100,
    stability,
    detail: rule.detail,
    newShape: rule.newShape && stoneAdded,
    stoneAdded,
    note: stoneAdded ? 'A new stone settles onto your stack.' : growth <= 0.01 ? 'The stack steadies. (Plenty of growth for today — rest is part of it too.)' : rule.note,
  };
  return { stack, contribution };
}

/** Next-stone progress as a gentle phrase rather than a number. */
export function growthPhrase(g: number) {
  if (g < 0.25) return 'A new stone is just beginning to take shape.';
  if (g < 0.6) return 'The next stone is taking shape.';
  if (g < 0.85) return 'The next stone is nearly ready.';
  return 'One more small step and a new stone will settle.';
}
