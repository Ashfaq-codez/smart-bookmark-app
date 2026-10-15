import type { ArticleMeta } from '@/lib/articleMeta';

// Page details the extension read from the open page (its meta tags). Used only when the server can't read
// the page itself (Medium answers servers with 403). Every field is checked; nothing is trusted as is.

const MAX: Record<string, number> = {
  title: 300, description: 600, subtitle: 400, site_name: 120, author: 120, publisher: 120,
  published: 40, read_label: 40, generator: 60, android_package: 60,
};

const plain = (v: unknown, max: number) => {
  if (typeof v !== 'string') return null;
  const t = v.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim();
  return t ? t.slice(0, max) : null;
};

export function parsePageCapture(raw: unknown): ArticleMeta | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  const out: ArticleMeta = {};
  for (const [k, max] of Object.entries(MAX)) {
    const v = plain(r[k], max);
    if (v) (out as Record<string, unknown>)[k] = v;
  }
  if (typeof r.image === 'string' && r.image.length <= 2048) {
    try { if (new URL(r.image).protocol === 'https:') out.image = r.image; } catch { /* not an address */ }
  }
  const words = Number(r.word_count);
  if (Number.isInteger(words) && words > 0 && words < 1_000_000) out.word_count = words;
  return out.title ? out : null;
}
