# PROJECT SOURCES: inntoit (Smart Bookmark App)

This document contains the complete, unmodified source code of key architectural files in the `smart-bookmark-app` repository.

---

## Table of Contents
1. [`src/app/layout.tsx`](#srcapplayouttsx)
2. [`src/app/dashboard/page.tsx`](#srcappdashboardpagetsx)
3. [`src/middleware.ts`](#srcmiddlewarets)
4. [`src/app/api/save/route.ts`](#srcappapisaveroutets)
5. [`src/app/api/check-frame/route.ts`](#srcappapicheck-frameroutets)
6. [`src/app/auth/callback/route.ts`](#srcappauthcallbackroutets)
7. [`src/app/auth/signout/route.ts`](#srcappauthsignoutroutets)
8. [`src/types/index.ts`](#srctypesindexts)
9. [`src/hooks/useBookmarks.ts`](#srchooksusebookmarksts)
10. [`src/utils/bookmarkHelpers.tsx`](#srcutilsbookmarkhelperstsx)
11. [`src/utils/safeFetch.ts`](#srcutilssafefetchts)
12. [`src/utils/normalizeUrl.ts`](#srcutilsnormalizeurlts)
13. [`src/utils/supabase/client.ts`](#srcutilssupabaseclientts)
14. [`src/utils/supabase/server.ts`](#srcutilssupabaseserverts)
15. [`postcss.config.mjs`](#postcssconfigmjs) *(Tailwind CSS v4 Configuration)*
16. [`src/app/globals.css`](#srcappglobalscss)
17. [`package.json`](#packagejson)

---

## `src/app/layout.tsx`

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
// @ts-ignore: side-effect import for global CSS
import "@/app/globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = { 
  title: "Smart Bookmark App", 
  description: "A smart bookmark application for organizing and managing your bookmarks",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { 
  return ( 
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <script
          dangerouslySetInnerHTML={{
            __html: `if ('serviceWorker' in navigator) { navigator.serviceWorker.register('/sw.js') }`,
          }}
        />
        <Toaster 
          position="bottom-right"
          toastOptions={{
            style: {
              border: '4px solid #111827',
              borderRadius: '1rem',
              background: '#ffffff',
              color: '#111827',
              fontWeight: '900',
              boxShadow: '6px 6px 0px 0px rgba(17,24,39,1)',
            },
            error: {
              style: {
                background: '#fca5a5',
                color: '#7f1d1d',
              },
              iconTheme: {
                primary: '#7f1d1d',
                secondary: '#fca5a5',
              },
            },
            success: {
              style: {
                background: '#86efac',
                color: '#14532d',
              },
              iconTheme: {
                primary: '#14532d',
                secondary: '#86efac',
              },
            },
          }}
        />
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

---

## `src/app/dashboard/page.tsx`

```tsx
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import BookmarkList from '@/components/BookmarkList'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: bookmarks } = await supabase
    .from('bookmarks')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    // We removed the hardcoded background classes so the ThemeContext in layout.tsx is visible
    <div className="min-h-screen font-sans flex flex-col transition-colors">
      <BookmarkList 
        initialBookmarks={bookmarks || []} 
        userEmail={user.email} 
      />
    </div>
  )
}
```

---

## `src/middleware.ts`

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  await supabase.auth.getUser()
  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

---

## `src/app/api/save/route.ts`

```typescript
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
              
              if (detectedType === 'instagram') {
                const igDesc = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content');
                if (igDesc) {
                  finalDescription = igDesc;
                }
                if (!finalDescription && finalTitle && finalTitle.includes(' on Instagram:')) {
                  const match = finalTitle.match(/ on Instagram:\s*"?([^"]+)"?/i);
                  if (match && match[1]) {
                    finalDescription = match[1].trim();
                  }
                }
              } else {
                finalDescription = finalDescription || $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || null;
              }

              let scrapedImg = $('meta[property="og:image"]').attr('content') || $('meta[name="twitter:image"]').attr('content');
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
```

---

## `src/app/api/check-frame/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { isSafeUrl, safeFetch } from '@/utils/safeFetch';

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return NextResponse.json({ error: 'URL required' }, { status: 400 });

  try {
    const isSafe = await isSafeUrl(targetUrl);
    if (!isSafe) {
      return NextResponse.json({ error: 'Access to internal or restricted network denied' }, { status: 403 });
    }

    const response = await safeFetch(targetUrl, {
      method: 'HEAD',
      signal: AbortSignal.timeout(3000)
    });

    const xFrameOptions = response.headers.get('x-frame-options');
    const csp = response.headers.get('content-security-policy');
    
    let allowIframe = true;
    if (xFrameOptions?.toUpperCase() === 'DENY' || xFrameOptions?.toUpperCase() === 'SAMEORIGIN') {
      allowIframe = false;
    }
    if (csp?.includes('frame-ancestors')) {
      allowIframe = false;
    }

    return NextResponse.json({ allowIframe });
  } catch (error) {
    return NextResponse.json({ allowIframe: false });
  }
}
```

---

## `src/app/auth/callback/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)

  const code = searchParams.get('code')

  // After successful authentication, send the user to the main app
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()

    // Exchange the OAuth code for a Supabase session
    const { data: authData, error } =
      await supabase.auth.exchangeCodeForSession(code)

    if (!error && authData?.user) {
      // Check whether this is a brand-new user
      const { count } = await supabase
        .from('bookmarks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', authData.user.id)

      // Create a welcome bookmark only for first-time users
      if (count === 0) {
        await supabase.from('bookmarks').insert([
          {
            user_id: authData.user.id,
            url: 'https://inntoit.app/welcome',
            title: 'Welcome to inntoit',
            description:
              'Your calm space to save links, notes, ideas, images, videos and everything worth coming back to.',
            category: 'Inbox',
            type: 'note',
            tags: ['onboarding'],
          },
        ])
      }

      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'

      // Local development
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      }

      // Vercel / production
      if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      }

      // Fallback
      return NextResponse.redirect(`${origin}${next}`)
    }

    console.error('Auth Exchange Error:', error?.message)
  }

  // Authentication failed
  return NextResponse.redirect(`${origin}/?error=auth-code-error`)
}
```

---

## `src/app/auth/signout/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: Request) {
  const requestUrl = new URL(request.url)
  const supabase = await createClient()

  // Destroy the session on the server
  await supabase.auth.signOut()

  // 303 "See Other" prevents the browser from caching this redirect
  return NextResponse.redirect(`${requestUrl.origin}/`, {
    status: 303,
  })
}
```

---

## `src/types/index.ts`

```typescript
export type Bookmark = {
  id: number;
  title: string;
  url: string;
  category: string;
  sub_category?: string | null;
  created_at: string;
  user_id: string;
  description?: string | null;
  content?: string | null; 
  image_url?: string | null;
  tags?: string[];
  // Expanded types to support native social media cards
  type?: 'link' | 'note' | 'image' | 'video' | 'pdf' | 'file' | 'twitter' | 'instagram' | 'youtube' | 'pinterest' | 'github' | 'linkedin' | string;
  file_path?: string | null; 
  file_type?: string | null;
};
```

---

## `src/hooks/useBookmarks.ts`

```typescript
// src/hooks/useBookmarks.ts
import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Bookmark } from '@/types';
import { normalizeUrl } from '@/utils/normalizeUrl';
import toast from 'react-hot-toast';

export const useBookmarks = (initialBookmarks: Bookmark[]) => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks);
  
  // Memoize the client to prevent infinite WebSocket reconnects on every render
  const supabase = useMemo(() => createClient(), []);

  // ---> BACKGROUND SYNC ENGINE (Realtime + Focus Revalidation) <---
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setupRealtime = async () => {
      // 1. Fetch the authenticated user to scope the realtime channel
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 2. The Realtime Subscription (Syncs insertions, deletes, updates securely)
      channel = supabase
        .channel(`realtime_bookmarks_${user.id}`)
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'bookmarks',
            filter: `user_id=eq.${user.id}` 
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              const newItem = payload.new as Bookmark;
              setBookmarks((prev) => {
                // Deduplicate by ID
                const idExists = prev.some((b) => b.id === newItem.id);
                if (idExists) return prev;

                // Deduplicate by normalized URL if it's a link
                if (newItem.type === 'link' || !newItem.type) {
                  const targetUrl = normalizeUrl(newItem.url);
                  const urlExists = prev.some(
                    (b) => (b.type === 'link' || !b.type) && normalizeUrl(b.url) === targetUrl
                  );
                  if (urlExists) return prev;
                }

                return [newItem, ...prev];
              });
            } else if (payload.eventType === 'DELETE') {
              setBookmarks((prev) => prev.filter((b) => b.id !== payload.old.id));
            } else if (payload.eventType === 'UPDATE') {
              setBookmarks((prev) =>
                prev.map((b) => (b.id === payload.new.id ? { ...b, ...(payload.new as Bookmark) } : b))
              );
            }
          }
        )
        .subscribe();
    };

    setupRealtime();

    // FOCUS REVALIDATION: Silently fetches fresh data when coming back to a sleeping tab
    const revalidateOnFocus = async () => {
      const { data, error } = await supabase
        .from('bookmarks')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && !error) {
        setBookmarks(data);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        revalidateOnFocus();
      }
    };

    window.addEventListener('focus', revalidateOnFocus);
    window.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (channel) supabase.removeChannel(channel);
      window.removeEventListener('focus', revalidateOnFocus);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [supabase]);

  // Delete Bookmark Logic
  const deleteBookmark = async (id: number) => {
    const { error } = await supabase.from('bookmarks').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete');
      return;
    }
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
    toast.success('Bookmark removed');
  };

  // Update Bookmark Logic
  const updateBookmark = async (id: number, updates: Partial<Bookmark>) => {
    const payload = { ...updates };
    if (payload.url) {
      payload.url = normalizeUrl(payload.url);
    }

    const { error } = await supabase.from('bookmarks').update(payload).eq('id', id);
    if (error) {
      if (error.code === '23505') {
        toast.error('A bookmark with this URL already exists.');
        return;
      }
      toast.error('Failed to update');
      return;
    }
    setBookmarks((prev) => prev.map((b) => (b.id === id ? { ...b, ...payload } : b)));
  };

  return {
    bookmarks,
    deleteBookmark,
    updateBookmark,
  };
};
```

---

## `src/utils/bookmarkHelpers.tsx`

```tsx
import React from 'react'
import { Bookmark } from '@/types'

export const isVideoMedia = (url?: string | null) => {
  if (!url) return false;
  const l = url.toLowerCase();
  if (l.includes('.jpg') || l.includes('.jpeg') || l.includes('.png') || l.includes('.webp') || l.includes('format=jpg') || l.includes('format=png') || l.includes('thumb')) return false;
  return l.includes('.mp4') || l.includes('.webm') || l.includes('.mov') || l.includes('.m3u8');
};

export const isGoogleSearchUrl = (url?: string) => {
  if (!url) return false;
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    return (u.hostname === 'google.com' || u.hostname === 'www.google.com' || u.hostname.endsWith('.google.com') || u.hostname.includes('google.co.')) && (u.pathname.includes('/search') || u.searchParams.has('q'));
  } catch { return false; }
};

export const getGoogleQuery = (url?: string) => {
  if (!url) return '';
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    const q = u.searchParams.get('q');
    return q ? decodeURIComponent(q).replace(/\+/g, ' ') : '';
  } catch { return ''; }
};

export const getYouTubeId = (url: string) => {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([^?&/]{11})/);
  return match ? match[1] : '';
}

