import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import BookmarkList from '@/components/BookmarkList'
import { Bookmark } from '@/types'
import { LIST_COLUMNS, PAGE_SIZE, EMPTY_STATS, BookmarkStats } from '@/lib/bookmarkQuery'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Only the newest page of light cards, plus the counts for the sidebar. The rest loads as the user scrolls.
  const [listResult, statsResult] = await Promise.all([
    supabase
      .from('bookmarks')
      .select(LIST_COLUMNS)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(PAGE_SIZE + 1),
    supabase.rpc('bookmark_stats'),
  ])

  if (listResult.error) {
    // Shows the error page instead of an empty dashboard that looks like all saves were lost.
    console.error('dashboard list failed:', listResult.error.message)
    throw new Error('Could not load bookmarks')
  }

  const rows = (listResult.data || []) as unknown as Bookmark[]
  const hasMore = rows.length > PAGE_SIZE
  const stats = (statsResult.data as BookmarkStats | null) ?? EMPTY_STATS

  return (
    // We removed the hardcoded background classes so the ThemeContext in layout.tsx is visible
    <div className="min-h-screen font-sans flex flex-col transition-colors">
      <BookmarkList
        initialBookmarks={rows.slice(0, PAGE_SIZE)}
        initialHasMore={hasMore}
        initialStats={stats}
        userEmail={user.email}
      />
    </div>
  )
}