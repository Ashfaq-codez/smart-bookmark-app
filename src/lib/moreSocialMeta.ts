import * as cheerio from 'cheerio';
import type { HackerNewsPost, SpotifyPost, ThreadsPost, LinkedInPost } from '@/types';
import { hackerNewsItemId, spotifyRef, threadsPostRef, isLinkedInPostUrl } from '@/lib/urlTools';
import { safeFetch } from '@/utils/safeFetch';

// Hacker News, Spotify, Threads and LinkedIn posts, each from a free public source (no keys, no login):
//   Hacker News  the official API (hacker-news.firebaseio.com)
//   Spotify      the page's own details (og: / music: meta tags), oEmbed as the backup
//   Threads      the official embed page (threads.com/@user/post/<code>/embed), which needs no login
//   LinkedIn     a public post's structured data (DiscussionForumPosting)
// Readers never throw; fetchers answer { ok: false } when nothing usable came back.

const UA = { 'User-Agent': 'Mozilla/5.0 (compatible; inntoit/1.0)' };
const isHttps = (u: unknown): u is string => {
  if (typeof u !== 'string' || u.length > 2048) return false;
  try { return new URL(u).protocol === 'https:'; } catch { return false; }
};
const num = (n: unknown) => (typeof n === 'number' && Number.isFinite(n) && n >= 0 ? Math.floor(n) : null);
const text = (s: unknown, max: number) => (typeof s === 'string' && s.trim() ? s.trim().slice(0, max) : null);

// HTML of a Hacker News text (<p>, <a>, &#x27;) as plain text with paragraphs.
export function hnPlainText(html: string | null | undefined): string | null {
  if (!html) return null;
  const $ = cheerio.load(`<div>${html.replace(/<p>/gi, '\n\n')}</div>`);
  const t = $('div').text().replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  return t ? t.slice(0, 5000) : null;
}

export type Fetched<T> = { ok: true; post: T } | { ok: false };

// ---------- Hacker News ----------
export function readHackerNewsItem(d: any): HackerNewsPost | null {
  if (!d || typeof d !== 'object' || d.deleted || d.dead || typeof d.id !== 'number') return null;
  const title = text(d.title, 300) || (d.type === 'comment' ? `Comment by ${d.by || 'someone'}` : null);
  if (!title) return null;
  const kind: HackerNewsPost['kind'] =
    d.type === 'job' ? 'job' : d.type === 'poll' ? 'poll' : d.type === 'comment' ? 'comment'
      : /^Ask HN:/i.test(title) ? 'ask' : /^Show HN:/i.test(title) ? 'show' : 'story';
  let link: string | null = null;
  if (typeof d.url === 'string') {
    try { const u = new URL(d.url); if (u.protocol === 'https:' || u.protocol === 'http:') link = u.href.slice(0, 2048); } catch { /* bad link */ }
  }
  return {
    v: 1, platform: 'hackernews', id: String(d.id), kind, title, link,
    text: hnPlainText(d.text),
    author: typeof d.by === 'string' && /^[A-Za-z0-9_-]{1,30}$/.test(d.by) ? d.by : null,
    points: num(d.score), comments: num(d.descendants),
    created_at: num(d.time) ? new Date(d.time * 1000).toISOString() : null,
  };
}

export async function fetchHackerNews(url: string): Promise<Fetched<HackerNewsPost>> {
  const id = hackerNewsItemId(url);
  if (!id) return { ok: false };
  try {
    const res = await safeFetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return { ok: false };
    const post = readHackerNewsItem(await res.json());
    return post ? { ok: true, post } : { ok: false };
  } catch {
    return { ok: false };
  }
}

// ---------- Spotify ----------
export function readSpotifyPage(html: string, ref: { kind: SpotifyPost['kind']; id: string }): SpotifyPost | null {
  const $ = cheerio.load(html.slice(0, 1024 * 1024));
  const meta = (k: string) => $(`meta[property="${k}"]`).attr('content') || $(`meta[name="${k}"]`).attr('content') || null;
  const title = text(meta('og:title'), 300);
  if (!title) return null;
  // Spotify's line is "Artist · Album · Song · 1987" or "Podcast · Joe Rogan · …": drop the type word, keep the rest.
  const desc = text(meta('og:description'), 400);
  const subtitle = desc ? desc.split(' · ').filter((p) => !/^(Song|Album|Single|EP|Podcast|Playlist|Episode|Artist|Audiobook)$/i.test(p.trim())).join(' · ') || null : null;
  const image = meta('og:image');
  return {
    v: 1, platform: 'spotify', kind: ref.kind, id: ref.id, title, subtitle,
    image: isHttps(image) ? image : null,
    duration_s: num(Number(meta('music:duration'))) || null,
    track_count: num(Number(meta('music:song_count'))) || null,
  };
}

