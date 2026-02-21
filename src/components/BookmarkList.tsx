'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState, useMemo } from 'react'

type Bookmark = {
  id: number; title: string; url: string; category: string; created_at: string; user_id: string
}

// Icons scaled down slightly to match thinner typography
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
const ExternalLinkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>

export default function BookmarkList({ initialBookmarks }: { initialBookmarks: Bookmark[] }) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks)
  
  // States
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
  const matchCount = useMemo(() => activeFilter === 'All' ? bookmarks.length : bookmarks.filter(b => (b.category || 'Uncategorized') === activeFilter).length, [bookmarks, activeFilter])
  
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
    <div className="max-w-[1400px] mx-auto py-10 px-4 sm:px-6">
      
      {/* COMPACT, PLEASING INPUT FORM */}
      {/* Borders reduced to 2px, shadows slightly softened */}
      <div className="bg-white p-5 rounded-xl border-2 border-gray-900 shadow-[3px_3px_0px_0px_rgba(17,24,39,1)] mb-8 max-w-4xl">
        <h2 className="text-base font-extrabold text-gray-900 mb-3 uppercase tracking-wide">Add Link</h2>
        <form onSubmit={addBookmark} className="flex flex-col sm:flex-row gap-2.5">
          <input type="text" placeholder="Title (e.g. Next.js)" value={title} onChange={(e) => setTitle(e.target.value)} className="flex-1 px-3 py-2 bg-gray-50 border-2 border-gray-900 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-yellow-300 text-sm font-bold placeholder:text-gray-400 transition-all" required />
          <input type="text" placeholder="URL" value={url} onChange={(e) => setUrl(e.target.value)} className="flex-1 px-3 py-2 bg-gray-50 border-2 border-gray-900 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-yellow-300 text-sm font-bold placeholder:text-gray-400 transition-all" required />
          <input type="text" placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} className="w-full sm:w-40 px-3 py-2 bg-gray-50 border-2 border-gray-900 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-yellow-300 text-sm font-bold placeholder:text-gray-400 transition-all" />
          <button type="submit" className="flex shrink-0 items-center justify-center gap-1 bg-gray-900 hover:bg-gray-800 text-yellow-400 text-xs font-extrabold uppercase py-2 px-5 rounded-lg border-2 border-gray-900 transition-transform active:translate-y-px active:translate-x-px"><PlusIcon /><span>Save</span></button>
        </form>
      </div>

      {/* FILTER BUTTONS BAR */}
      {bookmarks.length > 0 && (
        <div className="mb-6 overflow-x-auto pb-2">
          <div className="flex gap-2">
            {uniqueCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={`shrink-0 px-3 py-1.5 rounded-lg border-2 border-gray-900 font-extrabold uppercase tracking-wider text-[11px] transition-all active:translate-y-px active:translate-x-px active:shadow-none
                  ${activeFilter === cat 
                    ? 'bg-yellow-400 text-gray-900 shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]' 
                    : 'bg-white text-gray-600 hover:bg-gray-50 shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* EMPTY STATE */}
      {matchCount === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-white border-2 border-dashed border-gray-300 rounded-xl">
          <div className="text-gray-300 mb-2 scale-110"><ExternalLinkIcon /></div>
          <h4 className="text-base font-extrabold text-gray-400 mb-1 uppercase">No Links Found</h4>
        </div>
      ) : (
        /* 4-COLUMN TILING GRID - REFINED */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {bookmarks.map((bookmark) => {
            const domain = getDomain(bookmark.url);
            const isEditing = editingId === bookmark.id;
            const isVisible = activeFilter === 'All' || (bookmark.category || 'Uncategorized') === activeFilter;
            
            return (
              <div 
                key={bookmark.id} 
                // Card borders reduced to 2px, shadow softened to 3px
                className={`${isVisible ? 'flex' : 'hidden'} flex-col bg-white rounded-xl border-2 border-gray-900 shadow-[3px_3px_0px_0px_rgba(17,24,39,1)] overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-[5px_5px_0px_0px_rgba(17,24,39,1)]`}
              >
                
                {/* THUMBNAIL */}
                <div className="w-full aspect-[16/10] border-b-2 border-gray-900 relative group/thumb overflow-hidden bg-gray-50 shrink-0">
                  <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                    <img 
                      src={`https://image.thum.io/get/width/600/crop/1200/${bookmark.url}`} 
                      alt="Preview" 
                      className="w-full h-full object-cover object-top transition-all duration-[4000ms] ease-in-out group-hover/thumb:object-bottom opacity-95 group-hover/thumb:opacity-100" 
                      onError={(e) => {(e.target as HTMLImageElement).src = `https://placehold.co/600x600/f8fafc/111827?text=${domain}`}} 
                    />
                  </a>
                  
                  {/* Floating Action Buttons */}
                  {!isEditing && (
                    <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingId(bookmark.id); setEditTitle(bookmark.title); setEditUrl(bookmark.url); setEditCategory(bookmark.category || 'Uncategorized') }} className="p-1.5 bg-yellow-300 hover:bg-yellow-400 text-gray-900 border-2 border-gray-900 rounded-md shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]"><EditIcon /></button>
                      <button onClick={() => deleteBookmark(bookmark.id)} className="p-1.5 bg-white hover:bg-red-500 hover:text-white text-gray-900 border-2 border-gray-900 rounded-md shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]"><TrashIcon /></button>
                    </div>
                  )}
                </div>

                {/* CONTENT AREA - Smaller, elegant fonts */}
                <div className="p-3.5 flex flex-col flex-1">
                  {isEditing ? (
                    <div className="flex flex-col gap-1.5">
                      <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full px-2 py-1 bg-white border-2 border-gray-900 rounded-md font-bold text-xs text-gray-900 outline-none focus:ring-2 focus:ring-yellow-300" placeholder="Title" />
                      <input type="text" value={editUrl} onChange={(e) => setEditUrl(e.target.value)} className="w-full px-2 py-1 bg-white border-2 border-gray-900 rounded-md font-medium text-[11px] text-gray-600 outline-none focus:ring-2 focus:ring-yellow-300" placeholder="URL" />
                      <input type="text" value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="w-full px-2 py-1 bg-white border-2 border-gray-900 rounded-md font-medium text-[11px] text-gray-600 outline-none focus:ring-2 focus:ring-yellow-300" placeholder="Category" />
                      <div className="flex gap-1.5 mt-1">
                          <button onClick={() => saveEdit(bookmark.id)} className="flex-1 py-1 bg-gray-900 text-yellow-400 font-extrabold text-[10px] uppercase border-2 border-gray-900 rounded-md">Save</button>
                          <button onClick={() => setEditingId(null)} className="flex-1 py-1 bg-white text-gray-900 font-extrabold text-[10px] uppercase border-2 border-gray-900 rounded-md">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col justify-center">
                      <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="group/link block outline-none">
                        {/* Title reduced to text-sm */}
                        <h4 className="text-sm font-bold text-gray-900 line-clamp-1 group-hover/link:text-blue-600 transition-colors" title={bookmark.title}>
                            {bookmark.title}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <img src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`} alt="logo" className="w-3 h-3 object-contain grayscale opacity-60 group-hover/link:grayscale-0 group-hover/link:opacity-100 transition-all" />
                          {/* Details reduced to text-[10px] */}
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide truncate group-hover/link:text-blue-500 transition-colors">
                            {bookmark.category || 'Uncategorized'} • {domain}
                          </p>
                        </div>
                      </a>
                    </div>
                  )}
                </div>

              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}