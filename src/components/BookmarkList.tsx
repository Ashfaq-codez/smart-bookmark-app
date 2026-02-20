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

    // Ensure URL has http/https so the parser doesn't crash
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

  // Helper function to safely get the domain name for the logo
  const getDomain = (link: string) => {
    try {
      return new URL(link).hostname
    } catch {
      return 'link'
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      
      {/* ADD BOOKMARK FORM */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-10 max-w-2xl mx-auto">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Add New Bookmark</h2>
        <form onSubmit={addBookmark} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Title (e.g. GitHub)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 transition"
              required
            />
          </div>
          <div className="flex-1">
            <input
              type="text"
              placeholder="URL (e.g. github.com)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 transition"
              required
            />
          </div>
          <button 
            type="submit" 
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 shadow-sm hover:shadow"
          >
            Save
          </button>
        </form>
      </div>

      {/* BOOKMARK GRID */}
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-2xl font-bold text-gray-900">Your Collection</h3>
        <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          {bookmarks.length} saved
        </span>
      </div>

      {bookmarks.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
          <p className="text-gray-500 text-lg">Your collection is empty. Add your first bookmark above!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookmarks.map((bookmark) => {
            const domain = getDomain(bookmark.url);
            
            return (
              <div 
                key={bookmark.id} 
                className="group relative flex flex-col justify-between bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200"
              >
                {/* Top Section: Logo, Title, and URL */}
                <div className="flex items-start gap-4 mb-4">
                  {/* Google's free Favicon fetching service */}
                  <img 
                    src={`https://www.google.com/s2/favicons?domain=${domain}&sz=128`} 
                    alt={`${domain} logo`}
                    className="w-10 h-10 rounded-md object-contain bg-gray-50 p-1 border border-gray-100"
                    onError={(e) => {
                      // Fallback if logo fails to load
                      (e.target as HTMLImageElement).src = 'https://www.google.com/s2/favicons?domain=example.com&sz=128'
                    }}
                  />
                  <div className="overflow-hidden">
                    <a 
                      href={bookmark.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-lg font-semibold text-gray-900 hover:text-blue-600 truncate block transition-colors"
                      title={bookmark.title}
                    >
                      {bookmark.title}
                    </a>
                    <a 
                      href={bookmark.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-gray-500 hover:text-gray-700 truncate block mt-0.5"
                      title={bookmark.url}
                    >
                      {domain}
                    </a>
                  </div>
                </div>

                {/* Bottom Section: Actions */}
                <div className="flex justify-end pt-4 border-t border-gray-100">
                  <button
                    onClick={() => deleteBookmark(bookmark.id)}
                    className="text-sm font-medium text-red-500 hover:text-white hover:bg-red-500 px-3 py-1.5 rounded-md transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}