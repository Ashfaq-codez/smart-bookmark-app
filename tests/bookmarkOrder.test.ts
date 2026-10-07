import { describe, it, expect } from 'vitest'
import { insertSorted, sortPins, applyToList, applyToPins } from '@/lib/bookmarkOrder'

const bm = (id: number, created_at: string, extra: any = {}) => ({ id, created_at, title: 't' + id, url: 'u' + id, category: 'c', user_id: 'u', ...extra }) as any
const ids = (l: any[]) => l.map((b) => b.id)

const A = bm(3, '2026-10-03T00:00:00+00:00')
const B = bm(2, '2026-10-02T00:00:00+00:00')
const C = bm(1, '2026-10-01T00:00:00+00:00')
const list = [A, B, C]            // newest first

describe('insertSorted', () => {
  it('places a save between its neighbours, newest first', () => {
    expect(ids(insertSorted(list, bm(9, '2026-10-02T12:00:00+00:00'), 'desc', false))).toEqual([3, 9, 2, 1])
  })
  it('places it at the very top when it is the newest', () => {
    expect(ids(insertSorted(list, bm(9, '2026-10-09T00:00:00+00:00'), 'desc', true))).toEqual([9, 3, 2, 1])
  })
  it('puts an older save at the end only if everything is loaded', () => {
    const old = bm(9, '2026-09-01T00:00:00+00:00')
    expect(ids(insertSorted(list, old, 'desc', false))).toEqual([3, 2, 1, 9])
    expect(ids(insertSorted(list, old, 'desc', true))).toEqual([3, 2, 1])   // more pages: it will load by scrolling
  })
  it('works oldest-first too', () => {
    const asc = [C, B, A]
    expect(ids(insertSorted(asc, bm(9, '2026-10-02T12:00:00+00:00'), 'asc', false))).toEqual([1, 2, 9, 3])
  })
  it('breaks ties on the same time by id', () => {
    const t = '2026-10-02T00:00:00+00:00'
    expect(ids(insertSorted([bm(5, t), bm(1, t)], bm(3, t), 'desc', false))).toEqual([5, 3, 1])
  })
  it('never adds the same save twice', () => {
    expect(insertSorted(list, A, 'desc', false)).toBe(list)
  })
})

describe('sortPins', () => {
  it('shows the most recently pinned first', () => {
    const p = [bm(1, 'x', { pinned_at: '2026-10-01T10:00:00+00:00' }), bm(2, 'x', { pinned_at: '2026-10-05T10:00:00+00:00' })]
    expect(ids(sortPins(p))).toEqual([2, 1])
  })
})

const ctx = { matches: true, wasPinned: false, sort: 'desc' as const, hasMore: false }

describe('applyToList', () => {
  it('removes a save from the normal list when it gets pinned', () => {
    expect(ids(applyToList(list, { ...B, pinned_at: '2026-10-07T00:00:00+00:00' }, ctx))).toEqual([3, 1])
  })
  it('puts an unpinned save back in its date position', () => {
    const without = [A, C]
    expect(ids(applyToList(without, { ...B, pinned_at: null }, { ...ctx, wasPinned: true }))).toEqual([3, 2, 1])
  })
  it('does not add an unpinned save that does not match the open view', () => {
    expect(ids(applyToList([A, C], { ...B, pinned_at: null }, { ...ctx, wasPinned: true, matches: false }))).toEqual([3, 1])
  })
  it('ignores a save that is not loaded and was not pinned', () => {
    const l = [A, C]
    expect(applyToList(l, { ...B, title: 'edited' }, ctx)).toBe(l)
  })
  it('updates a loaded save in place', () => {
    const out = applyToList(list, { ...B, title: 'edited' }, ctx)
    expect(out[1].title).toBe('edited')
    expect(ids(out)).toEqual([3, 2, 1])
  })
  it('drops a loaded save that no longer matches the open view', () => {
    expect(ids(applyToList(list, { ...B }, { ...ctx, matches: false }))).toEqual([3, 1])
  })
})

describe('applyToPins', () => {
  const p1 = bm(1, 'x', { pinned_at: '2026-10-01T10:00:00+00:00' })
  const p2 = bm(2, 'x', { pinned_at: '2026-10-02T10:00:00+00:00' })
  it('adds a newly pinned save at the front', () => {
    const out = applyToPins([p1], bm(7, 'x', { pinned_at: '2026-10-09T00:00:00+00:00' }), true)
    expect(ids(out)).toEqual([7, 1])
  })
  it('removes an unpinned save', () => {
    expect(ids(applyToPins([p2, p1], { ...p2, pinned_at: null }, true))).toEqual([1])
  })
  it('removes a pinned save that no longer matches the open view', () => {
    expect(ids(applyToPins([p2, p1], p2, false))).toEqual([1])
  })
  it('updates a pinned save in place without duplicating it', () => {
    const out = applyToPins([p2, p1], { ...p1, title: 'new' }, true)
    expect(ids(out)).toEqual([2, 1]); expect(out[1].title).toBe('new')
  })
})
