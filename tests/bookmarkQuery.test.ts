import { describe, it, expect } from 'vitest'
import { buildListQuery, rowMatchesQuery, escapeLike, DEFAULT_QUERY, PAGE_SIZE } from '@/lib/bookmarkQuery'

// A fake query builder that records every call, so we can check what would be asked of the database.
function recorder() {
  const calls: any[][] = []
  const chain: any = new Proxy({}, { get: (_t, name: string) => (...args: any[]) => { calls.push([name, ...args]); return chain } })
  const client = { from: () => chain }
  return { client, calls }
}
const names = (calls: any[][]) => calls.map(c => c[0])

describe('escapeLike', () => {
  it('escapes the characters that act as wildcards in a search', () => {
    expect(escapeLike('50%_off\\')).toBe('50\\%\\_off\\\\')
  })
})

describe('buildListQuery', () => {
  it('asks for newest first with no filters by default', () => {
    const { client, calls } = recorder()
    buildListQuery(client, DEFAULT_QUERY, null, PAGE_SIZE + 1)
    expect(calls.find(c => c[0] === 'order')).toEqual(['order', 'created_at', { ascending: false }])
    expect(calls[calls.length - 1]).toEqual(['limit', PAGE_SIZE + 1])
    expect(names(calls)).not.toContain('eq')
    expect(names(calls)).not.toContain('ilike')
  })

  it('filters by folder and sub-folder', () => {
    const { client, calls } = recorder()
    buildListQuery(client, { ...DEFAULT_QUERY, category: 'Design', sub: 'UI' }, null, 10)
    expect(calls).toContainEqual(['eq', 'category', 'Design'])
    expect(calls).toContainEqual(['eq', 'sub_category', 'UI'])
  })

  it('treats "Uncategorized" as both that name and an empty folder', () => {
    const { client, calls } = recorder()
    buildListQuery(client, { ...DEFAULT_QUERY, category: 'Uncategorized' }, null, 10)
    expect(calls).toContainEqual(['or', 'category.eq.Uncategorized,category.is.null'])
  })

  it('filters by media type, and counts untyped rows as links', () => {
    const a = recorder()
    buildListQuery(a.client, { ...DEFAULT_QUERY, mediaType: 'videos' }, null, 10)
    expect(a.calls).toContainEqual(['in', 'type', ['video', 'youtube']])

    const b = recorder()
    buildListQuery(b.client, { ...DEFAULT_QUERY, mediaType: 'link' }, null, 10)
    expect(b.calls).toContainEqual(['or', 'type.in.(link),type.is.null'])
  })

  it('searches the lowercase search column with wildcards escaped', () => {
    const { client, calls } = recorder()
    buildListQuery(client, { ...DEFAULT_QUERY, search: '  50%_Off ' }, null, 10)
    expect(calls).toContainEqual(['ilike', 'search_text', '%50\\%\\_off%'])
  })

  it('continues after the last card shown (next page), newest first', () => {
    const { client, calls } = recorder()
    buildListQuery(client, DEFAULT_QUERY, { created_at: '2026-10-05T10:00:00+00:00', id: 42 }, 10)
    const or = calls.find(c => c[0] === 'or')!
    expect(or[1]).toBe('created_at.lt."2026-10-05T10:00:00+00:00",and(created_at.eq."2026-10-05T10:00:00+00:00",id.lt.42)')
  })

  it('goes the other way when sorting oldest first', () => {
    const { client, calls } = recorder()
    buildListQuery(client, { ...DEFAULT_QUERY, sort: 'asc' }, { created_at: '2026-10-05T10:00:00+00:00', id: 7 }, 10)
    expect(calls).toContainEqual(['order', 'created_at', { ascending: true }])
    expect(calls.find(c => c[0] === 'or')![1]).toContain('id.gt.7')
  })
})

describe('rowMatchesQuery (decides whether a live update belongs in the open view)', () => {
  it('matches everything in the default view', () => {
    expect(rowMatchesQuery({ category: 'A', type: 'note' }, DEFAULT_QUERY)).toBe(true)
  })

  it('checks the folder, treating a missing folder as Uncategorized', () => {
    expect(rowMatchesQuery({ category: null as any }, { ...DEFAULT_QUERY, category: 'Uncategorized' })).toBe(true)
    expect(rowMatchesQuery({ category: 'A' }, { ...DEFAULT_QUERY, category: 'B' })).toBe(false)
  })

  it('checks the sub-folder only inside a folder', () => {
    expect(rowMatchesQuery({ category: 'A', sub_category: 'x' }, { ...DEFAULT_QUERY, category: 'A', sub: 'y' })).toBe(false)
    expect(rowMatchesQuery({ category: 'A', sub_category: 'x' }, { ...DEFAULT_QUERY, category: 'A', sub: 'x' })).toBe(true)
  })

  it('checks the media type, treating a missing type as link', () => {
    expect(rowMatchesQuery({ type: undefined }, { ...DEFAULT_QUERY, mediaType: 'link' })).toBe(true)
    expect(rowMatchesQuery({ type: 'youtube' }, { ...DEFAULT_QUERY, mediaType: 'videos' })).toBe(true)
    expect(rowMatchesQuery({ type: 'note' }, { ...DEFAULT_QUERY, mediaType: 'videos' })).toBe(false)
  })

  it('checks the search text when it is known, and lets the row through when it is not', () => {
    expect(rowMatchesQuery({ search_text: 'hello world' }, { ...DEFAULT_QUERY, search: 'HELLO' })).toBe(true)
    expect(rowMatchesQuery({ search_text: 'hello world' }, { ...DEFAULT_QUERY, search: 'bye' })).toBe(false)
    expect(rowMatchesQuery({}, { ...DEFAULT_QUERY, search: 'bye' })).toBe(true)
  })
})
