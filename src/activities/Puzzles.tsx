import { useEffect, useMemo, useState } from 'react';
import type { ActivityProps } from './ActivityRunner';
import { DIFFICULTIES, LINKS, LOGIC, SEQUENCES, normalise, type Difficulty } from '../content/puzzles';
import { getState, setState } from '../state/store';
import { rng, shuffle } from '../model/util';

function DifficultyPicker({ value, onChange }: { value: Difficulty; onChange: (d: Difficulty) => void }) {
  return (
    <div className="seg seg--small" role="radiogroup" aria-label="Difficulty">
      {DIFFICULTIES.map(d => <button key={d} role="radio" aria-checked={value === d} className={value === d ? 'on' : ''} onClick={() => onChange(d)}>{d[0].toUpperCase() + d.slice(1)}</button>)}
    </div>
  );
}

let lastDifficulty: Difficulty = 'gentle';

/** Choose an unseen puzzle of this difficulty; once all are seen, revisit the one seen longest ago. */
function choose<T extends { id: string; d: Difficulty }>(list: T[], d: Difficulty, exclude?: string): T {
  const pool = list.filter(p => p.d === d && p.id !== exclude);
  const seen = getState().seenPuzzles;
  const fresh = pool.filter(p => !seen.includes(p.id));
  if (fresh.length) return fresh[Math.floor(Math.random() * fresh.length)];
  return [...pool].sort((a, b) => seen.lastIndexOf(a.id) - seen.lastIndexOf(b.id))[0];
}

function useMarkSeen(id: string) {
  useEffect(() => { setState(s => ({ ...s, seenPuzzles: [...s.seenPuzzles.filter(x => x !== id), id].slice(-200) })); }, [id]);
}

interface Outcome { solved: boolean; tries: number; hinted: boolean }

/** Shared shell: question → attempts → hint → reveal → explanation → finish or another. */
function usePuzzleShell() {
  const [tries, setTries] = useState(0);
  const [hinted, setHinted] = useState(false);
  const [state, setStateL] = useState<'asking' | 'wrong' | 'solved' | 'revealed'>('asking');
  const [count, setCount] = useState(0);
  const reset = () => { setTries(0); setHinted(false); setStateL('asking'); };
  return { tries, setTries, hinted, setHinted, state, setState: setStateL, reset, count, setCount };
}

function Feedback({ shell, hint, explain, answer, onFinish, onAnother }: { shell: ReturnType<typeof usePuzzleShell>; hint: string; explain: string; answer: string; onFinish: () => void; onAnother: () => void }) {
  const { state, tries, hinted } = shell;
  return (
    <div className="puzzle__feedback" aria-live="polite">
      {state === 'wrong' && <p className="note note--soft">Not quite. Take another look{tries >= 2 ? ' — or reveal the answer when you’re ready' : ''}.</p>}
      {(state === 'asking' || state === 'wrong') && (
        <div className="row">
          {!hinted ? <button type="button" className="btn btn--quiet" onClick={() => shell.setHinted(true)}>Show a hint</button> : <p className="hint"><b>Hint:</b> {hint}</p>}
          {tries >= 2 && <button type="button" className="btn btn--quiet" onClick={() => shell.setState('revealed')}>Reveal the answer</button>}
        </div>
      )}
      {(state === 'solved' || state === 'revealed') && (
        <div className="explain">
          <p className="explain__verdict">{state === 'solved' ? (tries <= 1 ? 'Yes — well reasoned.' : 'Got there. That’s the point.') : `The answer is ${answer}.`}</p>
          <p>{explain}</p>
          <div className="row">
            <button className="btn" type="button" onClick={onFinish}>Finish</button>
            <button className="btn btn--ghost" type="button" onClick={onAnother}>Try another</button>
          </div>
        </div>
      )}
    </div>
  );
}

const summary = (o: Outcome) => o.solved ? `Solved${o.tries > 1 ? ` after ${o.tries} tries` : ''}${o.hinted ? ' with a hint' : ''}` : 'Answer revealed';

