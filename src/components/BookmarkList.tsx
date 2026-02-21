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

// --- Icons ---
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
const ExternalLinkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
const XIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>

const cardColors = ['bg-[#FFE8EF]', 'bg-[#E8F0FE]', 'bg-[#FFF4E0]', 'bg-[#E6F8F3]', 'bg-[#F0E8FE]']

export default function BookmarkList({ initialBookmarks }: { initialBookmarks: Bookmark[] }) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks)
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  
  // States for Editing
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editUrl, setEditUrl] = useState('')

  const supabase = createClient()

  useEffect(() => {
    const setupRealtime = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const channel = supabase
        .channel('realtime bookmarks')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'bookmarks' }, (payload) => {
            if (payload.eventType === 'INSERT') {
              setBookmarks((prev) => [payload.new as Bookmark, ...prev])
            } else if (payload.eventType === 'DELETE') {
              setBookmarks((prev) => prev.filter((b) => b.id !== payload.old.id))
            } else if (payload.eventType === 'UPDATE') {
              setBookmarks((prev) => prev.map((b) => b.id === payload.new.id ? (payload.new as Bookmark) : b))
            }
          }
        )
        .subscribe()

      return () => { supabase.removeChannel(channel) }
    }
    setupRealtime()
  }, [supabase])

  const formatUrl = (rawUrl: string) => {
    return (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) ? 'https://' + rawUrl : rawUrl
  }

  const addBookmark = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !url) return
    const { error } = await supabase.from('bookmarks').insert([{ title, url: formatUrl(url) }])
    if (error) alert(error.message)
    else { setTitle(''); setUrl('') }
  }

  const deleteBookmark = async (id: number) => {
    const { error } = await supabase.from('bookmarks').delete().eq('id', id)
    if (error) alert(error.message)
  }

  const startEditing = (bookmark: Bookmark) => {
    setEditingId(bookmark.id)
    setEditTitle(bookmark.title)
    setEditUrl(bookmark.url)
  }

  const saveEdit = async (id: number) => {
    if (!editTitle || !editUrl) return
    const { error } = await supabase.from('bookmarks').update({ title: editTitle, url: formatUrl(editUrl) }).eq('id', id)
    if (error) alert(error.message)
    else setEditingId(null)
  }

  const getDomain = (link: string) => {
    try { return new URL(link).hostname } catch { return 'link' }
  }

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      {/* INPUT FORM */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border-4 border-gray-900 shadow-[6px_6px_0px_0px_rgba(17,24,39,1)] mb-14 max-w-3xl mx-auto">
        <h2 className="text-2xl font-black text-gray-900 mb-6 uppercase">Drop a Link</h2>
        <form onSubmit={addBookmark} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input type="text" placeholder="Title (e.g. Next.js Docs)" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-900 rounded-xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-yellow-300 text-gray-900 font-bold placeholder:text-gray-400 transition-all" required />
          </div>
          <div className="flex-1">
            <input type="text" placeholder="URL (e.g. nextjs.org)" value={url} onChange={(e) => setUrl(e.target.value)} className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-900 rounded-xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-yellow-300 text-gray-900 font-bold placeholder:text-gray-400 transition-all" required />
          </div>
          <button type="submit" className="flex items-center justify-center gap-2 bg-[#A855F7] hover:bg-[#9333EA] text-white font-black py-4 px-8 rounded-xl border-4 border-gray-900 transition-transform shadow-[4px_4px_0px_0px_rgba(17,24,39,1)] active:translate-y-1 active:translate-x-1 active:shadow-none"><PlusIcon /><span>SAVE</span></button>
        </form>
      </div>

      <div className="flex items-center justify-between mb-8 px-1">
        <h3 className="text-3xl font-black text-gray-900 tracking-tight">Bookmarks</h3>
        <span className="text-sm font-black text-gray-900 bg-yellow-300 border-2 border-gray-900 px-4 py-1.5 rounded-full shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]">{bookmarks.length} LINKS</span>
      </div>

      {bookmarks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-4 bg-white border-4 border-dashed border-gray-300 rounded-3xl">
          <div className="text-gray-300 mb-4 scale-150"><ExternalLinkIcon /></div>
          <h4 className="text-2xl font-black text-gray-400 mb-2 uppercase">No Links Yet</h4>
          <p className="text-gray-500 font-bold text-center max-w-sm">Paste a URL above to start building your colorful collection.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {bookmarks.map((bookmark, index) => {
            const domain = getDomain(bookmark.url);
            const cardColorClass = cardColors[index % cardColors.length];
            const isEditing = editingId === bookmark.id;
            
            return (
              <div key={bookmark.id} className={`flex flex-col rounded-2xl border-4 border-gray-900 shadow-[6px_6px_0px_0px_rgba(17,24,39,1)] overflow-hidden transition-all duration-200 ${!isEditing ? 'hover:translate-x-1 hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(17,24,39,1)]' : ''} ${cardColorClass}`}>
                
                {/* --- THE MAGIC SCROLLING THUMBNAIL --- */}
                <div className="h-40 w-full border-b-4 border-gray-900 relative group/thumb overflow-hidden bg-gray-800">
                  <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                    <img 
                      // Grabs a 600px wide by 1200px tall screenshot
                      src={`https://image.thum.io/get/width/600/crop/1200/${bookmark.url}`} 
                      alt={`Preview of ${bookmark.title}`}
                      // The object-top and group-hover/thumb:object-bottom is what triggers the scroll!
                      className="w-full h-full object-cover object-top transition-all duration-[4000ms] ease-in-out group-hover/thumb:object-bottom opacity-90 group-hover/thumb:opacity-100"
                      onError={(e) => {
                        // Fallback pattern if the screenshot fails
                        (e.target as HTMLImageElement).src = `https://placehold.co/600x1200/111827/ffffff?text=${domain}`
                      }}
                    />
                    {/* Dark overlay with "Visit" text that appears on hover */}
                    <div className="absolute inset-0 bg-gray-900/30 opacity-0 group-hover/thumb:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                      <span className="bg-white text-gray-900 font-black px-4 py-2 rounded-xl border-2 border-gray-900 uppercase tracking-widest text-sm shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]">
                        Visit Site
                      </span>
                    </div>
                  </a>
                </div>

                {/* --- CONTENT AREA --- */}
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-4 gap-2">
                    {/* Small Favicon next to title for quick recognition */}
                    <div className="shrink-0 p-1.5 bg-white border-2 border-gray-900 rounded-lg shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]">
                      <img src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`} alt="logo" className="w-5 h-5 object-contain" />
                    </div>
                    
                    <div className="flex gap-2 shrink-0">
                      {isEditing ? (
                        <>
                          <button onClick={() => saveEdit(bookmark.id)} className="p-1.5 text-white bg-green-500 hover:bg-green-600 border-2 border-gray-900 rounded-xl transition-all shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none" title="Save"><CheckIcon /></button>
                          <button onClick={() => setEditingId(null)} className="p-1.5 text-gray-900 bg-white hover:bg-gray-100 border-2 border-gray-900 rounded-xl transition-all shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none" title="Cancel"><XIcon /></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEditing(bookmark)} className="p-1.5 text-gray-900 bg-white hover:bg-yellow-100 border-2 border-gray-900 rounded-xl transition-all shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none" title="Edit"><EditIcon /></button>
                          <button onClick={() => deleteBookmark(bookmark.id)} className="p-1.5 text-white bg-red-500 hover:bg-red-600 border-2 border-gray-900 rounded-xl transition-all shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none" title="Delete"><TrashIcon /></button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex-1">
                    {isEditing ? (
                      <div className="flex flex-col gap-3 mt-2">
                        <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full px-3 py-2 bg-white border-2 border-gray-900 rounded-lg font-black text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-300" />
                        <input type="text" value={editUrl} onChange={(e) => setEditUrl(e.target.value)} className="w-full px-3 py-2 bg-white border-2 border-gray-900 rounded-lg font-bold text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-300" />
                      </div>
                    ) : (
                      <>
                        <h4 className="text-xl font-black text-gray-900 line-clamp-2 leading-tight mb-1" title={bookmark.title}>{bookmark.title}</h4>
                        <p className="text-xs font-bold text-gray-600 truncate" title={bookmark.url}>{domain}</p>
                      </>
                    )}
                  </div>
                </div>

              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}