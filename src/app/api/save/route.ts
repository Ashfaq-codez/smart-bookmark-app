import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import crypto from 'crypto';
import { isSafeUrl, safeFetch } from '@/utils/safeFetch';

const ALLOWED_ORIGINS = new Set([
  'https://smart-bookmark-app-lime.vercel.app',
  'http://localhost:3000',
  `chrome-extension://${process.env.CHROME_EXTENSION_ID || 'YOUR_EXTENSION_ID_HERE'}`
]);

function corsHeaders(origin: string | null) {
  const isAllowed = origin && ALLOWED_ORIGINS.has(origin);
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : 'https://smart-bookmark-app-lime.vercel.app',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key, x-shortcut-token',
    'Access-Control-Allow-Credentials': 'true',
  };
}

// BULLETPROOF NODE.JS HASHING
function sha256(message: string) {
  return crypto.createHash('sha256').update(message).digest('hex');
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin');
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}

function normalizeUrl(rawUrl: string, type: string = 'link'): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';
  try {
    const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const parsed = new URL(withProto);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
    const path = parsed.pathname.replace(/\/+$/, '') || '/';
    let search = parsed.search;

    if (host === 'youtube.com' && path === '/watch') {
      const videoId = parsed.searchParams.get('v');
      if (videoId) search = `?v=${videoId}`;
    } else if (host === 'youtu.be') {
      const videoId = path.substring(1);
      if (videoId) return `${parsed.protocol}//youtube.com/watch?v=${videoId}`;
    }

    const hash = type === 'note' ? parsed.hash : '';
    return `${parsed.protocol}//${host}${path}${search}${hash}`;
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

    const itemType = customType || 'link';
    const isLink = itemType === 'link';
    const finalContent = customContent || (itemType === 'note' ? customDesc : null); 

    if (!rawUrl && !finalContent) {
      return NextResponse.json(
        { error: 'URL or content is required' },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    let supabase = await createClient();
    const apiKey = request.headers.get('x-api-key') || request.headers.get('x-shortcut-token');
    let userId = null;

    if (apiKey) {
      const adminSupabase = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // Hash the incoming key to compare it against the database
      const hashedApiKey = sha256(apiKey);

      const { data: keyData, error: keyError } = await adminSupabase
        .from('api_keys')
        .select('user_id')
        .eq('token', hashedApiKey)
        .single();

      if (keyError || !keyData) {
        return NextResponse.json({ error: 'Invalid API Key' }, { status: 401, headers: corsHeaders(origin) });
      }
      
      userId = keyData.user_id;
      supabase = adminSupabase;
    } else {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders(origin) });
      }
      userId = user.id;
    }

    const cleanUrl = rawUrl ? normalizeUrl(rawUrl, itemType) : null;
    
    let detectedType = itemType;
    if (cleanUrl && isLink) {
      try {
        const parsedUrl = new URL(cleanUrl);
        const host = parsedUrl.hostname.toLowerCase();
        if (host.includes('twitter.com') || host.includes('x.com')) detectedType = 'twitter';
        else if (host.includes('instagram.com')) detectedType = 'instagram';
        else if (host.includes('youtube.com') || host.includes('youtu.be')) detectedType = 'youtube';
        else if (host.includes('github.com')) detectedType = 'github';
        else if (host.includes('linkedin.com')) detectedType = 'linkedin';
      } catch (e) {}
    }

    if (cleanUrl) {
      let existingRecord = null;

      if (isLink) {
        const rawFlexiblePath = cleanUrl.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '').split('#')[0];

        // Safe candidate URLs matching without PostgREST syntax injection risk
        const candidates = Array.from(new Set([
          cleanUrl,
          cleanUrl.endsWith('/') ? cleanUrl.slice(0, -1) : `${cleanUrl}/`,
          `https://${rawFlexiblePath}`,
          `https://${rawFlexiblePath}/`,
          `http://${rawFlexiblePath}`,
          `http://${rawFlexiblePath}/`,
          `https://www.${rawFlexiblePath}`,
          `https://www.${rawFlexiblePath}/`,
          `http://www.${rawFlexiblePath}`,
          `http://www.${rawFlexiblePath}/`,
        ]));

        const { data: exactMatch } = await supabase
          .from('bookmarks')
          .select('id, title, url')
          .eq('user_id', userId)
          .in('type', ['link', 'twitter', 'instagram', 'youtube', 'github', 'linkedin'])
          .in('url', candidates)
          .limit(1)
          .maybeSingle();

        existingRecord = exactMatch;

        // Fallback for URLs stored with fragment hashes (#...)
        // Strictly sanitize path to prevent PostgREST syntax manipulation
        if (!existingRecord && !/[,()"\\]/.test(rawFlexiblePath)) {
          const safePath = rawFlexiblePath.replace(/[%_]/g, '\\$&');
          const { data: fragmentMatch } = await supabase
            .from('bookmarks')
            .select('id, title, url')
            .eq('user_id', userId)
            .in('type', ['link', 'twitter', 'instagram', 'youtube', 'github', 'linkedin'])
            .or(`url.ilike.%://${safePath}#%,url.ilike.%://${safePath}/#%`)
            .limit(1)
            .maybeSingle();
          existingRecord = fragmentMatch;
        }
      } else if (itemType === 'note' && finalContent) {
        const { data } = await supabase
          .from('bookmarks')
          .select('id, title, url')
          .eq('user_id', userId)
          .eq('type', 'note')
          .eq('content', finalContent)
          .limit(1)
          .maybeSingle();
        existingRecord = data;
      } else {
        const { data } = await supabase
          .from('bookmarks')
          .select('id, title, url')
          .eq('user_id', userId)
          .eq('type', itemType)
          .eq('url', cleanUrl)
          .limit(1)
          .maybeSingle();
        existingRecord = data;
      }

      if (existingRecord) {
        return NextResponse.json({ error: 'Duplicate entry', message: 'Already saved', existing: existingRecord }, { status: 409, headers: corsHeaders(origin) });
      }
    }

    let finalTitle = customTitle;
    let finalDescription = itemType === 'note' ? null : (customDesc || null);
    let finalImage = customImg || null;

    if (cleanUrl && isLink) {
      try {
        const isSafe = await isSafeUrl(cleanUrl);
        if (isSafe) {
          if (detectedType === 'twitter') {
            const vxUrl = cleanUrl.replace('twitter.com', 'api.vxtwitter.com').replace('x.com', 'api.vxtwitter.com');
            const response = await safeFetch(vxUrl, { signal: AbortSignal.timeout(5000) });
            
            if (response.ok) {
              const data = await response.json();
              
              let finalDesc = data.text || '';
              if (data.qrtURL && !finalDesc.includes(data.qrtURL)) {
                 finalDesc += `\n\n${data.qrtURL}`;
              }
              
              let mediaUrl = null;
              if (data.media_extended && data.media_extended.length > 0) {
                 mediaUrl = data.media_extended[0].url; 
              }

              finalTitle = customTitle || `Post by ${data.user_name} (@${data.user_screen_name}) on X`;
              finalDescription = customDesc || finalDesc || null;
              finalImage = customImg || mediaUrl || null;
            } else {
              finalTitle = customTitle || cleanUrl;
            }
          } 
          else {
            const response = await safeFetch(cleanUrl, {
              headers: { 'User-Agent': 'Mozilla/5.0' },
              signal: AbortSignal.timeout(3000)
            });
            if (response.ok) {
              const html = await response.text();
              const $ = cheerio.load(html.substring(0, 512 * 1024));
              const scrapedTitle = $('meta[property="og:title"]').attr('content') || $('title').text().trim();
              finalTitle = customTitle || scrapedTitle || cleanUrl; 
              finalDescription = finalDescription || $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || null;
              let scrapedImg = $('meta[property="og:image"]').attr('content');
              if (scrapedImg) {
                try {
                  scrapedImg = new URL(scrapedImg, cleanUrl).href;
                  if (scrapedImg.startsWith('http://')) scrapedImg = scrapedImg.replace('http://', 'https://');
                  finalImage = finalImage || scrapedImg;
                } catch (e) {}
              }
            }
          }
        }
      } catch (e) {
        finalTitle = customTitle || cleanUrl;
      }
    }

    if (itemType === 'note') {
      finalTitle = finalTitle || ''; 
    } else if (itemType === 'image') {
      finalTitle = finalTitle || 'Saved Image';
    } else {
      finalTitle = finalTitle || 'Saved Item';
    }

    const { data: newBookmark, error: insertError } = await supabase
      .from('bookmarks')
      .insert([{
        user_id: userId,
        url: cleanUrl || `https://smart-bookmark.internal/note-${Date.now()}`,
        title: finalTitle,
        description: finalDescription,
        content: finalContent,
        image_url: finalImage,
        category: category || 'Inbox',
        sub_category: sub_category || null,
        tags: ['auto-saved', detectedType],
        type: detectedType, 
      }])
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505') return NextResponse.json({ error: 'Duplicate entry' }, { status: 409, headers: corsHeaders(origin) });
      throw insertError;
    }

    return NextResponse.json({ success: true, data: newBookmark }, { status: 200, headers: corsHeaders(origin) });
  } catch (error: any) {
    return NextResponse.json({ error: 'Server Error' }, { status: 500, headers: corsHeaders(origin) });
  }
}