// ───────────── sequence ─────────────
export function SequencePuzzleView({ item, finish }: ActivityProps) {
  const [d, setD] = useState<Difficulty>(lastDifficulty);
  const [p, setP] = useState(() => choose(SEQUENCES, d));
  const [val, setVal] = useState('');
  const shell = usePuzzleShell();
  useMarkSeen(p.id);
  const change = (nd: Difficulty) => { lastDifficulty = nd; setD(nd); setP(choose(SEQUENCES, nd)); setVal(''); shell.reset(); };
  const check = (e: React.FormEvent) => {
    e.preventDefault();
    if (!val.trim()) return;
    const n = Number(val.replace(/,/g, ''));
    shell.setTries(t => t + 1);
    shell.setState(Number.isFinite(n) && n === p.answer ? 'solved' : 'wrong');
  };
  const done = shell.state === 'solved' || shell.state === 'revealed';
  return (
    <form className="sheet puzzle" onSubmit={check}>
      <div className="sheet__head"><h2 id="activity-title" tabIndex={-1}>{item.title}</h2><DifficultyPicker value={d} onChange={change} /></div>
      <p className="muted">Find the rule, then fill in the missing number.</p>
      <div className="sequence" aria-label={`Sequence: ${p.seq.map(x => x ?? 'blank').join(', ')}`}>
        {p.seq.map((x, i) => x === null
          ? <input key={i} className="sequence__blank field" inputMode="decimal" value={done ? String(p.answer) : val} onChange={e => setVal(e.target.value)} aria-label="Missing number" autoFocus disabled={done} />
          : <span key={i} className="sequence__n">{x}</span>)}
      </div>
      {!done && <button className="btn" type="submit" disabled={!val.trim()}>Check</button>}
      <Feedback shell={shell} hint={p.hint} explain={p.explain} answer={String(p.answer)}
        onFinish={() => finish({ title: `${item.title} · ${d}`, reflection: summary({ solved: shell.state === 'solved', tries: shell.tries, hinted: shell.hinted }) })}
        onAnother={() => { setP(choose(SEQUENCES, d, p.id)); setVal(''); shell.reset(); }} />
    </form>
  );
}

// ───────────── logic / riddles ─────────────
export function LogicPuzzleView({ item, finish }: ActivityProps) {
  const [d, setD] = useState<Difficulty>(lastDifficulty);
  const [p, setP] = useState(() => choose(LOGIC, d));
  const [val, setVal] = useState('');
  const shell = usePuzzleShell();
  useMarkSeen(p.id);
  const change = (nd: Difficulty) => { lastDifficulty = nd; setD(nd); setP(choose(LOGIC, nd)); setVal(''); shell.reset(); };
  const done = shell.state === 'solved' || shell.state === 'revealed';
  const attempt = (answer: string) => {
    if (!answer.trim() || done) return;
    const ok = p.options ? answer === p.answer : (p.accept ?? [p.answer]).map(normalise).includes(normalise(answer));
    shell.setTries(t => t + 1);
    shell.setState(ok ? 'solved' : 'wrong');
  };
  return (
    <form className="sheet puzzle" onSubmit={e => { e.preventDefault(); attempt(val); }}>
      <div className="sheet__head"><h2 id="activity-title" tabIndex={-1}>{item.title}</h2><DifficultyPicker value={d} onChange={change} /></div>
      <p className="puzzle__q serif">{p.q}</p>
      {p.options ? (
        <div className="choices" role="group" aria-label="Choose an answer">
          {p.options.map(o => (
            <button type="button" key={o} className={`choice ${done && o === p.answer ? 'is-right' : ''} ${val === o && shell.state === 'wrong' ? 'is-wrong' : ''}`} onClick={() => { setVal(o); attempt(o); }} disabled={done} aria-pressed={val === o}>{o}</button>
          ))}
        </div>
      ) : (
        <div className="row">
          <input className="field" value={done ? p.answer : val} onChange={e => setVal(e.target.value)} aria-label="Your answer" placeholder="Your answer" disabled={done} autoFocus />
          {!done && <button className="btn" type="submit" disabled={!val.trim()}>Check</button>}
        </div>
      )}
      <Feedback shell={shell} hint={p.hint} explain={p.explain} answer={p.answer}
        onFinish={() => finish({ title: `${item.title} · ${d}`, reflection: summary({ solved: shell.state === 'solved', tries: shell.tries, hinted: shell.hinted }) })}
        onAnother={() => { setP(choose(LOGIC, d, p.id)); setVal(''); shell.reset(); }} />
    </form>
  );
}

