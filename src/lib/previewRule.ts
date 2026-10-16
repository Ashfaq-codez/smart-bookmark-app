// When a link card should get a better picture (browser-safe: used by the dashboard and the server).
// Every card that would show the plain letter, or whose picture lives on someone else's site (which may refuse
// to show it), gets a picture copied into our own storage. Each card is tried at most once every few hours.

export const PREVIEW_RETRY_MS = 6 * 60 * 60 * 1000;

// These have their own card designs (or are files we already store).
const OWN_CARD = new Set(['note', 'image', 'video', 'pdf', 'twitter', 'instagram', 'youtube', 'tiktok', 'reddit', 'threads', 'spotify', 'hackernews', 'linkedin', 'pinterest']);

export type PreviewRow = { url: string; type?: string | null; image_url?: string | null; file_path?: string | null; preview_tried_at?: string | null };

// A picture in our own Supabase storage (always shows).
export function isOurStorage(url: string | null | undefined): boolean {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !!url && !!base && url.startsWith(`${base}/storage/v1/object/public/attachments/`);
}

export function needsPreview(row: PreviewRow, now = Date.now()): boolean {
  if (OWN_CARD.has(row.type || 'link') || row.file_path || isOurStorage(row.image_url)) return false;
  if (!/^https?:\/\//.test(row.url || '') || row.url.includes('smart-bookmark.internal')) return false;
  if (!row.preview_tried_at) return true;
  const tried = Date.parse(row.preview_tried_at);
  return isNaN(tried) || now - tried >= PREVIEW_RETRY_MS;
}
