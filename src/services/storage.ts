// Persistence service. The demo stores everything in this browser's localStorage.
// A future account-backed version can implement the same interface against an
// authenticated API (no secrets or tokens are ever kept here).

export interface StorageAdapter {
  load(): unknown | null;
  save(data: unknown): void;
  clear(): void;
}

const KEY = 'blink.sanctuary.v1';

export const localAdapter: StorageAdapter = {
  load() {
    try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
  },
  save(data) {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* storage full or blocked — keep running in memory */ }
  },
  clear() {
    try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  },
};

export function storageAvailable() {
  try { localStorage.setItem('__blink_test', '1'); localStorage.removeItem('__blink_test'); return true; } catch { return false; }
}

export function sessionFlag(key: string, set?: boolean) {
  try {
    if (set) sessionStorage.setItem(key, '1');
    return sessionStorage.getItem(key) === '1';
  } catch { return false; }
}

export function downloadJSON(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
