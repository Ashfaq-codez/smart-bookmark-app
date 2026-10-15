import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { isAdmin } from '@/lib/admin';
import { enrichSocialPost, RETRY_AFTER_MS } from '@/lib/enrichSocialPost';
import { handleFromUrl, handleFromDescription } from '@/lib/instagramMeta';

// Shared by /api/admin/x-backfill, /api/admin/instagram-backfill and /api/admin/youtube-backfill.
// Owner only (ADMIN_USER_IDS) and only the owner's own rows, 10 at a time.
//   GET  = dry run: what the next batch would do; changes nothing and contacts nobody.
//   POST = does the next batch and reports each result plus how many are left.

const BATCH = 10;
type Kind = 'twitter' | 'instagram' | 'youtube';
const DELAY_MS: Record<Kind, number> = { twitter: 1500, instagram: 3000, youtube: 500 };   // gentle with the free sources

async function nextBatch(type: Kind) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.id)) return { ok: false as const, response: NextResponse.json({ error: 'Not found' }, { status: 404 }) };

  const retryBefore = new Date(Date.now() - RETRY_AFTER_MS).toISOString();
  const { data, count, error } = await supabase
    .from('bookmarks')
    .select('id, url, type, title, description, image_url, post_data, post_data_failed_at', { count: 'exact' })
    .eq('user_id', user.id)
    .eq('type', type)
    .is('post_data', null)
    .or(`post_data_failed_at.is.null,post_data_failed_at.lt.${retryBefore}`)
    .order('created_at', { ascending: false })
    .limit(BATCH);
  if (error) throw error;
  return { ok: true as const, supabase, userId: user.id, rows: data || [], waiting: count ?? (data || []).length };
}

// Instagram dry run: where the handle would come from, without contacting Instagram.
function instagramPlan(row: { url: string; description?: string | null }) {
  const fromUrl = handleFromUrl(row.url);
  if (fromUrl) return { handle: fromUrl, from: 'address', contactsInstagram: false };
  const fromSaved = handleFromDescription(row.description);
  if (fromSaved) return { handle: fromSaved, from: 'saved page details', contactsInstagram: false };
  return { handle: null, from: 'Instagram page (will be read)', contactsInstagram: true };
}

export async function backfillDryRun(type: Kind): Promise<NextResponse> {
  try {
    const r = await nextBatch(type);
    if (!r.ok) return r.response;
    return NextResponse.json({
      dryRun: true,
      waiting: r.waiting,
      nextBatch: r.rows.map((b) => ({
        id: b.id, url: b.url, title: b.title,
        ...(type === 'instagram' && { would: instagramPlan(b) }),
      })),
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e: any) {
    console.error(`[backfill ${type}] dry run failed:`, e?.message);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}

export async function backfillApply(type: Kind): Promise<NextResponse> {
  try {
    const r = await nextBatch(type);
    if (!r.ok) return r.response;
    const results: { id: number; url: string; result: string }[] = [];
    for (const [i, row] of r.rows.entries()) {
      // Pause only before a request that really goes out.
      const goesOut = type !== 'instagram' || instagramPlan(row).contactsInstagram;
      if (i > 0 && goesOut) await new Promise((res) => setTimeout(res, DELAY_MS[type]));
      results.push({ id: row.id, url: row.url, result: await enrichSocialPost(r.supabase, r.userId, row, 'repair') });
    }
    return NextResponse.json({ done: results, waitingBefore: r.waiting, left: Math.max(0, r.waiting - results.length) });
  } catch (e: any) {
    console.error(`[backfill ${type}] failed:`, e?.message);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
