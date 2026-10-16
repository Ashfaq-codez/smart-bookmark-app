import { describe, it, expect, vi, beforeEach } from 'vitest'
import crypto from 'node:crypto'

// The route talks to Supabase and the internet. In tests we replace those with fakes.
vi.mock('@/utils/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('@supabase/supabase-js', () => ({ createClient: vi.fn() }))
vi.mock('@/utils/safeFetch', () => ({ isSafeUrl: vi.fn(), safeFetch: vi.fn() }))
// Never start a real headless Chrome in tests.
vi.mock('@/lib/serverScreenshot', () => ({ screenshotWithReason: vi.fn(async () => ({ shot: null, reason: 'test' })) }))
// In real life the page is read AFTER the answer is sent. In tests we collect that work and run it on demand.
const afterTasks: (() => Promise<void>)[] = []
vi.mock('@/lib/runAfterResponse', () => ({ runAfterResponse: (task: () => Promise<void>) => { afterTasks.push(task) } }))
async function finishBackgroundWork() { while (afterTasks.length) await afterTasks.shift()!() }

import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { isSafeUrl, safeFetch } from '@/utils/safeFetch'
import { POST, OPTIONS } from '@/app/api/save/route'
import { screenshotWithReason } from '@/lib/serverScreenshot'
import { fakeSupabase, FakeOptions } from './helpers/fakeSupabase'

const ORIGIN = 'https://smart-bookmark-app-lime.vercel.app'

// X posts are read from two free sources. `vx` = what vxtwitter answers; the embed source is down unless `syn` is given.
function xFetch(vx: Record<string, unknown>, syn?: unknown) {
  vi.mocked(safeFetch).mockImplementation(async (u: any) =>
    String(u).includes('syndication')
      ? (syn ? new Response(JSON.stringify(syn)) : new Response('', { status: 500 }))
      : new Response(JSON.stringify({ tweetID: '20', ...vx })))
}

function post(body: any, headers: Record<string, string> = {}) {
  return POST(new Request('http://localhost/api/save', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: ORIGIN, ...headers },
    body: JSON.stringify(body),
  }))
}

// Log in as "user-1" (cookie login) and return the recorder
function loggedIn(extra: FakeOptions = {}) {
  const fake = fakeSupabase({ user: { id: 'user-1' }, ...extra })
  vi.mocked(createClient).mockResolvedValue(fake.client as any)
  return fake
}

const PAGE_HTML = `<html><head><title>Fallback title</title>
<meta property="og:title" content="Great Page">
<meta property="og:description" content="About the page">
<meta property="og:image" content="/cover.png">
</head><body></body></html>`

beforeEach(() => {
  afterTasks.length = 0
  vi.mocked(createClient).mockReset()
  vi.mocked(createAdminClient).mockReset()
  vi.mocked(isSafeUrl).mockReset()
  vi.mocked(safeFetch).mockReset()
  vi.mocked(isSafeUrl).mockResolvedValue(false) // by default: no internet access, so tests stay fast and offline
})

describe('POST /api/save: who may save', () => {
  it('rejects a request with no address and no content', async () => {
    loggedIn()
    const res = await post({})
    expect(res.status).toBe(400)
  })

  it('rejects someone who is not logged in', async () => {
    loggedIn({ user: null })
    const res = await post({ url: 'https://example.com' })
    expect(res.status).toBe(401)
    expect((await res.json()).error).toBe('Unauthorized')
  })

  it('rejects an unknown API key', async () => {
    loggedIn()
    vi.mocked(createAdminClient).mockReturnValue(fakeSupabase({ keyRow: null, keyError: { message: 'no rows' } }).client as any)
    const res = await post({ url: 'https://example.com' }, { 'x-api-key': 'not-a-real-key' })
    expect(res.status).toBe(401)
    expect((await res.json()).error).toBe('Invalid API Key')
  })

  it('accepts a valid API key, looks it up by its hash, and saves under that key\'s user', async () => {
    loggedIn({ user: null })
    const admin = fakeSupabase({ keyRow: { user_id: 'key-user' } })
    vi.mocked(createAdminClient).mockReturnValue(admin.client as any)

    const res = await post({ url: 'https://example.com/a', title: 'T' }, { 'x-api-key': 'my-secret-key' })

    expect(res.status).toBe(200)
    const expectedHash = crypto.createHash('sha256').update('my-secret-key').digest('hex')
    expect(admin.eqCalls[0]).toEqual(['token', expectedHash])
    expect(admin.inserted[0].user_id).toBe('key-user')
  })
})

