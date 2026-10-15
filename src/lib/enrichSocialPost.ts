import type { SupabaseClient } from '@supabase/supabase-js';
import { canonicalizeXUrl, hostIs } from '@/lib/urlTools';
import { youTubeVideoId, isAutoYouTubeTitle, fetchYouTubeInfo } from '@/lib/youtubeMeta';
import { cleanHandle, handleFromUrl, handleFromDescription, captionFromDescription, fetchInstagramPage, instagramSnapshot } from '@/lib/instagramMeta';
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
  description?: string | null;
  image_url?: string | null;
  post_data?: unknown;
  post_data_failed_at?: string | null;
};

export type EnrichMode =
  | 'save'      // brand-new save: fill title, description and cover from the post
  | 'repair';   // older save: never overwrite what the person may have edited

// 'not-found' = nothing usable yet (login wall, deleted post): the preview stays, tried again after a day.
export type EnrichResult = 'stored' | 'failed' | 'not-found' | 'skipped';

// An Instagram post address (/p/, /reel/, /reels/, /tv/, also with a handle in front).
export function isInstagramPostUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const u = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`);
    return hostIs(u.hostname.toLowerCase(), 'instagram.com') && /^\/(?:[^/]+\/)?(p|reel|reels|tv)\/[A-Za-z0-9_-]+/.test(u.pathname);
  } catch {
    return false;
  }
}

// Does this bookmark still need a snapshot (and is it allowed to try now)?
export function needsSnapshot(row: Pick<EnrichRow, 'type' | 'url' | 'post_data' | 'post_data_failed_at'>, now = Date.now()): boolean {
  if (row.post_data) return false;
  const supported = (row.type === 'twitter' && !!canonicalizeXUrl(row.url || ''))
    || (row.type === 'instagram' && isInstagramPostUrl(row.url))
    || (row.type === 'youtube' && !!youTubeVideoId(row.url));
  if (!supported) return false;
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
// `captured`: what the extension read on the page (Instagram only); checked here, never trusted as is.
export type EnrichKeep = { title?: boolean; description?: boolean; image?: boolean };
export type Captured = { handle?: unknown; caption?: string | null; is_video?: boolean };

export async function enrichSocialPost(
  db: SupabaseClient, userId: string, row: EnrichRow, mode: EnrichMode,
  keep: EnrichKeep = {}, captured: Captured = {},
): Promise<EnrichResult> {
  if (row.type === 'instagram') return enrichInstagram(db, userId, row, mode, keep, captured);
  if (row.type === 'youtube') return enrichYouTube(db, userId, row, mode, keep);
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

// ---------- Instagram ----------
// Titles the app made itself for Instagram: empty, the address, or Instagram's bare site name ("(4) Instagram").
const isAutoInstagramTitle = (t: string | null | undefined, url: string) => {
  const v = (t || '').trim();
  return !v || v === url || /^(\(\d+\)\s*)?Instagram$/i.test(v);
};

async function enrichInstagram(
  db: SupabaseClient, userId: string, row: EnrichRow, mode: EnrichMode, keep: EnrichKeep, captured: Captured,
): Promise<EnrichResult> {
  if (!isInstagramPostUrl(row.url)) return 'skipped';
  const now = new Date().toISOString();
  const update = async (patch: Record<string, unknown>) => {
    const { error } = await db.from('bookmarks').update(patch).eq('id', row.id).eq('user_id', userId);
    if (error) console.error('[instagram] update failed:', error.message);
    return !error;
  };

  // a) the extension, b) the address, then (repair) c) the page details read when it was saved.
  let handle = cleanHandle(captured.handle);
  let source: 'extension' | 'url' | 'page' = 'extension';
  if (!handle) { handle = handleFromUrl(row.url); source = 'url'; }
  if (!handle && mode === 'repair') { handle = handleFromDescription(row.description); source = 'page'; }

  // A new save reads the page (title, caption, cover) unless the extension already sent the post's details.
  // A repair only reads it when the handle is still unknown, so most old cards never contact Instagram.
  const fromExtension = mode === 'save' && source === 'extension' && !!handle;
  const patch: Record<string, unknown> = {};
  // The caption the extension read (already checked by parseInstagramCapture) beats any page text.
  const capturedCaption = typeof captured.caption === 'string' && captured.caption.trim() ? captured.caption : null;
  let caption = capturedCaption || captionFromDescription(row.description);
  let isVideo = captured.is_video === true || /\/(reels?|tv)\//.test(row.url);
  if ((mode === 'save' && !fromExtension) || !handle) {
    const page = await fetchInstagramPage(row.url);
    if (page.ok) {
      const p = page.page;
      if (!handle && p.handle) { handle = p.handle; source = 'page'; }
      caption = capturedCaption || captionFromDescription(p.description) || caption;
      isVideo = isVideo || p.is_video;
      const titleIsAuto = mode === 'save' ? !keep.title : isAutoInstagramTitle(row.title, row.url);
      if (titleIsAuto && p.title) patch.title = p.title;
      if (mode === 'save' ? !keep.description : !row.description) { if (p.description) patch.description = p.description; }
      if (mode === 'save' ? !keep.image : !row.image_url) { if (p.image) patch.image_url = p.image; }
    }
    // Login wall or no answer: not an error, just nothing found for now.
  }

  if (!handle) {
    await update({ ...patch, post_data_failed_at: now });
    return 'not-found';
  }
  const ok = await update({ ...patch, post_data: instagramSnapshot(handle, source, caption, isVideo), post_data_fetched_at: now, post_data_failed_at: null });
  return ok ? 'stored' : 'failed';
}

// ---------- YouTube ----------
// The real title and channel. A save sets the title unless the person gave one; a repair only replaces a
// title the app made itself (the bare address, "YouTube").
async function enrichYouTube(db: SupabaseClient, userId: string, row: EnrichRow, mode: EnrichMode, keep: EnrichKeep): Promise<EnrichResult> {
  const id = youTubeVideoId(row.url);
  if (!id) return 'skipped';
  const info = await fetchYouTubeInfo(id);
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = info.ok
    ? { post_data: info.post, post_data_fetched_at: now, post_data_failed_at: null }
    : { post_data_failed_at: now };
  if (info.ok && (mode === 'save' ? !keep.title : isAutoYouTubeTitle(row.title))) patch.title = info.post.title;
  const { error } = await db.from('bookmarks').update(patch).eq('id', row.id).eq('user_id', userId);
  if (error) {
    console.error('[youtube] update failed:', error.message);
    return 'failed';
  }
  return info.ok ? 'stored' : 'not-found';
}
