// ONE place for "how an address is cleaned" and "which site is it from".
// Used by the save route today and meant to replace the copies in BookmarkList.tsx / utils/normalizeUrl.ts.

// 'note' keeps the #fragment, because "text fragment" saves from the extension (#:~:text=...) rely on it.
export function normalizeUrl(rawUrl: string, type: string = 'link'): string {
  const trimmed = (rawUrl ?? '').trim();
  if (!trimmed) return '';
  const xPost = canonicalizeXUrl(trimmed);
  if (xPost) return xPost;
  const redditPost = canonicalizeRedditUrl(trimmed);
  if (redditPost) return redditPost;
  // Share tracking off: Spotify ?si=, Threads ?xmt=, LinkedIn ?utm_… / ?rcm=. One address per post.
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const spotify = spotifyRef(withProtocol);
  if (spotify) return `https://open.spotify.com/${spotify.kind}/${spotify.id}`;
  const thread = threadsPostRef(withProtocol);
  if (thread) return `https://www.threads.com/@${thread.handle}/post/${thread.code}`;
  if (isLinkedInPostUrl(withProtocol)) { const u = new URL(withProtocol); return `https://www.linkedin.com${u.pathname.replace(/\/+$/, '')}`; }
  try {
    const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const parsed = new URL(withProto);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
    const path = parsed.pathname.replace(/\/+$/, '') || '/';
    let search = parsed.search;

    if ((host === 'youtube.com' || host === 'm.youtube.com') && path === '/watch') {
      const videoId = parsed.searchParams.get('v');
      if (videoId) search = `?v=${videoId}`;
      return `${parsed.protocol}//youtube.com${path}${search}${type === 'note' ? parsed.hash : ''}`;
    } else if (host === 'youtu.be') {
      const videoId = path.substring(1);
      if (videoId) return `${parsed.protocol}//youtube.com/watch?v=${videoId}`;
    }

    // Substack share links carry a referral code and tracking (?r=…&utm_…): the same post, so they go.
    if (host === 'substack.com' || host.endsWith('.substack.com')) {
      for (const k of [...parsed.searchParams.keys()]) {
        if (k === 'r' || k.startsWith('utm_') || k === 'showWelcomeOnShare' || k === 'triedRedirect') parsed.searchParams.delete(k);
      }
      search = parsed.search;
    }
    const hash = type === 'note' ? parsed.hash : '';
    return `${parsed.protocol}//${host}${path}${search}${hash}`;
  } catch {
    return trimmed.toLowerCase().replace(/\/+$/, '');
  }
}

// True when `host` IS the domain or a sub-domain of it. "dropbox.com" is NOT "x.com".
export function hostIs(host: string, domain: string): boolean {
  const h = host.toLowerCase().replace(/\.$/, '');
  return h === domain || h.endsWith('.' + domain);
}

export type SiteType = 'twitter' | 'instagram' | 'youtube' | 'pinterest' | 'github' | 'linkedin' | 'reddit' | 'threads' | 'spotify' | 'hackernews';

export function detectSiteType(url: string): SiteType | null {
  let host: string;
  try { host = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`).hostname; } catch { return null; }
  if (hostIs(host, 'twitter.com') || hostIs(host, 'x.com')) return 'twitter';
  if (hostIs(host, 'instagram.com')) return 'instagram';
  if (hostIs(host, 'youtube.com') || hostIs(host, 'youtu.be')) return 'youtube';
  if (hostIs(host, 'pinterest.com') || hostIs(host, 'pin.it')) return 'pinterest';
  if (hostIs(host, 'github.com')) return 'github';
  if (hostIs(host, 'linkedin.com')) return 'linkedin';
  if (hostIs(host, 'reddit.com') || hostIs(host, 'redd.it')) return 'reddit';
  if (hostIs(host, 'threads.com') || hostIs(host, 'threads.net')) return 'threads';
  if (host.toLowerCase() === 'open.spotify.com') return 'spotify';
  if (host.toLowerCase() === 'news.ycombinator.com') return 'hackernews';
  return null;
}

// Sites whose posts we read ourselves. For these the server decides the type from the address;
// a type or title sent by the client is never trusted.
export const SOCIAL_TYPES: readonly string[] = ['twitter', 'instagram', 'youtube', 'pinterest', 'reddit', 'threads', 'spotify', 'hackernews', 'linkedin'];

export function isSocialType(type: string | null | undefined): boolean {
  return !!type && SOCIAL_TYPES.includes(type);
}

// One address per X post: https://x.com/<handle>/status/<id>.
// twitter.com, mobile.twitter.com, www and any query (?s=20, ?t=...) or extra path (/photo/1) are dropped.
// "/i/status/<id>" has no handle and stays as x.com/i/status/<id>. Returns null when it is not an X post.
export function canonicalizeXUrl(rawUrl: string): string | null {
  try {
    const parsed = new URL(/^https?:\/\//i.test(rawUrl.trim()) ? rawUrl.trim() : `https://${rawUrl.trim()}`);
    if (!hostIs(parsed.hostname, 'x.com') && !hostIs(parsed.hostname, 'twitter.com')) return null;
    const m = parsed.pathname.match(/^\/(?:(i)|([A-Za-z0-9_]{1,15}))\/status(?:es)?\/(\d{1,25})(?:\/|$)/);
    if (!m) return null;
    return `https://x.com/${m[1] ? 'i' : m[2]}/status/${m[3]}`;
  } catch {
    return null;
  }
}