describe('POST /api/save: saving links', () => {
  it('cleans the address (https, no www, no trailing slash) and fills in the defaults', async () => {
    const fake = loggedIn()
    const res = await post({ url: 'https://www.Example.com/page/', title: 'My page' })

    expect(res.status).toBe(200)
    const row = fake.inserted[0]
    expect(row.url).toBe('https://example.com/page')
    expect(row.title).toBe('My page')
    expect(row.type).toBe('link')
    expect(row.tags).toEqual(['auto-saved', 'link'])
    expect(row.category).toBe('Inbox')
    expect(row.user_id).toBe('user-1')
  })

  it('adds https:// when it is missing', async () => {
    const fake = loggedIn()
    await post({ url: 'example.com/a', title: 'T' })
    expect(fake.inserted[0].url).toBe('https://example.com/a')
  })

  it('keeps the folder and sub-folder it was given', async () => {
    const fake = loggedIn()
    await post({ url: 'https://example.com/a', title: 'T', category: 'Design', sub_category: 'UI' })
    expect(fake.inserted[0].category).toBe('Design')
    expect(fake.inserted[0].sub_category).toBe('UI')
  })

  it('does not store the #fragment of a normal link', async () => {
    const fake = loggedIn()
    await post({ url: 'https://example.com/a#top', title: 'T' })
    expect(fake.inserted[0].url).toBe('https://example.com/a')
  })

  it('turns a youtu.be link into a youtube.com watch link of type youtube', async () => {
    const fake = loggedIn()
    await post({ url: 'https://youtu.be/dQw4w9WgXcQ', title: 'T' })
    expect(fake.inserted[0].url).toBe('https://youtube.com/watch?v=dQw4w9WgXcQ')
    expect(fake.inserted[0].type).toBe('youtube')
  })

  it('removes extra parameters from a YouTube watch link', async () => {
    const fake = loggedIn()
    await post({ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PL123&t=30', title: 'T' })
    expect(fake.inserted[0].url).toBe('https://youtube.com/watch?v=dQw4w9WgXcQ')
  })

  it('recognises well-known sites by their address', async () => {
    const cases: [string, string][] = [
      ['https://x.com/jack/status/20', 'twitter'],
      ['https://twitter.com/jack/status/20', 'twitter'],
      ['https://www.instagram.com/p/abc123/', 'instagram'],
      ['https://github.com/user/repo', 'github'],
      ['https://www.linkedin.com/in/someone', 'linkedin'],
      ['https://www.pinterest.com/pin/123/', 'pinterest'],
    ]
    for (const [url, expected] of cases) {
      const fake = loggedIn()
      await post({ url, title: 'T' })
      expect(fake.inserted[0].type).toBe(expected)
      expect(fake.inserted[0].tags).toEqual(['auto-saved', expected])
    }
  })

  it('does not treat look-alike sites (dropbox.com, linux.com, netflix.com) as X, and does treat sub-domains as the site', async () => {
    const cases: [string, string][] = [
      ['https://www.dropbox.com/s/abc', 'link'],
      ['https://linux.com/news', 'link'],
      ['https://www.netflix.com/title/1', 'link'],
      ['https://notgithub.com/x', 'link'],
      ['https://evil.com/?u=https://x.com/a', 'link'],
      ['https://mobile.twitter.com/jack/status/20', 'twitter'],
      ['https://m.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube'],
    ]
    for (const [url, expected] of cases) {
      const fake = loggedIn()
      await post({ url, title: 'T' })
      expect(fake.inserted[0].type).toBe(expected)
    }
  })

  it('reports a link that is already saved and does not save it again', async () => {
    const fake = loggedIn({ existing: { id: 7, title: 'Old', url: 'https://example.com/a' } })
    const res = await post({ url: 'https://example.com/a', title: 'T' })
    const json = await res.json()
    expect(res.status).toBe(409)
    expect(json.error).toBe('Duplicate entry')
    expect(json.existing.id).toBe(7)
    expect(fake.inserted).toHaveLength(0)
  })

  it('also answers 409 when the database itself rejects a duplicate', async () => {
    loggedIn({ insertError: { code: '23505', message: 'duplicate key' } })
    const res = await post({ url: 'https://example.com/a', title: 'T' })
    expect(res.status).toBe(409)
  })

  it('answers 500 for any other database error', async () => {
    loggedIn({ insertError: { code: 'XX000', message: 'boom' } })
    const res = await post({ url: 'https://example.com/a', title: 'T' })
    expect(res.status).toBe(500)
    expect((await res.json()).error).toBe('Server Error')
  })
})

describe('POST /api/save: reading the page (after saving)', () => {
  it('saves straight away with the address as a placeholder title, without reading the page first', async () => {
    vi.mocked(isSafeUrl).mockResolvedValue(true)
    vi.mocked(safeFetch).mockResolvedValue(new Response(PAGE_HTML, { status: 200 }))
    const fake = loggedIn()

    const res = await post({ url: 'https://example.com/a' })

    expect(res.status).toBe(200)
    expect(fake.inserted[0].title).toBe('https://example.com/a')
    expect(safeFetch).not.toHaveBeenCalled()
  })

  it('then fills in the title, description and image from the page', async () => {
    vi.mocked(isSafeUrl).mockResolvedValue(true)
    vi.mocked(safeFetch).mockResolvedValue(new Response(PAGE_HTML, { status: 200 }))
    const fake = loggedIn()

    await post({ url: 'https://example.com/a' })
    await finishBackgroundWork()

    expect(fake.updates).toHaveLength(1)
    // the picture couldn't be copied here (the test page answers HTML), so its own address is kept
    expect(fake.updates[0].patch).toEqual({
      title: 'Great Page',
      description: 'About the page',
      image_url: 'https://example.com/cover.png',
      preview_tried_at: expect.any(String),
    })
    // only ever changes this person's own row
    expect(fake.updates[0].filters).toEqual([['id', 1], ['user_id', 'user-1']])
  })

  it('uses the picture the browser saw when the server got a title but no picture', async () => {
    vi.mocked(isSafeUrl).mockResolvedValue(true)
    vi.mocked(safeFetch).mockResolvedValue(new Response('<html><head><title>Shop item</title></head></html>', { status: 200 }))
    const fake = loggedIn()
    await post({ url: 'https://shop.example.com/1', page: { title: 'Shop item', image: 'https://cdn.example.com/p.jpg' } })
    await finishBackgroundWork()
    expect(fake.updates[0].patch).toMatchObject({ title: 'Shop item', image_url: 'https://cdn.example.com/p.jpg' })
  })

  it('keeps the extension screenshot (as our own WebP) only when the page has no picture at all', async () => {
    const sharp = (await import('sharp')).default
    const jpeg = await sharp({ create: { width: 800, height: 600, channels: 3, background: '#4d6a51' } }).jpeg().toBuffer()
    const shot = `data:image/jpeg;base64,${jpeg.toString('base64')}`
    vi.mocked(isSafeUrl).mockResolvedValue(true)
    vi.mocked(safeFetch).mockImplementation(async () => new Response('<html><head><title>No picture</title></head></html>', { status: 200 }))
    const fake = loggedIn()
    await post({ url: 'https://plain.example.com/a', page: { title: 'No picture' }, screenshot: shot })
    await finishBackgroundWork()
    expect(fake.uploads).toHaveLength(1)
    expect(fake.uploads[0].path).toMatch(/^user-1\/shot-[0-9a-f-]{36}\.webp$/)
    expect(fake.uploads[0].contentType).toBe('image/webp')
    expect(fake.updates[0].patch).toMatchObject({ image_url: `https://storage.test/attachments/${fake.uploads[0].path}`, file_path: fake.uploads[0].path })

    // a page with its own picture: that picture is copied to our storage and the screenshot is ignored
    const cover = await sharp({ create: { width: 600, height: 315, channels: 3, background: '#123456' } }).png().toBuffer()
    const fake2 = loggedIn()
    vi.mocked(safeFetch).mockImplementation(async (u: any) => String(u).endsWith('/cover.png')
      ? new Response(cover, { status: 200, headers: { 'content-type': 'image/png' } })
      : new Response(PAGE_HTML, { status: 200 }))
    await post({ url: 'https://example.com/b', page: { title: 'x' }, screenshot: shot })
    await finishBackgroundWork()
    expect(fake2.uploads).toHaveLength(1)
    expect(fake2.uploads[0].path).toMatch(/^user-1\/img-/)
    const sent = vi.mocked(safeFetch).mock.calls.find(([u]) => String(u).endsWith('/cover.png'))!
    expect((sent[1] as any).headers.Referer).toBe('https://example.com/b')   // looks like the page itself showing it
    expect(fake2.updates[0].patch.image_url).toBe(`https://storage.test/attachments/${fake2.uploads[0].path}`)
  })

  it('takes our own screenshot when nothing has a picture and the extension sent none (phone saves)', async () => {
    const sharp = (await import('sharp')).default
    vi.mocked(screenshotWithReason).mockResolvedValueOnce({ shot: await sharp({ create: { width: 1280, height: 960, channels: 3, background: '#fff' } }).jpeg().toBuffer(), reason: 'ok' })
    vi.mocked(isSafeUrl).mockResolvedValue(true)
    vi.mocked(safeFetch).mockResolvedValue(new Response('<html><head><title>Plain</title></head></html>', { status: 200 }))
    const fake = loggedIn()
    await post({ url: 'https://plain.example.com/c' })
    await finishBackgroundWork()
    expect(screenshotWithReason).toHaveBeenCalledWith('https://plain.example.com/c')
    expect(fake.uploads[0].path).toMatch(/^user-1\/shot-/)
    expect(fake.updates[0].patch).toMatchObject({ image_url: expect.stringContaining('/shot-'), file_path: fake.uploads[0].path, preview_tried_at: expect.any(String) })
  })

  it('ignores a screenshot that is not a picture', async () => {
    vi.mocked(isSafeUrl).mockResolvedValue(true)
    vi.mocked(safeFetch).mockResolvedValue(new Response('<html><head><title>T</title></head></html>', { status: 200 }))
    const fake = loggedIn()
    await post({ url: 'https://plain.example.com/a', screenshot: `data:image/png;base64,${Buffer.from('<svg onload=alert(1)>'.repeat(20)).toString('base64')}` })
    await post({ url: 'https://plain.example.com/b', screenshot: 'data:text/html;base64,PGgxPg==' })
    await finishBackgroundWork()
    expect(fake.uploads).toHaveLength(0)
    expect(fake.updates.every((u) => !u.patch.image_url)).toBe(true)
  })

  it('keeps the title it was given and never overwrites it', async () => {
    vi.mocked(isSafeUrl).mockResolvedValue(true)
    vi.mocked(safeFetch).mockResolvedValue(new Response(PAGE_HTML, { status: 200 }))
    const fake = loggedIn()

    await post({ url: 'https://example.com/a', title: 'My own title' })
    await finishBackgroundWork()

    expect(fake.inserted[0].title).toBe('My own title')
    expect(fake.updates[0].patch.title).toBe(undefined)
    expect(fake.updates[0].patch.description).toBe('About the page')
  })

  it('keeps the page address as the title when the page cannot be read', async () => {
    vi.mocked(isSafeUrl).mockResolvedValue(true)
    vi.mocked(safeFetch).mockRejectedValue(new Error('network down'))
    const fake = loggedIn()

    const res = await post({ url: 'https://example.com/a' })
    await finishBackgroundWork()

    expect(res.status).toBe(200)
    expect(fake.inserted[0].title).toBe('https://example.com/a')
    // only "a picture was looked for" is noted (the card tries again tomorrow)
    expect(fake.updates).toHaveLength(1)
    expect(Object.keys(fake.updates[0].patch)).toEqual(['preview_tried_at'])
  })

  it('does not break if the later update fails', async () => {
    vi.mocked(isSafeUrl).mockResolvedValue(true)
    vi.mocked(safeFetch).mockResolvedValue(new Response(PAGE_HTML, { status: 200 }))
    const fake = loggedIn({ updateError: { message: 'db hiccup' } })

    const res = await post({ url: 'https://example.com/a' })
    await finishBackgroundWork()
    expect(res.status).toBe(200)
    expect(fake.updates).toHaveLength(1)
  })

  it('never fetches private or local addresses, but still saves them', async () => {
    vi.mocked(isSafeUrl).mockResolvedValue(false)
    const fake = loggedIn()

    const res = await post({ url: 'http://192.168.1.10/admin' })
    await finishBackgroundWork()
    expect(res.status).toBe(200)
    expect(safeFetch).not.toHaveBeenCalled()
    expect(fake.inserted[0].title).toBe('http://192.168.1.10/admin')
    expect(fake.updates.every((u) => Object.keys(u.patch).join() === 'preview_tried_at')).toBe(true)
  })

  it('does not read the page for notes or images', async () => {
    vi.mocked(isSafeUrl).mockResolvedValue(true)
    loggedIn()
    await post({ type: 'note', content: '<p>x</p>' })
    await post({ type: 'image', url: 'https://cdn.example.com/a.png' })
    await finishBackgroundWork()
    expect(safeFetch).not.toHaveBeenCalled()
  })
})

describe('POST /api/save: notes and files', () => {
  it('saves a note with its text, no title, and a made-up internal address', async () => {
    const fake = loggedIn()
    const res = await post({ type: 'note', content: '<p>Hello</p>' })

    expect(res.status).toBe(200)
    const row = fake.inserted[0]
    expect(row.type).toBe('note')
    expect(row.content).toBe('<p>Hello</p>')
    expect(row.title).toBe('')
    expect(row.url.startsWith('https://smart-bookmark.internal/note-')).toBe(true)
    expect(row.tags).toEqual(['auto-saved', 'note'])
  })

  it('keeps the #fragment for notes (used for "text fragment" saves from the extension)', async () => {
    const fake = loggedIn()
    await post({ type: 'note', url: 'https://www.example.com/page#:~:text=hi', content: '<p>x</p>' })
    expect(fake.inserted[0].url).toBe('https://example.com/page#:~:text=hi')
  })

  it('does not save the same note text twice for the same address', async () => {
    const fake = loggedIn({ existing: { id: 3, title: '', url: 'https://example.com/a' } })
    const res = await post({ type: 'note', url: 'https://example.com/a', content: '<p>x</p>' })
    expect(res.status).toBe(409)
    expect(fake.inserted).toHaveLength(0)
  })

  it('finds duplicate notes by their short fingerprint, not by comparing the whole text', async () => {
    const fake = loggedIn()
    await post({ type: 'note', url: 'https://example.com/a', content: '<p>x</p>' })
    const fp = crypto.createHash('sha256').update('<p>x</p>').digest('hex').slice(0, 16)
    expect(fake.bookmarkFilters).toContainEqual(['content_fp', fp])
    expect(fake.bookmarkFilters.some(([col]) => col === 'content')).toBe(false)
  })

  it('also checks for duplicates when a note arrives without an address', async () => {
    const fake = loggedIn({ existing: { id: 3, title: '', url: 'https://smart-bookmark.internal/note-1' } })
    const res = await post({ type: 'note', content: '<p>x</p>' })
    expect(res.status).toBe(409)
    expect(fake.inserted).toHaveLength(0)
  })

  it('fingerprints the cleaned text, because that is what gets stored', async () => {
    const fake = loggedIn()
    await post({ type: 'note', content: '<p onclick="x()">Hi</p><script>alert(1)</script>' })
    const fp = crypto.createHash('sha256').update('<p>Hi</p>').digest('hex').slice(0, 16)
    expect(fake.bookmarkFilters).toContainEqual(['content_fp', fp])
  })

  it('never writes content_fp (the database fills it in)', async () => {
    const fake = loggedIn()
    await post({ type: 'note', content: '<p>x</p>' })
    expect(fake.inserted[0]).not.toHaveProperty('content_fp')
  })

  it('gives saved images a default title', async () => {
    const fake = loggedIn()
    await post({ type: 'image', url: 'https://cdn.example.com/a.png' })
    expect(fake.inserted[0].title).toBe('Saved Image')
    expect(fake.inserted[0].type).toBe('image')
  })
})

describe('cross-origin (CORS) headers', () => {
  it('answers the browser pre-check for an allowed origin', async () => {
    const res = await OPTIONS(new Request('http://localhost/api/save', { method: 'OPTIONS', headers: { origin: ORIGIN } }))
    expect(res.status).toBe(204)
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN)
  })

  it('does not echo an unknown origin back', async () => {
    const res = await OPTIONS(new Request('http://localhost/api/save', { method: 'OPTIONS', headers: { origin: 'https://evil.example' } }))
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN)
  })

  it('adds the headers to normal responses too', async () => {
    loggedIn()
    const res = await post({ url: 'https://example.com/a', title: 'T' })
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN)
  })
})

