import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    
    // This swaps the "Code" for a "Session"
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
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
      console.error("Auth Exchange Error:", error.message)
    }
  }

  // FIX: Redirect back to the home/login page with an error query instead of a dead 404 page
  return NextResponse.redirect(`${origin}/?error=auth-code-error`)
}