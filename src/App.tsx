import { useEffect, useState } from 'react';
import { useStore, updatePrefs, AWAY_DAYS } from './state/store';
import { useRoute, go, type Section } from './state/router';
import { resolvePhase } from './model/time';
import { Environment } from './components/Environment';
import { EntryRitual } from './components/EntryRitual';
import { Sanctuary } from './pages/Sanctuary';
import { Activities } from './pages/Activities';
import { Focus } from './pages/Focus';
import { Journal } from './pages/Journal';
import { Rhythm } from './pages/Rhythm';
import { Settings } from './pages/Settings';
import { ActivityRunner } from './activities/ActivityRunner';
import { ReminderHost } from './components/ReminderHost';
import { Icon } from './components/Icon';
import { sessionFlag } from './services/storage';
import { startAmbient, stopAmbient, suspendAmbient } from './services/sound';
import { notificationPermission } from './services/notifications';

const NAV: { id: Section; label: string; icon: string }[] = [
  { id: 'sanctuary', label: 'Sanctuary', icon: 'stones' },
  { id: 'activities', label: 'Activities', icon: 'leaf' },
  { id: 'focus', label: 'Focus', icon: 'focus' },
  { id: 'journal', label: 'Journal', icon: 'journal' },
  { id: 'rhythm', label: 'Rhythm', icon: 'rhythm' },
];

export function App() {
  const s = useStore();
  const route = useRoute();
  const [now, setNow] = useState(() => new Date());
  const [ritual, setRitual] = useState(() => s.prefs.showRitual && !sessionFlag('blink.entered') && !location.hash.startsWith('#/do/'));

  // tick once a minute so the sky follows the clock
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 60_000); return () => clearInterval(t); }, []);

  const phase = resolvePhase(s.prefs.appearance, now);
  const systemReduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const reduced = s.prefs.motion === 'reduce' || (s.prefs.motion === 'system' && systemReduce);

  useEffect(() => {
    const html = document.documentElement;
    html.dataset.phase = phase;
    html.dataset.motion = reduced ? 'reduce' : 'full';
    html.style.fontSize = `${s.prefs.textScale * 100}%`;
  }, [phase, reduced, s.prefs.textScale]);

  // pause decorative animation and sound when the tab isn't visible
  useEffect(() => {
    const on = () => { document.documentElement.classList.toggle('is-hidden', document.hidden); suspendAmbient(document.hidden); };
    document.addEventListener('visibilitychange', on);
    return () => document.removeEventListener('visibilitychange', on);
  }, []);

  useEffect(() => { s.prefs.sound ? startAmbient() : stopAmbient(); }, [s.prefs.sound]);

  // move focus to the main heading on navigation, for keyboard and screen-reader users
  useEffect(() => {
    if (ritual) return;
    const h = document.querySelector<HTMLElement>('main h1');
    h?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  }, [route.section, ritual]);

  const enter = () => { sessionFlag('blink.entered', true); setRitual(false); };
  const notifOn = s.reminders.enabled;
  const perm = notificationPermission();

  const page = (() => {
    switch (route.section) {
      case 'activities': return <Activities />;
      case 'focus': return <Focus />;
      case 'journal': return <Journal />;
      case 'rhythm': return <Rhythm />;
      case 'settings': return <Settings />;
      default: return <Sanctuary awayDays={AWAY_DAYS} justEntered={!ritual} />;
    }
  })();

  return (
    <div className={`app app--${route.section}`}>
      <a className="skip-link" href="#main">Skip to content</a>
      <Environment phase={phase} dim={route.section !== 'sanctuary'} />

      {!ritual && (
        <>
          <header className="topbar" inert={!!route.activity || undefined}>
            <a className="wordmark" href="#/" aria-label="Blink — back to your sanctuary">blink<span className="wordmark__dot" /></a>
            <nav className="nav nav--top" aria-label="Main">
              {NAV.map(n => (
                <a key={n.id} href={n.id === 'sanctuary' ? '#/' : `#/${n.id}`} aria-current={route.section === n.id ? 'page' : undefined}>{n.label}</a>
              ))}
            </nav>
            <div className="topbar__tools">
              <a className="icon-btn" href="#/rhythm" title={notifOn ? `Reminders on${perm === 'granted' ? ' · browser notifications allowed' : ' · in-app only'}` : 'Reminders off'} aria-label={notifOn ? 'Reminders are on. Open Rhythm settings.' : 'Reminders are off. Open Rhythm settings.'}>
                <Icon name={notifOn ? 'bell' : 'bell-off'} />
              </a>
              <a className="icon-btn" href="#/settings" aria-label="Settings and privacy" aria-current={route.section === 'settings' ? 'page' : undefined}><Icon name="settings" /></a>
            </div>
          </header>

          <main id="main" className="main" tabIndex={-1} inert={!!route.activity || undefined}>{page}</main>

          <nav className="nav nav--bottom" aria-label="Main" inert={!!route.activity || undefined}>
            {NAV.map(n => (
              <a key={n.id} href={n.id === 'sanctuary' ? '#/' : `#/${n.id}`} aria-current={route.section === n.id ? 'page' : undefined}>
                <Icon name={n.icon} />
                <span>{n.label}</span>
              </a>
            ))}
          </nav>

          {route.activity && <ActivityRunner id={route.activity} params={route.params} />}
          <ReminderHost />
        </>
      )}

      {ritual && <EntryRitual onDone={enter} reducedMotion={reduced} />}
    </div>
  );
}

export { go, updatePrefs };
