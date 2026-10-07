import * as cheerio from 'cheerio';
import { isSafeUrl, safeFetch } from '@/utils/safeFetch';

export type PageDetails = { title: string | null; description: string | null; image: string | null };

const EMPTY: PageDetails = { title: null, description: null, image: null };

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
      return {
        title: `Post by ${data.user_name} (@${data.user_screen_name}) on X`,
        description: description || null,
        image: media || null,
      };
    }

    const response = await safeFetch(cleanUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
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

    let image: string | null = null;
    const scrapedImg = $('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content');
    if (scrapedImg) {
      try {
        image = new URL(scrapedImg, cleanUrl).href;
        if (image.startsWith('http://')) image = image.replace('http://', 'https://');
      } catch { image = null; }
    }
    return { title, description, image };
  } catch {
    return EMPTY;
  }
}