describe('POST /api/save: safer saving', () => {
  it('cleans dangerous HTML out of a note before storing it', async () => {
    const fake = loggedIn()
    const res = await post({ type: 'note', content: '<p onclick="x()">Hi</p><script>alert(1)</script><img src=x onerror=alert(1)>' })
    expect(res.status).toBe(200)
    expect(fake.inserted[0].content).toBe('<p>Hi</p>')
  })

  it('refuses a note that is far too long', async () => {
    const fake = loggedIn()
    const res = await post({ type: 'note', content: 'a'.repeat(200_001) })
    expect(res.status).toBe(413)
    expect(fake.inserted).toHaveLength(0)
  })

  it('refuses content that is not text', async () => {
    const fake = loggedIn()
    const res = await post({ type: 'note', content: { evil: true } })
    expect(res.status).toBe(400)
    expect(fake.inserted).toHaveLength(0)
  })

  it('stops at 60 saves in a minute with a 429 and a Retry-After', async () => {
    const fake = loggedIn({ recentCount: 60 })
    const res = await post({ url: 'https://example.com' })
    expect(res.status).toBe(429)
    expect(res.headers.get('Retry-After')).toBe('60')
    expect(fake.inserted).toHaveLength(0)
  })

  it('still allows the 60th save (59 already made)', async () => {
    const fake = loggedIn({ recentCount: 59 })
    const res = await post({ url: 'https://example.com' })
    expect(res.status).toBe(200)
    expect(fake.inserted).toHaveLength(1)
  })

  it('lets the save through if the limit check itself fails', async () => {
    const fake = loggedIn({ countError: { message: 'db down' }, recentCount: 999 })
    const res = await post({ url: 'https://example.com' })
    expect(res.status).toBe(200)
    expect(fake.inserted).toHaveLength(1)
  })
})

