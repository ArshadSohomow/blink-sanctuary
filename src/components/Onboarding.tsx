import { useEffect, useRef, useState } from 'react';
import type { Goal } from '../types';
import { GOAL_SUGGESTIONS, HELPS, REASONS } from '../content/content';
import { addTask, sampleRoutine, setState, updatePrefs, useStore } from '../state/store';
import { uid } from '../model/util';
import { Icon } from './Icon';

export function Onboarding({ onClose }: { onClose: () => void }) {
  const s = useStore();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(s.prefs.nickname);
  const [reasons, setReasons] = useState<string[]>(s.onboarding.reasons);
  const [customReason, setCustomReason] = useState('');
  const [goals, setGoals] = useState<Goal[]>(s.goals);
  const [goalText, setGoalText] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [helps, setHelps] = useState<string[]>(s.onboarding.helps);
  const [rhythm, setRhythm] = useState<'light' | 'flexible' | 'none' | ''>(s.onboarding.rhythm);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { ref.current?.querySelector<HTMLElement>('h2')?.focus(); }, [step]);
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, []);

  const toggle = (list: string[], set: (v: string[]) => void, v: string) => set(list.includes(v) ? list.filter(x => x !== v) : [...list, v]);
  const addGoal = (n: string) => { const t = n.trim(); if (!t || goals.some(g => g.name.toLowerCase() === t.toLowerCase())) return; setGoals([...goals, { id: uid(), name: t, reminders: false }]); setGoalText(''); };
  const updGoal = (id: string, p: Partial<Goal>) => setGoals(goals.map(g => g.id === id ? { ...g, ...p } : g));

  const finish = () => {
    const allReasons = customReason.trim() ? [...reasons, customReason.trim()] : reasons;
    updatePrefs({ nickname: name.trim() });
    setState(st => {
      const known = new Set(st.tasks.map(t => t.title.toLowerCase()));
      return {
        ...st,
        goals,
        onboarding: { done: true, dismissed: true, reasons: allReasons, helps, rhythm },
        routines: rhythm === 'none' ? st.routines.map(r => ({ ...r, enabled: false })) : rhythm === 'flexible' ? sampleRoutine('flexible') : rhythm === 'light' ? sampleRoutine('light') : st.routines,
        reminders: { ...st.reminders, enabled: helps.includes('Gentle reminders') || st.reminders.enabled, categories: { ...st.reminders.categories, checkin: helps.includes('Verbal check-ins') }, simulatedCalls: helps.includes('Verbal check-ins') ? st.reminders.simulatedCalls : false },
        tasks: st.tasks.concat(goals.filter(g => g.nextStep && !known.has(g.name.toLowerCase())).map(g => ({ id: uid(), title: g.name, category: g.category, why: g.why, nextStep: g.nextStep, frequency: g.frequency, preferredTime: g.time, reminders: g.reminders, recurring: !!g.frequency, status: 'upcoming' as const, progressNotes: [], createdAt: Date.now(), updatedAt: Date.now() }))),
      };
    });
    onClose();
  };

  const steps = ['What brings you here?', 'What matters to you?', 'What would help?', 'Choose your rhythm', 'Enter the sanctuary'];

  return (
    <div className="overlay overlay--soft" role="dialog" aria-modal="true" aria-labelledby="ob-title" ref={ref}>
      <div className="overlay__bar">
        <span className="overlay__cat">Personalise · {step + 1} of 5</span>
        <button className="icon-btn" onClick={onClose} aria-label="Close — you can do this later"><Icon name="close" /></button>
      </div>
      <div className="overlay__inner">
        <div className="sheet">
          <h2 id="ob-title" tabIndex={-1}>{steps[step]}</h2>

          {step === 0 && <>
            <label className="label" htmlFor="ob-name">What should we call you? <span className="muted">(optional)</span></label>
            <input id="ob-name" className="field" value={name} onChange={e => setName(e.target.value)} maxLength={30} placeholder="A first name or nickname" />
            <p className="label">Choose any that fit</p>
            <div className="chips">{REASONS.map(r => <button key={r} className={`chip ${reasons.includes(r) ? 'on' : ''}`} aria-pressed={reasons.includes(r)} onClick={() => toggle(reasons, setReasons, r)}>{r}</button>)}</div>
            <input className="field" value={customReason} onChange={e => setCustomReason(e.target.value)} placeholder="Something else, in your words" aria-label="Another reason" maxLength={100} />
          </>}

          {step === 1 && <>
            <p className="muted">A few things you’d like to make more room for. Add details only if you want to.</p>
            <div className="chips">{GOAL_SUGGESTIONS.map(g => <button key={g} className={`chip ${goals.some(x => x.name === g) ? 'on' : ''}`} aria-pressed={goals.some(x => x.name === g)} onClick={() => goals.some(x => x.name === g) ? setGoals(goals.filter(x => x.name !== g)) : addGoal(g)}>{g}</button>)}</div>
            <form className="row" onSubmit={e => { e.preventDefault(); addGoal(goalText); }}>
              <input className="field" value={goalText} onChange={e => setGoalText(e.target.value)} placeholder="Add your own" aria-label="Add your own" maxLength={60} />
              <button className="btn btn--ghost" type="submit" disabled={!goalText.trim()}>Add</button>
            </form>
            {goals.length > 0 && (
              <ul className="goal-list">
                {goals.map(g => (
                  <li key={g.id}>
                    <div className="goal-list__row">
                      <span className="serif">{g.name}</span>
                      <button className="btn btn--quiet btn--small" onClick={() => setEditing(editing === g.id ? null : g.id)} aria-expanded={editing === g.id}>{editing === g.id ? 'Done' : 'Add details'}</button>
                      <button className="icon-btn" onClick={() => setGoals(goals.filter(x => x.id !== g.id))} aria-label={`Remove ${g.name}`}><Icon name="close" size={16} /></button>
                    </div>
                    {editing === g.id && (
                      <div className="goal-details">
                        <label>Why it matters<input className="field" value={g.why ?? ''} onChange={e => updGoal(g.id, { why: e.target.value })} /></label>
                        <label>Category<input className="field" value={g.category ?? ''} onChange={e => updGoal(g.id, { category: e.target.value })} placeholder="e.g. Learning" /></label>
                        <label>How often<select className="field" value={g.frequency ?? ''} onChange={e => updGoal(g.id, { frequency: e.target.value })}><option value="">Not set</option><option>Daily</option><option>A few times a week</option><option>Weekly</option><option>Whenever I can</option></select></label>
                        <label>Preferred time<select className="field" value={g.time ?? ''} onChange={e => updGoal(g.id, { time: e.target.value })}><option value="">Any time</option><option>Morning</option><option>Afternoon</option><option>Evening</option></select></label>
                        <label>A next step<input className="field" value={g.nextStep ?? ''} onChange={e => updGoal(g.id, { nextStep: e.target.value })} placeholder="Adds it to your tasks" /></label>
                        <label className="check"><input type="checkbox" checked={!!g.reminders} onChange={e => updGoal(g.id, { reminders: e.target.checked })} /> I’d like reminders for this</label>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </>}

          {step === 2 && <>
            <p className="muted">Choose what sounds useful. Everything can be changed later in Rhythm and Settings.</p>
            <div className="chips">{HELPS.map(h => <button key={h} className={`chip ${helps.includes(h) ? 'on' : ''}`} aria-pressed={helps.includes(h)} onClick={() => toggle(helps, setHelps, h)}>{h}</button>)}</div>
            {helps.includes('Verbal check-ins') && <p className="muted small">Check-ins are simulated calls you can start yourself. Scheduled calls stay off until you switch them on in Rhythm.</p>}
          </>}

          {step === 3 && <>
            <div className="choices">
              {([['light', 'A light routine', 'Four short moments across the day. Easy to edit.'], ['flexible', 'A flexible routine', 'Just a morning and an evening moment.'], ['none', 'No routine', 'I’ll come when I want to.']] as const).map(([k, t, d]) => (
                <button key={k} className={`choice choice--rich ${rhythm === k ? 'is-chosen' : ''}`} aria-pressed={rhythm === k} onClick={() => setRhythm(k)}><span className="serif">{t}</span><span className="muted small">{d}</span></button>
              ))}
            </div>
          </>}

          {step === 4 && <>
            <p className="lead">That’s all. Your sanctuary is ready{name.trim() ? `, ${name.trim()}` : ''}.</p>
            <p className="muted">Everything you shared stays in this browser. You can change it any time.</p>
          </>}

          <div className="row ob-nav">
            {step < 4 ? <button className="btn" onClick={() => setStep(step + 1)}>{step === 3 && !rhythm ? 'Skip' : 'Continue'}</button> : <button className="btn" onClick={finish}>Enter the sanctuary</button>}
            {step > 0 && <button className="btn btn--quiet" onClick={() => setStep(step - 1)}>Back</button>}
            {step < 4 && <button className="btn btn--quiet" onClick={() => setStep(4)}>Skip the rest</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

export { addTask };
