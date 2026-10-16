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
