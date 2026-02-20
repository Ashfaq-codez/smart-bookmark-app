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
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
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
    <div className="max-w-6xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      
      {/* VINTAGE INPUT FORM */}
      <div className="bg-[#FFFDFB] p-6 sm:p-8 rounded border-2 border-stone-200 shadow-[4px_4px_0px_0px_rgba(231,229,228,1)] mb-14 max-w-3xl mx-auto">
        <h2 className="text-xl font-bold text-stone-800 mb-6 uppercase tracking-wider text-sm border-b-2 border-stone-100 pb-2">
          Append to Archive
        </h2>
        
        <form onSubmit={addBookmark} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Title (e.g. Next.js Docs)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              // Inputs use the cream background
              className="w-full px-4 py-3 bg-[#F9F8F6] border-2 border-stone-200 rounded focus:bg-white focus:outline-none focus:border-[#E06D53] focus:ring-1 focus:ring-[#E06D53] text-stone-900 transition-colors placeholder:text-stone-400 font-medium"
              required
            />
          </div>
          <div className="flex-1">
            <input
              type="text"
              placeholder="URL (e.g. nextjs.org)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-4 py-3 bg-[#F9F8F6] border-2 border-stone-200 rounded focus:bg-white focus:outline-none focus:border-[#E06D53] focus:ring-1 focus:ring-[#E06D53] text-stone-900 transition-colors placeholder:text-stone-400 font-medium"
              required
            />
          </div>
          <button 
            type="submit" 
            // Vintage Terracotta Button
            className="flex items-center justify-center gap-2 bg-[#E06D53] hover:bg-[#c95a41] text-white font-bold py-3 px-8 rounded border-2 border-[#b84a32] transition-colors shadow-[2px_2px_0px_0px_rgba(184,74,50,0.5)] active:translate-y-px active:shadow-none"
          >
            <PlusIcon />
            <span>Save</span>
          </button>
        </form>
      </div>

      {/* HEADER ROW */}
      <div className="flex items-center justify-between mb-6 border-b-2 border-stone-200 pb-2">
        <h3 className="text-lg font-bold text-stone-800 uppercase tracking-widest">Index</h3>
        <span className="text-xs font-bold text-stone-500 uppercase tracking-widest">
          {bookmarks.length} Entries
        </span>
      </div>

      {/* EMPTY STATE */}
      {bookmarks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 bg-[#FFFDFB] border-2 border-dashed border-stone-300 rounded">
          <div className="text-stone-400 mb-4">
            <ExternalLinkIcon />
          </div>
          <h4 className="text-lg font-bold text-stone-700 mb-2 uppercase tracking-wide">Archive Empty</h4>
          <p className="text-stone-500 text-center max-w-sm font-medium">
            Your collection is waiting for its first entry.
          </p>
        </div>
      ) : (
        /* GRID LAYOUT - PAPER CARDS */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {bookmarks.map((bookmark) => {
            const domain = getDomain(bookmark.url);
            
            return (
              <div 
                key={bookmark.id} 
                className="flex flex-col justify-between bg-[#FFFDFB] p-5 rounded border-2 border-stone-200 shadow-[4px_4px_0px_0px_rgba(231,229,228,1)] hover:border-stone-300 hover:shadow-[4px_4px_0px_0px_rgba(214,211,209,1)] transition-all duration-200"
              >
                {/* Top: Icon and ALWAYS VISIBLE Delete Button */}
                <div className="flex justify-between items-start mb-5">
                  <div className="p-1.5 bg-white border-2 border-stone-100 rounded">
                    <img 
                      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=128`} 
                      alt={`${domain} logo`}
                      className="w-7 h-7 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://www.google.com/s2/favicons?domain=example.com&sz=128'
                      }}
                    />
                  </div>
                  
                  {/* Delete button: Soft vintage red, always visible */}
                  <button
                    onClick={() => deleteBookmark(bookmark.id)}
                    className="p-1.5 text-[#D9534F] bg-[#FDECE8] border border-[#F5C6CB] hover:bg-[#F5C6CB] rounded transition-colors"
                    aria-label="Delete bookmark"
                    title="Delete"
                  >
                    <TrashIcon />
                  </button>
                </div>

                {/* Middle: Text Content */}
                <div className="mb-4">
                  <h4 className="text-lg font-bold text-stone-800 truncate mb-1" title={bookmark.title}>
                    {bookmark.title}
                  </h4>
                  <p className="text-sm text-stone-500 truncate font-medium" title={bookmark.url}>
                    {domain}
                  </p>
                </div>

                {/* Bottom: Action Link */}
                <div className="pt-3 border-t-2 border-dashed border-stone-200">
                  <a 
                    href={bookmark.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-[#E06D53] hover:text-[#c95a41] uppercase tracking-wide transition-colors"
                  >
                    Visit Link
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