import { describe, it, expect, vi, beforeEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

vi.mock('@/utils/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('@/utils/safeFetch', () => ({ isSafeUrl: vi.fn(), safeFetch: vi.fn() }))
vi.mock('@/lib/admin', () => ({ isAdmin: (id?: string | null) => id === 'owner' }))
import { createClient } from '@/utils/supabase/server'
import { safeFetch } from '@/utils/safeFetch'
import { GET, POST } from '@/app/api/admin/x-backfill/route'
import { fakeSupabase, FakeOptions } from './helpers/fakeSupabase'

const photo = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'fixtures/x/photo.json'), 'utf8'))
const row = { id: 3, url: 'https://x.com/Interior/status/463440424141459456', type: 'twitter', title: 'Post by Interior (@Interior) on X', image_url: null, post_data: null, post_data_failed_at: null }
function as(opts: FakeOptions) {
  const fake = fakeSupabase(opts)
  vi.mocked(createClient).mockResolvedValue(fake.client as any)
  return fake
}

beforeEach(() => {
  vi.mocked(safeFetch).mockReset()
  vi.mocked(safeFetch).mockImplementation(async (u: any) =>
    String(u).includes('syndication') ? new Response(JSON.stringify(photo)) : new Response('', { status: 500 }))
})

describe('/api/admin/x-backfill', () => {
  it('is hidden from everyone but the owner', async () => {
    as({ user: { id: 'someone' }, listRows: [row] })
    expect((await GET()).status).toBe(404)
    expect((await POST()).status).toBe(404)
    as({ user: null })
    expect((await POST()).status).toBe(404)
    expect(safeFetch).not.toHaveBeenCalled()
  })

  it('dry run lists the next batch, only the owner\'s X rows, and changes nothing', async () => {
    const fake = as({ user: { id: 'owner' }, listRows: [row] })
    const body = await (await GET()).json()
    expect(body).toEqual({ dryRun: true, waiting: 1, nextBatch: [{ id: 3, url: row.url, title: row.title }] })
    expect(fake.bookmarkFilters).toContainEqual(['user_id', 'owner'])
    expect(fake.bookmarkFilters).toContainEqual(['type', 'twitter'])
    expect(fake.updates).toHaveLength(0)
    expect(safeFetch).not.toHaveBeenCalled()
  })

  it('apply reads the batch and reports each result', async () => {
    const fake = as({ user: { id: 'owner' }, listRows: [row] })
    const body = await (await POST()).json()
    expect(body).toEqual({ done: [{ id: 3, url: row.url, result: 'stored' }], waitingBefore: 1, left: 0 })
    expect(fake.updates[0].patch.post_data.id).toBe('463440424141459456')
  })
})
