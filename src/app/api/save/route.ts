import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import * as cheerio from 'cheerio';

function corsHeaders(origin: string | null) {
  const allowedOrigin = origin || 'https://smart-bookmark-app-lime.vercel.app';
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  };
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin');
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}

function normalizeUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';
  try {
    const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const parsed = new URL(withProto);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
    const path = parsed.pathname.replace(/\/+$/, '') || '/';
    return `${parsed.protocol}//${host}${path}${parsed.search}`;
  } catch {
    return trimmed.toLowerCase().replace(/\/+$/, '');
  }
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin');

  try {
    const body = await request.json();
    const { 
      url: rawUrl, 
      title: customTitle,
      description: customDesc, 
      content: customContent,
      image_url: customImg, 
      type: customType,
      category,
      sub_category
    } = body;

    if (!rawUrl && !customContent) {
      return NextResponse.json(
        { error: 'URL or content is required' },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders(origin) }
      );
    }

    const itemType = customType || 'link';
    const isLink = itemType === 'link';
    const cleanUrl = rawUrl ? normalizeUrl(rawUrl) : null;

    if (cleanUrl && isLink) {
      const { data: existing } = await supabase
        .from('bookmarks')
        .select('id, title, url')
        .eq('user_id', user.id)
        .eq('url', cleanUrl)
        .maybeSingle();

      if (existing) {
        return NextResponse.json(
          { error: 'Duplicate entry', message: 'Already saved' },
          { status: 409, headers: corsHeaders(origin) }
        );
      }
    }

    let finalTitle = customTitle || 'Saved Item';
    let finalDescription = customDesc || null;
    let finalImage = customImg || null;

    // ONLY scrape if it is an actual web link
    if (cleanUrl && isLink) {
      try {
        const response = await fetch(cleanUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          signal: AbortSignal.timeout(4000),
        });

        if (response.ok) {
          const html = await response.text();
          const $ = cheerio.load(html);
          finalTitle = $('meta[property="og:title"]').attr('content') || $('title').text().trim() || cleanUrl;
          finalDescription = customDesc || $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || null;
          finalImage = customImg || $('meta[property="og:image"]').attr('content') || null;
        }
      } catch (e) {
        finalTitle = cleanUrl;
      }
    }

    if (itemType === 'note') {
      finalTitle = 'Text Snippet';
    } else if (itemType === 'image') {
      finalTitle = finalTitle !== 'Saved Item' ? finalTitle : 'Saved Image';
    }

    const { data: newBookmark, error: insertError } = await supabase
      .from('bookmarks')
      .insert([{
        user_id: user.id,
        url: cleanUrl || `${process.env.NEXT_PUBLIC_SITE_URL || ''}/note-${Date.now()}`,
        title: finalTitle,
        description: finalDescription,
        content: customContent || null,
        image_url: finalImage,
        category: category || 'Inbox',
        sub_category: sub_category || null,
        tags: ['auto-saved', itemType],
        type: itemType,
      }])
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json({ error: 'Duplicate entry' }, { status: 409, headers: corsHeaders(origin) });
      }
      throw insertError;
    }

    return NextResponse.json({ success: true, data: newBookmark }, { status: 200, headers: corsHeaders(origin) });
  } catch (error: any) {
    return NextResponse.json({ error: 'Server Error' }, { status: 500, headers: corsHeaders(origin) });
  }
}