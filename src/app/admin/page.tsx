import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { isAdmin } from '@/lib/admin'
import AdminAutoRefresh from '@/components/AdminAutoRefresh'

// Always fresh, never cached, never indexed by search engines.
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Admin · inntoit', robots: { index: false, follow: false } }

const PAGE_SIZE = 50
const TYPES = ['idea', 'problem', 'other'] as const
type FeedbackType = (typeof TYPES)[number]

type FeedbackRow = {
  id: number
  user_id: string
  type: FeedbackType
  message: string
  user_agent: string | null
  created_at: string
}

const TYPE_STYLES: Record<FeedbackType, string> = {
  idea: 'bg-[#E8EFE5] text-[#4D6A51] dark:bg-[#202820] dark:text-[#8FAA91]',
  problem: 'bg-[#FBE9E7] text-[#B23A2E] dark:bg-[#2A1B19] dark:text-[#E8907F]',
  other: 'bg-[#F1EEE6] text-[#737B73] dark:bg-[#22251F] dark:text-[#A9B0A9]',
}

const dateFmt = new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Kolkata',
})

// Turns a long user-agent string into something short like "iPhone · Safari".
function shortDevice(ua: string | null) {
  if (!ua) return 'Unknown device'
  const device =
    /iPhone/i.test(ua) ? 'iPhone'
    : /iPad/i.test(ua) ? 'iPad'
    : /Android/i.test(ua) ? 'Android'
    : /Mac OS X|Macintosh/i.test(ua) ? 'Mac'
    : /Windows/i.test(ua) ? 'Windows'
    : /Linux/i.test(ua) ? 'Linux'
    : 'Other'
  const browser =
    /Edg\//i.test(ua) ? 'Edge'
    : /OPR\//i.test(ua) ? 'Opera'
    : /Firefox|FxiOS/i.test(ua) ? 'Firefox'
    : /Chrome|CriOS/i.test(ua) ? 'Chrome'
    : /Safari/i.test(ua) ? 'Safari'
    : 'Browser'
  return `${device} · ${browser}`
}

