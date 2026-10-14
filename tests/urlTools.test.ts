import { describe, it, expect } from 'vitest'
import { normalizeUrl, detectSiteType, hostIs } from '@/lib/urlTools'

describe('normalizeUrl (shared)', () => {
  it('adds https, lowercases the host, drops www and trailing slashes', () => {
    expect(normalizeUrl('WWW.Example.com/Page/')).toBe('https://example.com/Page')
    expect(normalizeUrl('https://example.com/')).toBe('https://example.com/')
  })
  it('keeps the query but drops the #fragment of normal links', () => {
    expect(normalizeUrl('https://example.com/a?x=1#top')).toBe('https://example.com/a?x=1')
  })
  it('keeps the #fragment for notes', () => {
    expect(normalizeUrl('https://example.com/a#:~:text=hi', 'note')).toBe('https://example.com/a#:~:text=hi')
  })
  it('turns youtu.be and m.youtube.com links into one clean youtube.com/watch?v= address', () => {
    expect(normalizeUrl('https://youtu.be/abc123?t=5')).toBe('https://youtube.com/watch?v=abc123')
    expect(normalizeUrl('https://www.youtube.com/watch?v=abc123&list=PL1&t=30')).toBe('https://youtube.com/watch?v=abc123')
    expect(normalizeUrl('https://m.youtube.com/watch?v=abc123&feature=share')).toBe('https://youtube.com/watch?v=abc123')
  })
  it('handles empty and broken input without throwing', () => {
    expect(normalizeUrl('')).toBe('')
    expect(normalizeUrl('   ')).toBe('')
    expect(typeof normalizeUrl('http://')).toBe('string')
  })
})

describe('detectSiteType', () => {
  it('recognises the supported sites and their sub-domains', () => {
    expect(detectSiteType('https://x.com/a/status/1')).toBe('twitter')
    expect(detectSiteType('https://mobile.twitter.com/a')).toBe('twitter')
    expect(detectSiteType('https://www.instagram.com/p/1')).toBe('instagram')
    expect(detectSiteType('https://youtu.be/abc')).toBe('youtube')
    expect(detectSiteType('https://pin.it/abc')).toBe('pinterest')
    expect(detectSiteType('https://gist.github.com/u/1')).toBe('github')
    expect(detectSiteType('https://www.linkedin.com/in/x')).toBe('linkedin')
  })
  it('does not mix up look-alike addresses', () => {
    for (const u of ['https://dropbox.com/s', 'https://linux.com', 'https://netflix.com', 'https://max.com', 'https://fakegithub.com', 'https://evil.com/x.com', 'https://x.com.evil.com/a'])
      expect(detectSiteType(u)).toBe(null)
  })
  it('returns null for rubbish', () => {
    expect(detectSiteType('')).toBe(null)
    expect(detectSiteType('not a url at all')).toBe(null)
  })
})

describe('hostIs', () => {
  it('matches the domain and sub-domains only', () => {
    expect(hostIs('x.com', 'x.com')).toBe(true)
    expect(hostIs('a.x.com', 'x.com')).toBe(true)
    expect(hostIs('dropbox.com', 'x.com')).toBe(false)
  })
})

import { canonicalizeXUrl, cleanTitle, isSocialType } from '@/lib/urlTools'

describe('canonicalizeXUrl', () => {
  it('turns every X / Twitter form into x.com/<handle>/status/<id>', () => {
    for (const u of [
      'https://x.com/jack/status/20',
      'https://twitter.com/jack/status/20',
      'https://www.twitter.com/jack/status/20',
      'https://mobile.twitter.com/jack/status/20',
      'https://x.com/jack/status/20?s=20',
      'https://x.com/jack/status/20?s=46&t=abc#frag',
      'https://x.com/jack/status/20/photo/1',
      'x.com/jack/status/20/',
    ]) expect(canonicalizeXUrl(u)).toBe('https://x.com/jack/status/20')
  })
  it('accepts /i/status/<id>', () => {
    expect(canonicalizeXUrl('https://x.com/i/status/99?s=1')).toBe('https://x.com/i/status/99')
  })
  it('returns null for anything that is not an X post', () => {
    for (const u of ['https://x.com/jack', 'https://x.com/home', 'https://example.com/jack/status/20', 'https://x.com.evil.com/jack/status/20', 'https://dropbox.com/a/status/1', 'not a url'])
      expect(canonicalizeXUrl(u)).toBe(null)
  })
  it('is used by normalizeUrl', () => {
    expect(normalizeUrl('https://twitter.com/jack/status/20?s=20')).toBe('https://x.com/jack/status/20')
  })
})

describe('cleanTitle / isSocialType', () => {
  it('strips a leading "(n) " and a trailing " / X"', () => {
    expect(cleanTitle('(3) Jack on X: "hi" / X')).toBe('Jack on X: "hi"')
    expect(cleanTitle('  (12) Hello  ')).toBe('Hello')
    expect(cleanTitle('Plain title')).toBe('Plain title')
    expect(cleanTitle('Fix (3) bugs')).toBe('Fix (3) bugs')
  })
  it('handles non-strings', () => {
    expect(cleanTitle(undefined)).toBe('')
    expect(cleanTitle(5)).toBe('')
  })
  it('knows the four social types only', () => {
    for (const t of ['twitter', 'instagram', 'youtube', 'pinterest']) expect(isSocialType(t)).toBe(true)
    for (const t of ['link', 'note', 'github', 'image', '', undefined]) expect(isSocialType(t as any)).toBe(false)
  })
})
