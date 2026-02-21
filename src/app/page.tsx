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
    // Retro Cream Dotted Background
    <div className="min-h-screen bg-[#F9F8F6] bg-[radial-gradient(#d6d3d1_2px,transparent_2px)] [background-size:24px_24px] text-stone-900 font-sans selection:bg-[#E06D53] selection:text-white">
      
      {/* REFINED RETRO NAVBAR */}
      <nav className="bg-[#FFFDFB] border-b-2 border-stone-800 py-3 px-4 sm:px-6 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-y-4">
            
            {/* Elegant Logo Area */}
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6 sm:w-7 sm:h-7 fill-[#E06D53] stroke-stone-900 stroke-[2px] drop-shadow-[2px_2px_0px_rgba(28,25,23,1)]">
                <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" strokeLinejoin="round"/>
              </svg>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-stone-900 ml-1 uppercase">
                Archive
              </h1>
            </div>
            
            {/* User Area - Flexes correctly on mobile */}
            <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                
                {/* Account Email Box in vintage style */}
                <div 
                  className="bg-[#FDECE8] border-2 border-stone-800 px-3 py-1.5 rounded shadow-[2px_2px_0px_0px_rgba(28,25,23,1)] flex-1 sm:flex-none min-w-0 max-w-[250px] sm:max-w-xs"
                  title={user.email}
                >
                  <p className="text-xs sm:text-sm font-bold text-stone-900 truncate">
                    {user.email}
                  </p>
                </div>

                <form action="/auth/signout" method="post" className="shrink-0">
                  <button className="text-xs sm:text-sm font-bold uppercase text-stone-900 bg-[#FFFDFB] border-2 border-stone-800 px-4 py-1.5 rounded hover:bg-stone-100 transition-all shadow-[2px_2px_0px_0px_rgba(28,25,23,1)] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none">
                    Log Out
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