import { useEffect, useMemo, useRef, useState } from 'react';
import type { StackState } from '../types';
import { layoutStack, TEXTURE_TONES } from '../model/geometry';
import { effectiveStability } from '../model/stack';
import { rng } from '../model/util';

const animated = new Set<string>();

interface Props {
  stack: StackState;
  gust?: boolean;
  className?: string;
  /** compact preview (no ground shadow, no animation) */
  still?: boolean;
  label?: string;
  /** draw the stone ledge, grass and plants around the base */
  ground?: boolean;
}

/**
 * The living stone stack. Pure SVG; all motion is CSS (sway, settle, drop-in),
 * driven by custom properties derived from the stack model.
 */
export function RockStack({ stack, gust, className = '', still, label, ground }: Props) {
  const { placed, height } = useMemo(() => layoutStack(stack.stones), [stack.stones]);
  const stability = effectiveStability(stack);
  const lean = (1 - stability) * 7 * (stack.stones[0] ? (rng(stack.stones[0].seed)() > 0.5 ? 1 : -1) : 1);
  const sway = 0.25 + (1 - stability) * 1.6 + (gust ? 1.6 : 0);

  // Drop-in animation for a freshly added stone (once per stone, only if recent).
  const [fresh, setFresh] = useState<string | null>(null);
  useEffect(() => {
    const id = stack.lastStoneEventId;
    const s = stack.stones.find(x => x.id === id);
    if (!still && id && s && !animated.has(id) && Date.now() - s.addedAt < 5 * 60_000) {
      animated.add(id);
      setFresh(id);
      const t = setTimeout(() => setFresh(null), 2600);
      return () => clearTimeout(t);
    }
  }, [stack.lastStoneEventId, still]);

  // A gentle settle when stability improves.
  const [settling, setSettling] = useState(false);
  const lastSettle = useRef(stack.lastSettleAt);
  useEffect(() => {
    if (!still && stack.lastSettleAt && stack.lastSettleAt !== lastSettle.current && Date.now() - stack.lastSettleAt < 5 * 60_000) {
      setSettling(true);
      const t = setTimeout(() => setSettling(false), 2200);
      lastSettle.current = stack.lastSettleAt;
      return () => clearTimeout(t);
    }
    lastSettle.current = stack.lastSettleAt;
  }, [stack.lastSettleAt, still]);

  const pad = ground ? 78 : 26;
  const narrow = typeof window !== 'undefined' && window.innerWidth < 600;
  const vbW = ground ? (narrow ? 430 : 580) : 400;
  const vbH = Math.max(ground ? (narrow ? 330 : 380) : 320, height + pad + 40);
  const baseY = vbH - pad;

  const mossCount = stack.details.moss;

  return (
    <svg
      className={`rockstack ${className} ${gust ? 'is-gust' : ''} ${settling ? 'is-settling' : ''}`}
      viewBox={`0 0 ${vbW} ${vbH}`}
      preserveAspectRatio="xMidYMax meet"
      role="img"
      aria-label={label ?? `A balanced stack of ${stack.stones.length} stones`}
      style={{ ['--lean' as any]: `${lean.toFixed(2)}deg`, ['--sway' as any]: `${sway.toFixed(2)}deg` }}
    >
      <defs>
        {placed.map(p => {
          const tones = TEXTURE_TONES[p.stone.texture] ?? TEXTURE_TONES.river;
          const [hi, body, shade] = tones[p.stone.seed % tones.length];
          return (
            <g key={p.stone.id}>
              <radialGradient id={`g-${p.stone.id}`} cx="0.36" cy="0.28" r="0.85">
                <stop offset="0" stopColor={hi} />
                <stop offset="0.55" stopColor={body} />
                <stop offset="1" stopColor={shade} />
              </radialGradient>
              <clipPath id={`c-${p.stone.id}`}><path d={p.path} /></clipPath>
            </g>
          );
        })}
        <radialGradient id="contact" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#1d221d" stopOpacity="0.55" />
          <stop offset="1" stopColor="#1d221d" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="rimlight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.28" />
          <stop offset="0.35" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {ground && <Ground stack={stack} cx={vbW / 2} baseY={baseY} />}
      {!still && <ellipse cx={vbW / 2} cy={baseY + 4} rx={placed[0] ? placed[0].w * 0.62 : 80} ry="9" fill="url(#contact)" />}

      <g className="rockstack__pivot" style={{ transformOrigin: `${vbW / 2}px ${baseY}px` }}>
        <g transform={`translate(${vbW / 2} ${baseY})`}>
          {placed.map((p, i) => {
            const isFresh = fresh === p.stone.id;
            const mossy = i < mossCount && i > 0;
            const r = rng(p.stone.seed + 3);
            return (
              <g key={p.stone.id} className={`stone ${isFresh ? 'stone--fresh' : ''}`} style={{ ['--i' as any]: i }}>
                {/* contact shadow on the stone below */}
                {i > 0 && <ellipse cx={p.cx} cy={p.bottomY - 1} rx={p.w * 0.34} ry={Math.max(3, p.h * 0.1)} fill="url(#contact)" />}
                <g transform={`translate(${p.cx.toFixed(1)} ${p.cy.toFixed(1)}) rotate(${p.rot.toFixed(2)})`}>
                  <path d={p.path} fill={`url(#g-${p.stone.id})`} />
                  <g clipPath={`url(#c-${p.stone.id})`}>
                    {p.speckles.map((s, k) => <circle key={k} cx={s.x} cy={s.y} r={s.r} fill={k % 3 ? '#2a2d28' : '#f4efe4'} opacity={s.o} />)}
                    {/* soft underside shading */}
                    <ellipse cx={0} cy={p.h * 0.42} rx={p.w * 0.55} ry={p.h * 0.32} fill="#1b1e1a" opacity="0.22" />
                    {/* faint mineral band on some stones */}
                    {r() > 0.6 && <path d={`M${-p.w / 2},${(r() - 0.5) * p.h * 0.4} Q0,${(r() - 0.5) * p.h * 0.6} ${p.w / 2},${(r() - 0.5) * p.h * 0.4}`} stroke="#efe9dc" strokeOpacity="0.18" strokeWidth={1.5 + r() * 2} fill="none" />}
                    {mossy && (
                      <g className="moss">
                        {Array.from({ length: 7 }, (_, k) => (
                          <ellipse key={k} cx={(r() - 0.5) * p.w * 0.7} cy={-p.h * 0.36 + r() * 6} rx={6 + r() * 10} ry={3 + r() * 3} fill={k % 2 ? '#6f8558' : '#58704a'} opacity="0.85" />
                        ))}
                      </g>
                    )}
                    <path d={p.path} fill="url(#rimlight)" />
                  </g>
                  <path d={p.path} fill="none" stroke="#1d201c" strokeOpacity="0.18" strokeWidth="1" />
                </g>
              </g>
            );
          })}
        </g>
      </g>
    </svg>
  );
}

