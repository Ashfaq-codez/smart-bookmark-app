import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { isOverSaveLimit } from '@/lib/saveLimit';

const MAX_TITLE_CHARS = 300;
const MAX_PATH_CHARS = 300;

// Step 2 of a file upload. The browser has already put the file in the "attachments" bucket;
// this route checks the save limit and then creates the bookmark row for it.
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const filePath = body?.file_path;
    const fileType = typeof body?.file_type === 'string' ? body.file_type : '';
    const rawTitle = typeof body?.title === 'string' ? body.title.trim() : '';

    // The file must sit in this person's own folder, like the storage rules already demand.
    if (
      typeof filePath !== 'string' || filePath.length > MAX_PATH_CHARS ||
      !filePath.startsWith(`${user.id}/`) || filePath.includes('..')
    ) {
      return NextResponse.json({ error: 'Invalid file' }, { status: 400 });
    }

    if (await isOverSaveLimit(supabase, user.id)) {
      return NextResponse.json(
        { error: 'Too many saves. Please wait a minute and try again.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    let type = 'file';
    if (fileType.startsWith('image/')) type = 'image';
    else if (fileType.startsWith('video/')) type = 'video';
    else if (fileType === 'application/pdf') type = 'pdf';

    // The address is built here, so the browser cannot make a bookmark point at something else.
    const { data: { publicUrl } } = supabase.storage.from('attachments').getPublicUrl(filePath);

    const { data, error } = await supabase
      .from('bookmarks')
      .insert([{
        user_id: user.id,
        title: rawTitle.slice(0, MAX_TITLE_CHARS) || 'Saved File',
        url: publicUrl,
        type,
        file_path: filePath,
        file_type: fileType || null,
        ...(type === 'image' && { image_url: publicUrl }),
      }])
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    console.error('[upload] failed:', error?.code, error?.message);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
