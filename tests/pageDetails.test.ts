import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/utils/safeFetch', () => ({ isSafeUrl: vi.fn(), safeFetch: vi.fn() }))

import { isSafeUrl, safeFetch } from '@/utils/safeFetch'
import { fetchPageDetails } from '@/lib/pageDetails'

beforeEach(() => {
  vi.mocked(isSafeUrl).mockReset()
  vi.mocked(safeFetch).mockReset()
  vi.mocked(isSafeUrl).mockResolvedValue(true)
})

describe('fetchPageDetails', () => {
  it('reads title, description and a full image address from a normal page', async () => {
    vi.mocked(safeFetch).mockResolvedValue(new Response(
      `<html><head><title>T</title><meta property="og:title" content="Great Page"><meta property="og:description" content="About"><meta property="og:image" content="/cover.png"></head></html>`,
      { status: 200 }))
    const d = await fetchPageDetails('https://example.com/a', 'link')
    expect(d).toEqual({ title: 'Great Page', description: 'About', image: 'https://example.com/cover.png' })
  })

  it('turns an http image address into https', async () => {
    vi.mocked(safeFetch).mockResolvedValue(new Response(
      `<html><head><meta property="og:image" content="http://cdn.example.com/c.png"></head></html>`, { status: 200 }))
    const d = await fetchPageDetails('https://example.com/a', 'link')
    expect(d.image).toBe('https://cdn.example.com/c.png')
  })

  it('reads an X post through the vxtwitter helper', async () => {
    vi.mocked(safeFetch).mockResolvedValue(new Response(JSON.stringify({
      text: 'hello world', user_name: 'Ann', user_screen_name: 'ann',
      media_extended: [{ url: 'https://pbs.example/pic.jpg' }],
    }), { status: 200 }))
    const d = await fetchPageDetails('https://x.com/ann/status/1', 'twitter')
    expect(d).toEqual({ title: 'Post by Ann (@ann) on X', description: 'hello world', image: 'https://pbs.example/pic.jpg' })
    expect(vi.mocked(safeFetch).mock.calls[0][0]).toBe('https://api.vxtwitter.com/ann/status/1')
  })

  it('returns nothing for private addresses and does not fetch', async () => {
    vi.mocked(isSafeUrl).mockResolvedValue(false)
    const d = await fetchPageDetails('http://192.168.1.1/', 'link')
    expect(d).toEqual({ title: null, description: null, image: null })
    expect(safeFetch).not.toHaveBeenCalled()
  })

  it('returns nothing, without throwing, when the fetch fails or the page answers with an error', async () => {
    vi.mocked(safeFetch).mockRejectedValue(new Error('down'))
    expect((await fetchPageDetails('https://example.com/a', 'link')).title).toBeNull()
    vi.mocked(safeFetch).mockResolvedValue(new Response('nope', { status: 404 }))
    expect((await fetchPageDetails('https://example.com/a', 'link')).title).toBeNull()
  })
})
