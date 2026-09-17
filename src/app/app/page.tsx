import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import BookmarkList from '@/components/BookmarkList'

export default async function Home() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: bookmarks } = await supabase
    .from('bookmarks')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    // We removed the hardcoded background classes so the ThemeContext in layout.tsx is visible
    <div className="min-h-screen font-sans flex flex-col transition-colors">
      <BookmarkList 
        initialBookmarks={bookmarks || []} 
        userEmail={user.email} 
      />
    </div>
  )
}