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
    // Clean, handcrafted off-white background
    <div className="min-h-screen bg-[#FCFCFA] text-gray-900 font-sans selection:bg-yellow-200">
      
      {/* REFINED NAVBAR */}
      <nav className="bg-white border-b-2 border-gray-900 py-3 px-6 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
            
            {/* Elegant Logo Area */}
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5 fill-yellow-400 stroke-gray-900 stroke-2 drop-shadow-[1px_1px_0px_rgba(17,24,39,1)]">
                <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" strokeLinejoin="round"/>
              </svg>
              <h1 className="text-base font-bold tracking-tight text-gray-900">
                Bookmarks
              </h1>
            </div>
            
            {/* Compact User Area */}
            <div className="flex items-center gap-4">
                <div className="hidden sm:block px-2 py-1 bg-gray-100 rounded border border-gray-200">
                  <p className="text-xs font-medium text-gray-600 truncate max-w-[150px]">
                    {user.email}
                  </p>
                </div>

                <form action="/auth/signout" method="post">
                  <button className="text-xs font-bold uppercase text-gray-900 bg-white border-2 border-gray-900 px-3 py-1.5 rounded-md hover:bg-gray-50 transition-all shadow-[1.5px_1.5px_0px_0px_rgba(17,24,39,1)] active:translate-y-px active:translate-x-px active:shadow-none">
                    Log Out
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