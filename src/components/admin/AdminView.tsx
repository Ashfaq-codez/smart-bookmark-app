// src/components/admin/AdminView.tsx
// Everything you see on /admin. Gets plain data from src/app/admin/page.tsx.
'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import {
  Activity,
  ArrowLeft,
  AtSign,
  Bookmark,
  Bug,
  ChevronDown,
  FileText,
  FolderOpen,
  Image as ImageIcon,
  LayoutGrid,
  Lightbulb,
  Link2,
  Mail,
  MessageSquare,
  PenLine,
  Play,
  Search,
  Shapes,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react'
import AdminAutoRefresh from '@/components/AdminAutoRefresh'
import {
  GROUP_KEYS,
  type AdminData,
  type AdminTab,
  type AdminUser,
  type DayPoint,
  type FeedbackType,
  type GroupKey,
  type GroupStat,
} from './adminTypes'

// ---------------------------------------------------------------------------
// Look and feel
// ---------------------------------------------------------------------------
const CARD = 'rounded-3xl bg-white dark:bg-[#1A1D1A] border border-black/[0.05] dark:border-white/[0.06]'
const EYEBROW = 'text-[10px] uppercase tracking-[0.18em] font-semibold text-[#737B73] dark:text-[#8F998F]'
const MUTED = 'text-[#737B73] dark:text-[#8F998F]'
const FOCUS =
  'outline-none focus-visible:ring-2 focus-visible:ring-[#4D6A51]/50 dark:focus-visible:ring-[#8FAA91]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FBF9F4] dark:focus-visible:ring-offset-[#151815]'
const ON = 'bg-[#171A17] text-white dark:bg-[#F3F0E9] dark:text-[#151815]'
const SPRING = { type: 'spring', stiffness: 380, damping: 34 } as const

// Same names as the dashboard pills. Colours match the pill icon tints.
const GROUP_META: Record<GroupKey, { label: string; Icon: LucideIcon; color: string; tint: string }> = {
  link: { label: 'Links', Icon: Link2, color: '#0EA5E9', tint: 'text-sky-600 dark:text-sky-400' },
  note: { label: 'Notes', Icon: PenLine, color: '#F59E0B', tint: 'text-amber-600 dark:text-amber-400' },
  image: { label: 'Images', Icon: ImageIcon, color: '#8B5CF6', tint: 'text-violet-600 dark:text-violet-400' },
  videos: { label: 'Videos', Icon: Play, color: '#F43F5E', tint: 'text-rose-600 dark:text-rose-400' },
  documents: { label: 'Documents', Icon: FileText, color: '#F97316', tint: 'text-orange-600 dark:text-orange-400' },
  socials: { label: 'Socials', Icon: AtSign, color: '#14B8A6', tint: 'text-teal-600 dark:text-teal-400' },
  other: { label: 'Other', Icon: Shapes, color: '#A9B0A9', tint: 'text-[#737B73] dark:text-[#8F998F]' },
}

// The raw `type` values inside each group. Colours match the top lines on your cards.
const RAW_META: Record<string, { label: string; color: string }> = {
  link: { label: 'Web links', color: '#0EA5E9' },
  note: { label: 'Notes', color: '#F59E0B' },
  image: { label: 'Images', color: '#8B5CF6' },
  video: { label: 'Uploaded videos', color: '#F43F5E' },
  youtube: { label: 'YouTube', color: '#FF0000' },
  pdf: { label: 'PDFs', color: '#F97316' },
  file: { label: 'Files', color: '#FB923C' },
  twitter: { label: 'X / Twitter', color: '#1DA1F2' },
  instagram: { label: 'Instagram', color: '#E1306C' },
  pinterest: { label: 'Pinterest', color: '#E60023' },
  linkedin: { label: 'LinkedIn', color: '#0A66C2' },
  github: { label: 'GitHub', color: '#6E7681' },
}

