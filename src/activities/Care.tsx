import { useEffect, useRef, useState } from 'react';
import type { ActivityProps } from './ActivityRunner';
import type { DetailKind, StoneTexture } from '../types';
import { setState, useStore } from '../state/store';
import { go } from '../state/router';
import { RockStack } from '../components/RockStack';
import { balanceWord, effectiveStability } from '../model/stack';
import { dayKey } from '../model/util';
import { TEXTURE_TONES, stonePath } from '../model/geometry';

export function CareBalance({ finish }: ActivityProps) {
  const s = useStore();
  const [progress, setProgress] = useState(0);
  const [holding, setHolding] = useState(false);
  const raf = useRef(0);
  const last = useRef(0);
  const NEED = 4000;

  useEffect(() => {
    if (!holding) return;
    last.current = performance.now();
    const step = (t: number) => {
      const dt = t - last.current; last.current = t;
      setProgress(p => {
        const n = Math.min(1, p + dt / NEED);
        if (n >= 1) setHolding(false);
        return n;
      });
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [holding]);

  useEffect(() => { if (progress >= 1) { const t = setTimeout(() => finish({ title: 'Restored the balance' }), 600); return () => clearTimeout(t); } }, [progress]);

  const stab = effectiveStability(s.stack);
  return (
    <div className="sheet sheet--center care">
      <h2 id="activity-title" tabIndex={-1}>Restore the balance</h2>
      <p className="muted">Currently: {balanceWord(stab).toLowerCase()}. Press and hold to steady the stones by hand. Slowly.</p>
      <div className="care__stack" style={{ ['--steady' as any]: progress }}>
        <RockStack stack={{ ...s.stack, stability: Math.min(1, stab + progress * (1 - stab)), lastMeaningfulAt: Date.now() }} gust={progress < 0.05 && stab < 0.7} still />
      </div>
      <div className="holdbar" aria-hidden="true"><span style={{ width: `${progress * 100}%` }} /></div>
      <div className="row row--center">
        <button className="btn"
          onPointerDown={e => { e.currentTarget.setPointerCapture?.(e.pointerId); setHolding(true); }}
          onPointerUp={() => setHolding(false)} onPointerCancel={() => setHolding(false)}
          onKeyDown={e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); setHolding(true); } }}
          onKeyUp={() => setHolding(false)}
          aria-label={`Hold to steady the stack. ${Math.round(progress * 100)} percent steady.`}>
          {holding ? 'Steadying…' : progress > 0 ? 'Keep holding' : 'Hold to steady'}
        </button>
        <button className="btn btn--quiet" onClick={() => setHolding(true)}>Steady it without holding</button>
      </div>
    </div>
  );
}

const GROW: { k: DetailKind; label: string }[] = [
  { k: 'grass', label: 'Grass around the base' },
  { k: 'flower', label: 'A few small flowers' },
  { k: 'sprout', label: 'New green shoots' },
];