// Page titles from the browser tab carry noise on X: a leading "(3) " notification count and a trailing " / X".
export function cleanTitle(title: unknown): string {
  if (typeof title !== 'string') return '';
  return title.trim().replace(/^\(\d+\)\s+/, '').replace(/\s+\/\s+X$/, '').trim();
}

// r/<sub>/comments/<id> from any reddit.com address (www, old, new, m), or null.
export function redditPostRef(url: string | null | undefined): { sub: string; id: string } | null {
  if (!url) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`);
    if (!hostIs(u.hostname.toLowerCase(), 'reddit.com')) return null;
    const m = u.pathname.match(/^\/r\/([A-Za-z0-9_]{2,21})\/comments\/([a-z0-9]{2,12})(?:\/|$)/i);
    if (m) return { sub: m[1], id: m[2].toLowerCase() };
    // reddit.com/comments/<id> (where redd.it short links lead): the subreddit is learned from the post.
    const bare = u.pathname.match(/^\/comments\/([a-z0-9]{2,12})(?:\/|$)/i);
    return bare ? { sub: '', id: bare[1].toLowerCase() } : null;
  } catch {
    return null;
  }
}

// One address per Reddit post: https://www.reddit.com/r/<sub>/comments/<id>/<slug>/
// (old., new., m., no www; the app's ?share_id= / utm_ tracking dropped). null when it is not a post address.
export function canonicalizeRedditUrl(rawUrl: string): string | null {
  try {
    const u = new URL(/^https?:\/\//i.test(rawUrl.trim()) ? rawUrl.trim() : `https://${rawUrl.trim()}`);
    if (!hostIs(u.hostname.toLowerCase(), 'reddit.com')) return null;
    const m = u.pathname.match(/^\/(?:r\/([A-Za-z0-9_]{2,21})\/)?comments\/([a-z0-9]{2,12})(?:\/([^/]{1,300}))?/i);
    if (!m) return null;
    return `https://www.reddit.com/${m[1] ? `r/${m[1]}/` : ''}comments/${m[2].toLowerCase()}/${m[3] ? `${m[3]}/` : ''}`;
  } catch {
    return null;
  }
}

// Reddit links that only point to a post: redd.it/<id> and the app's share links reddit.com/r/<sub>/s/<code>.
export function isRedditShareLink(rawUrl: string): boolean {
  try {
    const u = new URL(/^https?:\/\//i.test(rawUrl.trim()) ? rawUrl.trim() : `https://${rawUrl.trim()}`);
    const host = u.hostname.toLowerCase();
    if (host === 'redd.it' || host === 'www.redd.it') return /^\/[a-z0-9]{2,12}\/?$/i.test(u.pathname);
    return hostIs(host, 'reddit.com') && /^\/r\/[A-Za-z0-9_]{2,21}\/s\/[A-Za-z0-9]{4,20}\/?$/.test(u.pathname);
  } catch {
    return false;
  }
}

// news.ycombinator.com/item?id=<n>  ->  "<n>"
export function hackerNewsItemId(url: string | null | undefined): string | null {
  try {
    const u = new URL(url || '');
    if (u.hostname.toLowerCase() !== 'news.ycombinator.com' || u.pathname !== '/item') return null;
    const id = u.searchParams.get('id') || '';
    return /^\d{1,10}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

const SPOTIFY_KINDS = ['track', 'album', 'playlist', 'episode', 'show', 'artist', 'audiobook'] as const;
// open.spotify.com/(intl-xx/)<kind>/<id>
export function spotifyRef(url: string | null | undefined): { kind: (typeof SPOTIFY_KINDS)[number]; id: string } | null {
  try {
    const u = new URL(url || '');
    if (u.hostname.toLowerCase() !== 'open.spotify.com') return null;
    const m = u.pathname.match(/^\/(?:intl-[a-z-]{2,10}\/)?([a-z]+)\/([A-Za-z0-9]{22})\/?$/);
    if (!m || !(SPOTIFY_KINDS as readonly string[]).includes(m[1])) return null;
    return { kind: m[1] as (typeof SPOTIFY_KINDS)[number], id: m[2] };
  } catch {
    return null;
  }
}

// threads.com / threads.net /@<handle>/post/<code>
export function threadsPostRef(url: string | null | undefined): { handle: string; code: string } | null {
  try {
    const u = new URL(url || '');
    if (!hostIs(u.hostname.toLowerCase(), 'threads.com') && !hostIs(u.hostname.toLowerCase(), 'threads.net')) return null;
    const m = decodeURIComponent(u.pathname).match(/^\/@([A-Za-z0-9._]{1,30})\/post\/([A-Za-z0-9_-]{6,20})\/?$/);
    return m ? { handle: m[1], code: m[2] } : null;
  } catch {
    return null;
  }
}

// A LinkedIn post: /posts/<slug>-activity-<n>-xxxx or /feed/update/urn:li:(activity|share|ugcPost):<n>
export function isLinkedInPostUrl(url: string | null | undefined): boolean {
  try {
    const u = new URL(url || '');
    if (!hostIs(u.hostname.toLowerCase(), 'linkedin.com')) return false;
    return /^\/posts\/[^/]+-(?:activity|share|ugcPost)-\d{10,25}/.test(u.pathname)
      || /^\/feed\/update\/urn:li:(?:activity|share|ugcPost):\d{10,25}\/?$/.test(decodeURIComponent(u.pathname));
  } catch {
    return false;
  }
}
