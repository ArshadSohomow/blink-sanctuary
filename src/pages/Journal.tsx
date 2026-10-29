import { useState } from 'react';
import { completeActivity, deleteJournal, deleteMood, useStore } from '../state/store';
import { JournalEditor, MoodGlyph, MoodPicker } from '../components/ReflectForms';
import { MOODS } from '../content/content';
import { DAY, dayKey, fmtDate, fmtTime } from '../model/util';
import { CARE_OF, CARE_LABEL } from '../model/stack';
import { Icon } from '../components/Icon';

export function Journal() {
  const s = useStore();
  const [ack, setAck] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [showAllMoods, setShowAllMoods] = useState(false);

  const days = Array.from({ length: 14 }, (_, i) => {
    const t = Date.now() - (13 - i) * DAY;
    const k = dayKey(t);
    const moods = s.moods.filter(m => dayKey(m.at) === k);
    return { k, t, mood: moods[moods.length - 1]?.mood, count: moods.length };
  });
  const moodsDesc = [...s.moods].reverse();
  const entries = [...s.journal].reverse();
  const week = Array.from({ length: 7 }, (_, i) => {
    const t = Date.now() - (6 - i) * DAY;
    const acts = s.activities.filter(a => dayKey(a.completedAt) === dayKey(t));
    return { t, acts };
  });

  return (
    <div className="page">
      <header className="page__head">
        <h1 tabIndex={-1}>Journal</h1>
        <p className="page__sub">Private by default. Everything here stays in this browser.</p>
      </header>

      {ack && <p className="ack" role="status"><Icon name="check" size={18} /> {ack} <button className="link-btn" onClick={() => setAck('')}>OK</button></p>}

      <section className="panel" aria-labelledby="mood-h">
        <h2 id="mood-h" className="h3">How are you feeling?</h2>
        <MoodPicker compact onSaved={() => { const r = completeActivity('mood', 'Mood check'); setAck(`Mood saved. ${r.contribution.note}`); }} />
        <div className="moodhistory" aria-label="Mood over the last 14 days">
          {days.map(d => (
            <div key={d.k} className="moodhistory__day" title={`${fmtDate(d.t)}: ${d.mood ? MOODS.find(m => m.id === d.mood)!.label : 'no mood recorded'}`}>
              {d.mood ? <MoodGlyph mood={d.mood} size={20} /> : <span className="moodhistory__empty" />}
              <span className="moodhistory__label">{new Date(d.t).toLocaleDateString([], { weekday: 'narrow' })}</span>
              <span className="visually-hidden">{fmtDate(d.t)}: {d.mood ? MOODS.find(m => m.id === d.mood)!.label : 'nothing recorded'}</span>
            </div>
          ))}
        </div>
        <p className="muted xsmall">A record for you to notice patterns. It isn’t a diagnosis, and Blink doesn’t draw conclusions from it.</p>
        {moodsDesc.length > 0 && (
          <ul className="moodlist">
            {(showAllMoods ? moodsDesc : moodsDesc.slice(0, 4)).map(m => (
              <li key={m.id}>
                <MoodGlyph mood={m.mood} size={18} />
                <span><b>{MOODS.find(x => x.id === m.mood)!.label}</b>{m.note && <> — {m.note}</>}</span>
                <span className="muted small">{fmtDate(m.at)}, {fmtTime(m.at)}</span>
                <button className="icon-btn" onClick={() => deleteMood(m.id)} aria-label="Delete this mood record"><Icon name="close" size={15} /></button>
              </li>
            ))}
            {moodsDesc.length > 4 && <li><button className="link-btn small" onClick={() => setShowAllMoods(!showAllMoods)}>{showAllMoods ? 'Show fewer' : `Show all ${moodsDesc.length}`}</button></li>}
          </ul>
        )}
      </section>

      <section className="panel" aria-labelledby="write-h">
        <h2 id="write-h" className="h3">Write</h2>
        <JournalEditor onSaved={() => { const r = completeActivity('journal', 'Journal entry'); setAck(`Entry saved privately. ${r.contribution.note}`); }} />
      </section>

      <section className="panel" aria-labelledby="entries-h">
        <h2 id="entries-h" className="h3">Previous entries</h2>
        {entries.length === 0 ? <p className="empty">Your entries will appear here. Only you can see them.</p> : (
          <ul className="entries">
            {entries.map(e => {
              const isOpen = open === e.id;
              return (
                <li key={e.id} className={`entry ${isOpen ? 'is-open' : ''}`}>
                  <button className="entry__head" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : e.id)}>
                    <span className="entry__date">{fmtDate(e.at)} · {fmtTime(e.at)}{e.source === 'checkin' ? ' · from a check-in' : ''}{e.prompt ? ` · ${e.prompt}` : ''}</span>
                    <span className="entry__preview">{e.text.slice(0, 90) + (e.text.length > 90 ? '…' : '')}</span>
                    {e.mood && <MoodGlyph mood={e.mood} size={18} />}
                  </button>
                  {isOpen && (
                    <div className="entry__body">
                      <p className="entry__text">{e.text}</p>
                      {confirm === e.id ? (
                        <p className="confirm">Delete this entry permanently? <button className="btn btn--small btn--danger" onClick={() => { deleteJournal(e.id); setConfirm(null); }}>Delete</button> <button className="btn btn--small btn--quiet" onClick={() => setConfirm(null)}>Keep it</button></p>
                      ) : <button className="btn btn--small btn--quiet" onClick={() => setConfirm(e.id)}><Icon name="trash" size={15} /> Delete</button>}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="panel" aria-labelledby="return-h">
        <h2 id="return-h" className="h3">A record of returning</h2>
        <p className="muted small">The last seven days. Gaps are part of any rhythm — nothing is lost.</p>
        <div className="returning">
          {week.map(({ t, acts }) => (
            <div key={t} className="returning__day">
              <div className="returning__stones" aria-hidden="true">
                {acts.slice(0, 6).map(a => <i key={a.id} className={`pebble pebble--${CARE_OF[a.type]}`} />)}
              </div>
              <span className="returning__label">{new Date(t).toLocaleDateString([], { weekday: 'short' })}</span>
              <span className="visually-hidden">{acts.length ? acts.map(a => CARE_LABEL[CARE_OF[a.type]]).join(', ') : 'a rest day'}</span>
            </div>
          ))}
        </div>
        {s.activities.length > 0 && (
          <details className="history">
            <summary>Recent activities</summary>
            <ul>
              {[...s.activities].reverse().slice(0, 12).map(a => <li key={a.id}><span>{a.title}</span><span className="muted small">{fmtDate(a.completedAt)}, {fmtTime(a.completedAt)}{a.status === 'partial' ? ' · partly' : ''}</span>{a.reflection && <span className="muted small history__ref">{a.reflection}</span>}</li>)}
            </ul>
          </details>
        )}
      </section>
    </div>
  );
}