describe('POST /api/save: social types, titles and notes', () => {
  it('treats a client-sent social type on a normal URL as a plain link', async () => {
    const fake = loggedIn()
    await post({ url: 'https://example.com/a', type: 'twitter', title: 'T' })
    expect(fake.inserted[0].type).toBe('link')
  })

  it('derives the type from the URL, ignoring a wrong client type', async () => {
    const fake = loggedIn()
    await post({ url: 'https://x.com/jack/status/20', type: 'youtube' })
    expect(fake.inserted[0].type).toBe('twitter')
  })

  it('ignores the client title for social links and stores the canonical X address', async () => {
    const fake = loggedIn()
    await post({ url: 'https://twitter.com/jack/status/20?s=20', title: '(3) Jack on X / X' })
    expect(fake.inserted[0].url).toBe('https://x.com/jack/status/20')
    expect(fake.inserted[0].title).toBe('https://x.com/jack/status/20')
  })

  it('fills in a social title from the post even though the client sent one', async () => {
    const fake = loggedIn()
    vi.mocked(isSafeUrl).mockResolvedValue(true)
    xFetch({ text: 'hi', user_name: 'Jack', user_screen_name: 'jack' })
    await post({ url: 'https://x.com/jack/status/20', title: 'Tab title / X' })
    await finishBackgroundWork()
    expect(fake.updates[0].patch.title).toBe('Jack on X: hi')
  })

  it('cleans titles of other links', async () => {
    const fake = loggedIn()
    await post({ url: 'https://example.com/a', title: '(2) My page / X' })
    expect(fake.inserted[0].title).toBe('My page')
  })

  it('saves a selection sent with a social URL as the personal note and still enriches', async () => {
    const fake = loggedIn()
    vi.mocked(isSafeUrl).mockResolvedValue(true)
    xFetch({ text: 'post text', user_name: 'Jack', user_screen_name: 'jack' })
    await post({ url: 'https://x.com/jack/status/20?s=20', type: 'note', content: '<p>my <b>thought</b></p>', title: 'x' })
    const row = fake.inserted[0]
    expect(row.type).toBe('twitter')
    expect(row.content).toBe('my thought')
    expect(row.description).toBe(null)
    await finishBackgroundWork()
    expect(fake.updates[0].patch.description).toBe('post text')
  })

  it('still saves a selection on a normal page as a note', async () => {
    const fake = loggedIn()
    await post({ url: 'https://example.com/a', type: 'note', content: '<p>x</p>' })
    expect(fake.inserted[0].type).toBe('note')
  })

  it('treats an older ?s= save of the same X post as a duplicate', async () => {
    loggedIn({ existing: { id: 5, title: 'Old', url: 'https://x.com/jack/status/20?s=20' } })
    const res = await post({ url: 'https://x.com/jack/status/20' })
    expect(res.status).toBe(409)
  })
})

