import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import BookmarkList from '@/components/BookmarkList'

export default async function Home() {
  const supabase = await createClient()

  // 1. Securely check for an active user session
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 2. Fetch the user's bookmarks
  const { data: bookmarks } = await supabase
    .from('bookmarks')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    // Dotted canvas background
    <div className="min-h-screen bg-[#fafafa] bg-[radial-gradient(#cbd5e1_2px,transparent_2px)] [background-size:24px_24px] text-gray-900 font-sans">
      
      {/* PLAYFUL NAVBAR */}
      <nav className="bg-white border-b-4 border-gray-900 py-3 sm:py-4 px-4 sm:px-6 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-y-4">
            
            {/* Logo Area */}
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6 sm:w-8 sm:h-8 fill-yellow-400 stroke-gray-900 stroke-[2.5px] drop-shadow-[2px_2px_0px_rgba(17,24,39,1)]">
                <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" strokeLinejoin="round"/>
              </svg>
              <h1 className="text-base sm:text-xl font-black tracking-tight text-gray-900 ml-1">
                SMART BOOKMARKS
              </h1>
            </div>
            
            {/* User Area - Now flexes perfectly across the entire mobile screen */}
            <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                
                {/* Account Email Box */}
                <div 
                  className="bg-pink-100 border-2 border-gray-900 px-3 py-1.5 rounded-xl shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] flex-1 sm:flex-none min-w-0 max-w-[250px] sm:max-w-xs"
                  title={user.email}
                >
                  <p className="text-xs sm:text-sm font-black text-gray-900 truncate">
                    {user.email}
                  </p>
                </div>

                {/* Sign Out Button */}
                <form action="/auth/signout" method="post" className="shrink-0">
                  <button className="text-xs sm:text-sm font-black uppercase text-gray-900 bg-white border-2 border-gray-900 px-4 sm:px-5 py-1.5 rounded-xl hover:bg-gray-100 transition-all shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] sm:shadow-[3px_3px_0px_0px_rgba(17,24,39,1)] active:translate-y-1 active:translate-x-1 active:shadow-none">
                    Sign Out
                  </button>
                </form>

            </div>
        </div>
      </nav>
      
      {/* MAIN CONTENT */}
      <main>
        <BookmarkList initialBookmarks={bookmarks || []} />
      </main>
      
    </div>
  )
}