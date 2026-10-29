import { useState } from 'react';
import type { Task, TaskStatus } from '../types';
import { addTask, deleteTask, setState, updateTask, useStore } from '../state/store';
import { startActivity } from '../state/router';
import { runRemaining } from '../activities/FocusFlow';
import { fmtClock, fmtDate } from '../model/util';
import { promptForGoal } from '../content/content';
import { Icon } from '../components/Icon';

const FREQ = ['', 'Once', 'Daily', 'A few times a week', 'Weekly'];
const TIMES = ['', 'Morning', 'Afternoon', 'Evening'];

function TaskForm({ initial, onSave, onCancel, submitLabel }: { initial?: Partial<Task>; onSave: (t: Partial<Task> & { title: string }) => void; onCancel?: () => void; submitLabel: string }) {
  const [t, setT] = useState<Partial<Task>>(initial ?? { status: 'priority' });
  const [more, setMore] = useState(!!initial?.id);
  const [err, setErr] = useState('');
  const set = (p: Partial<Task>) => setT(x => ({ ...x, ...p }));
  return (
    <form className="taskform" onSubmit={e => { e.preventDefault(); if (!t.title?.trim()) { setErr('Give the task a name.'); return; } onSave({ ...t, title: t.title.trim() }); if (!initial?.id) { setT({ status: 'priority' }); setMore(false); } }}>
      <div className="row">
        <input className="field" value={t.title ?? ''} onChange={e => { set({ title: e.target.value }); setErr(''); }} placeholder="A task, goal or intention" aria-label="Task name" maxLength={90} aria-invalid={!!err} />
        <button className="btn" type="submit">{submitLabel}</button>
      </div>
      {err && <p className="error" role="alert">{err}</p>}
      {!more ? <button type="button" className="link-btn small" onClick={() => setMore(true)}>Add details (optional)</button> : (
        <div className="taskform__more">
          <label>Next step<input className="field" value={t.nextStep ?? ''} onChange={e => set({ nextStep: e.target.value })} placeholder="The smallest useful step" /></label>
          <label>Why it matters<input className="field" value={t.why ?? ''} onChange={e => set({ why: e.target.value })} /></label>
          <label>Category<input className="field" value={t.category ?? ''} onChange={e => set({ category: e.target.value })} placeholder="e.g. Study, Home, Creative" /></label>
          <label>Where it sits<select className="field" value={t.status ?? 'priority'} onChange={e => set({ status: e.target.value as TaskStatus })}><option value="priority">Current priority</option><option value="upcoming">Upcoming intention</option></select></label>
          <label>How often<select className="field" value={t.frequency ?? ''} onChange={e => set({ frequency: e.target.value, recurring: !!e.target.value && e.target.value !== 'Once' })}>{FREQ.map(f => <option key={f} value={f}>{f || 'Not set'}</option>)}</select></label>
          <label>Preferred time<select className="field" value={t.preferredTime ?? ''} onChange={e => set({ preferredTime: e.target.value })}>{TIMES.map(f => <option key={f} value={f}>{f || 'Any time'}</option>)}</select></label>
          <label className="check"><input type="checkbox" checked={!!t.reminders} onChange={e => set({ reminders: e.target.checked })} /> Remind me about this (adds it to Rhythm)</label>
          {onCancel && <button type="button" className="btn btn--quiet btn--small" onClick={onCancel}>Cancel</button>}
        </div>
      )}
    </form>
  );
}

function TaskRow({ t }: { t: Task }) {
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const s = useStore();
  if (editing) return <li className="task task--editing"><TaskForm initial={t} submitLabel="Save" onCancel={() => setEditing(false)} onSave={p => { updateTask(t.id, p); syncReminder({ ...t, ...p }); setEditing(false); }} /></li>;
  const done = t.status === 'done';
  return (
    <li className={`task ${done ? 'task--done' : ''} ${s.currentTaskId === t.id ? 'task--current' : ''}`}>
      <label className="task__check">
        <input type="checkbox" checked={done} onChange={e => updateTask(t.id, { status: e.target.checked ? 'done' : 'priority' })} aria-label={done ? `Reopen ${t.title}` : `Mark ${t.title} complete`} />
        <span aria-hidden="true" />
      </label>
      <div className="task__body">
        <p className="task__title">{t.title}{t.recurring && <span className="tag">{t.frequency}</span>}{t.category && <span className="tag">{t.category}</span>}</p>
        {t.nextStep && !done && <p className="task__step">Next: {t.nextStep}</p>}
        {t.why && !done && <p className="muted small">Because {t.why.replace(/^because\s+/i, '')}</p>}
        {t.progressNotes.length > 0 && <p className="muted small">Last moved forward {fmtDate(t.progressNotes[t.progressNotes.length - 1].at).toLowerCase()}: “{t.progressNotes[t.progressNotes.length - 1].text}”</p>}
        {done && t.completedAt && <p className="muted small">Completed {fmtDate(t.completedAt).toLowerCase()}</p>}
      </div>
      <div className="task__actions">
        {!done && <button className="btn btn--small btn--ghost" onClick={() => startActivity('focus', { task: t.id })}>Focus</button>}
        {!done && <button className="btn btn--small btn--quiet" onClick={() => updateTask(t.id, { status: t.status === 'priority' ? 'upcoming' : 'priority' })}>{t.status === 'priority' ? 'Later' : 'Now'}</button>}
        {done && t.recurring && <button className="btn btn--small btn--quiet" onClick={() => updateTask(t.id, { status: 'priority' })}>Do again</button>}
        <button className="icon-btn" onClick={() => setEditing(true)} aria-label={`Edit ${t.title}`}><Icon name="edit" size={17} /></button>
        {confirm ? (
          <span className="confirm"><button className="btn btn--small btn--danger" onClick={() => { deleteTask(t.id); syncReminder({ ...t, reminders: false }); }}>Delete</button><button className="btn btn--small btn--quiet" onClick={() => setConfirm(false)}>Keep</button></span>
        ) : <button className="icon-btn" onClick={() => setConfirm(true)} aria-label={`Delete ${t.title}`}><Icon name="trash" size={17} /></button>}
      </div>
    </li>
  );
}

