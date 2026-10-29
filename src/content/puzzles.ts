// Curated thinking exercises. Each has a hint and an explanation shown after answering.
export type Difficulty = 'gentle' | 'moderate' | 'challenging';
export const DIFFICULTIES: Difficulty[] = ['gentle', 'moderate', 'challenging'];

export interface SequencePuzzle { id: string; d: Difficulty; seq: (number | null)[]; answer: number; hint: string; explain: string }
export interface LogicPuzzle { id: string; d: Difficulty; q: string; options?: string[]; answer: string; accept?: string[]; hint: string; explain: string }
export interface LinkPuzzle { id: string; d: Difficulty; words: [string, string, string]; answer: string; accept?: string[]; hint: string; explain: string }

export const SEQUENCES: SequencePuzzle[] = [
  { id: 's1', d: 'gentle', seq: [3, 6, 12, 24, null], answer: 48, hint: 'Compare each number with the one before it.', explain: 'Each number doubles: 24 × 2 = 48.' },
  { id: 's2', d: 'gentle', seq: [2, 5, 8, 11, null], answer: 14, hint: 'Look at the gap between neighbours.', explain: 'The gap is always 3: 11 + 3 = 14.' },
  { id: 's3', d: 'gentle', seq: [1, 4, 9, 16, null], answer: 25, hint: 'Think of 1×1, 2×2…', explain: 'These are square numbers: 5 × 5 = 25.' },
  { id: 's4', d: 'moderate', seq: [2, 3, 5, 8, 13, null], answer: 21, hint: 'Try adding two neighbours together.', explain: 'Each number is the sum of the two before it: 8 + 13 = 21.' },
  { id: 's5', d: 'moderate', seq: [1, 3, 6, 10, 15, null], answer: 21, hint: 'The gaps are growing by one each time.', explain: 'Gaps of 2, 3, 4, 5, then 6: 15 + 6 = 21. These are triangular numbers.' },
  { id: 's6', d: 'moderate', seq: [1, 8, 27, 64, null], answer: 125, hint: 'Squares are close, but not quite.', explain: 'These are cubes: 5 × 5 × 5 = 125.' },
  { id: 's7', d: 'moderate', seq: [2, 6, 12, 20, 30, null], answer: 42, hint: 'Try writing each as a product of two neighbouring numbers.', explain: '1×2, 2×3, 3×4, 4×5, 5×6, so next is 6 × 7 = 42.' },
  { id: 's8', d: 'challenging', seq: [1, 2, 6, 24, 120, null], answer: 720, hint: 'What do you multiply by each time?', explain: 'Multiply by 2, then 3, 4, 5, 6: 120 × 6 = 720 (these are factorials).' },
  { id: 's9', d: 'challenging', seq: [2, 3, 5, 7, 11, 13, null], answer: 17, hint: 'What do these numbers have in common? Think about what divides them.', explain: 'These are the prime numbers. The next prime after 13 is 17.' },
  { id: 's10', d: 'challenging', seq: [2, 12, 36, 80, 150, null], answer: 252, hint: 'Try splitting each number into a cube plus a square.', explain: 'Each is n³ + n²: 1+1, 8+4, 27+9, 64+16, 125+25, so 216 + 36 = 252.' },
  { id: 's11', d: 'challenging', seq: [0, 1, 3, 7, 15, null], answer: 31, hint: 'Double, then…', explain: 'Each term is double the previous plus one: 15 × 2 + 1 = 31.' },
];

