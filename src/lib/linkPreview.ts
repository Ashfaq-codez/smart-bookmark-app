import type { SupabaseClient } from '@supabase/supabase-js';
import { fetchPageDetails } from '@/lib/pageDetails';
import { screenshotWithReason } from '@/lib/serverScreenshot';
import { storeScreenshot, copyImageToStorage, isOurStorage } from '@/lib/pageScreenshot';
import { needsPreview, PREVIEW_RETRY_MS, type PreviewRow } from '@/lib/previewRule';

export { needsPreview };

// Every link card gets a picture that always shows, kept in our own storage:
//   1. the picture it already has, copied to our storage (sites often refuse to show theirs on other websites)
//   2. the page's own preview picture, read again and copied
//   3. our own screenshot of the page (headless Chrome, no outside service)
// Each card is tried at most once every few hours (preview_tried_at), whatever the outcome.

type Row = PreviewRow & { id: number; title?: string | null; description?: string | null };
export type PreviewStep = { step: string; result: string };
export type PreviewOutcome = { status: 'stored' | 'none' | 'skipped'; steps: PreviewStep[]; image_url?: string };

// Our own screenshot of the page, stored as attachments/<user>/shot-<uuid>.webp.
export async function screenshotToStorage(db: SupabaseClient, userId: string, url: string) {
  const { shot } = await screenshotWithReason(url);
  return shot ? storeScreenshot(db, userId, shot) : null;
}

// Finds a picture for one page. Stores nothing in the bookmark (the caller does); `dryRun` keeps no files at all.
export async function findPreview(db: SupabaseClient, userId: string, row: Pick<Row, 'url' | 'image_url'>, dryRun = false) {
  const steps: PreviewStep[] = [];
  const keep = async (stored: { path: string; publicUrl: string } | null) => {
    if (stored && dryRun) await db.storage.from('attachments').remove([stored.path]);
    return stored;
  };

  if (row.image_url && !isOurStorage(row.image_url)) {
    const { stored, reason } = await copyImageToStorage(db, userId, row.image_url, row.url);
    steps.push({ step: 'copy the saved picture', result: reason });
    if (stored) return { stored: await keep(stored), details: null, steps };
  }

  const details = await fetchPageDetails(row.url, 'link');
  steps.push({ step: 'read the page', result: details.title || details.image ? `title: ${details.title ? 'yes' : 'no'}, picture: ${details.image || 'none'}` : 'the page could not be read (blocked or offline)' });
  if (details.image && details.image !== row.image_url) {
    const { stored, reason } = await copyImageToStorage(db, userId, details.image, row.url);
    steps.push({ step: 'copy the page picture', result: reason });
    if (stored) return { stored: await keep(stored), details, steps };
  }

  const { shot, reason } = await screenshotWithReason(row.url);
  steps.push({ step: 'take a screenshot', result: reason });
  if (shot) {
    const stored = await storeScreenshot(db, userId, shot);
    steps.push({ step: 'store the screenshot', result: stored ? 'ok' : 'storage upload failed' });
    if (stored) return { stored: await keep(stored), details, steps };
  }
  return { stored: null, details, steps };
}

export async function repairPreview(db: SupabaseClient, userId: string, row: Row): Promise<PreviewOutcome> {
  // Claim the attempt first, so two open tabs never repair the same card at once.
  const since = new Date(Date.now() - PREVIEW_RETRY_MS).toISOString();
  const { data: claimed, error: claimError } = await db.from('bookmarks')
    .update({ preview_tried_at: new Date().toISOString() })
    .eq('id', row.id).eq('user_id', userId)
    .or(`preview_tried_at.is.null,preview_tried_at.lt.${since}`)
    .select('id');
  if (claimError || !claimed?.length) return { status: 'skipped', steps: [{ step: 'claim', result: claimError?.message || 'tried recently' }] };

  const { stored, details, steps } = await findPreview(db, userId, row);
  const patch: Record<string, unknown> = {};
  if (stored) { patch.image_url = stored.publicUrl; patch.file_path = stored.path; }
  // The address still standing in as the title (the page couldn't be read when saved): use the real one.
  if (details?.title && (!row.title || row.title === row.url)) patch.title = details.title.slice(0, 300);
  if (details?.description && !row.description) patch.description = details.description;
  if (!Object.keys(patch).length) return { status: 'none', steps };

  const { error } = await db.from('bookmarks').update(patch).eq('id', row.id).eq('user_id', userId);
  if (error) {
    console.error('[preview] update failed:', error.message);
    if (stored) await db.storage.from('attachments').remove([stored.path]);
    return { status: 'none', steps: [...steps, { step: 'save', result: error.message }] };
  }
  return stored ? { status: 'stored', steps, image_url: stored.publicUrl } : { status: 'none', steps };
}
