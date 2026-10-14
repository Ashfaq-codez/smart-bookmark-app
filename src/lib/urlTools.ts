// ONE place for "how an address is cleaned" and "which site is it from".
// Used by the save route today and meant to replace the copies in BookmarkList.tsx / utils/normalizeUrl.ts.

// 'note' keeps the #fragment, because "text fragment" saves from the extension (#:~:text=...) rely on it.
export function normalizeUrl(rawUrl: string, type: string = 'link'): string {
  const trimmed = (rawUrl ?? '').trim();
  if (!trimmed) return '';
  const xPost = canonicalizeXUrl(trimmed);
  if (xPost) return xPost;
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

export type SiteType = 'twitter' | 'instagram' | 'youtube' | 'pinterest' | 'github' | 'linkedin';

export function detectSiteType(url: string): SiteType | null {
  let host: string;
  try { host = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`).hostname; } catch { return null; }
  if (hostIs(host, 'twitter.com') || hostIs(host, 'x.com')) return 'twitter';
  if (hostIs(host, 'instagram.com')) return 'instagram';
  if (hostIs(host, 'youtube.com') || hostIs(host, 'youtu.be')) return 'youtube';
  if (hostIs(host, 'pinterest.com') || hostIs(host, 'pin.it')) return 'pinterest';
  if (hostIs(host, 'github.com')) return 'github';
  if (hostIs(host, 'linkedin.com')) return 'linkedin';
  return null;
}

// Sites whose posts we read ourselves. For these the server decides the type from the address;
// a type or title sent by the client is never trusted.
export const SOCIAL_TYPES: readonly string[] = ['twitter', 'instagram', 'youtube', 'pinterest'];

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
