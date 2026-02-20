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

// --- Minimal SVG Icons for a Modern Look ---
const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
)

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
)

const ExternalLinkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
)

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
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      
      {/* MODERN INPUT SECTION */}
      <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 mb-12 max-w-3xl mx-auto relative overflow-hidden">
        {/* Subtle decorative gradient blob */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 rounded-full bg-blue-50 blur-3xl -z-10"></div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-6 tracking-tight">Add a Bookmark</h2>
        
        <form onSubmit={addBookmark} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Title (e.g. Next.js Docs)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-gray-900 transition-all placeholder:text-gray-400 font-medium"
              required
            />
          </div>
          <div className="flex-1">
            <input
              type="text"
              placeholder="URL (e.g. nextjs.org)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-gray-900 transition-all placeholder:text-gray-400 font-medium"
              required
            />
          </div>
          <button 
            type="submit" 
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-4 px-8 rounded-2xl transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5"
          >
            <PlusIcon />
            <span>Save</span>
          </button>
        </form>
      </div>

      {/* HEADER ROW */}
      <div className="flex items-center justify-between mb-8 px-2">
        <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Your Collection</h3>
        <span className="text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-4 py-1.5 rounded-full">
          {bookmarks.length} {bookmarks.length === 1 ? 'Link' : 'Links'}
        </span>
      </div>

      {/* EMPTY STATE */}
      {bookmarks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 bg-white/50 border-2 border-dashed border-gray-200 rounded-3xl">
          <div className="bg-gray-50 p-4 rounded-full mb-4">
            <ExternalLinkIcon />
          </div>
          <h4 className="text-xl font-semibold text-gray-900 mb-2">No bookmarks yet</h4>
          <p className="text-gray-500 text-center max-w-sm">
            Save your favorite websites, articles, and resources to easily access them later.
          </p>
        </div>
      ) : (
        /* GRID LAYOUT */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {bookmarks.map((bookmark) => {
            const domain = getDomain(bookmark.url);
            
            return (
              <div 
                key={bookmark.id} 
                className="group relative flex flex-col justify-between bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:border-gray-200 transition-all duration-300 hover:-translate-y-1"
              >
                {/* Top: Icon and Delete Button */}
                <div className="flex justify-between items-start mb-5">
                  <div className="p-2 bg-gray-50 border border-gray-100 rounded-xl shadow-sm">
                    <img 
                      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=128`} 
                      alt={`${domain} logo`}
                      className="w-8 h-8 object-contain rounded-md"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://www.google.com/s2/favicons?domain=example.com&sz=128'
                      }}
                    />
                  </div>
                  
                  <button
                    onClick={() => deleteBookmark(bookmark.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    aria-label="Delete bookmark"
                  >
                    <TrashIcon />
                  </button>
                </div>

                {/* Middle: Text Content */}
                <div className="mb-2">
                  <h4 className="text-lg font-bold text-gray-900 truncate tracking-tight mb-1" title={bookmark.title}>
                    {bookmark.title}
                  </h4>
                  <p className="text-sm text-gray-500 truncate font-medium" title={bookmark.url}>
                    {domain}
                  </p>
                </div>

                {/* Bottom: Action Link */}
                <div className="pt-4 border-t border-gray-50 mt-2">
                  <a 
                    href={bookmark.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Visit website
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