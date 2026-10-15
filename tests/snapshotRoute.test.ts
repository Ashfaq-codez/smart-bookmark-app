import { describe, it, expect, vi, beforeEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

vi.mock('@/utils/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('@/utils/safeFetch', () => ({ isSafeUrl: vi.fn(), safeFetch: vi.fn() }))
import { createClient } from '@/utils/supabase/server'
import { safeFetch } from '@/utils/safeFetch'
import { POST } from '@/app/api/bookmarks/[id]/snapshot/route'
import { needsRepair } from '@/hooks/useXSnapshotRepair'
import { fakeSupabase, FakeOptions } from './helpers/fakeSupabase'

const photo = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'fixtures/x/photo.json'), 'utf8'))
const call = (id: string) => POST(new Request(`http://localhost/api/bookmarks/${id}/snapshot`, { method: 'POST' }), { params: Promise.resolve({ id }) })
function as(opts: FakeOptions) {
  const fake = fakeSupabase(opts)
  vi.mocked(createClient).mockResolvedValue(fake.client as any)
  return fake
}
const xRow = { id: 3, url: 'https://x.com/Interior/status/463440424141459456', type: 'twitter', title: 'Post by Interior (@Interior) on X', image_url: null, post_data: null, post_data_failed_at: null }

beforeEach(() => {
  vi.mocked(safeFetch).mockReset()
  vi.mocked(safeFetch).mockImplementation(async (u: any) =>
    String(u).includes('syndication') ? new Response(JSON.stringify(photo)) : new Response('', { status: 500 }))
})

describe('POST /api/bookmarks/[id]/snapshot', () => {
  it('needs a login', async () => {
    as({ user: null })
    expect((await call('3')).status).toBe(401)
  })

  it('rejects odd ids', async () => {
    as({ user: { id: 'u1' } })
    expect((await call('1e3')).status).toBe(400)
  })

  it("someone else's (or a missing) bookmark is not found, and the lookup is scoped to the owner", async () => {
    const fake = as({ user: { id: 'u1' }, existing: null })
    expect((await call('3')).status).toBe(404)
    expect(fake.bookmarkFilters).toContainEqual(['user_id', 'u1'])
  })

  it('stores the snapshot for an X card that has none', async () => {
    const fake = as({ user: { id: 'u1' }, existing: xRow })
    const res = await call('3')
    expect(await res.json()).toEqual({ status: 'stored' })
    expect(fake.updates[0].patch.post_data.id).toBe('463440424141459456')
    expect(fake.updates[0].filters).toContainEqual(['user_id', 'u1'])
  })

  it('skips cards that are done, not X, or failed less than a day ago', async () => {
    for (const existing of [
      { ...xRow, post_data: { v: 1 } },
      { ...xRow, type: 'link' },
      { ...xRow, post_data_failed_at: new Date().toISOString() },
    ]) {
      const fake = as({ user: { id: 'u1' }, existing })
      expect(await (await call('3')).json()).toEqual({ status: 'skipped' })
      expect(fake.updates).toHaveLength(0)
    }
    expect(safeFetch).not.toHaveBeenCalled()
  })
})

describe('needsRepair (browser side)', () => {
  const now = Date.parse('2026-10-15T12:00:00Z')
  it('only X cards without a snapshot, failures at most once a day', () => {
    expect(needsRepair({ id: 1, post_data: null }, 'twitter', now)).toBe(true)
    expect(needsRepair({ id: 1, post_data: null }, 'link', now)).toBe(false)
    expect(needsRepair({ id: 1, post_data: { v: 1 } as any }, 'twitter', now)).toBe(false)
    expect(needsRepair({ id: 1, post_data: null, post_data_failed_at: '2026-10-15T00:00:00Z' }, 'twitter', now)).toBe(false)
    expect(needsRepair({ id: 1, post_data: null, post_data_failed_at: '2026-10-13T00:00:00Z' }, 'twitter', now)).toBe(true)
  })
})
