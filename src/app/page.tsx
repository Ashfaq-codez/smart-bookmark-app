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
    <div className="min-h-screen bg-[#fafafa] bg-[radial-gradient(#cbd5e1_2px,transparent_2px)] [background-size:24px_24px] text-gray-900 font-sans">
      
      {/* PLAYFUL NAVBAR - Responsive Update */}
      <nav className="bg-white border-b-4 border-gray-900 py-3 sm:py-4 px-4 sm:px-6 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-y-3">
            
            {/* Colorful Logo Area */}
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1.5">
                {/* Dots slightly smaller on mobile */}
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-pink-400 border-2 border-gray-900"></div>
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-yellow-400 border-2 border-gray-900"></div>
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-cyan-400 border-2 border-gray-900"></div>
              </div>
              <h1 className="text-base sm:text-xl font-black tracking-tight text-gray-900 ml-1">
                SMART BOOKMARKS
              </h1>
            </div>
            
            {/* User Area - Now visible and safe on mobile */}
            <div className="flex items-center gap-3 sm:gap-6">
                <span 
                  className="text-xs sm:text-sm font-bold text-gray-500 max-w-[100px] sm:max-w-[200px] truncate" 
                  title={user.email}
                >
                  {user.email}
                </span>
                <form action="/auth/signout" method="post">
                  <button className="text-xs sm:text-sm font-black text-gray-900 bg-white border-2 border-gray-900 px-4 sm:px-5 py-1.5 rounded-full hover:bg-gray-100 transition-all shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] sm:shadow-[3px_3px_0px_0px_rgba(17,24,39,1)] active:translate-y-1 active:translate-x-1 active:shadow-none">
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