describe('POST /api/save: API-key path is scoped to the key\'s user', () => {
  it('scopes every bookmark read, insert and update by the key\'s user_id', async () => {
    loggedIn({ user: null })
    const admin = fakeSupabase({ keyRow: { user_id: 'key-user' } })
    vi.mocked(createAdminClient).mockReturnValue(admin.client as any)
    vi.mocked(isSafeUrl).mockResolvedValue(true)
    vi.mocked(safeFetch).mockResolvedValue(new Response(PAGE_HTML))

    await post({ url: 'https://example.com/a' }, { 'x-api-key': 'k' })
    await finishBackgroundWork()

    expect(admin.bookmarkFilters.length).toBeGreaterThan(0)
    expect(admin.bookmarkFilters.every(([c, v]) => c !== 'user_id' || v === 'key-user')).toBe(true)
    expect(admin.bookmarkFilters.some(([c]) => c === 'user_id')).toBe(true)
    expect(admin.inserted[0].user_id).toBe('key-user')
    expect(admin.updates[0].filters).toContainEqual(['user_id', 'key-user'])
    expect(admin.updates[0].filters).toContainEqual(['id', 1])
  })
})

describe('POST /api/save: X duplicates by status ID', () => {
  it('looks for the same status ID under any handle, /i/ and twitter.com included', async () => {
    const fake = loggedIn()
    await post({ url: 'https://x.com/jack/status/20' })
    const or = fake.orFilters.find(f => f.includes('/status/20'))!
    expect(or).toBeTruthy()
    for (const h of ['x.com', 'twitter.com', 'mobile.twitter.com'])
      expect(or).toContain(`url.ilike.%://${h}/%/status/20`)
    expect(or).toContain('/status/20?%')
  })

  it('a /i/status/<id> save is a duplicate of a saved handle URL', async () => {
    loggedIn({ existing: { id: 5, title: 'Old', url: 'https://x.com/jack/status/20' } })
    const res = await post({ url: 'https://x.com/i/status/20' })
    expect(res.status).toBe(409)
  })

  it('upgrades an /i/status/<id> address to the full handle form once the post is read', async () => {
    const fake = loggedIn()
    vi.mocked(isSafeUrl).mockResolvedValue(true)
    xFetch({ text: 'hi', user_name: 'Jack', user_screen_name: 'jack' })
    await post({ url: 'https://x.com/i/status/20' })
    await finishBackgroundWork()
    expect(fake.updates[0].patch.url).toBe('https://x.com/jack/status/20')
    expect(fake.updates[0].filters).toContainEqual(['user_id', 'user-1'])
  })

  it('keeps the /i/status address but still fills details when the handle URL is already saved', async () => {
    const fake = loggedIn({ updateError: (p: any) => (p.url ? { code: '23505', message: 'dup' } : null) })
    vi.mocked(isSafeUrl).mockResolvedValue(true)
    xFetch({ text: 'hi', user_name: 'Jack', user_screen_name: 'jack' })
    await post({ url: 'https://x.com/i/status/20' })
    await finishBackgroundWork()
    expect(fake.updates).toHaveLength(2)
    expect(fake.updates[1].patch.url).toBe(undefined)
    expect(fake.updates[1].patch.title).toBe('Jack on X: hi')
    expect(fake.updates[1].filters).toContainEqual(['user_id', 'user-1'])
  })

  it('leaves a handle address as it is', async () => {
    const fake = loggedIn()
    vi.mocked(isSafeUrl).mockResolvedValue(true)
    xFetch({ text: 'hi', user_name: 'Jack', user_screen_name: 'jack' })
    await post({ url: 'https://x.com/jack/status/20' })
    await finishBackgroundWork()
    expect(fake.updates[0].patch.url).toBe(undefined)
  })

  it('ignores a handle that is not a valid X handle', async () => {
    const fake = loggedIn()
    vi.mocked(isSafeUrl).mockResolvedValue(true)
    xFetch({ text: 'hi', user_name: 'J', user_screen_name: 'bad/handle' })
    await post({ url: 'https://x.com/i/status/20' })
    await finishBackgroundWork()
    expect(fake.updates[0].patch.url).toBe(undefined)
  })
})

