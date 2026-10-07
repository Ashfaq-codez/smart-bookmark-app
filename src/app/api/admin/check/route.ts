import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { isAdmin } from '@/lib/admin'

export const dynamic = 'force-dynamic'

// Called by the profile dropdown when it opens: "should I show the Admin button?"
// Uses the same ADMIN_USER_IDS list as the /admin page, so there is only one place to change.
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return NextResponse.json(
    { isAdmin: isAdmin(user?.id) },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
