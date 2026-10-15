import { describe, it, expect, vi, beforeEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { renderToString } from 'react-dom/server'
import { createElement } from 'react'

vi.mock('@/utils/safeFetch', () => ({ isSafeUrl: vi.fn(), safeFetch: vi.fn() }))
import { safeFetch } from '@/utils/safeFetch'
import { readHackerNewsItem, readSpotifyPage, readThreadsEmbed, readLinkedInPost, fetchSpotify, hnPlainText, moreSocialTitle } from '@/lib/moreSocialMeta'
import { hackerNewsItemId, spotifyRef, threadsPostRef, isLinkedInPostUrl, normalizeUrl, detectSiteType } from '@/lib/urlTools'
import { enrichSocialPost, needsSnapshot } from '@/lib/enrichSocialPost'
import { getHackerNewsPost, getSpotifyPost, getThreadsPost, getLinkedInPost, getRedditPost } from '@/lib/postData'
import { deriveDisplayType } from '@/utils/bookmarkHelpers'
import { needsRepair } from '@/hooks/useSnapshotRepair'
import { HackerNewsCard, HackerNewsPreview, SpotifyCard, SpotifyPreview, ThreadsCard, ThreadsPreview, LinkedInCard, LinkedInPreview } from '@/components/social/MoreSocialCards'
import { fakeSupabase } from './helpers/fakeSupabase'

// Real answers saved from each site (trimmed): Hacker News API, Spotify pages, Threads embed pages, a LinkedIn post page.
const fx = (p: string) => fs.readFileSync(path.resolve(__dirname, 'fixtures', p), 'utf8')
const base = { id: 1, created_at: '2026-10-15T00:00:00Z', category: 'Inbox', user_id: 'u' }
const html = (C: any, b: any) => renderToString(createElement(C, { bookmark: { ...base, ...b } })).replace(/<!-- -->/g, '')

const URLS = {
  hn: 'https://news.ycombinator.com/item?id=22918980',
  track: 'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT',
  thread: 'https://www.threads.com/@zuck/post/C4BT8ilPsxy',
  linkedin: 'https://www.linkedin.com/posts/satyanadella_a-couple-reflections-on-the-quantum-computing-activity-7298008744133595140-a6YV',
}

beforeEach(() => { vi.mocked(safeFetch).mockReset() })

describe('addresses', () => {
  it('recognises each site\'s post addresses', () => {
    expect(hackerNewsItemId(URLS.hn)).toBe('22918980')
    expect(hackerNewsItemId('https://news.ycombinator.com/news')).toBe(null)
    expect(spotifyRef('https://open.spotify.com/intl-de/track/4cOdK2wGLETKBW3PvgPWqT?si=abc')).toEqual({ kind: 'track', id: '4cOdK2wGLETKBW3PvgPWqT' })
    expect(spotifyRef('https://open.spotify.com/user/spotify')).toBe(null)
    expect(threadsPostRef('https://www.threads.net/@zuck/post/C4BT8ilPsxy?xmt=1')).toEqual({ handle: 'zuck', code: 'C4BT8ilPsxy' })
    expect(isLinkedInPostUrl(URLS.linkedin)).toBe(true)
    expect(isLinkedInPostUrl('https://www.linkedin.com/feed/update/urn:li:share:7298008742661369857')).toBe(true)
    expect(isLinkedInPostUrl('https://www.linkedin.com/in/satyanadella')).toBe(false)
    expect(detectSiteType(URLS.thread)).toBe('threads')
    expect(detectSiteType(URLS.track)).toBe('spotify')
    expect(detectSiteType(URLS.hn)).toBe('hackernews')
  })

  it('drops share tracking: Spotify ?si=, Threads ?xmt=, LinkedIn ?utm_', () => {
    expect(normalizeUrl('https://open.spotify.com/intl-de/track/4cOdK2wGLETKBW3PvgPWqT?si=abc')).toBe(URLS.track)
    expect(normalizeUrl('https://www.threads.net/@zuck/post/C4BT8ilPsxy?xmt=AQG0')).toBe(URLS.thread)
    expect(normalizeUrl(`${URLS.linkedin}/?utm_source=share&utm_medium=member_ios`)).toBe(URLS.linkedin)
    expect(normalizeUrl(URLS.hn)).toBe(URLS.hn)
  })
})

describe('readers (real data)', () => {
  it('Hacker News: Ask HN with its text, points, comments; a story with its link', () => {
    const ask = readHackerNewsItem(JSON.parse(fx('hn/22918980.json')))!
    expect(ask).toMatchObject({ kind: 'ask', author: 'zachrip', points: 3270, comments: 473, link: null })
    expect(ask.text).toMatch(/^I'm a 24 y\/o full stack engineer/)
    const story = readHackerNewsItem(JSON.parse(fx('hn/8863.json')))!
    expect(story).toMatchObject({ kind: 'story', title: 'My YC app: Dropbox - Throw away your USB drive', link: 'http://www.getdropbox.com/u/2/screencast.html', comments: 71 })
    expect(readHackerNewsItem({ id: 1, deleted: true })).toBe(null)
    expect(hnPlainText('a &#x27;b&#x27;<p>c <a href="x">link</a>')).toBe("a 'b'\n\nc link")
  })

  it('Spotify: song, playlist and podcast', () => {
    expect(readSpotifyPage(fx('spotify/track.html'), { kind: 'track', id: 'x' })).toMatchObject({ title: 'Never Gonna Give You Up', subtitle: 'Rick Astley · Whenever You Need Somebody · 1987', duration_s: 214 })
    expect(readSpotifyPage(fx('spotify/playlist.html'), { kind: 'playlist', id: 'x' })).toMatchObject({ title: 'Today’s Top Hits', track_count: 50 })
    expect(readSpotifyPage(fx('spotify/show.html'), { kind: 'show', id: 'x' })).toMatchObject({ title: 'The Joe Rogan Experience', subtitle: 'Joe Rogan · The official podcast of comedian Joe Rogan.' })
  })

  it('Spotify: oEmbed when the page can\'t be read', async () => {
    vi.mocked(safeFetch).mockImplementation(async (u: any) => String(u).includes('oembed')
      ? new Response(JSON.stringify({ title: 'Never Gonna Give You Up', thumbnail_url: 'https://image-cdn-ak.spotifycdn.com/image/x' }))
      : new Response('', { status: 403 }))
    expect(await fetchSpotify(URLS.track)).toMatchObject({ ok: true, post: { title: 'Never Gonna Give You Up', image: 'https://image-cdn-ak.spotifycdn.com/image/x' } })
  })

  it('Threads: author, verified, text, pictures, time, counts', () => {
    const p = readThreadsEmbed(fx('threads/photo-post.html'), { handle: 'zuck', code: 'C4BT8ilPsxy' })!
    expect(p).toMatchObject({ author: { handle: 'zuck', verified: true }, text: 'The setup. The shot. Ray-Ban edition 😎', likes: '9.3K', replies: '939', reposts: '182' })
    expect(p.image_sources).toHaveLength(2)
    expect(p.created_at).toMatch(/^2024-03-0[12]/)
    expect(readThreadsEmbed(fx('threads/text-post.html'), { handle: 'zuck', code: 'C89oeSORn81' })!.image_sources).toEqual([])
    expect(readThreadsEmbed('<html><body>Thread not available</body></html>', { handle: 'zuck', code: 'x' })).toBe(null)
  })

  it('LinkedIn: author, photo, full text, picture, likes, comments', () => {
    const p = readLinkedInPost(fx('linkedin/post.html'))!
    expect(p).toMatchObject({ author: { name: 'Satya Nadella', url: 'https://www.linkedin.com/in/satyanadella' }, likes: 127815, comments: 3609 })
    expect(p.text).toMatch(/^A couple reflections on the quantum computing breakthrough/)
    expect(p.image).toMatch(/^https:\/\/media\.licdn\.com\//)
    expect(moreSocialTitle(p)).toMatch(/^Satya Nadella on LinkedIn: A couple reflections/)
  })
})

describe('saving and repairing', () => {
  it('Threads: the first picture is copied into storage (its address expires), never the original', async () => {
    const sharp = (await import('sharp')).default
    const jpg = await sharp({ create: { width: 800, height: 1000, channels: 3, background: '#444' } }).jpeg().toBuffer()
    vi.mocked(safeFetch).mockImplementation(async (u: any) => String(u).includes('/embed')
      ? new Response(fx('threads/photo-post.html'))
      : new Response(jpg, { headers: { 'content-type': 'image/jpeg' } }))
    const f = fakeSupabase()
    expect(await enrichSocialPost(f.client as any, 'user-1', { id: 3, type: 'threads', url: URLS.thread }, 'save')).toBe('stored')
    const patch = f.updates[0].patch
    expect(f.uploads).toHaveLength(1)
    expect(patch.post_data.images).toEqual([`https://storage.test/attachments/${f.uploads[0].path}`])
    expect(patch.post_data.more_images).toBe(1)
    expect(patch.image_url).toBe(patch.post_data.images[0])
    expect(patch.file_path).toBe(f.uploads[0].path)
    expect(JSON.stringify(patch.post_data)).not.toContain('cdninstagram.com/v/t51.82787-15')
    expect(patch.title).toBe('@zuck on Threads: The setup. The shot. Ray-Ban edition 😎')
  })

  it('LinkedIn repair: replaces a "Sign in" title, never an edited one or the note', async () => {
    vi.mocked(safeFetch).mockResolvedValue(new Response(fx('linkedin/post.html')))
    const a = fakeSupabase()
    await enrichSocialPost(a.client as any, 'user-1', { id: 4, type: 'link', url: URLS.linkedin, title: 'Sign Up | LinkedIn' }, 'repair')
    expect(a.updates[0].patch.title).toMatch(/^Satya Nadella on LinkedIn/)
    vi.mocked(safeFetch).mockResolvedValue(new Response(fx('linkedin/post.html')))
    const b = fakeSupabase()
    await enrichSocialPost(b.client as any, 'user-1', { id: 4, type: 'linkedin', url: URLS.linkedin, title: 'Quantum post', description: 'my note' }, 'repair')
    expect(b.updates[0].patch.title).toBe(undefined)
    expect(b.updates[0].patch.description).toBe(undefined)
    expect(b.updates[0].filters).toEqual([['id', 4], ['user_id', 'user-1']])
  })

  it('a site that refuses: nothing found, tried again after a day', async () => {
    vi.mocked(safeFetch).mockResolvedValue(new Response('', { status: 429 }))
    const f = fakeSupabase()
    expect(await enrichSocialPost(f.client as any, 'user-1', { id: 5, type: 'linkedin', url: URLS.linkedin }, 'repair')).toBe('not-found')
    expect(Object.keys(f.updates[0].patch)).toEqual(['post_data_failed_at'])
  })

  it('old links to these sites are repaired; profiles and other pages are not', () => {
    expect(needsSnapshot({ type: 'link', url: URLS.hn, post_data: null })).toBe(true)
    expect(needsSnapshot({ type: 'link', url: 'https://www.linkedin.com/in/satyanadella', post_data: null })).toBe(false)
    expect(needsRepair({ id: 1, post_data: null, url: 'https://www.linkedin.com/in/satyanadella' }, 'linkedin')).toBe(false)
    expect(needsRepair({ id: 1, post_data: null, url: URLS.linkedin }, 'linkedin')).toBe(true)
  })
})

describe('cards and full views', () => {
  const hn = readHackerNewsItem(JSON.parse(fx('hn/22918980.json')))!
  const sp = { ...readSpotifyPage(fx('spotify/track.html'), { kind: 'track', id: '4cOdK2wGLETKBW3PvgPWqT' })! }
  const li = readLinkedInPost(fx('linkedin/post.html'))!
  const { image_sources: _s, ...th } = readThreadsEmbed(fx('threads/photo-post.html'), { handle: 'zuck', code: 'C4BT8ilPsxy' })!
  const thread = { ...th, images: ['https://storage.test/x.webp'], more_images: 1 }

  it('each shows its own content', () => {
    expect(html(HackerNewsCard, { url: URLS.hn, title: hn.title, post_data: hn })).toContain('Ask HN')
    expect(html(HackerNewsPreview, { url: URLS.hn, title: hn.title, post_data: hn })).toContain('473 comments on HN')
    const spc = html(SpotifyCard, { url: URLS.track, title: sp.title, post_data: sp })
    expect(spc).toContain('Never Gonna Give You Up')
    expect(spc).toContain('Song · 3:34')
    expect(html(SpotifyPreview, { url: URLS.track, title: sp.title, post_data: sp })).toContain('https://open.spotify.com/embed/track/4cOdK2wGLETKBW3PvgPWqT')
    const thc = html(ThreadsCard, { url: URLS.thread, title: 't', post_data: thread })
    expect(thc).toContain('Ray-Ban edition')
    expect(thc).toContain('+1')
    expect(html(ThreadsPreview, { url: URLS.thread, title: 't', post_data: thread })).toContain('View on Threads')
    expect(html(LinkedInCard, { url: URLS.linkedin, title: 't', post_data: li })).toContain('Satya Nadella')
    expect(html(LinkedInPreview, { url: URLS.linkedin, title: 't', post_data: li })).toContain('3.6K comments')
  })

  it('before a snapshot arrives: a clean card, never the bare address', () => {
    for (const [C, url] of [[HackerNewsCard, URLS.hn], [SpotifyCard, URLS.track], [ThreadsCard, URLS.thread], [LinkedInCard, URLS.linkedin]] as const) {
      expect(html(C, { url, title: url })).not.toContain(`>${url}<`)
    }
  })

  it('display types, and snapshots never mix', () => {
    expect(deriveDisplayType({ ...base, type: 'link', url: URLS.linkedin, title: 't' } as any)).toBe('linkedin')
    expect(deriveDisplayType({ ...base, type: 'link', url: URLS.hn, title: 't' } as any)).toBe('hackernews')
    expect(getHackerNewsPost({ post_data: sp as any })).toBe(null)
    expect(getSpotifyPost({ post_data: li as any })).toBe(null)
    expect(getThreadsPost({ post_data: hn as any })).toBe(null)
    expect(getLinkedInPost({ post_data: thread as any })).toBe(null)
    expect(getRedditPost({ post_data: hn as any })).toBe(null)
  })
})
