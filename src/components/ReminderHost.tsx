import { useEffect, useRef, useState } from 'react';
import { getState, setState } from '../state/store';
import { findDue, PAUSE_LINES, type DueReminder } from '../model/schedule';
import { showBrowserNotification } from '../services/notifications';
import { startActivity } from '../state/router';
import { dayKey } from '../model/util';
import { Icon } from './Icon';
import type { ReminderCategory } from '../types';

function log(category: ReminderCategory, action: 'shown' | 'snoozed' | 'dismissed' | 'started') {
  setState(s => ({ ...s, remindersLog: [...s.remindersLog, { at: Date.now(), category, action }].slice(-400) }));
}

/** Checks the schedule every 30 seconds and shows gentle, dismissible in-app reminders. */
export function ReminderHost() {
  const [current, setCurrent] = useState<DueReminder | null>(null);
  const shownKeys = useRef(new Set<string>());

  const present = (r: DueReminder, demo = false) => {
    shownKeys.current.add(r.key);
    setCurrent(r);
    if (!demo) {
      log(r.category, 'shown');
      if (r.routineId) setState(s => ({ ...s, routines: s.routines.map(x => x.id === r.routineId ? { ...x, remindedOn: dayKey() } : x) }));
    }
    const s = getState();
    if (s.reminders.browserNotifications && document.hidden) showBrowserNotification(r.title, r.body);
  };

  useEffect(() => {
    const check = () => {
      if (current || location.hash.startsWith('#/do/')) return; // never interrupt an activity
      const due = findDue(getState());
      if (due && !shownKeys.current.has(due.key)) present(due);
    };
    const first = setTimeout(check, 4000);
    const t = setInterval(check, 30_000);
    const demo = (e: Event) => {
      const cat = ((e as CustomEvent).detail as ReminderCategory) || 'pause';
      const r: DueReminder = cat === 'checkin'
        ? { key: 'demo-call' + Date.now(), category: 'checkin', title: 'Blink is checking in', body: 'A simulated check-in call. Accept or decline — either is fine.', activity: 'checkin' }
        : { key: 'demo' + Date.now(), category: 'pause', title: PAUSE_LINES[Math.floor(Math.random() * PAUSE_LINES.length)], body: 'This is a demonstration reminder. Start a short reset, snooze it, or dismiss it.', activity: 'breath-slow' };
      present(r, true);
      if (getState().reminders.browserNotifications) showBrowserNotification(r.title, r.body);
    };
    window.addEventListener('blink:demo-reminder', demo);
    return () => { clearTimeout(first); clearInterval(t); window.removeEventListener('blink:demo-reminder', demo); };
  }, [current]);

  if (!current) return null;
  const snoozeMins = getState().reminders.snoozeMins;
  const close = (action: 'snoozed' | 'dismissed' | 'started') => {
    log(current.category, action);
    if (action === 'snoozed') setState(s => ({ ...s, snoozedUntil: Date.now() + snoozeMins * 60_000 }));
    if (action === 'started' && current.activity) startActivity(current.activity, { quick: current.category === 'pause' ? '1' : '0', trigger: 'reminder' });
    setCurrent(null);
  };
  const isCall = current.category === 'checkin';
  return (
    <div className={`reminder ${isCall ? 'reminder--call' : ''}`} role="status" aria-live="polite">
      <span className="reminder__icon" aria-hidden="true"><Icon name={isCall ? 'phone' : current.category === 'focus' ? 'focus' : 'leaf'} /></span>
      <div className="reminder__text">
        <p className="reminder__title">{current.title}</p>
        <p className="reminder__body">{current.body}</p>
      </div>
      <div className="reminder__actions">
        <button className="btn btn--small" onClick={() => close('started')}>{isCall ? 'Accept' : current.category === 'pause' ? 'Take a pause' : 'Start'}</button>
        <button className="btn btn--small btn--quiet" onClick={() => close('snoozed')}>Snooze {snoozeMins} min</button>
        <button className="icon-btn" onClick={() => close('dismissed')} aria-label={isCall ? 'Decline' : 'Dismiss'}><Icon name="close" size={18} /></button>
      </div>
    </div>
  );
}
