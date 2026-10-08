// src/components/admin/adminTypes.ts
// Shared shapes for the /admin page. Plain TS (no 'use client') so both the server page and the client view can import it.

// Same groups as the dashboard type pills (src/lib/bookmarkQuery.ts MEDIA_TYPE_MATCHERS), plus "other"
// for any type value that isn't in a pill yet.
export const GROUP_KEYS = ['link', 'note', 'image', 'videos', 'documents', 'socials', 'other'] as const
export type GroupKey = (typeof GROUP_KEYS)[number]

export const FEEDBACK_TYPES = ['idea', 'problem', 'other'] as const
export type FeedbackType = (typeof FEEDBACK_TYPES)[number]

export const ADMIN_TABS = ['overview', 'users', 'feedback'] as const
export type AdminTab = (typeof ADMIN_TABS)[number]

export function emptyGroups(): Record<GroupKey, number> {
  return Object.fromEntries(GROUP_KEYS.map((k) => [k, 0])) as Record<GroupKey, number>
}

export type DayPoint = { day: string; label: string; count: number }

export type GroupStat = {
  key: GroupKey
  total: number
  raw: { type: string; count: number }[] // the actual `type` values inside this group, e.g. twitter 43
}

export type AdminUser = {
  id: string
  email: string | null
  name: string | null
  avatar: string | null
  total: number
  week: number
  groups: Record<GroupKey, number>
  folders: number // how many of their own folders hold saves (names are not sent)
  organizedPct: number // % of their saves sitting in a folder instead of Inbox / Uncategorized
  lastSaveMs: number | null
  joinedMs: number
  lastSaveLabel: string
  joinedLabel: string
  lastSignInLabel: string
}

export type FeedbackItem = {
  id: number
  type: FeedbackType
  message: string
  email: string | null
  dateLabel: string
  device: string
  userAgent: string | null
}

export type AdminData = {
  tab: AdminTab
  updatedLabel: string
  capped: boolean
  maxSaves: number
  headline: {
    users: number | null
    newUsersWeek: number
    activeWeek: number
    saves: number
    savesWeek: number
    everSaved: number
  }
  savesSeries: DayPoint[]
  signupSeries: DayPoint[]
  groups: GroupStat[]
  groupTotal: number
  folders: { organized: number; inbox: number; unsorted: number; usersWithFolders: number }
  users: AdminUser[]
  feedback: {
    rows: FeedbackItem[]
    type: FeedbackType | null
    page: number
    totalPages: number
    counts: Record<FeedbackType, number>
    all: number
    week: number
  }
}
