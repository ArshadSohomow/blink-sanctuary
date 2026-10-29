import type { ActivityProps } from './ActivityRunner';
import { JournalEditor, MoodPicker } from '../components/ReflectForms';
import { MOODS } from '../content/content';

export function JournalActivity({ finish, params }: ActivityProps) {
  const prompt = params.get('prompt') ?? undefined;
  return (
    <div className="sheet">
      <h2 id="activity-title" tabIndex={-1}>Write it down</h2>
      <JournalEditor initialPrompt={prompt} onSaved={text => finish({ title: 'Journal entry', reflection: text.length > 80 ? text.slice(0, 80) + '…' : text, nextHint: 'Your entry is saved privately. You can read it again in Journal.' })} />
    </div>
  );
}

export function MoodActivity({ finish }: ActivityProps) {
  return (
    <div className="sheet">
      <h2 id="activity-title" tabIndex={-1}>How are you feeling?</h2>
      <p className="muted">Choose whatever is closest. There are no right answers, and nothing here is a diagnosis.</p>
      <MoodPicker onSaved={(m, note) => finish({ title: 'Mood check', reflection: `${MOODS.find(x => x.id === m)!.label}${note ? ' — ' + note : ''}`, nextHint: m === 'overwhelmed' || m === 'sad' || m === 'frustrated' ? 'Thank you for noticing. If it would help, a slow breathing exercise or a short walk might be a kind next step.' : undefined })} />
    </div>
  );
}
