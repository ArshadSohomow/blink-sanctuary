import { useState } from 'react';
import { getState, resetDemo, setGoals, updatePrefs, useStore } from '../state/store';
import { Seg, Toggle } from '../components/Controls';
import { Onboarding } from '../components/Onboarding';
import { downloadJSON, storageAvailable } from '../services/storage';
import { speechRecognitionSupported, speechSynthesisSupported } from '../services/speech';
import { go } from '../state/router';
import { Icon } from '../components/Icon';
import { dayKey } from '../model/util';

export function Settings() {
  const s = useStore();
  const p = s.prefs;
  const [confirm, setConfirm] = useState(false);
  const [onb, setOnb] = useState(false);
  const [done, setDone] = useState('');
  const canStore = storageAvailable();

  return (
    <div className="page">
      <header className="page__head">
        <h1 tabIndex={-1}>Settings & privacy</h1>
        <p className="page__sub">You’re in control of how Blink looks, moves and remembers.</p>
      </header>

      {!canStore && <p className="note note--warn" role="alert">This browser is blocking local storage (private mode, perhaps). Blink will work, but nothing will be saved when you close the tab.</p>}

      <section className="panel" aria-labelledby="you-h">
        <h2 id="you-h" className="h3">You</h2>
        <label className="label" htmlFor="nick">Name or nickname <span className="muted">(optional)</span></label>
        <input id="nick" className="field" value={p.nickname} onChange={e => updatePrefs({ nickname: e.target.value.slice(0, 30) })} placeholder="Used only for greetings" />
        {s.goals.length > 0 && (
          <>
            <p className="label">What matters to you</p>
            <div className="chips">{s.goals.map(g => <span key={g.id} className="chip chip--static">{g.name}<button className="chip__x" onClick={() => setGoals(s.goals.filter(x => x.id !== g.id))} aria-label={`Remove ${g.name}`}><Icon name="close" size={13} /></button></span>)}</div>
          </>
        )}
        <button className="btn btn--small btn--ghost" onClick={() => setOnb(true)}>{s.onboarding.done ? 'Personalise again' : 'Personalise Blink'}</button>
      </section>

      <section className="panel" aria-labelledby="look-h">
        <h2 id="look-h" className="h3">Appearance & motion</h2>
        <p className="label">Atmosphere</p>
        <Seg label="Atmosphere" value={p.appearance} onChange={v => updatePrefs({ appearance: v })} options={[{ v: 'auto', label: 'Follow the clock' }, { v: 'morning', label: 'Morning' }, { v: 'day', label: 'Day' }, { v: 'dusk', label: 'Dusk' }, { v: 'night', label: 'Night' }]} />
        <p className="label">Motion</p>
        <Seg label="Motion" value={p.motion} onChange={v => updatePrefs({ motion: v })} options={[{ v: 'system', label: 'Match my device' }, { v: 'reduce', label: 'Reduced' }, { v: 'full', label: 'Full' }]} />
        <p className="label">Text size</p>
        <Seg label="Text size" value={p.textScale} onChange={v => updatePrefs({ textScale: v })} options={[{ v: 1, label: 'Standard' }, { v: 1.1, label: 'Larger' }, { v: 1.2, label: 'Largest' }]} />
        <Toggle checked={p.showRitual} onChange={v => updatePrefs({ showRitual: v })} label="Begin with the HOLD ritual" hint="Shown once each time you open Blink." />
        <Toggle checked={p.sound} onChange={v => updatePrefs({ sound: v })} label="Ambient sound" hint="A soft, generated breeze. Never plays unless you turn it on." />
        <Toggle checked={p.speechVoice} onChange={v => updatePrefs({ speechVoice: v })} disabled={!speechSynthesisSupported()} label="Read check-in lines aloud" hint={speechSynthesisSupported() ? 'Uses your browser’s built-in voice.' : 'Not supported in this browser.'} />
      </section>

      <section className="panel" aria-labelledby="priv-h">
        <h2 id="priv-h" className="h3">Privacy</h2>
        <ul className="plain-list">
          <li><b>Stored only in this browser.</b> Your journal, moods, tasks and progress are saved in this browser’s local storage. There’s no account, no server and no analytics in this demo. Data won’t sync between devices and is lost if you clear your browser’s site data.</li>
          <li><b>Microphone.</b> Used only during a check-in call, only after you choose to speak, with a visible “Microphone on” indicator. {speechRecognitionSupported() ? 'Your browser turns speech into text (some browsers use an online speech service to do this).' : 'Voice input isn’t supported in this browser, so typing is used instead.'} Blink doesn’t keep audio. A transcript is saved only if you choose to.</li>
          <li><b>Notifications.</b> Only if you allow them in Rhythm.</li>
          <li><b>Not a diagnosis.</b> Mood tracking is for your own reflection. Blink doesn’t assess your mental health. If you’re struggling, please talk to someone you trust or a health professional.</li>
          <li><b>Fonts.</b> Typefaces are loaded from Google Fonts, which receives a standard web request from your browser.</li>
        </ul>
      </section>

      <section className="panel" aria-labelledby="data-h">
        <h2 id="data-h" className="h3">Your data</h2>
        <div className="row">
          <button className="btn btn--small btn--ghost" onClick={() => { downloadJSON(`blink-data-${dayKey()}.json`, getState()); setDone('Your data has been downloaded as a JSON file.'); }}><Icon name="download" size={16} /> Export my data</button>
          {!confirm ? <button className="btn btn--small btn--quiet" onClick={() => setConfirm(true)}><Icon name="trash" size={16} /> Reset and delete everything</button> : (
            <span className="confirm">Delete all journal entries, moods, tasks and progress from this browser? <button className="btn btn--small btn--danger" onClick={() => { resetDemo(); setConfirm(false); try { sessionStorage.clear(); localStorage.removeItem('blink.journal.draft'); } catch { /* */ } setDone('Everything has been deleted. Blink is fresh again.'); }}>Delete everything</button> <button className="btn btn--small btn--quiet" onClick={() => setConfirm(false)}>Cancel</button></span>
          )}
        </div>
        {done && <p className="note" role="status">{done} <button className="link-btn" onClick={() => go('sanctuary')}>Back to the sanctuary</button></p>}
      </section>

      <section className="panel" aria-labelledby="about-h">
        <h2 id="about-h" className="h3">About this demo</h2>
        <p className="muted small">Blink is an early prototype. To be clear about what’s real and what isn’t:</p>
        <ul className="plain-list small">
          <li>The weather and seasons are visual storytelling, based on your clock — not a weather service.</li>
          <li>The check-in caller uses scripted lines. No AI service is connected.</li>
          <li>Blink can’t measure screen time or see other apps. Any scrolling figure is your own estimate.</li>
          <li>Movement activities trust you — there’s no GPS, camera or step counting.</li>
          <li>Micro-lessons are demonstration content written for this prototype.</li>
          <li>Blink makes no claims about improving attention, intelligence or mental health.</li>
        </ul>
      </section>

      {onb && <Onboarding onClose={() => setOnb(false)} />}
    </div>
  );
}
