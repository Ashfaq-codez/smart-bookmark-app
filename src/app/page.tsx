import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import BookmarkList from '@/components/BookmarkList'

export default async function Home() {
  const supabase = await createClient()

  // 1. Check if user is logged in
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 2. Fetch bookmarks securely (Server-side)
  // RLS ensures we only get *our* bookmarks
  const { data: bookmarks } = await supabase
    .from('bookmarks')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm p-4 mb-6">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-800">Smart Bookmarks</h1>
            <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">{user.email}</span>
                <form action="/auth/signout" method="post">
                  <button className="text-sm text-gray-500 hover:text-black">Sign Out</button>
                </form>
            </div>
        </div>
      </nav>
      
      <main>
        <BookmarkList initialBookmarks={bookmarks || []} />
      </main>
    </div>
  )
}