// ───────────── missing link ─────────────
export function LinkPuzzleView({ item, finish }: ActivityProps) {
  const [d, setD] = useState<Difficulty>(lastDifficulty);
  const [p, setP] = useState(() => choose(LINKS, d));
  const [val, setVal] = useState('');
  const shell = usePuzzleShell();
  useMarkSeen(p.id);
  const change = (nd: Difficulty) => { lastDifficulty = nd; setD(nd); setP(choose(LINKS, nd)); setVal(''); shell.reset(); };
  const done = shell.state === 'solved' || shell.state === 'revealed';
  return (
    <form className="sheet puzzle" onSubmit={e => {
      e.preventDefault(); if (!val.trim()) return;
      shell.setTries(t => t + 1);
      shell.setState((p.accept ?? [p.answer]).map(normalise).includes(normalise(val)) ? 'solved' : 'wrong');
    }}>
      <div className="sheet__head"><h2 id="activity-title" tabIndex={-1}>{item.title}</h2><DifficultyPicker value={d} onChange={change} /></div>
      <p className="muted">Which single word goes with all three — before or after each?</p>
      <div className="linkwords">{p.words.map(w => <span key={w}>{w}</span>)}</div>
      <div className="row">
        <input className="field" value={done ? p.answer : val} onChange={e => setVal(e.target.value)} aria-label="The linking word" placeholder="The linking word" disabled={done} autoFocus />
        {!done && <button className="btn" type="submit" disabled={!val.trim()}>Check</button>}
      </div>
      <Feedback shell={shell} hint={p.hint} explain={p.explain} answer={`“${p.answer}”`}
        onFinish={() => finish({ title: `${item.title} · ${d}`, reflection: summary({ solved: shell.state === 'solved', tries: shell.tries, hinted: shell.hinted }) })}
        onAnother={() => { setP(choose(LINKS, d, p.id)); setVal(''); shell.reset(); }} />
    </form>
  );
}

// ───────────── stone memory ─────────────
const MEM: Record<Difficulty, { size: number; stones: number; show: number }> = {
  gentle: { size: 3, stones: 3, show: 3500 },
  moderate: { size: 4, stones: 5, show: 4000 },
  challenging: { size: 5, stones: 7, show: 4500 },
};

