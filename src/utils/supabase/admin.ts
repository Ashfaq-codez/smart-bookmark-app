import 'server-only'
import { createClient } from '@supabase/supabase-js'

// A Supabase client that uses the SERVICE ROLE (secret) key.
// It skips every RLS rule, so it must only ever run on the server.
// The `server-only` import above makes the build fail if a client component ever imports this file.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const secretKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !secretKey) {
    throw new Error('Admin client is missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  return createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
