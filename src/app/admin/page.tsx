// src/app/admin/page.tsx
// Server side only: checks you're the admin, reads the numbers with the secret key, and hands
// plain data to <AdminView /> (the screen you see). No titles, notes or page content are read.
import { notFound, redirect } from 'next/navigation'
import { Instrument_Serif } from 'next/font/google'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { isAdmin } from '@/lib/admin'
import { MEDIA_TYPE_MATCHERS } from '@/lib/bookmarkQuery'
import AdminView from '@/components/admin/AdminView'
import {
  ADMIN_TABS,
  FEEDBACK_TYPES,
  GROUP_KEYS,
  emptyGroups,
  type AdminData,
  type AdminTab,
  type AdminUser,
  type FeedbackItem,
  type FeedbackType,
  type GroupKey,
} from '@/components/admin/adminTypes'
import './admin.css'

// Always fresh, never cached, never indexed by search engines.
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Admin · inntoit', robots: { index: false, follow: false } }

const serif = Instrument_Serif({ weight: '400', subsets: ['latin'], variable: '--font-admin-serif', display: 'swap' })

const FEEDBACK_PAGE_SIZE = 50
const MAX_SAVES = 20000 // safety cap. Long before this, move the counting into a SQL function.
const DAY = 24 * 60 * 60 * 1000
const NOT_A_FOLDER = new Set(['Inbox', 'Uncategorized'])

// type value -> dashboard group, built from the dashboard's own matcher list so the two never drift apart.
const TYPE_TO_GROUP = new Map<string, GroupKey>()
for (const [group, types] of Object.entries(MEDIA_TYPE_MATCHERS)) {
  if ((GROUP_KEYS as readonly string[]).includes(group)) {
    for (const t of types) TYPE_TO_GROUP.set(t, group as GroupKey)
  }
}

type SaveRow = { user_id: string; type: string | null; category: string | null; created_at: string }
type FeedbackRow = {
  id: number
  user_id: string
  type: FeedbackType
  message: string
  user_agent: string | null
  created_at: string
}

// ---------- formatting (done here, in India time, so the browser never disagrees) ----------
const tz = 'Asia/Kolkata'
const fullFmt = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: tz })
const shortFmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', timeZone: tz })
const timeFmt = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', timeZone: tz })
const keyFmt = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: tz })
const dayKey = (ms: number) => keyFmt.format(new Date(ms))

function ago(ms: number | null, now: number) {
  if (!ms) return 'Never'
  const s = Math.max(0, (now - ms) / 1000)
  if (s < 60) return 'Just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  if (s < 30 * 86400) return `${Math.floor(s / 86400)}d ago`
  return shortFmt.format(new Date(ms))
}