function pageHref(type: FeedbackType | null, page: number) {
  const q = new URLSearchParams()
  if (type) q.set('type', type)
  if (page > 1) q.set('page', String(page))
  const s = q.toString()
  return s ? `/admin?${s}` : '/admin'
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; page?: string }>
}) {
  // 1. Who is asking? Uses the normal (cookie) client, exactly like the dashboard.
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  if (!isAdmin(user.id)) notFound() // non-admins see a plain 404, so the page looks like it doesn't exist

  // 2. Read the filters from the URL (?type=problem&page=2).
  const params = await searchParams
  const type = TYPES.includes(params.type as FeedbackType) ? (params.type as FeedbackType) : null
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1)
  const from = (page - 1) * PAGE_SIZE

  // 3. Everything below uses the secret key and skips RLS. Safe only because of the check above.
  const admin = createAdminClient()
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  let feedbackQuery = admin
    .from('feedback')
    .select('id, user_id, type, message, user_agent, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1)
  if (type) feedbackQuery = feedbackQuery.eq('type', type)

  const [feedbackRes, usersRes, savesRes, weekRes, typeCountRes] = await Promise.all([
    feedbackQuery,
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }), // one call gives the user count AND everyone's email
    admin.from('bookmarks').select('*', { count: 'exact', head: true }),
    admin.from('feedback').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
    Promise.all(
      TYPES.map((t) => admin.from('feedback').select('*', { count: 'exact', head: true }).eq('type', t)),
    ),
  ])

  if (feedbackRes.error) {
    console.error('admin feedback failed:', feedbackRes.error.message)
    throw new Error('Could not load feedback')
  }

  const rows = (feedbackRes.data ?? []) as FeedbackRow[]
  const filteredTotal = feedbackRes.count ?? 0
  const totalPages = Math.max(1, Math.ceil(filteredTotal / PAGE_SIZE))

  const typeCounts = Object.fromEntries(
    TYPES.map((t, i) => [t, typeCountRes[i].count ?? 0]),
  ) as Record<FeedbackType, number>
  const allFeedback = TYPES.reduce((sum, t) => sum + typeCounts[t], 0)

  const userList = usersRes.error ? [] : usersRes.data.users
  const userTotal = usersRes.error
    ? null
    : (usersRes.data as { total?: number }).total || userList.length
  const saveTotal = savesRes.count ?? null
  const weekTotal = weekRes.count ?? 0

  // 4. Emails for the people on this page. Comes from the list above; only someone outside
  //    the first 1000 users needs an extra lookup (won't happen for a long time).
  const emails = new Map<string, string | null>(userList.map((u) => [u.id, u.email ?? null]))
  const missing = [...new Set(rows.map((r) => r.user_id))].filter((id) => !emails.has(id))
  await Promise.all(
    missing.map(async (id) => {
      const { data } = await admin.auth.admin.getUserById(id)
      emails.set(id, data.user?.email ?? null)
    }),
  )

  const stats = [
    { label: 'Users', value: userTotal },
    { label: 'Saves', value: saveTotal },
    { label: 'Feedback · last 7 days', value: weekTotal },
  ]

  const filters: { label: string; value: FeedbackType | null; count: number }[] = [
    { label: 'All', value: null, count: allFeedback },
    { label: 'Ideas', value: 'idea', count: typeCounts.idea },
    { label: 'Problems', value: 'problem', count: typeCounts.problem },
    { label: 'Other', value: 'other', count: typeCounts.other },
  ]

  return (
    <div className="min-h-screen font-sans bg-[#FBF9F4] dark:bg-[#151815] text-[#171A17] dark:text-[#F3F0E9] transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-10 sm:py-14">
        {/* Header */}
        <div className="flex items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#737B73] dark:text-[#8F998F] font-bold mb-2">inntoit</p>
            <h1 className="text-3xl sm:text-4xl font-serif">Admin</h1>
          </div>
          <Link
            href="/dashboard"
            className="text-[10px] uppercase tracking-widest text-[#737B73] dark:text-[#8F998F] hover:text-[#171A17] dark:hover:text-[#F3F0E9] transition-colors"
          >
            ← Back to dashboard
          </Link>
        </div>

        {/* Numbers */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-12">
          {stats.map((s) => (
            <div
              key={s.label}
              className="p-5 rounded-2xl bg-white dark:bg-[#1A1D1A] border border-black/[0.04] dark:border-white/[0.04]"
            >
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#737B73] dark:text-[#8F998F] font-bold mb-2">{s.label}</p>
              <p className="text-3xl font-serif tabular-nums">{s.value === null ? '—' : s.value.toLocaleString('en-IN')}</p>
            </div>
          ))}
        </div>

        {/* Feedback */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-serif">Feedback</h2>
            <AdminAutoRefresh />
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.map((f) => {
              const active = f.value === type
              return (
                <Link
                  key={f.label}
                  href={pageHref(f.value, 1)}
                  className={`px-3 py-1.5 rounded-full text-[10px] uppercase tracking-widest border transition-colors ${
                    active
                      ? 'bg-[#4D6A51] text-white border-[#4D6A51] dark:bg-[#E2E8F0] dark:text-[#1A202C] dark:border-[#E2E8F0]'
                      : 'border-black/[0.06] dark:border-white/[0.08] text-[#737B73] dark:text-[#8F998F] hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  {f.label} <span className="tabular-nums opacity-70">{f.count}</span>
                </Link>
              )
            })}
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="p-10 rounded-2xl border border-dashed border-black/[0.08] dark:border-white/[0.08] text-center text-sm text-[#737B73] dark:text-[#8F998F]">
            No feedback here yet.
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {rows.map((r) => {
              const email = emails.get(r.user_id)
              return (
                <li
                  key={r.id}
                  className="p-5 rounded-2xl bg-white dark:bg-[#1A1D1A] border border-black/[0.04] dark:border-white/[0.04]"
                >
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3 text-[11px] text-[#737B73] dark:text-[#8F998F]">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-widest font-bold ${TYPE_STYLES[r.type]}`}>
                      {r.type}
                    </span>
                    {email ? (
                      <a href={`mailto:${email}`} className="hover:text-[#4D6A51] dark:hover:text-[#8FAA91] underline-offset-2 hover:underline">
                        {email}
                      </a>
                    ) : (
                      <span>Deleted user</span>
                    )}
                    <span aria-hidden>·</span>
                    <time dateTime={r.created_at}>{dateFmt.format(new Date(r.created_at))}</time>
                    <span aria-hidden>·</span>
                    <span title={r.user_agent ?? undefined}>{shortDevice(r.user_agent)}</span>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{r.message}</p>
                </li>
              )
            })}
          </ul>
        )}

        {/* Pages */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-8 text-[10px] uppercase tracking-widest text-[#737B73] dark:text-[#8F998F]">
            {page > 1 ? (
              <Link href={pageHref(type, page - 1)} className="hover:text-[#171A17] dark:hover:text-[#F3F0E9]">← Newer</Link>
            ) : <span />}
            <span className="tabular-nums">Page {page} of {totalPages}</span>
            {page < totalPages ? (
              <Link href={pageHref(type, page + 1)} className="hover:text-[#171A17] dark:hover:text-[#F3F0E9]">Older →</Link>
            ) : <span />}
          </div>
        )}
      </div>
    </div>
  )
}