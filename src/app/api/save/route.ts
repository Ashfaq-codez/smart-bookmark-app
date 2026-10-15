import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { normalizeUrl, detectSiteType, canonicalizeXUrl, isSocialType, cleanTitle, isRedditShareLink } from '@/lib/urlTools';
import { resolveRedditShareLink } from '@/lib/redditMeta';
import { fetchPageDetails } from '@/lib/pageDetails';
import { enrichSocialPost, isInstagramPostUrl } from '@/lib/enrichSocialPost';
import { parsePageCapture } from '@/lib/pageCapture';
import { articleFromMeta } from '@/lib/articleMeta';
import { isSubstackNoteUrl } from '@/lib/postData';
import { hackerNewsItemId, spotifyRef, threadsPostRef, isLinkedInPostUrl } from '@/lib/urlTools';

const isMoreSocialPost = (u: string) => !!(hackerNewsItemId(u) || spotifyRef(u) || threadsPostRef(u) || isLinkedInPostUrl(u));
import { runAfterResponse } from '@/lib/runAfterResponse';
import { sanitizeNoteHtml, MAX_NOTE_CHARS } from '@/lib/sanitizeNoteHtml';
import { htmlToPlainText } from '@/lib/htmlToPlainText';
import { isOverSaveLimit } from '@/lib/saveLimit';
import { parseInstagramCapture, instagramTitle, storeInstagramImage } from '@/lib/instagramCapture';

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
      sub_category,
      capture: rawCapture,
      page: rawPage
    } = body;

    // A social type from the client is not trusted: it is a plain link, and the real type comes from the address below.
    let itemType: string = isSocialType(customType) ? 'link' : (customType || 'link');
    let isLink = itemType === 'link';

    const rawContent = customContent || (itemType === 'note' ? customDesc : null);
    if (rawContent != null && typeof rawContent !== 'string') {
      return NextResponse.json({ error: 'Content must be text' }, { status: 400, headers: corsHeaders(origin) });
    }
    if (rawContent && rawContent.length > MAX_NOTE_CHARS) {
      return NextResponse.json({ error: 'Note is too long' }, { status: 413, headers: corsHeaders(origin) });
    }
    // Only allow-listed HTML is ever stored (no scripts, event handlers, images or unsafe links).
    let finalContent = rawContent ? (sanitizeNoteHtml(rawContent) || null) : null;

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

    // Save limit per person (shared with file uploads).
    if (await isOverSaveLimit(supabase, userId)) {
      return NextResponse.json(
        { error: 'Too many saves. Please wait a minute and try again.' },
        { status: 429, headers: { ...corsHeaders(origin), 'Retry-After': '60' } }
      );
    }

    // A selection sent together with a social address is the person's own note on the post, never the post's content.
    // The save becomes a normal link, so the post is still read and filled in afterwards.
    // Reddit app share links (reddit.com/r/<sub>/s/<code>, redd.it/<id>) only point to the post: save the post itself.
    let inputUrl: unknown = rawUrl;
    if (typeof rawUrl === 'string' && isRedditShareLink(rawUrl)) inputUrl = (await resolveRedditShareLink(rawUrl)) || rawUrl;

    if (typeof inputUrl === 'string' && inputUrl && finalContent && (itemType === 'note' || isLink) && isSocialType(detectSiteType(inputUrl))) {
      itemType = 'link';
      isLink = true;
      finalContent = htmlToPlainText(finalContent) || null;
    }

    const cleanUrl = typeof inputUrl === 'string' && inputUrl ? normalizeUrl(inputUrl, itemType) : null;
    
    const detectedType: string = (cleanUrl && isLink && detectSiteType(cleanUrl)) || itemType;
    // The extension sends what an Instagram post page shows; accepted only for an Instagram post address.
    const capture = isLink && detectedType === 'instagram' ? parseInstagramCapture(rawCapture, cleanUrl) : null;

    // Notes are checked by their text even when they arrive without an address.
    if (cleanUrl || (itemType === 'note' && finalContent)) {
      let existingRecord = null;

      if (isLink && cleanUrl) {
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

        // X posts: older saves may carry ?s=20 or live on twitter.com. Match them by handle-less post id.
        const xPost = detectedType === 'twitter' ? canonicalizeXUrl(cleanUrl) : null;
        if (!existingRecord && xPost) {
          const id = xPost.split('/status/')[1];
          const { data: xMatch } = await supabase
            .from('bookmarks')
            .select('id, title, url')
            .eq('user_id', userId)
            .eq('type', 'twitter')
            .or(['x.com', 'twitter.com', 'www.twitter.com', 'mobile.twitter.com'].map(h => `url.ilike.%://${h}/%/status/${id}`).concat(
              ['x.com', 'twitter.com', 'www.twitter.com', 'mobile.twitter.com'].map(h => `url.ilike.%://${h}/%/status/${id}?%`)).join(','))
            .limit(1)
            .maybeSingle();
          existingRecord = xMatch;
        }

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
          // content_fp is a short fingerprint the database keeps up to date from the stored text (never written here)
          .eq('content_fp', sha256(finalContent).slice(0, 16))
          .limit(1)
          .maybeSingle();
        existingRecord = data;
      } else if (cleanUrl) {
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
    // Social posts always get their title from the post itself; other titles lose browser-tab noise.
    const givenTitle = capture ? instagramTitle(capture) : isSocialType(detectedType) ? '' : cleanTitle(customTitle);
    let finalTitle = givenTitle;
    const finalDescription = itemType === 'note' ? null : (capture?.caption || customDesc || null);
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
        // 'video' marks an Instagram video post, so the cards can offer "Watch on Instagram".
        tags: ['auto-saved', detectedType, ...(capture?.is_video ? ['video'] : [])],
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
        // X posts: a full snapshot of the post (author, text, media, quoted post, link card, counts).
        if (detectedType === 'twitter') {
          await enrichSocialPost(db, userId, { id: savedId, url: cleanUrl, type: 'twitter' }, 'save', { description: !!customDesc, image: !!customImg });
          return;
        }
        // Instagram posts: page details plus who posted it (stored as an Instagram snapshot).
        if (detectedType === 'instagram' && isInstagramPostUrl(cleanUrl)) {
          // Instagram picture addresses expire: keep our own copy of what the extension saw (video posts: the poster only).
          let storedImage = false;
          if (capture?.image_url && !customImg) {
            const stored = await storeInstagramImage(db, userId, capture.image_url);
            if (stored) {
              const { error } = await db.from('bookmarks')
                .update({ image_url: stored.publicUrl, file_path: stored.path })
                .eq('id', savedId).eq('user_id', userId);
              if (error) {
                console.error('[after-save] instagram update failed:', error.message);
                await db.storage.from('attachments').remove([stored.path]);
              } else {
                storedImage = true;
              }
            }
          }
          await enrichSocialPost(db, userId, { id: savedId, url: cleanUrl, type: 'instagram' }, 'save',
            { title: !!givenTitle, description: !!finalDescription, image: !!customImg || storedImage },
            capture ? { handle: capture.handle, caption: capture.caption, is_video: capture.is_video } : {});
          return;
        }
        // Reddit posts: read from Reddit's official embed page (title, subreddit, author, text, picture).
        // Reddit's normal page only gives servers a "blocked" page, so nothing else is read.
        if (detectedType === 'reddit') {
          await enrichSocialPost(db, userId, { id: savedId, url: cleanUrl, type: 'reddit' }, 'save', { title: !!givenTitle, description: !!customDesc, image: !!customImg });
          return;
        }
        // Hacker News, Spotify, Threads and LinkedIn posts: each from its own free public source.
        if (['hackernews', 'spotify', 'threads', 'linkedin'].includes(detectedType) && isMoreSocialPost(cleanUrl)) {
          await enrichSocialPost(db, userId, { id: savedId, url: cleanUrl, type: detectedType }, 'save', { title: !!givenTitle, description: !!customDesc, image: !!customImg });
          return;
        }
        // Substack Notes (short posts): the note itself, its author and pictures (not an article card).
        if (detectedType === 'link' && isSubstackNoteUrl(cleanUrl)) {
          await enrichSocialPost(db, userId, { id: savedId, url: cleanUrl, type: 'link' }, 'save', { title: !!givenTitle, description: !!customDesc, image: !!customImg });
          return;
        }
        // YouTube videos: the real title and channel from YouTube's free oEmbed. The page is still read for
        // the description when that works; its title is only used if oEmbed had none.
        let youTubeTitle = false;
        if (detectedType === 'youtube') {
          youTubeTitle = (await enrichSocialPost(db, userId, { id: savedId, url: cleanUrl, type: 'youtube' }, 'save', { title: !!givenTitle })) === 'stored';
        }
        const details = await fetchPageDetails(cleanUrl, detectedType);
        // Pages that refuse servers (Medium): use what the extension read from the open page instead.
        const page = !details.title && detectedType === 'link' ? parsePageCapture(rawPage) : null;
        const title = details.title || cleanTitle(page?.title) || null;
        const description = details.description || page?.description || null;
        const image = details.image || page?.image || null;
        const article = details.article || (page ? articleFromMeta(cleanUrl, page) : null);
        // Only fill in what the person did not give us themselves.
        const patch: Record<string, unknown> = {};
        if (!givenTitle && !youTubeTitle && title && !/^(\(\d+\)\s*)?YouTube$/i.test(title)) patch.title = title;
        if (!customDesc && description) patch.description = description;
        if (!customImg && image) patch.image_url = image;
        if (article && detectedType === 'link') {
          patch.post_data = article;
          patch.post_data_fetched_at = new Date().toISOString();
        }
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