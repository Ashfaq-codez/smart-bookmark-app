import 'server-only'

// Who is allowed to open /admin.
// Set ADMIN_USER_IDS in .env.local and in Vercel as a comma-separated list of Supabase user IDs (UUIDs).
// User IDs are used instead of emails because an ID can never be re-registered by someone else.
export function isAdmin(userId?: string | null) {
  if (!userId) return false
  const allowed = (process.env.ADMIN_USER_IDS || '')
    .split(',')
    .map((id) => id.trim().toLowerCase())
    .filter(Boolean)
  return allowed.includes(userId.toLowerCase())
}
