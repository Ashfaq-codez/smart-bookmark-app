import { describe, it, expect, vi, beforeEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

vi.mock('@/utils/safeFetch', () => ({ isSafeUrl: vi.fn(), safeFetch: vi.fn() }))
import { safeFetch } from '@/utils/safeFetch'
import { parseSyndication, parseVx, mergeWithVx, xTitle, fetchXSnapshot, syndicationToken, entitiesFromText } from '@/lib/xSnapshot'
import { enrichSocialPost, needsSnapshot, coverImage } from '@/lib/enrichSocialPost'
import { fakeSupabase } from './helpers/fakeSupabase'

// Real answers saved from X's embed source and vxtwitter (tests/fixtures/x). quote.json is the photo post
// with the video post placed inside it as the quoted post, in exactly the shape X uses.
const fx = (name: string) => JSON.parse(fs.readFileSync(path.resolve(__dirname, 'fixtures/x', name), 'utf8'))

beforeEach(() => vi.mocked(safeFetch).mockReset())

describe('parseSyndication', () => {
  it('photo post: author, text without the pic.x.com link, photo size', () => {
    const p = parseSyndication(fx('photo.json'))!
    expect(p.author.handle).toBe('Interior')
    expect(p.url).toBe('https://x.com/Interior/status/463440424141459456')
    expect(p.text).not.toMatch(/t\.co|pic\.x\.com/)
    expect(p.photos).toEqual([{ url: 'https://pbs.twimg.com/media/Bm54nBCCYAACwBi.jpg', width: 960, height: 541, alt: null }])
    expect(p.video).toBe(null)
    expect(p.created_at).toMatch(/^2014-/)
  })

  it('video post: poster, an mp4 (never m3u8), aspect ratio and duration', () => {
    const p = parseSyndication(fx('video.json'))!
    expect(p.video!.poster).toMatch(/^https:\/\/pbs\.twimg\.com\//)
    expect(p.video!.mp4).toMatch(/^https:\/\/video\.twimg\.com\/.+\.mp4/)
    expect(p.video!.mp4).not.toContain('m3u8')
    expect(p.video!.aspect[0]).toBeGreaterThan(0)
    expect(p.video!.duration_ms).toBe(13216)
    expect(p.video!.gif).toBe(false)
    expect(p.text.endsWith('animations.')).toBe(true)
  })

  it('picks a sensible mp4 (not the 10 Mbit one) when several exist', () => {
    const p = parseSyndication(fx('long.json'))!
    expect(p.video!.mp4).toContain('1086x720')
  })

  it('quote post: the quoted post is a full nested snapshot, one level only', () => {
    const p = parseSyndication(fx('quote.json'))!
    expect(p.quoted!.author.handle).toBe('reactiive_')
    expect(p.quoted!.video!.mp4).toContain('.mp4')
    expect((p.quoted as any).quoted).toBe(undefined)
    expect(p.photos).toHaveLength(1)
  })

  it('link-card post: card with the real address, title, domain and image', () => {
    const p = parseSyndication(fx('card.json'))!
    expect(p.card).toEqual({
      url: 'https://vercel.com/blog/introducing-react-tweet',
      title: 'Introducing React Tweet',
      description: 'Embed tweets into your React application without sacrificing performance.',
      domain: 'vercel.com',
      image: expect.stringMatching(/^https:\/\/pbs\.twimg\.com\/card_img\//),
    })
    const link = p.entities.find((e) => e.type === 'url')!
    expect(link).toMatchObject({ url: 'https://vercel.com/blog/introducing-react-tweet' })
    // offsets point at the t.co text in our (decoded) text
    expect(Array.from(p.text).slice(link.start, link.end).join('')).toBe('https://t.co/CMH9A1IGjV')
  })

  it('long post: marked truncated until the full text is known', () => {
    const p = parseSyndication(fx('long.json'))!
    expect(p.truncated).toBe(true)
    expect(p.full_text).toBe(null)
  })

  it('author verification', () => {
    const p = parseSyndication(fx('long.json'))!
    expect(p.author).toMatchObject({ name: 'Guillermo Rauch', handle: 'rauchg', verified: true, verified_type: 'blue' })
    expect(p.author.avatar).toContain('_200x200')
  })

  it('tombstone (deleted post) gives nothing', () => {
    expect(parseSyndication(fx('tombstone.json'))).toBe(null)
  })

  it('decodes &amp; &lt; &gt; and moves entity offsets with it', () => {
    const raw = { id_str: '1', text: 'a &amp; b @jack', display_text_range: [0, 15], user: { screen_name: 'x', name: 'X' },
      entities: { user_mentions: [{ indices: [10, 15], screen_name: 'jack' }] } }
    const p = parseSyndication(raw)!
    expect(p.text).toBe('a & b @jack')
    expect(p.entities[0]).toMatchObject({ type: 'mention', start: 6, end: 11 })
  })

  it('counts: only what the source gives', () => {
    expect(parseSyndication(fx('long.json'))!.counts).toEqual({ replies: 56, likes: 2338 })
  })

  it('rejects junk', () => {
    expect(parseSyndication(null)).toBe(null)
    expect(parseSyndication({ id_str: '1', text: 'x', user: { screen_name: 'bad handle' } })).toBe(null)
    expect(parseSyndication({ id_str: '1', text: 'x', user: { screen_name: 'ok', profile_image_url_https: 'javascript:alert(1)' } })!.author.avatar).toBe(null)
  })
})

describe('vxtwitter', () => {
  it('long post: the whole text replaces the cut one, reposts are added', () => {
    const merged = mergeWithVx(parseSyndication(fx('long.json'))!, parseVx(fx('vx-long.json')))
    expect(merged.truncated).toBe(false)
    expect(merged.full_text!.length).toBeGreaterThan(merged.text.length)
    expect(merged.full_text).toContain('@penberg')
    expect(merged.counts.reposts).toBe(159)
    expect(merged.source).toBe('syndication')
  })

  it('fallback snapshot from vxtwitter alone', () => {
    const p = parseVx(fx('vx-video.json'))!
    expect(p.source).toBe('vxtwitter')
    expect(p.video!.poster).toMatch(/^https:\/\/pbs\.twimg\.com\//)
    expect(p.video!.mp4).toMatch(/\.mp4$/)
    expect(p.photos).toEqual([])
  })

  it('finds mentions, hashtags and links in plain text', () => {
    const e = entitiesFromText('hi @jack see https://a.co/x #tag')
    expect(e.map((x) => x.type)).toEqual(['mention', 'url', 'hashtag'])
    expect(e[0]).toMatchObject({ start: 3, end: 8, handle: 'jack' })
  })
})

describe('titles and covers', () => {
  it('"Name on X: first line"', () => {
    expect(xTitle(parseSyndication(fx('card.json'))!)).toBe('Vercel on X: Introducing `react-tweet`:')
  })
  it('cover is a picture, never an mp4', () => {
    expect(coverImage(parseSyndication(fx('video.json'))!)).toMatch(/\.jpg$/)
    expect(coverImage(parseSyndication(fx('card.json'))!)).toContain('card_img')
  })
})

describe('fetchXSnapshot', () => {
  const answer = (syn: unknown, vx: unknown) =>
    vi.mocked(safeFetch).mockImplementation(async (u: any) => {
      const body = String(u).includes('syndication') ? syn : vx
      return body === 404 ? new Response('', { status: 404 }) : body === 500 ? new Response('', { status: 500 }) : new Response(JSON.stringify(body))
    })

  it('asks the embed source with the react-tweet token, and vxtwitter', async () => {
    answer(fx('photo.json'), 500)
    const r = await fetchXSnapshot('463440424141459456')
    expect(r.ok).toBe(true)
    const urls = vi.mocked(safeFetch).mock.calls.map((c) => String(c[0]))
    expect(urls).toContain(`https://cdn.syndication.twimg.com/tweet-result?id=463440424141459456&lang=en&token=${syndicationToken('463440424141459456')}`)
    expect(urls).toContain('https://api.vxtwitter.com/i/status/463440424141459456')
  })

  it('uses vxtwitter when the embed source is down', async () => {
    answer(500, fx('vx-video.json'))
    const r = await fetchXSnapshot('2040511285998313827')
    expect(r.ok && r.post.source).toBe('vxtwitter')
  })

  it('a tombstone is "deleted", even if vxtwitter answers', async () => {
    answer(fx('tombstone.json'), fx('vx-video.json'))
    expect(await fetchXSnapshot('1629307668568633344')).toEqual({ ok: false, reason: 'deleted' })
  })

  it('both down is "unavailable"; a bad id never fetches', async () => {
    answer(500, 500)
    expect(await fetchXSnapshot('5')).toEqual({ ok: false, reason: 'unavailable' })
    vi.mocked(safeFetch).mockClear()
    expect(await fetchXSnapshot('../x')).toEqual({ ok: false, reason: 'unavailable' })
    expect(safeFetch).not.toHaveBeenCalled()
  })
})

describe('enrichSocialPost', () => {
  const answer = (syn: unknown, vx: unknown = 500) =>
    vi.mocked(safeFetch).mockImplementation(async (u: any) => {
      const body = String(u).includes('syndication') ? syn : vx
      return typeof body === 'number' ? new Response('', { status: body }) : new Response(JSON.stringify(body))
    })
  const row = { id: 7, url: 'https://x.com/Interior/status/463440424141459456', type: 'twitter' }

  it('save: stores the snapshot, title, text and a picture cover, scoped to the owner', async () => {
    answer(fx('photo.json'))
    const fake = fakeSupabase()
    expect(await enrichSocialPost(fake.client as any, 'user-1', row, 'save')).toBe('stored')
    const u = fake.updates[0]
    expect(u.patch.post_data.id).toBe('463440424141459456')
    expect(u.patch.post_data_failed_at).toBe(null)
    expect(u.patch.title).toMatch(/ on X: /)
    expect(u.patch.image_url).toContain('pbs.twimg.com/media')
    expect(u.filters).toEqual([['id', 7], ['user_id', 'user-1']])
  })

  it('save: keeps a description or picture the person sent', async () => {
    answer(fx('photo.json'))
    const fake = fakeSupabase()
    await enrichSocialPost(fake.client as any, 'user-1', row, 'save', { description: true, image: true })
    expect(fake.updates[0].patch.description).toBe(undefined)
    expect(fake.updates[0].patch.image_url).toBe(undefined)
  })

  it('repair: never replaces an edited title or the description; replaces an mp4 cover', async () => {
    answer(fx('video.json'))
    const fake = fakeSupabase()
    await enrichSocialPost(fake.client as any, 'user-1',
      { ...row, url: 'https://x.com/reactiive_/status/2040511285998313827', title: 'My own title', image_url: 'https://video.twimg.com/a/vid/x.mp4' }, 'repair')
    const p = fake.updates[0].patch
    expect(p.title).toBe(undefined)
    expect(p.description).toBe(undefined)
    expect(p.image_url).toMatch(/\.jpg$/)
  })

  it('repair: replaces an automatic "Post by … on X" title', async () => {
    answer(fx('photo.json'))
    const fake = fakeSupabase()
    await enrichSocialPost(fake.client as any, 'user-1', { ...row, title: 'Post by Interior (@Interior) on X', image_url: 'https://old/x.jpg' }, 'repair')
    expect(fake.updates[0].patch.title).toMatch(/ on X: /)
    expect(fake.updates[0].patch.image_url).toBe(undefined)
  })

  it('deleted post: keeps the preview, only marks the failure time', async () => {
    answer(fx('tombstone.json'))
    const fake = fakeSupabase()
    expect(await enrichSocialPost(fake.client as any, 'user-1', row, 'repair')).toBe('failed')
    expect(Object.keys(fake.updates[0].patch)).toEqual(['post_data_failed_at'])
  })

  it('upgrades an /i/status address once the handle is known', async () => {
    answer(fx('photo.json'))
    const fake = fakeSupabase()
    await enrichSocialPost(fake.client as any, 'user-1', { ...row, url: 'https://x.com/i/status/463440424141459456' }, 'save')
    expect(fake.updates[0].patch.url).toBe('https://x.com/Interior/status/463440424141459456')
  })

  it('not an X post: does nothing', async () => {
    const fake = fakeSupabase()
    expect(await enrichSocialPost(fake.client as any, 'user-1', { id: 1, url: 'https://example.com', type: 'link' }, 'save')).toBe('skipped')
    expect(safeFetch).not.toHaveBeenCalled()
  })
})

describe('needsSnapshot (retry at most once a day)', () => {
  const base = { type: 'twitter', url: 'https://x.com/a/status/1', post_data: null, post_data_failed_at: null }
  const now = Date.parse('2026-10-15T12:00:00Z')
  it('decides', () => {
    expect(needsSnapshot(base, now)).toBe(true)
    expect(needsSnapshot({ ...base, post_data: { v: 1 } }, now)).toBe(false)
    expect(needsSnapshot({ ...base, type: 'link' }, now)).toBe(false)
    expect(needsSnapshot({ ...base, url: 'https://x.com/home' }, now)).toBe(false)
    expect(needsSnapshot({ ...base, post_data_failed_at: '2026-10-15T01:00:00Z' }, now)).toBe(false)
    expect(needsSnapshot({ ...base, post_data_failed_at: '2026-10-14T11:00:00Z' }, now)).toBe(true)
  })
})
