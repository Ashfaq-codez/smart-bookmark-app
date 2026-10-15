import { describe, it, expect, vi, beforeEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { renderToString } from 'react-dom/server'
import { createElement } from 'react'

vi.mock('@/utils/safeFetch', () => ({ isSafeUrl: vi.fn(), safeFetch: vi.fn() }))
import { safeFetch } from '@/utils/safeFetch'
import { handleFromUrl, handleFromDescription, captionFromDescription, countsFromDescription, cleanHandle, readInstagramPage, isLoginWall, fetchInstagramPage } from '@/lib/instagramMeta'
import { enrichSocialPost, needsSnapshot, isInstagramPostUrl } from '@/lib/enrichSocialPost'
import { getXPost, getInstagramPost } from '@/lib/postData'
import { getInstaMeta } from '@/utils/bookmarkHelpers'
import InstagramPreview from '@/components/editorial-modal/previews/InstagramPreview'
import { parseSyndication } from '@/lib/xSnapshot'
import { fakeSupabase } from './helpers/fakeSupabase'

const page = (name: string) => fs.readFileSync(path.resolve(__dirname, 'fixtures/instagram', name), 'utf8')
const xFixture = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'fixtures/x/photo.json'), 'utf8'))

// Real saved rows (url / title / description as stored, trimmed like the SQL output).
const ROWS = {
  withLikes: {
    id: 1022, type: 'instagram', url: 'https://instagram.com/p/DeeKFPmNo0L',
    title: 'Philosophy Of Physics on Instagram: "The same drawing can have different Fourier coefficients. They depend on the route',
    description: '98K likes, 475 comments - philosophyofphys on October 14, 2026: "The same drawing can have different Fourier coefficients. They depend on the route taken throug',
  },
  brs: {
    id: 1012, type: 'instagram', url: 'https://instagram.com/reel/DeeXcLkz4ab?utm_source=ig_web_button_native_share',
    title: 'Yashashvi Bhadauria • AI • Tech on Instagram: "Backend dev in 2026? Time to lock in ✅<br><br>I got the complete roadmap you ac',
    description: '1,777 likes, 494 comments - geekydev.in on October 14, 2026: "Backend dev in 2026? Time to lock in ✅<br><br>I got the complete roadmap you actually need.<br>Want the ful',
  },
  tabTitle: {
    id: 1003, type: 'instagram', url: 'https://instagram.com/reels/DeZZGscRW3S?hl=en', title: '(4) Instagram',
    description: '2,291 likes, 1,561 comments - padho_with_pratyush on October 12, 2026: "Do this daily for 2 weeks to get interview calls".',
  },
  noLikes: {
    id: 703, type: 'instagram', url: 'https://instagram.com/reel/Dd35bp-q_Cv?utm_source=ig_web_button_native_share',
    title: 'Codvyn | Tech and AI on Instagram: "Your websites don’t have to look like everyone else’s.',
    description: 'codvyn on September 29, 2026: "Your websites don’t have to look like everyone else’s.<br><br>These 4 websites are a great starting point',
  },
  nothing: { id: 563, type: 'instagram', url: 'https://instagram.com/reels/Ddg_e-khU8W', title: 'Instagram', description: null, image_url: null },
}

beforeEach(() => { vi.mocked(safeFetch).mockReset() })

