import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/utils/safeFetch', () => ({ isSafeUrl: vi.fn(), safeFetch: vi.fn() }))
import { safeFetch } from '@/utils/safeFetch'
import { youTubeVideoId, isAutoYouTubeTitle, fetchYouTubeInfo } from '@/lib/youtubeMeta'
import { enrichSocialPost, needsSnapshot } from '@/lib/enrichSocialPost'
import { getYouTubePost, getXPost, getInstagramPost } from '@/lib/postData'
import { cardHoverText } from '@/utils/bookmarkHelpers'
import { needsRepair } from '@/hooks/useSnapshotRepair'
import { fakeSupabase } from './helpers/fakeSupabase'

// What YouTube's oEmbed really answered (trimmed to the fields we read).
const OEMBED = { title: 'Rick Astley - Never Gonna Give You Up (Official Video) (4K Remaster)', author_name: 'Rick Astley', type: 'video' }
const YT = { v: 1, platform: 'youtube', id: 'dQw4w9WgXcQ', title: OEMBED.title, channel: 'Rick Astley' }

beforeEach(() => { vi.mocked(safeFetch).mockReset() })

describe('YouTube', () => {
  it('finds the video id in every address form', () => {
    expect(youTubeVideoId('https://youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(youTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PL1')).toBe('dQw4w9WgXcQ')
    expect(youTubeVideoId('https://youtu.be/dQw4w9WgXcQ?t=3')).toBe('dQw4w9WgXcQ')
    expect(youTubeVideoId('https://youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(youTubeVideoId('https://youtube.com/@channel')).toBe(null)
    expect(youTubeVideoId('https://notyoutube.com/watch?v=dQw4w9WgXcQ')).toBe(null)
  })

  it('knows which titles the app made itself', () => {
    expect(isAutoYouTubeTitle('https://youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true)
    expect(isAutoYouTubeTitle('(3) YouTube')).toBe(true)
    expect(isAutoYouTubeTitle('')).toBe(true)
    expect(isAutoYouTubeTitle('My favourite song')).toBe(false)
  })

  it('reads the title and channel from oEmbed (no key)', async () => {
    vi.mocked(safeFetch).mockResolvedValue(new Response(JSON.stringify(OEMBED)))
    expect(await fetchYouTubeInfo('dQw4w9WgXcQ')).toEqual({ ok: true, post: YT })
    expect(String(vi.mocked(safeFetch).mock.calls[0][0])).toMatch(/^https:\/\/www\.youtube\.com\/oembed\?format=json&url=/)
  })

  it('a private or deleted video is "not found"; a bad id never fetches', async () => {
    vi.mocked(safeFetch).mockResolvedValue(new Response('', { status: 404 }))
    expect(await fetchYouTubeInfo('dQw4w9WgXcQ')).toEqual({ ok: false, reason: 'not-found' })
    vi.mocked(safeFetch).mockClear()
    expect(await fetchYouTubeInfo('../../x')).toEqual({ ok: false, reason: 'not-found' })
    expect(safeFetch).not.toHaveBeenCalled()
  })

  it('repair: replaces an address title, keeps an edited one, stores the channel', async () => {
    const row = { id: 9, type: 'youtube', url: 'https://youtube.com/watch?v=dQw4w9WgXcQ', title: 'https://youtube.com/watch?v=dQw4w9WgXcQ' }
    vi.mocked(safeFetch).mockResolvedValue(new Response(JSON.stringify(OEMBED)))
    const a = fakeSupabase()
    expect(await enrichSocialPost(a.client as any, 'user-1', row, 'repair')).toBe('stored')
    expect(a.updates[0].patch).toMatchObject({ title: OEMBED.title, post_data: YT })
    expect(a.updates[0].filters).toEqual([['id', 9], ['user_id', 'user-1']])

    vi.mocked(safeFetch).mockResolvedValue(new Response(JSON.stringify(OEMBED)))
    const b = fakeSupabase()
    await enrichSocialPost(b.client as any, 'user-1', { ...row, title: 'My favourite song' }, 'repair')
    expect(b.updates[0].patch.title).toBe(undefined)
    expect(b.updates[0].patch.post_data).toEqual(YT)
  })

  it('not found: only the failure time is stored (tried again after a day)', async () => {
    vi.mocked(safeFetch).mockResolvedValue(new Response('', { status: 404 }))
    const f = fakeSupabase()
    expect(await enrichSocialPost(f.client as any, 'user-1', { id: 9, type: 'youtube', url: 'https://youtu.be/dQw4w9WgXcQ' }, 'repair')).toBe('not-found')
    expect(Object.keys(f.updates[0].patch)).toEqual(['post_data_failed_at'])
    expect(needsSnapshot({ type: 'youtube', url: 'https://youtu.be/dQw4w9WgXcQ', post_data: null, post_data_failed_at: new Date().toISOString() })).toBe(false)
  })

  it('the dashboard asks for YouTube cards without a snapshot', () => {
    expect(needsRepair({ id: 1, post_data: null }, 'youtube')).toBe(true)
    expect(needsRepair({ id: 1, post_data: YT as any }, 'youtube')).toBe(false)
  })

  it('a YouTube snapshot is never read as X or Instagram data', () => {
    expect(getYouTubePost({ post_data: YT as any })).toEqual(YT)
    expect(getXPost({ post_data: YT as any })).toBe(null)
    expect(getInstagramPost({ post_data: YT as any })).toBe(null)
    expect(getYouTubePost({ post_data: { v: 1, platform: 'instagram', handle: 'x' } as any })).toBe(null)
  })
})

describe('card hover text', () => {
  const base = { id: 1, created_at: '', category: 'Inbox', user_id: 'u' }

  it('YouTube: video title over the channel, never the address', () => {
    const url = 'https://youtube.com/watch?v=dQw4w9WgXcQ'
    expect(cardHoverText({ ...base, url, title: url, post_data: YT } as any, 'youtube', 'youtube.com'))
      .toEqual({ title: OEMBED.title, sub: 'Rick Astley' })
    expect(cardHoverText({ ...base, url, title: url } as any, 'youtube', 'youtube.com'))
      .toEqual({ title: null, sub: 'youtube.com' })
    expect(cardHoverText({ ...base, url, title: 'A real title' } as any, 'youtube', 'youtube.com'))
      .toEqual({ title: 'A real title', sub: 'youtube.com' })
  })

  it('Instagram: @handle over the site, nothing when unknown', () => {
    const ig = { ...base, url: 'https://instagram.com/p/DeeKFPmNo0L', title: 'Philosophy Of Physics on Instagram: "x"',
      description: '98K likes, 475 comments - philosophyofphys on October 14, 2026: "x"' }
    expect(cardHoverText(ig as any, 'instagram', 'instagram.com')).toEqual({ title: '@philosophyofphys', sub: 'instagram.com' })
    expect(cardHoverText({ ...ig, description: null, title: 'Instagram' } as any, 'instagram', 'instagram.com')).toEqual({ title: null, sub: 'instagram.com' })
  })

  it('other links: the title, but never a bare address or placeholder', () => {
    expect(cardHoverText({ ...base, url: 'https://a.co/x', title: 'Great page' } as any, 'link', 'a.co')).toEqual({ title: 'Great page', sub: 'a.co' })
    expect(cardHoverText({ ...base, url: 'https://a.co/x', title: 'https://a.co/x' } as any, 'link', 'a.co')).toEqual({ title: null, sub: 'a.co' })
    expect(cardHoverText({ ...base, url: 'https://a.co/x.pdf', title: 'Saved Item' } as any, 'pdf', 'a.co')).toEqual({ title: null, sub: 'PDF DOCUMENT' })
  })
})
