// src/lib/preferences.ts
// What a person can set for how their saves are shown. Plain TypeScript so it can be tested and used on server and client.
// To add a setting: add it to Prefs, DEFAULT_PREFS and sanitizePrefs. Nothing else (no database change needed).

export type Prefs = {
  sort: 'desc' | 'asc'              // newest first or oldest first
  groupByDate: boolean              // headings like "Today", "Last week"
  columns: 'auto' | 5 | 6 | 9       // grid width on big screens
  minimalist: boolean               // hide card details
}

export const DEFAULT_PREFS: Prefs = { sort: 'desc', groupByDate: false, columns: 'auto', minimalist: false }

const COLUMN_CHOICES = [5, 6, 9] as const

// Whatever is stored (or sent by someone poking at the database) is checked field by field.
// A bad or missing field falls back to its default, unknown fields are dropped.
export function sanitizePrefs(raw: unknown): Prefs {
  const r = (raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}) as Record<string, unknown>
  const cols = typeof r.columns === 'string' && r.columns !== 'auto' ? Number(r.columns) : r.columns
  return {
    sort: r.sort === 'asc' ? 'asc' : 'desc',
    groupByDate: r.groupByDate === true,
    columns: (COLUMN_CHOICES as readonly unknown[]).includes(cols) ? (cols as 5 | 6 | 9) : 'auto',
    minimalist: r.minimalist === true,
  }
}

export function samePrefs(a: Prefs, b: Prefs): boolean {
  return a.sort === b.sort && a.groupByDate === b.groupByDate && a.columns === b.columns && a.minimalist === b.minimalist
}

// Settings the old version kept in this browser only (localStorage). Used once to carry them over.
export function legacyPrefsFromStorage(read: (key: string) => string | null): Partial<Prefs> {
  const out: Partial<Prefs> = {}
  const grid = read('space_grid_pref')
  if (grid && (COLUMN_CHOICES as readonly number[]).includes(Number(grid))) out.columns = Number(grid) as 5 | 6 | 9
  if (read('space_minimalist') === 'true') out.minimalist = true
  return out
}
