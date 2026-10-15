import * as cheerio from 'cheerio';
import { readArticleMeta, type ArticleMeta } from '@/lib/articleMeta';
import { parsePageCapture } from '@/lib/pageCapture';

// A page downloaded by the person's own phone (the iPhone Shortcut's "Get Contents of URL") and sent with the
// save. Some sites refuse Vercel's servers (Reddit share links, Medium) but not phones, so this lets a phone save
// get the same content as a right-click save. It is only read for its details, each one checked; never shown.

export const MAX_PAGE_HTML = 2_000_000;

// The page's head (where all the details are), so huge bodies are never parsed.
function headOf(html: string): string {
  const s = html.slice(0, MAX_PAGE_HTML);
  const end = s.search(/<\/head>/i);
  return end > 0 ? s.slice(0, end + 7) : s.slice(0, 600_000);
}

export function cleanPageHtml(raw: unknown): string | null {
  return typeof raw === 'string' && raw.length > 50 ? raw.slice(0, MAX_PAGE_HTML) : null;
}

// The page's own address (og:url, else <link rel="canonical">), or null.
export function canonicalFromHtml(html: string): string | null {
  const $ = cheerio.load(headOf(html));
  const u = $('meta[property="og:url"]').attr('content') || $('link[rel="canonical"]').attr('href') || '';
  try { const p = new URL(u); return p.protocol === 'https:' ? p.href : null; } catch { return null; }
}

// The same checked details the extension sends for a page (title, description, image, author, site…).
export function pageMetaFromHtml(html: string): ArticleMeta | null {
  return parsePageCapture(readArticleMeta(headOf(html)));
}

// For readers that need the whole page (LinkedIn's structured data can sit outside the head).
export function limitedHtml(html: string): string {
  return html.slice(0, MAX_PAGE_HTML);
}
