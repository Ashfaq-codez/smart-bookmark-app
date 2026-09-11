// src/app/api/save/route.ts
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

async function generateTagsAndCategory(title: string, description: string, itemType: string) {
  return {
    category: 'Inbox',
    tags: ['auto-saved', itemType],
    type: itemType,
  };
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin');

  try {
    const body = await request.json();
    const { 
      url: rawUrl, 
      description: customDesc, 
      image_url: customImg, 
      type: customType 
    } = body;

    if (!rawUrl && !customDesc) {
      return NextResponse.json(
        { error: 'URL or description is required' },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to your Smart Bookmarks account first.' },
        { status: 401, headers: corsHeaders(origin) }
      );
    }

    const itemType = customType || 'link';
    const isLink = itemType === 'link';
    const cleanUrl = rawUrl ? normalizeUrl(rawUrl) : null;

    // Check for existing link duplicate before scraping/inserting
    if (cleanUrl && isLink) {
      const { data: existing } = await supabase
        .from('bookmarks')
        .select('id, title, url')
        .eq('user_id', user.id)
        .eq('url', cleanUrl)
        .maybeSingle();

      if (existing) {
        return NextResponse.json(
          {
            error: 'Duplicate entry',
            message: `"${existing.title || cleanUrl}" is already saved in your hub.`,
          },
          { status: 409, headers: corsHeaders(origin) }
        );
      }
    }

    let scrapedTitle = 'Saved Item';
    let scrapedDescription: string | null = null;
    let scrapedImage: string | null = null;

    if (cleanUrl && isLink) {
      try {
        const response = await fetch(cleanUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; SmartBookmarksBot/1.0)',
          },
          signal: AbortSignal.timeout(4000),
        });

        if (response.ok) {
          const html = await response.text();
          const $ = cheerio.load(html);

          scrapedTitle =
            $('meta[property="og:title"]').attr('content') ||
            $('title').text().trim() ||
            cleanUrl;

          scrapedDescription =
            $('meta[name="description"]').attr('content') ||
            $('meta[property="og:description"]').attr('content') ||
            null;

          scrapedImage =
            $('meta[property="og:image"]').attr('content') ||
            null;
        }
      } catch (scrapeError) {
        console.warn('Metadata scraping fallback:', scrapeError);
        scrapedTitle = cleanUrl;
      }
    }

    const finalDescription = customDesc ? customDesc.trim() : (scrapedDescription ? scrapedDescription.trim() : null);
    const finalImage = customImg || scrapedImage;
    
    let finalTitle = scrapedTitle;
    if (itemType === 'note' && customDesc) {
      finalTitle = customDesc.slice(0, 50) + (customDesc.length > 50 ? '...' : '');
    } else if (itemType === 'image') {
      finalTitle = scrapedTitle !== 'Saved Item' ? scrapedTitle : 'Saved Image';
    }

    const aiData = await generateTagsAndCategory(finalTitle, finalDescription || '', itemType);

    const { data: newBookmark, error: insertError } = await supabase
      .from('bookmarks')
      .insert([
        {
          user_id: user.id,
          url: cleanUrl || `${process.env.NEXT_PUBLIC_SITE_URL || ''}/note-${Date.now()}`,
          title: finalTitle,
          description: finalDescription,
          image_url: finalImage,
          category: aiData.category,
          tags: aiData.tags,
          type: itemType,
        },
      ])
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'Duplicate entry', message: 'This bookmark already exists.' },
          { status: 409, headers: corsHeaders(origin) }
        );
      }
      throw insertError;
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Saved to hub successfully!',
        data: newBookmark,
      },
      {
        status: 200,
        headers: corsHeaders(origin),
      }
    );
  } catch (error: any) {
    console.error('Save API Handler Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500, headers: corsHeaders(origin) }
    );
  }
}