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
    // Added a subtle slate background to the main container to fix the white-on-white issue
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* ADD BOOKMARK FORM */}
        {/* Added a strong blue top border and distinct shadow to separate it from the background */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-md border-t-4 border-t-blue-600 mb-12 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 tracking-tight">Add a Bookmark</h2>
          
          <form onSubmit={addBookmark} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Title (e.g. Next.js Docs)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                // Inputs now have a light gray background to contrast against the white card
                className="w-full px-5 py-3.5 bg-slate-100 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 transition-all placeholder:text-slate-400 font-medium"
                required
              />
            </div>
            <div className="flex-1">
              <input
                type="text"
                placeholder="URL (e.g. nextjs.org)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-5 py-3.5 bg-slate-100 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 transition-all placeholder:text-slate-400 font-medium"
                required
              />
            </div>
            <button 
              type="submit" 
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 px-8 rounded-xl transition-colors shadow-sm"
            >
              <PlusIcon />
              <span>Save</span>
            </button>
          </form>
        </div>

        {/* HEADER ROW */}
        <div className="flex items-center justify-between mb-6 px-1">
          <h3 className="text-2xl font-bold text-slate-800 tracking-tight">Your Collection</h3>
          <span className="text-sm font-semibold text-slate-600 bg-slate-200 px-3 py-1 rounded-full">
            {bookmarks.length} {bookmarks.length === 1 ? 'Link' : 'Links'}
          </span>
        </div>

        {/* EMPTY STATE */}
        {bookmarks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 bg-white border-2 border-dashed border-slate-300 rounded-2xl shadow-sm">
            <div className="text-slate-400 mb-3">
              <ExternalLinkIcon />
            </div>
            <h4 className="text-lg font-semibold text-slate-700 mb-1">No bookmarks yet</h4>
            <p className="text-slate-500 text-center max-w-sm">
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
                  className="flex flex-col justify-between bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200"
                >
                  {/* Top: Icon and ALWAYS VISIBLE Delete Button */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg">
                      <img 
                        src={`https://www.google.com/s2/favicons?domain=${domain}&sz=128`} 
                        alt={`${domain} logo`}
                        className="w-7 h-7 object-contain rounded"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://www.google.com/s2/favicons?domain=example.com&sz=128'
                        }}
                      />
                    </div>
                    
                    {/* Delete button: always visible with a soft red background */}
                    <button
                      onClick={() => deleteBookmark(bookmark.id)}
                      className="p-2 text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-700 rounded-lg transition-colors"
                      aria-label="Delete bookmark"
                      title="Delete"
                    >
                      <TrashIcon />
                    </button>
                  </div>

                  {/* Middle: Text Content */}
                  <div className="mb-4">
                    <h4 className="text-lg font-bold text-slate-800 truncate tracking-tight mb-0.5" title={bookmark.title}>
                      {bookmark.title}
                    </h4>
                    <p className="text-sm text-slate-500 truncate font-medium" title={bookmark.url}>
                      {domain}
                    </p>
                  </div>

                  {/* Bottom: Action Link */}
                  <div className="pt-4 border-t border-slate-100">
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
    </div>
  )
}