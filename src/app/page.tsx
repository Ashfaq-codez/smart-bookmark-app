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
    // Dotted background remains
    <div className="min-h-screen bg-[#fafafa] bg-[radial-gradient(#cbd5e1_2px,transparent_2px)] [background-size:24px_24px] text-gray-900 font-sans">
      
      {/* SOFTENED NAVBAR */}
      {/* Changed border-b-4 to border-b-2 */}
      <nav className="bg-white border-b-2 border-gray-900 py-3 px-4 sm:px-6 sticky top-0 z-10">
        <div className="max-w-[1400px] mx-auto flex flex-wrap justify-between items-center gap-y-4">
            
            {/* Logo Area */}
            <div className="flex items-center gap-2">
              {/* Stroke reduced to 2px, size slightly smaller */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6 fill-yellow-400 stroke-gray-900 stroke-2 drop-shadow-[1.5px_1.5px_0px_rgba(17,24,39,1)]">
                <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" strokeLinejoin="round"/>
              </svg>
              {/* Font scaled down from xl to base/lg */}
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-gray-900 ml-1 uppercase">
                Smart Bookmarks
              </h1>
            </div>
            
            {/* User Area */}
            <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                <div 
                  className="bg-white border-2 border-gray-900 px-3 py-1.5 rounded-lg shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] flex-1 sm:flex-none min-w-0 max-w-[250px] sm:max-w-xs"
                  title={user.email}
                >
                  <p className="text-[11px] sm:text-xs font-bold text-gray-600 truncate">
                    {user.email}
                  </p>
                </div>

                <form action="/auth/signout" method="post" className="shrink-0">
                  <button className="text-[11px] sm:text-xs font-extrabold uppercase text-gray-900 bg-white border-2 border-gray-900 px-4 py-1.5 rounded-lg hover:bg-yellow-400 transition-all shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none">
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