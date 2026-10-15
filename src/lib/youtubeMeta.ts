import type { YouTubePost } from '@/types';
import { hostIs } from '@/lib/urlTools';
import { safeFetch } from '@/utils/safeFetch';

// The real title and channel of a YouTube video, from YouTube's free oEmbed endpoint (no key, no account).
// Reading the watch page from a server often only gives a cookie wall, which left titles as the bare address.

// The 11-character video id of a watch / shorts / youtu.be / embed address, or null.
export function youTubeVideoId(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`);
    const host = u.hostname.toLowerCase();
    let id: string | null = null;
    if (hostIs(host, 'youtu.be')) id = u.pathname.slice(1).split('/')[0];
    else if (hostIs(host, 'youtube.com')) {
      id = u.pathname === '/watch' ? u.searchParams.get('v') : u.pathname.match(/^\/(?:shorts|embed|live)\/([^/]+)/)?.[1] ?? null;
    }
    return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

// Titles the app made itself: empty, an address, or YouTube's bare site name.
export function isAutoYouTubeTitle(title: string | null | undefined): boolean {
  const t = (title || '').trim();
  return !t || /^https?:\/\//i.test(t) || /^(\(\d+\)\s*)?YouTube$/i.test(t) || t === 'Saved Item';
}

const clean = (s: unknown, max: number) => (typeof s === 'string' && s.trim() ? s.trim().slice(0, max) : null);

export type YouTubeFetch = { ok: true; post: YouTubePost } | { ok: false; reason: 'not-found' | 'unavailable' };

// Never throws. A private / deleted video answers 401 / 404: "not-found".
export async function fetchYouTubeInfo(id: string): Promise<YouTubeFetch> {
  if (!/^[A-Za-z0-9_-]{11}$/.test(id)) return { ok: false, reason: 'not-found' };
  try {
    const watch = `https://www.youtube.com/watch?v=${id}`;
    const res = await safeFetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(watch)}`, { signal: AbortSignal.timeout(5000) });
    if (res.status === 400 || res.status === 401 || res.status === 403 || res.status === 404) return { ok: false, reason: 'not-found' };
    if (!res.ok) return { ok: false, reason: 'unavailable' };
    const d = await res.json();
    const title = clean(d?.title, 300);
    if (!title) return { ok: false, reason: 'not-found' };
    return { ok: true, post: { v: 1, platform: 'youtube', id, title, channel: clean(d?.author_name, 120) } };
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
}
