import { memo, useMemo } from 'react';
import type { Phase } from '../model/time';
import { skyArc } from '../model/time';
import { rng } from '../model/util';

/** Fixed atmospheric backdrop: sky, light, clouds, hills and treeline. Pure CSS/SVG. */
export const Environment = memo(function Environment({ phase, dim }: { phase: Phase; dim?: boolean }) {
  const arc = skyArc();
  const stars = useMemo(() => {
    const r = rng(42);
    return Array.from({ length: 70 }, () => ({ x: r() * 100, y: r() * 55, s: 0.6 + r() * 1.4, d: r() * 6 }));
  }, []);
  const motes = useMemo(() => {
    const r = rng(7);
    return Array.from({ length: 14 }, () => ({ x: r() * 100, y: 45 + r() * 45, d: r() * 12, t: 14 + r() * 14 }));
  }, []);
  // light position on an arc
  const lx = 10 + arc * 80;
  const ly = 27 - Math.sin(arc * Math.PI) * 20;

  return (
    <div className={`env env--${phase} ${dim ? 'env--dim' : ''}`} aria-hidden="true">
      <div className="env__sky env__sky--morning" />
      <div className="env__sky env__sky--day" />
      <div className="env__sky env__sky--dusk" />
      <div className="env__sky env__sky--night" />

      <div className="env__stars">
        {stars.map((s, i) => <i key={i} style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, animationDelay: `${s.d}s` }} />)}
      </div>

      <div className={`env__light ${phase === 'night' ? 'is-moon' : ''}`} style={{ left: `${lx}%`, top: `${ly}%` }} />

      <div className="env__clouds">
        <span className="cloud c1" /><span className="cloud c2" /><span className="cloud c3" />
      </div>

      <svg className="env__land" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMax slice">
        <path className="far" d="M0 560 L120 500 L230 530 L360 455 L470 505 L610 430 L760 500 L880 450 L1010 520 L1150 440 L1290 500 L1440 470 L1440 900 L0 900Z" />
        <path className="mid" d="M0 610 C160 560 300 590 440 570 C600 545 720 600 880 580 C1040 560 1180 590 1300 570 C1380 558 1420 566 1440 570 L1440 900 L0 900Z" />
        <g className="trees">
          {treeline()}
        </g>
        <path className="meadow" d="M0 668 C220 640 420 660 720 650 C1000 640 1220 662 1440 652 L1440 900 L0 900Z" />
        <path className="meadow2" d="M0 760 C300 730 560 750 760 742 C1000 732 1240 756 1440 744 L1440 900 L0 900Z" />
      </svg>

      <div className="env__mist" />
      <div className="env__motes">
        {motes.map((m, i) => <i key={i} style={{ left: `${m.x}%`, top: `${m.y}%`, animationDelay: `-${m.d}s`, animationDuration: `${m.t}s` }} />)}
      </div>
      <div className="env__grain" />
    </div>
  );
});

function treeline() {
  const r = rng(99);
  const out: JSX.Element[] = [];
  let x = -20;
  while (x < 1460) {
    const h = 40 + r() * 70;
    const w = 26 + r() * 30;
    const base = 640 + r() * 18;
    const kind = r();
    if (kind > 0.45) {
      // conifer
      out.push(<path key={x} d={`M${x} ${base} L${x + w / 2} ${base - h} L${x + w} ${base}Z`} />);
    } else {
      // broadleaf
      out.push(<ellipse key={x} cx={x + w / 2} cy={base - h * 0.45} rx={w * 0.75} ry={h * 0.5} />);
    }
    x += w * (0.55 + r() * 0.9) + (r() > 0.8 ? 80 + r() * 160 : 0);
  }
  return out;
}
