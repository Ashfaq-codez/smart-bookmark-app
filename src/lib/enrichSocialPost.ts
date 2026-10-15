import type { SupabaseClient } from '@supabase/supabase-js';
import { canonicalizeXUrl } from '@/lib/urlTools';
import { fetchXSnapshot, xTitle } from '@/lib/xSnapshot';
import type { XPost } from '@/types';

// ONE place that reads a saved social post and stores what it finds on the bookmark.
// Used by every save (/api/save: the app, popup, right-click, /share, the iPhone Shortcut),
// by the "fix it when it is shown" route and by the backfill.

export const RETRY_AFTER_MS = 24 * 60 * 60 * 1000;   // a failed post is tried again at most once a day

export type EnrichRow = {
  id: number;
  url: string;
  type?: string | null;
  title?: string | null;
  image_url?: string | null;
  post_data?: unknown;
  post_data_failed_at?: string | null;
};

export type EnrichMode =
  | 'save'      // brand-new save: fill title, description and cover from the post
  | 'repair';   // older save: never overwrite what the person may have edited

export type EnrichResult = 'stored' | 'failed' | 'skipped';

// Does this bookmark still need a snapshot (and is it allowed to try now)?
export function needsSnapshot(row: Pick<EnrichRow, 'type' | 'url' | 'post_data' | 'post_data_failed_at'>, now = Date.now()): boolean {
  if (row.type !== 'twitter' || row.post_data || !canonicalizeXUrl(row.url || '')) return false;
  if (!row.post_data_failed_at) return true;
  const failed = Date.parse(row.post_data_failed_at);
  return isNaN(failed) || now - failed >= RETRY_AFTER_MS;
}

// Titles the app made itself (safe to replace with the real one): empty, the address, "Post by … on X", "Saved Item".
function isAutoTitle(title: string | null | undefined, url: string): boolean {
  const t = (title || '').trim();
  return !t || t === url || /^Post by .* on X$/.test(t) || t === 'Saved Item' || /^https?:\/\//.test(t);
}

// The cover picture: first photo, else the video poster, else the quoted post's. Never an mp4.
export function coverImage(p: XPost): string | null {
  return p.photos[0]?.url || p.video?.poster || p.quoted?.photos[0]?.url || p.quoted?.video?.poster || p.card?.image || null;
}

const isVideoAddress = (u?: string | null) => !!u && /\.(mp4|m3u8|mov|webm)(\?|$)/i.test(u);

// `keep`: fields the person sent with the save themselves (never replaced).
export async function enrichSocialPost(
  db: SupabaseClient, userId: string, row: EnrichRow, mode: EnrichMode,
  keep: { description?: boolean; image?: boolean } = {},
): Promise<EnrichResult> {
  const canonical = row.type === 'twitter' ? canonicalizeXUrl(row.url) : null;
  if (!canonical) return 'skipped';
  const id = canonical.split('/status/')[1];

  const result = await fetchXSnapshot(id);
  const now = new Date().toISOString();

  if (!result.ok) {
    // Deleted, private or X not answering: keep the existing preview, try again tomorrow at the earliest.
    const { error } = await db.from('bookmarks').update({ post_data_failed_at: now }).eq('id', row.id).eq('user_id', userId);
    if (error) console.error('[x-snapshot] marking failure failed:', error.message);
    return 'failed';
  }

  const post = result.post;
  const patch: Record<string, unknown> = { post_data: post, post_data_fetched_at: now, post_data_failed_at: null };
  if (mode === 'save' || isAutoTitle(row.title, row.url)) patch.title = xTitle(post);
  if (mode === 'save' && !keep.description) patch.description = post.full_text || post.text || null;
  const cover = coverImage(post);
  if (cover && !keep.image && (mode === 'save' || !row.image_url || isVideoAddress(row.image_url))) patch.image_url = cover;
  // An /i/status/<id> save learns its handle here.
  if (canonical.startsWith('https://x.com/i/status/')) patch.url = post.url;

  let { error } = await db.from('bookmarks').update(patch).eq('id', row.id).eq('user_id', userId);
  // The handle address is already saved as another row: keep the /i/status one, store the rest.
  if (error?.code === '23505' && patch.url) {
    delete patch.url;
    ({ error } = await db.from('bookmarks').update(patch).eq('id', row.id).eq('user_id', userId));
  }
  if (error) {
    console.error('[x-snapshot] update failed:', error.message);
    return 'failed';
  }
  return 'stored';
}
