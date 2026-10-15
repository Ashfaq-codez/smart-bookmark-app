import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { enrichSocialPost, needsSnapshot } from '@/lib/enrichSocialPost';

type Ctx = { params: Promise<{ id: string }> };

// Reading X can take a few seconds.
export const maxDuration = 20;

// "This X / Instagram card has no snapshot yet": read the post once and store it. The card then refreshes through the
// normal live update. Only the owner's own bookmark, and at most once a day for a post that failed.
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
      .select('id, url, type, title, description, image_url, post_data, post_data_failed_at')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle();
    if (error) throw error;
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Already done, not an X post, or failed less than a day ago.
    if (!needsSnapshot(row)) return NextResponse.json({ status: 'skipped' });

    const status = await enrichSocialPost(supabase, user.id, row, 'repair');
    return NextResponse.json({ status });
  } catch (error: any) {
    console.error('[snapshot] failed:', error?.code, error?.message);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
