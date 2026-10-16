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
    expect(d).toEqual({ title: 'Great Page', description: 'About', image: 'https://example.com/cover.png', article: null })
  })

  it('turns an http image address into https', async () => {
    vi.mocked(safeFetch).mockResolvedValue(new Response(
      `<html><head><meta property="og:image" content="http://cdn.example.com/c.png"></head></html>`, { status: 200 }))
    const d = await fetchPageDetails('https://example.com/a', 'link')
    expect(d.image).toBe('https://cdn.example.com/c.png')
  })

  it('finds the picture in twitter:image:src, image_src or the structured data when there is no og:image', async () => {
    for (const [head, want] of [
      ['<meta name="twitter:image:src" content="https://cdn.example.com/t.png">', 'https://cdn.example.com/t.png'],
      ['<link rel="image_src" href="/img/share.jpg">', 'https://example.com/img/share.jpg'],
      ['<script type="application/ld+json">{"@graph":[{"@type":"Product","image":["https://cdn.example.com/p1.jpg"]}]}</script>', 'https://cdn.example.com/p1.jpg'],
      ['<script type="application/ld+json">{"@type":"NewsArticle","image":{"url":"https://cdn.example.com/n.jpg"}}</script>', 'https://cdn.example.com/n.jpg'],
    ]) {
      vi.mocked(safeFetch).mockResolvedValueOnce(new Response(`<html><head><title>T</title>${head}</head></html>`, { status: 200 }))
      expect((await fetchPageDetails('https://example.com/a', 'link')).image).toBe(want)
    }
  })

  it('ignores picture addresses that are not web addresses', async () => {
    vi.mocked(safeFetch).mockResolvedValue(new Response(
      `<html><head><meta property="og:image" content="javascript:alert(1)"><meta name="twitter:image" content="data:image/png;base64,AA"></head></html>`, { status: 200 }))
    expect((await fetchPageDetails('https://example.com/a', 'link')).image).toBeNull()
  })

  it('asks like a normal browser (some sites refuse anything else)', async () => {
    vi.mocked(safeFetch).mockResolvedValue(new Response('<html></html>', { status: 200 }))
    await fetchPageDetails('https://example.com/a', 'link')
    const headers = (vi.mocked(safeFetch).mock.calls[0][1] as RequestInit).headers as Record<string, string>
    expect(headers['User-Agent']).toMatch(/Chrome\/\d+/)
    expect(headers['Accept-Language']).toBeTruthy()
  })

  it('reads an X post through the vxtwitter helper', async () => {
    vi.mocked(safeFetch).mockResolvedValue(new Response(JSON.stringify({
      text: 'hello world', user_name: 'Ann', user_screen_name: 'ann',
      media_extended: [{ url: 'https://pbs.example/pic.jpg' }],
    }), { status: 200 }))
    const d = await fetchPageDetails('https://x.com/ann/status/1', 'twitter')
    expect(d).toEqual({ title: 'Post by Ann (@ann) on X', description: 'hello world', image: 'https://pbs.example/pic.jpg', canonicalUrl: 'https://x.com/ann/status/1' })
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
