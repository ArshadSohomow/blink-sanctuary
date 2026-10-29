// Demonstration micro-lessons, written for this prototype and clearly labelled as such.
export interface Lesson {
  id: string;
  subject: string;
  title: string;
  minutes: number;
  body: string[];
  question: string;
  options: string[];
  answer: number;
  explain: string;
}

export const LESSONS: Lesson[] = [
  {
    id: 'balance', subject: 'Science', title: 'Why balanced stones stay up', minutes: 2,
    body: [
      'Every object has a centre of mass — the average position of all its weight. A stone resting on another will stay put as long as its centre of mass sits above the patch where the two stones touch.',
      'When you stack several stones, the same rule applies to everything above each contact point: the combined centre of mass of the upper stones must sit over the stone beneath. That is why balanced stacks often look surprisingly off-centre — the irregular shapes balance each other out.',
      'Friction matters too. Rough surfaces and small natural “tripod” contact points stop stones sliding, which is why balancers search patiently for the spot where a stone settles with almost no effort.',
    ],
    question: 'A stack of stones stays balanced when…',
    options: ['Every stone is perfectly centred on the one below', 'The combined centre of mass of the stones above each contact sits over that contact', 'The heaviest stone is at the top', 'The stones are all the same shape'],
    answer: 1,
    explain: 'What matters is where the weight above each contact point is centred, not whether each stone looks centred. Irregular stones can lean in different directions and still balance as a whole.',
  },
  {
    id: 'spacing', subject: 'Psychology', title: 'Spacing out practice', minutes: 3,
    body: [
      'Psychologists have studied memory for well over a century. One of the most consistently reported findings is the spacing effect: material reviewed in several shorter sessions spread over time tends to be remembered better in the long run than the same total time spent in one block.',
      'Part of the explanation seems to be that recalling something just as it is beginning to fade takes effort, and that effort strengthens the memory. Cramming can feel productive because the material is fresh, but much of it fades quickly.',
      'A practical version: instead of one long session, try short reviews a day later, a few days later and a week later — and test yourself rather than simply rereading.',
    ],
    question: 'You have one hour to learn 40 new words. Which plan is most likely to help you remember them next month?',
    options: ['One 60-minute session tonight', 'Four 15-minute sessions spread over a week, testing yourself each time', 'Reading the list once, then sleeping on it', 'Copying the list out ten times in a row'],
    answer: 1,
    explain: 'Spreading the same time across several sessions and actively recalling the words makes use of the spacing effect and of retrieval practice.',
  },
  {
    id: 'fermi', subject: 'Critical thinking', title: 'Estimating like a physicist', minutes: 2,
    body: [
      'A Fermi estimate — named after the physicist Enrico Fermi — is a way of reaching a sensible rough answer by breaking a question into pieces you can guess more easily.',
      'For example: how many minutes are in a week? 60 minutes × 24 hours is 1,440 minutes a day. Multiply by 7 and you get about 10,000. You don’t need the exact figure to know it is roughly ten thousand, not a thousand or a million.',
      'The aim isn’t precision. It’s getting the size of the answer right, and making your assumptions visible so you can check them.',
    ],
    question: 'Roughly how many hours are there in a year?',
    options: ['About 900', 'About 9,000', 'About 90,000', 'About 900,000'],
    answer: 1,
    explain: '24 hours × 365 days ≈ 24 × 400 ≈ 9,600, a bit less in reality: 8,760. The right order of magnitude is around 9,000.',
  },
  {
    id: 'distance', subject: 'Nature & the body', title: 'Resting your eyes on the horizon', minutes: 2,
    body: [
      'To focus on something close — like a phone — small muscles inside the eye change the shape of the lens. Looking at something far away lets those muscles relax.',
      'A widely shared habit for screen users is the “20-20-20” suggestion: every 20 minutes, look at something about 20 feet (6 metres) away for around 20 seconds. Optometry organisations often mention it as a simple way to reduce eye strain. It is a comfort habit, not a treatment.',
      'Stepping outside or looking out of a window also tends to bring a change of light and a moment away from the screen.',
    ],
    question: 'Why might looking into the distance feel restful after close screen work?',
    options: ['It exercises the eyes to make them stronger', 'The focusing muscles used for close work can relax', 'It permanently improves eyesight', 'It increases screen brightness tolerance'],
    answer: 1,
    explain: 'Close focus uses muscles inside the eye; distant focus lets them relax. It doesn’t permanently change your eyesight.',
  },
];
