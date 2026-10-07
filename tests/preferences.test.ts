import { describe, it, expect } from 'vitest'
import { sanitizePrefs, DEFAULT_PREFS, samePrefs, legacyPrefsFromStorage } from '@/lib/preferences'

describe('sanitizePrefs', () => {
  it('gives the defaults for nothing, nonsense or the wrong kind of value', () => {
    for (const bad of [undefined, null, 5, 'x', [], true]) expect(sanitizePrefs(bad)).toEqual(DEFAULT_PREFS)
  })
  it('keeps valid values', () => {
    expect(sanitizePrefs({ sort: 'asc', groupByDate: true, columns: 6, minimalist: true }))
      .toEqual({ sort: 'asc', groupByDate: true, columns: 6, minimalist: true })
  })
  it('accepts columns saved as text and as "auto"', () => {
    expect(sanitizePrefs({ columns: '9' }).columns).toBe(9)
    expect(sanitizePrefs({ columns: 'auto' }).columns).toBe('auto')
  })
  it('repairs each bad field on its own and leaves the good ones', () => {
    expect(sanitizePrefs({ sort: 'sideways', groupByDate: 'yes', columns: 7, minimalist: true }))
      .toEqual({ sort: 'desc', groupByDate: false, columns: 'auto', minimalist: true })
  })
  it('drops unknown fields', () => {
    expect(Object.keys(sanitizePrefs({ evil: '<script>', sort: 'asc' })).sort()).toEqual(['columns', 'groupByDate', 'minimalist', 'sort'])
  })
  it('is stable: sanitizing twice changes nothing', () => {
    const once = sanitizePrefs({ sort: 'asc', columns: '5' })
    expect(sanitizePrefs(once)).toEqual(once)
  })
})

describe('samePrefs', () => {
  it('compares every setting', () => {
    expect(samePrefs(DEFAULT_PREFS, { ...DEFAULT_PREFS })).toBe(true)
    expect(samePrefs(DEFAULT_PREFS, { ...DEFAULT_PREFS, groupByDate: true })).toBe(false)
  })
})

describe('legacyPrefsFromStorage', () => {
  it('carries over the old browser-only settings', () => {
    const store: Record<string, string> = { space_grid_pref: '6', space_minimalist: 'true' }
    expect(legacyPrefsFromStorage((k) => store[k] ?? null)).toEqual({ columns: 6, minimalist: true })
  })
  it('ignores missing or invalid old values', () => {
    expect(legacyPrefsFromStorage(() => null)).toEqual({})
    expect(legacyPrefsFromStorage((k) => (k === 'space_grid_pref' ? '42' : 'false'))).toEqual({})
  })
})
