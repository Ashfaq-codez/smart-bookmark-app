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

// "@name on Instagram: first line of the caption"
export function instagramTitle(c: InstagramCapture): string {
  const who = c.handle ? `@${c.handle}` : 'Post';
  const first = (c.caption || '').split('\n').find((l) => l.trim())?.trim() || '';
  const short = first.length > 90 ? `${first.slice(0, 89).trimEnd()}…` : first;
  return short ? `${who} on Instagram: ${short}` : `${who} on Instagram`;
}

// Copies the picture into the person's own storage folder (max 1600px, WebP), so it never expires.
// Returns the stored path and public address, or null when anything goes wrong.
export async function storeInstagramImage(
  supabase: SupabaseClient,
  userId: string,
  imageUrl: string,
): Promise<{ path: string; publicUrl: string } | null> {
  try {
    if (!isInstagramCdn(imageUrl)) return null;
    const res = await safeFetch(imageUrl, { signal: AbortSignal.timeout(8000) });
    if (!res.ok || !(res.headers.get('content-type') || '').startsWith('image/')) return null;
    const declared = Number(res.headers.get('content-length') || 0);
    if (declared > MAX_IMAGE_BYTES) return null;
    const input = Buffer.from(await res.arrayBuffer());
    if (input.length > MAX_IMAGE_BYTES) return null;

    const webp = await sharp(input, { limitInputPixels: 50_000_000 })
      .rotate()
      .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 78 })
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
