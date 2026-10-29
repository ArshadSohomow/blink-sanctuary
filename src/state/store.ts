import { useSyncExternalStore } from 'react';
import type { ActivityRecord, ActivityType, AppState, Goal, JournalEntry, Mood, ReminderSettings, RoutineItem, Task } from '../types';
import { localAdapter } from '../services/storage';
import { applyActivity, initialStack, varietyLast7 } from '../model/stack';
import { DAY, dayKey, uid } from '../model/util';

export const defaultReminders = (): ReminderSettings => ({
  enabled: true,
  browserNotifications: false,
  quietStart: '22:00',
  quietEnd: '07:30',
  windowStart: '09:00',
  windowEnd: '21:00',
  maxPerDay: 3,
  pauseEveryHours: 0,
  snoozeMins: 15,
  categories: { routine: true, pause: true, focus: true, checkin: false },
  suggestFocus: true,
  simulatedCalls: false,
});

export function sampleRoutine(kind: 'light' | 'flexible' = 'light'): RoutineItem[] {
  const all = [0, 1, 2, 3, 4, 5, 6], week = [1, 2, 3, 4, 5];
  const base: RoutineItem[] = [
    { id: uid(), title: 'Morning breathing', activity: 'breathing', time: '08:00', windowMins: 90, days: all, durationMins: 2, reminder: false, enabled: true },
    { id: uid(), title: 'A focus session', activity: 'focus', time: '10:00', windowMins: 120, days: week, durationMins: 20, reminder: true, enabled: true },
    { id: uid(), title: 'Afternoon reset', activity: 'movement', time: '15:00', windowMins: 60, days: week, durationMins: 3, reminder: true, enabled: true },
    { id: uid(), title: 'Evening reflection', activity: 'journal', time: '20:30', windowMins: 60, days: all, durationMins: 5, reminder: false, enabled: true },
  ];
  if (kind === 'flexible') return [base[0], base[3]];
  return base;
}

export function freshState(now = Date.now()): AppState {
  return {
    version: 1,
    createdAt: now,
    lastVisitAt: now,
    visitDays: [dayKey(now)],
    prefs: { nickname: '', appearance: 'auto', motion: 'system', sound: false, speechVoice: true, showRitual: true, textScale: 1 },
    onboarding: { done: false, dismissed: false, reasons: [], helps: [], rhythm: '' },
    goals: [],
    stack: initialStack(now),
    activities: [],
    tasks: [],
    moods: [],
    journal: [],
    routines: sampleRoutine('light'),
    reminders: defaultReminders(),
    remindersLog: [],
    interventions: [],
    reflections: [],
    seenPuzzles: [],
    milestones: {},
  };
}

function load(): { state: AppState; awayDays: number } {
  const raw = localAdapter.load() as AppState | null;
  const now = Date.now();
  if (!raw || raw.version !== 1) return { state: freshState(now), awayDays: 0 };
  const base = freshState(now);
  const state: AppState = {
    ...base, ...raw,
    prefs: { ...base.prefs, ...raw.prefs },
    reminders: { ...base.reminders, ...raw.reminders, categories: { ...base.reminders.categories, ...(raw.reminders?.categories ?? {}) } },
    onboarding: { ...base.onboarding, ...raw.onboarding },
    stack: { ...base.stack, ...raw.stack, details: { ...base.stack.details, ...(raw.stack?.details ?? {}) } },
  };
  const awayDays = Math.floor((now - (raw.lastVisitAt || now)) / DAY);
  const today = dayKey(now);
  state.lastVisitAt = now;
  if (!state.visitDays.includes(today)) state.visitDays = [...state.visitDays, today].slice(-120);
  return { state, awayDays };
}

const loaded = load();
let state = loaded.state;
/** Days since the previous visit, computed once at start-up for the welcome-back message. */
export const AWAY_DAYS = loaded.awayDays;

const listeners = new Set<() => void>();
let saveTimer: number | undefined;

function emit() {
  listeners.forEach(l => l());
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => localAdapter.save(state), 120);
}

export function getState() { return state; }
export function setState(fn: (s: AppState) => AppState) { state = fn(state); emit(); }
export function flushSave() { window.clearTimeout(saveTimer); localAdapter.save(state); }
window.addEventListener('pagehide', flushSave);

