import { useEffect, useState } from 'react';
import type { ActivityProps } from './ActivityRunner';
import { setState, useStore } from '../state/store';
import { LOGIC } from '../content/puzzles';
import { startActivity } from '../state/router';
import { uid } from '../model/util';

const REASONS = ['To check something specific', 'To reply to someone', 'To pass the time', 'To avoid something', 'I’m not sure'];

export function AntiScroll({ finish, params }: ActivityProps) {
  const s = useStore();
  const [step, setStep] = useState(0);
  const [why, setWhy] = useState('');
  const [other, setOther] = useState('');
  const [intended, setIntended] = useState('');
  const [reset, setReset] = useState<'' | 'breathe' | 'logic' | 'reflect'>('');
  const [resetDone, setResetDone] = useState(false);
  const [reflection, setReflection] = useState('');
  const tasks = s.tasks.filter(t => t.status !== 'done').slice(0, 3);

  const record = (outcome: 'continue' | 'break' | 'task' | 'leave', taskId?: string) => {
    const intention = other.trim() || why;
    setState(st => ({ ...st, interventions: [...st.interventions, { id: uid(), at: Date.now(), trigger: (params.get('trigger') as any) || 'manual', intention, reset, outcome }].slice(-300) }));
    const hint = {
      continue: 'Carry on — with intention this time. No guilt either way.',
      break: 'Enjoy the break. Your sanctuary will keep.',
      task: 'Your task is waiting, one small step at a time.',
      leave: 'Put the device down for a while. That’s the best possible outcome.',
    }[outcome];
    finish({ title: 'A conscious pause', reflection: [intention && `Opened to: ${intention}`, intended && `Intended: ${intended}`, reflection].filter(Boolean).join(' · ') || undefined, nextHint: hint });
    if (outcome === 'task' && taskId) setTimeout(() => startActivity('focus', { task: taskId }), 50);
  };

  return (
    <div className="sheet">
      {step === 0 && <>
        <h2 id="activity-title" tabIndex={-1}>What did you open your device to do?</h2>
        <p className="muted">No judgement. Scrolling isn’t wrong — this is just a moment to choose.</p>
        <div className="choices" role="radiogroup">
          {REASONS.map(r => <button key={r} role="radio" aria-checked={why === r} className={`choice ${why === r ? 'is-chosen' : ''}`} onClick={() => setWhy(r)}>{r}</button>)}
        </div>
        <input className="field" value={other} onChange={e => setOther(e.target.value)} placeholder="Or in your own words" aria-label="In your own words" maxLength={100} />
        <button className="btn" disabled={!why && !other.trim()} onClick={() => setStep(1)}>Next</button>
      </>}
      {step === 1 && <>
        <h2 id="activity-title" tabIndex={-1}>Is this what you intended to spend time on?</h2>
        <div className="choices">
          {['Yes, it is', 'Partly', 'Not really'].map(r => <button key={r} className={`choice ${intended === r ? 'is-chosen' : ''}`} aria-pressed={intended === r} onClick={() => { setIntended(r); setStep(2); }}>{r}</button>)}
        </div>
      </>}
      {step === 2 && !reset && <>
        <h2 id="activity-title" tabIndex={-1}>A quick reset?</h2>
        <p className="muted">Thirty seconds, then you decide what happens next.</p>
        <div className="choices">
          <button className="choice" onClick={() => setReset('breathe')}>Thirty seconds of slow breathing</button>
          <button className="choice" onClick={() => setReset('logic')}>One small logic question</button>
          <button className="choice" onClick={() => setReset('reflect')}>A thirty-second reflection</button>
          <button className="choice" onClick={() => setStep(3)}>Skip — let me choose what’s next</button>
        </div>
      </>}
      {step === 2 && reset === 'breathe' && <MiniBreath onDone={() => { setResetDone(true); setStep(3); }} />}
      {step === 2 && reset === 'logic' && <MiniLogic onDone={() => { setResetDone(true); setStep(3); }} />}
      {step === 2 && reset === 'reflect' && (
        <form onSubmit={e => { e.preventDefault(); setResetDone(true); setStep(3); }}>
          <h2 id="activity-title" tabIndex={-1}>What do you actually want right now?</h2>
          <textarea className="field" rows={3} value={reflection} onChange={e => setReflection(e.target.value)} aria-label="What do you actually want right now?" autoFocus />
          <button className="btn" type="submit">Continue</button>
        </form>
      )}
      {step === 3 && <>
        <h2 id="activity-title" tabIndex={-1}>{resetDone ? 'Good. ' : ''}What would you like to do next?</h2>
        <div className="choices">
          <button className="choice" onClick={() => record('continue')}>Continue — on purpose</button>
          <button className="choice" onClick={() => record('break')}>Take a proper break</button>
          {tasks.map(t => <button key={t.id} className="choice" onClick={() => record('task', t.id)}>Return to: {t.title}</button>)}
          <button className="choice" onClick={() => record('leave')}>Put the device down</button>
        </div>
      </>}
    </div>
  );
}

function MiniBreath({ onDone }: { onDone: () => void }) {
  const [t, setT] = useState(0);
  useEffect(() => { const i = setInterval(() => setT(x => x + 1), 1000); return () => clearInterval(i); }, []);
  useEffect(() => { if (t >= 30) onDone(); }, [t]);
  const phase = t % 10 < 4 ? 'in' : 'out';
  return (
    <div className="sheet--center">
      <h2 id="activity-title" tabIndex={-1} className="visually-hidden">Thirty seconds of breathing</h2>
      <div className="breathe__stage breathe__stage--small">
        <div className="breathe__circle" style={{ transform: `scale(${t === 0 ? 0.55 : phase === 'in' ? 1 : 0.55})`, transitionDuration: phase === 'in' ? '4s' : '6s' }}><span className="breathe__ring" /></div>
        <p className="breathe__label" aria-live="polite">{phase === 'in' ? 'Breathe in' : 'Breathe out'}</p>
      </div>
      <p className="muted small">{30 - t}s</p>
      <button className="btn btn--quiet" onClick={onDone}>Done</button>
    </div>
  );
}

function MiniLogic({ onDone }: { onDone: () => void }) {
  const [p] = useState(() => { const g = LOGIC.filter(x => x.options); return g[Math.floor(Math.random() * g.length)]; });
  const [pick, setPick] = useState('');
  return (
    <div>
      <h2 id="activity-title" tabIndex={-1}>One small question</h2>
      <p className="puzzle__q serif">{p.q}</p>
      <div className="choices">
        {p.options!.map(o => <button key={o} className={`choice ${pick && o === p.answer ? 'is-right' : ''} ${pick === o && o !== p.answer ? 'is-wrong' : ''}`} onClick={() => setPick(o)} disabled={pick === p.answer}>{o}</button>)}
      </div>
      <div aria-live="polite">
        {pick && pick !== p.answer && <p className="note note--soft">Not quite. Another look?</p>}
        {pick === p.answer && <div className="explain"><p>{p.explain}</p><button className="btn" onClick={onDone}>Continue</button></div>}
      </div>
    </div>
  );
}
