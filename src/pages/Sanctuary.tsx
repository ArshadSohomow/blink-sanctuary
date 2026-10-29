import { useEffect, useMemo, useState } from 'react';
import { MILESTONES, getState, setState, useStore } from '../state/store';
import { startActivity, go } from '../state/router';
import { RockStack } from '../components/RockStack';
import { Onboarding } from '../components/Onboarding';
import { balanceWord, effectiveStability, growthPhrase, levelFor } from '../model/stack';
import { greeting, resolvePhase } from '../model/time';
import { promptForGoal } from '../content/content';
import { runRemaining } from '../activities/FocusFlow';
import { fmtClock, hashStr, dayKey } from '../model/util';
import { Icon } from '../components/Icon';

export function Sanctuary({ awayDays, justEntered }: { awayDays: number; justEntered: boolean }) {
  const s = useStore();
  const phase = resolvePhase(s.prefs.appearance);
  const g = greeting(phase, s.prefs.nickname || undefined);
  const stability = effectiveStability(s.stack);
  const level = levelFor(s.stack.stones.length);
  const [gust, setGust] = useState(awayDays >= 3);
  const [gustMsg, setGustMsg] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [, tick] = useState(0);

  // Occasional breeze. A gust is a gentle prompt, never a loss.
  useEffect(() => {
    let t: number;
    const schedule = () => {
      t = window.setTimeout(() => {
        if (!document.hidden) {
          setGust(true);
          if (effectiveStability(getState().stack) < 0.72) setGustMsg(true);
          window.setTimeout(() => setGust(false), 7000);
        }
        schedule();
      }, 45_000 + Math.random() * 75_000);
    };
    schedule();
    const first = awayDays >= 3 ? window.setTimeout(() => setGust(false), 8000) : 0;
    return () => { clearTimeout(t); clearTimeout(first); };
  }, []);

  useEffect(() => { if (s.focusRun) { const t = setInterval(() => tick(x => x + 1), 1000); return () => clearInterval(t); } }, [!!s.focusRun]);

  const task = s.tasks.find(t => t.id === s.currentTaskId && t.status !== 'done') ?? s.tasks.find(t => t.status === 'priority');
  const goalPrompt = useMemo(() => {
    if (!s.goals.length) return null;
    const goal = s.goals[hashStr(dayKey()) % s.goals.length];
    return { goal, text: promptForGoal(goal.name) };
  }, [s.goals]);

  const message = (() => {
    if (awayDays >= 3) return 'Welcome back. Let’s find our balance.';
    if (gustMsg) return 'The wind is picking up. Let’s take a moment to steady things.';
    if (stability < 0.58) return 'A little pause might help.';
    if (!s.activities.length) return 'No pressure. Start where you are.';
    return growthPhrase(s.stack.growth);
  })();

  // An understated acknowledgement of the most recent milestone (within the last day).
  const recentMilestone = Object.entries(s.milestones).filter(([, at]) => Date.now() - at < 86_400_000).sort((a, b) => b[1] - a[1])[0];
  const [ackDismissed, setAckDismissed] = useState(false);

  const showInvite = !s.onboarding.done && !s.onboarding.dismissed;
  const weather = gust ? 'a breeze is passing' : phase === 'night' ? 'still night air' : phase === 'dusk' ? 'the light is lowering' : 'calm air';

  return (
    <div className={`sanctuary ${justEntered ? 'is-entering' : ''}`}>
      <section className="sanctuary__greet">
        <h1 tabIndex={-1} className="serif">{g.hello}.</h1>
        <p className="sanctuary__line">{g.line}</p>
      </section>

      <section className="sanctuary__scene" aria-label="Your stone stack">
        <RockStack stack={s.stack} gust={gust} ground label={`Your stack: ${s.stack.stones.length} stones, ${balanceWord(stability).toLowerCase()}. ${level.name}.`} />
        {gust && <div className="leaves" aria-hidden="true">{Array.from({ length: 6 }, (_, i) => <i key={i} style={{ top: `${20 + i * 11}%`, animationDelay: `${i * 0.7}s` }} />)}</div>}
      </section>

      <section className="sanctuary__status" aria-live="polite">
        <p className="sanctuary__message serif">{message}</p>
        <p className="balance"><span className={`balance__dot balance__dot--${stability >= 0.72 ? 'steady' : 'lean'}`} aria-hidden="true" /> {balanceWord(stability)} · {weather} · <span className="balance__level">{level.name}</span></p>
        {gustMsg && <button className="btn btn--small btn--ghost" onClick={() => { setGustMsg(false); startActivity('breath-slow', { quick: '1' }); }}><Icon name="wind" size={16} /> Steady things</button>}
      </section>

      {recentMilestone && !ackDismissed && (
        <p className="milestone" role="status">
          <span className="milestone__mark" aria-hidden="true">◦</span> {MILESTONES[recentMilestone[0]]}. <button className="link-btn" onClick={() => setAckDismissed(true)}>OK</button>
        </p>
      )}

      <section className="sanctuary__actions" aria-label="What would you like to do?">
        <button className="btn btn--primary btn--large" onClick={() => startActivity('breath-slow', { quick: '1' })}>Take a pause</button>
        <div className="sanctuary__secondary">
          <button className="btn btn--ghost" onClick={() => go('activities')}>Choose an activity</button>
          {s.focusRun ? (
            <button className="btn btn--ghost" onClick={() => startActivity('focus')}>Return to focus · {fmtClock(Math.max(0, runRemaining(s.focusRun).remaining))}</button>
          ) : task ? (
            <button className="btn btn--ghost" onClick={() => startActivity('focus', { task: task.id })}>Return to your task</button>
          ) : (
            <button className="btn btn--ghost" onClick={() => startActivity('intention')}>Set an intention</button>
          )}
        </div>
        <button className="link-btn sanctuary__scroll" onClick={() => startActivity('antiscroll', { trigger: 'home' })}>I’m scrolling without intention</button>
      </section>

      {goalPrompt && (
        <section className="nudge">
          <p className="eyebrow">For {goalPrompt.goal.name.toLowerCase()}</p>
          <p className="serif">{goalPrompt.text}</p>
          <button className="btn btn--small btn--quiet" onClick={() => startActivity('intention', { prompt: goalPrompt.text })}>Take this step <Icon name="arrow" size={16} /></button>
        </section>
      )}

      {showInvite && !showOnboarding && (
        <section className="invite">
          <p className="serif">Would you like to tell Blink what matters to you?</p>
          <p className="muted small">A few optional questions. You can skip them and explore straight away.</p>
          <div className="row row--center">
            <button className="btn btn--small" onClick={() => setShowOnboarding(true)}>Personalise</button>
            <button className="btn btn--small btn--quiet" onClick={() => setState(st => ({ ...st, onboarding: { ...st.onboarding, dismissed: true } }))}>Just explore</button>
          </div>
        </section>
      )}
      {showOnboarding && <Onboarding onClose={() => setShowOnboarding(false)} />}
    </div>
  );
}
