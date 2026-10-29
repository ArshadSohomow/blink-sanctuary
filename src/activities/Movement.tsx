import { useEffect, useState } from 'react';
import type { ActivityProps } from './ActivityRunner';
import { MOVEMENT_RESETS } from '../content/content';
import { fmtClock } from '../model/util';

export function Movement({ finish }: ActivityProps) {
  const [chosen, setChosen] = useState<(typeof MOVEMENT_RESETS)[number] | null>(null);
  const [startedAt, setStartedAt] = useState(0);
  const [, tick] = useState(0);
  useEffect(() => { if (!chosen) return; const t = setInterval(() => tick(x => x + 1), 1000); return () => clearInterval(t); }, [chosen]);

  if (!chosen) return (
    <div className="sheet">
      <h2 id="activity-title" tabIndex={-1}>Step away for a moment</h2>
      <p className="lead">Choose one small, real-world reset. You don’t need to prove anything — just come back and say you did it.</p>
      <ul className="reset-list">
        {MOVEMENT_RESETS.map(r => (
          <li key={r.id}><button className="reset-pick" onClick={() => { setChosen(r); setStartedAt(Date.now()); }}>
            <span className="serif">{r.title}</span><span className="muted small">about {r.mins} min</span>
          </button></li>
        ))}
      </ul>
    </div>
  );
  const away = Date.now() - startedAt;
  return (
    <div className="sheet sheet--center">
      <p className="eyebrow">Off you go</p>
      <h2 id="activity-title" tabIndex={-1}>{chosen.title}</h2>
      <p className="lead">{chosen.detail}</p>
      <p className="muted small" aria-hidden="true">Away for {fmtClock(away)}</p>
      <div className="row row--center">
        <button className="btn" onClick={() => finish({ title: chosen.title, durationSec: Math.round(away / 1000) })}>I’m back — done</button>
        <button className="btn btn--quiet" onClick={() => setChosen(null)}>Choose something else</button>
      </div>
    </div>
  );
}
