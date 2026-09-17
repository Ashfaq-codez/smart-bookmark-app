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