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
    <div className="min-h-screen bg-[#fafafa] bg-[radial-gradient(#cbd5e1_2px,transparent_2px)] [background-size:24px_24px] text-gray-900 font-sans flex flex-col">
      {/* 
        The Navbar has been moved inside BookmarkList so it can 
        easily control the mobile sidebar menu state! 
      */}
      <BookmarkList 
        initialBookmarks={bookmarks || []} 
        userEmail={user.email} 
      />
    </div>
  )
}