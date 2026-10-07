import { describe, it, expect } from 'vitest'
import {
  isVideoMedia, isGoogleSearchUrl, getGoogleQuery, getYouTubeId, getTwitterAuthor,
  deriveDisplayType, getInstaMeta, getPlatformMeta, getUniversalEmbedUrl, formatDate,
} from '@/utils/bookmarkHelpers'

describe('getYouTubeId', () => {
  it('reads the id from the common YouTube address shapes', () => {
    expect(getYouTubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(getYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=5')).toBe('dQw4w9WgXcQ')
    expect(getYouTubeId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })
  it('returns an empty string for other sites', () => {
    expect(getYouTubeId('https://example.com')).toBe('')
  })
})

describe('getTwitterAuthor', () => {
  it('reads the account name from an x.com or twitter.com address', () => {
    expect(getTwitterAuthor('https://x.com/jack/status/20')).toBe('jack')
    expect(getTwitterAuthor('https://twitter.com/jack/status/20')).toBe('jack')
  })
  it('falls back to "unknown"', () => {
    expect(getTwitterAuthor('https://example.com')).toBe('unknown')
    expect(getTwitterAuthor('https://dropbox.com/foo')).toBe('unknown')
  })
})

describe('Google search links', () => {
  it('recognises a Google search address', () => {
    expect(isGoogleSearchUrl('https://www.google.com/search?q=cats')).toBe(true)
    expect(isGoogleSearchUrl('google.com/search?q=a')).toBe(true)
  })
  it('ignores other Google pages and other sites', () => {
    expect(isGoogleSearchUrl('https://www.google.com/maps')).toBe(false)
    expect(isGoogleSearchUrl('https://example.com/search?q=1')).toBe(false)
  })
  it('reads the search words', () => {
    expect(getGoogleQuery('https://www.google.com/search?q=hello+world')).toBe('hello world')
    expect(getGoogleQuery('https://example.com')).toBe('')
  })
})

describe('isVideoMedia', () => {
  it('is true for video files and streams', () => {
    expect(isVideoMedia('https://a.com/v.mp4')).toBe(true)
    expect(isVideoMedia('https://a.com/stream.m3u8')).toBe(true)
  })
  it('is false for images and empty values', () => {
    expect(isVideoMedia('https://a.com/p.png')).toBe(false)
    expect(isVideoMedia(null)).toBe(false)
  })
})

describe('deriveDisplayType (decides which kind of card to draw)', () => {
  it('trusts the saved type for the known card types', () => {
    expect(deriveDisplayType({ type: 'note', url: 'https://x.com/a' } as any)).toBe('note')
    expect(deriveDisplayType({ type: 'image', url: 'https://a.com/p.png' } as any)).toBe('image')
  })

  it('works out the card from the address when the type is plain', () => {
    const cases: [string, string][] = [
      ['https://twitter.com/a/status/1', 'twitter'],
      ['https://www.instagram.com/p/a', 'instagram'],
      ['https://youtu.be/abc', 'youtube'],
      ['https://github.com/a', 'github'],
      ['https://www.pinterest.com/pin/1', 'pinterest'],
      ['https://www.tiktok.com/@a/video/1', 'tiktok'],
      ['https://www.google.com/search?q=a', 'google'],
      ['https://a.com/file.pdf', 'pdf'],
      ['https://example.com', 'link'],
    ]
    for (const [url, expected] of cases) expect(deriveDisplayType({ url } as any)).toBe(expected)
  })

  it('uses the file type to spot PDFs', () => {
    expect(deriveDisplayType({ url: 'https://a.com/download', file_type: 'application/pdf' } as any)).toBe('pdf')
  })

  it('defaults to link', () => {
    expect(deriveDisplayType({} as any)).toBe('link')
  })

  it('does not treat look-alike sites as X, Instagram, GitHub, etc.', () => {
    for (const url of ['https://www.dropbox.com/s/abc', 'https://linux.com/a', 'https://netflix.com/title/1', 'https://notgithub.com/x', 'https://evil.com/?u=https://x.com/a'])
      expect(deriveDisplayType({ url } as any)).toBe('link')
  })

  it('ignores a wrong saved label (old saves of dropbox.com / netflix.com stored as "twitter")', () => {
    expect(deriveDisplayType({ type: 'twitter', url: 'https://www.dropbox.com/s/abc' } as any)).toBe('link')
    expect(deriveDisplayType({ type: 'twitter', url: 'https://netflix.com/title/1' } as any)).toBe('link')
    expect(deriveDisplayType({ type: 'twitter', url: 'https://x.com/jack/status/20' } as any)).toBe('twitter')
    expect(deriveDisplayType({ type: 'youtube', url: 'https://youtu.be/dQw4w9WgXcQ' } as any)).toBe('youtube')
    expect(deriveDisplayType({ type: 'note', url: 'https://smart-bookmark.internal/note-1' } as any)).toBe('note')
  })

  it('still recognises sub-domains of the real sites', () => {
    expect(deriveDisplayType({ url: 'https://mobile.twitter.com/jack/status/20' } as any)).toBe('twitter')
    expect(deriveDisplayType({ url: 'https://m.youtube.com/watch?v=dQw4w9WgXcQ' } as any)).toBe('youtube')
    expect(deriveDisplayType({ url: 'https://gist.github.com/u/1' } as any)).toBe('github')
  })
})

describe('getPlatformMeta', () => {
  it('names well-known sites and gives them a brand colour', () => {
    expect(getPlatformMeta('https://open.spotify.com/track/1')).toEqual({ name: 'Spotify', color: '#1DB954' })
  })
  it('uses the host name for other sites, with no colour', () => {
    expect(getPlatformMeta('https://www.foo.com')).toEqual({ name: 'foo.com', color: 'transparent' })
  })
  it('does not mix up look-alike sites', () => {
    expect(getPlatformMeta('https://notspotify.com/x')).toEqual({ name: 'notspotify.com', color: 'transparent' })
  })
  it('handles an empty address', () => {
    expect(getPlatformMeta('')).toEqual({ name: 'Website', color: 'transparent' })
  })
})

describe('getInstaMeta', () => {
  it('reads the account, likes and caption from an Instagram description', () => {
    const meta = getInstaMeta({ description: '1,234 likes - jane_doe on Instagram: "Nice day out"', title: '', url: 'https://www.instagram.com/p/abc/' } as any)
    expect(meta.username).toBe('jane_doe')
    expect(meta.likes).toBe('1,234')
    expect(meta.caption).toBe('Nice day out')
  })
  it('falls back to the account name in the address', () => {
    expect(getInstaMeta({ description: '', title: '', url: 'https://www.instagram.com/jane.doe/' } as any).username).toBe('jane.doe')
  })
  it('ignores the generic "Instagram" caption', () => {
    expect(getInstaMeta({ description: 'Instagram', title: 't', url: 'https://www.instagram.com/p/abc/' } as any).caption).toBe('')
  })
})

describe('getUniversalEmbedUrl', () => {
  it('builds embeddable addresses for supported sites', () => {
    expect(getUniversalEmbedUrl('https://open.spotify.com/track/1')).toBe('https://open.spotify.com/embed/track/1')
    expect(getUniversalEmbedUrl('https://vimeo.com/12345')).toBe('https://player.vimeo.com/video/12345')
  })
  it('returns null when there is nothing to embed', () => {
    expect(getUniversalEmbedUrl('https://example.com')).toBeNull()
    expect(getUniversalEmbedUrl('')).toBeNull()
  })
})

describe('formatDate', () => {
  it('formats a date for display and handles empty values', () => {
    expect(formatDate('2026-10-05T12:00:00Z')).toMatch(/2026/)
    expect(formatDate('')).toBe('')
  })
})