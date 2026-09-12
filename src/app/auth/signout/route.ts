import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: Request) {
  const requestUrl = new URL(request.url)
  const supabase = await createClient()

  // Destroy the session on the server
  await supabase.auth.signOut()

  // 303 "See Other" prevents the browser from caching this redirect
  return NextResponse.redirect(`${requestUrl.origin}/login`, {
    status: 303,
  })
}