/** The stone ledge and the slowly growing ecosystem around it. Deterministic from stack details. */
function Ground({ stack, cx, baseY }: { stack: StackState; cx: number; baseY: number }) {
  const r = rng(2024);
  const { grass, flower, sprout } = stack.details;
  const tufts = 8 + grass * 5;
  const sides = (k: number) => {
    const left = k % 2 === 0;
    const spread = 70 + r() * 175;
    return left ? cx - 105 - spread * 0.9 : cx + 105 + spread * 0.9;
  };
  const tuftEls = Array.from({ length: tufts }, (_, k) => {
    const x = sides(k);
    const y = baseY + 22 + r() * 48;
    const blades = 3 + Math.floor(r() * 3);
    const tall = 14 + r() * 16 + grass * 2;
    return (
      <g key={'t' + k} className="tuft" style={{ ['--d' as any]: `${(r() * 4).toFixed(2)}s` }}>
        {Array.from({ length: blades }, (_, b) => {
          const bx = x + (b - blades / 2) * 3;
          const lean = (r() - 0.5) * 14;
          const h = tall * (0.7 + r() * 0.5);
          return <path key={b} className="blade" d={`M${bx - 1.6},${y} Q${bx + lean * 0.4},${y - h * 0.6} ${bx + lean},${y - h} Q${bx + lean * 0.3 + 1},${y - h * 0.5} ${bx + 1.6},${y}Z`} fill={b % 2 ? 'var(--grass-a)' : 'var(--grass-b)'} />;
        })}
      </g>
    );
  });
  const flowerEls = Array.from({ length: flower }, (_, k) => {
    const x = sides(k + 1) + (r() - 0.5) * 20;
    const y = baseY + 30 + r() * 36;
    const h = 18 + r() * 14;
    const col = ['#efe6d6', '#d9b8a6', '#c9cfe0', '#e8d39a'][k % 4];
    return (
      <g key={'f' + k} className="flower" style={{ ['--d' as any]: `${(r() * 3).toFixed(2)}s` }}>
        <path d={`M${x},${y} Q${x + 3},${y - h / 2} ${x + 1},${y - h}`} stroke="var(--grass-b)" strokeWidth="1.4" fill="none" />
        {Array.from({ length: 5 }, (_, p) => {
          const a = (p / 5) * Math.PI * 2;
          return <circle key={p} cx={x + 1 + Math.cos(a) * 3.2} cy={y - h + Math.sin(a) * 3.2} r="2.6" fill={col} />;
        })}
        <circle cx={x + 1} cy={y - h} r="1.8" fill="#c79a4c" />
      </g>
    );
  });
  const sproutEls = Array.from({ length: sprout }, (_, k) => {
    const x = sides(k) + (r() - 0.5) * 30;
    const y = baseY + 26 + r() * 40;
    return (
      <g key={'s' + k} className="sprout">
        <path d={`M${x},${y} L${x},${y - 10}`} stroke="var(--grass-b)" strokeWidth="1.3" />
        <path d={`M${x},${y - 9} q-7,-4 -9,-10 q7,1 9,10Z`} fill="var(--grass-a)" />
        <path d={`M${x},${y - 7} q7,-3 9,-9 q-7,0 -9,9Z`} fill="var(--grass-b)" />
      </g>
    );
  });
  return (
    <g className="ground">
      <defs>
        <radialGradient id="knoll" cx="0.5" cy="0.4" r="0.46">
          <stop offset="0" stopColor="var(--meadow)" />
          <stop offset="0.62" stopColor="var(--meadow2)" />
          <stop offset="1" stopColor="var(--meadow2)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ledge" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--ledge-top)" />
          <stop offset="1" stopColor="var(--ledge-bottom)" />
        </linearGradient>
      </defs>
      <ellipse cx={cx} cy={baseY + 34} rx={cx * 1.02} ry="60" fill="url(#knoll)" />
      <ellipse cx={cx} cy={baseY + 40} rx="250" ry="34" fill="#1d221d" opacity="0.18" />
      <path d={`M${cx - 165},${baseY + 6} C${cx - 150},${baseY - 6} ${cx - 60},${baseY - 4} ${cx},${baseY - 2} C${cx + 70},${baseY - 4} ${cx + 150},${baseY - 8} ${cx + 172},${baseY + 4} C${cx + 182},${baseY + 22} ${cx + 150},${baseY + 40} ${cx + 40},${baseY + 44} C${cx - 60},${baseY + 46} ${cx - 168},${baseY + 40} ${cx - 176},${baseY + 22} Z`} fill="url(#ledge)" />
      <path d={`M${cx - 150},${baseY + 2} C${cx - 60},${baseY - 6} ${cx + 70},${baseY - 7} ${cx + 160},${baseY}`} stroke="#fff" strokeOpacity="0.18" strokeWidth="2" fill="none" />
      {sproutEls}
      {tuftEls}
      {flowerEls}
    </g>
  );
}