export const getTwitterAuthor = (url: string) => {
  const match = url.match(/(?:twitter\.com|x\.com)\/([^/]+)/);
  return match ? match[1] : 'unknown';
}

export const formatDate = (dateString: string) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export const formatDateTime = (dateString: string) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' at ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export const deriveDisplayType = (b: Bookmark) => {
  if (['twitter', 'instagram', 'youtube', 'tiktok', 'pinterest', 'github', 'note', 'pdf', 'image', 'video'].includes(b.type || '')) return b.type;
  if (b.url) {
    if (isGoogleSearchUrl(b.url)) return 'google';
    const url = b.url.toLowerCase();
    if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
    if (url.includes('instagram.com')) return 'instagram';
    if (url.includes('pinterest.com') || url.includes('pin.it')) return 'pinterest';
    if (url.includes('tiktok.com')) return 'tiktok';
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('github.com')) return 'github';
    if (url.endsWith('.pdf') || b.file_type === 'application/pdf') return 'pdf';
  }
  return b.type || 'link';
}

export const getInstaMeta = (b: Bookmark) => {
  let username = 'instagram_user'; let likes = '1,248'; let caption = '';
  const fullText = (b.description || '') + ' ' + (b.title || '');

  if (fullText.includes(' on Instagram:')) {
    const parts = fullText.split(' on Instagram:');
    const metaPart = parts[0];
    const userMatch = metaPart.match(/-\s+([a-zA-Z0-9_.]+)\s*$/) || metaPart.match(/^([a-zA-Z0-9_.]+)$/);
    if (userMatch) username = userMatch[1].trim();
    
    const likesMatch = metaPart.match(/([\d,KMB]+)\s+likes?/i);
    if (likesMatch) likes = likesMatch[1];

    caption = parts.slice(1).join(' on Instagram:').trim();
    if ((caption.startsWith('"') && caption.endsWith('"')) || (caption.startsWith("'") && caption.endsWith("'"))) {
      caption = caption.substring(1, caption.length - 1).trim();
    }
  } else {
    caption = (b.description && b.description !== b.title) ? b.description : '';
  }

  if (caption.toLowerCase() === 'instagram' || caption.toLowerCase().includes('instagram photos and videos') || caption.includes('Create an account')) caption = '';
  
  if (username === 'instagram_user' && b.url) {
    const urlMatch = b.url.match(/instagram\.com\/([^/]+)/);
    if (urlMatch && !['p','reel','reels','tv','explore'].includes(urlMatch[1])) username = urlMatch[1];
  }
  if (username.length > 30) username = username.substring(0, 30);
  return { username, likes, caption };
}

