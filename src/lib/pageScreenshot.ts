import crypto from 'crypto';
import sharp from 'sharp';
import type { SupabaseClient } from '@supabase/supabase-js';

// Screenshots used as the preview of a page that has no picture of its own.
// They come from the extension (what your browser shows) and are kept in our own storage
// (attachments/<user>/shot-<uuid>.webp), so no outside service ever sees the address.

export const MAX_SCREENSHOT_CHARS = 1_500_000;   // the extension sends at most ~1.1 MB of JPEG
const DATA_URL = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/;

// The picture inside a screenshot sent by the extension, or null when it isn't one.
export function parseScreenshot(raw: unknown): Buffer | null {
  if (typeof raw !== 'string' || raw.length > MAX_SCREENSHOT_CHARS) return null;
  const m = raw.match(DATA_URL);
  if (!m) return null;
  const buf = Buffer.from(m[2], 'base64');
  return buf.length > 100 ? buf : null;
}

// Checks it really is a picture, makes it a small WebP and stores it. null when anything fails.
export async function storeScreenshot(
  supabase: SupabaseClient,
  userId: string,
  input: Buffer,
): Promise<{ path: string; publicUrl: string } | null> {
  try {
    const webp = await sharp(input, { limitInputPixels: 20_000_000 })
      .resize({ width: 1200, height: 900, fit: 'cover', position: 'top', withoutEnlargement: true })
      .webp({ quality: 75 })
      .toBuffer();
    const path = `${userId}/shot-${crypto.randomUUID()}.webp`;
    const { error } = await supabase.storage.from('attachments').upload(path, webp, { contentType: 'image/webp', upsert: false });
    if (error) {
      console.error('[screenshot] upload failed:', error.message);
      return null;
    }
    const { data: { publicUrl } } = supabase.storage.from('attachments').getPublicUrl(path);
    return { path, publicUrl };
  } catch (e: any) {
    console.error('[screenshot] not a usable picture:', e?.message);
    return null;
  }
}

// A page's own preview picture, copied into our storage (attachments/<user>/img-<uuid>.webp).
// Many sites refuse to show their pictures on other websites (hotlink protection); our copy always shows.
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export { isOurStorage } from '@/lib/previewRule';

export async function copyImageToStorage(
  supabase: SupabaseClient,
  userId: string,
  imageUrl: string,
  pageUrl: string,
): Promise<{ stored: { path: string; publicUrl: string } | null; reason: string }> {
  try {
    const { safeFetch } = await import('@/utils/safeFetch');
    const { BROWSER_HEADERS } = await import('@/lib/pageDetails');
    const res = await safeFetch(imageUrl, {
      // Sent as if the page itself showed it: most hotlink checks only look at this.
      headers: { ...BROWSER_HEADERS, Accept: 'image/avif,image/webp,image/*,*/*;q=0.8', Referer: pageUrl },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { stored: null, reason: `picture refused (status ${res.status})` };
    const type = res.headers.get('content-type') || '';
    if (!type.startsWith('image/')) return { stored: null, reason: `not a picture (${type.slice(0, 40) || 'unknown type'})` };
    if (Number(res.headers.get('content-length') || 0) > MAX_IMAGE_BYTES) return { stored: null, reason: 'picture too large' };
    const input = Buffer.from(await res.arrayBuffer());
    if (input.length > MAX_IMAGE_BYTES) return { stored: null, reason: 'picture too large' };
    const meta = await sharp(input, { limitInputPixels: 50_000_000 }).metadata();
    // Tracking pixels and tiny icons are not a preview.
    if ((meta.width || 0) < 120 || (meta.height || 0) < 60) return { stored: null, reason: `picture too small (${meta.width}×${meta.height})` };
    const webp = await sharp(input, { limitInputPixels: 50_000_000 })
      .rotate()
      .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 78 })
      .toBuffer();
    const path = `${userId}/img-${crypto.randomUUID()}.webp`;
    const { error } = await supabase.storage.from('attachments').upload(path, webp, { contentType: 'image/webp', upsert: false });
    if (error) return { stored: null, reason: `storage upload failed: ${error.message}` };
    const { data: { publicUrl } } = supabase.storage.from('attachments').getPublicUrl(path);
    return { stored: { path, publicUrl }, reason: 'ok' };
  } catch (e: any) {
    return { stored: null, reason: `picture could not be read: ${String(e?.message || e).slice(0, 200)}` };
  }
}
