import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { sanitizeNoteHtml, MAX_NOTE_CHARS } from '@/lib/sanitizeNoteHtml';

type Ctx = { params: Promise<{ id: string }> };

// Only plain positive whole numbers are accepted ("12", not "1e3", "-4" or "0x1").
function parseId(raw: string): number | null {
  if (!/^[0-9]+$/.test(raw)) return null;
  const id = Number(raw);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

// Deletes one of the signed-in person's bookmarks, and its uploaded file (if any).
export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const id = parseId((await params).id);
    if (id === null) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: deleted, error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id, file_path')
      .maybeSingle();
    if (error) throw error;
    if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // The bookmark is gone. A leftover file is the lesser problem, so a failure here is only logged.
    if (deleted.file_path) {
      const { error: storageError } = await supabase.storage.from('attachments').remove([deleted.file_path]);
      if (storageError) console.error('[delete] storage cleanup failed');
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('[delete] failed:', error?.code, error?.message);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}

// Saves an edited note body. Only allow-listed HTML is ever stored, and the cleaned text is sent back.
export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const id = parseId((await params).id);
    if (id === null) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    if (typeof body?.content !== 'string') {
      return NextResponse.json({ error: 'Content must be text' }, { status: 400 });
    }
    if (body.content.length > MAX_NOTE_CHARS) {
      return NextResponse.json({ error: 'Note is too long' }, { status: 413 });
    }

    const content = sanitizeNoteHtml(body.content);

    const { data: updated, error } = await supabase
      .from('bookmarks')
      .update({ content: content || null })
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({ content }, { status: 200 });
  } catch (error: any) {
    console.error('[update] failed:', error?.code, error?.message);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
