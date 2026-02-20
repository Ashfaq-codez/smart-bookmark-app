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

  // 2. Fetch bookmarks securely
  const { data: bookmarks } = await supabase
    .from('bookmarks')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    // The entire app now has a vintage cream background and warm text colors
    <div className="min-h-screen bg-[#F9F8F6] text-stone-800 font-sans selection:bg-[#E06D53] selection:text-white">
      
      {/* RETRO NAVBAR */}
      <nav className="bg-[#FFFDFB] border-b-2 border-stone-200 py-4 px-6 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
            
            {/* Logo Area */}
            <div className="flex items-center gap-3">
              {/* Vintage decorative square */}
              <div className="w-5 h-5 bg-[#E06D53] border-2 border-stone-800 rounded-sm transform rotate-12"></div>
              <h1 className="text-xl font-bold tracking-tight text-stone-900 uppercase tracking-widest text-sm">
                Smart Bookmarks
              </h1>
            </div>
            
            {/* User Area */}
            <div className="flex items-center gap-6">
                <span className="text-sm font-medium text-stone-500 hidden sm:block">
                  {user.email}
                </span>
                <form action="/auth/signout" method="post">
                  {/* Retro bordered button for Sign Out */}
                  <button className="text-sm font-bold text-stone-700 bg-stone-100 border-2 border-stone-300 px-4 py-1.5 rounded hover:bg-stone-200 hover:border-stone-400 transition-colors shadow-[2px_2px_0px_0px_rgba(120,113,108,0.3)] hover:translate-y-px hover:shadow-none">
                    Sign Out
                  </button>
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