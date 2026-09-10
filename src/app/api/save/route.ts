import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import * as cheerio from 'cheerio';

// Helper to attach CORS headers
function corsHeaders(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  };
}

// Handle preflight OPTIONS request
export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin');
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}

async function generateTagsAndCategory(title: string, description: string) {
  return {
    category: 'Inbox',
    tags: ['auto-saved', 'web-clip'],
    type: 'link',
  };
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin');

  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    // 1. Authenticate the session via cookies
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in at localhost:3000 first.' },
        { status: 401, headers: corsHeaders(origin) }
      );
    }

    // 2. Fast HTML Scraping
    let title = 'Saved Link';
    let description: string | null = null;
    let image_url: string | null = null;

    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SmartBookmarksBot/1.0)' },
      });
      const html = await res.text();
      const $ = cheerio.load(html);

      title = $('meta[property="og:title"]').attr('content') || $('title').text() || url;
      description = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || null;
      image_url = $('meta[property="og:image"]').attr('content') || null;
    } catch (scrapeError) {
      console.warn('Scraping fallback triggered:', scrapeError);
    }

    // 3. Auto-Categorize & Tag
    const aiData = await generateTagsAndCategory(title, description || '');

    // 4. Save to Supabase
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

    return NextResponse.json(
      { success: true, message: 'Saved to your hub!' },
      { status: 200, headers: corsHeaders(origin) }
    );
  } catch (error) {
    console.error('Save API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500, headers: corsHeaders(origin) }
    );
  }
}