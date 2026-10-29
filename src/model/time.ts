import type { Appearance } from '../types';
import { dayKey, hashStr } from './util';

export type Phase = 'morning' | 'day' | 'dusk' | 'night';

export function phaseFor(d = new Date()): Phase {
  const h = d.getHours() + d.getMinutes() / 60;
  if (h >= 5 && h < 11) return 'morning';
  if (h >= 11 && h < 17) return 'day';
  if (h >= 17 && h < 20.5) return 'dusk';
  return 'night';
}

export function resolvePhase(appearance: Appearance, d = new Date()): Phase {
  return appearance === 'auto' ? phaseFor(d) : appearance;
}

/** 0..1 progress of the sun (or moon) across the sky, for positioning the light. */
export function skyArc(d = new Date()) {
  const h = d.getHours() + d.getMinutes() / 60;
  if (h >= 5 && h < 20.5) return (h - 5) / 15.5;
  const n = h >= 20.5 ? h - 20.5 : h + 3.5;
  return n / 8.5;
}

const GREETINGS: Record<Phase, string[]> = {
  morning: ['A new day, a little room to grow.', 'Good morning. Start where you are.', 'The light is still soft. No rush.'],
  day: ['Come back to the present.', 'A small pause, right in the middle of things.', 'Here for a moment. That’s enough.'],
  dusk: ['Let the day settle.', 'The light is lowering. So can you.', 'Evening. What can you set down?'],
  night: ['Nothing more is required of you right now.', 'The day is done. Rest is allowed.', 'Quiet hours. Be gentle with yourself.'],
};

export function greeting(phase: Phase, name?: string) {
  const list = GREETINGS[phase];
  const line = list[hashStr(dayKey() + phase) % list.length];
  return name ? { hello: helloFor(phase, name), line } : { hello: helloFor(phase), line };
}

function helloFor(phase: Phase, name?: string) {
  const base = { morning: 'Good morning', day: 'Good afternoon', dusk: 'Good evening', night: 'Good night' }[phase];
  return name ? `${base}, ${name}` : base;
}
