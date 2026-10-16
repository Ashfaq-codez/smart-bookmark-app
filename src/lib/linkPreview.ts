import type { SupabaseClient } from '@supabase/supabase-js';
import { fetchPageDetails } from '@/lib/pageDetails';
import { takeScreenshot } from '@/lib/serverScreenshot';
import { storeScreenshot } from '@/lib/pageScreenshot';
import { needsPreview, PREVIEW_RETRY_MS, type PreviewRow } from '@/lib/previewRule';

export { needsPreview };

// Link cards without a preview picture: read the page again, and if it still has none, take our own screenshot.
// Each card is tried at most once a day (preview_tried_at), whatever the outcome.

type Row = PreviewRow & { id: number; title?: string | null; description?: string | null };

// Our own screenshot of the page, stored as attachments/<user>/shot-<uuid>.webp.
export async function screenshotToStorage(db: SupabaseClient, userId: string, url: string) {
  const shot = await takeScreenshot(url);
  return shot ? storeScreenshot(db, userId, shot) : null;
}

export async function repairPreview(db: SupabaseClient, userId: string, row: Row): Promise<'stored' | 'none' | 'skipped'> {
  // Claim the attempt first, so two open tabs never repair the same card at once.
  const since = new Date(Date.now() - PREVIEW_RETRY_MS).toISOString();
  const { data: claimed, error: claimError } = await db.from('bookmarks')
    .update({ preview_tried_at: new Date().toISOString() })
    .eq('id', row.id).eq('user_id', userId)
    .or(`preview_tried_at.is.null,preview_tried_at.lt.${since}`)
    .select('id');
  if (claimError || !claimed?.length) return 'skipped';

  const details = await fetchPageDetails(row.url, 'link');
  const patch: Record<string, unknown> = {};
  let storedPath: string | null = null;
  if (details.image) {
    patch.image_url = details.image;
  } else {
    const stored = await screenshotToStorage(db, userId, row.url);
    if (stored) { patch.image_url = stored.publicUrl; patch.file_path = stored.path; storedPath = stored.path; }
  }
  // The address still standing in as the title (the page couldn't be read when saved): use the real one.
  if (details.title && (!row.title || row.title === row.url)) patch.title = details.title.slice(0, 300);
  if (details.description && !row.description) patch.description = details.description;
  if (!Object.keys(patch).length) return 'none';

  const { error } = await db.from('bookmarks').update(patch).eq('id', row.id).eq('user_id', userId);
  if (error) {
    console.error('[preview] update failed:', error.message);
    if (storedPath) await db.storage.from('attachments').remove([storedPath]);
    return 'none';
  }
  return patch.image_url ? 'stored' : 'none';
}