describe('POST /api/save: Instagram capture from the extension', () => {
  const IMG = 'https://scontent-icn2-1.cdninstagram.com/v/t51/abc.jpg?stp=x'
  const capture = { handle: 'nasa', caption: 'Line one\nLine two', image_url: IMG, is_video: false }

  async function jpeg(w: number, h: number) {
    const sharp = (await import('sharp')).default
    return sharp({ create: { width: w, height: h, channels: 3, background: '#88aacc' } }).jpeg().toBuffer()
  }

  it('uses the captured handle and caption for the title and description', async () => {
    const fake = loggedIn()
    await post({ url: 'https://www.instagram.com/p/ABCdef123/', capture })
    expect(fake.inserted[0].url).toBe('https://instagram.com/p/ABCdef123')
    expect(fake.inserted[0].title).toBe('nasa on Instagram: Line one')
    expect(fake.inserted[0].description).toBe('Line one\nLine two')
  })

  it('ignores a capture sent with a non-Instagram address', async () => {
    const fake = loggedIn()
    await post({ url: 'https://example.com/p/ABCdef123', capture })
    expect(fake.inserted[0].title).not.toContain('Instagram')
    expect(fake.inserted[0].description).toBe(null)
  })

  it('ignores a capture for an Instagram address that is not a post', async () => {
    const fake = loggedIn()
    await post({ url: 'https://www.instagram.com/nasa/', capture })
    expect(fake.inserted[0].title).not.toContain('on Instagram')
  })

  it('drops an invalid handle and a picture that is not on the Instagram CDN', async () => {
    const fake = loggedIn()
    await post({ url: 'https://instagram.com/reel/ABCdef123', capture: { handle: 'bad handle!', caption: 'Hi', image_url: 'https://evil.example/x.jpg' } })
    expect(fake.inserted[0].title).toBe('Post on Instagram: Hi')
    await finishBackgroundWork()
    expect(fake.uploads).toHaveLength(0)
    // no usable handle from the extension: the server falls back to reading the post page (never the bad picture)
    for (const call of vi.mocked(safeFetch).mock.calls) expect(String(call[0])).not.toContain('evil.example')
  })

  it('copies the picture into storage as a resized WebP and links it to the bookmark', async () => {
    const fake = loggedIn()
    vi.mocked(safeFetch).mockResolvedValue(new Response(await jpeg(3000, 2000), { headers: { 'content-type': 'image/jpeg' } }))
    await post({ url: 'https://www.instagram.com/p/ABCdef123/', capture })
    await finishBackgroundWork()
    expect(fake.uploads).toHaveLength(1)
    expect(fake.uploads[0].path).toMatch(/^user-1\/ig-[0-9a-f-]{36}\.webp$/)
    expect(fake.uploads[0].contentType).toBe('image/webp')
    expect(fake.updates[0].patch.image_url).toBe(`https://storage.test/attachments/${fake.uploads[0].path}`)
    expect(fake.updates[0].patch.file_path).toBe(fake.uploads[0].path)
    expect(fake.updates[0].filters).toContainEqual(['user_id', 'user-1'])
    const sharp = (await import('sharp')).default
    const meta = await sharp(fake.uploads[0].data).metadata()
    expect(meta.format).toBe('webp')
    expect(meta.width).toBe(1600)
    expect(meta.height).toBe(1067)
  })

  it('never fetches Instagram itself when a capture is present', async () => {
    loggedIn()
    vi.mocked(isSafeUrl).mockResolvedValue(true)
    vi.mocked(safeFetch).mockResolvedValue(new Response('not an image', { headers: { 'content-type': 'text/html' } }))
    await post({ url: 'https://www.instagram.com/p/ABCdef123/', capture })
    await finishBackgroundWork()
    for (const call of vi.mocked(safeFetch).mock.calls) expect(String(call[0])).not.toContain('instagram.com/p/')
  })

  it('marks a video post with a "video" tag and stores only the poster', async () => {
    const fake = loggedIn()
    vi.mocked(safeFetch).mockResolvedValue(new Response(await jpeg(640, 640), { headers: { 'content-type': 'image/jpeg' } }))
    await post({ url: 'https://www.instagram.com/reel/ABCdef123/', capture: { ...capture, is_video: true } })
    expect(fake.inserted[0].tags).toContain('video')
    await finishBackgroundWork()
    expect(fake.uploads).toHaveLength(1)
    expect(vi.mocked(safeFetch)).toHaveBeenCalledTimes(1)
    expect(String(vi.mocked(safeFetch).mock.calls[0][0])).toBe(IMG)
  })

  it('keeps the save when the picture cannot be copied', async () => {
    const fake = loggedIn({ uploadError: { message: 'full' } })
    vi.mocked(safeFetch).mockResolvedValue(new Response(await jpeg(100, 100), { headers: { 'content-type': 'image/jpeg' } }))
    const res = await post({ url: 'https://www.instagram.com/p/ABCdef123/', capture })
    expect(res.status).toBe(200)
    await finishBackgroundWork()
    // no picture copy, but the post's handle is still stored
    expect(fake.updates).toHaveLength(1)
    expect(fake.updates[0].patch.image_url).toBe(undefined)
    expect(fake.updates[0].patch.post_data).toMatchObject({ platform: 'instagram', handle: 'nasa', handle_source: 'extension' })
  })
})

