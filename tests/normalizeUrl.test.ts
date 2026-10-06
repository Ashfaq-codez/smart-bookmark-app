import { describe, it, expect } from 'vitest'
import { normalizeUrl } from '@/utils/normalizeUrl'

// Describes how src/utils/normalizeUrl.ts behaves TODAY (it is used by the live-sync hook).
describe('normalizeUrl (utils)', () => {
  it('adds https:// when there is no protocol', () => {
    expect(normalizeUrl('example.com/a')).toBe('https://example.com/a')
  })

  it('lowercases the host and removes www.', () => {
    expect(normalizeUrl('https://WWW.Example.COM/Page')).toBe('https://example.com/Page')
  })

  it('removes trailing slashes but keeps the root slash', () => {
    expect(normalizeUrl('https://example.com/a/')).toBe('https://example.com/a')
    expect(normalizeUrl('https://example.com')).toBe('https://example.com/')
  })

  it('drops the #fragment but keeps the ?query', () => {
    expect(normalizeUrl('https://example.com/a?x=1#top')).toBe('https://example.com/a?x=1')
  })

  it('trims spaces and returns an empty string for nothing', () => {
    expect(normalizeUrl('  https://example.com/a  ')).toBe('https://example.com/a')
    expect(normalizeUrl('   ')).toBe('')
  })

  it('falls back to a lowercase, slash-trimmed copy for text that is not an address', () => {
    expect(normalizeUrl('Not A Url/')).toBe('not a url')
  })

  // This version does NOT clean YouTube links, unlike the save route. Phase E will make them match.
  it('currently keeps every YouTube parameter', () => {
    expect(normalizeUrl('https://www.youtube.com/watch?v=abc&list=PL1')).toBe('https://youtube.com/watch?v=abc&list=PL1')
  })
})
