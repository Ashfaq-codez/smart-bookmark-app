import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import BookmarkList from '@/components/BookmarkList'
import { Bookmark } from '@/types'
import { LIST_COLUMNS, PAGE_SIZE, MAX_PINS, EMPTY_STATS, BookmarkStats } from '@/lib/bookmarkQuery'
import { sanitizePrefs } from '@/lib/preferences'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Round 1: the person's saved view settings, their pinned saves, and the sidebar counts.
  // (Preferences first because the sort order decides how the main list is asked for.)
  const [prefsResult, pinsResult, statsResult] = await Promise.all([
    supabase.from('user_preferences').select('prefs').eq('user_id', user.id).maybeSingle(),
    supabase
      .from('bookmarks')
      .select(LIST_COLUMNS)
      .not('pinned_at', 'is', null)
      .order('pinned_at', { ascending: false })
      .limit(MAX_PINS),
    supabase.rpc('bookmark_stats'),
  ])
  const hasSavedPrefs = !!prefsResult.data
  const prefs = sanitizePrefs(prefsResult.data?.prefs)   // missing row or an error simply means "defaults"

  // Round 2: only the first page of light cards in the person's preferred order. The rest loads as they scroll.
  const asc = prefs.sort === 'asc'
  const listResult = await supabase
    .from('bookmarks')
    .select(LIST_COLUMNS)
    .is('pinned_at', null)
    .order('created_at', { ascending: asc })
    .order('id', { ascending: asc })
    .limit(PAGE_SIZE + 1)

  if (listResult.error) {
    // Shows the error page instead of an empty dashboard that looks like all saves were lost.
    console.error('dashboard list failed:', listResult.error.message)
    throw new Error('Could not load bookmarks')
  }

  const rows = (listResult.data || []) as unknown as Bookmark[]
  const hasMore = rows.length > PAGE_SIZE
  const stats = (statsResult.data as BookmarkStats | null) ?? EMPTY_STATS
  const pins = (pinsResult.error ? [] : pinsResult.data || []) as unknown as Bookmark[]

  return (
    // We removed the hardcoded background classes so the ThemeContext in layout.tsx is visible
    <div className="min-h-screen font-sans flex flex-col transition-colors">
      <BookmarkList
        initialBookmarks={rows.slice(0, PAGE_SIZE)}
        initialPins={pins}
        initialPrefs={prefs}
        hasSavedPrefs={hasSavedPrefs}
        userId={user.id}
        initialHasMore={hasMore}
        initialStats={stats}
        userEmail={user.email}
      />
    </div>
  )
}