describe('handle sources', () => {
  it('checks every handle: letters, digits, . and _, max 30, no Instagram page names', () => {
    expect(cleanHandle('@geekydev.in')).toBe('geekydev.in')
    expect(cleanHandle('a'.repeat(31))).toBe(null)
    expect(cleanHandle('bad handle')).toBe(null)
    expect(cleanHandle('<script>')).toBe(null)
    expect(cleanHandle('reels')).toBe(null)
    expect(cleanHandle(42)).toBe(null)
  })

  it('b) from the address, only in the /<handle>/p|reel/<id> form', () => {
    expect(handleFromUrl('https://www.instagram.com/philosophyofphys/reel/DeeKFPmNo0L/')).toBe('philosophyofphys')
    expect(handleFromUrl('https://instagram.com/nasa/p/ABC123/')).toBe('nasa')
    expect(handleFromUrl(ROWS.withLikes.url)).toBe(null)
    expect(handleFromUrl(ROWS.tabTitle.url)).toBe(null)
    expect(handleFromUrl('https://medium.com/nasa/p/ABC123')).toBe(null)
  })

  it('c) from Instagram\'s description, with or without likes in front (real rows)', () => {
    expect(handleFromDescription(ROWS.withLikes.description)).toBe('philosophyofphys')
    expect(handleFromDescription(ROWS.brs.description)).toBe('geekydev.in')
    expect(handleFromDescription(ROWS.tabTitle.description)).toBe('padho_with_pratyush')
    expect(handleFromDescription(ROWS.noLikes.description)).toBe('codvyn')
    expect(handleFromDescription('my own note about this reel')).toBe(null)
  })

  it('captions lose the literal <br> and the quotes; real counts only', () => {
    expect(captionFromDescription(ROWS.brs.description)).toBe('Backend dev in 2026? Time to lock in ✅\n\nI got the complete roadmap you actually need.\nWant the ful')
    expect(captionFromDescription(ROWS.tabTitle.description)).toBe('Do this daily for 2 weeks to get interview calls')
    expect(countsFromDescription(ROWS.brs.description)).toEqual({ likes: '1,777', comments: '494' })
    expect(countsFromDescription(ROWS.noLikes.description)).toEqual({ likes: null, comments: null })
  })

  it('c) from a real post page: og:url first, then og:description', () => {
    const p = readInstagramPage(page('post.html'))
    expect(p.handle).toBe('philosophyofphys')
    expect(p.title).toMatch(/^Philosophy Of Physics on Instagram/)
    expect(p.image).toMatch(/^https:\/\//)
    expect(readInstagramPage(page('reel.html')).handle).toBe('startup.ln')
    const noUrl = page('post.html').replace(/<meta property="og:url"[^>]*>/, '')
    expect(readInstagramPage(noUrl).handle).toBe('philosophyofphys')
  })

  it('c) from the page JSON: the post owner only, never any other username', () => {
    const html = '<html><head></head><body><script>{"comments":[{"username":"commenter1"}],"owner":{"id":"1","username":"real.owner"}}</script></body></html>'
    expect(readInstagramPage(html).handle).toBe('real.owner')
    expect(readInstagramPage('<script>{"username":"commenter1"}</script>').handle).toBe(null)
  })

  it('d) login wall is recognised and gives nothing', async () => {
    expect(isLoginWall(page('login-wall.html'))).toBe(true)
    expect(isLoginWall(page('post.html'))).toBe(false)
    expect(isLoginWall(page('post.html'), 'https://www.instagram.com/accounts/login/?next=x')).toBe(true)
    vi.mocked(safeFetch).mockResolvedValue(new Response(page('login-wall.html')))
    expect(await fetchInstagramPage('https://instagram.com/p/X1')).toEqual({ ok: false, reason: 'login-wall' })
  })
})

describe('enrichSocialPost for Instagram', () => {
  const run = (row: any, mode: 'save' | 'repair', keep = {}, captured = {}) => {
    const fake = fakeSupabase()
    return enrichSocialPost(fake.client as any, 'user-1', row, mode, keep, captured).then((result) => ({ result, fake }))
  }

  it('a) a handle captured by the extension wins, after being checked', async () => {
    vi.mocked(safeFetch).mockResolvedValue(new Response(page('post.html')))
    const { result, fake } = await run({ id: 1, type: 'instagram', url: 'https://instagram.com/p/DeeKFPmNo0L' }, 'save', {}, { handle: 'from.extension' })
    expect(result).toBe('stored')
    expect(fake.updates[0].patch.post_data).toMatchObject({ platform: 'instagram', handle: 'from.extension', handle_source: 'extension' })
    expect(fake.updates[0].filters).toEqual([['id', 1], ['user_id', 'user-1']])
  })

  it('a) a bad captured handle is ignored and the next source is used', async () => {
    vi.mocked(safeFetch).mockResolvedValue(new Response(page('post.html')))
    const { fake } = await run({ id: 1, type: 'instagram', url: 'https://instagram.com/p/DeeKFPmNo0L' }, 'save', {}, { handle: '"><img src=x>' })
    expect(fake.updates[0].patch.post_data).toMatchObject({ handle: 'philosophyofphys', handle_source: 'page' })
  })

  it('b) the address, when it has the handle', async () => {
    vi.mocked(safeFetch).mockResolvedValue(new Response(page('login-wall.html')))
    const { result, fake } = await run({ id: 1, type: 'instagram', url: 'https://instagram.com/nasa/p/ABC123' }, 'save')
    expect(result).toBe('stored')
    expect(fake.updates[0].patch.post_data).toMatchObject({ handle: 'nasa', handle_source: 'url' })
  })

  it('save: fills title, Instagram description and cover from the page (unless the person gave them)', async () => {
    vi.mocked(safeFetch).mockResolvedValue(new Response(page('post.html')))
    const { fake } = await run({ id: 1, type: 'instagram', url: 'https://instagram.com/p/DeeKFPmNo0L' }, 'save')
    const p = fake.updates[0].patch
    expect(p.title).toMatch(/on Instagram/)
    expect(p.description).toMatch(/philosophyofphys on October 14, 2026/)
    expect(p.image_url).toMatch(/^https:\/\//)
    expect(p.post_data.caption).toMatch(/^The same drawing/)
    vi.mocked(safeFetch).mockResolvedValue(new Response(page('post.html')))
    const kept = await run({ id: 1, type: 'instagram', url: 'https://instagram.com/p/DeeKFPmNo0L' }, 'save', { title: true, description: true, image: true })
    expect(Object.keys(kept.fake.updates[0].patch).sort()).toEqual(['post_data', 'post_data_failed_at', 'post_data_fetched_at'])
  })

  it('repair: real old rows are fixed from what was saved, without contacting Instagram', async () => {
    for (const row of [ROWS.withLikes, ROWS.brs, ROWS.noLikes]) {
      const { result, fake } = await run(row, 'repair')
      expect(result).toBe('stored')
      expect(fake.updates[0].patch.title).toBe(undefined)          // never touches the title
      expect(fake.updates[0].patch.description).toBe(undefined)    // or the note
      expect(fake.updates[0].patch.post_data.handle_source).toBe('page')
    }
    expect(safeFetch).not.toHaveBeenCalled()
  })

  it('repair: an automatic "(4) Instagram" title is replaced; an edited one is not', async () => {
    vi.mocked(safeFetch).mockResolvedValue(new Response(page('reel.html')))
    const auto = await run({ ...ROWS.nothing }, 'repair')
    expect(auto.result).toBe('stored')
    expect(auto.fake.updates[0].patch.title).toMatch(/on Instagram/)
    expect(auto.fake.updates[0].patch.post_data.handle).toBe('startup.ln')
    vi.mocked(safeFetch).mockResolvedValue(new Response(page('reel.html')))
    const edited = await run({ ...ROWS.nothing, title: 'My reel about startups', description: 'my own note' }, 'repair')
    expect(edited.fake.updates[0].patch.title).toBe(undefined)
    expect(edited.fake.updates[0].patch.description).toBe(undefined)
  })

  it('d) nothing found (login wall): not an error, preview kept, tried again after a day', async () => {
    vi.mocked(safeFetch).mockResolvedValue(new Response(page('login-wall.html')))
    const { result, fake } = await run({ ...ROWS.nothing }, 'repair')
    expect(result).toBe('not-found')
    expect(Object.keys(fake.updates[0].patch)).toEqual(['post_data_failed_at'])
    const failedNow = { ...ROWS.nothing, post_data: null, post_data_failed_at: new Date().toISOString() }
    expect(needsSnapshot(failedNow)).toBe(false)
    expect(needsSnapshot({ ...failedNow, post_data_failed_at: new Date(Date.now() - 25 * 3600e3).toISOString() })).toBe(true)
  })

  it('d) Instagram not answering is treated the same way', async () => {
    vi.mocked(safeFetch).mockResolvedValue(new Response('', { status: 503 }))
    const { result, fake } = await run({ ...ROWS.nothing }, 'repair')
    expect(result).toBe('not-found')
    expect(Object.keys(fake.updates[0].patch)).toEqual(['post_data_failed_at'])
  })

  it('a network error while reading the page is caught', async () => {
    vi.mocked(safeFetch).mockImplementation(async () => { throw new Error('network down') })
    expect(await fetchInstagramPage('https://instagram.com/p/AAAAAA')).toEqual({ ok: false, reason: 'unavailable' })
  })

  it('only post addresses are handled', () => {
    expect(isInstagramPostUrl(ROWS.tabTitle.url)).toBe(true)
    expect(isInstagramPostUrl('https://instagram.com/nasa/')).toBe(false)
    expect(needsSnapshot({ type: 'instagram', url: 'https://instagram.com/nasa/', post_data: null })).toBe(false)
  })
})

describe('the Instagram view', () => {
  const render = (b: any) => renderToString(createElement(InstagramPreview, {
    bookmark: { created_at: '2026-10-14T00:00:00Z', category: 'Inbox', user_id: 'u', ...b },
    previewImageUrl: 'https://example.com/a.jpg', title: b.title || '', description: b.description || '', content: '',
  }))

  it('shows the real handle and real likes, never "instagram_user", "1,248" or "Following"', () => {
    const html = render(ROWS.brs)
    expect(html).toContain('geekydev.in')
    expect(html).toContain('1,777')
    expect(html).not.toContain('instagram_user')
    expect(html).not.toContain('1,248')
    expect(html).not.toContain('Following')
    expect(html).not.toContain('ui-avatars.com')
  })

  it('nothing found: no @ line and no likes line', () => {
    const html = render(ROWS.nothing)
    expect(html).not.toContain('instagram_user')
    expect(html).not.toContain('instagram.com/null')
    expect(html).not.toMatch(/likes</)
  })

  it('a stored Instagram snapshot is used first', () => {
    const meta = getInstaMeta({ ...ROWS.nothing, post_data: { v: 1, platform: 'instagram', handle: 'stored.handle', handle_source: 'page', caption: 'Hi', is_video: true } } as any)
    expect(meta.username).toBe('stored.handle')
    expect(meta.caption).toBe('Hi')
  })
})

describe('X and Instagram snapshots never mix', () => {
  const xNew = parseSyndication(xFixture)!                       // has platform: 'x'
  const { platform: _drop, ...xOld } = xNew                      // stored before Instagram snapshots existed
  const ig = { v: 1, platform: 'instagram', handle: 'nasa', handle_source: 'url', caption: null, is_video: false }

  it('the readers check the platform', () => {
    expect(getXPost({ post_data: xNew })).toBe(xNew)
    expect(getXPost({ post_data: xOld as any })).toBe(xOld)
    expect(getXPost({ post_data: ig as any })).toBe(null)
    expect(getInstagramPost({ post_data: ig as any })).toBe(ig)
    expect(getInstagramPost({ post_data: xNew })).toBe(null)
    expect(getInstagramPost({ post_data: xOld as any })).toBe(null)
  })

  it('an X snapshot shown in the Instagram view gives no X data', () => {
    const b = { ...ROWS.nothing, post_data: xNew }
    expect(getInstaMeta(b as any).username).toBe(null)
    const html = renderToString(createElement(InstagramPreview, { bookmark: { created_at: '2026-10-14T00:00:00Z', category: 'Inbox', user_id: 'u', ...b } as any, title: '', description: '', content: '' }))
    expect(html).not.toContain('Interior')
  })

  it('an Instagram snapshot is never used as an X post', () => {
    expect(getXPost({ post_data: { ...ig, author: { handle: 'x' }, id: '1' } as any })).toBe(null)
  })
})
