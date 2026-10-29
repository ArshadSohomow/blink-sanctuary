import { useEffect, useRef, useState } from 'react';
import type { ActivityProps } from './ActivityRunner';
import { addJournal, addTask, setState, useStore } from '../state/store';
import { listen, speak, speechRecognitionSupported, speechSynthesisSupported, stopSpeaking, type Listener } from '../services/speech';
import { Icon } from '../components/Icon';
import { fmtClock } from '../model/util';
import { go } from '../state/router';

type Stage = 'incoming' | 'declined' | 'asking' | 'answer' | 'listening' | 'review' | 'closing' | 'ended';

const OPENING = 'Hey, just checking in. What are you working on today?';
const CLARIFY = 'Anything else you want to add before we finish?';
const CLOSINGS = [
  'That sounds good. Keep going with that next step. I’ll check in another time. Take care.',
  'That sounds like a good plan. Keep going with that next step. I’ll check in another time. Take care.',
];

export function CheckInCall({ finish }: ActivityProps) {
  const s = useStore();
  const [stage, setStage] = useState<Stage>('incoming');
  const [caller, setCaller] = useState('');
  const [text, setText] = useState('');
  const [interim, setInterim] = useState('');
  const [error, setError] = useState('');
  const [clarified, setClarified] = useState(false);
  const [callStart, setCallStart] = useState(0);
  const [, tick] = useState(0);
  const [saveJournal, setSaveJournal] = useState(false);
  const [saveTask, setSaveTask] = useState(false);
  const [endedAt, setEndedAt] = useState(0);
  const listener = useRef<Listener | null>(null);
  const prefix = useRef('');
  const canListen = speechRecognitionSupported();
  const canSpeak = speechSynthesisSupported() && s.prefs.speechVoice;
  const live = callStart > 0 && stage !== 'ended' && stage !== 'declined';

  useEffect(() => { if (!live) return; const t = setInterval(() => tick(x => x + 1), 1000); return () => clearInterval(t); }, [live]);
  // Never keep listening or speaking after leaving the call.
  useEffect(() => () => { listener.current?.abort(); stopSpeaking(); }, []);

  const say = (line: string, then: Stage) => {
    setCaller(line);
    setStage(line === OPENING || line === CLARIFY ? 'asking' : 'closing');
    if (canSpeak) speak(line, () => setStage(st => (st === 'asking' || st === 'closing') ? then : st));
    else setTimeout(() => setStage(st => (st === 'asking' || st === 'closing') ? then : st), Math.min(2600, 600 + line.length * 28));
  };

  const accept = () => { setCallStart(Date.now()); say(OPENING, 'answer'); };

  const startListening = () => {
    setError(''); setInterim('');
    prefix.current = text ? text + ' ' : '';
    const l = listen({
      onText: (final, inter) => { setText(prefix.current + final); setInterim(inter); },
      onError: msg => { setError(msg); setStage('review'); },
      onEnd: () => { listener.current = null; setInterim(''); setStage(st => st === 'listening' ? 'review' : st); },
    });
    if (!l) { setError('Speech recognition couldn’t start here. You can type instead.'); setStage('review'); return; }
    listener.current = l;
    setStage('listening');
  };
  const stopListening = () => { listener.current?.stop(); listener.current = null; setStage('review'); };

  const send = () => {
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    if (words < 4 && !clarified) { setClarified(true); say(CLARIFY, 'answer'); return; }
    const line = CLOSINGS[text.length % CLOSINGS.length];
    say(line, 'ended');
    setTimeout(() => setEndedAt(Date.now()), 10);
  };

  const hangUp = () => {
    listener.current?.abort(); listener.current = null; stopSpeaking();
    setEndedAt(Date.now());
    setStage('ended');
  };

  const complete = () => {
    const t = text.trim();
    if (t && saveJournal) addJournal({ text: t, prompt: OPENING, source: 'checkin' });
    if (t && saveTask) { const task = addTask({ title: t.length > 70 ? t.slice(0, 70) + '…' : t }); setState(st => ({ ...st, currentTaskId: task.id })); }
    finish({ title: 'Check-in call', durationSec: Math.round(((endedAt || Date.now()) - callStart) / 1000), reflection: t ? undefined : 'Ended without an answer', partial: !t });
  };

  if (stage === 'incoming') return (
    <div className="call call--incoming" role="alertdialog" aria-labelledby="activity-title" aria-describedby="call-desc">
      <div className="call__avatar"><span className="call__rings" aria-hidden="true"><i /><i /><i /></span><span className="call__mark">b</span></div>
      <h2 id="activity-title" tabIndex={-1}>Blink is checking in</h2>
      <p id="call-desc" className="muted">A simulated check-in — not a real person. It asks one question and listens.</p>
      <div className="call__actions">
        <button className="callbtn callbtn--decline" onClick={() => setStage('declined')} aria-label="Decline"><Icon name="phone-off" size={26} /></button>
        <button className="callbtn callbtn--accept" onClick={accept} aria-label="Accept"><Icon name="phone" size={26} /></button>
      </div>
      <div className="call__labels"><span>Decline</span><span>Accept</span></div>
    </div>
  );

  if (stage === 'declined') return (
    <div className="sheet sheet--center">
      <h2 id="activity-title" tabIndex={-1}>No problem.</h2>
      <p className="lead">Another time, perhaps.</p>
      <div className="row row--center"><button className="btn btn--ghost" onClick={() => go('sanctuary')}>Back to the sanctuary</button>
        <button className="btn btn--quiet" onClick={() => go('rhythm')}>Check-in settings</button></div>
    </div>
  );

  if (stage === 'ended') return (
    <div className="sheet">
      <p className="eyebrow">Call ended · {fmtClock((endedAt || Date.now()) - callStart)}</p>
      <h2 id="activity-title" tabIndex={-1}>Thanks for checking in.</h2>
      {text.trim() ? (
        <>
          <p className="label">What you said</p>
          <blockquote className="transcript-quote">{text.trim()}</blockquote>
          <p className="muted small">Nothing has been stored yet. Choose what to keep:</p>
          <label className="check"><input type="checkbox" checked={saveJournal} onChange={e => setSaveJournal(e.target.checked)} /> Save this transcript to my private journal</label>
          <label className="check"><input type="checkbox" checked={saveTask} onChange={e => setSaveTask(e.target.checked)} /> Add it as a task</label>
        </>
      ) : <p className="muted">The call ended before you answered. That’s fine.</p>}
      <button className="btn" onClick={complete}>Done</button>
    </div>
  );

  return (
    <div className="call call--live">
      <div className="call__top">
        <span className="badge">Simulated check-in</span>
        <span className="muted small" aria-label="Call length">{fmtClock(Date.now() - callStart)}</span>
      </div>
      <h2 id="activity-title" tabIndex={-1} className="visually-hidden">Check-in call in progress</h2>
      <div className="call__caller">
        <div className={`call__avatar call__avatar--small ${stage === 'asking' || stage === 'closing' ? 'is-speaking' : ''}`}><span className="call__mark">b</span></div>
        <div>
          <p className="call__line serif-lg" aria-live="polite">{caller}</p>
          <p className="muted xsmall">{canSpeak ? 'Scripted line, read aloud by your browser’s speech voice.' : 'Scripted line — no AI service is connected in this demo.'}</p>
        </div>
      </div>

      {stage === 'answer' && (
        <div className="call__answer">
          {canListen ? (
            <>
              <button className="btn" onClick={startListening}><Icon name="mic" /> Answer by speaking</button>
              <p className="muted small">Your browser will ask to use the microphone. It turns your speech into text (some browsers use an online speech service to do this). Blink doesn’t record audio, and listening stops when you tap “I’m done” or end the call.</p>
            </>
          ) : <p className="muted small">Voice answers aren’t supported in this browser, so you can type instead.</p>}
          <button className={`btn ${canListen ? 'btn--ghost' : ''}`} onClick={() => setStage('review')}>Type instead</button>
        </div>
      )}

      {stage === 'listening' && (
        <div className="call__answer">
          <p className="mic-live" role="status"><span className="mic-dot" aria-hidden="true" /> Microphone on — listening</p>
          <div className="transcript" aria-live="polite">{text}{interim && <span className="muted"> {interim}</span>}{!text && !interim && <span className="muted">Speak naturally. Take your time.</span>}</div>
          <div className="row">
            <button className="btn" onClick={stopListening}>I’m done</button>
            <button className="btn btn--quiet" onClick={() => { listener.current?.abort(); setText(prefix.current.trim()); setTimeout(startListening, 250); }}>Start that again</button>
          </div>
        </div>
      )}

      {stage === 'review' && (
        <form className="call__answer" onSubmit={e => { e.preventDefault(); if (text.trim()) send(); }}>
          {error && <p className="note note--soft" role="alert">{error}</p>}
          <label className="label" htmlFor="ans">Your answer {canListen && text ? <span className="muted">(edit if anything was misheard)</span> : ''}</label>
          <textarea id="ans" className="field" rows={3} value={text} onChange={e => setText(e.target.value)} placeholder="e.g. I’m working on my portfolio — the booking flow is next." autoFocus />
          <div className="row">
            <button className="btn" type="submit" disabled={!text.trim()}>Send</button>
            {canListen && <button className="btn btn--quiet" type="button" onClick={startListening}><Icon name="mic" /> {text ? 'Add by speaking' : 'Speak instead'}</button>}
          </div>
        </form>
      )}

      <div className="call__actions call__actions--end">
        <button className="callbtn callbtn--decline" onClick={hangUp} aria-label="End call"><Icon name="phone-off" size={24} /></button>
      </div>
      <div className="call__labels call__labels--one"><span>End call</span></div>
    </div>
  );
}
