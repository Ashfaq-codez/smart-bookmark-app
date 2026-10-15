import { hostIs } from '@/lib/urlTools';

// Plain text helpers for Instagram (no network, no HTML parser), so the browser can use them too.
// The order in which they are used is described in src/lib/instagramMeta.ts.

const HANDLE = /^[A-Za-z0-9._]{1,30}$/;
// First path parts that are Instagram pages, never people.
const NOT_HANDLES = new Set(['p', 'reel', 'reels', 'tv', 'explore', 'accounts', 'stories', 'direct', 'about', 'legal', 'developer', 'web', 'instagram']);

export function cleanHandle(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const h = raw.trim().replace(/^@/, '');
  return HANDLE.test(h) && !NOT_HANDLES.has(h.toLowerCase()) ? h : null;
}

// b) instagram.com/<handle>/p/<id> (also /reel/, /reels/, /tv/)
export function handleFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`);
    if (!hostIs(u.hostname.toLowerCase(), 'instagram.com')) return null;
    // also a profile address (instagram.com/<handle>/), which older saves can have
    const m = u.pathname.match(/^\/([^/]+)(?:\/(?:p|reel|reels|tv)\/[A-Za-z0-9_-]+)?\/?$/);
    return m ? cleanHandle(m[1]) : null;
  } catch {
    return null;
  }
}

// c) "98K likes, 475 comments - philosophyofphys on October 14, 2026: "…"" or "codvyn on September 29, 2026: "…""
export function handleFromDescription(text: string | null | undefined): string | null {
  if (!text) return null;
  // (older Instagram pages said "… - handle on Instagram: …" instead of a date)
  const m = text.match(/(?:^|\s-\s)([A-Za-z0-9._]{1,30}) on (?:[A-Z][a-z]+ \d{1,2}, \d{4}|Instagram)\s*:/);
  return m ? cleanHandle(m[1]) : null;
}

// The real like / comment counts in that same description, when Instagram gave them.
export function countsFromDescription(text: string | null | undefined): { likes: string | null; comments: string | null } {
  const likes = text?.match(/^([\d.,]+[KMB]?) likes?\b/i)?.[1] ?? null;
  const comments = text?.match(/\b([\d.,]+[KMB]?) comments?\b/i)?.[1] ?? null;
  return { likes, comments };
}

// The caption inside Instagram's description ('… on May 1, 2026: "the caption".'), as plain text.
export function captionFromDescription(text: string | null | undefined): string | null {
  if (!text) return null;
  const m = text.match(/ on (?:[A-Z][a-z]+ \d{1,2}, \d{4}|Instagram)\s*:\s*"([\s\S]*?)"?\.?\s*$/);
  return m ? plainCaption(m[1]) : null;
}

// Instagram descriptions carry literal <br> for line breaks; turn them into real ones.
export function plainCaption(text: string): string | null {
  const t = text.replace(/<br\s*\/?>/gi, '\n').replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  return t || null;
}
