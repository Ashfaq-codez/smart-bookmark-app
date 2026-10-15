import { describe, it, expect } from 'vitest'
import { parseInstagramCapture, instagramTitle, isInstagramPostUrl } from '@/lib/instagramCapture'

const POST = 'https://instagram.com/p/ABCdef123'

describe('isInstagramPostUrl', () => {
  it('accepts post, reel and tv addresses only', () => {
    expect(isInstagramPostUrl(POST)).toBe(true)
    expect(isInstagramPostUrl('https://www.instagram.com/reel/ABCdef123/')).toBe(true)
    expect(isInstagramPostUrl('https://instagram.com/tv/ABCdef123')).toBe(true)
    expect(isInstagramPostUrl('https://instagram.com/')).toBe(false)
    expect(isInstagramPostUrl('https://instagram.com/nasa')).toBe(false)
    expect(isInstagramPostUrl('https://medium.com/p/ABCdef123')).toBe(false)
    expect(isInstagramPostUrl('https://notinstagram.com/p/ABCdef123')).toBe(false)
  })
})

describe('parseInstagramCapture', () => {
  it('keeps clean fields', () => {
    expect(parseInstagramCapture({ handle: 'a.b_c', caption: ' hi\r\nthere ', image_url: 'https://x.fbcdn.net/a.jpg', is_video: true }, POST))
      .toEqual({ handle: 'a.b_c', caption: 'hi\nthere', image_url: 'https://x.fbcdn.net/a.jpg', is_video: true })
  })

  it('strips control characters, keeps line breaks, caps the length', () => {
    const c = parseInstagramCapture({ caption: 'a\u0000b\n\n\n\nc' + 'x'.repeat(5000) }, POST)!
    expect(c.caption!.startsWith('ab\n\nc')).toBe(true)
    expect(c.caption!.length).toBe(2200)
  })

  it('rejects bad values one by one', () => {
    const c = parseInstagramCapture({ handle: '<script>', caption: 5, image_url: 'http://x.cdninstagram.com/a.jpg', is_video: 'yes' }, POST)
    expect(c).toBe(null)
    expect(parseInstagramCapture({ caption: 'ok', image_url: 'https://cdninstagram.com.evil.io/a.jpg' }, POST)?.image_url).toBe(null)
  })

  it('is null for non-objects or non-post addresses', () => {
    expect(parseInstagramCapture('text', POST)).toBe(null)
    expect(parseInstagramCapture({ caption: 'hi' }, 'https://example.com/p/ABCdef123')).toBe(null)
    expect(parseInstagramCapture({ caption: 'hi' }, null)).toBe(null)
  })
})

describe('instagramTitle', () => {
  it('uses the first non-empty caption line, shortened', () => {
    expect(instagramTitle({ handle: 'nasa', caption: '\n\nHello\nworld', image_url: null, is_video: false })).toBe('nasa on Instagram: Hello')
    expect(instagramTitle({ handle: null, caption: null, image_url: 'x', is_video: false })).toBe('Post on Instagram')
    expect(instagramTitle({ handle: 'a', caption: 'y'.repeat(200), image_url: null, is_video: false }).length).toBeLessThan(110)
  })
})
