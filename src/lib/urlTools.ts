// ONE place for "how an address is cleaned" and "which site is it from".
// Used by the save route today and meant to replace the copies in BookmarkList.tsx / utils/normalizeUrl.ts.

// 'note' keeps the #fragment, because "text fragment" saves from the extension (#:~:text=...) rely on it.
export function normalizeUrl(rawUrl: string, type: string = 'link'): string {
  const trimmed = (rawUrl ?? '').trim();
  if (!trimmed) return '';
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
