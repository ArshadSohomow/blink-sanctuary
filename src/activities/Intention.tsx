import { useState } from 'react';
import type { ActivityProps } from './ActivityRunner';
import { addTask, setState, updateTask, useStore } from '../state/store';
import { startActivity } from '../state/router';

export function Intention({ finish, params }: ActivityProps) {
  const s = useStore();
  const open = s.tasks.filter(t => t.status !== 'done');
  const prompt = params.get('prompt');
  const [taskId, setTaskId] = useState(params.get('task') ?? open[0]?.id ?? 'new');
  const [title, setTitle] = useState('');
  const [step, setStep] = useState(() => s.tasks.find(t => t.id === taskId)?.nextStep ?? '');
  const [finished, setFinished] = useState('');
  const [err, setErr] = useState('');

  const save = (andFocus: boolean) => {
    let id = taskId;
    if (taskId === 'new') {
      if (!title.trim()) { setErr('Give it a name first.'); return; }
      id = addTask({ title: title.trim(), nextStep: step.trim() || undefined }).id;
    } else updateTask(taskId, { nextStep: step.trim() || undefined });
    setState(st => ({ ...st, currentTaskId: id }));
    const t = taskId === 'new' ? title.trim() : s.tasks.find(x => x.id === taskId)?.title;
    finish({ title: 'Set an intention', reflection: [t, step && `Next: ${step}`, finished && `Finished means: ${finished}`].filter(Boolean).join(' · ') });
    if (andFocus) setTimeout(() => startActivity('focus', { task: id }), 50);
  };

  return (
    <form className="sheet" onSubmit={e => { e.preventDefault(); save(false); }}>
      <h2 id="activity-title" tabIndex={-1}>Set an intention</h2>
      {prompt && <p className="lead serif">{prompt}</p>}
      <label className="label" htmlFor="int-task">What would you like to make progress on?</label>
      <select id="int-task" className="field" value={taskId} onChange={e => { setTaskId(e.target.value); setStep(s.tasks.find(t => t.id === e.target.value)?.nextStep ?? ''); }}>
        {open.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
        <option value="new">Something new…</option>
      </select>
      {taskId === 'new' && <input className="field" value={title} onChange={e => { setTitle(e.target.value); setErr(''); }} placeholder="e.g. Finish the booking flow" aria-label="New task name" maxLength={80} autoFocus />}
      {err && <p className="error" role="alert">{err}</p>}
      <label className="label" htmlFor="int-step">What is the smallest useful step?</label>
      <input id="int-step" className="field" value={step} onChange={e => setStep(e.target.value)} placeholder="Small enough to start in two minutes" maxLength={120} />
      <label className="label" htmlFor="int-fin">What would “finished” look like? <span className="muted">(optional)</span></label>
      <input id="int-fin" className="field" value={finished} onChange={e => setFinished(e.target.value)} maxLength={120} />
      <div className="row">
        <button className="btn" type="submit">Save intention</button>
        <button className="btn btn--ghost" type="button" onClick={() => save(true)}>Save and start focusing</button>
      </div>
    </form>
  );
}
