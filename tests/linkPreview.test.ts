import { describe, it, expect, vi } from 'vitest'

vi.mock('@sparticuz/chromium', () => ({ default: {} }))
vi.mock('puppeteer-core', () => ({ default: {} }))
vi.mock('@/utils/safeFetch', () => ({ isSafeUrl: vi.fn(), safeFetch: vi.fn() }))

import { needsPreview, PREVIEW_RETRY_MS } from '@/lib/previewRule'
import { looksBlocked } from '@/lib/serverScreenshot'
import { parseScreenshot } from '@/lib/pageScreenshot'

const now = Date.parse('2026-10-16T12:00:00Z')
const link = { url: 'https://example.com/a', type: 'link', image_url: null, file_path: null, preview_tried_at: null }

describe('needsPreview', () => {
  it('a link card with no picture that was never tried', () => {
    expect(needsPreview(link, now)).toBe(true)
  })
  it('not when it already has a picture or a stored file', () => {
    expect(needsPreview({ ...link, image_url: 'https://cdn.example.com/a.png' }, now)).toBe(false)
    expect(needsPreview({ ...link, file_path: 'u/shot-1.webp' }, now)).toBe(false)
  })
  it('not for notes, images, social posts or internal note addresses', () => {
    for (const type of ['note', 'image', 'twitter', 'youtube']) expect(needsPreview({ ...link, type }, now)).toBe(false)
    expect(needsPreview({ ...link, url: 'https://smart-bookmark.internal/note-1' }, now)).toBe(false)
  })
  it('at most once a day', () => {
    expect(needsPreview({ ...link, preview_tried_at: new Date(now - 60_000).toISOString() }, now)).toBe(false)
    expect(needsPreview({ ...link, preview_tried_at: new Date(now - PREVIEW_RETRY_MS).toISOString() }, now)).toBe(true)
  })
})

describe('server screenshots', () => {
  it('a refused page or a robot check is never kept as a picture', () => {
    expect(looksBlocked(403, 'Welcome')).toBe(true)
    expect(looksBlocked(200, 'Just a moment...')).toBe(true)
    expect(looksBlocked(200, 'Access Denied')).toBe(true)
    expect(looksBlocked(200, 'Indie Hackers: Work Together to Build Profitable Online Businesses')).toBe(false)
    expect(looksBlocked(null, 'A page')).toBe(false)
  })
})

describe('parseScreenshot', () => {
  it('only accepts a base64 JPEG / PNG / WebP of a sensible size', () => {
    const body = Buffer.alloc(200, 1).toString('base64')
    expect(parseScreenshot(`data:image/jpeg;base64,${body}`)).toBeInstanceOf(Buffer)
    expect(parseScreenshot(`data:image/svg+xml;base64,${body}`)).toBeNull()
    expect(parseScreenshot(`data:image/jpeg;base64,${'A'.repeat(1_500_004)}`)).toBeNull()
    expect(parseScreenshot(42)).toBeNull()
  })
})
