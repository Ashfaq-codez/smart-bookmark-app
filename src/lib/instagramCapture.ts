import crypto from 'crypto';
import sharp from 'sharp';
import type { SupabaseClient } from '@supabase/supabase-js';
import { hostIs } from '@/lib/urlTools';
import { safeFetch } from '@/utils/safeFetch';

// What the extension read from an Instagram post page. The server cannot read Instagram itself,
// so this is the only source of the author, caption and picture. Every field is checked here.
export type InstagramCapture = {
  handle: string | null;
  caption: string | null;
  image_url: string | null;
  is_video: boolean;
};

export const MAX_CAPTION_CHARS = 2200;   // Instagram's own caption limit
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_SIDE = 1080;    // Instagram's own full size; about 100-200 KB as WebP

// True for https://(www.)instagram.com/p/<id>, /reel/<id>, /tv/<id> (what normalizeUrl stores).
export function isInstagramPostUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && hostIs(u.hostname, 'instagram.com') &&
      /^\/(p|reel|tv)\/[A-Za-z0-9_-]{5,40}\/?$/.test(u.pathname);
  } catch {
    return false;
  }
}

function isInstagramCdn(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && (hostIs(u.hostname, 'cdninstagram.com') || hostIs(u.hostname, 'fbcdn.net'));
  } catch {
    return false;
  }
}

// A real post picture: scontent…cdninstagram.com/v/… or …fbcdn.net/v/…
// Never Instagram's own logo (static.cdninstagram.com/rsrc.php/…), which the login wall shows as og:image.
export function isInstagramPostImage(url: string | null | undefined): boolean {
  if (!url || !isInstagramCdn(url)) return false;
  const u = new URL(url);
  return !hostIs(u.hostname, 'static.cdninstagram.com') && u.pathname.startsWith('/v/');
}

// When a signed picture address stops working: oe= is the end time in hex Unix seconds. null = no oe=.
export function instagramLinkExpiry(url: string | null | undefined): Date | null {
  const m = (url || '').match(/[?&]oe=([0-9A-Fa-f]{1,12})(?:&|$)/);
  return m ? new Date(parseInt(m[1], 16) * 1000) : null;
}

// Plain text only: control characters removed (line breaks kept), length capped.
function cleanCaption(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const text = raw
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, MAX_CAPTION_CHARS);
  return text || null;
}

// Accepted only for an Instagram post address; anything else (or nothing usable) gives null.
export function parseInstagramCapture(raw: unknown, url: string | null): InstagramCapture | null {
  if (!raw || typeof raw !== 'object' || !url || !isInstagramPostUrl(url)) return null;
  const r = raw as Record<string, unknown>;
  const handle = typeof r.handle === 'string' && /^[A-Za-z0-9._]{1,30}$/.test(r.handle) ? r.handle : null;
  const caption = cleanCaption(r.caption);
  const image_url = typeof r.image_url === 'string' && r.image_url.length <= 2048 && isInstagramCdn(r.image_url) ? r.image_url : null;
  if (!handle && !caption && !image_url) return null;
  return { handle, caption, image_url, is_video: r.is_video === true };
}

// "name on Instagram: first line of the caption" (no "@", the same shape Instagram's own titles have)
export function instagramTitle(c: InstagramCapture): string {
  const who = c.handle || 'Post';
  const first = (c.caption || '').split('\n').find((l) => l.trim())?.trim() || '';
  const short = first.length > 90 ? `${first.slice(0, 89).trimEnd()}…` : first;
  return short ? `${who} on Instagram: ${short}` : `${who} on Instagram`;
}

// Copies the picture into the person's own storage folder (max 1080px, WebP), so it never expires.
// Returns the stored path and public address, or null when anything goes wrong.
export async function storeInstagramImage(
  supabase: SupabaseClient,
  userId: string,
  imageUrl: string,
): Promise<{ path: string; publicUrl: string } | null> {
  try {
    if (!isInstagramPostImage(imageUrl)) return null;
    const res = await safeFetch(imageUrl, { signal: AbortSignal.timeout(8000) });
    if (!res.ok || !(res.headers.get('content-type') || '').startsWith('image/')) return null;
    const declared = Number(res.headers.get('content-length') || 0);
    if (declared > MAX_IMAGE_BYTES) return null;
    const input = Buffer.from(await res.arrayBuffer());
    if (input.length > MAX_IMAGE_BYTES) return null;

    const webp = await sharp(input, { limitInputPixels: 50_000_000 })
      .rotate()
      .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 75 })
      .toBuffer();

    const path = `${userId}/ig-${crypto.randomUUID()}.webp`;
    const { error } = await supabase.storage.from('attachments').upload(path, webp, { contentType: 'image/webp', upsert: false });
    if (error) {
      console.error('[instagram] upload failed:', error.message);
      return null;
    }
    const { data: { publicUrl } } = supabase.storage.from('attachments').getPublicUrl(path);
    return { path, publicUrl };
  } catch (e: any) {
    console.error('[instagram] image copy failed:', e?.message);
    return null;
  }
}

// Replaces a bookmark's picture with our own copy of `imageUrl`. Never makes it worse: nothing changes unless
// the new picture is a real post picture AND the copy is stored AND the row is updated. Only then is the old copy
// (the person's own earlier file) removed. Returns the new public address, or null when nothing changed.
export async function replaceInstagramImage(
  db: SupabaseClient,
  userId: string,
  row: { id: number; file_path?: string | null },
  imageUrl: string | null | undefined,
): Promise<string | null> {
  if (!imageUrl || !isInstagramPostImage(imageUrl)) return null;
  const stored = await storeInstagramImage(db, userId, imageUrl);
  if (!stored) return null;
  const { error } = await db.from('bookmarks')
    .update({ image_url: stored.publicUrl, file_path: stored.path })
    .eq('id', row.id).eq('user_id', userId);
  if (error) {
    console.error('[instagram] picture update failed:', error.message);
    await db.storage.from('attachments').remove([stored.path]);
    return null;
  }
  if (row.file_path && row.file_path.startsWith(`${userId}/ig-`)) {
    const { error: removeError } = await db.storage.from('attachments').remove([row.file_path]);
    if (removeError) console.error('[instagram] old picture cleanup failed');
  }
  return stored.publicUrl;
}
