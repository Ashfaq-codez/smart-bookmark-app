import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { isAdmin } from '@/lib/admin';
import { enrichSocialPost, RETRY_AFTER_MS } from '@/lib/enrichSocialPost';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const BATCH = 10;
const DELAY_MS = 1500;   // pause between posts, to be gentle with the free sources

// Reads snapshots for older X bookmarks, 10 at a time. Owner only (ADMIN_USER_IDS), and only the owner's own rows.
//   GET  = dry run: lists what the next batch would read, changes nothing.
//   POST = reads the next batch and reports each result plus how many are left.
async function nextBatch() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.id)) return { error: NextResponse.json({ error: 'Not found' }, { status: 404 }) };

  const retryBefore = new Date(Date.now() - RETRY_AFTER_MS).toISOString();
  const { data, count, error } = await supabase
    .from('bookmarks')
    .select('id, url, type, title, image_url, post_data, post_data_failed_at', { count: 'exact' })
    .eq('user_id', user.id)
    .eq('type', 'twitter')
    .is('post_data', null)
    .or(`post_data_failed_at.is.null,post_data_failed_at.lt.${retryBefore}`)
    .order('created_at', { ascending: false })
    .limit(BATCH);
  if (error) throw error;
  return { supabase, userId: user.id, rows: data || [], waiting: count ?? (data || []).length };
}

export async function GET() {
  try {
    const r = await nextBatch();
    if ('error' in r) return r.error;
    return NextResponse.json({
      dryRun: true,
      waiting: r.waiting,
      nextBatch: r.rows.map((b) => ({ id: b.id, url: b.url, title: b.title })),
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e: any) {
    console.error('[x-backfill] dry run failed:', e?.message);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const r = await nextBatch();
    if ('error' in r) return r.error;
    const results: { id: number; url: string; result: string }[] = [];
    for (const [i, row] of r.rows.entries()) {
      if (i > 0) await new Promise((res) => setTimeout(res, DELAY_MS));
      results.push({ id: row.id, url: row.url, result: await enrichSocialPost(r.supabase, r.userId, row, 'repair') });
    }
    return NextResponse.json({ done: results, waitingBefore: r.waiting, left: Math.max(0, r.waiting - results.length) });
  } catch (e: any) {
    console.error('[x-backfill] failed:', e?.message);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
