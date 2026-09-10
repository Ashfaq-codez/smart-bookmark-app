import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import * as cheerio from 'cheerio';

// Helper function to dynamically reflect the request origin for CORS with credentials
function corsHeaders(origin: string | null) {
  const allowedOrigin = origin || 'https://smart-bookmark-app-lime.vercel.app';

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  };
}

// Handle preflight OPTIONS requests sent by the browser before POST
export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin');
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}

// Placeholder for future LLM auto-categorization and tagging
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
      url, 
      description: customDesc, 
      image_url: customImg, 
      type: customType 
    } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    // 1. Authenticate user session via Supabase cookies
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

    // 2. Metadata Scraping with Cheerio (used as fallback or primary info)
    let scrapedTitle = 'Saved Item';
    let scrapedDescription: string | null = null;
    let scrapedImage: string | null = null;

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SmartBookmarksBot/1.0)',
        },
      });

      if (response.ok) {
        const html = await response.text();
        const $ = cheerio.load(html);

        scrapedTitle =
          $('meta[property="og:title"]').attr('content') ||
          $('title').text().trim() ||
          url;

        scrapedDescription =
          $('meta[name="description"]').attr('content') ||
          $('meta[property="og:description"]').attr('content') ||
          null;

        scrapedImage =
          $('meta[property="og:image"]').attr('content') ||
          null;
      }
    } catch (scrapeError) {
      console.warn('Metadata scraping encountered an issue, falling back:', scrapeError);
    }

    // 3. Resolve final values (custom selections take precedence over scraped page tags)
    const itemType = customType || 'link';
    const finalDescription = customDesc ? customDesc.trim() : (scrapedDescription ? scrapedDescription.trim() : null);
    const finalImage = customImg || scrapedImage;
    
    let finalTitle = scrapedTitle;
    if (itemType === 'note' && customDesc) {
      finalTitle = customDesc.slice(0, 50) + (customDesc.length > 50 ? '...' : '');
    } else if (itemType === 'image') {
      finalTitle = scrapedTitle !== 'Saved Item' ? scrapedTitle : 'Saved Image';
    }

    // 4. Generate categorization and tags
    const aiData = await generateTagsAndCategory(finalTitle, finalDescription || '', itemType);

    // 5. Insert record into Supabase
    const { data: newBookmark, error: insertError } = await supabase
      .from('bookmarks')
      .insert([
        {
          user_id: user.id,
          url,
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
  } catch (error) {
    console.error('Save API Handler Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500, headers: corsHeaders(origin) }
    );
  }
}