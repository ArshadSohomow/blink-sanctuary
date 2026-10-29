import { useEffect, useState } from 'react';

export type Section = 'sanctuary' | 'activities' | 'focus' | 'journal' | 'rhythm' | 'settings';

export interface Route { section: Section; activity?: string; params: URLSearchParams }

function parse(): Route {
  const raw = location.hash.replace(/^#\/?/, '');
  const [path, query = ''] = raw.split('?');
  const parts = path.split('/').filter(Boolean);
  const params = new URLSearchParams(query);
  if (parts[0] === 'do' && parts[1]) {
    const from = (params.get('from') as Section) || 'sanctuary';
    return { section: from, activity: parts[1], params };
  }
  const s = (parts[0] || 'sanctuary') as Section;
  const valid: Section[] = ['sanctuary', 'activities', 'focus', 'journal', 'rhythm', 'settings'];
  return { section: valid.includes(s) ? s : 'sanctuary', params };
}

export function useRoute() {
  const [route, setRoute] = useState(parse);
  useEffect(() => {
    const on = () => setRoute(parse());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export function go(section: Section) { location.hash = section === 'sanctuary' ? '#/' : `#/${section}`; }

export function startActivity(id: string, extra: Record<string, string> = {}) {
  const r = parse();
  const q = new URLSearchParams({ from: r.section, ...extra });
  location.hash = `#/do/${id}?${q}`;
}

export function closeActivity() {
  const r = parse();
  go(r.section);
}
