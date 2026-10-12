import { describe, it, expect } from 'vitest'
import { UNFILED, fetchFolderItems, moveItemsToUnfiled, restoreItems } from '@/lib/folderActions'

// Small stand-in for Supabase: a table of bookmarks that records every update and refuses to be deleted from.
type Row = { id: number; category: string; sub_category: string | null }
function fakeDb(rows: Row[], opts: { failUpdateAfter?: number; readError?: boolean } = {}) {
  const calls: { op: string; patch?: any; ids?: number[] }[] = []
  let updates = 0
  const client = {
    from: () => ({
      select: () => {
        let cat = ''
        let range: [number, number] = [0, 999]
        const q: any = {
          eq: (_c: string, v: string) => { cat = v; return q },
          order: () => q,
          range: (a: number, b: number) => { range = [a, b]; return q },
          then: (resolve: any) => {
            if (opts.readError) return resolve({ data: null, error: { message: 'boom' } })
            const found = rows.filter(r => r.category === cat).sort((x, y) => x.id - y.id)
            resolve({ data: found.slice(range[0], range[1] + 1).map(r => ({ id: r.id, sub_category: r.sub_category })), error: null })
          },
        }
        return q
      },
      update: (patch: any) => ({
        in: async (_c: string, ids: number[]) => {
          updates++
          if (opts.failUpdateAfter !== undefined && updates > opts.failUpdateAfter) return { error: { message: 'boom' } }
          calls.push({ op: 'update', patch, ids })
          rows.forEach(r => { if (ids.includes(r.id)) Object.assign(r, patch) })
          return { error: null }
        },
      }),
      delete: () => { calls.push({ op: 'DELETE' }); throw new Error('delete must never be called') },
    }),
  }
  return { client, calls, rows }
}

const make = (n: number, category = 'Recipes', sub: (i: number) => string | null = () => null): Row[] =>
  Array.from({ length: n }, (_, i) => ({ id: i + 1, category, sub_category: sub(i) }))

describe('moving a folder\'s saves to Uncategorized', () => {
  it('reads every save in the folder, even past one page of 1000', async () => {
    const db = fakeDb([...make(2300), { id: 9999, category: 'Other', sub_category: null }])
    const { ok, items } = await fetchFolderItems(db.client, 'Recipes')
    expect(ok).toBe(true)
    expect(items).toHaveLength(2300)
  })

  it('reports a failed read instead of pretending the folder is empty', async () => {
    const db = fakeDb(make(3), { readError: true })
    expect((await fetchFolderItems(db.client, 'Recipes')).ok).toBe(false)
  })

  it('files them under Uncategorized and clears the subfolder, touching only those rows', async () => {
    const db = fakeDb([...make(3, 'Recipes', () => 'Soups'), { id: 50, category: 'Travel', sub_category: 'Asia' }])
    const { items } = await fetchFolderItems(db.client, 'Recipes')
    expect(await moveItemsToUnfiled(db.client, items)).toBe(true)
    expect(db.rows.filter(r => r.category === 'Recipes')).toHaveLength(0)
    expect(db.rows.filter(r => r.category === UNFILED && r.sub_category === null)).toHaveLength(3)
    expect(db.rows.find(r => r.id === 50)).toEqual({ id: 50, category: 'Travel', sub_category: 'Asia' })
    expect(db.rows).toHaveLength(4)                      // no row was removed
  })

  it('never deletes a row, and only ever updates category and sub_category', async () => {
    const db = fakeDb(make(450))
    const { items } = await fetchFolderItems(db.client, 'Recipes')
    await moveItemsToUnfiled(db.client, items)
    expect(db.calls.every(c => c.op === 'update')).toBe(true)
    expect(db.calls.every(c => Object.keys(c.patch).sort().join() === 'category,sub_category')).toBe(true)
    expect(db.calls.every(c => c.ids!.length <= 200)).toBe(true)   // sent in small groups
    expect(db.rows).toHaveLength(450)
  })

  it('stops and says so when an update fails', async () => {
    const db = fakeDb(make(450), { failUpdateAfter: 1 })
    const { items } = await fetchFolderItems(db.client, 'Recipes')
    expect(await moveItemsToUnfiled(db.client, items)).toBe(false)
  })
})

describe('undo', () => {
  it('puts every save back in its folder and its own subfolder', async () => {
    const db = fakeDb(make(5, 'Recipes', i => (i % 2 === 0 ? 'Soups' : null)))
    const before = JSON.parse(JSON.stringify(db.rows))
    const { items } = await fetchFolderItems(db.client, 'Recipes')
    await moveItemsToUnfiled(db.client, items)
    expect(await restoreItems(db.client, 'Recipes', items)).toBe(true)
    expect(db.rows).toEqual(before)
  })

  it('does not touch saves that were filed somewhere else in the meantime', async () => {
    const db = fakeDb(make(3))
    const { items } = await fetchFolderItems(db.client, 'Recipes')
    await moveItemsToUnfiled(db.client, items)
    db.rows.push({ id: 77, category: UNFILED, sub_category: null })   // a new unfiled save made during the undo window
    await restoreItems(db.client, 'Recipes', items)
    expect(db.rows.find(r => r.id === 77)!.category).toBe(UNFILED)
  })

  it('reports a failed restore', async () => {
    const db = fakeDb(make(3), { failUpdateAfter: 0 })
    expect(await restoreItems(db.client, 'Recipes', [{ id: 1, sub_category: null }])).toBe(false)
  })
})