export const LOGIC: LogicPuzzle[] = [
  { id: 'l1', d: 'gentle', q: 'A farmer has 17 sheep. All but 9 run away. How many are left?', options: ['8', '9', '17', '0'], answer: '9', hint: 'Read “all but 9” slowly.', explain: '“All but 9 run away” means 9 stay behind.' },
  { id: 'l2', d: 'gentle', q: 'The more of these you take, the more you leave behind. What are they?', answer: 'footsteps', accept: ['footsteps', 'steps', 'footprints', 'foot steps', 'step', 'footstep'], hint: 'Think about walking.', explain: 'Footsteps — every step you take leaves one behind.' },
  { id: 'l3', d: 'gentle', q: 'What has keys but can’t open a single lock?', answer: 'piano', accept: ['piano', 'keyboard', 'a piano', 'a keyboard'], hint: 'You might play it.', explain: 'A piano (or a keyboard) has keys, but not the kind that open locks.' },
  { id: 'l4', d: 'moderate', q: 'If 5 machines take 5 minutes to make 5 widgets, how long would 100 machines take to make 100 widgets?', options: ['1 minute', '5 minutes', '20 minutes', '100 minutes'], answer: '5 minutes', hint: 'How long does one machine take to make one widget?', explain: 'Each machine makes one widget in 5 minutes. 100 machines working at once make 100 widgets in the same 5 minutes.' },
  { id: 'l5', d: 'moderate', q: 'A bat and a ball cost £1.10 in total. The bat costs £1.00 more than the ball. How much is the ball?', options: ['10p', '5p', '1p', '55p'], answer: '5p', hint: 'If the ball were 10p, what would the bat cost — and the total?', explain: 'Ball = 5p, bat = £1.05. Together £1.10, and the bat is exactly £1.00 more. The quick answer (10p) would make the total £1.20.' },
  { id: 'l6', d: 'moderate', q: 'Ash, Bea and Cal each have one pet: a cat, a dog or a fish. Ash doesn’t have the cat. Bea has neither the cat nor the fish. Who has the fish?', options: ['Ash', 'Bea', 'Cal'], answer: 'Ash', hint: 'Start with Bea — she has only one option left.', explain: 'Bea must have the dog. The cat isn’t Ash’s, so it’s Cal’s. That leaves the fish for Ash.' },
  { id: 'l7', d: 'moderate', q: 'Three boxes are labelled Apples, Oranges and Mixed — and every label is wrong. You may take one fruit from one box without looking inside. Which box should you pick from to relabel all three correctly?', options: ['Apples', 'Oranges', 'Mixed'], answer: 'Mixed', hint: 'Which box is guaranteed not to be mixed?', explain: 'The “Mixed” box must hold only one kind. If you pull an apple, it’s Apples. Then the box labelled “Oranges” can’t be oranges (wrong label) or apples (taken), so it’s Mixed — and the last box is Oranges.' },
  { id: 'l8', d: 'challenging', q: 'Anna is looking at Ben. Ben is looking at Cara. Anna is married; Cara is not. Is a married person looking at an unmarried person?', options: ['Yes', 'No', 'Can’t be determined'], answer: 'Yes', hint: 'Ben is either married or not. Try both.', explain: 'If Ben is married, he is looking at unmarried Cara. If Ben is unmarried, married Anna is looking at him. Either way: yes.' },
  { id: 'l9', d: 'challenging', q: 'A patch of lily pads doubles in size every day. It takes 48 days to cover the whole lake. How many days does it take to cover half the lake?', options: ['24', '47', '46', '36'], answer: '47', hint: 'Think backwards from the last day.', explain: 'If it doubles daily and is full on day 48, it was half-full the day before: day 47.' },
  { id: 'l10', d: 'challenging', q: 'You have a 3-litre jug and a 5-litre jug, and plenty of water. What is the fewest number of pours (fill, empty, or pour between jugs) to measure exactly 4 litres?', options: ['4', '6', '8', '10'], answer: '6', hint: 'Try filling the 5-litre jug first.', explain: 'Fill 5 → pour into 3 (5 has 2) → empty 3 → pour 2 into 3 → fill 5 → top up the 3 (needs 1), leaving 4 in the 5-litre jug. Six steps.' },
];

export const LINKS: LinkPuzzle[] = [
  { id: 'w1', d: 'gentle', words: ['cottage', 'Swiss', 'cake'], answer: 'cheese', hint: 'Something you might find in a sandwich.', explain: 'Cottage cheese, Swiss cheese, cheesecake.' },
  { id: 'w2', d: 'gentle', words: ['river', 'note', 'account'], answer: 'bank', hint: 'Somewhere you might keep money.', explain: 'Riverbank, banknote, bank account.' },
  { id: 'w3', d: 'gentle', words: ['dream', 'break', 'light'], answer: 'day', hint: 'The opposite of night.', explain: 'Daydream, daybreak, daylight.' },
  { id: 'w4', d: 'gentle', words: ['night', 'wrist', 'stop'], answer: 'watch', hint: 'It tells the time.', explain: 'Night watch, wristwatch, stopwatch.' },
  { id: 'w5', d: 'moderate', words: ['falling', 'actor', 'dust'], answer: 'star', hint: 'Look up at night.', explain: 'Falling star, star actor, stardust.' },
  { id: 'w6', d: 'moderate', words: ['broken', 'clear', 'eye'], answer: 'glass', hint: 'Windows are made of it.', explain: 'Broken glass, clear glass, eyeglass.' },
  { id: 'w7', d: 'moderate', words: ['sea', 'home', 'car'], answer: 'sick', hint: 'How you might feel on a rough crossing.', explain: 'Seasick, homesick, carsick.' },
  { id: 'w8', d: 'moderate', words: ['safety', 'cushion', 'point'], answer: 'pin', hint: 'Small, sharp, useful for sewing.', explain: 'Safety pin, pincushion, pinpoint.' },
  { id: 'w9', d: 'challenging', words: ['aid', 'rubber', 'wagon'], answer: 'band', hint: 'Musicians might form one.', explain: 'Band-aid, rubber band, bandwagon.' },
  { id: 'w10', d: 'challenging', words: ['duck', 'fold', 'dollar'], answer: 'bill', hint: 'Something a restaurant brings you.', explain: 'Duck’s bill, billfold, dollar bill.' },
  { id: 'w11', d: 'challenging', words: ['high', 'district', 'house'], answer: 'school', hint: 'Where you might have studied.', explain: 'High school, school district, schoolhouse.' },
  { id: 'w12', d: 'challenging', words: ['print', 'berry', 'bird'], answer: 'blue', hint: 'A colour.', explain: 'Blueprint, blueberry, bluebird.' },
];

export function normalise(s: string) {
  return s.trim().toLowerCase().replace(/[’']/g, '').replace(/^(a|an|the)\s+/, '').replace(/[^a-z0-9.\s-]/g, '').trim();
}
