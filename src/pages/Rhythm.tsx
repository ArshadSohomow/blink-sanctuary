import { useState } from 'react';
import type { ActivityType, RoutineItem } from '../types';
import { sampleRoutine, setState, updateReminders, useStore } from '../state/store';
import { startActivity } from '../state/router';
import { ACTIVITY_FOR_ROUTINE, inQuietHours, shownToday, upcomingToday } from '../model/schedule';
import { dayKey, fmtDate, fmtTime, uid } from '../model/util';
import { Toggle, Seg } from '../components/Controls';
import { notificationPermission, requestNotificationPermission, showBrowserNotification } from '../services/notifications';
import { Icon } from '../components/Icon';

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TYPES: { v: ActivityType; label: string }[] = [
  { v: 'breathing', label: 'Breathing' }, { v: 'grounding', label: 'Grounding' }, { v: 'focus', label: 'Focus session' }, { v: 'movement', label: 'Movement / walk' },
  { v: 'journal', label: 'Journal' }, { v: 'mood', label: 'Mood check' }, { v: 'puzzle', label: 'Thinking exercise' }, { v: 'lesson', label: 'Reading / learning' },
  { v: 'intention', label: 'Set an intention' }, { v: 'care', label: 'Rest / relaxation' }, { v: 'checkin', label: 'Check-in call' },
];

function updRoutine(id: string, p: Partial<RoutineItem>) { setState(s => ({ ...s, routines: s.routines.map(r => r.id === id ? { ...r, ...p } : r) })); }
function addMinutes(hhmm: string, mins: number) {
  const [h, m] = hhmm.split(':').map(Number); const t = (h * 60 + m + mins) % (24 * 60);
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
}

function RoutineEditor({ r, onClose }: { r: RoutineItem; onClose: () => void }) {
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="routine-edit">
      <label>Name<input className="field" value={r.title} onChange={e => updRoutine(r.id, { title: e.target.value })} maxLength={60} /></label>
      <label>Activity<select className="field" value={r.activity} onChange={e => updRoutine(r.id, { activity: e.target.value as ActivityType })}>{TYPES.map(t => <option key={t.v} value={t.v}>{t.label}</option>)}</select></label>
      <label>Preferred time<input className="field" type="time" value={r.time} onChange={e => e.target.value && updRoutine(r.id, { time: e.target.value })} /></label>
      <label>Flexible window<select className="field" value={r.windowMins} onChange={e => updRoutine(r.id, { windowMins: Number(e.target.value) })}>{[15, 30, 60, 90, 120, 180].map(m => <option key={m} value={m}>{m < 60 ? `${m} minutes` : `${m / 60} hour${m > 60 ? 's' : ''}`}</option>)}</select></label>
      <label>Duration<select className="field" value={r.durationMins ?? ''} onChange={e => updRoutine(r.id, { durationMins: e.target.value ? Number(e.target.value) : undefined })}><option value="">Not set</option>{[1, 2, 3, 5, 10, 15, 20, 30, 45, 60].map(m => <option key={m} value={m}>{m} min</option>)}</select></label>
      <fieldset className="days"><legend>Repeat on</legend>
        {DAYS.map((d, i) => <button type="button" key={i} className={`day ${r.days.includes(i) ? 'on' : ''}`} aria-pressed={r.days.includes(i)} aria-label={DAY_NAMES[i]} onClick={() => updRoutine(r.id, { days: r.days.includes(i) ? r.days.filter(x => x !== i) : [...r.days, i].sort() })}>{d}</button>)}
      </fieldset>
      <Toggle checked={r.reminder} onChange={v => updRoutine(r.id, { reminder: v })} label="Remind me" hint="A gentle in-app reminder within the window" />
      <div className="row">
        <button className="btn btn--small" onClick={onClose}>Done</button>
        {confirm ? <><button className="btn btn--small btn--danger" onClick={() => setState(s => ({ ...s, routines: s.routines.filter(x => x.id !== r.id) }))}>Remove</button><button className="btn btn--small btn--quiet" onClick={() => setConfirm(false)}>Keep</button></>
          : <button className="btn btn--small btn--quiet" onClick={() => setConfirm(true)}><Icon name="trash" size={15} /> Remove</button>}
      </div>
    </div>
  );
}

