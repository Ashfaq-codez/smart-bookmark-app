import * as cheerio from 'cheerio';
import type { ArticlePost } from '@/types';
import { hostIs } from '@/lib/urlTools';

// Substack and Medium articles, from the page's own details (meta tags and its JSON-LD).
// The server reads Substack pages itself; Medium refuses servers (403), so for Medium the extension sends
// the same meta tags from the open page (see parsePageCapture) and they are read here the same way.

const isHttps = (u: unknown): u is string => {
  if (typeof u !== 'string' || u.length > 2048) return false;
  try { return new URL(u).protocol === 'https:'; } catch { return false; }
};
const text = (s: unknown, max: number) => (typeof s === 'string' && s.trim() ? s.replace(/\s+/g, ' ').trim().slice(0, max) : null);

export type ArticleMeta = {
  title?: string | null;
  description?: string | null;
  subtitle?: string | null;
  image?: string | null;
  site_name?: string | null;
  author?: string | null;
  publisher?: string | null;
  published?: string | null;
  read_label?: string | null;     // "3 min read"
  word_count?: number | null;
  generator?: string | null;
  android_package?: string | null;
};

// Which article platform an address / page is, or null.
export function articlePlatform(url: string, m: ArticleMeta): ArticlePost['platform'] | null {
  let host = '';
  try { host = new URL(url).hostname.toLowerCase(); } catch { return null; }
  if (hostIs(host, 'medium.com') || m.android_package === 'com.medium.reader' || (m.site_name || '').trim() === 'Medium') return 'medium';
  if (hostIs(host, 'substack.com') || /substack/i.test(m.generator || '') || /substackcdn\.com/.test(m.image || '')) return 'substack';
  return null;
}

export function articleFromMeta(url: string, m: ArticleMeta): ArticlePost | null {
  const platform = articlePlatform(url, m);
  const title = text(m.title, 300);
  if (!platform || !title) return null;
  const published = m.published && !isNaN(Date.parse(m.published)) ? new Date(m.published).toISOString() : null;
  const fromLabel = Number(m.read_label?.match(/(\d+)\s*min/i)?.[1]);
  const read = Number.isFinite(fromLabel) && fromLabel > 0 ? fromLabel
    : m.word_count && m.word_count > 0 ? Math.max(1, Math.round(m.word_count / 238)) : null;
  // Medium's publication is "Medium" itself unless the page names another one.
  const publication = text(m.publisher, 120) || (platform === 'substack' ? text(m.site_name, 120) : null);
  return {
    v: 1,
    platform,
    title,
    subtitle: text(m.subtitle, 400) || text(m.description, 400),
    author: text(m.author, 120),
    publication: publication && publication !== 'Medium' ? publication : null,
    image: isHttps(m.image) ? m.image : null,
    published_at: published,
    read_minutes: read && read < 600 ? read : null,
  };
}

// Reads the details from a page's HTML.
export function readArticleMeta(html: string): ArticleMeta {
  const $ = cheerio.load(html.slice(0, 1024 * 1024));
  const meta = (k: string) => $(`meta[property="${k}"]`).attr('content') || $(`meta[name="${k}"]`).attr('content') || null;

  let ldAuthor: string | null = null;
  let ldPublisher: string | null = null;
  let ldPublished: string | null = null;
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const raw = JSON.parse($(el).contents().text());
      for (const d of Array.isArray(raw) ? raw : [raw]) {
        const a = Array.isArray(d?.author) ? d.author[0] : d?.author;
        ldAuthor ||= typeof a?.name === 'string' ? a.name : null;
        ldPublisher ||= typeof d?.publisher?.name === 'string' ? d.publisher.name : (d?.['@type'] === 'Organization' && typeof d?.name === 'string' ? d.name : null);
        ldPublished ||= typeof d?.datePublished === 'string' ? d.datePublished : null;
      }
    } catch { /* not JSON */ }
  });
  const rssTitle = $('link[rel="alternate"][type="application/rss+xml"]').attr('title') || null;
  const words = Number(html.match(/\\?"wordcount\\?":(\d+)/)?.[1]);
  const readLabel = [meta('twitter:data1'), meta('twitter:data2')].find((v) => /min read/i.test(v || '')) || null;

  return {
    title: meta('og:title') || meta('twitter:title') || $('title').text() || null,
    description: meta('og:description') || meta('description'),
    subtitle: $('h3.subtitle').first().text() || null,
    image: meta('og:image') || meta('twitter:image'),
    site_name: meta('og:site_name'),
    author: meta('author') || ldAuthor,
    publisher: ldPublisher || rssTitle,
    published: meta('article:published_time') || ldPublished,
    read_label: readLabel,
    word_count: Number.isFinite(words) ? words : null,
    generator: meta('generator'),
    android_package: meta('al:android:package'),
  };
}
