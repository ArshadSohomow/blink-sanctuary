// Core data model for Blink. Pure data — no UI concerns.

export type ActivityType =
  | 'breathing' | 'grounding' | 'puzzle' | 'lesson' | 'journal' | 'mood'
  | 'focus' | 'movement' | 'care' | 'antiscroll' | 'checkin' | 'intention';

/** Broad kinds of care, used for the "varied practice" composition of the stack. */
export type CareKind = 'breathe' | 'think' | 'learn' | 'reflect' | 'focus' | 'move' | 'rest' | 'talk';

export type StoneShape = 'round' | 'flat' | 'oval' | 'pebble' | 'slab' | 'wedge';
export type StoneTexture = 'river' | 'granite' | 'sandstone' | 'slate';

export interface Stone {
  id: string;
  seed: number;
  shape: StoneShape;
  texture: StoneTexture;
  addedAt: number;
  source: ActivityType | 'start';
}

export type DetailKind = 'flower' | 'grass' | 'sprout' | 'moss';

export interface Contribution {
  growth: number;     // progress toward the next stone (1.0 = one stone)
  stability: number;  // how much the stack settles
  detail?: DetailKind;
  newShape?: boolean;
  stoneAdded?: boolean;
  note: string;       // calm, human-readable description of the effect
}

export interface ActivityRecord {
  id: string;
  type: ActivityType;
  title: string;
  startedAt: number;
  completedAt: number;
  durationSec?: number;
  status: 'completed' | 'partial';
  reflection?: string;
  contribution: Contribution;
}

export interface StackState {
  stones: Stone[];
  growth: number;            // 0..1 toward next stone
  stability: number;         // stored stability 0.4..1
  lastMeaningfulAt: number;  // timestamp
  texture: StoneTexture;     // texture for new stones
  details: Record<DetailKind, number>;
  gardenTendedOn?: string;   // yyyy-mm-dd
  lastStoneEventId?: string; // for animation
  lastSettleAt?: number;
}

export type TaskStatus = 'priority' | 'upcoming' | 'done';

export interface Task {
  id: string;
  title: string;
  category?: string;
  why?: string;
  nextStep?: string;
  frequency?: string;
  preferredTime?: string;
  reminders?: boolean;
  recurring?: boolean;
  status: TaskStatus;
  progressNotes: { at: number; text: string }[];
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
}

export type Mood = 'calm' | 'happy' | 'focused' | 'tired' | 'overwhelmed' | 'restless' | 'sad' | 'frustrated' | 'unsure';

export interface MoodRecord { id: string; at: number; mood: Mood; note?: string }

export interface JournalEntry { id: string; at: number; text: string; prompt?: string; mood?: Mood; source?: 'journal' | 'checkin' }

export interface RoutineItem {
  id: string;
  title: string;
  activity: ActivityType;
  time: string;        // HH:MM
  windowMins: number;  // flexible window after time
  days: number[];      // 0=Sun..6=Sat
  durationMins?: number;
  reminder: boolean;
  enabled: boolean;
  skippedOn?: string;      // yyyy-mm-dd
  rescheduledTo?: { date: string; time: string };
  doneOn?: string;
  remindedOn?: string;
}

export type ReminderCategory = 'routine' | 'pause' | 'focus' | 'checkin';

export interface ReminderSettings {
  enabled: boolean;
  browserNotifications: boolean;
  quietStart: string;  // HH:MM
  quietEnd: string;
  windowStart: string;
  windowEnd: string;
  maxPerDay: number;
  pauseEveryHours: number; // 0 = off
  snoozeMins: number;
  categories: Record<ReminderCategory, boolean>;
  suggestFocus: boolean;
  simulatedCalls: boolean;
}

export interface Intervention {
  id: string;
  at: number;
  trigger: 'manual' | 'reminder' | 'home';
  intention?: string;
  reset?: string;
  outcome?: 'continue' | 'break' | 'task' | 'leave';
}

export interface DailyReflection { date: string; intentional: number; note?: string }

export type Appearance = 'auto' | 'morning' | 'day' | 'dusk' | 'night';

export interface Preferences {
  nickname: string;
  appearance: Appearance;
  motion: 'system' | 'reduce' | 'full';
  sound: boolean;
  speechVoice: boolean;
  showRitual: boolean;
  textScale: 1 | 1.1 | 1.2;
}

export interface Goal { id: string; name: string; category?: string; why?: string; frequency?: string; time?: string; nextStep?: string; reminders?: boolean }

export interface Onboarding {
  done: boolean;
  dismissed: boolean;
  reasons: string[];
  helps: string[];
  rhythm: 'light' | 'flexible' | 'none' | '';
}

export interface FocusRun {
  taskId?: string;
  intention: string;
  step: string;
  plannedMins: number;
  startedAt: number;
  pausedAt?: number;
  pausedTotalMs: number;
}

export interface AppState {
  version: 1;
  createdAt: number;
  lastVisitAt: number;
  visitDays: string[];
  prefs: Preferences;
  onboarding: Onboarding;
  goals: Goal[];
  stack: StackState;
  activities: ActivityRecord[];
  tasks: Task[];
  moods: MoodRecord[];
  journal: JournalEntry[];
  routines: RoutineItem[];
  reminders: ReminderSettings;
  remindersLog: { at: number; category: ReminderCategory; action: 'shown' | 'snoozed' | 'dismissed' | 'started' }[];
  snoozedUntil?: number;
  interventions: Intervention[];
  scrollEstimateMins?: number;
  reflections: DailyReflection[];
  seenPuzzles: string[];
  milestones: Record<string, number>;
  focusRun?: FocusRun;
  currentTaskId?: string;
}
