import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { isAdmin } from '@/lib/admin'
import AdminAutoRefresh from '@/components/AdminAutoRefresh'

// Always fresh, never cached, never indexed by search engines.
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Admin · inntoit', robots: { index: false, follow: false } }

const FEEDBACK_PAGE_SIZE = 50
const USERS_PAGE_SIZE = 25
const MAX_SAVES = 20000 // safety cap. Long before this, move the counting into a SQL function.
const DAY = 24 * 60 * 60 * 1000

const TABS = ['overview', 'users', 'feedback'] as const
type Tab = (typeof TABS)[number]
const SORTS = ['active', 'saves', 'joined'] as const
type Sort = (typeof SORTS)[number]
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

// Only these columns are read. Titles, notes and page content are never loaded.
type SaveRow = { user_id: string; type: string | null; url: string | null; created_at: string }

// ---------------------------------------------------------------------------
// Categories: worked out from the save's type and the website's domain only.
// ---------------------------------------------------------------------------
const CATEGORIES = ['Article', 'Video', 'Social', 'Design', 'Code', 'Shopping', 'Note', 'Image', 'File', 'Other'] as const
type Category = (typeof CATEGORIES)[number]

const CATEGORY_COLORS: Record<Category, string> = {
  Article: '#4D6A51',
  Video: '#C0503F',
  Social: '#3E6E9E',
  Design: '#A86B9A',
  Code: '#5B6470',
  Shopping: '#C08A2E',
  Note: '#7A9A6B',
  Image: '#2E8C8C',
  File: '#8A7560',
  Other: '#A9B0A9',
}

const DOMAIN_RULES: [Category, string[]][] = [
  ['Video', ['youtube.com', 'youtu.be', 'vimeo.com', 'loom.com', 'twitch.tv', 'tiktok.com']],
  ['Social', ['x.com', 'twitter.com', 'instagram.com', 'linkedin.com', 'threads.net', 'reddit.com', 'facebook.com', 'bsky.app', 'mastodon.social']],
  ['Design', ['dribbble.com', 'behance.net', 'figma.com', 'pinterest.com', 'awwwards.com', 'mobbin.com', 'framer.com', 'savee.it']],
  ['Code', ['github.com', 'gitlab.com', 'stackoverflow.com', 'dev.to', 'npmjs.com', 'vercel.com', 'developer.mozilla.org', 'codepen.io']],
  ['Shopping', ['amazon.in', 'amazon.com', 'flipkart.com', 'myntra.com', 'etsy.com', 'meesho.com', 'ajio.com']],
]

function emptyCounts(): Record<Category, number> {
  return Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<Category, number>
}

function categorize(type: string | null, url: string | null): Category {
  const t = (type ?? '').toLowerCase()
  if (t.includes('note') || t === 'text') return 'Note'
  if (t.includes('image') || t.includes('photo')) return 'Image'
  if (t.includes('file') || t.includes('pdf') || t.includes('doc')) return 'File'
  if (!url) return 'Other'

  let host: string
  let path: string
  try {
    const u = new URL(url)
    host = u.hostname.replace(/^www\./, '').toLowerCase()
    path = u.pathname.toLowerCase()
  } catch {
    return 'Other'
  }
  if (/\.(png|jpe?g|gif|webp|avif|svg)$/.test(path)) return 'Image'
  if (/\.(pdf|docx?|pptx?|xlsx?|zip)$/.test(path)) return 'File'
  for (const [cat, domains] of DOMAIN_RULES) {
    if (domains.some((d) => host === d || host.endsWith('.' + d))) return cat
  }
  return 'Article'
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------
const dateFmt = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' })
const shortDateFmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })
const dayKeyFmt = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Kolkata' })
const dayKey = (ms: number) => dayKeyFmt.format(new Date(ms)) // "2026-10-08" in India time
const shortDay = (key: string) => shortDateFmt.format(new Date(`${key}T12:00:00+05:30`))

