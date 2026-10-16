import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { isAdmin } from '@/lib/admin';
import { needsPreview, repairPreview } from '@/lib/linkPreview';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const BATCH = 3;   // each can start a headless Chrome (a few seconds), so a few per run

// Owner only, own cards only.
//   /api/admin/preview-backfill        how many link cards still need a picture of their own (changes nothing)
//   /api/admin/preview-backfill?run=1  fixes the next 3 and reports each step; reload to do the next 3
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  try {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('id, url, type, title, description, image_url, file_path, preview_tried_at')
      .eq('user_id', user.id)
      .is('file_path', null)
      .order('created_at', { ascending: false })
      .limit(5000);
    if (error) throw error;
    // Ignores "tried recently": this is the owner asking for it now.
    const waiting = (data || []).filter((r) => needsPreview({ ...r, preview_tried_at: null }));
    const run = new URL(request.url).searchParams.get('run') === '1';
    if (!run) {
      return NextResponse.json({ waiting: waiting.length, next: waiting.slice(0, 10).map((r) => ({ id: r.id, url: r.url, picture: r.image_url || 'none' })), howTo: 'add ?run=1 to the address to fix the next 3' },
        { headers: { 'Cache-Control': 'no-store' } });
    }
    const done = [];
    for (const row of waiting.slice(0, BATCH)) {
      const outcome = await repairPreview(supabase, user.id, row, true);
      done.push({ id: row.id, url: row.url, result: outcome.status, steps: outcome.steps });
    }
    return NextResponse.json({ done, left: Math.max(0, waiting.length - done.length), next: 'reload this page to fix the next 3' },
      { headers: { 'Cache-Control': 'no-store' } });
  } catch (e: any) {
    console.error('[preview-backfill] failed:', e?.message);
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
