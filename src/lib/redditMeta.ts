import * as cheerio from 'cheerio';
import type { RedditPost } from '@/types';
import { redditPostRef } from '@/lib/urlTools';

export { redditPostRef };
import { safeFetch } from '@/utils/safeFetch';

// A Reddit post without any paid API or login. Reddit refuses its normal pages and .json to servers, but its
// official embed page (embed.reddit.com, made to be shown on other sites) carries the post: title, subreddit,
// author, upvotes, the text of a text post and the picture of an image post. oEmbed is the backup (title + author).

const REDDIT_IMAGE = /^https:\/\/(?:i|preview|external-preview)\.redd\.it\//;
const clean = (s: string | null | undefined, max: number) => {
  const t = (s || '').replace(/[ \t]+/g, ' ').replace(/ ?\n ?/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  return t ? t.slice(0, max) : null;
};
const isHttps = (u: string | null | undefined): u is string => {
  try { return !!u && new URL(u).protocol === 'https:' && u.length <= 2048; } catch { return false; }
};

// Reads the embed page. Never throws; null when it is not a post.
export function readRedditEmbed(html: string, ref: { sub: string; id: string }): RedditPost | null {
  const $ = cheerio.load(html.slice(0, 1024 * 1024));
  const title = clean($('h1').first().text(), 300);
  if (!title) return null;

  // The page's own tracking data names the post type, its outside link, nsfw, time and subreddit.
  let ctx: { post?: Record<string, unknown>; subreddit?: { name?: string } } = {};
  $('[data-faceplate-tracking-context]').each((_, el) => {
    try {
      const d = JSON.parse($(el).attr('data-faceplate-tracking-context') || '{}');
      if (d?.post?.id === `t3_${ref.id}` && JSON.stringify(d.post).length > JSON.stringify(ctx.post || {}).length) ctx = d;
    } catch { /* not JSON */ }
  });
  const post = ctx.post || {};

  const authorHref = $('a[href*="reddit.com/user/"]').first().attr('href') || '';
  const author = authorHref.match(/\/user\/([A-Za-z0-9_-]{3,20})/)?.[1] ?? null;
  const icon = $('img[src*="styles.redditmedia.com"], img[src*="communityIcon"]').first().attr('src') || null;
  const scoreRaw = Number($('faceplate-number').first().attr('number'));

  // Text of a text post: paragraphs kept as line breaks.
  const bodyEl = $(`#t3_${ref.id}-post-rtjson-content`);
  bodyEl.find('p, li, blockquote, h1, h2, h3, pre').each((_, el) => { $(el).append('\n'); });
  const body = clean(bodyEl.text(), 3000);

  const nsfw = post.nsfw === true;
  const type = String(post.type || '');
  const kind: RedditPost['kind'] =
    type === 'image' ? 'image' : type === 'video' ? 'video' : type === 'gallery' ? 'gallery' : type === 'link' ? 'link' : body ? 'text' : 'other';
  const link = typeof post.url === 'string' && isHttps(post.url) && !/\.redd\.it\//.test(post.url) && kind === 'link' ? post.url : null;
  const image = nsfw ? null
    : $('img').toArray().map((el) => $(el).attr('src') || '').find((src) => REDDIT_IMAGE.test(src) && !/snoovatar|avatars/.test(src)) || null;
  const created = Number(post.created_timestamp);

  return {
    v: 1,
    platform: 'reddit',
    id: ref.id,
    // The address keeps the subreddit's own capitals (IAmA); Reddit's data has it in lower case.
    subreddit: ctx.subreddit?.name && /^[A-Za-z0-9_]{2,21}$/.test(ctx.subreddit.name) && ctx.subreddit.name.toLowerCase() !== ref.sub.toLowerCase()
      ? ctx.subreddit.name : ref.sub,
    subreddit_icon: isHttps(icon) ? icon : null,
    author,
    title,
    body,
    image: isHttps(image) ? image : null,
    link,
    kind,
    nsfw,
    score: Number.isFinite(scoreRaw) && scoreRaw >= 0 ? Math.floor(scoreRaw) : null,
    created_at: Number.isFinite(created) && created > 0 ? new Date(created).toISOString() : null,
  };
}

export type RedditFetch = { ok: true; post: RedditPost } | { ok: false; reason: 'not-found' | 'unavailable' };

export async function fetchRedditPost(url: string): Promise<RedditFetch> {
  const ref = redditPostRef(url);
  if (!ref) return { ok: false, reason: 'not-found' };
  const opts = { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; inntoit/1.0)' }, signal: AbortSignal.timeout(6000) };
  try {
    const res = await safeFetch(`https://embed.reddit.com/r/${ref.sub}/comments/${ref.id}/`, opts);
    if (res.ok) {
      const post = readRedditEmbed(await res.text(), ref);
      if (post) return { ok: true, post };
    }
  } catch { /* try oEmbed */ }
  try {
    const res = await safeFetch(`https://www.reddit.com/oembed?url=${encodeURIComponent(`https://www.reddit.com/r/${ref.sub}/comments/${ref.id}/`)}`, opts);
    if (res.status === 404) return { ok: false, reason: 'not-found' };
    if (!res.ok) return { ok: false, reason: 'unavailable' };
    const d = await res.json();
    const title = clean(typeof d?.title === 'string' ? d.title : '', 300);
    if (!title) return { ok: false, reason: 'not-found' };
    const author = typeof d?.author_name === 'string' && /^[A-Za-z0-9_-]{3,20}$/.test(d.author_name) ? d.author_name : null;
    return { ok: true, post: { v: 1, platform: 'reddit', id: ref.id, subreddit: ref.sub, subreddit_icon: null, author, title, body: null, image: null, link: null, kind: 'other', nsfw: false, score: null, created_at: null } };
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
}
