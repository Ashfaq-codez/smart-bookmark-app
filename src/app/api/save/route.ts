import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import * as cheerio from 'cheerio';

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

function isPrivateIP(hostname: string): boolean {
  return /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|169\.254\.)/.test(hostname);
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

    const supabase = await createClient();
    
    // --- MULTI-TENANT AUTHENTICATION ROUTING ---
    const apiKey = request.headers.get('x-api-key') || request.headers.get('x-shortcut-token');
    let userId = null;

    if (apiKey) {
      // 1. Authenticate via SaaS API Key (iOS Shortcut / External Integrations)
      const { data: keyData, error: keyError } = await supabase
        .from('api_keys')
        .select('user_id')
        .eq('token', apiKey)
        .single();

      if (keyError || !keyData) {
        return NextResponse.json({ error: 'Invalid or revoked API Key' }, { status: 401, headers: corsHeaders(origin) });
      }
      userId = keyData.user_id;
    } else {
      // 2. Authenticate via Web Browser Session
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders(origin) });
      }
      userId = user.id;
    }

    const cleanUrl = rawUrl ? normalizeUrl(rawUrl, itemType) : null;

    if (cleanUrl) {
      let existingRecord = null;

      if (isLink) {
        const flexiblePath = cleanUrl
          .replace(/^https?:\/\/(www\.)?/, '')
          .replace(/\/$/, '')
          .split('#')[0];

        const { data } = await supabase
          .from('bookmarks')
          .select('id, title, url')
          .eq('user_id', userId)
          .eq('type', 'link')
          .or(`url.ilike.%${flexiblePath},url.ilike.%${flexiblePath}/,url.ilike.%${flexiblePath}#%,url.ilike.%${flexiblePath}/#%`)
          .limit(1)
          .maybeSingle();

        existingRecord = data;
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
        return NextResponse.json(
          { error: 'Duplicate entry', message: 'Already saved', existing: existingRecord }, 
          { status: 409, headers: corsHeaders(origin) }
        );
      }
    }

    let finalTitle = customTitle;
    let finalDescription = itemType === 'note' ? null : (customDesc || null);
    let finalImage = customImg || null;

    if (cleanUrl && isLink) {
      try {
        const parsedUrl = new URL(cleanUrl);
        if ((parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') && !isPrivateIP(parsedUrl.hostname)) {
          const response = await fetch(cleanUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            signal: AbortSignal.timeout(3000), 
          });

          if (response.ok) {
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let html = '';
            let bytesReceived = 0;
            const MAX_BYTES = 512 * 1024;

            if (reader) {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                if (value) {
                  bytesReceived += value.length;
                  html += decoder.decode(value, { stream: true });
                  if (bytesReceived > MAX_BYTES) break;
                }
              }
            } else {
              html = await response.text();
              if (html.length > MAX_BYTES) html = html.substring(0, MAX_BYTES);
            }

            const $ = cheerio.load(html);
            const scrapedTitle = $('meta[property="og:title"]').attr('content') || $('title').text().trim();
            finalTitle = customTitle || scrapedTitle || cleanUrl; 
            finalDescription = finalDescription || $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || null;
            
            let scrapedImg = $('meta[property="og:image"]').attr('content');
            if (scrapedImg) {
              try {
                scrapedImg = new URL(scrapedImg, cleanUrl).href;
                if (scrapedImg.startsWith('http://')) {
                  scrapedImg = scrapedImg.replace('http://', 'https://');
                }
                finalImage = finalImage || scrapedImg;
              } catch (e) {}
            }
          }
        }
      } catch (e) {
        finalTitle = customTitle || cleanUrl;
      }
    }

    if (itemType === 'note') {
      finalTitle = finalTitle || 'Text Snippet';
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