import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

vi.mock('@/utils/safeFetch', () => ({ isSafeUrl: vi.fn(), safeFetch: vi.fn() }))
vi.mock('@/utils/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('@/lib/admin', () => ({ isAdmin: (id?: string | null) => id === 'owner' }))
import { createClient } from '@/utils/supabase/server'
import { GET, POST } from '@/app/api/admin/instagram-images/route'
import { safeFetch } from '@/utils/safeFetch'
import { isInstagramPostImage, instagramLinkExpiry, storeInstagramImage, replaceInstagramImage } from '@/lib/instagramCapture'
import { enrichSocialPost } from '@/lib/enrichSocialPost'
import { imagePlan, sortRows, recoverFromPage, type ImageRow } from '@/lib/instagramImageBackfill'
import { fakeSupabase } from './helpers/fakeSupabase'

const page = (name: string) => fs.readFileSync(path.resolve(__dirname, 'fixtures/instagram', name), 'utf8')
const ogImage = (html: string) => html.match(/og:image" content="([^"]*)/)![1].replace(/&amp;/g, '&')

// Real addresses from real saved pages.
const POST_URL = 'https://instagram.com/p/DeeKFPmNo0L'
const EXPIRED = ogImage(page('post.html'))           // oe=6AD694CA: ended 2026-10-19 22:08 UTC
const LOGO = ogImage(page('login-wall.html'))        // static.cdninstagram.com/rsrc.php/…png
const STORAGE = 'https://proj.supabase.co'
const OURS = `${STORAGE}/storage/v1/object/public/attachments/user-1/ig-old.webp`
const NOW = Date.parse('2026-10-21T12:00:00Z')
const withExpiry = (url: string, at: number) => url.replace(/oe=[0-9A-F]+/, `oe=${Math.floor(at / 1000).toString(16).toUpperCase()}`)

let photo: Buffer
beforeAll(async () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = STORAGE
  photo = await sharp({ create: { width: 1440, height: 1800, channels: 3, background: '#7a5' } }).jpeg().toBuffer()
})
beforeEach(() => { vi.mocked(safeFetch).mockReset() })

// Instagram answers by address: post pages are HTML, cdn addresses the picture.
function instagram(pages: Record<string, string | number>, picture: 'ok' | number = 'ok') {
  vi.mocked(safeFetch).mockImplementation(async (input: any) => {
    const url = String(input)
    if (/cdninstagram\.com|fbcdn\.net/.test(url)) {
      return picture === 'ok' ? new Response(new Uint8Array(photo), { headers: { 'content-type': 'image/jpeg' } }) : new Response('', { status: picture })
    }
    const p = pages[url] ?? 'login-wall.html'
    return typeof p === 'number' ? new Response('', { status: p }) : new Response(page(p))
  })
}

describe('which pictures count', () => {
  it('real post pictures yes, the Instagram logo and look-alikes no', () => {
    expect(isInstagramPostImage(EXPIRED)).toBe(true)
    expect(isInstagramPostImage(ogImage(page('reel.html')))).toBe(true)
    expect(isInstagramPostImage('https://instagram.fdel1-1.fna.fbcdn.net/v/t51.2885-15/1.jpg?oe=6AD694CA')).toBe(true)
    expect(isInstagramPostImage(LOGO)).toBe(false)
    expect(isInstagramPostImage('https://cdninstagram.com.evil.io/v/a.jpg')).toBe(false)
    expect(isInstagramPostImage(null)).toBe(false)
  })

  it('oe= is read as the end time (real saved link: already expired)', () => {
    expect(instagramLinkExpiry(EXPIRED)!.toISOString()).toBe('2026-10-19T22:08:10.000Z')
    expect(instagramLinkExpiry('https://scontent.cdninstagram.com/v/a.jpg')).toBe(null)
  })
})

describe('our own copy', () => {
  it('is WebP, at most 1080px, in the person\'s own folder', async () => {
    instagram({})
    const fake = fakeSupabase()
    const stored = await storeInstagramImage(fake.client as any, 'user-1', EXPIRED)
    expect(stored!.path).toMatch(/^user-1\/ig-[0-9a-f-]+\.webp$/)
    const meta = await sharp(fake.uploads[0].data).metadata()
    expect(meta.format).toBe('webp')
    expect(Math.max(meta.width!, meta.height!)).toBe(1080)
  })

  it('the logo is never copied', async () => {
    instagram({})
    const fake = fakeSupabase()
    expect(await storeInstagramImage(fake.client as any, 'user-1', LOGO)).toBe(null)
    expect(safeFetch).not.toHaveBeenCalled()
  })
})

describe('replacing a picture never makes it worse', () => {
  const row = { id: 7, file_path: 'user-1/ig-old.webp' }

  it('new copy stored and row updated first, only then the old file removed', async () => {
    instagram({})
    const fake = fakeSupabase()
    const url = await replaceInstagramImage(fake.client as any, 'user-1', row, EXPIRED)
    expect(url).toMatch(/user-1\/ig-.*\.webp$/)
    expect(fake.updates[0].patch).toMatchObject({ image_url: url, file_path: fake.uploads[0].path })
    expect(fake.removed).toEqual(['user-1/ig-old.webp'])
  })

  it('logo, no picture, refused download or failed upload: nothing changes', async () => {
    for (const [candidate, picture, opts] of [[LOGO, 'ok', {}], [null, 'ok', {}], [EXPIRED, 403, {}], [EXPIRED, 'ok', { uploadError: { message: 'full' } }]] as const) {
      instagram({}, picture as any)
      const fake = fakeSupabase(opts as any)
      expect(await replaceInstagramImage(fake.client as any, 'user-1', row, candidate)).toBe(null)
      expect(fake.updates).toEqual([])
      expect(fake.removed).toEqual([])
    }
  })

  it('row update fails: the new copy is removed, the old one kept', async () => {
    instagram({})
    const fake = fakeSupabase({ updateError: { message: 'down' } })
    expect(await replaceInstagramImage(fake.client as any, 'user-1', row, EXPIRED)).toBe(null)
    expect(fake.removed).toEqual([fake.uploads[0].path])
  })

  it('never removes a file that is not an Instagram copy', async () => {
    instagram({})
    const fake = fakeSupabase()
    await replaceInstagramImage(fake.client as any, 'user-1', { id: 7, file_path: 'user-1/my-upload.pdf' }, EXPIRED)
    expect(fake.removed).toEqual([])
  })
})

describe('saves without the extension keep their own copy too', () => {
  it('iPhone Shortcut: server gets the login wall, the phone\'s page has the post: picture copied', async () => {
    instagram({ [POST_URL]: 'login-wall.html' })
    const fake = fakeSupabase()
    const result = await enrichSocialPost(fake.client as any, 'user-1', { id: 1, type: 'instagram', url: POST_URL }, 'save', {}, { pageHtml: page('post.html') })
    expect(result).toBe('stored')
    const p = fake.updates[0].patch
    expect(p.image_url).toMatch(/^https:\/\/storage\.test\/attachments\/user-1\/ig-/)
    expect(p.file_path).toBe(fake.uploads[0].path)
    expect(p.title).toMatch(/on Instagram/)
  })

  it('iPhone Shortcut on a login wall too: no logo, no "Instagram" title, nothing stored', async () => {
    instagram({})
    const fake = fakeSupabase()
    const result = await enrichSocialPost(fake.client as any, 'user-1', { id: 1, type: 'instagram', url: POST_URL }, 'save', {}, { pageHtml: page('login-wall.html') })
    expect(result).toBe('not-found')
    expect(Object.keys(fake.updates[0].patch)).toEqual(['post_data_failed_at'])
    expect(fake.uploads).toEqual([])
  })

  it('server reads the page: picture copied; copy fails: the link is still kept', async () => {
    instagram({ [POST_URL]: 'post.html' })
    let fake = fakeSupabase()
    await enrichSocialPost(fake.client as any, 'user-1', { id: 1, type: 'instagram', url: POST_URL }, 'save')
    expect(fake.updates[0].patch.image_url).toMatch(/storage\.test/)
    instagram({ [POST_URL]: 'post.html' }, 403)
    fake = fakeSupabase()
    await enrichSocialPost(fake.client as any, 'user-1', { id: 1, type: 'instagram', url: POST_URL }, 'save')
    expect(fake.updates[0].patch.image_url).toBe(EXPIRED)
    expect(fake.updates[0].patch.file_path).toBe(undefined)
  })

  it('row update fails: the copy is removed again', async () => {
    instagram({ [POST_URL]: 'post.html' })
    const fake = fakeSupabase({ updateError: { message: 'down' } })
    expect(await enrichSocialPost(fake.client as any, 'user-1', { id: 1, type: 'instagram', url: POST_URL }, 'save')).toBe('failed')
    expect(fake.removed).toEqual([fake.uploads[0].path])
  })
})

describe('backfill of older rows', () => {
  const row = (over: Partial<ImageRow>): ImageRow => ({ id: 1, url: POST_URL, image_url: null, file_path: null, post_data_failed_at: null, ...over })

  it('sorts rows: working links first (no Instagram request), then expired, logo and empty', () => {
    const working = withExpiry(EXPIRED, NOW + 3 * 86400e3)
    expect(imagePlan(row({ image_url: working }), NOW)).toBe('copy link')
    expect(imagePlan(row({ image_url: withExpiry(EXPIRED, NOW + 10 * 60e3) }), NOW)).toBe('read page')   // ends within the hour
    expect(imagePlan(row({ image_url: EXPIRED }), NOW)).toBe('read page')
    expect(imagePlan(row({ image_url: LOGO }), NOW)).toBe('read page')
    expect(imagePlan(row({ image_url: null }), NOW)).toBe('read page')
    expect(imagePlan(row({ image_url: OURS }), NOW)).toBe('own copy')
    expect(imagePlan(row({ image_url: 'https://example.com/my-cover.png' }), NOW)).toBe('not ours')
  })

  it('failed rows wait a day and are listed for a manual refresh', () => {
    const failed = row({ id: 2, image_url: EXPIRED, post_data_failed_at: new Date(NOW - 3600e3).toISOString() })
    const s = sortRows([row({ id: 1, image_url: withExpiry(EXPIRED, NOW + 3 * 86400e3) }), failed, row({ id: 3, image_url: OURS })], NOW)
    expect(s.pass1.map((r) => r.id)).toEqual([1])
    expect(s.pass2).toEqual([])
    expect(s.notRecovered.map((r) => r.id)).toEqual([2])
    expect(s.ownCopy).toBe(1)
  })

  it('expired link: the post page gives a fresh one, copied at once', async () => {
    instagram({ [POST_URL]: 'post.html' })
    const fake = fakeSupabase()
    expect(await recoverFromPage(fake.client as any, 'user-1', row({ image_url: EXPIRED }))).toBe('refreshed')
    expect(fake.updates[0].patch.image_url).toMatch(/storage\.test/)
    expect(fake.uploads).toHaveLength(1)
  })

  it('login wall or deleted post: picture untouched, row remembered as not recovered', async () => {
    for (const [answer, expected] of [['login-wall.html', 'login wall'], [404, 'deleted']] as const) {
      instagram({ [POST_URL]: answer })
      const fake = fakeSupabase()
      expect(await recoverFromPage(fake.client as any, 'user-1', row({ image_url: EXPIRED }))).toBe(expected)
      expect(fake.updates).toHaveLength(1)
      expect(Object.keys(fake.updates[0].patch)).toEqual(['post_data_failed_at'])
      expect(fake.uploads).toEqual([])
    }
  })
})

describe('/api/admin/instagram-images', () => {
  const rows = (now = Date.now()) => [
    { id: 1, url: POST_URL, image_url: withExpiry(EXPIRED, now + 3 * 86400e3), file_path: null, post_data_failed_at: null },
    { id: 2, url: 'https://instagram.com/p/GoneGone1', image_url: EXPIRED, file_path: null, post_data_failed_at: new Date(now - 3600e3).toISOString() },
    { id: 3, url: 'https://instagram.com/p/Expired22', image_url: EXPIRED, file_path: null, post_data_failed_at: null },
  ]

  it('owner only', async () => {
    vi.mocked(createClient).mockResolvedValue(fakeSupabase({ user: { id: 'someone' }, listRows: rows() }).client as any)
    expect((await GET()).status).toBe(404)
    expect((await POST()).status).toBe(404)
  })

  it('dry run: counts per pass and the not-recovered rows (id + url), contacting nobody', async () => {
    vi.mocked(createClient).mockResolvedValue(fakeSupabase({ user: { id: 'owner' }, listRows: rows() }).client as any)
    const body = await (await GET()).json()
    expect(body).toMatchObject({ dryRun: true, pass1CopyWorkingLinks: 1, pass2ReadPostPage: 1, notRecovered: [{ id: 2, url: 'https://instagram.com/p/GoneGone1' }] })
    expect(body.nextBatch).toEqual([{ id: 1, url: POST_URL }])
    expect(safeFetch).not.toHaveBeenCalled()
  })

  it('POST does pass 1 first, without reading any Instagram page', async () => {
    instagram({})
    const fake = fakeSupabase({ user: { id: 'owner' }, listRows: rows() })
    vi.mocked(createClient).mockResolvedValue(fake.client as any)
    const body = await (await POST()).json()
    expect(body.done).toEqual([{ id: 1, url: POST_URL, pass: 1, result: 'copied' }])
    expect(vi.mocked(safeFetch).mock.calls.every(([u]) => /cdninstagram/.test(String(u)))).toBe(true)
    expect(body).toMatchObject({ pass1Left: 0, pass2Left: 1 })
  })
})
