import type { Mood } from '../types';

export const JOURNAL_PROMPTS = [
  'What is occupying your mind right now?',
  'What would make today feel worthwhile?',
  'What have you been avoiding?',
  'What is one thing you can let go of today?',
  'What would you like to remember about this moment?',
  'What is one small thing you can do for yourself?',
  'What went better than you expected recently?',
  'Who would you like to spend more time with, and why?',
  'What does “enough” look like for today?',
];

export const MOODS: { id: Mood; label: string; tone: string }[] = [
  { id: 'calm', label: 'Calm', tone: '#8fa89a' },
  { id: 'happy', label: 'Happy', tone: '#d1a86a' },
  { id: 'focused', label: 'Focused', tone: '#6f8aa1' },
  { id: 'tired', label: 'Tired', tone: '#9b9a95' },
  { id: 'overwhelmed', label: 'Overwhelmed', tone: '#a07f8f' },
  { id: 'restless', label: 'Restless', tone: '#c08f6a' },
  { id: 'sad', label: 'Sad', tone: '#7f8ea8' },
  { id: 'frustrated', label: 'Frustrated', tone: '#b07a6b' },
  { id: 'unsure', label: 'Unsure', tone: '#a9a28f' },
];

export const MOVEMENT_RESETS = [
  { id: 'stretch', title: 'Stand up and stretch', detail: 'Reach up slowly, then let your arms fall. Roll your shoulders a few times.', mins: 1 },
  { id: 'walk', title: 'Walk for two minutes', detail: 'Anywhere works — a corridor, a garden, round the room.', mins: 2 },
  { id: 'water', title: 'Drink a glass of water', detail: 'Fetch it yourself, and drink it away from the screen.', mins: 1 },
  { id: 'distance', title: 'Look at something far away', detail: 'Find the most distant thing you can see and rest your eyes on it for about twenty seconds.', mins: 1 },
  { id: 'outside', title: 'Step outside', detail: 'If it’s practical, stand outside for a minute. Notice the air and the light.', mins: 3 },
  { id: 'tidy', title: 'Tidy one small area', detail: 'Just one: a shelf, a corner of the desk, a single drawer.', mins: 3 },
  { id: 'window', title: 'Open a window', detail: 'Where it’s appropriate, let in some fresh air for a moment.', mins: 1 },
  { id: 'plant', title: 'Observe a plant or the view', detail: 'Look closely at something living. Notice one detail you hadn’t seen before.', mins: 2 },
];

export const REASONS = [
  'I want to focus better.',
  'I spend too much time scrolling.',
  'I want to feel calmer.',
  'I want to build better habits.',
  'I want to make progress on personal goals.',
  'I want more time for myself.',
];

export const GOAL_SUGGESTIONS = [
  'Studying', 'Reading', 'Exercise', 'Creative writing', 'Learning a language', 'Practising an instrument',
  'Building a project', 'Completing work', 'Time with family', 'Developing a hobby', 'Relaxing without a screen',
];

export const HELPS = ['Gentle reminders', 'Breathing', 'Puzzles', 'Journaling', 'Focus sessions', 'Verbal check-ins'];

/** Personalised, practical prompts keyed by words that might appear in a goal. */
const GOAL_PROMPTS: [RegExp, string[]][] = [
  [/writ|novel|story|poem|blog/i, ['Take one minute to decide what happens in the next paragraph.', 'Write the first sentence of today’s piece — just one.']],
  [/language|spanish|french|german|japanese|italian|mandarin|arabic|vocab/i, ['Recall three words you learned recently.', 'Say one sentence aloud in the language you’re learning.']],
  [/exercis|run|gym|fit|yoga|workout|sport|swim|walk/i, ['Choose the smallest workout you could comfortably begin today.', 'Decide when today you’ll move for ten minutes.']],
  [/stud|exam|revis|course|class|homework|learn/i, ['What is the one concept you want to understand before you finish?', 'Write down one question you’d like your next study session to answer.']],
  [/read|book/i, ['Which book is waiting for you? Decide where you’ll read ten pages today.', 'Recall one idea from the last thing you read.']],
  [/music|guitar|piano|instrument|sing|violin|drum/i, ['Pick one passage to practise slowly, just twice.', 'Which piece would you like to be able to play in a month?']],
  [/family|friend|partner|kids|parent/i, ['Who could you message — or better, call — today, just to say hello?', 'Plan one small screen-free moment with someone you care about.']],
  [/project|build|code|design|portfolio|app/i, ['What is the next visible piece of your project you could finish today?', 'Write down the single next step, small enough to start in two minutes.']],
  [/work|job|career|client/i, ['Which task would make the rest of today feel lighter if you started it now?', 'Define what “finished” means for one task today.']],
  [/relax|rest|sleep|calm|screen/i, ['When could you put your phone in another room for half an hour today?', 'Choose one screen-free thing to do this evening.']],
];

export function promptForGoal(name: string): string {
  for (const [re, list] of GOAL_PROMPTS) if (re.test(name)) return list[new Date().getDate() % list.length];
  return `What is one small step you could take on “${name}” today?`;
}