export function Rhythm() {
  const s = useStore();
  const r = s.reminders;
  const [editing, setEditing] = useState<string | null>(null);
  const [perm, setPerm] = useState(notificationPermission());
  const [demoNote, setDemoNote] = useState('');
  const today = upcomingToday(s);
  const todayKey = dayKey();
  const reflection = s.reflections.find(x => x.date === todayKey);
  const [refNote, setRefNote] = useState(reflection?.note ?? '');

  const setCat = (k: keyof typeof r.categories, v: boolean) => updateReminders({ categories: { ...r.categories, [k]: v } });
  const enableBrowser = async (v: boolean) => {
    if (!v) { updateReminders({ browserNotifications: false }); return; }
    const p = await requestNotificationPermission(); setPerm(p);
    updateReminders({ browserNotifications: p === 'granted' });
  };
  const demo = (cat: 'pause' | 'checkin') => {
    window.dispatchEvent(new CustomEvent('blink:demo-reminder', { detail: cat }));
    setDemoNote(r.browserNotifications && perm === 'granted' ? 'Shown here and as a browser notification.' : 'Shown here in Blink. Browser notifications are off.');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const setReflection = (intentional: number) => setState(st => ({ ...st, reflections: [...st.reflections.filter(x => x.date !== todayKey), { date: todayKey, intentional, note: refNote.trim() || undefined }].slice(-90) }));
  const counts = { shown: 0, snoozed: 0, dismissed: 0, started: 0 } as Record<string, number>;
  s.remindersLog.forEach(l => counts[l.action]++);

  return (
    <div className="page">
      <header className="page__head">
        <h1 tabIndex={-1}>Rhythm</h1>
        <p className="page__sub">A gentle shape for the day — never a rigid timetable. Everything here is yours to change.</p>
      </header>

      <section className="panel" aria-labelledby="today-h">
        <h2 id="today-h" className="h3">Today</h2>
        {today.length === 0 ? <p className="empty">Nothing planned for today. That’s allowed.</p> : (
          <ul className="today">
            {today.map(({ item, time, done }) => (
              <li key={item.id} className={done ? 'is-done' : ''}>
                <span className="today__time">{time}</span>
                <span className="today__title">{item.title}{item.rescheduledTo?.date === todayKey && <span className="tag">moved</span>}</span>
                {done ? <span className="tag tag--done"><Icon name="check" size={14} /> done</span> : (
                  <span className="today__actions">
                    <button className="btn btn--small btn--ghost" onClick={() => startActivity(ACTIVITY_FOR_ROUTINE[item.activity])}>Start</button>
                    <button className="btn btn--small btn--quiet" onClick={() => updRoutine(item.id, { rescheduledTo: { date: todayKey, time: addMinutes(time!, 60) } })}>An hour later</button>
                    <button className="btn btn--small btn--quiet" onClick={() => updRoutine(item.id, { skippedOn: todayKey, rescheduledTo: undefined })}>Skip today</button>
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
        {s.routines.some(x => x.skippedOn === todayKey) && <button className="link-btn small" onClick={() => setState(st => ({ ...st, routines: st.routines.map(x => x.skippedOn === todayKey ? { ...x, skippedOn: undefined } : x) }))}>Undo today’s skips</button>}
      </section>

      <section className="panel" aria-labelledby="routine-h">
        <h2 id="routine-h" className="h3">Your daily rhythm</h2>
        <p className="muted small">A sample is included to show how it works. Edit it, switch items off, or clear it entirely.</p>
        <ul className="routines">
          {[...s.routines].sort((a, b) => a.time.localeCompare(b.time)).map(item => (
            <li key={item.id} className={`routine ${item.enabled ? '' : 'is-off'}`}>
              <div className="routine__row">
                <span className="routine__time">{item.time}</span>
                <span className="routine__title">{item.title}<span className="muted small"> · {TYPES.find(t => t.v === item.activity)?.label}{item.durationMins ? ` · ${item.durationMins} min` : ''} · {item.days.length === 7 ? 'every day' : item.days.length === 0 ? 'no days' : item.days.map(d => DAY_NAMES[d].slice(0, 3)).join(' ')}{item.reminder ? ' · reminder' : ''}</span></span>
                <Toggle checked={item.enabled} onChange={v => updRoutine(item.id, { enabled: v })} label={<span className="visually-hidden">{item.title} enabled</span>} />
                <button className="icon-btn" aria-expanded={editing === item.id} onClick={() => setEditing(editing === item.id ? null : item.id)} aria-label={`Edit ${item.title}`}><Icon name="edit" size={17} /></button>
              </div>
              {editing === item.id && <RoutineEditor r={item} onClose={() => setEditing(null)} />}
            </li>
          ))}
        </ul>
        {s.routines.length === 0 && <p className="empty">No routine. Add a moment, or use the sample.</p>}
        <div className="row">
          <button className="btn btn--small btn--ghost" onClick={() => { const id = uid(); setState(st => ({ ...st, routines: [...st.routines, { id, title: 'A short walk', activity: 'movement', time: '12:30', windowMins: 60, days: [0, 1, 2, 3, 4, 5, 6], durationMins: 10, reminder: false, enabled: true }] })); setEditing(id); }}><Icon name="plus" size={16} /> Add a moment</button>
          <button className="btn btn--small btn--quiet" onClick={() => setState(st => ({ ...st, routines: sampleRoutine('light') }))}>Restore the sample</button>
          <button className="btn btn--small btn--quiet" onClick={() => setState(st => ({ ...st, routines: [] }))}>Clear all</button>
        </div>
      </section>

      <section className="panel" aria-labelledby="rem-h">
        <h2 id="rem-h" className="h3">Reminders</h2>
        <Toggle checked={r.enabled} onChange={v => updateReminders({ enabled: v })} label="Allow reminders" hint="Turn this off to silence everything." />
        <fieldset className="fs" disabled={!r.enabled}>
          <div className="grid2">
            <label>Quiet hours from<input className="field" type="time" value={r.quietStart} onChange={e => e.target.value && updateReminders({ quietStart: e.target.value })} /></label>
            <label>until<input className="field" type="time" value={r.quietEnd} onChange={e => e.target.value && updateReminders({ quietEnd: e.target.value })} /></label>
            <label>Reminder window from<input className="field" type="time" value={r.windowStart} onChange={e => e.target.value && updateReminders({ windowStart: e.target.value })} /></label>
            <label>until<input className="field" type="time" value={r.windowEnd} onChange={e => e.target.value && updateReminders({ windowEnd: e.target.value })} /></label>
            <label>At most<select className="field" value={r.maxPerDay} onChange={e => updateReminders({ maxPerDay: Number(e.target.value) })}>{[1, 2, 3, 4, 6].map(n => <option key={n} value={n}>{n} a day</option>)}</select></label>
            <label>Snooze for<select className="field" value={r.snoozeMins} onChange={e => updateReminders({ snoozeMins: Number(e.target.value) })}>{[5, 10, 15, 30, 60].map(n => <option key={n} value={n}>{n} minutes</option>)}</select></label>
            <label>Pause prompts<select className="field" value={r.pauseEveryHours} onChange={e => updateReminders({ pauseEveryHours: Number(e.target.value) })}><option value={0}>Off</option><option value={1}>About every hour</option><option value={2}>Every 2 hours</option><option value={3}>Every 3 hours</option></select></label>
          </div>
          <p className="label">Reminder categories</p>
          <Toggle checked={r.categories.routine} onChange={v => setCat('routine', v)} label="Rhythm moments" hint="For items in your daily rhythm that have a reminder" />
          <Toggle checked={r.categories.pause} onChange={v => setCat('pause', v)} label="Pause prompts" hint="“A small pause, if you need one.”" />
          <Toggle checked={r.suggestFocus} onChange={v => updateReminders({ suggestFocus: v })} label="Reminders may suggest a focus session" />
          <Toggle checked={r.simulatedCalls && r.categories.checkin} onChange={v => updateReminders({ simulatedCalls: v, categories: { ...r.categories, checkin: v } })} label="Simulated check-in calls" hint="At most one a day, inside your window. Off by default." />
          <p className="muted small">{inQuietHours(s) ? 'It’s quiet hours right now — no reminders will appear.' : `${shownToday(s)} of ${r.maxPerDay} reminders shown today.`} Blink never sends more reminders because you’ve missed something.</p>
        </fieldset>

        <div className="subpanel">
          <Toggle checked={r.browserNotifications && perm === 'granted'} disabled={perm === 'unsupported' || perm === 'denied'} onChange={enableBrowser}
            label="Browser notifications"
            hint={perm === 'unsupported' ? 'This browser doesn’t support notifications.' : perm === 'denied' ? 'Notifications are blocked for this site in your browser settings.' : 'Lets reminders appear when Blink is open in another tab. Your browser will ask for permission.'} />
          <p className="muted xsmall">Honest limits: a website can only notify you while your browser is running and permission is granted. If the browser is closed, nothing will appear. Blink can’t take over your screen or see other apps.</p>
        </div>
        <div className="row">
          <button className="btn btn--small btn--ghost" onClick={() => demo('pause')}>Show a demo reminder</button>
          <button className="btn btn--small btn--ghost" onClick={() => demo('checkin')}>Demo a check-in call</button>
          {perm === 'granted' && <button className="btn btn--small btn--quiet" onClick={() => showBrowserNotification('A small pause, if you need one.', 'This is a test notification from Blink.')}>Test a browser notification</button>}
        </div>
        {demoNote && <p className="muted small" role="status">{demoNote}</p>}
      </section>

      <section className="panel" aria-labelledby="dw-h">
        <h2 id="dw-h" className="h3">Your relationship with your device</h2>
        <label className="label" htmlFor="scroll-est">Roughly how long do you spend scrolling on a typical day?</label>
        <div className="row">
          <select id="scroll-est" className="field field--auto" value={s.scrollEstimateMins ?? ''} onChange={e => setState(st => ({ ...st, scrollEstimateMins: e.target.value ? Number(e.target.value) : undefined }))}>
            <option value="">Prefer not to say</option>
            {[15, 30, 60, 90, 120, 180, 240, 300].map(m => <option key={m} value={m}>{m < 60 ? `${m} minutes` : `${m / 60} hour${m > 60 ? 's' : ''}`}</option>)}
          </select>
          {s.scrollEstimateMins && <span className="tag">Your estimate — not measured</span>}
        </div>
        <p className="muted xsmall">Blink can’t see your screen time. A future mobile app could, with your permission, use the operating system’s screen-time features — and would always label measured figures separately from estimates.</p>

        <p className="label">Today, did your device use feel…</p>
        <Seg label="Today’s device use" value={reflection?.intentional ?? -1} onChange={setReflection} options={[{ v: 2, label: 'Mostly intentional' }, { v: 1, label: 'Mixed' }, { v: 0, label: 'Mostly on autopilot' }]} />
        <input className="field" value={refNote} onChange={e => setRefNote(e.target.value)} onBlur={() => reflection && setReflection(reflection.intentional)} placeholder="A note, if you like" aria-label="Note about today’s device use" maxLength={140} />
        {s.reflections.length > 1 && (
          <div className="reflect-row" aria-label="Recent reflections">
            {s.reflections.slice(-10).map(x => <span key={x.date} className={`rdot rdot--${x.intentional}`} title={`${x.date}: ${['mostly on autopilot', 'mixed', 'mostly intentional'][x.intentional]}`}>{['○', '◐', '●'][x.intentional]}</span>)}
          </div>
        )}

        <div className="row">
          <button className="btn btn--ghost" onClick={() => startActivity('antiscroll', { trigger: 'manual' })}>I’m scrolling without intention</button>
        </div>

        <h3 className="h4">Conscious pauses</h3>
        {s.interventions.length === 0 ? <p className="empty">When you use “I’m scrolling without intention” or a reminder, it’s noted here — for you only.</p> : (
          <ul className="interventions">
            {[...s.interventions].reverse().slice(0, 8).map(i => (
              <li key={i.id}><span className="muted small">{fmtDate(i.at)}, {fmtTime(i.at)}</span> <span>{i.intention || 'Paused'}</span> <span className="tag">{{ continue: 'continued on purpose', break: 'took a break', task: 'returned to a task', leave: 'put the device down' }[i.outcome ?? 'continue']}</span></li>
            ))}
          </ul>
        )}
        <p className="muted xsmall">Reminders so far (from this browser only): {counts.shown} shown, {counts.started} started, {counts.snoozed} snoozed, {counts.dismissed} dismissed.</p>
      </section>
    </div>
  );
}
