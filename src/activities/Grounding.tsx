import { useEffect, useState } from 'react';
import type { ActivityProps } from './ActivityRunner';

const SENSES = [
  { n: 5, verb: 'see', prompt: 'Look around. Name five things you can see.' },
  { n: 4, verb: 'feel', prompt: 'Notice four things you can feel — the chair, your sleeves, the air.' },
  { n: 3, verb: 'hear', prompt: 'Listen for three sounds, near or far.' },
  { n: 2, verb: 'smell', prompt: 'Two things you can smell — or two smells you like.' },
  { n: 1, verb: 'taste', prompt: 'One thing you can taste, or would like to.' },
];

export function Grounding({ finish }: ActivityProps) {
  const [i, setI] = useState(-1);
  const [answers, setAnswers] = useState<string[][]>(SENSES.map(s => Array(s.n).fill('')));
  if (i < 0) {
    return (
      <div className="sheet">
        <h2 id="activity-title" tabIndex={-1}>Five senses</h2>
        <p className="lead">A grounding exercise that brings your attention back to the room you’re in. Type what you notice, or simply notice it and move on.</p>
        <button className="btn" onClick={() => setI(0)}>Begin</button>
      </div>
    );
  }
  const s = SENSES[i];
  const set = (k: number, v: string) => setAnswers(a => a.map((row, r) => r === i ? row.map((x, c) => c === k ? v : x) : row));
  const next = () => {
    if (i < SENSES.length - 1) setI(i + 1);
    else {
      const filled = answers.flat().filter(Boolean);
      finish({ title: 'Five senses', reflection: filled.length ? filled.join(', ') : undefined });
    }
  };
  return (
    <div className="sheet">
      <p className="eyebrow">{i + 1} of 5</p>
      <h2 id="activity-title" tabIndex={-1}>{s.n} {s.n === 1 ? 'thing' : 'things'} you can {s.verb}</h2>
      <p className="lead">{s.prompt}</p>
      <form className="sense-list" onSubmit={e => { e.preventDefault(); next(); }}>
        {answers[i].map((v, k) => (
          <input key={k} className="field" value={v} onChange={e => set(k, e.target.value)} aria-label={`Thing you can ${s.verb}, ${k + 1}`} placeholder={k === 0 ? 'Optional' : ''} maxLength={60} />
        ))}
        <div className="row">
          <button className="btn" type="submit">{answers[i].some(Boolean) ? 'Next' : 'Noticed — next'}</button>
          {i > 0 && <button className="btn btn--quiet" type="button" onClick={() => setI(i - 1)}>Back</button>}
        </div>
      </form>
    </div>
  );
}

const REGIONS = [
  'Your forehead and jaw. Is there any tension you can soften?',
  'Your shoulders. Let them drop a little, if they want to.',
  'Your hands. Notice their temperature and weight.',
  'Your chest and stomach. Notice the movement as you breathe — no need to change it.',
  'Your back, against the chair or standing tall.',
  'Your legs and feet. Feel the floor beneath you.',
];

export function BodyCheck({ finish }: ActivityProps) {
  const [i, setI] = useState(-1);
  const [auto, setAuto] = useState(true);
  const [word, setWord] = useState('');
  useEffect(() => {
    if (!auto || i < 0 || i >= REGIONS.length) return;
    const t = setTimeout(() => setI(x => x + 1), 12000);
    return () => clearTimeout(t);
  }, [i, auto]);

  if (i < 0) return (
    <div className="sheet">
      <h2 id="activity-title" tabIndex={-1}>Body check</h2>
      <p className="lead">A brief, kind scan from head to feet. Six short moments. You can let it move on by itself or go at your own pace.</p>
      <label className="check"><input type="checkbox" checked={auto} onChange={e => setAuto(e.target.checked)} /> Move on automatically every 12 seconds</label>
      <button className="btn" onClick={() => setI(0)}>Begin</button>
    </div>
  );
  if (i >= REGIONS.length) return (
    <form className="sheet" onSubmit={e => { e.preventDefault(); finish({ title: 'Body check', reflection: word.trim() || undefined }); }}>
      <h2 id="activity-title" tabIndex={-1}>One word for how your body feels?</h2>
      <p className="muted">Optional. It stays private, in this browser.</p>
      <input className="field" value={word} onChange={e => setWord(e.target.value)} maxLength={40} aria-label="One word" placeholder="e.g. heavy, loose, awake" />
      <button className="btn" type="submit">Finish</button>
    </form>
  );
  return (
    <div className="sheet sheet--center">
      <p className="eyebrow">{i + 1} of {REGIONS.length}</p>
      <h2 id="activity-title" tabIndex={-1} className="serif-lg" aria-live="polite">{REGIONS[i]}</h2>
      {auto && <div className="soft-progress" key={i}><span /></div>}
      <div className="row row--center">
        <button className="btn btn--ghost" onClick={() => setI(i + 1)}>Next</button>
      </div>
    </div>
  );
}
