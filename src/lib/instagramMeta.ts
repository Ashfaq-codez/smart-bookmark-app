import * as cheerio from 'cheerio';
import type { InstagramPost } from '@/types';
import { safeFetch } from '@/utils/safeFetch';
import { cleanHandle, handleFromUrl, handleFromDescription } from '@/lib/instagramText';

export { cleanHandle, handleFromUrl, handleFromDescription, countsFromDescription, captionFromDescription, plainCaption } from '@/lib/instagramText';

// Who posted an Instagram post, without any paid API. The handle is taken from, in order:
//   a) what the extension read on the page (sent with the save)
//   b) the address itself: instagram.com/<handle>/p|reel|tv/<id>
//   c) Instagram's own page details: og:url (…/<handle>/reel/<id>/), og:description ("… - handle on May 1, 2026: …"),
//      or the post owner in the page's JSON
//   d) nothing found: no handle (the card hides the @ line)
// Every handle is checked here; nothing from the extension or the page is trusted as is.

// A page that is NOT the post: the login wall, or a page with none of the post's details.
export function isLoginWall(html: string, finalUrl = ''): boolean {
  if (/\/accounts\/login/.test(finalUrl)) return true;
  const $ = cheerio.load(html.slice(0, 512 * 1024));
  const hasPostDetails = !!$('meta[property="og:description"]').attr('content') || /\/(p|reel|tv)\//.test($('meta[property="og:url"]').attr('content') || '');
  return !hasPostDetails;
}

export type PageInfo = {
  handle: string | null;
  title: string | null;
  description: string | null;
  image: string | null;
  is_video: boolean;
};

// c) everything a post page tells us. Never throws.
export function readInstagramPage(html: string): PageInfo {
  const $ = cheerio.load(html.slice(0, 1024 * 1024));
  const meta = (p: string) => $(`meta[property="${p}"]`).attr('content') || $(`meta[name="${p}"]`).attr('content') || null;
  const description = meta('og:description') || meta('description');
  let handle = handleFromUrl(meta('og:url')) || handleFromDescription(description);
  if (!handle) {
    // The page's own data: the post owner's username (never just any "username", which can be a commenter).
    const m = html.match(/"owner":\{[^{}]{0,400}?"username":"([A-Za-z0-9._]{1,30})"/);
    handle = m ? cleanHandle(m[1]) : null;
  }
  const rawImage = meta('og:image');
  let image: string | null = null;
  if (rawImage) {
    try { image = new URL(rawImage).protocol === 'https:' ? rawImage : null; } catch { image = null; }
  }
  return {
    handle,
    title: meta('og:title'),
    description,
    image,
    is_video: (meta('og:type') || '').includes('video') || /\/reels?\//.test(meta('og:url') || ''),
  };
}

export type InstagramFetch =
  | { ok: true; page: PageInfo }
  | { ok: false; reason: 'login-wall' | 'unavailable' };

export async function fetchInstagramPage(url: string): Promise<InstagramFetch> {
  try {
    const res = await safeFetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(6000) });
    if (res.status >= 300 && res.status < 400) return { ok: false, reason: 'login-wall' };
    if (!res.ok) return { ok: false, reason: 'unavailable' };
    const html = await res.text();
    if (isLoginWall(html, res.url)) return { ok: false, reason: 'login-wall' };
    return { ok: true, page: readInstagramPage(html) };
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
}

// The stored snapshot (bookmarks.post_data with platform 'instagram').
export function instagramSnapshot(handle: string, source: InstagramPost['handle_source'], caption: string | null, is_video: boolean): InstagramPost {
  return { v: 1, platform: 'instagram', handle, handle_source: source, caption: caption ? caption.slice(0, 2200) : null, is_video };
}
