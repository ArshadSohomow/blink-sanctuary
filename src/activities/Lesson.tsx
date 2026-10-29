import { useState } from 'react';
import type { ActivityProps } from './ActivityRunner';
import { LESSONS, type Lesson } from '../content/lessons';
import { useStore } from '../state/store';

export function LessonView({ finish }: ActivityProps) {
  const s = useStore();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [page, setPage] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const done = new Set(s.activities.filter(a => a.type === 'lesson').map(a => a.title));

  if (!lesson) {
    return (
      <div className="sheet">
        <h2 id="activity-title" tabIndex={-1}>A small lesson</h2>
        <p className="lead">Pick one. Each takes two or three minutes and ends with a question.</p>
        <ul className="lesson-list">
          {LESSONS.map(l => (
            <li key={l.id}>
              <button className="lesson-pick" onClick={() => { setLesson(l); setPage(0); setChoice(null); }}>
                <span className="eyebrow">{l.subject} · {l.minutes} min{done.has(l.title) ? ' · read before' : ''}</span>
                <span className="serif">{l.title}</span>
              </button>
            </li>
          ))}
        </ul>
        <p className="demo-label">Demonstration content written for this prototype. It is not expert-reviewed teaching material.</p>
      </div>
    );
  }

  const reading = page < lesson.body.length;
  return (
    <div className="sheet lesson">
      <p className="eyebrow">{lesson.subject}</p>
      <h2 id="activity-title" tabIndex={-1}>{lesson.title}</h2>
      {reading ? (
        <>
          <p className="lesson__p">{lesson.body[page]}</p>
          <div className="dots" aria-label={`Part ${page + 1} of ${lesson.body.length}`}>{lesson.body.map((_, i) => <i key={i} className={i <= page ? 'on' : ''} />)}</div>
          <div className="row">
            <button className="btn" onClick={() => setPage(page + 1)}>{page === lesson.body.length - 1 ? 'To the question' : 'Continue'}</button>
            {page > 0 && <button className="btn btn--quiet" onClick={() => setPage(page - 1)}>Back</button>}
          </div>
        </>
      ) : (
        <>
          <p className="puzzle__q serif">{lesson.question}</p>
          <div className="choices" role="group" aria-label="Answers">
            {lesson.options.map((o, i) => (
              <button key={i} className={`choice ${choice !== null && i === lesson.answer ? 'is-right' : ''} ${choice === i && i !== lesson.answer ? 'is-wrong' : ''}`} onClick={() => setChoice(i)} disabled={choice !== null && choice === lesson.answer} aria-pressed={choice === i}>{o}</button>
            ))}
          </div>
          <div aria-live="polite">
            {choice !== null && choice !== lesson.answer && <p className="note note--soft">Not that one — have another think.</p>}
            {choice === lesson.answer && (
              <div className="explain">
                <p className="explain__verdict">Right.</p>
                <p>{lesson.explain}</p>
                <button className="btn" onClick={() => finish({ title: lesson.title, reflection: `Answered: ${lesson.options[lesson.answer]}` })}>Finish</button>
              </div>
            )}
          </div>
          <p className="demo-label">Demonstration content — not expert-reviewed.</p>
        </>
      )}
    </div>
  );
}
