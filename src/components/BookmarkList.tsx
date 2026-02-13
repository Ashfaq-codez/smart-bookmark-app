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
    // 1. Define an async function to handle the setup
    const setupRealtime = async () => {
      // A. Get the current user session explicitly
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        console.error("No session found, realtime will fail for RLS.")
        return
      }

      // console.log("Subscribing as user:", session.user.email)

      // B. Create the channel ONLY after we have the session
      const channel = supabase
        .channel('realtime bookmarks')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bookmarks',
          },
          (payload) => {
            // console.log("Realtime event received!", payload)
            if (payload.eventType === 'INSERT') {
              setBookmarks((prev) => [payload.new as Bookmark, ...prev])
            } else if (payload.eventType === 'DELETE') {
              setBookmarks((prev) => prev.filter((bookmark) => bookmark.id !== payload.old.id))
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('Connected!')
          }
        })

      // Cleanup function
      return () => {
        supabase.removeChannel(channel)
      }
    }

    // 2. Run the setup
    setupRealtime()

  }, [supabase])

  const addBookmark = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !url) return

    const { error } = await supabase.from('bookmarks').insert([{ title, url }])

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

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* ADD BOOKMARK FORM */}
      <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Add New Bookmark</h2>
        <form onSubmit={addBookmark} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              placeholder="e.g. My Portfolio"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              // Added border-gray-300 and text colors to make it visible
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-400"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
            <input
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              // Added border-gray-300 and text colors here too
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-400"
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-200"
          >
            Add Bookmark
          </button>
        </form>
      </div>

      {/* BOOKMARK LIST */}
      <h3 className="text-xl font-bold text-gray-800 mb-4">Your Bookmarks</h3>
      <ul className="space-y-3">
        {bookmarks.map((bookmark) => (
          <li key={bookmark.id} className="flex justify-between items-center bg-white p-4 rounded shadow-sm border border-gray-200 hover:shadow-md transition">
            <a 
              href={bookmark.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-600 hover:underline font-medium text-lg truncate max-w-xs"
            >
              {bookmark.title}
            </a>
            <button
              onClick={() => deleteBookmark(bookmark.id)}
              className="text-red-600 hover:text-red-800 text-sm font-semibold px-3 py-1 border border-red-200 rounded hover:bg-red-50 transition"
            >
              Delete
            </button>
          </li>
        ))}
        {bookmarks.length === 0 && (
          <p className="text-center text-gray-500 py-8 italic">You don't have any bookmarks yet.</p>
        )}
      </ul>
    </div>
  )
}