export function MemoryPuzzle({ item, finish }: ActivityProps) {
  const [d, setD] = useState<Difficulty>(lastDifficulty);
  const [round, setRound] = useState(0);
  const cfg = MEM[d];
  const target = useMemo(() => new Set(shuffle(Array.from({ length: cfg.size * cfg.size }, (_, i) => i), rng(Date.now() + round)).slice(0, cfg.stones)), [d, round]);
  const [stage, setStage] = useState<'ready' | 'show' | 'recall' | 'result'>('ready');
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [peeked, setPeeked] = useState(false);
  const show = () => { setStage('show'); setTimeout(() => setStage('recall'), cfg.show); };
  const toggle = (i: number) => {
    if (stage !== 'recall') return;
    const n = new Set(picked); n.has(i) ? n.delete(i) : n.size < cfg.stones && n.add(i); setPicked(n);
  };
  const correct = [...picked].filter(i => target.has(i)).length;
  const again = () => { setRound(r => r + 1); setPicked(new Set()); setPeeked(false); setStage('ready'); };
  return (
    <div className="sheet puzzle">
      <div className="sheet__head"><h2 id="activity-title" tabIndex={-1}>{item.title}</h2>
        <DifficultyPicker value={d} onChange={nd => { lastDifficulty = nd; setD(nd); again(); }} /></div>
      <p className="muted" aria-live="polite">
        {stage === 'ready' && `${cfg.stones} stones will appear on the grid for a few seconds. Remember where they are.`}
        {stage === 'show' && 'Remember these positions…'}
        {stage === 'recall' && `Place ${cfg.stones} stones where you saw them. ${picked.size} of ${cfg.stones} placed.`}
        {stage === 'result' && `You placed ${correct} of ${cfg.stones} correctly. ${correct === cfg.stones ? 'A perfect recall.' : 'The pale outlines show where the others were.'}`}
      </p>
      <div className="memgrid" style={{ ['--n' as any]: cfg.size }} role="grid" aria-label="Memory grid">
        {Array.from({ length: cfg.size * cfg.size }, (_, i) => {
          const showStone = stage === 'show' && target.has(i);
          const isPicked = picked.has(i);
          const result = stage === 'result';
          return (
            <button key={i} role="gridcell" className={`memcell ${showStone ? 'is-shown' : ''} ${isPicked ? 'is-picked' : ''} ${result && target.has(i) ? (isPicked ? 'is-right' : 'is-missed') : ''} ${result && isPicked && !target.has(i) ? 'is-wrong' : ''}`}
              onClick={() => toggle(i)} disabled={stage !== 'recall'} aria-pressed={isPicked}
              aria-label={`Row ${Math.floor(i / cfg.size) + 1}, column ${(i % cfg.size) + 1}${isPicked ? ', stone placed' : ''}${showStone ? ', stone' : ''}`}>
              <span />
            </button>
          );
        })}
      </div>
      <div className="row">
        {stage === 'ready' && <button className="btn" onClick={show}>Show the stones</button>}
        {stage === 'recall' && <>
          <button className="btn" onClick={() => setStage('result')} disabled={picked.size === 0}>Check</button>
          {!peeked && <button className="btn btn--quiet" onClick={() => { setPeeked(true); setStage('show'); setTimeout(() => setStage('recall'), 1500); }}>Show them once more</button>}
        </>}
        {stage === 'result' && <>
          <button className="btn" onClick={() => finish({ title: `${item.title} · ${d}`, reflection: `Recalled ${correct} of ${cfg.stones}${peeked ? ' (with a second look)' : ''}` })}>Finish</button>
          <button className="btn btn--ghost" onClick={again}>Try another</button>
        </>}
      </div>
    </div>
  );
}

// ───────────── mental arithmetic ─────────────
interface Sum { q: string; a: number; hint: string; method: string }
function makeSums(d: Difficulty): Sum[] {
  const r = Math.random, n = (lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1));
  const out: Sum[] = [];
  if (d === 'gentle') {
    const a = n(12, 58), b = n(11, 39); out.push({ q: `${a} + ${b}`, a: a + b, hint: 'Add the tens first, then the ones.', method: `${a - (a % 10)} + ${b - (b % 10)} = ${a - (a % 10) + b - (b % 10)}, then add ${a % 10} + ${b % 10}.` });
    const c = n(40, 95), e = n(12, 38); out.push({ q: `${c} − ${e}`, a: c - e, hint: 'Take away the tens, then the ones.', method: `${c} − ${e - (e % 10)} = ${c - e + (e % 10)}, then − ${e % 10}.` });
    const f = n(3, 9), g = n(4, 9); out.push({ q: `${f} × ${g}`, a: f * g, hint: 'Count up in steps.', method: `${f} lots of ${g}.` });
    const h = n(2, 9) * 10; out.push({ q: `Half of ${h * 2}`, a: h, hint: 'Halve the tens, then the ones.', method: `${h * 2} ÷ 2 = ${h}.` });
  } else if (d === 'moderate') {
    const a = n(13, 49), b = n(3, 8); out.push({ q: `${a} × ${b}`, a: a * b, hint: `Split ${a} into tens and ones.`, method: `${a - (a % 10)} × ${b} = ${(a - (a % 10)) * b}, plus ${a % 10} × ${b} = ${(a % 10) * b}.` });
    const c = n(2, 9) * 40; out.push({ q: `25% of ${c}`, a: c / 4, hint: '25% is a quarter: halve it twice.', method: `${c} ÷ 2 = ${c / 2}, ÷ 2 again = ${c / 4}.` });
    const e = n(6, 12), f = n(6, 12); out.push({ q: `${e * f} ÷ ${e}`, a: f, hint: `How many ${e}s make ${e * f}?`, method: `${e} × ${f} = ${e * f}.` });
    const g = n(101, 399), h = n(99, 199); out.push({ q: `${g} + ${h}`, a: g + h, hint: 'Round one number to a hundred, then adjust.', method: `Add hundreds, tens and ones separately: ${g} + ${h} = ${g + h}.` });
  } else {
    const a = n(12, 29), b = n(12, 29); out.push({ q: `${a} × ${b}`, a: a * b, hint: `Try ${a} × ${b - (b % 10)} first, then add ${a} × ${b % 10}.`, method: `${a} × ${b - (b % 10)} = ${a * (b - (b % 10))}, ${a} × ${b % 10} = ${a * (b % 10)}, total ${a * b}.` });
    const c = n(2, 12) * 20; out.push({ q: `15% of ${c}`, a: (c * 15) / 100, hint: '15% is 10% plus half of that.', method: `10% = ${c / 10}, 5% = ${c / 20}, so 15% = ${(c * 15) / 100}.` });
    const e = n(3, 9) * 8; out.push({ q: `Three-quarters of ${e}`, a: (e * 3) / 4, hint: 'Find a quarter, then take three of them.', method: `${e} ÷ 4 = ${e / 4}, × 3 = ${(e * 3) / 4}.` });
    const f = n(41, 89); out.push({ q: `${f} × 11`, a: f * 11, hint: `${f} × 10, plus one more ${f}.`, method: `${f * 10} + ${f} = ${f * 11}.` });
  }
  return out;
}