describe('POST /api/save: Reddit links shared from the phone apps', () => {
  const POST_URL = 'https://www.reddit.com/r/privacy/comments/1kpib8z/reddit_generates_a_new_link_every_time_you_click/?share_id=NHEBxfK3Flk8AopTLzby_&utm_content=1&utm_medium=ios_app&utm_source=share'

  it('a share link (r/<sub>/s/<code>) from the iPhone Shortcut is saved as the real post', async () => {
    const admin = fakeSupabase({ keyRow: { user_id: 'key-user' } })
    vi.mocked(createAdminClient).mockReturnValue(admin.client as any)
    vi.mocked(isSafeUrl).mockResolvedValue(true)
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 301, headers: { location: POST_URL } }))
    try {
      const res = await post({ url: 'https://www.reddit.com/r/privacy/s/XaJ5kGdbva' }, { 'x-api-key': 'my-secret-key' })
      expect(res.status).toBe(200)
      expect(admin.inserted[0].url).toBe('https://www.reddit.com/r/privacy/comments/1kpib8z/reddit_generates_a_new_link_every_time_you_click/')
      expect(admin.inserted[0].type).toBe('reddit')
      expect(fetchSpy.mock.calls[0][1]).toMatchObject({ redirect: 'manual' })
    } finally {
      fetchSpy.mockRestore()
    }
  })

  it('a full post address with the app\'s tracking is cleaned', async () => {
    const fake = loggedIn()
    await post({ url: POST_URL })
    expect(fake.inserted[0].url).toBe('https://www.reddit.com/r/privacy/comments/1kpib8z/reddit_generates_a_new_link_every_time_you_click/')
  })

  it('if the share link can\'t be resolved, it is still saved as given', async () => {
    const fake = loggedIn()
    vi.mocked(isSafeUrl).mockResolvedValue(true)
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 403 }))
    try {
      const res = await post({ url: 'https://www.reddit.com/r/privacy/s/XaJ5kGdbva' })
      expect(res.status).toBe(200)
      expect(fake.inserted[0].url).toBe('https://reddit.com/r/privacy/s/XaJ5kGdbva')
    } finally {
      fetchSpy.mockRestore()
    }
  })
})

