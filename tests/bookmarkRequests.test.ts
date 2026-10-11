import { describe, it, expect, vi } from 'vitest'
import { requestDelete, requestContentUpdate, requestUploadBookmark } from '@/lib/bookmarkRequests'

const reply = (status: number, body: any = {}) => vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status })) as unknown as typeof fetch

describe('requestDelete', () => {
  it('calls DELETE on the bookmark address', async () => {
    const f = reply(200)
    expect(await requestDelete(7, f)).toBe('deleted')
    expect(f).toHaveBeenCalledWith('/api/bookmarks/7', { method: 'DELETE' })
  })

  it('treats 404 as "already deleted" (e.g. removed in another tab), not as an error', async () => {
    expect(await requestDelete(7, reply(404))).toBe('gone')
  })

  it('fails for other non-OK answers', async () => {
    expect(await requestDelete(7, reply(500))).toBe('failed')
    expect(await requestDelete(7, reply(401))).toBe('failed')
  })

  it('fails when the network is down', async () => {
    expect(await requestDelete(7, vi.fn().mockRejectedValue(new Error('offline')) as unknown as typeof fetch)).toBe('failed')
  })
})

describe('requestContentUpdate', () => {
  it('sends only the content and returns what the server stored', async () => {
    const f = reply(200, { content: '<p>clean</p>' })
    expect(await requestContentUpdate(7, '<p onclick="x()">clean</p>', f)).toEqual({ ok: true, content: '<p>clean</p>' })
    const [url, init] = (f as any).mock.calls[0]
    expect(url).toBe('/api/bookmarks/7')
    expect(init.method).toBe('PATCH')
    expect(JSON.parse(init.body)).toEqual({ content: '<p onclick="x()">clean</p>' })
  })

  it('turns an empty stored note into null', async () => {
    expect(await requestContentUpdate(7, null, reply(200, { content: '' }))).toEqual({ ok: true, content: null })
  })

  it('reports "too long" for 413 and a plain failure for anything else', async () => {
    expect(await requestContentUpdate(7, 'x', reply(413))).toEqual({ ok: false, tooLong: true })
    expect(await requestContentUpdate(7, 'x', reply(500))).toEqual({ ok: false, tooLong: false })
    expect(await requestContentUpdate(7, 'x', vi.fn().mockRejectedValue(new Error('offline')) as unknown as typeof fetch)).toEqual({ ok: false, tooLong: false })
  })
})

describe('requestUploadBookmark', () => {
  const file = { path: 'user-1/a.png', type: 'image/png', title: 'a.png' }

  it('posts the file details and reports success', async () => {
    const f = reply(200, { success: true })
    expect(await requestUploadBookmark(file, f)).toBe('saved')
    const [url, init] = (f as any).mock.calls[0]
    expect(url).toBe('/api/bookmarks/upload')
    expect(JSON.parse(init.body)).toEqual({ file_path: 'user-1/a.png', file_type: 'image/png', title: 'a.png' })
  })

  it('reports "limited" for 429 and "failed" for anything else', async () => {
    expect(await requestUploadBookmark(file, reply(429))).toBe('limited')
    expect(await requestUploadBookmark(file, reply(500))).toBe('failed')
    expect(await requestUploadBookmark(file, vi.fn().mockRejectedValue(new Error('offline')) as unknown as typeof fetch)).toBe('failed')
  })
})