export function ArithmeticPuzzle({ item, finish }: ActivityProps) {
  const [d, setD] = useState<Difficulty>(lastDifficulty);
  const [sums, setSums] = useState(() => makeSums(d));
  const [i, setI] = useState(0);
  const [val, setVal] = useState('');
  const [status, setStatus] = useState<'ask' | 'wrong' | 'right' | 'shown'>('ask');
  const [hint, setHint] = useState(false);
  const [score, setScore] = useState(0);
  const s = sums[i];
  const change = (nd: Difficulty) => { lastDifficulty = nd; setD(nd); setSums(makeSums(nd)); setI(0); setVal(''); setStatus('ask'); setHint(false); setScore(0); };
  const next = () => {
    if (i < sums.length - 1) { setI(i + 1); setVal(''); setStatus('ask'); setHint(false); }
    else finish({ title: `${item.title} · ${d}`, reflection: `${score} of ${sums.length} worked out` });
  };
  return (
    <form className="sheet puzzle" onSubmit={e => {
      e.preventDefault();
      if (status === 'right' || status === 'shown') return next();
      if (!val.trim()) return;
      const ok = Math.abs(Number(val.replace(/,/g, '')) - s.a) < 1e-9;
      if (ok) { setStatus('right'); setScore(x => x + 1); } else setStatus('wrong');
    }}>
      <div className="sheet__head"><h2 id="activity-title" tabIndex={-1}>{item.title}</h2><DifficultyPicker value={d} onChange={change} /></div>
      <p className="eyebrow">{i + 1} of {sums.length} · no timer</p>
      <p className="sum serif">{s.q} = <input className="field sum__field" inputMode="decimal" value={status === 'shown' ? String(s.a) : val} onChange={e => { setVal(e.target.value); if (status === 'wrong') setStatus('ask'); }} aria-label={`Answer to ${s.q}`} disabled={status === 'right' || status === 'shown'} autoFocus key={i} /></p>
      <div aria-live="polite">
        {status === 'wrong' && <p className="note note--soft">Not quite — have another go.</p>}
        {(status === 'right' || status === 'shown') && <p className="explain"><span className="explain__verdict">{status === 'right' ? 'That’s it.' : `It’s ${s.a}.`}</span> One way: {s.method}</p>}
        {hint && status !== 'right' && status !== 'shown' && <p className="hint"><b>Hint:</b> {s.hint}</p>}
      </div>
      <div className="row">
        <button className="btn" type="submit">{status === 'right' || status === 'shown' ? (i < sums.length - 1 ? 'Next' : 'Finish') : 'Check'}</button>
        {status !== 'right' && status !== 'shown' && (!hint ? <button type="button" className="btn btn--quiet" onClick={() => setHint(true)}>Show a hint</button> : <button type="button" className="btn btn--quiet" onClick={() => setStatus('shown')}>Show the answer</button>)}
      </div>
    </form>
  );
}