function ago(ms: number | null) {
  if (!ms) return '—'
  const s = Math.max(0, (Date.now() - ms) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  if (s < 30 * 86400) return `${Math.floor(s / 86400)}d ago`
  return shortDateFmt.format(new Date(ms))
}

function displayName(u: User): string | null {
  const m = (u.user_metadata ?? {}) as Record<string, unknown>
  const name = m.full_name ?? m.name
  return typeof name === 'string' && name.trim() ? name.trim() : null
}

function avatarOf(u: User): string | null {
  const m = (u.user_metadata ?? {}) as Record<string, unknown>
  const pic = m.avatar_url ?? m.picture
  return typeof pic === 'string' ? pic : null
}

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

function adminHref(q: { tab?: Tab; type?: FeedbackType | null; sort?: Sort; page?: number }) {
  const p = new URLSearchParams()
  if (q.tab && q.tab !== 'overview') p.set('tab', q.tab)
  if (q.type) p.set('type', q.type)
  if (q.sort && q.sort !== 'active') p.set('sort', q.sort)
  if (q.page && q.page > 1) p.set('page', String(q.page))
  const s = p.toString()
  return s ? `/admin?${s}` : '/admin'
}

async function fetchAllSaves(admin: ReturnType<typeof createAdminClient>) {
  const rows: SaveRow[] = []
  const STEP = 1000 // Supabase returns at most 1000 rows per request
  for (let from = 0; from < MAX_SAVES; from += STEP) {
    const { data, error } = await admin
      .from('bookmarks')
      .select('user_id, type, url, created_at')
      .order('created_at', { ascending: false })
      .range(from, from + STEP - 1)
    if (error) {
      console.error('admin saves failed:', error.message)
      break
    }
    rows.push(...((data ?? []) as SaveRow[]))
    if (!data || data.length < STEP) return { rows, capped: false }
  }
  return { rows, capped: rows.length >= MAX_SAVES }
}

type UserStat = {
  id: string
  email: string | null
  name: string | null
  avatar: string | null
  joinedMs: number
  lastSignInMs: number | null
  total: number
  week: number
  lastSaveMs: number | null
  byCat: Record<Category, number>
}

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------
const CARD = 'p-5 rounded-2xl bg-white dark:bg-[#1A1D1A] border border-black/[0.04] dark:border-white/[0.04]'
const EYEBROW = 'text-[10px] uppercase tracking-[0.2em] text-[#737B73] dark:text-[#8F998F] font-bold'
const MUTED = 'text-[#737B73] dark:text-[#8F998F]'
const PILL = 'px-3 py-1.5 rounded-full text-[10px] uppercase tracking-widest border transition-colors'
const PILL_ON = 'bg-[#4D6A51] text-white border-[#4D6A51] dark:bg-[#E2E8F0] dark:text-[#1A202C] dark:border-[#E2E8F0]'
const PILL_OFF = 'border-black/[0.06] dark:border-white/[0.08] text-[#737B73] dark:text-[#8F998F] hover:bg-black/5 dark:hover:bg-white/5'

const TYPE_STYLES: Record<FeedbackType, string> = {
  idea: 'bg-[#E8EFE5] text-[#4D6A51] dark:bg-[#202820] dark:text-[#8FAA91]',
  problem: 'bg-[#FBE9E7] text-[#B23A2E] dark:bg-[#2A1B19] dark:text-[#E8907F]',
  other: 'bg-[#F1EEE6] text-[#737B73] dark:bg-[#22251F] dark:text-[#A9B0A9]',
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; type?: string; sort?: string; page?: string }>
}) {
  // 1. Who is asking? Normal (cookie) client, exactly like the dashboard.
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  if (!isAdmin(user.id)) notFound() // non-admins see a plain 404

  // 2. Read the URL (?tab=users&sort=saves&page=2).
  const params = await searchParams
  const tab: Tab = TABS.includes(params.tab as Tab) ? (params.tab as Tab) : 'overview'
  const sort: Sort = SORTS.includes(params.sort as Sort) ? (params.sort as Sort) : 'active'
  const type = TYPES.includes(params.type as FeedbackType) ? (params.type as FeedbackType) : null
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1)

  // 3. Everything below uses the secret key and skips RLS. Safe only because of the check above.
  const admin = createAdminClient()
  const now = Date.now()
  const weekAgoMs = now - 7 * DAY
  const weekAgoIso = new Date(weekAgoMs).toISOString()

  let feedbackQuery = admin
    .from('feedback')
    .select('id, user_id, type, message, user_agent, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * FEEDBACK_PAGE_SIZE, page * FEEDBACK_PAGE_SIZE - 1)
  if (type) feedbackQuery = feedbackQuery.eq('type', type)

  const [usersRes, savesRes, saveCountRes, feedbackRes, weekFeedbackRes, typeCountRes] = await Promise.all([
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    fetchAllSaves(admin),
    admin.from('bookmarks').select('*', { count: 'exact', head: true }),
    feedbackQuery,
    admin.from('feedback').select('*', { count: 'exact', head: true }).gte('created_at', weekAgoIso),
    Promise.all(TYPES.map((t) => admin.from('feedback').select('*', { count: 'exact', head: true }).eq('type', t))),
  ])

  // 4. Build per-user stats.
  const userList: User[] = usersRes.error ? [] : usersRes.data.users
  const stats = new Map<string, UserStat>()
  for (const u of userList) {
    stats.set(u.id, {
      id: u.id,
      email: u.email ?? null,
      name: displayName(u),
      avatar: avatarOf(u),
      joinedMs: new Date(u.created_at).getTime(),
      lastSignInMs: u.last_sign_in_at ? new Date(u.last_sign_in_at).getTime() : null,
      total: 0,
      week: 0,
      lastSaveMs: null,
      byCat: emptyCounts(),
    })
  }

  const catTotals = emptyCounts()
  const savesByDay = new Map<string, number>()
  let savesThisWeek = 0
  for (const s of savesRes.rows) {
    const cat = categorize(s.type, s.url)
    const ms = new Date(s.created_at).getTime()
    const inWeek = ms >= weekAgoMs
    catTotals[cat]++
    if (inWeek) savesThisWeek++
    const k = dayKey(ms)
    savesByDay.set(k, (savesByDay.get(k) ?? 0) + 1)
    const st = stats.get(s.user_id)
    if (st) {
      st.total++
      if (inWeek) st.week++
      st.byCat[cat]++
      if (!st.lastSaveMs || ms > st.lastSaveMs) st.lastSaveMs = ms
    }
  }

  const signupsByDay = new Map<string, number>()
  for (const st of stats.values()) {
    const k = dayKey(st.joinedMs)
    signupsByDay.set(k, (signupsByDay.get(k) ?? 0) + 1)
  }

  const allUsers = [...stats.values()]
  const userTotal = usersRes.error ? null : (usersRes.data as { total?: number }).total || userList.length
  const newUsersWeek = allUsers.filter((u) => u.joinedMs >= weekAgoMs).length
  const activeWeek = allUsers.filter((u) => u.week > 0).length
  const everSaved = allUsers.filter((u) => u.total > 0).length
  const saveTotal = saveCountRes.count ?? savesRes.rows.length

  const last30 = Array.from({ length: 30 }, (_, i) => dayKey(now - (29 - i) * DAY))
  const savesSeries = last30.map((d) => ({ day: d, count: savesByDay.get(d) ?? 0 }))
  const signupSeries = last30.map((d) => ({ day: d, count: signupsByDay.get(d) ?? 0 }))

  const catList = CATEGORIES.map((c) => ({ cat: c, count: catTotals[c] }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count)
  const catSum = catList.reduce((n, c) => n + c.count, 0)

  const sortedUsers = [...allUsers].sort((a, b) => {
    if (sort === 'saves') return b.total - a.total || (b.lastSaveMs ?? 0) - (a.lastSaveMs ?? 0)
    if (sort === 'joined') return b.joinedMs - a.joinedMs
    return (b.lastSaveMs ?? 0) - (a.lastSaveMs ?? 0) || (b.lastSignInMs ?? 0) - (a.lastSignInMs ?? 0)
  })
  const topThisWeek = [...allUsers].filter((u) => u.week > 0).sort((a, b) => b.week - a.week).slice(0, 5)

  // Feedback numbers
  const typeCounts = Object.fromEntries(TYPES.map((t, i) => [t, typeCountRes[i].count ?? 0])) as Record<FeedbackType, number>
  const allFeedback = TYPES.reduce((n, t) => n + typeCounts[t], 0)
  const weekFeedback = weekFeedbackRes.count ?? 0

  // Emails for feedback authors outside the first 1000 users (rare).
  const emails = new Map<string, string | null>(allUsers.map((u) => [u.id, u.email]))
  const feedbackRows = tab === 'feedback' && !feedbackRes.error ? ((feedbackRes.data ?? []) as FeedbackRow[]) : []
  if (tab === 'feedback') {
    if (feedbackRes.error) {
      console.error('admin feedback failed:', feedbackRes.error.message)
      throw new Error('Could not load feedback')
    }
    const missing = [...new Set(feedbackRows.map((r) => r.user_id))].filter((id) => !emails.has(id))
    await Promise.all(
      missing.map(async (id) => {
        const { data } = await admin.auth.admin.getUserById(id)
        emails.set(id, data.user?.email ?? null)
      }),
    )
  }

  const headline = [
    { label: 'Users', value: userTotal, sub: `+${newUsersWeek} this week` },
    {
      label: 'Active · 7 days',
      value: activeWeek,
      sub: userTotal ? `${Math.round((activeWeek / userTotal) * 100)}% of users saved something` : '',
    },
    { label: 'Saves', value: saveTotal, sub: `+${savesThisWeek} this week` },
    {
      label: 'Saves per user',
      value: everSaved ? Math.round(saveTotal / everSaved) : 0,
      sub: `${everSaved} of ${userTotal ?? '—'} have saved`,
    },
  ]

  const tabs: { value: Tab; label: string; badge?: number }[] = [
    { value: 'overview', label: 'Overview' },
    { value: 'users', label: 'Users', badge: userTotal ?? undefined },
    { value: 'feedback', label: 'Feedback', badge: weekFeedback || undefined },
  ]

  return (
    <div className="min-h-screen font-sans bg-[#FBF9F4] dark:bg-[#151815] text-[#171A17] dark:text-[#F3F0E9] transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10 sm:py-14">
        {/* Header */}
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <p className={`${EYEBROW} mb-2`}>inntoit</p>
            <h1 className="text-3xl sm:text-4xl font-serif">Admin</h1>
          </div>
          <div className="flex items-center gap-4">
            <AdminAutoRefresh />
            <Link
              href="/dashboard"
              className={`text-[10px] uppercase tracking-widest ${MUTED} hover:text-[#171A17] dark:hover:text-[#F3F0E9] transition-colors`}
            >
              ← Dashboard
            </Link>
          </div>
        </div>

        {/* Headline numbers */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {headline.map((s) => (
            <div key={s.label} className={CARD}>
              <p className={`${EYEBROW} mb-2`}>{s.label}</p>
              <p className="text-3xl font-serif tabular-nums">{s.value === null ? '—' : s.value.toLocaleString('en-IN')}</p>
              {s.sub && <p className={`text-[11px] mt-1 ${MUTED}`}>{s.sub}</p>}
            </div>
          ))}
        </div>

        {/* Tabs */}
        <nav className="flex gap-6 border-b border-black/[0.06] dark:border-white/[0.08] mb-8">
          {tabs.map((t) => {
            const active = t.value === tab
            return (
              <Link
                key={t.value}
                href={adminHref({ tab: t.value })}
                className={`pb-3 -mb-px text-[11px] uppercase tracking-widest border-b-2 transition-colors ${
                  active
                    ? 'border-[#4D6A51] dark:border-[#8FAA91] text-[#171A17] dark:text-[#F3F0E9] font-bold'
                    : `border-transparent ${MUTED} hover:text-[#171A17] dark:hover:text-[#F3F0E9]`
                }`}
              >
                {t.label}
                {t.badge !== undefined && <span className="ml-1.5 tabular-nums opacity-60">{t.badge}</span>}
              </Link>
            )
          })}
        </nav>

        {savesRes.capped && (
          <p className="mb-6 text-[11px] text-[#B23A2E] dark:text-[#E8907F]">
            Showing stats for the newest {MAX_SAVES.toLocaleString('en-IN')} saves only. Time to move these counts into a SQL function.
          </p>
        )}

        {/* ---------------- Overview ---------------- */}
        {tab === 'overview' && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <DailyBars label="Saves per day" data={savesSeries} />
              <DailyBars label="New users per day" data={signupSeries} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div className={`${CARD} md:col-span-3`}>
                <p className={`${EYEBROW} mb-4`}>What people save</p>
                {catSum === 0 ? (
                  <p className={`text-sm ${MUTED}`}>No saves yet.</p>
                ) : (
                  <>
                    <StackedBar counts={catTotals} total={catSum} height="h-2.5" />
                    <ul className="mt-5 flex flex-col gap-2.5">
                      {catList.map((c) => (
                        <li key={c.cat} className="flex items-center gap-3 text-sm">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_COLORS[c.cat] }} />
                          <span className="w-20 shrink-0">{c.cat}</span>
                          <div className="flex-1 h-1.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06] overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${(c.count / catSum) * 100}%`, backgroundColor: CATEGORY_COLORS[c.cat] }}
                            />
                          </div>
                          <span className="w-24 text-right tabular-nums text-[12px]">
                            {c.count.toLocaleString('en-IN')}
                            <span className={`ml-1.5 ${MUTED}`}>{Math.round((c.count / catSum) * 100)}%</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>

              <div className={`${CARD} md:col-span-2`}>
                <p className={`${EYEBROW} mb-4`}>Most active this week</p>
                {topThisWeek.length === 0 ? (
                  <p className={`text-sm ${MUTED}`}>Nobody has saved anything in the last 7 days.</p>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {topThisWeek.map((u) => (
                      <li key={u.id} className="flex items-center gap-3">
                        <Avatar user={u} size="w-8 h-8" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm truncate">{u.name ?? u.email ?? 'Unknown'}</p>
                          <StackedBar counts={u.byCat} total={u.total} height="h-1 mt-1" />
                        </div>
                        <span className="text-sm tabular-nums">{u.week}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <Link
                  href={adminHref({ tab: 'users' })}
                  className={`inline-block mt-5 text-[10px] uppercase tracking-widest ${MUTED} hover:text-[#171A17] dark:hover:text-[#F3F0E9]`}
                >
                  All users →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ---------------- Users ---------------- */}
        {tab === 'users' && (() => {
          const totalPages = Math.max(1, Math.ceil(sortedUsers.length / USERS_PAGE_SIZE))
          const pageUsers = sortedUsers.slice((page - 1) * USERS_PAGE_SIZE, page * USERS_PAGE_SIZE)
          const sorts: { value: Sort; label: string }[] = [
            { value: 'active', label: 'Last active' },
            { value: 'saves', label: 'Most saves' },
            { value: 'joined', label: 'Newest' },
          ]
          return (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <h2 className="text-xl font-serif">Users</h2>
                <div className="flex flex-wrap gap-2">
                  {sorts.map((s) => (
                    <Link key={s.value} href={adminHref({ tab: 'users', sort: s.value })} className={`${PILL} ${s.value === sort ? PILL_ON : PILL_OFF}`}>
                      {s.label}
                    </Link>
                  ))}
                </div>
              </div>

              {pageUsers.length === 0 ? (
                <div className={`p-10 rounded-2xl border border-dashed border-black/[0.08] dark:border-white/[0.08] text-center text-sm ${MUTED}`}>
                  No users yet.
                </div>
              ) : (
                <ul className="flex flex-col gap-3">
                  {pageUsers.map((u) => (
                    <UserCard key={u.id} u={u} />
                  ))}
                </ul>
              )}

              <Pager
                page={page}
                totalPages={totalPages}
                prev={adminHref({ tab: 'users', sort, page: page - 1 })}
                next={adminHref({ tab: 'users', sort, page: page + 1 })}
              />
            </>
          )
        })()}

        {/* ---------------- Feedback ---------------- */}
        {tab === 'feedback' && (() => {
          const filteredTotal = feedbackRes.count ?? 0
          const totalPages = Math.max(1, Math.ceil(filteredTotal / FEEDBACK_PAGE_SIZE))
          const filters: { label: string; value: FeedbackType | null; count: number }[] = [
            { label: 'All', value: null, count: allFeedback },
            { label: 'Ideas', value: 'idea', count: typeCounts.idea },
            { label: 'Problems', value: 'problem', count: typeCounts.problem },
            { label: 'Other', value: 'other', count: typeCounts.other },
          ]
          return (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <h2 className="text-xl font-serif">
                  Feedback <span className={`text-sm ${MUTED}`}>· {weekFeedback} in the last 7 days</span>
                </h2>
                <div className="flex flex-wrap gap-2">
                  {filters.map((f) => (
                    <Link
                      key={f.label}
                      href={adminHref({ tab: 'feedback', type: f.value })}
                      className={`${PILL} ${f.value === type ? PILL_ON : PILL_OFF}`}
                    >
                      {f.label} <span className="tabular-nums opacity-70">{f.count}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {feedbackRows.length === 0 ? (
                <div className={`p-10 rounded-2xl border border-dashed border-black/[0.08] dark:border-white/[0.08] text-center text-sm ${MUTED}`}>
                  No feedback here yet.
                </div>
              ) : (
                <ul className="flex flex-col gap-3">
                  {feedbackRows.map((r) => {
                    const email = emails.get(r.user_id)
                    return (
                      <li key={r.id} className={CARD}>
                        <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 mb-3 text-[11px] ${MUTED}`}>
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

              <Pager
                page={page}
                totalPages={totalPages}
                prev={adminHref({ tab: 'feedback', type, page: page - 1 })}
                next={adminHref({ tab: 'feedback', type, page: page + 1 })}
              />
            </>
          )
        })()}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------
function Avatar({ user, size }: { user: Pick<UserStat, 'avatar' | 'name' | 'email'>; size: string }) {
  const initial = (user.name ?? user.email ?? '?').charAt(0).toUpperCase()
  if (user.avatar) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={user.avatar} alt="" referrerPolicy="no-referrer" className={`${size} rounded-full object-cover shrink-0`} />
    )
  }
  return (
    <span className={`${size} rounded-full shrink-0 grid place-items-center text-xs font-bold bg-[#E8EFE5] text-[#4D6A51] dark:bg-[#202820] dark:text-[#8FAA91]`}>
      {initial}
    </span>
  )
}

function StackedBar({ counts, total, height }: { counts: Record<Category, number>; total: number; height: string }) {
  if (total === 0) return <div className={`${height} rounded-full bg-black/[0.04] dark:bg-white/[0.06]`} />
  return (
    <div className={`${height} flex rounded-full overflow-hidden bg-black/[0.04] dark:bg-white/[0.06]`}>
      {CATEGORIES.filter((c) => counts[c] > 0).map((c) => (
        <div key={c} title={`${c}: ${counts[c]}`} style={{ width: `${(counts[c] / total) * 100}%`, backgroundColor: CATEGORY_COLORS[c] }} />
      ))}
    </div>
  )
}

function DailyBars({ label, data }: { label: string; data: { day: string; count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count))
  const total = data.reduce((n, d) => n + d.count, 0)
  return (
    <div className={CARD}>
      <div className="flex items-baseline justify-between mb-4">
        <p className={EYEBROW}>{label}</p>
        <p className={`text-[11px] tabular-nums ${MUTED}`}>{total.toLocaleString('en-IN')} in 30 days</p>
      </div>
      <div className="flex items-end gap-[3px] h-28">
        {data.map((d) => (
          <div key={d.day} title={`${shortDay(d.day)}: ${d.count}`} className="flex-1 h-full flex items-end">
            <div
              className="w-full rounded-sm bg-[#4D6A51] dark:bg-[#8FAA91]"
              style={{ height: d.count ? `${Math.max(6, (d.count / max) * 100)}%` : '2px', opacity: d.count ? 1 : 0.2 }}
            />
          </div>
        ))}
      </div>
      <div className={`flex justify-between mt-2 text-[10px] ${MUTED}`}>
        <span>{shortDay(data[0].day)}</span>
        <span>Today</span>
      </div>
    </div>
  )
}

function UserCard({ u }: { u: UserStat }) {
  const top = CATEGORIES.filter((c) => u.byCat[c] > 0)
    .sort((a, b) => u.byCat[b] - u.byCat[a])
    .slice(0, 3)
  const cells = [
    { label: 'Saves', value: u.total.toLocaleString('en-IN') },
    { label: '7 days', value: u.week.toLocaleString('en-IN') },
    { label: 'Last save', value: ago(u.lastSaveMs) },
    { label: 'Joined', value: shortDateFmt.format(new Date(u.joinedMs)) },
  ]
  return (
    <li className={CARD}>
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        {/* Who */}
        <div className="flex items-center gap-3 min-w-0 lg:w-64 shrink-0">
          <Avatar user={u} size="w-10 h-10" />
          <div className="min-w-0">
            <p className="text-sm font-medium truncate" title={u.lastSignInMs ? `Last signed in ${dateFmt.format(new Date(u.lastSignInMs))}` : undefined}>
              {u.name ?? 'No name'}
            </p>
            {u.email ? (
              <a href={`mailto:${u.email}`} className={`block text-[11px] truncate ${MUTED} hover:text-[#4D6A51] dark:hover:text-[#8FAA91]`}>
                {u.email}
              </a>
            ) : (
              <p className={`text-[11px] ${MUTED}`}>No email</p>
            )}
          </div>
        </div>

        {/* Numbers */}
        <div className="grid grid-cols-4 gap-3 lg:w-80 shrink-0">
          {cells.map((c) => (
            <div key={c.label}>
              <p className={`text-[9px] uppercase tracking-widest ${MUTED}`}>{c.label}</p>
              <p className="text-sm tabular-nums mt-0.5">{c.value}</p>
            </div>
          ))}
        </div>

        {/* What they save */}
        <div className="flex-1 min-w-0">
          <StackedBar counts={u.byCat} total={u.total} height="h-1.5" />
          <p className={`mt-2 text-[11px] ${MUTED} truncate`}>
            {top.length === 0
              ? 'No saves yet'
              : top.map((c) => `${c} ${Math.round((u.byCat[c] / u.total) * 100)}%`).join(' · ')}
          </p>
        </div>
      </div>
    </li>
  )
}

function Pager({ page, totalPages, prev, next }: { page: number; totalPages: number; prev: string; next: string }) {
  if (totalPages <= 1) return null
  return (
    <div className={`flex items-center justify-between mt-8 text-[10px] uppercase tracking-widest ${MUTED}`}>
      {page > 1 ? <Link href={prev} className="hover:text-[#171A17] dark:hover:text-[#F3F0E9]">← Previous</Link> : <span />}
      <span className="tabular-nums">Page {page} of {totalPages}</span>
      {page < totalPages ? <Link href={next} className="hover:text-[#171A17] dark:hover:text-[#F3F0E9]">Next →</Link> : <span />}
    </div>
  )
}