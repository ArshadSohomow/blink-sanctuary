import { useCallback, useEffect, useRef, useState } from 'react';

const BEAT_MS = 600;          // one blink: 0.3s expand + 0.3s contract
const TOLERANCE_MS = 180;     // forgiving timing for real hands

type Phase = 'idle' | 'holding' | 'ready' | 'failed' | 'burst';

export function EntryRitual({ onDone, reducedMotion }: { onDone: () => void; reducedMotion: boolean }) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [target, setTarget] = useState(5);
  const [count, setCount] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const startRef = useRef(0);
  const timer = useRef<number>();
  const bubbleRef = useRef<HTMLButtonElement>(null);
  const holdingRef = useRef(false);

  const clear = () => window.clearInterval(timer.current);
  useEffect(() => clear, []);

  const begin = useCallback(() => {
    if (holdingRef.current || phase === 'burst') return;
    holdingRef.current = true;
    const n = 3 + Math.floor(Math.random() * 6); // 3..8
    setTarget(n);
    setCount(0);
    setPhase('holding');
    startRef.current = performance.now();
    clear();
    timer.current = window.setInterval(() => {
      const elapsed = performance.now() - startRef.current;
      const c = Math.min(n, Math.floor((elapsed + TOLERANCE_MS) / BEAT_MS));
      setCount(c);
      if (c >= n) { setPhase('ready'); clear(); }
    }, 50);
  }, [phase]);

  const end = useCallback(() => {
    if (!holdingRef.current) return;
    holdingRef.current = false;
    clear();
    const elapsed = performance.now() - startRef.current;
    const needed = target * BEAT_MS - TOLERANCE_MS;
    if (elapsed >= needed) {
      setPhase('burst');
      setTimeout(() => setLeaving(true), reducedMotion ? 150 : 650);
      setTimeout(onDone, reducedMotion ? 500 : 1500);
    } else {
      setPhase('failed');
      setCount(0);
    }
  }, [target, onDone, reducedMotion]);

  // pointer tilt for the iridescent highlight
  const onMove = (e: React.PointerEvent) => {
    const el = bubbleRef.current; if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--px', `${((e.clientX - r.left) / r.width - 0.5).toFixed(3)}`);
    el.style.setProperty('--py', `${((e.clientY - r.top) / r.height - 0.5).toFixed(3)}`);
  };

  const holding = phase === 'holding' || phase === 'ready';

  return (
    <div className={`ritual ${leaving ? 'ritual--leaving' : ''} ritual--${phase}`} role="dialog" aria-label="The Blink ritual" onPointerMove={onMove}>
      <div className="ritual__veil" />
      <div className="ritual__brand">blink</div>

      <div className="ritual__stage">
        <div className="ritual__instructions" aria-live="polite">
          {holding && (
            <div className="instr">
              <span className="instr__word">Blink</span>
              <span className="instr__num"><b>{target}</b> times</span>
              <span className="instr__then">{phase === 'ready' ? 'now release' : 'then release'}</span>
            </div>
          )}
          {phase === 'failed' && <p className="instr__soft">Take a breath. Let’s try that a little slower.</p>}
          {phase === 'idle' && <p className="instr__soft instr__soft--hint">Press and hold</p>}
        </div>

        <button
          ref={bubbleRef}
          className={`bubble ${holding ? 'is-holding' : ''} ${phase === 'ready' ? 'is-ready' : ''} ${phase === 'burst' ? 'is-burst' : ''}`}
          style={{ ['--beat' as any]: `${BEAT_MS}ms`, ['--beats' as any]: target }}
          aria-label={holding ? `Holding. Blink ${target} times, then release. ${count} of ${target}.` : 'Hold. Press and hold this bubble, or hold the space bar.'}
          onPointerDown={e => { e.currentTarget.setPointerCapture?.(e.pointerId); begin(); }}
          onPointerUp={end}
          onPointerCancel={end}
          onContextMenu={e => e.preventDefault()}
          onKeyDown={e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); begin(); } }}
          onKeyUp={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); end(); } }}
        >
          <span className="bubble__body" key={holding ? 'h' + target : 'i'} />
          <span className="bubble__iris" />
          <span className="bubble__shine" />
          <span className="bubble__label">HOLD</span>
          {phase === 'burst' && (
            <span className="burst" aria-hidden="true">
              {Array.from({ length: 16 }, (_, i) => <i key={i} style={{ ['--a' as any]: `${(i / 16) * 360 + Math.random() * 12}deg`, ['--d' as any]: `${70 + Math.random() * 90}px` }} />)}
              <b className="burst__ring" />
            </span>
          )}
        </button>

        <div className="ritual__progress" aria-hidden="true">
          {holding && Array.from({ length: target }, (_, i) => <i key={i} className={i < count ? 'on' : ''} />)}
        </div>
      </div>

      <div className="ritual__foot">
        <p className="ritual__note">A small ritual: follow the rhythm and blink along if you like. Nothing is measured, and no camera is used.</p>
        <button className="link-btn" onClick={() => { setLeaving(true); setTimeout(onDone, 400); }}>Skip the ritual</button>
      </div>
    </div>
  );
}
