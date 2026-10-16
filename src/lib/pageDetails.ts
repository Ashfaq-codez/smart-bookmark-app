import * as cheerio from 'cheerio';
import { isSafeUrl, safeFetch } from '@/utils/safeFetch';
import { readArticleMeta, articleFromMeta } from '@/lib/articleMeta';
import type { ArticlePost } from '@/types';

export type PageDetails = { title: string | null; description: string | null; image: string | null; canonicalUrl?: string | null; article?: ArticlePost | null };

const EMPTY: PageDetails = { title: null, description: null, image: null };

// Some sites (OpenAI…) refuse anything that doesn't look like a normal browser.
export const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

// A page's preview picture, from the usual places in order: og:image, twitter:image, <link rel="image_src">,
// itemprop="image", then the structured data (ld+json). Relative addresses are made full; https only.
export function pickPreviewImage($: ReturnType<typeof cheerio.load>, pageUrl: string): string | null {
  const metas = ['og:image', 'og:image:url', 'og:image:secure_url', 'twitter:image', 'twitter:image:src'];
  const candidates: unknown[] = metas.map((k) => $(`meta[property="${k}"]`).attr('content') || $(`meta[name="${k}"]`).attr('content'));
  candidates.push($('link[rel="image_src"]').attr('href'), $('meta[itemprop="image"]').attr('content'));
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const raw = JSON.parse($(el).contents().text());
      const list = Array.isArray(raw) ? raw : Array.isArray(raw?.['@graph']) ? raw['@graph'] : [raw];
      for (const d of list) {
        const img = Array.isArray(d?.image) ? d.image[0] : d?.image;
        candidates.push(typeof img === 'string' ? img : img?.url, d?.thumbnailUrl);
      }
    } catch { /* not JSON */ }
  });
  for (const c of candidates) {
    if (typeof c !== 'string' || !c.trim() || c.length > 2048) continue;
    try {
      const u = new URL(c.trim(), pageUrl);
      if (u.protocol === 'http:') u.protocol = 'https:';
      if (u.protocol === 'https:') return u.href;
    } catch { /* not an address */ }
  }
  return null;
}

// Reads the title, description and cover image of a saved page (or an X post).
// Never throws: when the page cannot be read it simply returns nothing and the save stays as it was.
export async function fetchPageDetails(cleanUrl: string, detectedType: string): Promise<PageDetails> {
  try {
    if (!(await isSafeUrl(cleanUrl))) return EMPTY;

    if (detectedType === 'twitter') {
      const vx = new URL(cleanUrl);
      vx.hostname = 'api.vxtwitter.com';
      const vxUrl = vx.href;
      const response = await safeFetch(vxUrl, { signal: AbortSignal.timeout(5000) });
      if (!response.ok) return EMPTY;
      const data = await response.json();

      let description = data.text || '';
      if (data.qrtURL && !description.includes(data.qrtURL)) description += `\n\n${data.qrtURL}`;
      const media = data.media_extended && data.media_extended.length > 0 ? data.media_extended[0].url : null;
      // With the handle known, an /i/status/<id> address can become the full x.com/<handle>/status/<id> one.
      const id = vx.pathname.match(/\/status\/(\d+)/)?.[1];
      const handle = typeof data.user_screen_name === 'string' && /^[A-Za-z0-9_]{1,15}$/.test(data.user_screen_name) ? data.user_screen_name : null;
      return {
        canonicalUrl: id && handle ? `https://x.com/${handle}/status/${id}` : null,
        title: `Post by ${data.user_name} (@${data.user_screen_name}) on X`,
        description: description || null,
        image: media || null,
      };
    }

    const response = await safeFetch(cleanUrl, {
      headers: BROWSER_HEADERS,
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return EMPTY;
    const html = await response.text();
    const $ = cheerio.load(html.substring(0, 512 * 1024));

    const title = $('meta[property="og:title"]').attr('content') || $('title').text().trim() || null;

    let description: string | null;
    if (detectedType === 'instagram') {
      description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || null;
      if (!description && title && title.includes(' on Instagram:')) {
        const match = title.match(/ on Instagram:\s*"?([^"]+)"?/i);
        if (match && match[1]) description = match[1].trim();
      }
    } else {
      description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || null;
    }

    const image = pickPreviewImage($, cleanUrl);
    // Substack / Medium article: author, publication, date, reading time (shown by the article cards).
    const article = articleFromMeta(cleanUrl, readArticleMeta(html));
    return { title, description, image, article };
  } catch {
    return EMPTY;
  }
}
