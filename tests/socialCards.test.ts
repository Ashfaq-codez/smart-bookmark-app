import { describe, it, expect, vi, beforeEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { renderToString } from 'react-dom/server'
import { createElement } from 'react'

vi.mock('@/utils/safeFetch', () => ({ isSafeUrl: vi.fn(), safeFetch: vi.fn() }))
import { isSafeUrl, safeFetch } from '@/utils/safeFetch'
import { readRedditEmbed, fetchRedditPost } from '@/lib/redditMeta'
import { redditPostRef, detectSiteType } from '@/lib/urlTools'
import { readArticleMeta, articleFromMeta, articlePlatform } from '@/lib/articleMeta'
import { parsePageCapture } from '@/lib/pageCapture'
import { enrichSocialPost, needsSnapshot } from '@/lib/enrichSocialPost'
import { getRedditPost, getArticlePost, getXPost, getInstagramPost, articlePlatformOf } from '@/lib/postData'
import { deriveDisplayType, cardHoverText, faviconUrl, getUniversalEmbedUrl } from '@/utils/bookmarkHelpers'
import { RedditCard, RedditPreview } from '@/components/social/RedditCard'
import { ArticleCard, ArticlePreview } from '@/components/social/ArticleCard'
import { compactNumber, shortDate } from '@/components/social/bits'
import { fakeSupabase } from './helpers/fakeSupabase'

// Real pages: Reddit's official embed page (trimmed), a Substack post page (trimmed). medium.html is assembled.
const fx = (p: string) => fs.readFileSync(path.resolve(__dirname, 'fixtures', p), 'utf8')
const base = { id: 1, created_at: '2026-10-15T00:00:00Z', category: 'Inbox', user_id: 'u' }

beforeEach(() => { vi.mocked(safeFetch).mockReset(); vi.mocked(isSafeUrl).mockResolvedValue(true) })

describe('Reddit', () => {
  it('knows Reddit post addresses', () => {
    expect(redditPostRef('https://www.reddit.com/r/IAmA/comments/z1c9z/i_am_barack_obama/')).toEqual({ sub: 'IAmA', id: 'z1c9z' })
    expect(redditPostRef('https://old.reddit.com/r/programming/comments/1dsxv2')).toEqual({ sub: 'programming', id: '1dsxv2' })
    expect(redditPostRef('https://www.reddit.com/r/programming/')).toBe(null)
    expect(redditPostRef('https://notreddit.com/r/a/comments/abc/')).toBe(null)
    expect(detectSiteType('https://www.reddit.com/r/a/comments/abc/')).toBe('reddit')
  })

  it('text post: title, subreddit, author, upvotes, text, time', () => {
    const p = readRedditEmbed(fx('reddit/text-post.html'), { sub: 'IAmA', id: 'z1c9z' })!
    expect(p).toMatchObject({ platform: 'reddit', title: 'I am Barack Obama, President of the United States -- AMA', subreddit: 'IAmA', author: 'PresidentObama', score: 216186, kind: 'text', nsfw: false })
    expect(p.body).toMatch(/^Hi, I/)
    expect(p.subreddit_icon).toMatch(/^https:\/\/styles\.redditmedia\.com\//)
    expect(p.created_at).toMatch(/^2012-/)
  })

  it('image post: the picture from Reddit\'s own image server', () => {
    const p = readRedditEmbed(fx('reddit/image-post.html'), { sub: 'programming', id: '1dsxv2' })!
    expect(p.kind).toBe('image')
    expect(p.image).toMatch(/^https:\/\/(i|preview|external-preview)\.redd\.it\//)
    expect(p.author).toBe('WhatTheFoxtrout')
  })

  it('NSFW post: never keeps a picture', () => {
    const p = readRedditEmbed(fx('reddit/nsfw-link-post.html'), { sub: 'explainlikeimfive', id: '1dkt5z9' })!
    expect(p.nsfw).toBe(true)
    expect(p.image).toBe(null)
    expect(p.kind).toBe('link')
  })

  it('falls back to oEmbed when the embed page is refused', async () => {
    vi.mocked(safeFetch).mockImplementation(async (u: any) => String(u).includes('embed.reddit.com')
      ? new Response('', { status: 403 })
      : new Response(JSON.stringify({ title: 'Cloud behind chimney looks just like smoke.', author_name: 'WhatTheFoxtrout' })))
    const r = await fetchRedditPost('https://www.reddit.com/r/programming/comments/1dsxv2/')
    expect(r).toMatchObject({ ok: true, post: { title: 'Cloud behind chimney looks just like smoke.', author: 'WhatTheFoxtrout', subreddit: 'programming' } })
  })

  it('save: title, text and picture from the post; repair never replaces an edited title', async () => {
    vi.mocked(safeFetch).mockResolvedValue(new Response(fx('reddit/text-post.html')))
    const a = fakeSupabase()
    const row = { id: 4, type: 'reddit', url: 'https://www.reddit.com/r/IAmA/comments/z1c9z/' }
    expect(await enrichSocialPost(a.client as any, 'user-1', row, 'save')).toBe('stored')
    expect(a.updates[0].patch).toMatchObject({ title: expect.stringMatching(/^I am Barack Obama/), description: expect.stringMatching(/^Hi, I/) })
    expect(a.updates[0].filters).toEqual([['id', 4], ['user_id', 'user-1']])

    vi.mocked(safeFetch).mockResolvedValue(new Response(fx('reddit/text-post.html')))
    const b = fakeSupabase()
    await enrichSocialPost(b.client as any, 'user-1', { ...row, type: 'link', title: 'My AMA bookmark', description: 'my note' }, 'repair')
    expect(b.updates[0].patch.title).toBe(undefined)
    expect(b.updates[0].patch.description).toBe(undefined)
    expect(b.updates[0].patch.post_data.platform).toBe('reddit')
  })

  it('old Reddit links (type "link") are repaired too', () => {
    expect(needsSnapshot({ type: 'link', url: 'https://www.reddit.com/r/pics/comments/abc/', post_data: null })).toBe(true)
    expect(needsSnapshot({ type: 'link', url: 'https://www.reddit.com/r/pics/', post_data: null })).toBe(false)
  })

  it('the editor never tries Reddit\'s refused iframe any more', () => {
    expect(getUniversalEmbedUrl('https://reddit.com/r/a/comments/abc/x')).toBe(null)
  })
})

describe('Substack and Medium', () => {
  it('Substack: title, subtitle, author, newsletter, cover, reading time (real page)', () => {
    const url = 'https://www.lennysnewsletter.com/p/60-creative-growth-ideas'
    const a = articleFromMeta(url, readArticleMeta(fx('articles/substack.html')))!
    expect(a).toMatchObject({ platform: 'substack', title: '60+ new creative growth ideas', subtitle: 'How to stand out when everyone is running the same playbook', author: 'Tom Orbach', publication: "Lenny's Newsletter" })
    expect(a.image).toMatch(/^https:\/\/substackcdn\.com\//)
    expect(a.read_minutes).toBe(24)
  })

  it('Medium: from the meta tags the extension sends (the server is refused)', () => {
    const meta = parsePageCapture(readArticleMeta(fx('articles/medium.html')))!
    const a = articleFromMeta('https://medium.com/@ev/welcome-to-medium-9e53ca408c48', meta)!
    expect(a).toMatchObject({ platform: 'medium', title: 'Welcome to Medium', author: 'Ev Williams', publication: null, read_minutes: 3 })
    expect(a.published_at).toMatch(/^2012-08-15/)
  })

  it('other sites are not articles', () => {
    expect(articlePlatform('https://example.com/post', { title: 'x', site_name: 'Example' })).toBe(null)
  })

  it('page details from the extension are checked', () => {
    expect(parsePageCapture({ title: 'Hi\u0000 there', image: 'javascript:alert(1)', author: 'x'.repeat(500), word_count: -3 }))
      .toEqual({ title: 'Hi there', author: 'x'.repeat(120) })
    expect(parsePageCapture({ description: 'no title' })).toBe(null)
    expect(parsePageCapture('nope')).toBe(null)
  })

  it('Substack on its own domain is recognised from the stored snapshot', () => {
    const b = { ...base, url: 'https://www.lennysnewsletter.com/p/x', title: 't', type: 'link',
      post_data: { v: 1, platform: 'substack', title: 't', subtitle: null, author: null, publication: null, image: null, published_at: null, read_minutes: null } }
    expect(deriveDisplayType(b as any)).toBe('substack')
    expect(deriveDisplayType({ ...base, url: 'https://medium.com/@a/b', title: 't', type: 'link' } as any)).toBe('medium')
    expect(deriveDisplayType({ ...base, url: 'https://example.com/p/x', title: 't', type: 'link' } as any)).toBe('link')
  })
})

describe('the cards', () => {
  const reddit = readRedditEmbed(fx('reddit/text-post.html'), { sub: 'IAmA', id: 'z1c9z' })!
  const redditRow = { ...base, type: 'reddit', url: 'https://www.reddit.com/r/IAmA/comments/z1c9z/', title: reddit.title, post_data: reddit }

  it('Reddit card and full view show the post, never "refused to connect" or an iframe', () => {
    for (const C of [RedditCard, RedditPreview]) {
      const html = renderToString(createElement(C, { bookmark: redditRow as any })).replace(/<!-- -->/g, '')
      expect(html).toContain('r/IAmA')
      expect(html).toContain('u/PresidentObama')
      expect(html).toContain('216K')
      expect(html).not.toContain('<iframe')
    }
  })

  it('a Reddit card before its snapshot arrives shows a clean title, not the address', () => {
    const html = renderToString(createElement(RedditCard, { bookmark: { ...base, type: 'reddit', url: 'https://www.reddit.com/r/IAmA/comments/z1c9z/', title: 'https://www.reddit.com/r/IAmA/comments/z1c9z/' } as any })).replace(/<!-- -->/g, '')
    expect(html).toContain('Reddit post')
    expect(html).toContain('r/IAmA')
  })

  it('Substack and Medium cards in their own look', () => {
    const url = 'https://www.lennysnewsletter.com/p/60-creative-growth-ideas'
    const sub = articleFromMeta(url, readArticleMeta(fx('articles/substack.html')))!
    const html = renderToString(createElement(ArticleCard, { bookmark: { ...base, type: 'link', url, title: sub.title, post_data: sub } as any, platform: 'substack' })).replace(/<!-- -->/g, '')
    expect(html).toContain("Lenny&#x27;s Newsletter")
    expect(html).toContain('24 min read')
    const full = renderToString(createElement(ArticlePreview, { bookmark: { ...base, type: 'link', url, title: sub.title, post_data: sub } as any, platform: 'substack' })).replace(/<!-- -->/g, '')
    expect(full).toContain('Read on Substack')
    const med = renderToString(createElement(ArticleCard, { bookmark: { ...base, type: 'link', url: 'https://medium.com/@ev/x', title: 'Welcome to Medium' } as any, platform: 'medium' }))
    expect(med).toContain('Welcome to Medium')
  })

  it('hover text: Reddit title over r/sub; articles over the publication', () => {
    expect(cardHoverText(redditRow as any, 'reddit', 'reddit.com')).toEqual({ title: reddit.title, sub: 'r/IAmA' })
  })

  it('site icons come from a working service; bad domains get none', () => {
    expect(faviconUrl('substack.com')).toBe('https://icons.duckduckgo.com/ip3/substack.com.ico')
    expect(faviconUrl('bad domain"><x')).toBe('')
  })

  it('snapshots never mix between platforms', () => {
    const sub = { v: 1, platform: 'substack', title: 't' }
    expect(getRedditPost({ post_data: sub as any })).toBe(null)
    expect(getArticlePost({ post_data: reddit })).toBe(null)
    expect(getXPost({ post_data: reddit })).toBe(null)
    expect(getInstagramPost({ post_data: sub as any })).toBe(null)
    expect(articlePlatformOf({ post_data: reddit, url: 'https://reddit.com/r/a/comments/b' })).toBe(null)
  })

  it('numbers and dates', () => {
    expect(compactNumber(216186)).toBe('216K')
    expect(compactNumber(1234)).toBe('1.2K')
    expect(compactNumber(12)).toBe('12')
    const now = Date.parse('2026-10-15T12:00:00Z')
    expect(shortDate('2026-10-15T09:00:00Z', now)).toBe('3h')
    expect(shortDate('2012-08-31T00:00:00Z', now)).toBe('Aug 31, 2012')
  })
})

describe('Reddit addresses from the phone apps', () => {
  it('cleans post addresses and knows share links', async () => {
    const { canonicalizeRedditUrl, isRedditShareLink, normalizeUrl } = await import('@/lib/urlTools')
    expect(canonicalizeRedditUrl('https://old.reddit.com/r/IAmA/comments/Z1C9Z/i_am_barack/?utm_source=share')).toBe('https://www.reddit.com/r/IAmA/comments/z1c9z/i_am_barack/')
    expect(canonicalizeRedditUrl('https://www.reddit.com/comments/1dsxv2')).toBe('https://www.reddit.com/comments/1dsxv2/')
    expect(canonicalizeRedditUrl('https://www.reddit.com/r/IAmA/')).toBe(null)
    expect(normalizeUrl('reddit.com/r/IAmA/comments/z1c9z/x?share_id=1')).toBe('https://www.reddit.com/r/IAmA/comments/z1c9z/x/')
    expect(isRedditShareLink('https://www.reddit.com/r/privacy/s/XaJ5kGdbva')).toBe(true)
    expect(isRedditShareLink('https://redd.it/1dsxv2')).toBe(true)
    expect(isRedditShareLink('https://www.reddit.com/r/privacy/comments/1kpib8z/')).toBe(false)
    expect(isRedditShareLink('https://evil.com/r/privacy/s/XaJ5kGdbva')).toBe(false)
    expect(redditPostRef('https://www.reddit.com/comments/1dsxv2/')).toEqual({ sub: '', id: '1dsxv2' })
  })

  it('a redd.it post (no subreddit in the address) learns its subreddit from the post', async () => {
    vi.mocked(safeFetch).mockResolvedValue(new Response(fx('reddit/image-post.html')))
    const r = await fetchRedditPost('https://www.reddit.com/comments/1dsxv2/')
    expect(r).toMatchObject({ ok: true, post: { subreddit: 'programming' } })
    expect(String(vi.mocked(safeFetch).mock.calls[0][0])).toBe('https://embed.reddit.com/r/reddit/comments/1dsxv2/')
  })

  it('an old bookmark saved from a share link is repaired to the real post', async () => {
    const { needsSnapshot: needs } = await import('@/lib/enrichSocialPost')
    expect(needs({ type: 'link', url: 'https://reddit.com/r/privacy/s/XaJ5kGdbva', post_data: null })).toBe(true)
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 301, headers: { location: 'https://www.reddit.com/r/programming/comments/1dsxv2/cloud/?share_id=1' } }))
    vi.mocked(safeFetch).mockResolvedValue(new Response(fx('reddit/image-post.html')))
    try {
      const f = fakeSupabase()
      expect(await enrichSocialPost(f.client as any, 'user-1', { id: 2, type: 'link', url: 'https://reddit.com/r/privacy/s/XaJ5kGdbva' }, 'repair')).toBe('stored')
      expect(f.updates[0].patch.url).toBe('https://www.reddit.com/r/programming/comments/1dsxv2/cloud/')
      expect(f.updates[0].patch.post_data.subreddit).toBe('programming')
    } finally {
      fetchSpy.mockRestore()
    }
  })
})

describe('fixes after the first iPhone tests', () => {
  it('Reddit picture posts on cf.preview.redd.it: the full picture is found (real page)', () => {
    const p = readRedditEmbed(fx('reddit/picture-post-cf.html'), { sub: 'TwentiesIndia', id: '1x6bjzb' })!
    expect(p.kind).toBe('image')
    expect(p.image).toBe('https://i.redd.it/ngj2htq8zjvh1.png')
    expect(p.subreddit).toBe('TwentiesIndia')
  })

  it('a Reddit card whose snapshot missed the picture uses the saved one', () => {
    const snap = { ...readRedditEmbed(fx('reddit/text-post.html'), { sub: 'IAmA', id: 'z1c9z' })!, image: null }
    const html = renderToString(createElement(RedditCard, { bookmark: { ...base, type: 'reddit', url: 'https://www.reddit.com/r/IAmA/comments/z1c9z/', title: 't', image_url: 'https://i.redd.it/abc123def.png', post_data: snap } as any }))
    expect(html).toContain('https://i.redd.it/abc123def.png')
  })

  it('Substack Note: text, author, photo, attached picture with its size, counts (real page)', async () => {
    const { readSubstackNote, substackNoteTitle } = await import('@/lib/substackNote')
    const n = readSubstackNote(fx('articles/substack-note.html'))!
    expect(n).toMatchObject({ platform: 'substack-note', text: 'Ahh. Finally dialled', author: { name: 'Chris Best', handle: 'cb' }, likes: 69, restacks: 5, replies: 9 })
    expect(n.author.avatar).toMatch(/^https:\/\/substackcdn\.com\//)
    expect(n.images).toEqual([{ url: expect.stringMatching(/1206x1999\.jpeg$/), width: 1206, height: 1999 }])
    expect(substackNoteTitle(n)).toBe('Chris Best on Substack: Ahh. Finally dialled')
  })

  it('Substack Note without the app data: structured data is the backup', async () => {
    const { readSubstackNote } = await import('@/lib/substackNote')
    const html = fx('articles/substack-note.html').replace(/<script>window\._preloads[\s\S]*?<\/script>/, '')
    expect(readSubstackNote(html)).toMatchObject({ text: 'Ahh. Finally dialled', author: { name: 'Chris Best', handle: 'cb', avatar: null }, likes: 69 })
  })

  it('Notes are not articles: their own type, card and repair', async () => {
    const { isSubstackNoteUrl } = await import('@/lib/postData')
    const { needsRepair } = await import('@/hooks/useSnapshotRepair')
    const url = 'https://substack.com/@cb/note/c-361346907'
    expect(isSubstackNoteUrl(url)).toBe(true)
    expect(isSubstackNoteUrl('https://substack.com/@3blue1brown/note/p-143167821')).toBe(false)
    const oldRow = { ...base, type: 'link', url, title: 'Chris Best (@cb)', description: 'Ahh. Finally dialled',
      post_data: { v: 1, platform: 'substack', title: 'Chris Best (@cb)', subtitle: 'Ahh. Finally dialled', author: null, publication: null, image: null, published_at: null, read_minutes: null } }
    expect(deriveDisplayType(oldRow as any)).toBe('substack-note')
    expect(needsRepair(oldRow as any, 'substack-note')).toBe(true)        // stored as an article: read again
    expect(needsSnapshot(oldRow as any)).toBe(true)
    // before the note is read again, the card already shows the author and the text
    const html = renderToString(createElement((await import('@/components/social/SubstackNoteCard')).SubstackNoteCard, { bookmark: oldRow as any })).replace(/<!-- -->/g, '')
    expect(html).toContain('Chris Best')
    expect(html).toContain('@cb')
    expect(html).toContain('Ahh. Finally dialled')
  })

  it('repair: reads the note, replaces Substack\'s "Name (@handle)" title, never an edited one', async () => {
    const url = 'https://substack.com/@cb/note/c-361346907'
    vi.mocked(safeFetch).mockResolvedValue(new Response(fx('articles/substack-note.html')))
    const a = fakeSupabase()
    expect(await enrichSocialPost(a.client as any, 'user-1', { id: 5, type: 'link', url, title: 'Chris Best (@cb)' }, 'repair')).toBe('stored')
    expect(a.updates[0].patch).toMatchObject({ title: 'Chris Best on Substack: Ahh. Finally dialled', post_data: { platform: 'substack-note' } })
    vi.mocked(safeFetch).mockResolvedValue(new Response(fx('articles/substack-note.html')))
    const b = fakeSupabase()
    await enrichSocialPost(b.client as any, 'user-1', { id: 5, type: 'link', url, title: 'Great photo' }, 'repair')
    expect(b.updates[0].patch.title).toBe(undefined)
  })

  it('Substack share tracking is removed from the address', async () => {
    const { normalizeUrl } = await import('@/lib/urlTools')
    expect(normalizeUrl('https://betterengineers.substack.com/p/rate-limiting-how-apis-stay-alive?r=4yp1kd&utm_medium=ios'))
      .toBe('https://betterengineers.substack.com/p/rate-limiting-how-apis-stay-alive')
    expect(normalizeUrl('https://example.com/a?r=1&utm_source=x')).toBe('https://example.com/a?r=1&utm_source=x')
  })
})
