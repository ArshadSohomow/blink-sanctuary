import { useEffect, useRef, useState } from 'react';
import type { ActivityProps } from './ActivityRunner';
import { fmtClock } from '../model/util';
import { startActivity } from '../state/router';

type Step = { label: string; secs: number; scale: number };

const PATTERNS: Record<string, { name: string; intro: string; steps: Step[] }> = {
  'breath-slow': { name: 'Slow breathing', intro: 'Breathe in gently through your nose for about four seconds, then out for about six. Let it be easy — there’s nothing to hold.', steps: [{ label: 'Breathe in', secs: 4, scale: 1 }, { label: 'Breathe out', secs: 6, scale: 0.55 }] },
  'breath-box': { name: 'Gentle box breathing', intro: 'In for four, a soft pause, out for four, a soft pause. The pauses are short and optional — if pausing feels uncomfortable, simply keep breathing.', steps: [{ label: 'Breathe in', secs: 4, scale: 1 }, { label: 'Soft pause, if comfortable', secs: 2, scale: 1 }, { label: 'Breathe out', secs: 4, scale: 0.55 }, { label: 'Soft pause, if comfortable', secs: 2, scale: 0.55 }] },
  'breath-exhale': { name: 'Extended exhale', intro: 'In for about four seconds, then a long, unhurried breath out for about eight. If eight feels like too much, let the circle go on without you and breathe comfortably.', steps: [{ label: 'Breathe in', secs: 4, scale: 1 }, { label: 'Breathe out slowly', secs: 8, scale: 0.55 }] },
  'visual-rhythm': { name: 'Follow the light', intro: 'No breathing instructions. Let your eyes follow the slow light as it drifts, and breathe however feels natural.', steps: [{ label: 'Follow the light', secs: 6, scale: 1 }, { label: 'Follow the light', secs: 6, scale: 1 }] },
};

const DURATIONS = [1, 2, 3, 5];

export function Breathing({ item, params, finish }: ActivityProps) {
  const pattern = PATTERNS[item.id] ?? PATTERNS['breath-slow'];
  const quick = params.get('quick') === '1';
  const [mins, setMins] = useState(quick ? 1 : 2);
  const [running, setRunning] = useState(quick);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(0);
  const pausedTotal = useRef(0);
  const pausedAt = useRef(0);
  const visual = item.id === 'visual-rhythm';

  useEffect(() => {
    if (!running) return;
    startRef.current = performance.now();
    pausedTotal.current = 0;
    const t = setInterval(() => {
      if (pausedAt.current) return;
      setElapsed((performance.now() - startRef.current - pausedTotal.current) / 1000);
    }, 100);
    return () => clearInterval(t);
  }, [running]);

  const cycle = pattern.steps.reduce((s, x) => s + x.secs, 0);
  const total = Math.max(cycle, Math.round((mins * 60) / cycle) * cycle);
  useEffect(() => {
    if (running && elapsed >= total) finish({ title: pattern.name, durationSec: Math.round(total) });
  }, [elapsed, running]);

  // current step
  let tIn = elapsed % cycle, idx = 0;
  while (idx < pattern.steps.length && tIn >= pattern.steps[idx].secs) { tIn -= pattern.steps[idx].secs; idx++; }
  const step = pattern.steps[Math.min(idx, pattern.steps.length - 1)];
  const remainInStep = Math.ceil(step.secs - tIn);

  const togglePause = () => {
    if (paused) { pausedTotal.current += performance.now() - pausedAt.current; pausedAt.current = 0; setPaused(false); }
    else { pausedAt.current = performance.now(); setPaused(true); }
  };

  if (!running) {
    return (
      <div className="sheet">
        <h2 id="activity-title" tabIndex={-1}>{pattern.name}</h2>
        <p className="lead">{pattern.intro}</p>
        <fieldset className="seg-field">
          <legend>How long?</legend>
          <div className="seg" role="radiogroup">
            {DURATIONS.map(d => (
              <button key={d} role="radio" aria-checked={mins === d} className={mins === d ? 'on' : ''} onClick={() => setMins(d)}>{d} min</button>
            ))}
          </div>
        </fieldset>
        <div className="row">
          <button className="btn" onClick={() => setRunning(true)}>Begin</button>
        </div>
        {!visual && (
          <p className="muted small">Breath-focused exercises aren’t for everyone. <button className="link-btn" onClick={() => startActivity('visual-rhythm')}>Try “Follow the light” instead</button> or <button className="link-btn" onClick={() => startActivity('grounding')}>five-senses grounding</button>.</p>
        )}
      </div>
    );
  }

  const stepKey = Math.floor(elapsed / cycle) * 10 + idx;
  return (
    <div className="sheet sheet--center breathe">
      <h2 id="activity-title" className="visually-hidden" tabIndex={-1}>{pattern.name}</h2>
      <div className={`breathe__stage ${paused ? 'is-paused' : ''}`}>
        {visual ? (
          <div className="drift"><span className="drift__light" style={{ animationPlayState: paused ? 'paused' : 'running' }} /></div>
        ) : (
          <div className="breathe__circle" style={{ transform: `scale(${paused ? 0.78 : elapsed < 0.15 ? 0.55 : step.scale})`, transitionDuration: `${step.secs}s` }} key={'c'}>
            <span className="breathe__ring" />
          </div>
        )}
        <p className="breathe__label" aria-live="polite" key={stepKey}>{paused ? 'Paused' : step.label}</p>
        {!visual && !paused && <p className="breathe__count" aria-hidden="true">{remainInStep}</p>}
      </div>
      <p className="muted small">{fmtClock((total - elapsed) * 1000)} remaining</p>
      <div className="row row--center">
        <button className="btn btn--ghost" onClick={togglePause}>{paused ? 'Resume' : 'Pause'}</button>
        <button className="btn btn--quiet" onClick={() => finish({ title: pattern.name, durationSec: Math.round(elapsed), partial: true })}>Finish here</button>
      </div>
    </div>
  );
}
