// Finds WHAT was right-clicked: the exact post / video / link address.
// Plain functions with no chrome.* calls, so the tests can run them on sample pages (tests/extensionExtract.test.ts).
// Loaded before content.js; safe to load more than once.
(function (root) {
  // exact site or its sub-domains only ("dropbox.com" must not count as "x.com")
  const hostIs = (host, domain) => host === domain || host.endsWith('.' + domain);

  const siteOf = (pageUrl) => {
    let host = '';
    try { host = new URL(pageUrl).hostname.toLowerCase(); } catch (e) { return null; }
    if (hostIs(host, 'instagram.com')) return 'instagram';
    if (hostIs(host, 'x.com') || hostIs(host, 'twitter.com')) return 'twitter';
    if (hostIs(host, 'youtube.com')) return 'youtube';
    if (/(^|\.)pinterest\.[a-z.]+$/.test(host)) return 'pinterest';
    return null;
  };

  // Strips tracking junk and playlist IDs
  const cleanUrl = (rawUrl) => {
    try {
      const urlObj = new URL(rawUrl);
      if (hostIs(urlObj.hostname, 'youtube.com')) {
        urlObj.searchParams.delete('list');
        urlObj.searchParams.delete('index');
        urlObj.searchParams.delete('pp');
      }
      if (hostIs(urlObj.hostname, 'twitter.com') || hostIs(urlObj.hostname, 'x.com')) {
        // Drops all ?s= tracking params to match the iOS shortcut
        return urlObj.origin + urlObj.pathname;
      }
      return urlObj.toString();
    } catch (e) {
      return rawUrl;
    }
  };

  // An Instagram post address, or null. Only /p/<id>, /reel/<id> and /tv/<id> count
  // (also the /<user>/p/<id> form Instagram sometimes uses); returned as https://www.instagram.com/<kind>/<id>/.
  const instagramPostUrl = (href, base) => {
    try {
      const u = new URL(href, base);
      if (!hostIs(u.hostname.toLowerCase(), 'instagram.com')) return null;
      const m = u.pathname.match(/^\/(?:[A-Za-z0-9._]{1,30}\/)?(p|reel|tv)\/([A-Za-z0-9_-]{5,40})\/?$/);
      return m ? `https://www.instagram.com/${m[1]}/${m[2]}/` : null;
    } catch (e) {
      return null;
    }
  };

  // X post address (any handle, or /i/status), or null.
  const isXPostUrl = (href) => {
    try {
      const u = new URL(href);
      return (hostIs(u.hostname, 'x.com') || hostIs(u.hostname, 'twitter.com')) &&
        /^\/(?:i|[A-Za-z0-9_]{1,15})\/status(?:es)?\/\d+(?:\/|$)/.test(u.pathname);
    } catch (e) {
      return false;
    }
  };

  // Instagram: the post around the clicked spot. The picture, the video and the caption all give the same address.
  function instagramTarget(target, pageUrl) {
    const article = target && target.closest ? target.closest('article') : null;
    if (article) {
      const time = article.querySelector('time');
      const timeLink = time ? time.closest('a') : null;
      const fromTime = timeLink ? instagramPostUrl(timeLink.getAttribute('href'), pageUrl) : null;
      if (fromTime) return fromTime;
    }
    const near = target && target.closest ? target.closest('a[href*="/p/"], a[href*="/reel/"], a[href*="/tv/"]') : null;
    const fromLink = near ? instagramPostUrl(near.getAttribute('href'), pageUrl) : null;
    if (fromLink) return fromLink;
    // Only when the page itself is a post (never the feed, a profile or the explore page)
    return instagramPostUrl(pageUrl, pageUrl);
  }

  // Returns { url, type? } or null.
  //   type 'image' / 'video' = a picture or video file; otherwise the server decides the type from the address.
  //   { url: null, reason } = the page is a social site but no post was found (never save the feed address).
  function extractExactUrl(target, pageUrl) {
    if (!target) return null;
    const site = siteOf(pageUrl);
    try {
      if (site === 'youtube') {
        const ytCard = target.closest('ytd-rich-item-renderer, ytd-video-renderer, ytd-compact-video-renderer, ytd-grid-video-renderer, ytd-reel-item-renderer, ytd-playlist-video-renderer, ytd-playlist-panel-video-renderer');
        if (ytCard) {
          const a = ytCard.querySelector('a#video-title-link, a#video-title, a#thumbnail');
          if (a && a.href) return { url: cleanUrl(a.href) };
        }
        const path = new URL(pageUrl).pathname;
        if ((path.startsWith('/watch') || path.startsWith('/shorts')) && target.closest('#movie_player, ytd-watch-flexy, ytd-shorts, video')) {
          return { url: cleanUrl(pageUrl) };
        }
      }

      if (site === 'twitter') {
        const tweet = target.closest('article[data-testid="tweet"]');
        if (tweet) {
          const time = tweet.querySelector('time');
          const timeLink = time ? time.closest('a') : null;
          if (timeLink && timeLink.href && isXPostUrl(timeLink.href)) return { url: cleanUrl(timeLink.href) };
          const permalink = Array.from(tweet.querySelectorAll('a[href*="/status/"]'))
            .find((a) => /\/status\/\d+$/.test(new URL(a.href).pathname));
          if (permalink) return { url: cleanUrl(permalink.href) };
        }
        // A link inside a post (an article, a video site) is fine to save; X's own pages are not.
        const a = target.closest('a');
        if (a && a.href && !a.href.startsWith('javascript:') && siteOf(a.href) !== 'twitter') return { url: cleanUrl(a.href) };
        if (isXPostUrl(pageUrl)) return { url: cleanUrl(pageUrl) };
        return { url: null, reason: 'x-not-post' };
      }

      if (site === 'instagram') {
        const post = instagramTarget(target, pageUrl);
        if (post) return { url: post };
        return { url: null, reason: 'instagram-not-post' };
      }

      if (site === 'pinterest') {
        const pinCard = target.closest('div[data-test-id="pin"], div[data-test-id="pinWrapper"]');
        if (pinCard) {
          const pinLink = pinCard.querySelector('a[href*="/pin/"]');
          if (pinLink && pinLink.href) return { url: cleanUrl(pinLink.href) };
        }
      }

      const anchor = target.closest('a');
      if (anchor && anchor.href && !anchor.href.startsWith('javascript:')) {
        return { url: cleanUrl(anchor.href) };
      }

      // Media (ignore internal blobs)
      const tag = (target.tagName || '').toUpperCase();
      if (tag === 'VIDEO' && target.src && !target.src.startsWith('blob:')) return { url: cleanUrl(target.src), type: 'video' };
      if (tag === 'IMG' && target.src && !target.src.startsWith('blob:')) return { url: cleanUrl(target.src), type: 'image' };
    } catch (err) {
      console.error('inntoit extraction error:', err);
    }
    return null;
  }

  // ---------- Instagram capture ----------
  // Instagram image addresses expire and the server cannot read Instagram, so the post is read from the page here.
  const IG_CDN = (u) => {
    try {
      const h = new URL(u).hostname.toLowerCase();
      return new URL(u).protocol === 'https:' && (hostIs(h, 'cdninstagram.com') || hostIs(h, 'fbcdn.net'));
    } catch (e) { return false; }
  };
  const NOT_HANDLES = new Set(['p', 'reel', 'reels', 'tv', 'explore', 'accounts', 'stories', 'direct', 'about', 'legal', 'developer', 'web']);

  // Plain text with line breaks kept (<br> and block ends become new lines).
  function textWithBreaks(el) {
    let out = '';
    const walk = (n) => {
      if (n.nodeType === 3) { out += n.nodeValue; return; }
      if (n.nodeType !== 1) return;
      const tag = n.tagName.toUpperCase();
      if (tag === 'BR') { out += '\n'; return; }
      if (tag === 'SCRIPT' || tag === 'STYLE') return;
      n.childNodes.forEach(walk);
      if (tag === 'DIV' || tag === 'P' || tag === 'LI') out += '\n';
    };
    walk(el);
    return out.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  }

  // Biggest candidate from srcset, else src.
  function bestImageUrl(img) {
    const set = (img.getAttribute('srcset') || '').split(',').map((part) => {
      const [u, w] = part.trim().split(/\s+/);
      return { u, w: parseInt(w, 10) || 0 };
    }).filter((c) => c.u);
    set.sort((a, b) => b.w - a.w);
    return (set[0] && set[0].u) || img.getAttribute('src') || '';
  }

  // { handle, caption, image_url, is_video } for the post at `target` (or the post page), or null.
  function captureInstagram(target, pageUrl, doc) {
    const onPostPage = !!instagramPostUrl(pageUrl, pageUrl);
    const root = (target && target.closest && target.closest('article')) ||
      (onPostPage ? doc.querySelector('div[role="dialog"] article, main article, div[role="dialog"], main') : null);
    if (!root) return null;

    let handle = null;
    for (const a of root.querySelectorAll('a[href]')) {
      let path = '';
      try { path = new URL(a.getAttribute('href'), pageUrl).pathname; } catch (e) { continue; }
      const m = path.match(/^\/([A-Za-z0-9._]{1,30})\/?$/);
      if (m && !NOT_HANDLES.has(m[1].toLowerCase())) { handle = m[1]; break; }
    }

    const h1 = root.querySelector('h1');
    let caption = h1 ? textWithBreaks(h1) : '';
    if (!caption && onPostPage) {
      // og:description looks like: 12 likes, 3 comments - name on May 1, 2026: "the caption"
      const og = doc.querySelector('meta[property="og:description"]');
      const m = og && (og.getAttribute('content') || '').match(/:\s*"([\s\S]*)"\s*\.?$/);
      if (m) caption = m[1].trim();
    }

    const video = root.querySelector('video');
    let image = video && IG_CDN(video.getAttribute('poster') || '') ? video.getAttribute('poster') : '';
    if (!image) {
      // The main picture: the biggest one that is not a profile picture
      let best = null;
      let bestSize = -1;
      root.querySelectorAll('img').forEach((img) => {
        if (/profile picture/i.test(img.getAttribute('alt') || '')) return;
        const u = bestImageUrl(img);
        if (!IG_CDN(u)) return;
        const size = (img.naturalWidth || parseInt(img.getAttribute('width') || '0', 10) || 1) *
          (img.naturalHeight || parseInt(img.getAttribute('height') || '0', 10) || 1);
        if (size > bestSize) { best = u; bestSize = size; }
      });
      image = best || '';
    }
    if (!image && onPostPage) {
      const og = doc.querySelector('meta[property="og:image"]');
      const u = og ? og.getAttribute('content') || '' : '';
      if (IG_CDN(u)) image = u;
    }

    if (!handle && !caption && !image) return null;
    return {
      handle,
      caption: caption.slice(0, 2200) || null,
      image_url: image || null,
      is_video: !!video,
    };
  }

  // Browser-tab noise: a leading "(3) " notification count and a trailing " / X" (same rule as the server).
  const cleanTitle = (title) =>
    typeof title === 'string' ? title.trim().replace(/^\(\d+\)\s+/, '').replace(/\s+\/\s+X$/, '').trim() : '';

  // What the popup should say about the whole tab: null = fine to save, otherwise a reason.
  function pageProblem(pageUrl) {
    const site = siteOf(pageUrl);
    if (site === 'instagram' && !instagramPostUrl(pageUrl, pageUrl)) return 'instagram-not-post';
    if (site === 'twitter' && !isXPostUrl(pageUrl)) return 'x-not-post';
    return null;
  }

  // No usable answer from the page: decide from what Chrome tells us about the click.
  //   social sites -> the post link or the page itself (never a CDN picture address)
  //   elsewhere    -> the link, else a picture/video file as that media type, else the page
  function fallbackTarget(info, tabUrl) {
    const ex = { siteOf, cleanUrl, instagramPostUrl, isXPostUrl, pageProblem };
    const pageUrl = info.pageUrl || tabUrl;
    const link = info.linkUrl && !info.linkUrl.startsWith('blob:') ? info.linkUrl : null;
    const site = ex.siteOf(pageUrl);
    if (site === 'instagram' || site === 'twitter') {
      const post = link && (ex.instagramPostUrl(link, pageUrl) || (ex.isXPostUrl(link) ? ex.cleanUrl(link) : null));
      if (post) return { url: post };
      const problem = ex.pageProblem(pageUrl);
      if (problem) return { url: null, reason: problem };
      return { url: ex.instagramPostUrl(pageUrl, pageUrl) || ex.cleanUrl(pageUrl) };
    }
    if (site) return { url: link || ex.cleanUrl(pageUrl) };
    if (link) return { url: link };
    if (info.srcUrl && !info.srcUrl.startsWith('blob:') && (info.mediaType === 'image' || info.mediaType === 'video')) {
      return { url: info.srcUrl, type: info.mediaType };
    }
    return { url: pageUrl };
  }

  const api = { fallbackTarget, siteOf, cleanUrl, cleanTitle, captureInstagram, instagramPostUrl, isXPostUrl, extractExactUrl, pageProblem };
  root.inntoitExtract = Object.assign(root.inntoitExtract || {}, api);
  if (typeof module !== 'undefined' && module.exports) module.exports = root.inntoitExtract;
})(typeof globalThis !== 'undefined' ? globalThis : this);
