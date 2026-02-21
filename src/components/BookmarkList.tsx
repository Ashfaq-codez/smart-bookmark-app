'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState, useMemo } from 'react'

type Bookmark = {
  id: number; title: string; url: string; category: string; created_at: string; user_id: string
}

// Minimal, sharper icons
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
const ExternalLinkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
const XIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>

// Handcrafted pastel accents for categories instead of full card backgrounds
const pillColors = ['bg-pink-100', 'bg-blue-100', 'bg-yellow-100', 'bg-emerald-100', 'bg-purple-100']

export default function BookmarkList({ initialBookmarks }: { initialBookmarks: Bookmark[] }) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks)
  const [title, setTitle] = useState(''); const [url, setUrl] = useState(''); const [category, setCategory] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState(''); const [editUrl, setEditUrl] = useState(''); const [editCategory, setEditCategory] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')

  const supabase = createClient()

  useEffect(() => {
    const setupRealtime = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const channel = supabase.channel('realtime bookmarks')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'bookmarks' }, (payload) => {
            if (payload.eventType === 'INSERT') setBookmarks((prev) => [payload.new as Bookmark, ...prev])
            else if (payload.eventType === 'DELETE') setBookmarks((prev) => prev.filter((b) => b.id !== payload.old.id))
            else if (payload.eventType === 'UPDATE') setBookmarks((prev) => prev.map((b) => b.id === payload.new.id ? (payload.new as Bookmark) : b))
          }).subscribe()
      return () => { supabase.removeChannel(channel) }
    }
    setupRealtime()
  }, [supabase])

  const uniqueCategories = useMemo(() => ['All', ...Array.from(new Set(bookmarks.map(b => b.category || 'Uncategorized')))], [bookmarks])
  const filteredBookmarks = useMemo(() => activeFilter === 'All' ? bookmarks : bookmarks.filter(b => (b.category || 'Uncategorized') === activeFilter), [bookmarks, activeFilter])
  const formatUrl = (rawUrl: string) => (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) ? 'https://' + rawUrl : rawUrl

  const addBookmark = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !url) return
    const { error } = await supabase.from('bookmarks').insert([{ title, url: formatUrl(url), category: category.trim() || 'Uncategorized' }])
    if (error) alert(error.message)
    else { setTitle(''); setUrl(''); setCategory('') }
  }

  const saveEdit = async (id: number) => {
    if (!editTitle || !editUrl) return
    const { error } = await supabase.from('bookmarks').update({ title: editTitle, url: formatUrl(editUrl), category: editCategory.trim() || 'Uncategorized' }).eq('id', id)
    if (error) alert(error.message)
    else setEditingId(null)
  }

  const deleteBookmark = async (id: number) => { const { error } = await supabase.from('bookmarks').delete().eq('id', id); if (error) alert(error.message) }
  const getDomain = (link: string) => { try { return new URL(link).hostname } catch { return 'link' } }

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 sm:px-6">
      
      {/* COMPACT INPUT FORM */}
      <div className="bg-white p-5 rounded-xl border-2 border-gray-900 shadow-[4px_4px_0px_0px_rgba(17,24,39,1)] mb-10">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Add a new link</h2>
        <form onSubmit={addBookmark} className="flex flex-col sm:flex-row gap-3">
          <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="flex-1 px-3 py-2 bg-gray-50 border-2 border-gray-200 focus:border-gray-900 rounded-md text-sm font-medium outline-none transition-colors placeholder:text-gray-400" required />
          <input type="text" placeholder="URL" value={url} onChange={(e) => setUrl(e.target.value)} className="flex-1 px-3 py-2 bg-gray-50 border-2 border-gray-200 focus:border-gray-900 rounded-md text-sm font-medium outline-none transition-colors placeholder:text-gray-400" required />
          <input type="text" placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} className="w-full sm:w-32 px-3 py-2 bg-gray-50 border-2 border-gray-200 focus:border-gray-900 rounded-md text-sm font-medium outline-none transition-colors placeholder:text-gray-400" />
          <button type="submit" className="flex shrink-0 items-center justify-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-bold py-2 px-5 rounded-md transition-colors"><PlusIcon /><span>Save</span></button>
        </form>
      </div>

      {/* FILTER BUTTONS */}
      {bookmarks.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          {uniqueCategories.map(cat => (
            <button key={cat} onClick={() => setActiveFilter(cat)} className={`px-3 py-1.5 rounded-md border-2 text-xs font-bold transition-all ${activeFilter === cat ? 'border-gray-900 bg-gray-900 text-white shadow-[2px_2px_0px_0px_rgba(253,224,71,1)]' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400 hover:text-gray-900'}`}>
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* HORIZONTAL CARDS GRID (1 col on mobile, 2 on desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filteredBookmarks.map((bookmark) => {
          const domain = getDomain(bookmark.url);
          const isEditing = editingId === bookmark.id;
          const pillColor = pillColors[bookmark.id % pillColors.length];
          
          return (
            <div key={bookmark.id} className="flex flex-col sm:flex-row bg-white rounded-lg border-2 border-gray-900 shadow-[3px_3px_0px_0px_rgba(17,24,39,1)] overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_rgba(17,24,39,1)]">
              
              {/* LEFT: SCROLLING THUMBNAIL (Slimmer width) */}
              <div className="w-full sm:w-36 h-32 sm:h-auto border-b-2 sm:border-b-0 sm:border-r-2 border-gray-900 relative group/thumb overflow-hidden bg-gray-100 shrink-0">
                <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                  <img src={`https://image.thum.io/get/width/600/crop/1200/${bookmark.url}`} alt="Preview" className="w-full h-full object-cover object-top transition-all duration-[4000ms] ease-in-out group-hover/thumb:object-bottom opacity-95 group-hover/thumb:opacity-100" onError={(e) => {(e.target as HTMLImageElement).src = `https://placehold.co/400x800/f3f4f6/111827?text=${domain}`}} />
                </a>
              </div>

              {/* RIGHT: CONTENT & ACTIONS */}
              <div className="p-4 flex flex-col flex-1 min-w-0 justify-between">
                
                {/* Top Row: Category Pill & Edit/Delete */}
                <div className="flex justify-between items-start mb-3 gap-2">
                  <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-900 border border-gray-900 rounded-sm ${pillColor}`}>
                    {bookmark.category || 'Uncategorized'}
                  </span>
                  
                  <div className="flex gap-1.5 shrink-0">
                    {isEditing ? (
                      <>
                        <button onClick={() => saveEdit(bookmark.id)} className="p-1 text-green-700 hover:bg-green-50 rounded transition-colors"><CheckIcon /></button>
                        <button onClick={() => setEditingId(null)} className="p-1 text-gray-500 hover:bg-gray-100 rounded transition-colors"><XIcon /></button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => { setEditingId(bookmark.id); setEditTitle(bookmark.title); setEditUrl(bookmark.url); setEditCategory(bookmark.category || 'Uncategorized') }} className="p-1 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"><EditIcon /></button>
                        <button onClick={() => deleteBookmark(bookmark.id)} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><TrashIcon /></button>
                      </>
                    )}
                  </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1">
                  {isEditing ? (
                    <div className="flex flex-col gap-2">
                      <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full px-2 py-1 bg-white border border-gray-400 rounded text-sm font-bold text-gray-900 focus:outline-none focus:border-gray-900" placeholder="Title" />
                      <input type="text" value={editUrl} onChange={(e) => setEditUrl(e.target.value)} className="w-full px-2 py-1 bg-white border border-gray-400 rounded text-xs font-medium text-gray-600 focus:outline-none focus:border-gray-900" placeholder="URL" />
                      <input type="text" value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="w-full px-2 py-1 bg-white border border-gray-400 rounded text-xs font-medium text-gray-600 focus:outline-none focus:border-gray-900" placeholder="Category" />
                    </div>
                  ) : (
                    <div className="flex flex-col justify-center h-full">
                      <h4 className="text-base font-bold text-gray-900 line-clamp-2 leading-tight mb-1" title={bookmark.title}>{bookmark.title}</h4>
                      <div className="flex items-center gap-1.5">
                        <img src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`} alt="logo" className="w-3.5 h-3.5 object-contain grayscale opacity-70" />
                        <p className="text-xs font-medium text-gray-500 truncate" title={bookmark.url}>{domain}</p>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}