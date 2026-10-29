import { useEffect, useRef, useState } from 'react';
import type { ActivityRecord, ActivityType } from '../types';
import { byId, type CatalogueItem } from '../content/catalogue';
import { completeActivity, useStore } from '../state/store';
import { closeActivity, go, startActivity } from '../state/router';
import { Icon } from '../components/Icon';
import { RockStack } from '../components/RockStack';
import { Breathing } from './Breathing';
import { Grounding, BodyCheck } from './Grounding';
import { SequencePuzzleView, LogicPuzzleView, LinkPuzzleView, MemoryPuzzle, ArithmeticPuzzle } from './Puzzles';
import { LessonView } from './Lesson';
import { JournalActivity, MoodActivity } from './Reflect';
import { Movement } from './Movement';
import { CareBalance, CareGarden, CareTexture, CareObserve } from './Care';
import { AntiScroll } from './AntiScroll';
import { CheckInCall } from './CheckInCall';
import { Intention } from './Intention';
import { FocusFlow } from './FocusFlow';

export interface FinishOpts { title?: string; durationSec?: number; reflection?: string; partial?: boolean; type?: ActivityType; startedAt?: number; nextHint?: string }
export interface ActivityProps { item: CatalogueItem; params: URLSearchParams; finish: (o?: FinishOpts) => void; exit: () => void }

const VIEWS: Record<string, (p: ActivityProps) => JSX.Element> = {
  'breath-slow': Breathing, 'breath-box': Breathing, 'breath-exhale': Breathing, 'visual-rhythm': Breathing,
  grounding: Grounding, 'body-check': BodyCheck,
  'puzzle-sequence': SequencePuzzleView, 'puzzle-logic': LogicPuzzleView, 'puzzle-links': LinkPuzzleView,
  'puzzle-memory': MemoryPuzzle, 'puzzle-arith': ArithmeticPuzzle,
  lesson: LessonView, journal: JournalActivity, mood: MoodActivity, movement: Movement,
  'care-balance': CareBalance, 'care-garden': CareGarden, 'care-texture': CareTexture, 'care-observe': CareObserve,
  antiscroll: AntiScroll, checkin: CheckInCall, intention: Intention, focus: FocusFlow,
};

export function ActivityRunner({ id, params }: { id: string; params: URLSearchParams }) {
  const item = byId(id);
  const [done, setDone] = useState<{ record: ActivityRecord; hint?: string } | null>(null);
  const [leftScreen, setLeftScreen] = useState(false);
  const startedAt = useRef(Date.now());
  const ref = useRef<HTMLDivElement>(null);
  const View = VIEWS[id];

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>('h2')?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !document.querySelector('.call--live')) closeActivity(); };
    window.addEventListener('keydown', onKey);
    document.body.classList.add('has-overlay');
    return () => { window.removeEventListener('keydown', onKey); document.body.classList.remove('has-overlay'); prev?.focus?.(); };
  }, [id]);

  useEffect(() => { setDone(null); setLeftScreen(false); startedAt.current = Date.now(); }, [id, params.toString()]);

  if (!item || !View) {
    return (
      <div className="overlay" role="dialog" aria-modal="true" aria-label="Activity not found" ref={ref}>
        <div className="overlay__inner"><div className="sheet sheet--center">
          <h2 tabIndex={-1}>That activity isn’t here.</h2>
          <p className="muted">It may have been moved. Let’s find another one.</p>
          <button className="btn" onClick={() => go('activities')}>Browse activities</button>
        </div></div>
      </div>
    );
  }

  const finish = (o: FinishOpts = {}) => {
    const record = completeActivity(o.type ?? item.type, o.title ?? item.title, { startedAt: o.startedAt ?? startedAt.current, durationSec: o.durationSec ?? Math.round((Date.now() - startedAt.current) / 1000), reflection: o.reflection, partial: o.partial });
    setDone({ record, hint: o.nextHint });
  };

  return (
    <div className={`overlay overlay--${item.type}`} role="dialog" aria-modal="true" aria-labelledby="activity-title" ref={ref}>
      <div className="overlay__bar">
        <span className="overlay__cat">{item.category}</span>
        <button className="icon-btn" onClick={closeActivity} aria-label={done ? 'Close' : 'Leave this activity'}><Icon name="close" /></button>
      </div>
      <div className="overlay__inner">
        {leftScreen ? <StepAway /> : done ? <Completion record={done.record} hint={done.hint} onLeave={() => setLeftScreen(true)} /> : <View item={item} params={params} finish={finish} exit={closeActivity} />}
      </div>
    </div>
  );
}

function Completion({ record, hint, onLeave }: { record: ActivityRecord; hint?: string; onLeave: () => void }) {
  const s = useStore();
  const task = s.tasks.find(t => t.id === s.currentTaskId && t.status !== 'done') ?? s.tasks.find(t => t.status === 'priority');
  return (
    <div className="sheet sheet--center completion" aria-live="polite">
      <div className="completion__stack"><RockStack stack={s.stack} /></div>
      <h2 id="activity-title" tabIndex={-1}>{record.status === 'partial' ? 'That counts.' : 'Complete.'}</h2>
      <p className="lead">{record.contribution.note}</p>
      {hint && <p className="muted">{hint}</p>}
      <p className="eyebrow">What would you like to do next?</p>
      <div className="next-actions">
        <button className="btn" onClick={() => go('sanctuary')}>See your sanctuary</button>
        {task && <button className="btn btn--ghost" onClick={() => startActivity('focus', { task: task.id })}>Return to: {task.title}</button>}
        <button className="btn btn--ghost" onClick={() => go('activities')}>Choose another activity</button>
        <button className="btn btn--quiet" onClick={onLeave}><Icon name="door" /> Step away from the screen</button>
      </div>
    </div>
  );
}

function StepAway() {
  return (
    <div className="sheet sheet--center stepaway">
      <h2 id="activity-title" tabIndex={-1}>Go and live a little.</h2>
      <p className="lead">Your progress is saved in this browser. You can close this tab — the sanctuary will be here when you come back.</p>
      <p className="muted">Maybe: a glass of water, a window, a few pages of a book.</p>
      <button className="btn btn--ghost" onClick={() => go('sanctuary')}>Back to the sanctuary</button>
    </div>
  );
}