export const renderInstagramText = (text: string) => {
  if (!text) return null;
  const parts = text.split(/(#[a-zA-Z0-9_]+|@[a-zA-Z0-9_.]+)/g);
  return parts.map((part, i) => {
    if (part.startsWith('#')) return <a key={i} href={`https://www.instagram.com/explore/tags/${part.slice(1)}/`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-[#00376B] dark:text-[#E0F1FF] hover:underline">{part}</a>;
    if (part.startsWith('@')) return <a key={i} href={`https://www.instagram.com/${part.slice(1)}/`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-[#00376B] dark:text-[#E0F1FF] hover:underline font-medium">{part}</a>;
    return <span key={i}>{part}</span>;
  });
};

export const renderTwitterText = (text: string, isExpanded: boolean = false) => {
  if (!text) return null;
  const parts = text.split(/(https?:\/\/(?:twitter\.com|x\.com)\/\w+\/status\/\d+(?:\?[^\s]*)?)/g);
  return parts.map((part, i) => {
    const quoteMatch = part.match(/https?:\/\/(?:twitter\.com|x\.com)\/(\w+)\/status\/(\d+)/);
    if (quoteMatch) {
      return (
        <div key={i} className="mt-3 mb-1 w-full rounded-xl overflow-hidden border border-black/[0.04] dark:border-white/[0.04] bg-gray-50 dark:bg-black pointer-events-auto relative z-20" onPointerDown={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
           <iframe src={`https://platform.twitter.com/embed/Tweet.html?dnt=true&theme=dark&id=${quoteMatch[2]}`} className={`w-full border-none bg-transparent ${isExpanded ? 'h-[350px] overflow-y-auto custom-scrollbar' : 'h-[200px]'}`} title="Nested X Post" scrolling={isExpanded ? "yes" : "no"} />
        </div>
      );
    }
    const subParts = part.split(/(https?:\/\/[^\s]+|@\w+|#\w+)/g);
    return subParts.map((sub, j) => {
      if (sub.match(/^(https?:\/\/[^\s]+|@\w+|#\w+)$/)) {
        return <a key={`${i}-${j}`} href={sub.startsWith('http') ? sub : `https://x.com/${sub}`} target="_blank" rel="noreferrer" onPointerDown={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} className="text-[#1DA1F2] hover:underline relative z-20 pointer-events-auto">{sub}</a>;
      }
      return <span key={`${i}-${j}`}>{sub}</span>;
    });
  });
};

export const getPlatformMeta = (url: string) => {
  if (!url) return { name: 'Website', color: 'transparent' };
  try {
    const host = new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace('www.', '');
    if (host.includes('spotify.com')) return { name: 'Spotify', color: '#1DB954' };
    if (host.includes('reddit.com')) return { name: 'Reddit', color: '#FF4500' };
    if (host.includes('figma.com')) return { name: 'Figma', color: '#F24E1E' };
    if (host.includes('vimeo.com')) return { name: 'Vimeo', color: '#1AB7EA' };
    if (host.includes('codepen.io')) return { name: 'CodePen', color: '#000000' };
    if (host.includes('soundcloud.com')) return { name: 'SoundCloud', color: '#FF3300' };
    if (host.includes('github.com')) return { name: 'GitHub', color: '#24292e' };
    if (host.includes('codesandbox.io')) return { name: 'CodeSandbox', color: '#151515' };
    if (host.includes('linkedin.com')) return { name: 'LinkedIn', color: '#0A66C2' };
    if (host.includes('dribbble.com')) return { name: 'Dribbble', color: '#EA4C89' };
    if (host.includes('behance.net')) return { name: 'Behance', color: '#1769FF' };
    if (host.includes('notion.so') || host.includes('notion.site')) return { name: 'Notion', color: '#000000' };
    return { name: host, color: 'transparent' };
  } catch {
    return { name: 'Website', color: 'transparent' };
  }
}

export const getUniversalEmbedUrl = (url: string): string | null => {
  if (!url) return null;
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    const host = u.hostname.replace('www.', '');

    if (host === 'open.spotify.com') return url.replace(/\/(track|album|playlist|episode|show)\//, '/embed/$1/');
    if (host === 'vimeo.com') {
      const match = u.pathname.match(/^\/(\d+)$/);
      if (match) return `https://player.vimeo.com/video/${match[1]}`;
    }
    if (host === 'figma.com') return `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(url)}`;
    if (host === 'codepen.io') return url.replace('/pen/', '/embed/preview/');
    if (host === 'reddit.com') return `${url.replace(/\/$/, '')}/embed`;
    if (host === 'soundcloud.com') return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&auto_play=false&visual=true`;
    if (host === 'codesandbox.io') return url.replace('/s/', '/embed/');
    
    return null; // Return null if no interactive embed exists, which triggers standard fallback
  } catch { return null; }
}
```

---

## `src/utils/safeFetch.ts`

```typescript
import dns from 'node:dns/promises';
import net from 'node:net';

/**
 * Checks if an IPv4 or IPv6 address belongs to private, loopback, link-local,
 * carrier-grade NAT, or other non-routable / reserved ranges.
 */
export function isPrivateIpAddress(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const parts = ip.split('.').map(Number);
    if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
      return true;
    }

    // 0.0.0.0/8 (Current network / default route)
    if (parts[0] === 0) return true;
    // 10.0.0.0/8 (Private-Use)
    if (parts[0] === 10) return true;
    // 127.0.0.0/8 (Loopback)
    if (parts[0] === 127) return true;
    // 100.64.0.0/10 (Shared Address / CGNAT)
    if (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) return true;
    // 169.254.0.0/16 (Link-Local / Cloud Instance Metadata)
    if (parts[0] === 169 && parts[1] === 254) return true;
    // 172.16.0.0/12 (Private-Use)
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    // 192.0.0.0/24 (IETF Protocol Assignments)
    if (parts[0] === 192 && parts[1] === 0 && parts[2] === 0) return true;
    // 192.0.2.0/24 (TEST-NET-1)
    if (parts[0] === 192 && parts[1] === 0 && parts[2] === 2) return true;
    // 192.88.99.0/24 (6to4 Relay Anycast)
    if (parts[0] === 192 && parts[1] === 88 && parts[2] === 99) return true;
    // 192.168.0.0/16 (Private-Use)
    if (parts[0] === 192 && parts[1] === 168) return true;
    // 198.18.0.0/15 (Benchmarking)
    if (parts[0] === 198 && (parts[1] === 18 || parts[1] === 19)) return true;
    // 198.51.100.0/24 (TEST-NET-2)
    if (parts[0] === 198 && parts[1] === 51 && parts[2] === 100) return true;
    // 203.0.113.0/24 (TEST-NET-3)
    if (parts[0] === 203 && parts[1] === 0 && parts[2] === 113) return true;
    // 224.0.0.0/4 (Multicast)
    if (parts[0] >= 224 && parts[0] <= 239) return true;
    // 240.0.0.0/4 (Reserved / Future Use)
    if (parts[0] >= 240) return true;
    // Broadcast
    if (ip === '255.255.255.255') return true;

    return false;
  }

  if (net.isIPv6(ip)) {
    const normalized = ip.toLowerCase();
    // Loopback ::1, Unspecified ::
    if (normalized === '::1' || normalized === '::') return true;

    // IPv4-mapped IPv6 (e.g. ::ffff:127.0.0.1)
    if (normalized.startsWith('::ffff:')) {
      const ipv4Part = normalized.substring(7);
      if (net.isIPv4(ipv4Part)) {
        return isPrivateIpAddress(ipv4Part);
      }
      return true;
    }

    // Unique Local Address fc00::/7 (fc00:: - fdff::)
    if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;

    // Link-Local Unicast fe80::/10 (fe80:: - febf::)
    if (
      normalized.startsWith('fe8') ||
      normalized.startsWith('fe9') ||
      normalized.startsWith('fea') ||
      normalized.startsWith('feb')
    ) {
      return true;
    }

    return false;
  }

  return true;
}

/**
 * Validates that a URL uses http/https, does not target internal hostnames,
 * and resolves only to non-private public IP addresses.
 */
export async function isSafeUrl(urlStr: string): Promise<boolean> {
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();
    if (!hostname) return false;

    // Immediately reject known localhost and local domain patterns
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal') ||
      hostname === '0.0.0.0'
    ) {
      return false;
    }

    // If hostname is directly an IP address
    if (net.isIP(hostname)) {
      return !isPrivateIpAddress(hostname);
    }

    // Resolve DNS to verify all underlying IP addresses (prevents DNS rebinding)
    const lookup = await dns.lookup(hostname, { all: true });
    if (!lookup || lookup.length === 0) {
      return false;
    }

    for (const record of lookup) {
      if (isPrivateIpAddress(record.address)) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Performs a network fetch with SSRF protection, manual redirect validation,
 * and automatic resolution of redirect target addresses.
 */
export async function safeFetch(
  url: string,
  options: RequestInit = {},
  maxRedirects = 3
): Promise<Response> {
  let currentUrl = url;

  for (let i = 0; i <= maxRedirects; i++) {
    const isSafe = await isSafeUrl(currentUrl);
    if (!isSafe) {
      throw new Error('Access to restricted address denied (SSRF protection)');
    }

    const response = await fetch(currentUrl, {
      ...options,
      redirect: 'manual',
    });

    // Handle HTTP redirect codes (301, 302, 303, 307, 308)
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      if (!location) {
        return response;
      }

      // Safely resolve relative redirects against current URL
      currentUrl = new URL(location, currentUrl).href;
      continue;
    }

    return response;
  }

  throw new Error('Too many redirects');
}
```

---

## `src/utils/normalizeUrl.ts`

```typescript
// src/utils/normalizeUrl.ts
export function normalizeUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';

  try {
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const parsed = new URL(withProtocol);
    
    // Lowercase hostname, strip 'www.', strip trailing slash, and drop hash
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');
    const pathname = parsed.pathname.replace(/\/+$/, '') || '/';
    const search = parsed.search;

    return `${parsed.protocol}//${hostname}${pathname}${search}`;
  } catch {
    return trimmed.toLowerCase().replace(/\/+$/, '');
  }
}
```

---

## `src/utils/supabase/client.ts`

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

---

## `src/utils/supabase/server.ts`

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
```

---

## `postcss.config.mjs`

*(Note: Tailwind CSS v4 is configured via PostCSS and CSS `@theme` rules instead of a `tailwind.config.js` file.)*

```javascript
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

---

## `src/app/globals.css`

```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";

/* Force Tailwind v4 to trigger dark mode when the .dark class is present */
@custom-variant dark (&:is(.dark *));

:root {
  --background: #bbaabe;
  --foreground: #171717;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #99acc2;
  }
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: Arial, Helvetica, sans-serif;
}

/* Enable buttery-smooth global theme transitions */
*, ::before, ::after {
  transition-property: background-color, border-color, color, fill, stroke;
  transition-duration: 300ms;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

.group-hover\:scale-105 {
  transition-property: transform;
}

/* --- TIPTAP EDITOR OVERRIDES --- */

/* Reset List */
.prose ul[data-type="taskList"],
.tiptap ul[data-type="taskList"],
ul[data-type="taskList"] {
  list-style: none !important;
  padding: 0 !important;
  margin: 0 !important;
}

/* Layout: Flex row with NO WRAPPING to physically prevent text dropping */
.prose li[data-type="taskItem"],
.tiptap li[data-type="taskItem"],
li[data-type="taskItem"] {
  display: flex !important;
  flex-direction: row !important;
  align-items: flex-start !important;
  flex-wrap: nowrap !important;
  gap: 12px !important;
  margin-bottom: 8px !important;
  margin-top: 0 !important;
  padding: 0 !important;
  width: 100% !important;
}

/* Hide default bullets injected by Tailwind Typography */
.prose li[data-type="taskItem"]::before,
.prose li[data-type="taskItem"]::after,
.tiptap li[data-type="taskItem"]::before,
.tiptap li[data-type="taskItem"]::after,
li[data-type="taskItem"]::before,
li[data-type="taskItem"]::after {
  display: none !important;
  content: none !important;
}

/* Checkbox Label wrapper */
.prose li[data-type="taskItem"] > label,
.tiptap li[data-type="taskItem"] > label,
li[data-type="taskItem"] > label {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  margin: 0 !important;
  padding-top: 4px !important; 
  flex: 0 0 auto !important;
  user-select: none !important;
  cursor: pointer !important;
}

/* The Circular Checkbox */
.prose li[data-type="taskItem"] input[type="checkbox"],
.tiptap li[data-type="taskItem"] input[type="checkbox"],
li[data-type="taskItem"] input[type="checkbox"] {
  appearance: none !important;
  -webkit-appearance: none !important;
  width: 20px !important;
  height: 20px !important;
  border-radius: 50% !important;
  border: 2px solid #A0AEC0 !important;
  background-color: transparent !important;
  cursor: pointer !important;
  margin: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  position: relative !important;
  transition: all 0.2s ease-in-out !important;
  flex-shrink: 0 !important;
}

/* Checked State -> Green Circle */
li[data-type="taskItem"] input[type="checkbox"]:checked,
li[data-type="taskItem"][data-checked="true"] input[type="checkbox"],
.tiptap li[data-type="taskItem"] input[type="checkbox"]:checked,
.tiptap li[data-type="taskItem"][data-checked="true"] input[type="checkbox"],
.prose li[data-type="taskItem"] input[type="checkbox"]:checked,
.prose li[data-type="taskItem"][data-checked="true"] input[type="checkbox"] {
  background-color: #4D6A51 !important;
  border-color: #4D6A51 !important;
}

/* The White Checkmark */
li[data-type="taskItem"] input[type="checkbox"]:checked::after,
li[data-type="taskItem"][data-checked="true"] input[type="checkbox"]::after,
.tiptap li[data-type="taskItem"] input[type="checkbox"]:checked::after,
.tiptap li[data-type="taskItem"][data-checked="true"] input[type="checkbox"]::after,
.prose li[data-type="taskItem"] input[type="checkbox"]:checked::after,
.prose li[data-type="taskItem"][data-checked="true"] input[type="checkbox"]::after {
  content: "" !important;
  width: 6px !important;
  height: 11px !important;
  border: solid white !important;
  border-width: 0 2px 2px 0 !important;
  transform: rotate(45deg) translateY(-1px) !important;
  position: absolute !important;
}

/* Dark Mode Checkbox */
.dark li[data-type="taskItem"] input[type="checkbox"],
.dark .tiptap li[data-type="taskItem"] input[type="checkbox"],
.dark .prose li[data-type="taskItem"] input[type="checkbox"] {
  border-color: #718096 !important;
}
.dark li[data-type="taskItem"] input[type="checkbox"]:checked,
.dark li[data-type="taskItem"][data-checked="true"] input[type="checkbox"],
.dark .tiptap li[data-type="taskItem"] input[type="checkbox"]:checked,
.dark .tiptap li[data-type="taskItem"][data-checked="true"] input[type="checkbox"],
.dark .prose li[data-type="taskItem"] input[type="checkbox"]:checked,
.dark .prose li[data-type="taskItem"][data-checked="true"] input[type="checkbox"] {
  background-color: #8FAA91 !important;
  border-color: #8FAA91 !important;
}
.dark li[data-type="taskItem"] input[type="checkbox"]:checked::after,
.dark li[data-type="taskItem"][data-checked="true"] input[type="checkbox"]::after,
.dark .tiptap li[data-type="taskItem"] input[type="checkbox"]:checked::after,
.dark .tiptap li[data-type="taskItem"][data-checked="true"] input[type="checkbox"]::after,
.dark .prose li[data-type="taskItem"] input[type="checkbox"]:checked::after,
.dark .prose li[data-type="taskItem"][data-checked="true"] input[type="checkbox"]::after {
  border-color: #151815 !important;
}

/* Text Container */
li[data-type="taskItem"] > div,
.tiptap li[data-type="taskItem"] > div,
.prose li[data-type="taskItem"] > div {
  flex: 1 1 auto !important;
  min-width: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  display: block !important;
}

/* Text Paragraph */
li[data-type="taskItem"] > div > p,
.tiptap li[data-type="taskItem"] > div > p,
.prose li[data-type="taskItem"] > div > p {
  margin: 0 !important;
  padding: 0 !important;
  display: block !important; 
  width: 100% !important;
  transition: color 0.2s ease-in-out !important;
}

/* Strikethrough text when checked */
li[data-type="taskItem"][data-checked="true"] > div > p,
li[data-type="taskItem"]:has(input[type="checkbox"]:checked) > div > p,
.tiptap li[data-type="taskItem"][data-checked="true"] > div > p,
.tiptap li[data-type="taskItem"]:has(input[type="checkbox"]:checked) > div > p,
.prose li[data-type="taskItem"][data-checked="true"] > div > p,
.prose li[data-type="taskItem"]:has(input[type="checkbox"]:checked) > div > p {
  text-decoration: line-through !important;
  color: #A0AEC0 !important;
}
.dark li[data-type="taskItem"][data-checked="true"] > div > p,
.dark li[data-type="taskItem"]:has(input[type="checkbox"]:checked) > div > p,
.dark .tiptap li[data-type="taskItem"][data-checked="true"] > div > p,
.dark .tiptap li[data-type="taskItem"]:has(input[type="checkbox"]:checked) > div > p,
.dark .prose li[data-type="taskItem"][data-checked="true"] > div > p,
.dark .prose li[data-type="taskItem"]:has(input[type="checkbox"]:checked) > div > p {
  color: #718096 !important;
}

/* --- FIX: CORRECTED TABLE BORDERS --- */
.tiptap table {
  border-collapse: collapse;
  table-layout: fixed;
  width: 100%;
  margin: 0;
  overflow: hidden;
}

.tiptap td, .tiptap th {
  min-width: 1em;
  border: 1px solid rgba(0, 0, 0, 0.15); /* Dark border for light mode */
  padding: 8px;
  vertical-align: top;
  box-sizing: border-box;
  position: relative;
}

.dark .tiptap td, .dark .tiptap th {
  border-color: rgba(255, 255, 255, 0.15); /* Light border for dark mode */
}

.tiptap th {
  font-weight: bold;
  text-align: left;
  background-color: rgba(0, 0, 0, 0.05); /* Dark bg for light mode */
}

.dark .tiptap th {
  background-color: rgba(255, 255, 255, 0.05); /* Light bg for dark mode */
}

/* Placeholder styling */
.tiptap p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
  color: rgba(0, 0, 0, 0.4);
}

.dark .tiptap p.is-editor-empty:first-child::before {
  color: rgba(255, 255, 255, 0.4);
}
```

---

## `package.json`

```json
{
  "name": "smart-bookmark-app",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint"
  },
  "dependencies": {
    "@supabase/ssr": "^0.8.0",
    "@supabase/supabase-js": "^2.95.3",
    "@tailwindcss/typography": "^0.5.20",
    "@tiptap/extension-placeholder": "^3.31.3",
    "@tiptap/extension-table": "^3.31.3",
    "@tiptap/extension-table-cell": "^3.31.3",
    "@tiptap/extension-table-header": "^3.31.3",
    "@tiptap/extension-table-row": "^3.31.3",
    "@tiptap/extension-task-item": "^3.31.3",
    "@tiptap/extension-task-list": "^3.31.3",
    "@tiptap/react": "^3.31.3",
    "@tiptap/starter-kit": "^3.31.3",
    "cheerio": "^1.2.0",
    "next": "^15.5.20",
    "react": "19.0.0",
    "react-dom": "19.0.0",
    "react-hot-toast": "^2.4.1"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/cheerio": "^0.22.35",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "^15.5.20",
    "tailwindcss": "^4",
    "typescript": "^5"
  },
  "overrides": {
    "postcss": "^8.5.10",
    "serialize-javascript": "^6.0.2",
    "terser": "^5.14.2",
    "prosemirror-view": "1.37.2"
  }
}
```