const FEEDBACK_META: Record<FeedbackType, { label: string; Icon: LucideIcon; chip: string }> = {
  idea: { label: 'Idea', Icon: Lightbulb, chip: 'bg-[#E8EFE5] text-[#4D6A51] dark:bg-[#202820] dark:text-[#8FAA91]' },
  problem: { label: 'Problem', Icon: Bug, chip: 'bg-[#FBE9E7] text-[#B23A2E] dark:bg-[#2A1B19] dark:text-[#E8907F]' },
  other: { label: 'Other', Icon: MessageSquare, chip: 'bg-[#F1EEE6] text-[#737B73] dark:bg-[#22251F] dark:text-[#A9B0A9]' },
}

const fmt = (n: number | null) => (n === null ? '—' : n.toLocaleString('en-IN'))
const pct = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : 0)

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function AdminView({ data }: { data: AdminData }) {
  const [tab, setTab] = useState<AdminTab>(data.tab)
  const [openUserId, setOpenUserId] = useState<string | null>(null)

  const changeTab = (next: AdminTab) => {
    setTab(next)
    const url = new URL(window.location.href)
    if (next === 'overview') url.searchParams.delete('tab')
    else url.searchParams.set('tab', next)
    window.history.replaceState(null, '', url)
  }

  const openUser = (id: string) => {
    setOpenUserId(id)
    changeTab('users')
  }

  const h = data.headline
  const stats: { label: string; value: number | null; sub: string; Icon: LucideIcon }[] = [
    { label: 'People', value: h.users, sub: `+${fmt(h.newUsersWeek)} this week`, Icon: Users },
    { label: 'Active this week', value: h.activeWeek, sub: `${pct(h.activeWeek, h.users ?? 0)}% of everyone`, Icon: Activity },
    { label: 'Saves', value: h.saves, sub: `+${fmt(h.savesWeek)} this week`, Icon: Bookmark },
    {
      label: 'Saves per person',
      value: h.everSaved ? Math.round(h.saves / h.everSaved) : 0,
      sub: `${fmt(h.everSaved)} have saved something`,
      Icon: LayoutGrid,
    },
  ]

  const tabs: { value: AdminTab; label: string; badge?: number }[] = [
    { value: 'overview', label: 'Overview' },
    { value: 'users', label: 'People', badge: h.users ?? undefined },
    { value: 'feedback', label: 'Feedback', badge: data.feedback.week || undefined },
  ]

  return (
    <MotionConfig reducedMotion="user">
      <div
        data-admin-root
        className="min-h-dvh font-sans antialiased bg-[#FBF9F4] dark:bg-[#151815] text-[#171A17] dark:text-[#F3F0E9]"
      >
        <div className="mx-auto max-w-5xl px-4 sm:px-8 pt-4 sm:pt-8 pb-20">
          {/* Top bar: back on the left, live status on the right */}
          <header className="flex items-center justify-between gap-3">
            <Link
              href="/dashboard"
              className={`group inline-flex items-center gap-2 h-10 pl-1.5 pr-4 rounded-full bg-white dark:bg-[#1A1D1A] border border-black/[0.06] dark:border-white/[0.08] text-sm hover:border-black/20 dark:hover:border-white/25 transition-colors ${FOCUS}`}
            >
              <span className="w-7 h-7 grid place-items-center rounded-full bg-black/[0.04] dark:bg-white/[0.06]">
                <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
              </span>
              Dashboard
            </Link>
            <AdminAutoRefresh />
          </header>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-8 sm:mt-12 mb-6 sm:mb-8"
          >
            <p className={EYEBROW}>inntoit · Admin</p>
            <h1 className="admin-serif text-[2.6rem] sm:text-6xl leading-[1.05] mt-2">
              Who&rsquo;s saving <span className="italic text-[#4D6A51] dark:text-[#8FAA91]">what</span>
            </h1>
            <p className={`text-[12px] mt-2 ${MUTED}`}>Updated {data.updatedLabel}</p>
          </motion.div>

          {/* Headline numbers */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...SPRING, delay: 0.05 + i * 0.05 }}
                className={`${CARD} p-4 sm:p-5`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 grid place-items-center rounded-full bg-[#E8EFE5] text-[#4D6A51] dark:bg-[#202820] dark:text-[#8FAA91]">
                    <s.Icon className="w-3.5 h-3.5" />
                  </span>
                  <p className={`${EYEBROW} truncate`}>{s.label}</p>
                </div>
                <p className="admin-serif text-4xl sm:text-5xl mt-3 tabular-nums leading-none">{fmt(s.value)}</p>
                <p className={`text-[11px] mt-2 ${MUTED} truncate`}>{s.sub}</p>
              </motion.div>
            ))}
          </div>

          {/* Tabs */}
          <div
            role="tablist"
            aria-label="Admin sections"
            className="mt-8 grid grid-cols-3 sm:inline-grid p-1 rounded-full bg-black/[0.045] dark:bg-white/[0.05]"
          >
            {tabs.map((t) => {
              const active = t.value === tab
              return (
                <button
                  key={t.value}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => changeTab(t.value)}
                  className={`relative h-10 px-3 sm:px-6 rounded-full text-sm cursor-pointer ${FOCUS} ${
                    active ? 'text-[#171A17] dark:text-[#F3F0E9] font-medium' : `${MUTED} hover:text-[#171A17] dark:hover:text-[#F3F0E9]`
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="admin-tab"
                      className="absolute inset-0 rounded-full bg-white dark:bg-[#262A26] shadow-[0_2px_10px_rgba(0,0,0,0.06)]"
                      transition={SPRING}
                    />
                  )}
                  <span className="relative z-10 inline-flex items-center gap-1.5">
                    {t.label}
                    {t.badge !== undefined && <span className="text-[11px] tabular-nums opacity-55">{fmt(t.badge)}</span>}
                  </span>
                </button>
              )
            })}
          </div>

          {data.capped && (
            <p className="mt-4 text-[12px] text-[#B23A2E] dark:text-[#E8907F]">
              Showing stats for the newest {fmt(data.maxSaves)} saves only. Time to move these counts into a SQL function.
            </p>
          )}

          <AnimatePresence mode="wait" initial={false}>
            <motion.section
              key={tab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22 }}
              className="mt-6"
            >
              {tab === 'overview' && <Overview data={data} onOpenUser={openUser} />}
              {tab === 'users' && <PeopleTab users={data.users} openId={openUserId} setOpenId={setOpenUserId} />}
              {tab === 'feedback' && <FeedbackTab feedback={data.feedback} />}
            </motion.section>
          </AnimatePresence>
        </div>
      </div>
    </MotionConfig>
  )
}

