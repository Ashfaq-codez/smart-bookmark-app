import { describe, it, expect } from 'vitest'
import { JSDOM } from 'jsdom'
import fs from 'node:fs'
import path from 'node:path'

// Runs the extension's extract.js inside a fake page (jsdom) at the given address.
const SRC = fs.readFileSync(path.resolve(__dirname, '../smart-bookmarks-ext/extract.js'), 'utf8')
function page(url: string, body: string, head = '') {
  const dom = new JSDOM(`<!doctype html><html><head>${head}</head><body>${body}</body></html>`, { url, runScripts: 'outside-only' })
  dom.window.eval(SRC)
  const ex = (dom.window as any).inntoitExtract
  const doc = dom.window.document
  const $ = (sel: string) => doc.querySelector(sel)!
  return { ex, doc, $, at: (sel: string) => ex.extractExactUrl($(sel), url) }
}

// ---------- sample markup (trimmed copies of the real sites' structure) ----------
const X_TIMELINE = `
<article data-testid="tweet">
  <a href="/jack"><img id="avatar" src="https://pbs.twimg.com/profile_images/1/a.jpg"></a>
  <a href="/jack/status/20?s=20"><time datetime="2026-01-01">Jan 1</time></a>
  <div id="text">just setting up <a id="ext" href="https://example.com/article">example.com</a></div>
  <a href="/jack/status/20/photo/1"><img id="photo" src="https://pbs.twimg.com/media/abc.jpg"></a>
</article>
<div id="sidebar"><a id="trend" href="/explore">Explore</a><span id="plain">Trends</span></div>`

const IG_FEED = `
<article id="post">
  <header><a href="/nasa/"><img id="avatar" alt="nasa's profile picture" src="https://scontent.cdninstagram.com/avatar.jpg" width="32" height="32"></a>
    <a href="/nasa/">nasa</a></header>
  <div><img id="pic" alt="Photo by NASA" width="1080" height="1350"
      src="https://scontent-icn2-1.cdninstagram.com/v/small.jpg"
      srcset="https://scontent-icn2-1.cdninstagram.com/v/small.jpg 640w, https://scontent-icn2-1.cdninstagram.com/v/big.jpg 1080w"></div>
  <div><span id="caption">Earth at night<br>from orbit</span></div>
  <a href="/p/ABCdef123/"><time datetime="2026-01-01">1d</time></a>
</article>
<article id="reel">
  <header><a href="/esa/">esa</a></header>
  <video id="vid" poster="https://scontent.cdninstagram.com/v/poster.jpg" src="blob:https://www.instagram.com/x"></video>
  <a href="/reel/XYZreel99/"><time>2d</time></a>
</article>
<div id="stories"><span id="loose">Stories</span></div>`

// ---------- X ----------
describe('X', () => {
  it('the picture, the text and a link inside a post all give the post address', () => {
    const p = page('https://x.com/home', X_TIMELINE)
    expect(p.at('#photo')).toEqual({ url: 'https://x.com/jack/status/20' })
    expect(p.at('#text')).toEqual({ url: 'https://x.com/jack/status/20' })
    expect(p.at('#ext')).toEqual({ url: 'https://x.com/jack/status/20' })
  })

  it('outside a post on the timeline: no address (never x.com/home)', () => {
    const p = page('https://x.com/home', X_TIMELINE)
    expect(p.at('#plain')).toEqual({ url: null, reason: 'x-not-post' })
    expect(p.at('#trend')).toEqual({ url: null, reason: 'x-not-post' })
  })

  it('on a post page, a click outside the article still gives that post', () => {
    const p = page('https://x.com/jack/status/20?s=46', X_TIMELINE)
    expect(p.at('#plain')).toEqual({ url: 'https://x.com/jack/status/20' })
  })

  it('twitter.com works the same', () => {
    const p = page('https://twitter.com/home', X_TIMELINE)
    expect(p.at('#photo')).toEqual({ url: 'https://twitter.com/jack/status/20' })
  })
})

