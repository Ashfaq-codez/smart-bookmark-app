import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    
    // This swaps the "Code" for a "Session" and extracts the user data
    const { data: authData, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && authData?.user) {
      
      // --- NEW: Zero-Friction Onboarding for First-Time Users ---
      const { count } = await supabase
        .from('bookmarks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', authData.user.id)

      if (count === 0) {
        await supabase.from('bookmarks').insert([
          {
            user_id: authData.user.id,
            url: 'https://smart-bookmark.internal/welcome',
            title: 'Welcome to Space',
            description: 'Your personal, real-time curation engine. Drop links, highlight text, or save images from anywhere.',
            category: 'Inbox',
            type: 'note',
            tags: ['onboarding']
          }
        ])
      }
      // ---------------------------------------------------------

      const forwardedHost = request.headers.get('x-forwarded-host') 
      const isLocalEnv = process.env.NODE_ENV === 'development'
      
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    } else {
      // Log the exact error to your terminal so you can see why it failed
      console.error("Auth Exchange Error:", error?.message)
    }
  }

  // FIX: Redirect back to the home/login page with an error query instead of a dead 404 page
  return NextResponse.redirect(`${origin}/?error=auth-code-error`)
}