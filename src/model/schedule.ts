// Scheduling and reminder logic — pure functions, separate from the UI.
import type { AppState, ReminderCategory, RoutineItem } from '../types';
import { dayKey, hashStr, inWindow, minutesOfDay, nowMinutes } from './util';

export interface DueReminder {
  key: string;
  category: ReminderCategory;
  title: string;
  body: string;
  activity?: string; // catalogue id to start
  routineId?: string;
}

export const PAUSE_LINES = [
  'A small pause, if you need one.',
  'Want to return to what you were doing?',
  'Your next step is still there when you’re ready.',
  'Take a breath before the next scroll.',
  'Fancy a two-minute reset?',
];

export const ACTIVITY_FOR_ROUTINE: Record<string, string> = {
  breathing: 'breath-slow', grounding: 'grounding', puzzle: 'puzzle-logic', lesson: 'lesson', journal: 'journal', mood: 'mood',
  focus: 'focus', movement: 'movement', care: 'care-garden', antiscroll: 'antiscroll', checkin: 'checkin', intention: 'intention',
};

/** When (if at all) a routine item is planned for the given day. */
export function plannedTime(item: RoutineItem, date = new Date()): string | null {
  const key = dayKey(date);
  if (!item.enabled) return null;
  if (item.rescheduledTo?.date === key) return item.rescheduledTo.time;
  if (item.skippedOn === key) return null;
  return item.days.includes(date.getDay()) ? item.time : null;
}

export function routineDoneToday(s: AppState, item: RoutineItem, now = Date.now()) {
  if (item.doneOn === dayKey(now)) return true;
  const t = plannedTime(item);
  if (!t) return false;
  const since = new Date(now); since.setHours(0, 0, 0, 0);
  const startMs = since.getTime() + Math.max(0, minutesOfDay(t) - 90) * 60_000;
  return s.activities.some(a => a.type === item.activity && a.completedAt >= startMs);
}

export function inQuietHours(s: AppState, d = new Date()) {
  return inWindow(nowMinutes(d), s.reminders.quietStart, s.reminders.quietEnd);
}

export function shownToday(s: AppState, now = Date.now()) {
  const k = dayKey(now);
  return s.remindersLog.filter(l => l.action === 'shown' && dayKey(l.at) === k).length;
}

export function findDue(s: AppState, now = new Date()): DueReminder | null {
  const r = s.reminders;
  if (!r.enabled) return null;
  if (s.snoozedUntil && now.getTime() < s.snoozedUntil) return null;
  if (inQuietHours(s, now)) return null;
  if (shownToday(s, now.getTime()) >= r.maxPerDay) return null;
  const today = dayKey(now);
  const m = nowMinutes(now);

  if (r.categories.routine) {
    for (const item of s.routines) {
      const t = plannedTime(item, now);
      if (!t || !item.reminder || item.remindedOn === today) continue;
      const start = minutesOfDay(t);
      if (m >= start && m < start + Math.max(15, item.windowMins) && !routineDoneToday(s, item, now.getTime())) {
        const isFocus = item.activity === 'focus';
        if (isFocus && !r.suggestFocus) continue;
        return { key: `routine:${item.id}:${today}`, category: isFocus ? 'focus' : 'routine', title: item.title, body: isFocus ? 'Your focus time is here, whenever you’re ready.' : 'Part of your rhythm — only if it suits you right now.', activity: ACTIVITY_FOR_ROUTINE[item.activity], routineId: item.id };
      }
    }
  }

  const inWin = inWindow(m, r.windowStart, r.windowEnd);
  if (r.categories.checkin && r.simulatedCalls && inWin) {
    const already = s.remindersLog.some(l => l.category === 'checkin' && dayKey(l.at) === today);
    const ws = minutesOfDay(r.windowStart), we = minutesOfDay(r.windowEnd);
    const span = we > ws ? we - ws : 24 * 60 - ws + we;
    const at = (ws + 60 + (hashStr(today) % Math.max(1, span - 120))) % (24 * 60);
    if (!already && m >= at) return { key: `checkin:${today}`, category: 'checkin', title: 'Blink is checking in', body: 'A simulated check-in call. Accept or decline — either is fine.', activity: 'checkin' };
  }

  if (r.categories.pause && r.pauseEveryHours > 0 && inWin) {
    const last = [...s.remindersLog].reverse().find(l => l.category === 'pause' && l.action === 'shown');
    if (!last || now.getTime() - last.at >= r.pauseEveryHours * 3_600_000) {
      return { key: `pause:${now.getTime()}`, category: 'pause', title: PAUSE_LINES[hashStr(String(Math.floor(now.getTime() / 3_600_000))) % PAUSE_LINES.length], body: 'A short reset is one tap away. Or dismiss this — no pressure.', activity: 'breath-slow' };
    }
  }
  return null;
}

export function upcomingToday(s: AppState, now = new Date()) {
  return s.routines
    .map(item => ({ item, time: plannedTime(item, now), done: routineDoneToday(s, item, now.getTime()) }))
    .filter(x => x.time)
    .sort((a, b) => minutesOfDay(a.time!) - minutesOfDay(b.time!));
}
