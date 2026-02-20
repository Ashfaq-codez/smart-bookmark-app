'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'

type Bookmark = {
  id: number
  title: string
  url: string
  created_at: string
  user_id: string
}

// --- Minimal SVG Icons ---
const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
)

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
)

const ExternalLinkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
)

// Pre-defined vibrant colors for the cards. Next.js requires full class names.
const cardColors = [
  'bg-[#FFE8EF]', // Soft Pink
  'bg-[#E8F0FE]', // Soft Blue
  'bg-[#FFF4E0]', // Soft Yellow
  'bg-[#E6F8F3]', // Soft Green
  'bg-[#F0E8FE]', // Soft Purple
]

export default function BookmarkList({ initialBookmarks }: { initialBookmarks: Bookmark[] }) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks)
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const supabase = createClient()

  useEffect(() => {
    const setupRealtime = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const channel = supabase
        .channel('realtime bookmarks')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'bookmarks' },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              setBookmarks((prev) => [payload.new as Bookmark, ...prev])
            } else if (payload.eventType === 'DELETE') {
              setBookmarks((prev) => prev.filter((bookmark) => bookmark.id !== payload.old.id))
            }
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }

    setupRealtime()
  }, [supabase])

  const addBookmark = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !url) return

    let formattedUrl = url
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl
    }

    const { error } = await supabase.from('bookmarks').insert([{ title, url: formattedUrl }])

    if (error) {
        alert(error.message)
    } else {
        setTitle('')
        setUrl('')
    }
  }

  const deleteBookmark = async (id: number) => {
    const { error } = await supabase.from('bookmarks').delete().eq('id', id)
    if (error) alert(error.message)
  }

  const getDomain = (link: string) => {
    try {
      return new URL(link).hostname
    } catch {
      return 'link'
    }
  }

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      
      {/* VIBRANT INPUT FORM */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border-4 border-gray-900 shadow-[6px_6px_0px_0px_rgba(17,24,39,1)] mb-14 max-w-3xl mx-auto">
        <h2 className="text-2xl font-black text-gray-900 mb-6 uppercase">
          Drop a Link
        </h2>
        
        <form onSubmit={addBookmark} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Title (e.g. Next.js Docs)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-900 rounded-xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-yellow-300 text-gray-900 font-bold placeholder:text-gray-400 transition-all"
              required
            />
          </div>
          <div className="flex-1">
            <input
              type="text"
              placeholder="URL (e.g. nextjs.org)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-900 rounded-xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-yellow-300 text-gray-900 font-bold placeholder:text-gray-400 transition-all"
              required
            />
          </div>
          <button 
            type="submit" 
            // Vibrant Purple Save Button
            className="flex items-center justify-center gap-2 bg-[#A855F7] hover:bg-[#9333EA] text-white font-black py-4 px-8 rounded-xl border-4 border-gray-900 transition-transform shadow-[4px_4px_0px_0px_rgba(17,24,39,1)] active:translate-y-1 active:translate-x-1 active:shadow-none"
          >
            <PlusIcon />
            <span>SAVE</span>
          </button>
        </form>
      </div>

      {/* HEADER ROW */}
      <div className="flex items-center justify-between mb-8 px-1">
        <h3 className="text-3xl font-black text-gray-900 tracking-tight">Bookmarks</h3>
        <span className="text-sm font-black text-gray-900 bg-yellow-300 border-2 border-gray-900 px-4 py-1.5 rounded-full shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]">
          {bookmarks.length} LINKS
        </span>
      </div>

      {/* EMPTY STATE */}
      {bookmarks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-4 bg-white border-4 border-dashed border-gray-300 rounded-3xl">
          <div className="text-gray-300 mb-4 scale-150">
            <ExternalLinkIcon />
          </div>
          <h4 className="text-2xl font-black text-gray-400 mb-2 uppercase">No Links Yet</h4>
          <p className="text-gray-500 font-bold text-center max-w-sm">
            Paste a URL above to start building your colorful collection.
          </p>
        </div>
      ) : (
        /* GRID LAYOUT - MULTI-COLOR CARDS */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {bookmarks.map((bookmark, index) => {
            const domain = getDomain(bookmark.url);
            // Cycle through the colors based on the index!
            const cardColorClass = cardColors[index % cardColors.length];
            
            return (
              <div 
                key={bookmark.id} 
                className={`flex flex-col justify-between p-6 rounded-2xl border-4 border-gray-900 shadow-[6px_6px_0px_0px_rgba(17,24,39,1)] hover:translate-x-1 hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(17,24,39,1)] transition-all duration-200 ${cardColorClass}`}
              >
                {/* Top: Icon and ALWAYS VISIBLE Delete Button */}
                <div className="flex justify-between items-start mb-6">
                  <div className="p-2 bg-white border-2 border-gray-900 rounded-xl shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]">
                    <img 
                      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=128`} 
                      alt={`${domain} logo`}
                      className="w-8 h-8 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://www.google.com/s2/favicons?domain=example.com&sz=128'
                      }}
                    />
                  </div>
                  
                  {/* Delete button: Bold red, highly visible */}
                  <button
                    onClick={() => deleteBookmark(bookmark.id)}
                    className="p-2 text-white bg-red-500 hover:bg-red-600 border-2 border-gray-900 rounded-xl transition-all shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none"
                    aria-label="Delete bookmark"
                    title="Delete"
                  >
                    <TrashIcon />
                  </button>
                </div>

                {/* Middle: Text Content */}
                <div className="mb-4">
                  <h4 className="text-xl font-black text-gray-900 truncate mb-1" title={bookmark.title}>
                    {bookmark.title}
                  </h4>
                  <p className="text-sm font-bold text-gray-600 truncate" title={bookmark.url}>
                    {domain}
                  </p>
                </div>

                {/* Bottom: Action Link */}
                <div className="pt-4 border-t-4 border-gray-900/10 mt-2">
                  <a 
                    href={bookmark.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center gap-2 text-sm font-black text-gray-900 hover:text-blue-600 uppercase tracking-widest transition-colors"
                  >
                    Visit
                    <ExternalLinkIcon />
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}