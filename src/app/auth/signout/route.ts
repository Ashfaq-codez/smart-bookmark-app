import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const requestUrl = new URL(request.url)
  const supabase = await createClient()

  // Sign out effectively clears the cookies
  await supabase.auth.signOut()

  return NextResponse.redirect(`${requestUrl.origin}/login`, {
    // a 301 status is a permanent redirect
    // 303 is "See Other", often used for redirecting after a POST action
    status: 301,
  })
}