import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/utils/supabase/server', () => ({ createClient: vi.fn() }))

import { createClient } from '@/utils/supabase/server'
import { DELETE, PATCH } from '@/app/api/bookmarks/[id]/route'
import { MAX_NOTE_CHARS } from '@/lib/sanitizeNoteHtml'

type Opts = {
  user?: { id: string } | null
  row?: any                 // the row the delete / update finds (null = nothing matched)
  dbError?: any
  storageError?: any
}

// Small stand-in for Supabase: records filters, the update, and which files were removed.
function fake(opts: Opts = {}) {
  const filters: [string, any][] = []
  const updates: any[] = []
  const removed: string[][] = []
  const chain: any = {
    delete: () => chain,
    update: (p: any) => { updates.push(p); return chain },
    eq: (c: string, v: any) => { filters.push([c, v]); return chain },
    select: () => chain,
    maybeSingle: async () => ({ data: opts.row ?? null, error: opts.dbError ?? null }),
  }
  const client = {
    auth: { getUser: async () => ({ data: { user: opts.user === undefined ? { id: 'user-1' } : opts.user }, error: null }) },
    from: vi.fn(() => chain),
    storage: { from: vi.fn(() => ({ remove: async (paths: string[]) => { removed.push(paths); return { error: opts.storageError ?? null } } })) },
  }
  vi.mocked(createClient).mockResolvedValue(client as any)
  return { client, filters, updates, removed }
}

const ctx = (id: string) => ({ params: Promise.resolve({ id }) })
const del = (id: string) => DELETE(new Request('http://localhost/api/bookmarks/' + id, { method: 'DELETE' }), ctx(id))
const patch = (id: string, body: any) =>
  PATCH(new Request('http://localhost/api/bookmarks/' + id, { method: 'PATCH', body: typeof body === 'string' ? body : JSON.stringify(body) }), ctx(id))

beforeEach(() => { vi.mocked(createClient).mockReset(); vi.restoreAllMocks() })

describe('DELETE /api/bookmarks/[id]', () => {
  it('rejects ids that are not positive whole numbers', async () => {
    fake()
    for (const id of ['0', '-3', '1.5', 'abc', '1e3', '']) expect((await del(id)).status).toBe(400)
  })

  it('rejects someone who is not signed in', async () => {
    fake({ user: null })
    expect((await del('5')).status).toBe(401)
  })

  it('deletes only the signed-in person\'s own row', async () => {
    const f = fake({ row: { id: 5, file_path: null } })
    const res = await del('5')
    expect(res.status).toBe(200)
    expect(f.filters).toEqual([['id', 5], ['user_id', 'user-1']])
    expect(f.removed).toHaveLength(0)
  })

  it('answers 404 when nothing was deleted (not found, or not theirs)', async () => {
    const f = fake({ row: null })
    expect((await del('5')).status).toBe(404)
    expect(f.client.storage.from).not.toHaveBeenCalled()
  })

  it('removes the uploaded file from the attachments bucket', async () => {
    const f = fake({ row: { id: 5, file_path: 'user-1/a.png' } })
    expect((await del('5')).status).toBe(200)
    expect(f.client.storage.from).toHaveBeenCalledWith('attachments')
    expect(f.removed).toEqual([['user-1/a.png']])
  })

  it('still answers 200 when the file cleanup fails, and logs it', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    fake({ row: { id: 5, file_path: 'user-1/a.png' }, storageError: { message: 'nope' } })
    expect((await del('5')).status).toBe(200)
    expect(log).toHaveBeenCalledWith('[delete] storage cleanup failed')
  })

  it('answers 500 on a database error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    fake({ dbError: { code: 'XX000', message: 'boom' } })
    expect((await del('5')).status).toBe(500)
  })
})

describe('PATCH /api/bookmarks/[id]', () => {
  it('rejects bad ids and signed-out people', async () => {
    fake()
    expect((await patch('abc', { content: 'x' })).status).toBe(400)
    fake({ user: null })
    expect((await patch('5', { content: 'x' })).status).toBe(401)
  })

  it('rejects content that is not text, or a body that is not JSON', async () => {
    fake()
    expect((await patch('5', { content: { evil: true } })).status).toBe(400)
    expect((await patch('5', {})).status).toBe(400)
    expect((await patch('5', 'not json')).status).toBe(400)
  })

  it('rejects a note that is far too long with 413', async () => {
    const f = fake({ row: { id: 5 } })
    const res = await patch('5', { content: 'a'.repeat(MAX_NOTE_CHARS + 1) })
    expect(res.status).toBe(413)
    expect(f.updates).toHaveLength(0)
  })

  it('cleans dangerous HTML, stores it for the person\'s own row and sends it back', async () => {
    const f = fake({ row: { id: 5 } })
    const res = await patch('5', { content: '<p onclick="x()">Hi</p><script>alert(1)</script>' })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ content: '<p>Hi</p>' })
    expect(f.updates).toEqual([{ content: '<p>Hi</p>' }])
    expect(f.filters).toEqual([['id', 5], ['user_id', 'user-1']])
  })

  it('stores an empty note as null', async () => {
    const f = fake({ row: { id: 5 } })
    const res = await patch('5', { content: '' })
    expect(res.status).toBe(200)
    expect(f.updates).toEqual([{ content: null }])
  })

  it('answers 404 when the row is not theirs or is gone', async () => {
    fake({ row: null })
    expect((await patch('5', { content: 'x' })).status).toBe(404)
  })
})