export function CareGarden({ finish }: ActivityProps) {
  const s = useStore();
  const tended = s.stack.gardenTendedOn === dayKey();
  const [stage, setStage] = useState<'choose' | 'water'>('choose');
  const [choice, setChoice] = useState<DetailKind>('flower');
  useEffect(() => {
    if (stage !== 'water') return;
    const t = setTimeout(() => {
      setState(st => ({ ...st, stack: { ...st.stack, gardenTendedOn: dayKey(), details: { ...st.stack.details, [choice]: Math.min(9, st.stack.details[choice] + 1) } } }));
      finish({ title: 'Tended the garden', nextHint: 'Gardens grow slowly. You can tend it again tomorrow.' });
    }, 2600);
    return () => clearTimeout(t);
  }, [stage]);

  if (tended) return (
    <div className="sheet sheet--center">
      <h2 id="activity-title" tabIndex={-1}>The garden has been tended today</h2>
      <p className="lead">It’s growing quietly. Come back tomorrow — or simply enjoy it as it is.</p>
      <button className="btn btn--ghost" onClick={() => go('sanctuary')}>Look at the sanctuary</button>
    </div>
  );
  return (
    <div className="sheet sheet--center">
      <h2 id="activity-title" tabIndex={-1}>Tend the garden</h2>
      {stage === 'choose' ? (
        <>
          <p className="lead">What would you like to encourage around your stones?</p>
          <div className="choices" role="radiogroup">
            {GROW.map(g => <button key={g.k} role="radio" aria-checked={choice === g.k} className={`choice ${choice === g.k ? 'is-chosen' : ''}`} onClick={() => setChoice(g.k)}>{g.label}</button>)}
          </div>
          <button className="btn" onClick={() => setStage('water')}>Water the clearing</button>
        </>
      ) : (
        <div className="watering" aria-live="polite">
          <div className="rain" aria-hidden="true">{Array.from({ length: 24 }, (_, i) => <i key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 8) * 0.18}s` }} />)}</div>
          <p className="serif-lg">Watering…</p>
        </div>
      )}
    </div>
  );
}

const TEXTURES: { k: StoneTexture; name: string; note: string }[] = [
  { k: 'river', name: 'River stone', note: 'Smooth, grey-green, worn by water.' },
  { k: 'granite', name: 'Granite', note: 'Pale and speckled, quietly sturdy.' },
  { k: 'sandstone', name: 'Sandstone', note: 'Warm, layered, sun-coloured.' },
  { k: 'slate', name: 'Slate', note: 'Cool, dark and flat-sided.' },
];

export function CareTexture() {
  const s = useStore();
  const [pick, setPick] = useState<StoneTexture>(s.stack.texture);
  const [all, setAll] = useState(false);
  const [saved, setSaved] = useState(false);
  const save = () => {
    setState(st => ({ ...st, stack: { ...st.stack, texture: pick, stones: all ? st.stack.stones.map(x => ({ ...x, texture: pick })) : st.stack.stones } }));
    setSaved(true);
  };
  return (
    <div className="sheet">
      <h2 id="activity-title" tabIndex={-1}>Choose a stone</h2>
      <p className="muted">Your next stones will be this kind. Purely a matter of taste — it doesn’t change your progress.</p>
      <div className="textures" role="radiogroup" aria-label="Stone type">
        {TEXTURES.map(t => {
          const [hi, body, shade] = TEXTURE_TONES[t.k][0];
          return (
            <button key={t.k} role="radio" aria-checked={pick === t.k} className={`texture ${pick === t.k ? 'on' : ''}`} onClick={() => { setPick(t.k); setSaved(false); }}>
              <svg viewBox="-60 -30 120 60" width="96" height="48" aria-hidden="true">
                <defs><radialGradient id={`tx-${t.k}`} cx=".35" cy=".3" r=".9"><stop offset="0" stopColor={hi} /><stop offset=".55" stopColor={body} /><stop offset="1" stopColor={shade} /></radialGradient></defs>
                <path d={stonePath(t.k.length * 97, 'oval', 100, 46)} fill={`url(#tx-${t.k})`} />
              </svg>
              <span className="serif">{t.name}</span>
              <span className="muted small">{t.note}</span>
            </button>
          );
        })}
      </div>
      <label className="check"><input type="checkbox" checked={all} onChange={e => { setAll(e.target.checked); setSaved(false); }} /> Also change the stones already in my stack</label>
      <div className="row">
        <button className="btn" onClick={save}>Use this stone</button>
        {saved && <span role="status" className="note">Saved. <button className="link-btn" onClick={() => go('sanctuary')}>See the sanctuary</button></span>}
      </div>
    </div>
  );
}

export function CareObserve({ finish }: ActivityProps) {
  const s = useStore();
  const [stage, setStage] = useState<'intro' | 'watch' | 'note'>('intro');
  const [left, setLeft] = useState(30);
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');
  useEffect(() => {
    if (stage !== 'watch') return;
    const t = setInterval(() => setLeft(l => { if (l <= 1) { setStage('note'); return 0; } return l - 1; }), 1000);
    return () => clearInterval(t);
  }, [stage]);
  return (
    <div className="sheet sheet--center">
      <h2 id="activity-title" tabIndex={-1}>Quiet observation</h2>
      {stage === 'intro' && <><p className="lead">For thirty seconds, simply watch. The light, the stones, the grass. Or look away from the screen at something real.</p><button className="btn" onClick={() => setStage('watch')}>Begin</button></>}
      {stage === 'watch' && <>
        <div className="observe"><RockStack stack={s.stack} ground /></div>
        <p className="muted" aria-live="off">{left}s</p>
        <button className="btn btn--quiet" onClick={() => setStage('note')}>I’m ready to note something</button>
      </>}
      {stage === 'note' && (
        <form onSubmit={e => { e.preventDefault(); if (!note.trim()) { setErr('Just one small thing — a colour, a shape, a sound.'); return; } finish({ title: 'Quiet observation', reflection: note.trim() }); }}>
          <label className="label" htmlFor="obs">What is one thing you noticed?</label>
          <input id="obs" className="field" value={note} onChange={e => { setNote(e.target.value); setErr(''); }} maxLength={120} autoFocus />
          {err && <p className="error" role="alert">{err}</p>}
          <button className="btn" type="submit">Finish</button>
        </form>
      )}
    </div>
  );
}
