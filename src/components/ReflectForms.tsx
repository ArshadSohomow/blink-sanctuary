import { useEffect, useState } from 'react';
import type { Mood } from '../types';
import { JOURNAL_PROMPTS, MOODS } from '../content/content';
import { addJournal, addMood } from '../state/store';

export function MoodGlyph({ mood, size = 22 }: { mood: Mood; size?: number }) {
  const m = MOODS.find(x => x.id === mood)!;
  return (
    <svg width={size} height={size * 0.75} viewBox="0 0 40 30" aria-hidden="true" className="moodglyph">
      <path d="M6 22c-3-5 2-13 13-14 11-1 18 5 16 12-2 6-9 8-16 7C11 27 8 26 6 22Z" fill={m.tone} />
      <path d="M12 12c3-2 7-3 11-2" stroke="#fff" strokeOpacity=".35" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function MoodPicker({ onSaved, compact }: { onSaved?: (mood: Mood, note?: string) => void; compact?: boolean }) {
  const [mood, setMood] = useState<Mood | null>(null);
  const [note, setNote] = useState('');
  const save = () => { if (!mood) return; addMood(mood, note); onSaved?.(mood, note); setMood(null); setNote(''); };
  return (
    <div className={`moodpicker ${compact ? 'moodpicker--compact' : ''}`}>
      <div className="moods" role="radiogroup" aria-label="How are you feeling?">
        {MOODS.map(m => (
          <button key={m.id} role="radio" aria-checked={mood === m.id} className={`mood ${mood === m.id ? 'on' : ''}`} onClick={() => setMood(m.id)}>
            <MoodGlyph mood={m.id} />
            <span>{m.label}</span>
          </button>
        ))}
      </div>
      {mood && (
        <form className="moodpicker__note" onSubmit={e => { e.preventDefault(); save(); }}>
          <label className="label" htmlFor="mood-note">A short note <span className="muted">(optional)</span></label>
          <input id="mood-note" className="field" value={note} onChange={e => setNote(e.target.value)} maxLength={140} placeholder="What’s behind it, if you’d like to say" />
          <button className="btn" type="submit">Save mood</button>
        </form>
      )}
    </div>
  );
}

const DRAFT = 'blink.journal.draft';

export function JournalEditor({ onSaved, initialPrompt }: { onSaved?: (text: string) => void; initialPrompt?: string }) {
  const [promptIdx, setPromptIdx] = useState(() => initialPrompt ? -1 : Math.floor(Math.random() * JOURNAL_PROMPTS.length));
  const [usePrompt, setUsePrompt] = useState(true);
  const [text, setText] = useState(() => { try { return localStorage.getItem(DRAFT) ?? ''; } catch { return ''; } });
  const [mood, setMood] = useState<Mood | undefined>();
  const [error, setError] = useState('');
  const prompt = promptIdx === -1 ? initialPrompt! : JOURNAL_PROMPTS[promptIdx];

  useEffect(() => { try { text ? localStorage.setItem(DRAFT, text) : localStorage.removeItem(DRAFT); } catch { /* */ } }, [text]);

  const save = () => {
    if (!text.trim()) { setError('Write a few words first — even one line is enough.'); return; }
    addJournal({ text: text.trim(), prompt: usePrompt ? prompt : undefined, mood, source: 'journal' });
    onSaved?.(text.trim());
    setText(''); setMood(undefined); setError('');
    try { localStorage.removeItem(DRAFT); } catch { /* */ }
  };

  return (
    <form className="journal-editor" onSubmit={e => { e.preventDefault(); save(); }}>
      <div className="journal-editor__prompt">
        {usePrompt ? <p className="serif-lg" id="jprompt">{prompt}</p> : <p className="serif-lg" id="jprompt">Free writing</p>}
        <div className="row row--tight">
          {usePrompt && <button type="button" className="btn btn--quiet btn--small" onClick={() => setPromptIdx(i => ((i < 0 ? 0 : i) + 1) % JOURNAL_PROMPTS.length)}>Another prompt</button>}
          <button type="button" className="btn btn--quiet btn--small" onClick={() => setUsePrompt(!usePrompt)}>{usePrompt ? 'Write freely instead' : 'Use a prompt'}</button>
        </div>
      </div>
      <textarea className="field paper" value={text} onChange={e => { setText(e.target.value); if (error) setError(''); }} aria-labelledby="jprompt" rows={7} placeholder="Start anywhere." aria-invalid={!!error} aria-describedby={error ? 'jerr' : undefined} />
      {error && <p className="error" id="jerr" role="alert">{error}</p>}
      <div className="journal-editor__mood">
        <span className="label">Mood with this entry <span className="muted">(optional)</span></span>
        <div className="chips">
          {MOODS.map(m => <button type="button" key={m.id} className={`chip ${mood === m.id ? 'on' : ''}`} aria-pressed={mood === m.id} onClick={() => setMood(mood === m.id ? undefined : m.id)}><MoodGlyph mood={m.id} size={16} /> {m.label}</button>)}
        </div>
      </div>
      <div className="row">
        <button className="btn" type="submit">Save entry</button>
        <span className="muted small">Private. Stored only in this browser. Drafts save as you type.</span>
      </div>
    </form>
  );
}
