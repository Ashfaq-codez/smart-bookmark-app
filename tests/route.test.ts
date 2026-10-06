import { describe, it, expect, vi, beforeEach } from 'vitest'
import crypto from 'node:crypto'

// The route talks to Supabase and the internet. In tests we replace those with fakes.
vi.mock('@/utils/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('@supabase/supabase-js', () => ({ createClient: vi.fn() }))
vi.mock('@/utils/safeFetch', () => ({ isSafeUrl: vi.fn(), safeFetch: vi.fn() }))

import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { isSafeUrl, safeFetch } from '@/utils/safeFetch'
import { POST, OPTIONS } from '@/app/api/save/route'
import { fakeSupabase, FakeOptions } from './helpers/fakeSupabase'

const ORIGIN = 'https://smart-bookmark-app-lime.vercel.app'

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

  // KNOWN BUG: the route checks host.includes('x.com'), so any address ending in x.com is treated as an X post.
  // "it.fails" means: this test passes while the bug exists, and starts failing once it is fixed (then remove ".fails").
  it.fails('does not treat dropbox.com as an X (Twitter) post', async () => {
    const fake = loggedIn()
    await post({ url: 'https://www.dropbox.com/s/abc', title: 'T' })
    expect(fake.inserted[0].type).toBe('link')
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

describe('POST /api/save: reading the page', () => {
  it('takes the title, description and image from the page', async () => {
    vi.mocked(isSafeUrl).mockResolvedValue(true)
    vi.mocked(safeFetch).mockResolvedValue(new Response(PAGE_HTML, { status: 200 }))
    const fake = loggedIn()

    await post({ url: 'https://example.com/a' })

    const row = fake.inserted[0]
    expect(row.title).toBe('Great Page')
    expect(row.description).toBe('About the page')
    expect(row.image_url).toBe('https://example.com/cover.png')
  })

  it('prefers the title it was given over the page title', async () => {
    vi.mocked(isSafeUrl).mockResolvedValue(true)
    vi.mocked(safeFetch).mockResolvedValue(new Response(PAGE_HTML, { status: 200 }))
    const fake = loggedIn()

    await post({ url: 'https://example.com/a', title: 'My own title' })
    expect(fake.inserted[0].title).toBe('My own title')
  })

  it('still saves, using the address as the title, when the page cannot be fetched', async () => {
    vi.mocked(isSafeUrl).mockResolvedValue(true)
    vi.mocked(safeFetch).mockRejectedValue(new Error('network down'))
    const fake = loggedIn()

    const res = await post({ url: 'https://example.com/a' })
    expect(res.status).toBe(200)
    expect(fake.inserted[0].title).toBe('https://example.com/a')
  })

  it('never fetches private or local addresses, but still saves them', async () => {
    vi.mocked(isSafeUrl).mockResolvedValue(false)
    const fake = loggedIn()

    const res = await post({ url: 'http://192.168.1.10/admin' })
    expect(res.status).toBe(200)
    expect(safeFetch).not.toHaveBeenCalled()
    expect(fake.inserted[0].title).toBe('Saved Item')
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