function meta(u: User, ...keys: string[]) {
  const m = (u.user_metadata ?? {}) as Record<string, unknown>
  for (const k of keys) {
    const v = m[k]
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  return null
}

// "iPhone · Safari" from a long user-agent string.
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

async function fetchAllSaves(admin: ReturnType<typeof createAdminClient>) {
  const rows: SaveRow[] = []
  const STEP = 1000 // Supabase returns at most 1000 rows per request
  for (let from = 0; from < MAX_SAVES; from += STEP) {
    const { data, error } = await admin
      .from('bookmarks')
      .select('user_id, type, category, created_at')
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

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; type?: string; page?: string }>
}) {
  // 1. Who is asking? Normal (cookie) client, exactly like the dashboard.
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  if (!isAdmin(user.id)) notFound() // non-admins see a plain 404

  // 2. Read the URL (?tab=feedback&type=problem&page=2).
  const params = await searchParams
  const tab: AdminTab = (ADMIN_TABS as readonly string[]).includes(params.tab ?? '') ? (params.tab as AdminTab) : 'overview'
  const fbType: FeedbackType | null = (FEEDBACK_TYPES as readonly string[]).includes(params.type ?? '')
    ? (params.type as FeedbackType)
    : null
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1)

  // 3. Everything below uses the secret key and skips RLS. Safe only because of the check above.
  const admin = createAdminClient()
  const now = Date.now()
  const weekAgoMs = now - 7 * DAY

  let feedbackQuery = admin
    .from('feedback')
    .select('id, user_id, type, message, user_agent, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * FEEDBACK_PAGE_SIZE, page * FEEDBACK_PAGE_SIZE - 1)
  if (fbType) feedbackQuery = feedbackQuery.eq('type', fbType)

  const [usersRes, savesRes, saveCountRes, feedbackRes, weekFeedbackRes, typeCountRes] = await Promise.all([
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    fetchAllSaves(admin),
    admin.from('bookmarks').select('*', { count: 'exact', head: true }),
    feedbackQuery,
    admin.from('feedback').select('*', { count: 'exact', head: true }).gte('created_at', new Date(weekAgoMs).toISOString()),
    Promise.all(FEEDBACK_TYPES.map((t) => admin.from('feedback').select('*', { count: 'exact', head: true }).eq('type', t))),
  ])

  // 4. Per-person numbers.
  const userList: User[] = usersRes.error ? [] : usersRes.data.users
  type Acc = { user: AdminUser; folderSet: Set<string>; organized: number; lastSignInMs: number | null }
  const acc = new Map<string, Acc>()
  for (const u of userList) {
    acc.set(u.id, {
      user: {
        id: u.id,
        email: u.email ?? null,
        name: meta(u, 'full_name', 'name'),
        avatar: meta(u, 'avatar_url', 'picture'),
        total: 0,
        week: 0,
        groups: emptyGroups(),
        folders: 0,
        organizedPct: 0,
        lastSaveMs: null,
        joinedMs: new Date(u.created_at).getTime(),
        lastSaveLabel: '',
        joinedLabel: '',
        lastSignInLabel: '',
      },
      folderSet: new Set(),
      organized: 0,
      lastSignInMs: u.last_sign_in_at ? new Date(u.last_sign_in_at).getTime() : null,
    })
  }

  const groupTotals = emptyGroups()
  const rawByGroup = new Map<GroupKey, Map<string, number>>()
  const savesByDay = new Map<string, number>()
  let savesWeek = 0
  let organized = 0
  let inbox = 0
  let unsorted = 0

  for (const s of savesRes.rows) {
    const raw = (s.type || 'link').toLowerCase() // null is treated as link, same as the dashboard
    const group = TYPE_TO_GROUP.get(raw) ?? 'other'
    groupTotals[group]++
    const inner = rawByGroup.get(group) ?? new Map<string, number>()
    inner.set(raw, (inner.get(raw) ?? 0) + 1)
    rawByGroup.set(group, inner)

    const folder = s.category?.trim() || 'Uncategorized'
    const inFolder = !NOT_A_FOLDER.has(folder)
    if (inFolder) organized++
    else if (folder === 'Inbox') inbox++
    else unsorted++

    const ms = new Date(s.created_at).getTime()
    const inWeek = ms >= weekAgoMs
    if (inWeek) savesWeek++
    const k = dayKey(ms)
    savesByDay.set(k, (savesByDay.get(k) ?? 0) + 1)

    const a = acc.get(s.user_id)
    if (a) {
      a.user.total++
      if (inWeek) a.user.week++
      a.user.groups[group]++
      if (inFolder) {
        a.organized++
        a.folderSet.add(folder)
      }
      if (!a.user.lastSaveMs || ms > a.user.lastSaveMs) a.user.lastSaveMs = ms
    }
  }

  const users: AdminUser[] = [...acc.values()].map((a) => ({
    ...a.user,
    folders: a.folderSet.size,
    organizedPct: a.user.total ? Math.round((a.organized / a.user.total) * 100) : 0,
    lastSaveLabel: ago(a.user.lastSaveMs, now),
    joinedLabel: shortFmt.format(new Date(a.user.joinedMs)),
    lastSignInLabel: ago(a.lastSignInMs, now),
  }))

  const signupsByDay = new Map<string, number>()
  for (const u of users) signupsByDay.set(dayKey(u.joinedMs), (signupsByDay.get(dayKey(u.joinedMs)) ?? 0) + 1)

  const last30 = Array.from({ length: 30 }, (_, i) => now - (29 - i) * DAY)
  const series = (m: Map<string, number>) =>
    last30.map((ms) => {
      const day = dayKey(ms)
      return { day, label: shortFmt.format(new Date(ms)), count: m.get(day) ?? 0 }
    })

  // 5. Feedback.
  if (feedbackRes.error) console.error('admin feedback failed:', feedbackRes.error.message)
  const fbRows = feedbackRes.error ? [] : ((feedbackRes.data ?? []) as FeedbackRow[])
  const emails = new Map<string, string | null>(users.map((u) => [u.id, u.email]))
  const missing = [...new Set(fbRows.map((r) => r.user_id))].filter((id) => !emails.has(id))
  await Promise.all(
    missing.map(async (id) => {
      const { data } = await admin.auth.admin.getUserById(id)
      emails.set(id, data.user?.email ?? null)
    }),
  )
  const feedbackItems: FeedbackItem[] = fbRows.map((r) => ({
    id: r.id,
    type: r.type,
    message: r.message,
    email: emails.get(r.user_id) ?? null,
    dateLabel: fullFmt.format(new Date(r.created_at)),
    device: shortDevice(r.user_agent),
    userAgent: r.user_agent,
  }))
  const fbCounts = Object.fromEntries(
    FEEDBACK_TYPES.map((t, i) => [t, typeCountRes[i].count ?? 0]),
  ) as Record<FeedbackType, number>

  const data: AdminData = {
    tab,
    updatedLabel: timeFmt.format(new Date(now)),
    capped: savesRes.capped,
    maxSaves: MAX_SAVES,
    headline: {
      users: usersRes.error ? null : (usersRes.data as { total?: number }).total || userList.length,
      newUsersWeek: users.filter((u) => u.joinedMs >= weekAgoMs).length,
      activeWeek: users.filter((u) => u.week > 0).length,
      saves: saveCountRes.count ?? savesRes.rows.length,
      savesWeek,
      everSaved: users.filter((u) => u.total > 0).length,
    },
    savesSeries: series(savesByDay),
    signupSeries: series(signupsByDay),
    groups: GROUP_KEYS.map((key) => ({
      key,
      total: groupTotals[key],
      raw: [...(rawByGroup.get(key) ?? new Map<string, number>()).entries()]
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count),
    })),
    groupTotal: savesRes.rows.length,
    folders: {
      organized,
      inbox,
      unsorted,
      usersWithFolders: [...acc.values()].filter((a) => a.folderSet.size > 0).length,
    },
    users,
    feedback: {
      rows: feedbackItems,
      type: fbType,
      page,
      totalPages: Math.max(1, Math.ceil((feedbackRes.count ?? 0) / FEEDBACK_PAGE_SIZE)),
      counts: fbCounts,
      all: FEEDBACK_TYPES.reduce((n, t) => n + fbCounts[t], 0),
      week: weekFeedbackRes.count ?? 0,
    },
  }

  return (
    <div className={serif.variable}>
      <AdminView data={data} />
    </div>
  )
}