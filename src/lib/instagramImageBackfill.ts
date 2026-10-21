import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/server';
import { isAdmin } from '@/lib/admin';
import { isOurStorage } from '@/lib/previewRule';
import { RETRY_AFTER_MS, isInstagramPostUrl } from '@/lib/enrichSocialPost';
import { fetchInstagramPage } from '@/lib/instagramMeta';
import { isInstagramPostImage, instagramLinkExpiry, replaceInstagramImage } from '@/lib/instagramCapture';

// /api/admin/instagram-images: our own copy of the picture for older Instagram bookmarks.
// Owner only (ADMIN_USER_IDS) and only the owner's own rows.
//   GET  = dry run: how many rows are in each pass, and the rows that could not be recovered so far. Contacts nobody.
//   POST = the next batch. Pass 1 first (links still working: copied without asking Instagram, before they expire),
//          then pass 2 (expired link, Instagram logo, or no picture: the post page is read for a fresh link).
// A row is never made worse: its picture only changes when a real post picture was copied into storage.

const PASS1_BATCH = 20;
const PASS2_BATCH = 10;
const DELAY_MS = 3000;            // between Instagram page reads
const SAFETY_MS = 60 * 60 * 1000;  // a link ending within the hour is treated as expired
const BUDGET_MS = 40_000;          // a batch stops starting new rows after this (the route may run 60 s)

export type ImageRow = {
  id: number;
  url: string;
  image_url: string | null;
  file_path: string | null;
  post_data_failed_at: string | null;
};

export type ImagePlan = 'own copy' | 'copy link' | 'read page' | 'not ours';

// What the backfill does with a row. 'not ours' = a picture from somewhere else (the person's own choice): left alone.
export function imagePlan(row: Pick<ImageRow, 'url' | 'image_url'>, now = Date.now()): ImagePlan {
  const img = row.image_url;
  if (isOurStorage(img)) return 'own copy';
  if (!isInstagramPostUrl(row.url)) return 'not ours';
  if (img && isInstagramPostImage(img)) {
    const ends = instagramLinkExpiry(img);
    return ends && ends.getTime() - now > SAFETY_MS ? 'copy link' : 'read page';
  }
  // No picture, or Instagram's logo from a login wall.
  if (!img || /^https:\/\/([a-z0-9-]+\.)*(cdninstagram\.com|fbcdn\.net)\//i.test(img)) return 'read page';
  return 'not ours';
}

// Pass 2 rows that already failed less than a day ago wait (login wall, deleted post).
const recentlyFailed = (r: ImageRow, now: number) => !!r.post_data_failed_at && now - Date.parse(r.post_data_failed_at) < RETRY_AFTER_MS;

export function sortRows(rows: ImageRow[], now = Date.now()) {
  const todo = rows.filter((r) => ['copy link', 'read page'].includes(imagePlan(r, now)));
  return {
    pass1: todo.filter((r) => imagePlan(r, now) === 'copy link' && !recentlyFailed(r, now)),
    pass2: todo.filter((r) => imagePlan(r, now) === 'read page' && !recentlyFailed(r, now)),
    // Tried and not recovered (still worth a manual refresh: open the post and save it again with the extension).
    notRecovered: todo.filter((r) => !!r.post_data_failed_at),
    ownCopy: rows.filter((r) => imagePlan(r, now) === 'own copy').length,
  };
}

async function ownerRows() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.id)) return { ok: false as const, response: NextResponse.json({ error: 'Not found' }, { status: 404 }) };
  const { data, error } = await supabase
    .from('bookmarks')
    .select('id, url, image_url, file_path, post_data_failed_at')
    .eq('user_id', user.id)
    .eq('type', 'instagram')
    .order('created_at', { ascending: false })
    .limit(5000);
  if (error) throw error;
  return { ok: true as const, supabase, userId: user.id, rows: (data || []) as ImageRow[] };
}

export type RowResult = 'copied' | 'refreshed' | 'login wall' | 'deleted' | 'no picture' | 'failed';

// Pass 2 for one row: read the post page, copy its picture right away (the fresh link also expires).
export async function recoverFromPage(db: SupabaseClient, userId: string, row: ImageRow): Promise<RowResult> {
  const fetched = await fetchInstagramPage(row.url);
  let result: RowResult;
  if (!fetched.ok) result = fetched.reason === 'login-wall' ? 'login wall' : fetched.reason === 'gone' ? 'deleted' : 'failed';
  else if (!isInstagramPostImage(fetched.page.image)) result = 'no picture';
  else result = (await replaceInstagramImage(db, userId, row, fetched.page.image)) ? 'refreshed' : 'failed';
  // Remembered so the next batch moves on and the dry run can list it; the picture itself is untouched.
  const patch = result === 'refreshed' ? (row.post_data_failed_at ? { post_data_failed_at: null } : null) : { post_data_failed_at: new Date().toISOString() };
  if (patch) await db.from('bookmarks').update(patch).eq('id', row.id).eq('user_id', userId);
  return result;
}

export async function imageBackfillDryRun(): Promise<NextResponse> {
  try {
    const r = await ownerRows();
    if (!r.ok) return r.response;
    const s = sortRows(r.rows);
    return NextResponse.json({
      dryRun: true,
      alreadyOwnCopy: s.ownCopy,
      pass1CopyWorkingLinks: s.pass1.length,
      pass2ReadPostPage: s.pass2.length,
      notRecovered: s.notRecovered.map((b) => ({ id: b.id, url: b.url })),
      nextBatch: (s.pass1.length ? s.pass1.slice(0, PASS1_BATCH) : s.pass2.slice(0, PASS2_BATCH)).map((b) => ({ id: b.id, url: b.url })),
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e: any) {
    console.error('[image backfill] dry run failed:', e?.message);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}

export async function imageBackfillApply(): Promise<NextResponse> {
  try {
    const r = await ownerRows();
    if (!r.ok) return r.response;
    const s = sortRows(r.rows);
    const done: { id: number; url: string; pass: 1 | 2; result: RowResult }[] = [];
    const start = Date.now();
    const inTime = () => Date.now() - start < BUDGET_MS;
    if (s.pass1.length) {
      for (const row of s.pass1.slice(0, PASS1_BATCH)) {
        if (!inTime()) break;
        if (await replaceInstagramImage(r.supabase, r.userId, row, row.image_url)) {
          done.push({ id: row.id, url: row.url, pass: 1, result: 'copied' });
        } else {
          // Instagram refused the working link: read the post page for this one straight away.
          await new Promise((res) => setTimeout(res, DELAY_MS));
          done.push({ id: row.id, url: row.url, pass: 2, result: await recoverFromPage(r.supabase, r.userId, row) });
        }
      }
    } else {
      for (const [i, row] of s.pass2.slice(0, PASS2_BATCH).entries()) {
        if (!inTime()) break;
        if (i > 0) await new Promise((res) => setTimeout(res, DELAY_MS));
        done.push({ id: row.id, url: row.url, pass: 2, result: await recoverFromPage(r.supabase, r.userId, row) });
      }
    }
    const left = sortRows(r.rows.filter((row) => !done.some((d) => d.id === row.id)));
    return NextResponse.json({ done, pass1Left: left.pass1.length, pass2Left: left.pass2.length });
  } catch (e: any) {
    console.error('[image backfill] failed:', e?.message);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