// ---------- Instagram ----------
describe('Instagram', () => {
  it('picture, caption and avatar of a feed post all give the same post address', () => {
    const p = page('https://www.instagram.com/', IG_FEED)
    const want = { url: 'https://www.instagram.com/p/ABCdef123/' }
    expect(p.at('#pic')).toEqual(want)
    expect(p.at('#caption')).toEqual(want)
    expect(p.at('#avatar')).toEqual(want)
  })

  it('a reel video gives the reel address', () => {
    const p = page('https://www.instagram.com/', IG_FEED)
    expect(p.at('#vid')).toEqual({ url: 'https://www.instagram.com/reel/XYZreel99/' })
  })

  it('outside any post on the feed: no address (never the feed)', () => {
    const p = page('https://www.instagram.com/', IG_FEED)
    expect(p.at('#loose')).toEqual({ url: null, reason: 'instagram-not-post' })
  })

  it('a post without a <time> link uses the nearest post link', () => {
    const p = page('https://www.instagram.com/nasa/', `<a href="/nasa/p/GRIDpost1/"><img id="tile" src="https://scontent.cdninstagram.com/t.jpg"></a>`)
    expect(p.at('#tile')).toEqual({ url: 'https://www.instagram.com/p/GRIDpost1/' })
  })

  it('on a post page anything gives that post; a profile page gives nothing', () => {
    expect(page('https://www.instagram.com/p/ABCdef123/?img_index=2', '<span id="s">x</span>').at('#s'))
      .toEqual({ url: 'https://www.instagram.com/p/ABCdef123/' })
    expect(page('https://www.instagram.com/nasa/', '<span id="s">x</span>').at('#s'))
      .toEqual({ url: null, reason: 'instagram-not-post' })
  })

  it('only exact /p/, /reel/, /tv/ paths count', () => {
    const p = page('https://www.instagram.com/', '')
    expect(p.ex.instagramPostUrl('/p/ABCdef123/', 'https://www.instagram.com/')).toBe('https://www.instagram.com/p/ABCdef123/')
    expect(p.ex.instagramPostUrl('/tv/ABCdef123', 'https://www.instagram.com/')).toBe('https://www.instagram.com/tv/ABCdef123/')
    expect(p.ex.instagramPostUrl('/p/ABCdef123/comments/', 'https://www.instagram.com/')).toBe(null)
    expect(p.ex.instagramPostUrl('/explore/', 'https://www.instagram.com/')).toBe(null)
    expect(p.ex.instagramPostUrl('https://medium.com/p/ABCdef123', 'https://www.instagram.com/')).toBe(null)
  })

  it('does not match other sites: medium.com/p/ is a normal link', () => {
    const p = page('https://medium.com/', '<article><a id="m" href="https://medium.com/p/abc123def">Story</a></article>')
    expect(p.at('#m')).toEqual({ url: 'https://medium.com/p/abc123def' })
  })
})

describe('Instagram capture', () => {
  it('reads handle, caption with line breaks, and the biggest picture (not the avatar)', () => {
    const p = page('https://www.instagram.com/', IG_FEED)
    expect(p.ex.captureInstagram(p.$('#pic'), 'https://www.instagram.com/', p.doc)).toEqual({
      handle: 'nasa',
      caption: null,
      image_url: 'https://scontent-icn2-1.cdninstagram.com/v/big.jpg',
      is_video: false,
    })
  })

  it('uses the <h1> caption and keeps its line breaks', () => {
    const p = page('https://www.instagram.com/p/ABCdef123/', `<main><article>
      <a href="/nasa/">nasa</a><h1 id="c">Line one<br>Line two</h1>
      <img src="https://scontent.cdninstagram.com/v/p.jpg" width="1080" height="1080"></article></main>`)
    const c = p.ex.captureInstagram(p.$('#c'), 'https://www.instagram.com/p/ABCdef123/', p.doc)
    expect(c.caption).toBe('Line one\nLine two')
    expect(c.handle).toBe('nasa')
  })

  it('a video post gives the poster, never the video', () => {
    const p = page('https://www.instagram.com/', IG_FEED)
    const c = p.ex.captureInstagram(p.$('#vid'), 'https://www.instagram.com/', p.doc)
    expect(c).toEqual({ handle: 'esa', caption: null, image_url: 'https://scontent.cdninstagram.com/v/poster.jpg', is_video: true })
  })

  it('on a post page falls back to og:description and og:image', () => {
    const head = `<meta property="og:description" content='12 likes, 3 comments - nasa on May 1, 2026: "Hello &quot;space&quot;"'>
      <meta property="og:image" content="https://scontent.cdninstagram.com/v/og.jpg">`
    const p = page('https://www.instagram.com/p/ABCdef123/', '<main><a href="/nasa/">nasa</a></main>', head)
    expect(p.ex.captureInstagram(null, 'https://www.instagram.com/p/ABCdef123/', p.doc)).toEqual({
      handle: 'nasa', caption: 'Hello "space"', image_url: 'https://scontent.cdninstagram.com/v/og.jpg', is_video: false,
    })
  })

  it('ignores pictures that are not on the Instagram CDN', () => {
    const p = page('https://www.instagram.com/', '<article><a href="/x/">x</a><img id="i" src="https://evil.example/a.jpg"></article>')
    expect(p.ex.captureInstagram(p.$('#i'), 'https://www.instagram.com/', p.doc).image_url).toBe(null)
  })
})

// ---------- YouTube / Pinterest / other sites ----------
describe('YouTube', () => {
  it('a video card gives the clean watch address', () => {
    const p = page('https://www.youtube.com/', `<ytd-rich-item-renderer><a id="video-title-link" href="/watch?v=abc123&list=PL1&pp=xx">T</a>
      <img id="thumb" src="https://i.ytimg.com/vi/abc123/hq.jpg"></ytd-rich-item-renderer>`)
    expect(p.at('#thumb')).toEqual({ url: 'https://www.youtube.com/watch?v=abc123' })
  })

  it('the player on a watch page gives the page address', () => {
    const p = page('https://www.youtube.com/watch?v=abc123&list=PL1', `<div id="movie_player"><video id="v" src="blob:https://www.youtube.com/1"></video></div>`)
    expect(p.at('#v')).toEqual({ url: 'https://www.youtube.com/watch?v=abc123' })
  })
})

