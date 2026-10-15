import * as cheerio from 'cheerio';
import type { ArticleMeta } from '@/lib/articleMeta';
import { hostIs } from '@/lib/urlTools';
import { safeFetch } from '@/utils/safeFetch';

// Medium refuses servers on its pages (also on publications' own domains like ai.plainenglish.io), but its RSS
// feeds answer. A feed holds a publication's or author's latest posts (about 10): when the saved post is one of
// them, the feed gives its title, subtitle, author, publication, date and cover. Older posts aren't in it.

// The post id at the end of a Medium address ("…-735a5471ea22", or medium.com/p/735a5471ea22).
export function mediumPostId(url: string): string | null {
  try {
    const u = new URL(url);
    const p = u.pathname.replace(/\/+$/, '');
    return p.match(/\/p\/([0-9a-f]{10,12})$/)?.[1] ?? p.match(/-([0-9a-f]{10,12})$/)?.[1] ?? null;
  } catch {
    return null;
  }
}

// Feeds that may hold the post: the author's or publication's on medium.com, else the site's own /feed.
export function mediumFeedUrls(url: string): string[] {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    const first = u.pathname.split('/')[1] || '';
    if (host === 'medium.com' || host === 'www.medium.com') {
      return first && first !== 'p' && /^@?[A-Za-z0-9._-]{1,80}$/.test(first) ? [`https://medium.com/feed/${first}`] : [];
    }
    if (hostIs(host, 'medium.com')) return [`https://${host}/feed`];          // <author>.medium.com
    return [`https://${host}/feed`];                                         // a publication's own domain
  } catch {
    return [];
  }
}

const strip = (s: string) => s.replace(/<!\[CDATA\[|\]\]>/g, '').trim();

// The details of post `id` in a feed, or null when it isn't there.
export function readMediumFeed(xml: string, id: string): ArticleMeta | null {
  const $ = cheerio.load(xml.slice(0, 2_000_000), { xmlMode: true });
  const channel = strip($('channel > title').first().text()).replace(/\s*-\s*Medium$/i, '');
  let found: ArticleMeta | null = null;
  $('item').each((_, el) => {
    if (found) return;
    const it = $(el);
    const guid = strip(it.find('guid').first().text());
    const link = strip(it.find('link').first().text());
    if (!guid.endsWith(`/p/${id}`) && !link.includes(id)) return;
    const desc = cheerio.load(strip(it.find('description').first().text()));
    const image = desc('img').first().attr('src') || null;
    // The first paragraph with words (the first one often holds only the cover picture).
    const subtitle = desc('h3, h4, p').toArray().map((n) => desc(n).text().replace(/Continue reading on .*$/i, '').trim()).find(Boolean) || null;
    found = {
      title: strip(it.find('title').first().text()) || null,
      subtitle,
      image,
      author: strip(it.find('dc\\:creator').first().text()) || null,
      publisher: channel && !/^Stories by /i.test(channel) ? channel : null,
      published: strip(it.find('pubDate').first().text()) || null,
      site_name: 'Medium',
    };
  });
  return found;
}

export async function fetchMediumFromFeed(url: string): Promise<ArticleMeta | null> {
  const id = mediumPostId(url);
  if (!id) return null;
  for (const feed of mediumFeedUrls(url).slice(0, 2)) {
    try {
      const res = await safeFetch(feed, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; inntoit/1.0)' }, signal: AbortSignal.timeout(5000) });
      if (!res.ok || !/xml|rss/i.test(res.headers.get('content-type') || 'xml')) continue;
      const meta = readMediumFeed(await res.text(), id);
      if (meta?.title) return meta;
    } catch { /* next feed */ }
  }
  return null;
}
