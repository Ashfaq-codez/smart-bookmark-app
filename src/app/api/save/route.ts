import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import * as cheerio from 'cheerio';

async function generateTagsAndCategory(title: string, description: string) {
  return {
    category: 'Inbox',
    tags: ['auto-saved', 'web-clip'],
    type: 'link'
  };
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // 1. Authenticate request via Supabase session cookie
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Scrape metadata
    let title = 'Saved Link';
    let description = null;
    let image_url = null;

    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SmartBookmarksBot/1.0)' }
      });
      
      const html = await res.text();
      const $ = cheerio.load(html);

      title = $('meta[property="og:title"]').attr('content') || $('title').text() || url;
      description = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || null;
      image_url = $('meta[property="og:image"]').attr('content') || null;
    } catch (scrapeError) {
      console.warn('Scraping failed, fallback to raw URL:', scrapeError);
    }

    // 3. Auto-Categorize & Tag
    const aiData = await generateTagsAndCategory(title, description || '');

    // 4. Insert into database
    const { error: insertError } = await supabase
      .from('bookmarks')
      .insert([{
        user_id: user.id,
        url,
        title: title.trim(),
        description: description?.trim(),
        image_url,
        category: aiData.category,
        tags: aiData.tags,
        type: aiData.type,
      }]);

    if (insertError) throw insertError;

    return NextResponse.json({ success: true, message: 'Saved to hub!' });
    
  } catch (error) {
    console.error('Save API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}