describe('POST /api/save: the iPhone Shortcut sends the page its phone downloaded', () => {
  const fx = (p: string) => require('node:fs').readFileSync(require('node:path').resolve(__dirname, 'fixtures', p), 'utf8')
  const keyUser = () => {
    const admin = fakeSupabase({ keyRow: { user_id: 'key-user' } })
    vi.mocked(createAdminClient).mockReturnValue(admin.client as any)
    return admin
  }

  it('Reddit share link refused by Reddit on the server: the phone\'s page names the post', async () => {
    const admin = keyUser()
    vi.mocked(isSafeUrl).mockResolvedValue(true)
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 403 }))
    try {
      const page = '<html><head><meta property="og:url" content="https://www.reddit.com/r/FuckFlipkart/comments/1x6f3fj/think_twice_before_ordering_electronic_goods_from/"></head><body>…</body></html>'
      await post({ url: 'https://reddit.com/r/FuckFlipkart/s/4NbUHiHedN', page_html: page }, { 'x-api-key': 'k' })
      expect(admin.inserted[0].url).toBe('https://www.reddit.com/r/FuckFlipkart/comments/1x6f3fj/think_twice_before_ordering_electronic_goods_from/')
      expect(admin.inserted[0].type).toBe('reddit')
    } finally {
      fetchSpy.mockRestore()
    }
  })

  it('a page naming a different site never changes a Reddit share link into something else', async () => {
    const admin = keyUser()
    vi.mocked(isSafeUrl).mockResolvedValue(true)
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 403 }))
    try {
      await post({ url: 'https://reddit.com/r/FuckFlipkart/s/4NbUHiHedN', page_html: '<html><head><meta property="og:url" content="https://evil.example/x"></head><body>xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx</body></html>' }, { 'x-api-key': 'k' })
      expect(admin.inserted[0].url).toBe('https://reddit.com/r/FuckFlipkart/s/4NbUHiHedN')
    } finally {
      fetchSpy.mockRestore()
    }
  })

  it('Medium on its own domain (ai.plainenglish.io), refused to the server: the phone\'s page gives the Medium card', async () => {
    const admin = keyUser()
    vi.mocked(isSafeUrl).mockResolvedValue(true)
    vi.mocked(safeFetch).mockResolvedValue(new Response('', { status: 403 }))
    await post({ url: 'https://ai.plainenglish.io/10-ai-tools-everyone-will-be-using-in-six-months-but-almost-nobodys-found-yet-735a5471ea22', page_html: fx('articles/medium.html') }, { 'x-api-key': 'k' })
    await finishBackgroundWork()
    const patch = admin.updates[0].patch
    expect(patch.title).toBe('Welcome to Medium')
    expect(patch.post_data).toMatchObject({ platform: 'medium', author: 'Ev Williams', read_minutes: 3 })
    expect(patch.image_url).toMatch(/^https:\/\/miro\.medium\.com\//)
  })

  it('LinkedIn refused to the server: the phone\'s page gives the post', async () => {
    const admin = keyUser()
    vi.mocked(isSafeUrl).mockResolvedValue(true)
    vi.mocked(safeFetch).mockResolvedValue(new Response('', { status: 429 }))
    await post({ url: 'https://www.linkedin.com/posts/satyanadella_a-couple-reflections-on-the-quantum-computing-activity-7298008744133595140-a6YV', page_html: fx('linkedin/post.html') }, { 'x-api-key': 'k' })
    await finishBackgroundWork()
    expect(admin.updates[0].patch.post_data).toMatchObject({ platform: 'linkedin', author: { name: 'Satya Nadella' } })
  })

  it('without the page (older Shortcut) nothing changes', async () => {
    const admin = keyUser()
    await post({ url: 'https://example.com/a' }, { 'x-api-key': 'k' })
    expect(admin.inserted[0].url).toBe('https://example.com/a')
  })
})
