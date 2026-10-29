import type { ActivityType } from '../types';

export type LibraryCategory = 'Breathing & grounding' | 'Thinking' | 'Learning' | 'Reflection' | 'Focus & intention' | 'Real-world resets' | 'Sanctuary care' | 'Pause & talk';

export interface CatalogueItem {
  id: string;
  type: ActivityType;
  title: string;
  blurb: string;
  mins: string;
  category: LibraryCategory;
}

export const CATALOGUE: CatalogueItem[] = [
  { id: 'breath-slow', type: 'breathing', title: 'Slow breathing', blurb: 'Breathe in for four, out for six. Nothing to hold.', mins: '1–5 min', category: 'Breathing & grounding' },
  { id: 'breath-box', type: 'breathing', title: 'Gentle box breathing', blurb: 'Four even sides, with a soft pause — only if comfortable.', mins: '1–5 min', category: 'Breathing & grounding' },
  { id: 'breath-exhale', type: 'breathing', title: 'Extended exhale', blurb: 'A longer, slower out-breath to help things settle.', mins: '1–5 min', category: 'Breathing & grounding' },
  { id: 'visual-rhythm', type: 'breathing', title: 'Follow the light', blurb: 'A breath-free alternative: let your eyes follow a slow, drifting light.', mins: '1–3 min', category: 'Breathing & grounding' },
  { id: 'grounding', type: 'grounding', title: 'Five senses', blurb: 'Notice five things you see, four you feel, three you hear…', mins: '2–3 min', category: 'Breathing & grounding' },
  { id: 'body-check', type: 'grounding', title: 'Body check', blurb: 'A brief, kind scan from your forehead to your feet.', mins: '2 min', category: 'Breathing & grounding' },

  { id: 'puzzle-sequence', type: 'puzzle', title: 'What comes next?', blurb: 'Find the rule behind a short sequence of numbers.', mins: '1–3 min', category: 'Thinking' },
  { id: 'puzzle-logic', type: 'puzzle', title: 'Riddles & deduction', blurb: 'Short logic problems that reward a second look.', mins: '1–3 min', category: 'Thinking' },
  { id: 'puzzle-links', type: 'puzzle', title: 'The missing link', blurb: 'One word connects all three. Can you find it?', mins: '1–3 min', category: 'Thinking' },
  { id: 'puzzle-memory', type: 'puzzle', title: 'Stone memory', blurb: 'Watch where the stones appear, then place them from memory.', mins: '2 min', category: 'Thinking' },
  { id: 'puzzle-arith', type: 'puzzle', title: 'Mental arithmetic', blurb: 'A handful of sums to work out in your head. No timer.', mins: '2 min', category: 'Thinking' },

  { id: 'lesson', type: 'lesson', title: 'A small lesson', blurb: 'A two-minute idea from science, psychology or critical thinking — then a question.', mins: '2–3 min', category: 'Learning' },

  { id: 'journal', type: 'journal', title: 'Write it down', blurb: 'A quiet page and an optional prompt.', mins: '3–5 min', category: 'Reflection' },
  { id: 'mood', type: 'mood', title: 'How are you feeling?', blurb: 'Notice your mood and leave a short note if you like.', mins: '30 sec', category: 'Reflection' },

  { id: 'intention', type: 'intention', title: 'Set an intention', blurb: 'Choose one thing and the smallest next step.', mins: '1 min', category: 'Focus & intention' },
  { id: 'focus', type: 'focus', title: 'Focus session', blurb: 'Pick a task, a small step and a length of time.', mins: '5–20 min', category: 'Focus & intention' },

  { id: 'movement', type: 'movement', title: 'Step away for a moment', blurb: 'Stretch, walk, drink water, look into the distance.', mins: '1–3 min', category: 'Real-world resets' },

  { id: 'care-balance', type: 'care', title: 'Restore the balance', blurb: 'Steady your stack by hand, slowly.', mins: '1 min', category: 'Sanctuary care' },
  { id: 'care-garden', type: 'care', title: 'Tend the garden', blurb: 'Water the clearing and see what grows.', mins: '1 min', category: 'Sanctuary care' },
  { id: 'care-texture', type: 'care', title: 'Choose a stone', blurb: 'Pick the kind of stone your next stones will be.', mins: '30 sec', category: 'Sanctuary care' },
  { id: 'care-observe', type: 'care', title: 'Quiet observation', blurb: 'Watch the sanctuary for thirty seconds and note one thing.', mins: '1 min', category: 'Sanctuary care' },

  { id: 'antiscroll', type: 'antiscroll', title: 'I’m scrolling without intention', blurb: 'A short pause to decide, consciously, what happens next.', mins: '1 min', category: 'Pause & talk' },
  { id: 'checkin', type: 'checkin', title: 'Simulated check-in call', blurb: 'Say out loud what you’re working on. Voice or text.', mins: '1–2 min', category: 'Pause & talk' },
];

export const byId = (id: string) => CATALOGUE.find(c => c.id === id);
