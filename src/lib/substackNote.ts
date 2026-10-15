import * as cheerio from 'cheerio';
import type { SubstackNotePost } from '@/types';
import { safeFetch } from '@/utils/safeFetch';

// A Substack Note (substack.com/@handle/note/c-<id>), read from its public page. The page carries the note in
// its own app data (text, author, photo, attached pictures, likes, restacks, replies) and, as a backup, in its
// structured data (text, author, date, counts).

const isHttps = (u: unknown): u is string => {
  if (typeof u !== 'string' || u.length > 2048) return false;
  try { return new URL(u).protocol === 'https:'; } catch { return false; }
};
const count = (n: unknown) => (typeof n === 'number' && Number.isFinite(n) && n >= 0 ? Math.floor(n) : null);
const str = (s: unknown, max: number) => (typeof s === 'string' && s.trim() ? s.trim().slice(0, max) : null);
const HANDLE = /^[A-Za-z0-9_.-]{1,60}$/;

export function readSubstackNote(html: string): SubstackNotePost | null {
  // 1) The page's app data: window._preloads = JSON.parse("…")
  let c: Record<string, any> | null = null;
  const m = html.match(/window\._preloads\s*=\s*JSON\.parse\(("(?:[^"\\]|\\.)*")\)/);
  if (m) {
    try { c = JSON.parse(JSON.parse(m[1]))?.feedData?.feedItem?.comment ?? null; } catch { c = null; }
  }
  if (c && typeof c.body === 'string' && c.body.trim()) {
    const images = (Array.isArray(c.attachments) ? c.attachments : [])
      .filter((a: any) => a?.type === 'image' && isHttps(a.imageUrl) && a.explicit !== true)
      .slice(0, 4)
      .map((a: any) => ({ url: a.imageUrl, width: count(a.imageWidth) || 1, height: count(a.imageHeight) || 1 }));
    const created = typeof c.date === 'string' && !isNaN(Date.parse(c.date)) ? new Date(c.date).toISOString() : null;
    return {
      v: 1,
      platform: 'substack-note',
      id: String(c.id ?? '').slice(0, 20),
      author: { name: str(c.name, 100) || 'Substack', handle: typeof c.handle === 'string' && HANDLE.test(c.handle) ? c.handle : null, avatar: isHttps(c.photo_url) ? c.photo_url : null },
      text: c.body.trim().slice(0, 10_000),
      images,
      created_at: created,
      likes: count(c.reaction_count),
      restacks: count(c.restacks),
      replies: count(c.children_count),
    };
  }

  // 2) Structured data (SocialMediaPosting)
  const $ = cheerio.load(html.slice(0, 1024 * 1024));
  let note: SubstackNotePost | null = null;
  $('script[type="application/ld+json"]').each((_, el) => {
    if (note) return;
    try {
      const d = JSON.parse($(el).contents().text());
      if (d?.['@type'] !== 'SocialMediaPosting' || typeof d.text !== 'string' || !d.text.trim()) return;
      const stat = (kind: string) => count((d.interactionStatistic || []).find((s: any) => String(s?.interactionType || '').endsWith(kind))?.userInteractionCount);
      note = {
        v: 1,
        platform: 'substack-note',
        id: String(d.identifier || '').replace(/^c-/, '').slice(0, 20),
        author: { name: str(d.author?.name, 100) || 'Substack', handle: typeof d.author?.alternateName === 'string' && HANDLE.test(d.author.alternateName) ? d.author.alternateName : null, avatar: null },
        text: d.text.trim().slice(0, 10_000),
        images: [],
        created_at: typeof d.datePublished === 'string' && !isNaN(Date.parse(d.datePublished)) ? new Date(d.datePublished).toISOString() : null,
        likes: stat('LikeAction'),
        restacks: stat('ShareAction'),
        replies: stat('CommentAction'),
      };
    } catch { /* not JSON */ }
  });
  return note;
}

export type NoteFetch = { ok: true; post: SubstackNotePost } | { ok: false };

export async function fetchSubstackNote(url: string): Promise<NoteFetch> {
  try {
    const res = await safeFetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; inntoit/1.0)' }, signal: AbortSignal.timeout(6000) });
    if (!res.ok) return { ok: false };
    const post = readSubstackNote(await res.text());
    return post ? { ok: true, post } : { ok: false };
  } catch {
    return { ok: false };
  }
}

// "Chris Best on Substack: first line of the note"
export function substackNoteTitle(p: SubstackNotePost): string {
  const first = p.text.split('\n').map((l) => l.trim()).find(Boolean) || '';
  const short = first.length > 100 ? `${first.slice(0, 99).trimEnd()}…` : first;
  return short ? `${p.author.name} on Substack: ${short}` : `${p.author.name} on Substack`;
}