/** Tasks with reminders get a matching (editable) item in the Rhythm. */
function syncReminder(t: Partial<Task> & { id?: string; title: string }) {
  const time = t.preferredTime === 'Morning' ? '09:30' : t.preferredTime === 'Evening' ? '18:30' : '14:00';
  setState(s => {
    const id = 'task-' + t.id;
    const exists = s.routines.find(r => r.id === id);
    if (!t.reminders) return exists ? { ...s, routines: s.routines.filter(r => r.id !== id) } : s;
    const item = { id, title: t.title, activity: 'focus' as const, time: exists?.time ?? time, windowMins: 90, days: t.frequency === 'Weekly' ? [1] : t.frequency === 'A few times a week' ? [1, 3, 5] : [0, 1, 2, 3, 4, 5, 6], durationMins: 20, reminder: true, enabled: true };
    return { ...s, routines: exists ? s.routines.map(r => r.id === id ? { ...r, title: t.title } : r) : [...s.routines, item] };
  });
}

export function Focus() {
  const s = useStore();
  const [showDone, setShowDone] = useState(false);
  const prio = s.tasks.filter(t => t.status === 'priority');
  const up = s.tasks.filter(t => t.status === 'upcoming');
  const done = s.tasks.filter(t => t.status === 'done').sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0));
  const stepless = [...prio, ...up].filter(t => !t.nextStep).slice(0, 2);
  const sessions = s.activities.filter(a => a.type === 'focus');
  return (
    <div className="page">
      <header className="page__head">
        <h1 tabIndex={-1}>Focus</h1>
        <p className="page__sub">From thinking about it to actually beginning. One small step at a time.</p>
      </header>

      {s.focusRun ? (
        <section className="panel panel--feature focus-live">
          <p className="eyebrow">Session in progress</p>
          <p className="serif-lg">{s.focusRun.intention}</p>
          <p className="muted">{fmtClock(Math.max(0, runRemaining(s.focusRun).remaining))} left{s.focusRun.pausedAt ? ' · paused' : ''}</p>
          <button className="btn" onClick={() => startActivity('focus')}>Return to the session</button>
        </section>
      ) : (
        <section className="panel panel--feature">
          <p className="serif-lg">What would you like to make progress on?</p>
          <div className="row">
            <button className="btn btn--primary" onClick={() => startActivity('focus')}>Start a focus session</button>
            <button className="btn btn--ghost" onClick={() => startActivity('intention')}>Just set an intention</button>
          </div>
          {sessions.length > 0 && <p className="muted small">{sessions.length} focus session{sessions.length === 1 ? '' : 's'} so far. Every one counts, finished or not.</p>}
        </section>
      )}

      <section className="panel" aria-labelledby="add-task">
        <h2 id="add-task" className="h3">Add a task or goal</h2>
        <TaskForm submitLabel="Add" onSave={t => { const created = addTask(t); if (t.reminders) syncReminder({ ...t, id: created.id }); }} />
      </section>

      <section className="panel" aria-labelledby="prio">
        <h2 id="prio" className="h3">Current priorities</h2>
        {prio.length ? <ul className="tasks">{prio.map(t => <TaskRow key={t.id} t={t} />)}</ul> : <p className="empty">Nothing here yet. Add one thing you’d like to move forward — just one is plenty.</p>}
      </section>

      <section className="panel" aria-labelledby="up">
        <h2 id="up" className="h3">Upcoming intentions</h2>
        {up.length ? <ul className="tasks">{up.map(t => <TaskRow key={t.id} t={t} />)}</ul> : <p className="empty">Things for later can live here, out of the way.</p>}
      </section>

      {(stepless.length > 0 || s.goals.length > 0) && (
        <section className="panel" aria-labelledby="next">
          <h2 id="next" className="h3">Suggested next steps</h2>
          <ul className="suggest-steps">
            {stepless.map(t => <li key={t.id}><span>“{t.title}” doesn’t have a next step yet.</span> <button className="link-btn" onClick={() => startActivity('intention', { task: t.id })}>Choose one</button></li>)}
            {s.goals.slice(0, 3).map(g => <li key={g.id}><span>{promptForGoal(g.name)}</span> <button className="link-btn" onClick={() => startActivity('intention', { prompt: promptForGoal(g.name) })}>Try it</button></li>)}
          </ul>
        </section>
      )}

      <section className="panel" aria-labelledby="done">
        <h2 id="done" className="h3"><button className="disclosure" aria-expanded={showDone} onClick={() => setShowDone(!showDone)}>Completed actions <span className="muted">({done.length})</span></button></h2>
        {showDone && (done.length ? <ul className="tasks">{done.map(t => <TaskRow key={t.id} t={t} />)}</ul> : <p className="empty">Completed tasks will gather here.</p>)}
      </section>
    </div>
  );
}
