import { CATALOGUE, type CatalogueItem, type LibraryCategory } from '../content/catalogue';
import { useStore } from '../state/store';
import { startActivity } from '../state/router';
import { effectiveStability, varietyLast7, CARE_LABEL } from '../model/stack';
import { phaseFor } from '../model/time';
import { dayKey } from '../model/util';
import { Icon } from '../components/Icon';
import type { AppState } from '../types';

const ORDER: LibraryCategory[] = ['Breathing & grounding', 'Thinking', 'Learning', 'Reflection', 'Focus & intention', 'Real-world resets', 'Sanctuary care', 'Pause & talk'];

function suggestions(s: AppState): { item: CatalogueItem; why: string }[] {
  const out: { item: CatalogueItem; why: string }[] = [];
  const get = (id: string) => CATALOGUE.find(c => c.id === id)!;
  const today = new Set(s.activities.filter(a => dayKey(a.completedAt) === dayKey()).map(a => a.type));
  const stab = effectiveStability(s.stack);
  const phase = phaseFor();
  if (stab < 0.72) out.push({ item: get('breath-exhale'), why: 'To steady things a little' });
  if (phase === 'morning' && !today.has('intention')) out.push({ item: get('intention'), why: 'A good way to start the day' });
  if (phase === 'day' && !today.has('movement')) out.push({ item: get('movement'), why: 'A break from the screen' });
  if ((phase === 'dusk' || phase === 'night') && !today.has('journal')) out.push({ item: get('journal'), why: 'Let the day settle' });
  if (!today.has('puzzle')) out.push({ item: get(['puzzle-logic', 'puzzle-sequence', 'puzzle-links', 'puzzle-memory'][new Date().getDate() % 4]), why: 'Something to think about' });
  if (s.tasks.some(t => t.status !== 'done') && !s.focusRun) out.push({ item: get('focus'), why: 'Your tasks are waiting, gently' });
  out.push({ item: get('lesson'), why: 'Learn one small thing' });
  return out.filter((x, i, a) => a.findIndex(y => y.item.id === x.item.id) === i).slice(0, 3);
}

export function Activities() {
  const s = useStore();
  const sugg = suggestions(s);
  const variety = varietyLast7(s.activities);
  const thinking = s.activities.filter(a => a.type === 'puzzle').length;
  return (
    <div className="page">
      <header className="page__head">
        <h1 tabIndex={-1}>Activities</h1>
        <p className="page__sub">Short, useful things to do — then get back to your life.</p>
      </header>

      <section className="panel panel--feature" aria-labelledby="sugg">
        <h2 id="sugg" className="eyebrow">Suggested for now</h2>
        <ul className="sugg">
          {sugg.map(({ item, why }) => (
            <li key={item.id}>
              <button className="sugg__item" onClick={() => startActivity(item.id)}>
                <span className="muted small">{why}</span>
                <span className="serif sugg__title">{item.title}</span>
                <span className="muted small">{item.mins}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {ORDER.map(cat => {
        const items = CATALOGUE.filter(c => c.category === cat);
        return (
          <section className="lib" key={cat} aria-labelledby={`cat-${cat}`}>
            <h2 className="lib__title" id={`cat-${cat}`}>{cat}</h2>
            <ul className="lib__list">
              {items.map(item => (
                <li key={item.id}>
                  <button className="lib__item" onClick={() => startActivity(item.id)}>
                    <span className="lib__name">{item.title}</span>
                    <span className="lib__blurb">{item.blurb}</span>
                    <span className="lib__mins">{item.mins}</span>
                    <Icon name="arrow" size={18} className="lib__arrow" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <section className="panel quiet-stats" aria-label="Your practice">
        <p className="muted small">This week you’ve made room for: {variety.size ? [...variety].map(k => CARE_LABEL[k].toLowerCase()).join(', ') : 'nothing yet — and that’s fine'}.{thinking ? ` ${thinking} thinking exercise${thinking === 1 ? '' : 's'} so far.` : ''} There’s no need to do every kind.</p>
      </section>
    </div>
  );
}
