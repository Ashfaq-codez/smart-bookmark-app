import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { needsPreview, repairPreview } from '@/lib/linkPreview';

type Ctx = { params: Promise<{ id: string }> };

// Starting a headless Chrome and loading the page can take a while.
export const maxDuration = 60;

// "This link card has no picture of its own": copy its picture into our storage, read the page again, or take our
// own screenshot of it. The card then refreshes
// through the normal live update. Only the owner's own bookmark, and at most once a day per card.
export async function POST(_request: Request, { params }: Ctx) {
  try {
    const raw = (await params).id;
    if (!/^[0-9]{1,15}$/.test(raw)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    const id = Number(raw);

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: row, error } = await supabase
      .from('bookmarks')
      .select('id, url, type, title, description, image_url, file_path, preview_tried_at')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle();
    if (error) throw error;
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (!needsPreview(row)) return NextResponse.json({ status: 'skipped' });

    const outcome = await repairPreview(supabase, user.id, row);
    if (outcome.status === 'none') console.warn('[preview] no picture for', id, JSON.stringify(outcome.steps));
    return NextResponse.json(outcome);
  } catch (error: any) {
    console.error('[preview] failed:', error?.code, error?.message);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