export function useStore(): AppState {
  return useSyncExternalStore(cb => { listeners.add(cb); return () => listeners.delete(cb); }, () => state);
}

// ───────────────────────── actions ─────────────────────────

export function completeActivity(type: ActivityType, title: string, opts: { startedAt?: number; durationSec?: number; reflection?: string; partial?: boolean } = {}) {
  const now = Date.now();
  let record!: ActivityRecord;
  setState(s => {
    const { stack, contribution } = applyActivity(s, type, { minutes: opts.durationSec ? opts.durationSec / 60 : undefined, partial: opts.partial }, now);
    record = {
      id: uid(), type, title, startedAt: opts.startedAt ?? now, completedAt: now,
      durationSec: opts.durationSec, status: opts.partial ? 'partial' : 'completed', reflection: opts.reflection, contribution,
    };
    const next = { ...s, stack, activities: [...s.activities, record].slice(-800) };
    return { ...next, milestones: checkMilestones(next, now) };
  });
  return record;
}

export const MILESTONES: Record<string, string> = {
  firstPause: 'First Pause',
  balanced: 'First Balanced Stack',
  week: 'A Week of Returning',
  firstFocus: 'First Focus Ritual',
  month: 'A Month of Reflection',
  growing: 'A Growing Sanctuary',
  varied: 'A More Varied Practice',
};

function checkMilestones(s: AppState, now: number) {
  const m = { ...s.milestones };
  const set = (k: string, cond: boolean) => { if (cond && !m[k]) m[k] = now; };
  set('firstPause', s.activities.length >= 1);
  set('balanced', s.stack.stability >= 0.95);
  const activeDays = new Set(s.activities.map(a => dayKey(a.completedAt)));
  set('week', activeDays.size >= 7);
  set('firstFocus', s.activities.some(a => a.type === 'focus'));
  const jDays = new Set(s.journal.map(j => dayKey(j.at)));
  set('month', jDays.size >= 12 && s.journal.length > 0 && now - s.journal[0].at >= 28 * DAY);
  set('growing', s.stack.stones.length >= 10);
  set('varied', varietyLast7(s.activities, now).size >= 5);
  return m;
}

export function updatePrefs(p: Partial<AppState['prefs']>) { setState(s => ({ ...s, prefs: { ...s.prefs, ...p } })); }
export function updateReminders(p: Partial<ReminderSettings>) { setState(s => ({ ...s, reminders: { ...s.reminders, ...p } })); }

export function addTask(t: Partial<Task> & { title: string }) {
  const now = Date.now();
  const task: Task = { id: uid(), status: 'priority', progressNotes: [], createdAt: now, updatedAt: now, ...t };
  setState(s => ({ ...s, tasks: [task, ...s.tasks] }));
  return task;
}
export function updateTask(id: string, p: Partial<Task>) {
  setState(s => ({ ...s, tasks: s.tasks.map(t => t.id === id ? { ...t, ...p, updatedAt: Date.now(), completedAt: p.status === 'done' ? Date.now() : p.status ? undefined : t.completedAt } : t) }));
}
export function deleteTask(id: string) { setState(s => ({ ...s, tasks: s.tasks.filter(t => t.id !== id), currentTaskId: s.currentTaskId === id ? undefined : s.currentTaskId })); }
export function addTaskNote(id: string, text: string) {
  setState(s => ({ ...s, tasks: s.tasks.map(t => t.id === id ? { ...t, progressNotes: [...t.progressNotes, { at: Date.now(), text }], updatedAt: Date.now() } : t) }));
}

export function addMood(mood: Mood, note?: string) {
  setState(s => ({ ...s, moods: [...s.moods, { id: uid(), at: Date.now(), mood, note: note?.trim() || undefined }] }));
}
export function deleteMood(id: string) { setState(s => ({ ...s, moods: s.moods.filter(m => m.id !== id) })); }

export function addJournal(e: Omit<JournalEntry, 'id' | 'at'>) {
  const entry: JournalEntry = { id: uid(), at: Date.now(), ...e };
  setState(s => ({ ...s, journal: [...s.journal, entry] }));
  return entry;
}
export function deleteJournal(id: string) { setState(s => ({ ...s, journal: s.journal.filter(j => j.id !== id) })); }

export function setGoals(goals: Goal[]) { setState(s => ({ ...s, goals })); }

export function resetDemo() {
  localAdapter.clear();
  state = freshState();
  emit();
}
