// When a link card without a picture should be repaired (browser-safe: used by the dashboard and the server).
// Each card is tried at most once a day (preview_tried_at), whatever the outcome.

export const PREVIEW_RETRY_MS = 24 * 60 * 60 * 1000;

export type PreviewRow = { url: string; type?: string | null; image_url?: string | null; file_path?: string | null; preview_tried_at?: string | null };

export function needsPreview(row: PreviewRow, now = Date.now()): boolean {
  if (row.type !== 'link' || row.image_url || row.file_path) return false;
  if (!/^https?:\/\//.test(row.url || '') || row.url.includes('smart-bookmark.internal')) return false;
  if (!row.preview_tried_at) return true;
  const tried = Date.parse(row.preview_tried_at);
  return isNaN(tried) || now - tried >= PREVIEW_RETRY_MS;
}