export async function fetchSpotify(url: string): Promise<Fetched<SpotifyPost>> {
  const ref = spotifyRef(url);
  if (!ref) return { ok: false };
  const page = `https://open.spotify.com/${ref.kind}/${ref.id}`;
  try {
    const res = await safeFetch(page, { headers: UA, signal: AbortSignal.timeout(6000) });
    if (res.ok) {
      const post = readSpotifyPage(await res.text(), ref);
      if (post) return { ok: true, post };
    }
  } catch { /* try oEmbed */ }
  try {
    const res = await safeFetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(page)}`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return { ok: false };
    const d = await res.json();
    const title = text(d?.title, 300);
    if (!title) return { ok: false };
    return { ok: true, post: { v: 1, platform: 'spotify', kind: ref.kind, id: ref.id, title, subtitle: null, image: isHttps(d?.thumbnail_url) ? d.thumbnail_url : null, duration_s: null, track_count: null } };
  } catch {
    return { ok: false };
  }
}

// ---------- Threads ----------
// Picture addresses here are signed and expire: the caller copies the first one into storage.
export function readThreadsEmbed(html: string, ref: { handle: string; code: string }): (Omit<ThreadsPost, 'images' | 'more_images'> & { image_sources: string[] }) | null {
  const $ = cheerio.load(html.slice(0, 1024 * 1024));
  const body = $('.BodyTextContainer').first();
  if (!body.length && !$('.MediaScrollImageContainer img').length) return null;   // "Thread not available"
  body.find('br').replaceWith('\n');
  const handle = $('.HeaderLink span').first().text().trim();
  const avatar = $('.AvatarContainer img').attr('src') || null;
  const images = $('.MediaScrollImageContainer img, .SingleInnerMediaContainer img').toArray()
    .map((el) => $(el).attr('src') || '').filter((src) => isHttps(src));
  const counts = $('.ActionBarCount').toArray().map((el) => $(el).text().trim()).filter(Boolean);
  // "9:37 AM · Mar 2, 2024"
  const stamp = $('.Timestamp').first().text().split('·').map((s) => s.trim());
  const parsed = Date.parse(`${stamp[1] || ''} ${stamp[0] || ''}`);
  return {
    v: 1, platform: 'threads', code: ref.code,
    author: { handle: /^[A-Za-z0-9._]{1,30}$/.test(handle) ? handle : ref.handle || 'threads', verified: $('.VerifiedBadge').length > 0, avatar: isHttps(avatar) ? avatar : null },
    text: body.text().replace(/\n{3,}/g, '\n\n').trim().slice(0, 10_000),
    image_sources: [...new Set(images)].slice(0, 10),
    created_at: isNaN(parsed) ? null : new Date(parsed).toISOString(),
    likes: counts[0] || null, replies: counts[1] || null, reposts: counts[2] || null,
  };
}

export async function fetchThreadsEmbed(url: string) {
  const ref = threadsPostRef(url);
  if (!ref) return { ok: false as const };
  try {
    // The embed page also works from the short /t/<code> form, which has no @handle.
    const path = ref.handle ? `@${ref.handle}/post/${ref.code}` : `t/${ref.code}`;
    const res = await safeFetch(`https://www.threads.com/${path}/embed`, { headers: UA, signal: AbortSignal.timeout(6000) });
    if (!res.ok) return { ok: false as const };
    const post = readThreadsEmbed(await res.text(), ref);
    return post ? { ok: true as const, post } : { ok: false as const };
  } catch {
    return { ok: false as const };
  }
}

// ---------- LinkedIn ----------
export function readLinkedInPost(html: string): LinkedInPost | null {
  const $ = cheerio.load(html.slice(0, 2 * 1024 * 1024));
  let post: LinkedInPost | null = null;
  $('script[type="application/ld+json"]').each((_, el) => {
    if (post) return;
    try {
      const d = JSON.parse($(el).contents().text());
      if (d?.['@type'] !== 'DiscussionForumPosting') return;
      const body = text(d.articleBody, 10_000) || text(d.headline, 3000);
      const name = text(d.author?.name, 120);
      if (!body || !name) return;
      const stats = Array.isArray(d.interactionStatistic) ? d.interactionStatistic : [];
      const stat = (kind: string) => num(stats.find((s: any) => String(s?.interactionType || '').endsWith(kind))?.userInteractionCount);
      const image = d.image?.url ?? (Array.isArray(d.image) ? d.image[0]?.url : null);
      post = {
        v: 1, platform: 'linkedin',
        author: { name, avatar: isHttps(d.author?.image?.url) ? d.author.image.url : null, url: isHttps(d.author?.url) ? d.author.url : null },
        text: body,
        image: isHttps(image) ? image : null,
        created_at: typeof d.datePublished === 'string' && !isNaN(Date.parse(d.datePublished)) ? new Date(d.datePublished).toISOString() : null,
        likes: stat('LikeAction'),
        comments: stat('CommentAction') ?? num(d.commentCount),
      };
    } catch { /* not JSON */ }
  });
  return post;
}

export async function fetchLinkedIn(url: string): Promise<Fetched<LinkedInPost>> {
  if (!isLinkedInPostUrl(url)) return { ok: false };
  try {
    const res = await safeFetch(url, { headers: UA, signal: AbortSignal.timeout(7000) });
    if (!res.ok) return { ok: false };
    const post = readLinkedInPost(await res.text());
    return post ? { ok: true, post } : { ok: false };
  } catch {
    return { ok: false };
  }
}

// Titles for each.
export function moreSocialTitle(p: HackerNewsPost | SpotifyPost | ThreadsPost | LinkedInPost): string {
  const firstLine = (s: string, max = 100) => {
    const l = s.split('\n').map((x) => x.trim()).find(Boolean) || '';
    return l.length > max ? `${l.slice(0, max - 1).trimEnd()}…` : l;
  };
  if (p.platform === 'hackernews') return p.title;
  if (p.platform === 'spotify') return p.subtitle ? `${p.title} · ${p.subtitle.split(' · ')[0]}` : p.title;
  if (p.platform === 'threads') return p.text ? `@${p.author.handle} on Threads: ${firstLine(p.text)}` : `@${p.author.handle} on Threads`;
  return p.text ? `${p.author.name} on LinkedIn: ${firstLine(p.text)}` : `${p.author.name} on LinkedIn`;
}
