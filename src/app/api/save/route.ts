import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { fetchPageDetails } from '@/lib/pageDetails';
import { runAfterResponse } from '@/lib/runAfterResponse';
import { sanitizeNoteHtml, MAX_NOTE_CHARS } from '@/lib/sanitizeNoteHtml';

// Most saves one person may make per minute through this route. Counted from the bookmarks table itself,
// so it needs no extra service. (Notes and links typed in the dashboard also go through here.)
const MAX_SAVES_PER_MINUTE = 60;

// The page details are read after the answer is sent; give that background work room to finish.
export const maxDuration = 30;

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

    const rawContent = customContent || (itemType === 'note' ? customDesc : null);
    if (rawContent != null && typeof rawContent !== 'string') {
      return NextResponse.json({ error: 'Content must be text' }, { status: 400, headers: corsHeaders(origin) });
    }
    if (rawContent && rawContent.length > MAX_NOTE_CHARS) {
      return NextResponse.json({ error: 'Note is too long' }, { status: 413, headers: corsHeaders(origin) });
    }
    // Only allow-listed HTML is ever stored (no scripts, event handlers, images or unsafe links).
    const finalContent = rawContent ? (sanitizeNoteHtml(rawContent) || null) : null;

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

    // Save limit per person. If the count itself fails we let the save through rather than block a real user.
    const { count: recentSaves, error: countError } = await supabase
      .from('bookmarks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 60_000).toISOString());
    if (!countError && (recentSaves ?? 0) >= MAX_SAVES_PER_MINUTE) {
      return NextResponse.json(
        { error: 'Too many saves. Please wait a minute and try again.' },
        { status: 429, headers: { ...corsHeaders(origin), 'Retry-After': '60' } }
      );
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
        else if (host.includes('pinterest.com') || host.includes('pin.it')) detectedType = 'pinterest';
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
          .in('type', ['link', 'twitter', 'instagram', 'youtube', 'pinterest', 'github', 'linkedin'])
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
            .in('type', ['link', 'twitter', 'instagram', 'youtube', 'pinterest', 'github', 'linkedin'])
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

    // Save first, read the page afterwards: the person (or the extension) gets "saved" straight away,
    // and the title / description / cover image are filled in a moment later (they appear live in the dashboard).
    let finalTitle = customTitle;
    const finalDescription = itemType === 'note' ? null : (customDesc || null);
    const finalImage = customImg || null;

    if (itemType === 'note') {
      finalTitle = finalTitle || '';
    } else if (itemType === 'image') {
      finalTitle = finalTitle || 'Saved Image';
    } else if (cleanUrl && isLink) {
      finalTitle = finalTitle || cleanUrl;   // placeholder until the real page title is found
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

    if (cleanUrl && isLink && newBookmark?.id != null) {
      const savedId = newBookmark.id;
      const db = supabase;
      runAfterResponse(async () => {
        const details = await fetchPageDetails(cleanUrl, detectedType);
        // Only fill in what the person did not give us themselves.
        const patch: Record<string, string> = {};
        if (!customTitle && details.title) patch.title = details.title;
        if (!customDesc && details.description) patch.description = details.description;
        if (!customImg && details.image) patch.image_url = details.image;
        if (Object.keys(patch).length === 0) return;
        const { error } = await db.from('bookmarks').update(patch).eq('id', savedId).eq('user_id', userId);
        if (error) console.error('[after-save] update failed:', error.message);
      });
    }

    return NextResponse.json({ success: true, data: newBookmark }, { status: 200, headers: corsHeaders(origin) });
  } catch (error: any) {
    // Shows up in Vercel -> your project -> Logs, so a failed save can be traced.
    console.error('[save] failed:', error?.code, error?.message);
    return NextResponse.json({ error: 'Server Error' }, { status: 500, headers: corsHeaders(origin) });
  }
}