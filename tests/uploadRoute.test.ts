import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/utils/supabase/server', () => ({ createClient: vi.fn() }))

import { createClient } from '@/utils/supabase/server'
import { POST } from '@/app/api/bookmarks/upload/route'
import { MAX_SAVES_PER_MINUTE } from '@/lib/saveLimit'

type Opts = { user?: { id: string } | null; recentCount?: number; countError?: any; insertError?: any }

// Small stand-in for Supabase: answers the save-limit count, records the insert.
function fake(opts: Opts = {}) {
  const inserted: any[] = []
  const chain: any = {
    select: (_c?: string, o?: { head?: boolean }) => {
      if (o?.head) chain.then = (resolve: any) => resolve({ count: opts.recentCount ?? 0, error: opts.countError ?? null })
      return chain
    },
    eq: () => chain,
    gte: () => chain,
    insert: (rows: any[]) => { inserted.push(...rows); return chain },
    single: async () => opts.insertError
      ? { data: null, error: opts.insertError }
      : { data: { id: 1, ...inserted[inserted.length - 1] }, error: null },
  }
  const client = {
    auth: { getUser: async () => ({ data: { user: opts.user === undefined ? { id: 'user-1' } : opts.user }, error: null }) },
    from: vi.fn(() => chain),
    storage: { from: vi.fn(() => ({ getPublicUrl: (p: string) => ({ data: { publicUrl: 'https://cdn.example/attachments/' + p } }) })) },
  }
  vi.mocked(createClient).mockResolvedValue(client as any)
  return { inserted }
}

const post = (body: any) => POST(new Request('http://localhost/api/bookmarks/upload', { method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body) }))
const good = { file_path: 'user-1/1-abc.png', file_type: 'image/png', title: 'cat.png' }

beforeEach(() => { vi.mocked(createClient).mockReset(); vi.restoreAllMocks() })

describe('POST /api/bookmarks/upload', () => {
  it('rejects someone who is not signed in', async () => {
    fake({ user: null })
    expect((await post(good)).status).toBe(401)
  })

  it('rejects a body that is not JSON', async () => {
    fake()
    expect((await post('nope')).status).toBe(400)
  })

  it('rejects files outside the person\'s own folder', async () => {
    const f = fake()
    for (const file_path of ['user-2/a.png', 'a.png', 'user-1/../user-2/a.png', 42, undefined]) {
      expect((await post({ ...good, file_path })).status).toBe(400)
    }
    expect(f.inserted).toHaveLength(0)
  })

  it('answers 429 at the limit and saves nothing', async () => {
    const f = fake({ recentCount: MAX_SAVES_PER_MINUTE })
    const res = await post(good)
    expect(res.status).toBe(429)
    expect(res.headers.get('Retry-After')).toBe('60')
    expect(f.inserted).toHaveLength(0)
  })

  it('lets the upload through just under the limit', async () => {
    fake({ recentCount: MAX_SAVES_PER_MINUTE - 1 })
    expect((await post(good)).status).toBe(200)
  })

  it('lets the upload through if the count itself fails', async () => {
    fake({ countError: { message: 'boom' }, recentCount: 999 })
    expect((await post(good)).status).toBe(200)
  })

  it('builds the address on the server and saves an image with its cover', async () => {
    const f = fake()
    await post({ ...good, url: 'https://evil.example', user_id: 'user-2' })
    expect(f.inserted[0]).toEqual({
      user_id: 'user-1', title: 'cat.png', url: 'https://cdn.example/attachments/user-1/1-abc.png',
      type: 'image', file_path: 'user-1/1-abc.png', file_type: 'image/png',
      image_url: 'https://cdn.example/attachments/user-1/1-abc.png',
    })
  })

  it('works out the type for video, pdf and other files', async () => {
    const f = fake()
    await post({ ...good, file_path: 'user-1/a.mp4', file_type: 'video/mp4' })
    await post({ ...good, file_path: 'user-1/a.pdf', file_type: 'application/pdf' })
    await post({ ...good, file_path: 'user-1/a.bin', file_type: 'application/zip' })
    expect(f.inserted.map(r => r.type)).toEqual(['video', 'pdf', 'file'])
    expect(f.inserted[0]).not.toHaveProperty('image_url')
  })

  it('answers 500 on a database error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    fake({ insertError: { code: 'XX000', message: 'boom' } })
    expect((await post(good)).status).toBe(500)
  })
})
