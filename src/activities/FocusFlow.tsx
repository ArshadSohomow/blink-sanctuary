import { useEffect, useState } from 'react';
import type { ActivityProps } from './ActivityRunner';
import { addTask, addTaskNote, getState, setState, updateTask, useStore } from '../state/store';
import { fmtClock } from '../model/util';
import type { FocusRun } from '../types';

const DURS = [5, 10, 20];

export function runRemaining(run: FocusRun, now = Date.now()) {
  const paused = run.pausedTotalMs + (run.pausedAt ? now - run.pausedAt : 0);
  const elapsed = now - run.startedAt - paused;
  return { elapsed, remaining: run.plannedMins * 60_000 - elapsed };
}

export function FocusFlow({ finish, params }: ActivityProps) {
  const s = useStore();
  const run = s.focusRun;
  const [reviewing, setReviewing] = useState<{ elapsed: number; ended: 'complete' | 'early' } | null>(null);

  if (reviewing) return <Review elapsed={reviewing.elapsed} ended={reviewing.ended} finish={finish} />;
  if (run) return <Running run={run} onEnd={(elapsed, ended) => setReviewing({ elapsed, ended })} />;
  return <Setup initialTask={params.get('task') ?? undefined} />;
}

function Setup({ initialTask }: { initialTask?: string }) {
  const s = useStore();
  const open = s.tasks.filter(t => t.status !== 'done');
  const [taskId, setTaskId] = useState(initialTask ?? s.currentTaskId ?? open[0]?.id ?? 'new');
  const [title, setTitle] = useState('');
  const task = s.tasks.find(t => t.id === taskId);
  const [step, setStep] = useState(task?.nextStep ?? '');
  const [dur, setDur] = useState<number | 'custom'>(10);
  const [custom, setCustom] = useState('15');
  const [err, setErr] = useState('');

  const start = (e: React.FormEvent) => {
    e.preventDefault();
    const mins = dur === 'custom' ? Math.round(Number(custom)) : dur;
    if (!Number.isFinite(mins) || mins < 1 || mins > 180) { setErr('Choose a length between 1 and 180 minutes.'); return; }
    let id = taskId, intention = task?.title ?? '';
    if (taskId === 'new') {
      if (!title.trim()) { setErr('What would you like to make progress on? Give it a short name.'); return; }
      const t = addTask({ title: title.trim(), nextStep: step.trim() || undefined }); id = t.id; intention = t.title;
    } else if (step.trim()) updateTask(taskId, { nextStep: step.trim() });
    setState(st => ({ ...st, currentTaskId: id, focusRun: { taskId: id, intention, step: step.trim(), plannedMins: mins, startedAt: Date.now(), pausedTotalMs: 0 } }));
  };

  return (
    <form className="sheet" onSubmit={start}>
      <h2 id="activity-title" tabIndex={-1}>Focus session</h2>
      <label className="label" htmlFor="f-task">What would you like to make progress on?</label>
      <select id="f-task" className="field" value={taskId} onChange={e => { setTaskId(e.target.value); setStep(s.tasks.find(t => t.id === e.target.value)?.nextStep ?? ''); setErr(''); }}>
        {open.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
        <option value="new">Something new…</option>
      </select>
      {taskId === 'new' && <input className="field" value={title} onChange={e => { setTitle(e.target.value); setErr(''); }} placeholder="e.g. Revise chapter 3" aria-label="New task" maxLength={80} />}
      <label className="label" htmlFor="f-step">What is the smallest useful step you can take?</label>
      <input id="f-step" className="field" value={step} onChange={e => setStep(e.target.value)} placeholder="e.g. Outline the first section" maxLength={120} />
      <fieldset className="seg-field">
        <legend>For how long?</legend>
        <div className="seg" role="radiogroup">
          {DURS.map(d => <button type="button" key={d} role="radio" aria-checked={dur === d} className={dur === d ? 'on' : ''} onClick={() => setDur(d)}>{d} min</button>)}
          <button type="button" role="radio" aria-checked={dur === 'custom'} className={dur === 'custom' ? 'on' : ''} onClick={() => setDur('custom')}>Custom</button>
        </div>
        {dur === 'custom' && <label className="inline-field">Minutes <input className="field field--short" type="number" min={1} max={180} value={custom} onChange={e => { setCustom(e.target.value); setErr(''); }} /></label>}
      </fieldset>
      {err && <p className="error" role="alert">{err}</p>}
      <button className="btn" type="submit">Begin</button>
      <p className="muted small">There’s no single right way to work. Stop whenever you need to — a session counts even if you end early.</p>
    </form>
  );
}

function Running({ run, onEnd }: { run: FocusRun; onEnd: (elapsed: number, ended: 'complete' | 'early') => void }) {
  const [, tick] = useState(0);
  const [hideTimer, setHideTimer] = useState(false);
  useEffect(() => { const t = setInterval(() => tick(x => x + 1), 1000); return () => clearInterval(t); }, []);
  const { elapsed, remaining } = runRemaining(run);
  useEffect(() => { if (remaining <= 0) end('complete'); }, [remaining <= 0]);

  const togglePause = () => setState(st => {
    const r = st.focusRun!; const now = Date.now();
    return { ...st, focusRun: r.pausedAt ? { ...r, pausedTotalMs: r.pausedTotalMs + (now - r.pausedAt), pausedAt: undefined } : { ...r, pausedAt: now } };
  });
  function end(kind: 'complete' | 'early') {
    const r = getState().focusRun; if (!r) return;
    const el = Math.min(runRemaining(r).elapsed, r.plannedMins * 60_000);
    setState(st => ({ ...st, focusRun: undefined }));
    onEnd(el, kind);
  }
  const pct = Math.min(1, elapsed / (run.plannedMins * 60_000));
  return (
    <div className="sheet sheet--center focus-run">
      <p className="eyebrow">Focusing on</p>
      <h2 id="activity-title" tabIndex={-1} className="serif-lg">{run.intention}</h2>
      {run.step && <p className="lead">Next step: {run.step}</p>}
      <div className="focus-ring" aria-hidden="true" style={{ ['--p' as any]: pct }}><span /></div>
      <p className={`focus-timer ${hideTimer ? 'is-hidden' : ''}`} aria-live="off">{run.pausedAt ? 'Paused · ' : ''}{hideTimer ? '' : `${fmtClock(Math.max(0, remaining))} left`}</p>
      <div className="row row--center">
        <button className="btn btn--ghost" onClick={togglePause}>{run.pausedAt ? 'Resume' : 'Pause'}</button>
        <button className="btn btn--quiet" onClick={() => end('early')}>End early</button>
        <button className="btn btn--quiet" onClick={() => setHideTimer(!hideTimer)}>{hideTimer ? 'Show timer' : 'Hide timer'}</button>
      </div>
      <p className="muted small">Leave this open only if it helps. The session keeps time even if you switch away or close the tab.</p>
    </div>
  );
}

function Review({ elapsed, ended, finish }: { elapsed: number; ended: 'complete' | 'early'; finish: ActivityProps['finish'] }) {
  const s = useStore();
  const task = s.tasks.find(t => t.id === s.currentTaskId);
  const [text, setText] = useState('');
  const [mark, setMark] = useState<'progressed' | 'done' | ''>('progressed');
  const mins = Math.max(1, Math.round(elapsed / 60000));
  const done = (withNote: boolean) => {
    if (task) {
      if (withNote && text.trim()) addTaskNote(task.id, text.trim());
      if (mark === 'done') updateTask(task.id, { status: 'done' });
    }
    finish({ type: 'focus', title: task ? `Focus: ${task.title}` : 'Focus session', durationSec: Math.round(elapsed / 1000), partial: elapsed < 60_000, reflection: withNote && text.trim() ? text.trim() : undefined, nextHint: ended === 'early' ? 'Ending early is fine — the effort counts.' : undefined });
  };
  return (
    <form className="sheet" onSubmit={e => { e.preventDefault(); done(true); }}>
      <p className="eyebrow">{ended === 'complete' ? 'Session complete' : 'Session ended'} · {mins} min</p>
      <h2 id="activity-title" tabIndex={-1}>What moved forward?</h2>
      <textarea className="field" rows={3} value={text} onChange={e => setText(e.target.value)} aria-label="What moved forward?" placeholder="One sentence is plenty" autoFocus />
      {task && (
        <div className="choices choices--row" role="radiogroup" aria-label="Task status">
          <button type="button" role="radio" aria-checked={mark === 'progressed'} className={`choice ${mark === 'progressed' ? 'is-chosen' : ''}`} onClick={() => setMark('progressed')}>Progressed</button>
          <button type="button" role="radio" aria-checked={mark === 'done'} className={`choice ${mark === 'done' ? 'is-chosen' : ''}`} onClick={() => setMark('done')}>Finished the task</button>
        </div>
      )}
      <div className="row">
        <button className="btn" type="submit">Save and finish</button>
        <button className="btn btn--quiet" type="button" onClick={() => done(false)}>Just finish</button>
      </div>
    </form>
  );
}