// ---------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------
function Overview({ data, onOpenUser }: { data: AdminData; onOpenUser: (id: string) => void }) {
  const topWeek = useMemo(
    () => data.users.filter((u) => u.week > 0).sort((a, b) => b.week - a.week).slice(0, 5),
    [data.users],
  )
  return (
    <div className="grid gap-3">
      <div className="grid gap-3 md:grid-cols-2">
        <DailyBars title="Saves per day" points={data.savesSeries} />
        <DailyBars title="New people per day" points={data.signupSeries} />
      </div>
      <div className="grid gap-3 md:grid-cols-5">
        <GroupsCard className="md:col-span-3" groups={data.groups} total={data.groupTotal} />
        <div className="md:col-span-2 grid gap-3 content-start">
          <FoldersCard folders={data.folders} total={data.groupTotal} />
          <div className={`${CARD} p-5`}>
            <p className={EYEBROW}>Most active this week</p>
            {topWeek.length === 0 ? (
              <p className={`text-sm mt-4 ${MUTED}`}>Nobody has saved anything in the last 7 days.</p>
            ) : (
              <ul className="mt-3 -mx-2">
                {topWeek.map((u) => (
                  <li key={u.id}>
                    <button
                      type="button"
                      onClick={() => onOpenUser(u.id)}
                      className={`w-full flex items-center gap-3 p-2 rounded-2xl text-left cursor-pointer hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-colors ${FOCUS}`}
                    >
                      <Avatar user={u} size="w-8 h-8" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm truncate">{u.name ?? u.email ?? 'Unknown'}</span>
                        <StackedBar counts={u.groups} total={u.total} className="h-1 mt-1.5" />
                      </span>
                      <span className="admin-serif text-xl tabular-nums">{u.week}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function DailyBars({ title, points }: { title: string; points: DayPoint[] }) {
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(1, ...points.map((p) => p.count))
  const total = points.reduce((n, p) => n + p.count, 0)
  const shown = hover !== null ? points[hover] : null
  return (
    <div className={`${CARD} p-5`}>
      <p className={EYEBROW}>{title}</p>
      <p className="admin-serif text-4xl mt-2 tabular-nums leading-none">{fmt(shown ? shown.count : total)}</p>
      <p className={`text-[11px] mt-1.5 ${MUTED}`}>{shown ? shown.label : 'Last 30 days'}</p>
      <div className="mt-5 flex items-end gap-[3px] h-28" onMouseLeave={() => setHover(null)}>
        {points.map((p, i) => (
          <button
            key={p.day}
            type="button"
            aria-label={`${p.label}: ${p.count}`}
            onMouseEnter={() => setHover(i)}
            onFocus={() => setHover(i)}
            onBlur={() => setHover(null)}
            onClick={() => setHover(hover === i ? null : i)}
            className={`flex-1 h-full flex items-end rounded-[3px] cursor-pointer ${FOCUS}`}
          >
            <motion.span
              className={`block w-full rounded-[3px] transition-colors ${
                hover === i ? 'bg-[#171A17] dark:bg-[#F3F0E9]' : 'bg-[#4D6A51] dark:bg-[#8FAA91]'
              }`}
              style={{ opacity: p.count ? 1 : 0.18 }}
              initial={{ height: '0%' }}
              animate={{ height: p.count ? `${Math.max(6, (p.count / max) * 100)}%` : '3%' }}
              transition={{ ...SPRING, delay: i * 0.012 }}
            />
          </button>
        ))}
      </div>
      <div className={`flex justify-between mt-2 text-[10px] ${MUTED}`}>
        <span>{points[0]?.label}</span>
        <span>Today</span>
      </div>
    </div>
  )
}

function GroupsCard({ groups, total, className }: { groups: GroupStat[]; total: number; className?: string }) {
  const [open, setOpen] = useState<GroupKey | null>(null)
  const list = groups.filter((g) => g.total > 0).sort((a, b) => b.total - a.total)
  const counts = Object.fromEntries(groups.map((g) => [g.key, g.total])) as Record<GroupKey, number>
  return (
    <div className={`${CARD} p-5 ${className ?? ''}`}>
      <div className="flex items-baseline justify-between gap-3">
        <p className={EYEBROW}>What people save</p>
        <p className={`text-[11px] ${MUTED}`}>Tap a group for detail</p>
      </div>
      {total === 0 ? (
        <p className={`text-sm mt-4 ${MUTED}`}>No saves yet.</p>
      ) : (
        <>
          <StackedBar counts={counts} total={total} className="h-3 mt-4" />
          <ul className="mt-4 divide-y divide-black/[0.05] dark:divide-white/[0.06]">
            {list.map((g) => {
              const m = GROUP_META[g.key]
              const isOpen = open === g.key
              return (
                <li key={g.key}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? null : g.key)}
                    className={`w-full flex items-center gap-3 py-3 rounded-xl text-left cursor-pointer ${FOCUS}`}
                  >
                    <span className={`w-8 h-8 shrink-0 grid place-items-center rounded-full bg-black/[0.04] dark:bg-white/[0.06] ${m.tint}`}>
                      <m.Icon className="w-4 h-4" />
                    </span>
                    <span className="flex-1 text-sm">{m.label}</span>
                    <span className="text-sm tabular-nums">{fmt(g.total)}</span>
                    <span className={`w-10 text-right text-[11px] tabular-nums ${MUTED}`}>{pct(g.total, total)}%</span>
                    <ChevronDown className={`w-4 h-4 shrink-0 ${MUTED} transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        className="overflow-hidden"
                      >
                        <ul className="pl-11 pb-3 flex flex-col gap-2">
                          {g.raw.map((r) => {
                            const rm = RAW_META[r.type] ?? { label: r.type, color: '#A9B0A9' }
                            return (
                              <li key={r.type} className="flex items-center gap-2.5 text-[13px]">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: rm.color }} />
                                <span className="flex-1">{rm.label}</span>
                                <span className="tabular-nums">{fmt(r.count)}</span>
                                <span className={`w-10 text-right text-[11px] tabular-nums ${MUTED}`}>{pct(r.count, g.total)}%</span>
                                <span className="w-4" />
                              </li>
                            )
                          })}
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </div>
  )
}

function FoldersCard({ folders, total }: { folders: AdminData['folders']; total: number }) {
  const sorted = pct(folders.organized, total)
  const cells = [
    { label: 'Inbox', value: folders.inbox },
    { label: 'Unsorted', value: folders.unsorted },
    { label: 'Use folders', value: folders.usersWithFolders },
  ]
  return (
    <div className={`${CARD} p-5`}>
      <div className="flex items-center gap-2">
        <FolderOpen className={`w-4 h-4 ${MUTED}`} />
        <p className={EYEBROW}>Folders</p>
      </div>
      <p className="admin-serif text-4xl mt-3 tabular-nums leading-none">{sorted}%</p>
      <p className={`text-[11px] mt-1.5 ${MUTED}`}>of saves are sorted into a folder</p>
      <div className="h-1.5 mt-4 rounded-full bg-black/[0.05] dark:bg-white/[0.07] overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-[#4D6A51] dark:bg-[#8FAA91]"
          initial={{ width: '0%' }}
          animate={{ width: `${sorted}%` }}
          transition={SPRING}
        />
      </div>
      <dl className="grid grid-cols-3 gap-2 mt-4">
        {cells.map((c) => (
          <div key={c.label} className="rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] px-2 py-2.5 text-center">
            <dt className={`text-[10px] ${MUTED}`}>{c.label}</dt>
            <dd className="text-sm tabular-nums mt-0.5">{fmt(c.value)}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

// ---------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------
type Sort = 'active' | 'saves' | 'joined'
const SORTS: { value: Sort; label: string }[] = [
  { value: 'active', label: 'Recent' },
  { value: 'saves', label: 'Most saves' },
  { value: 'joined', label: 'Newest' },
]
const PAGE = 30

function PeopleTab({
  users,
  openId,
  setOpenId,
}: {
  users: AdminUser[]
  openId: string | null
  setOpenId: (id: string | null) => void
}) {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<Sort>('active')
  const [limit, setLimit] = useState(PAGE)

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    const found = q
      ? users.filter((u) => (u.name ?? '').toLowerCase().includes(q) || (u.email ?? '').toLowerCase().includes(q))
      : users
    return [...found].sort((a, b) => {
      if (sort === 'saves') return b.total - a.total || (b.lastSaveMs ?? 0) - (a.lastSaveMs ?? 0)
      if (sort === 'joined') return b.joinedMs - a.joinedMs
      return (b.lastSaveMs ?? 0) - (a.lastSaveMs ?? 0) || b.joinedMs - a.joinedMs
    })
  }, [users, query, sort])

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-2.5 sm:items-center">
        <label
          className={`flex-1 flex items-center gap-2.5 h-11 px-4 rounded-full bg-white dark:bg-[#1A1D1A] border border-black/[0.06] dark:border-white/[0.08] focus-within:border-[#4D6A51]/50 dark:focus-within:border-[#8FAA91]/50 transition-colors`}
        >
          <Search className={`w-4 h-4 shrink-0 ${MUTED}`} />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setLimit(PAGE)
            }}
            placeholder="Search name or email"
            autoComplete="off"
            spellCheck={false}
            aria-label="Search people"
            className="flex-1 min-w-0 bg-transparent appearance-none outline-none text-sm placeholder:text-[#A0A6A0] dark:placeholder:text-[#6B736B]"
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQuery('')}
              className={`w-6 h-6 grid place-items-center rounded-full bg-black/[0.05] dark:bg-white/[0.08] cursor-pointer ${FOCUS}`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </label>

        <div role="radiogroup" aria-label="Sort people" className="grid grid-cols-3 p-1 rounded-full bg-black/[0.045] dark:bg-white/[0.05]">
          {SORTS.map((s) => {
            const active = s.value === sort
            return (
              <button
                key={s.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setSort(s.value)}
                className={`relative h-9 px-3.5 rounded-full text-[13px] cursor-pointer whitespace-nowrap ${FOCUS} ${
                  active ? 'text-[#171A17] dark:text-[#F3F0E9] font-medium' : MUTED
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="admin-sort"
                    className="absolute inset-0 rounded-full bg-white dark:bg-[#262A26] shadow-[0_2px_10px_rgba(0,0,0,0.06)]"
                    transition={SPRING}
                  />
                )}
                <span className="relative z-10">{s.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <p className={`text-[12px] mt-4 mb-3 ${MUTED}`}>
        {list.length === users.length ? `${fmt(users.length)} people` : `${fmt(list.length)} of ${fmt(users.length)} people`}
      </p>

      {list.length === 0 ? (
        <div className={`p-10 rounded-3xl border border-dashed border-black/[0.08] dark:border-white/[0.08] text-center text-sm ${MUTED}`}>
          {query ? 'No one matches that search.' : 'No one has signed up yet.'}
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {list.slice(0, limit).map((u) => (
            <PersonRow key={u.id} u={u} open={openId === u.id} onToggle={() => setOpenId(openId === u.id ? null : u.id)} />
          ))}
        </ul>
      )}

      {list.length > limit && (
        <button
          type="button"
          onClick={() => setLimit((n) => n + PAGE)}
          className={`mt-4 w-full h-11 rounded-full border border-black/[0.08] dark:border-white/[0.1] text-sm cursor-pointer hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-colors ${FOCUS}`}
        >
          Show {Math.min(PAGE, list.length - limit)} more
        </button>
      )}
    </div>
  )
}

function PersonRow({ u, open, onToggle }: { u: AdminUser; open: boolean; onToggle: () => void }) {
  const details = [
    { label: 'Saves', value: fmt(u.total) },
    { label: 'This week', value: fmt(u.week) },
    { label: 'Last save', value: u.lastSaveLabel },
    { label: 'Joined', value: u.joinedLabel },
    { label: 'Last sign-in', value: u.lastSignInLabel },
    { label: 'Folders', value: u.total ? `${u.folders} · ${u.organizedPct}% sorted` : '—' },
  ]
  const used = GROUP_KEYS.filter((k) => u.groups[k] > 0).sort((a, b) => u.groups[b] - u.groups[a])

  return (
    <li className={`${CARD} overflow-hidden`}>
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className={`w-full flex items-center gap-3 p-3 sm:p-4 text-left cursor-pointer rounded-3xl ${FOCUS}`}
      >
        <Avatar user={u} size="w-10 h-10" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium truncate">{u.name ?? 'No name'}</span>
          <span className={`block text-[12px] truncate ${MUTED}`}>{u.email ?? 'No email'}</span>
        </span>
        <span className="hidden sm:block w-40 shrink-0">
          <StackedBar counts={u.groups} total={u.total} className="h-1.5" />
        </span>
        <span className="shrink-0 text-right w-16">
          <span className="block admin-serif text-2xl tabular-nums leading-none">{fmt(u.total)}</span>
          <span className={`block text-[10px] mt-1 ${MUTED}`}>{u.lastSaveLabel}</span>
        </span>
        <ChevronDown className={`w-4 h-4 shrink-0 ${MUTED} transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-3 border-t border-black/[0.05] dark:border-white/[0.06]">
              <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
                {details.map((d) => (
                  <div key={d.label}>
                    <dt className={`text-[10px] uppercase tracking-widest ${MUTED}`}>{d.label}</dt>
                    <dd className="text-sm tabular-nums mt-0.5">{d.value}</dd>
                  </div>
                ))}
              </dl>

              <p className={`${EYEBROW} mt-5 mb-2.5`}>What they save</p>
              {used.length === 0 ? (
                <p className={`text-sm ${MUTED}`}>Nothing saved yet.</p>
              ) : (
                <>
                  <StackedBar counts={u.groups} total={u.total} className="h-2 mb-3" />
                  <div className="flex flex-wrap gap-1.5">
                    {used.map((k) => {
                      const m = GROUP_META[k]
                      return (
                        <span
                          key={k}
                          className="inline-flex items-center gap-1.5 h-8 pl-1 pr-3 rounded-full bg-black/[0.04] dark:bg-white/[0.06] text-[12px]"
                        >
                          <span className={`w-6 h-6 grid place-items-center rounded-full bg-white dark:bg-[#1A1D1A] ${m.tint}`}>
                            <m.Icon className="w-3.5 h-3.5" />
                          </span>
                          {m.label}
                          <span className={`tabular-nums ${MUTED}`}>{u.groups[k]}</span>
                        </span>
                      )
                    })}
                  </div>
                </>
              )}

              {u.email && (
                <a
                  href={`mailto:${u.email}`}
                  className={`mt-5 inline-flex items-center gap-2 h-9 px-4 rounded-full text-[13px] ${ON} hover:opacity-90 transition-opacity ${FOCUS}`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  Email {u.name?.split(' ')[0] ?? 'them'}
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  )
}

// ---------------------------------------------------------------------------
// Feedback
// ---------------------------------------------------------------------------
function feedbackHref(type: FeedbackType | null, page = 1) {
  const q = new URLSearchParams({ tab: 'feedback' })
  if (type) q.set('type', type)
  if (page > 1) q.set('page', String(page))
  return `/admin?${q.toString()}`
}

function FeedbackTab({ feedback }: { feedback: AdminData['feedback'] }) {
  const filters: { label: string; value: FeedbackType | null; count: number }[] = [
    { label: 'All', value: null, count: feedback.all },
    { label: 'Ideas', value: 'idea', count: feedback.counts.idea },
    { label: 'Problems', value: 'problem', count: feedback.counts.problem },
    { label: 'Other', value: 'other', count: feedback.counts.other },
  ]
  return (
    <div>
      <div className="flex gap-2 overflow-x-auto admin-no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
        {filters.map((f) => {
          const active = f.value === feedback.type
          return (
            <Link
              key={f.label}
              href={feedbackHref(f.value)}
              scroll={false}
              className={`shrink-0 inline-flex items-center gap-2 h-9 px-4 rounded-full text-[13px] border transition-colors ${FOCUS} ${
                active
                  ? `${ON} border-transparent`
                  : 'bg-white dark:bg-[#1A1D1A] border-black/[0.07] dark:border-white/10 hover:border-black/20 dark:hover:border-white/25'
              }`}
            >
              {f.label}
              <span className="text-[11px] tabular-nums opacity-60">{fmt(f.count)}</span>
            </Link>
          )
        })}
      </div>

      <p className={`text-[12px] mt-4 mb-3 ${MUTED}`}>{fmt(feedback.week)} in the last 7 days</p>

      {feedback.rows.length === 0 ? (
        <div className={`p-10 rounded-3xl border border-dashed border-black/[0.08] dark:border-white/[0.08] text-center text-sm ${MUTED}`}>
          No feedback here yet.
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {feedback.rows.map((r, i) => {
            const m = FEEDBACK_META[r.type] ?? FEEDBACK_META.other
            return (
              <motion.li
                key={r.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...SPRING, delay: Math.min(i, 10) * 0.03 }}
                className={`${CARD} p-4 sm:p-5`}
              >
                <div className={`flex flex-wrap items-center gap-x-2.5 gap-y-1.5 mb-3 text-[12px] ${MUTED}`}>
                  <span className={`inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[10px] uppercase tracking-widest font-semibold ${m.chip}`}>
                    <m.Icon className="w-3 h-3" />
                    {m.label}
                  </span>
                  {r.email ? (
                    <a href={`mailto:${r.email}`} className="hover:text-[#4D6A51] dark:hover:text-[#8FAA91] hover:underline underline-offset-2 truncate max-w-full">
                      {r.email}
                    </a>
                  ) : (
                    <span>Deleted user</span>
                  )}
                  <span aria-hidden>·</span>
                  <span>{r.dateLabel}</span>
                  <span aria-hidden>·</span>
                  <span title={r.userAgent ?? undefined}>{r.device}</span>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{r.message}</p>
              </motion.li>
            )
          })}
        </ul>
      )}

      {feedback.totalPages > 1 && (
        <div className={`flex items-center justify-between mt-6 text-[13px] ${MUTED}`}>
          {feedback.page > 1 ? (
            <Link href={feedbackHref(feedback.type, feedback.page - 1)} className={`h-9 px-4 inline-flex items-center rounded-full border border-black/[0.08] dark:border-white/[0.1] hover:text-[#171A17] dark:hover:text-[#F3F0E9] ${FOCUS}`}>
              Newer
            </Link>
          ) : (
            <span />
          )}
          <span className="tabular-nums">
            {feedback.page} / {feedback.totalPages}
          </span>
          {feedback.page < feedback.totalPages ? (
            <Link href={feedbackHref(feedback.type, feedback.page + 1)} className={`h-9 px-4 inline-flex items-center rounded-full border border-black/[0.08] dark:border-white/[0.1] hover:text-[#171A17] dark:hover:text-[#F3F0E9] ${FOCUS}`}>
              Older
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Small pieces
// ---------------------------------------------------------------------------
function Avatar({ user, size }: { user: Pick<AdminUser, 'avatar' | 'name' | 'email'>; size: string }) {
  const [broken, setBroken] = useState(false)
  if (user.avatar && !broken) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.avatar}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
        className={`${size} rounded-full object-cover shrink-0`}
      />
    )
  }
  return (
    <span className={`${size} shrink-0 grid place-items-center rounded-full text-xs font-semibold bg-[#E8EFE5] text-[#4D6A51] dark:bg-[#202820] dark:text-[#8FAA91]`}>
      {(user.name ?? user.email ?? '?').charAt(0).toUpperCase()}
    </span>
  )
}

function StackedBar({ counts, total, className }: { counts: Record<GroupKey, number>; total: number; className: string }) {
  return (
    <span className={`flex gap-[2px] overflow-hidden rounded-full bg-black/[0.05] dark:bg-white/[0.07] ${className}`}>
      {total > 0 &&
        GROUP_KEYS.filter((k) => counts[k] > 0).map((k) => (
          <motion.span
            key={k}
            title={`${GROUP_META[k].label}: ${counts[k]}`}
            className="h-full"
            style={{ backgroundColor: GROUP_META[k].color }}
            initial={{ width: '0%' }}
            animate={{ width: `${(counts[k] / total) * 100}%` }}
            transition={SPRING}
          />
        ))}
    </span>
  )
}