describe('Pinterest', () => {
  it('a pin card gives the pin address', () => {
    const p = page('https://www.pinterest.co.uk/', `<div data-test-id="pin"><a href="/pin/12345/"><img id="pin" src="https://i.pinimg.com/x.jpg"></a></div>`)
    expect(p.at('#pin')).toEqual({ url: 'https://www.pinterest.co.uk/pin/12345/' })
  })
})

describe('other sites', () => {
  it('a link gives its address; a lone picture or video is sent as media', () => {
    const p = page('https://blog.example/', `<a id="a" href="/post">Post</a><img id="i" src="https://cdn.example/a.png"><video id="v" src="https://cdn.example/a.mp4"></video><video id="b" src="blob:https://blog.example/1"></video>`)
    expect(p.at('#a')).toEqual({ url: 'https://blog.example/post' })
    expect(p.at('#i')).toEqual({ url: 'https://cdn.example/a.png', type: 'image' })
    expect(p.at('#v')).toEqual({ url: 'https://cdn.example/a.mp4', type: 'video' })
    expect(p.at('#b')).toBe(null)
  })

  it('"dropbox.com" is not "x.com"', () => {
    const p = page('https://www.dropbox.com/', '<article data-testid="tweet"><a id="a" href="/jack/status/1">x</a></article>')
    expect(p.at('#a')).toEqual({ url: 'https://www.dropbox.com/jack/status/1' })
  })
})

// ---------- no content script answer: background fallback ----------
describe('fallbackTarget (content script missing)', () => {
  const { ex } = page('https://example.com/', '')
  it('social sites never use the CDN picture address', () => {
    expect(ex.fallbackTarget({ pageUrl: 'https://x.com/jack/status/20?s=20', srcUrl: 'https://pbs.twimg.com/media/a.jpg', mediaType: 'image' }))
      .toEqual({ url: 'https://x.com/jack/status/20' })
    expect(ex.fallbackTarget({ pageUrl: 'https://www.instagram.com/p/ABCdef123/', srcUrl: 'https://scontent.cdninstagram.com/a.jpg', mediaType: 'image' }))
      .toEqual({ url: 'https://www.instagram.com/p/ABCdef123/' })
  })
  it('a post link on the feed is used; otherwise the feed gives nothing', () => {
    expect(ex.fallbackTarget({ pageUrl: 'https://www.instagram.com/', linkUrl: 'https://www.instagram.com/p/ABCdef123/' }))
      .toEqual({ url: 'https://www.instagram.com/p/ABCdef123/' })
    expect(ex.fallbackTarget({ pageUrl: 'https://www.instagram.com/', srcUrl: 'https://scontent.cdninstagram.com/a.jpg', mediaType: 'image' }))
      .toEqual({ url: null, reason: 'instagram-not-post' })
    expect(ex.fallbackTarget({ pageUrl: 'https://x.com/home' })).toEqual({ url: null, reason: 'x-not-post' })
  })
  it('elsewhere: link, then media as its type, then the page', () => {
    expect(ex.fallbackTarget({ pageUrl: 'https://blog.example/', linkUrl: 'https://blog.example/a' })).toEqual({ url: 'https://blog.example/a' })
    expect(ex.fallbackTarget({ pageUrl: 'https://blog.example/', srcUrl: 'https://cdn.example/a.png', mediaType: 'image' }))
      .toEqual({ url: 'https://cdn.example/a.png', type: 'image' })
    expect(ex.fallbackTarget({ pageUrl: 'https://blog.example/', srcUrl: 'blob:https://blog.example/1', mediaType: 'video' }))
      .toEqual({ url: 'https://blog.example/' })
  })
})

describe('page checks', () => {
  const { ex } = page('https://example.com/', '')
  it('pageProblem flags feeds and non-post pages', () => {
    expect(ex.pageProblem('https://www.instagram.com/')).toBe('instagram-not-post')
    expect(ex.pageProblem('https://www.instagram.com/p/ABCdef123/')).toBe(null)
    expect(ex.pageProblem('https://x.com/home')).toBe('x-not-post')
    expect(ex.pageProblem('https://x.com/i/status/20')).toBe(null)
    expect(ex.pageProblem('https://example.com/')).toBe(null)
  })
  it('cleanTitle drops "(3) " and " / X"', () => {
    expect(ex.cleanTitle('(3) Jack on X: "hi" / X')).toBe('Jack on X: "hi"')
    expect(ex.cleanTitle(undefined)).toBe('')
  })
})
