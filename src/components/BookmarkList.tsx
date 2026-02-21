'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState, useMemo } from 'react'

type Bookmark = {
  id: number; title: string; url: string; category: string; created_at: string; user_id: string
}

// Icons
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
const ExternalLinkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
const XIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>

// Vibrant Neo-Brutalist Pastel Colors
const cardColors = ['bg-[#FFE8EF]', 'bg-[#E8F0FE]', 'bg-[#FFF4E0]', 'bg-[#E6F8F3]', 'bg-[#F0E8FE]']

export default function BookmarkList({ initialBookmarks }: { initialBookmarks: Bookmark[] }) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks)
  
  // Form States
  const [title, setTitle] = useState(''); const [url, setUrl] = useState(''); const [category, setCategory] = useState('')
  
  // Edit States
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState(''); const [editUrl, setEditUrl] = useState(''); const [editCategory, setEditCategory] = useState('')
  
  // Filter State
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
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      
      {/* NEO-BRUTALIST INPUT FORM */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border-4 border-gray-900 shadow-[6px_6px_0px_0px_rgba(17,24,39,1)] mb-12 max-w-4xl mx-auto">
        <h2 className="text-2xl font-black text-gray-900 mb-6 uppercase">Drop a Link</h2>
        <form onSubmit={addBookmark} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input type="text" placeholder="Title (e.g. Next.js Docs)" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-900 rounded-xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-yellow-300 text-gray-900 font-bold placeholder:text-gray-400 transition-all" required />
            <input type="text" placeholder="URL (e.g. nextjs.org)" value={url} onChange={(e) => setUrl(e.target.value)} className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-900 rounded-xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-yellow-300 text-gray-900 font-bold placeholder:text-gray-400 transition-all" required />
            <input type="text" placeholder="Category (e.g. Work, Tools)" value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-900 rounded-xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-pink-300 text-gray-900 font-bold placeholder:text-gray-400 transition-all" />
          </div>
          <button type="submit" className="flex w-full md:w-auto md:ml-auto items-center justify-center gap-2 bg-[#A855F7] hover:bg-[#9333EA] text-white font-black py-4 px-10 rounded-xl border-4 border-gray-900 transition-transform shadow-[4px_4px_0px_0px_rgba(17,24,39,1)] active:translate-y-1 active:translate-x-1 active:shadow-none"><PlusIcon /><span>SAVE</span></button>
        </form>
      </div>

      {/* FILTER BUTTONS BAR */}
      {bookmarks.length > 0 && (
        <div className="mb-10 overflow-x-auto pb-4 custom-scrollbar">
          <div className="flex gap-3">
            {uniqueCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={`shrink-0 px-5 py-2.5 rounded-xl border-4 border-gray-900 font-black uppercase tracking-widest text-sm transition-all active:translate-y-1 active:translate-x-1 active:shadow-none
                  ${activeFilter === cat 
                    ? 'bg-gray-900 text-white shadow-[3px_3px_0px_0px_rgba(253,224,71,1)]' 
                    : 'bg-white text-gray-900 hover:bg-gray-50 shadow-[3px_3px_0px_0px_rgba(17,24,39,1)]'
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
        <div className="flex flex-col items-center justify-center py-24 px-4 bg-white border-4 border-dashed border-gray-300 rounded-3xl">
          <div className="text-gray-300 mb-4 scale-150"><ExternalLinkIcon /></div>
          <h4 className="text-2xl font-black text-gray-400 mb-2 uppercase">No Links Found</h4>
        </div>
      ) : (
        /* SHOWCASE GRID - 1 col mobile, 2 tablet, 3 desktop */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {bookmarks.map((bookmark) => {
            const domain = getDomain(bookmark.url);
            const isEditing = editingId === bookmark.id;
            const cardColorClass = cardColors[bookmark.id % cardColors.length];
            const isVisible = activeFilter === 'All' || (bookmark.category || 'Uncategorized') === activeFilter;
            
            return (
              <div 
                key={bookmark.id} 
                className={`${isVisible ? 'flex' : 'hidden'} flex-col rounded-2xl border-4 border-gray-900 shadow-[6px_6px_0px_0px_rgba(17,24,39,1)] overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(17,24,39,1)] ${cardColorClass}`}
              >
                
                {/* MASSIVE 16:9 SCROLLING THUMBNAIL (Like the screenshot) */}
                <div className="w-full aspect-video border-b-4 border-gray-900 relative group/thumb overflow-hidden bg-gray-800 shrink-0">
                  <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                    <img 
                      // Using a wide format to fetch a beautiful layout
                      src={`https://image.thum.io/get/width/1000/crop/1500/${bookmark.url}`} 
                      alt="Preview" 
                      className="w-full h-full object-cover object-top transition-all duration-[5000ms] ease-in-out group-hover/thumb:object-bottom opacity-95 group-hover/thumb:opacity-100" 
                      onError={(e) => {(e.target as HTMLImageElement).src = `https://placehold.co/1000x1500/111827/ffffff?text=${domain}`}} 
                    />
                  </a>
                </div>

                {/* CONTENT AREA (Underneath thumbnail) */}
                <div className="p-5 flex flex-col flex-1 bg-inherit">
                  
                  {/* Category Pill and Action Buttons */}
                  <div className="flex justify-between items-start mb-4 gap-2">
                    <span className="inline-block px-3 py-1 bg-gray-900 text-white border-2 border-gray-900 text-[10px] font-black uppercase tracking-widest rounded-lg shadow-[2px_2px_0px_0px_rgba(255,255,255,0.5)]">
                      {bookmark.category || 'Uncategorized'}
                    </span>
                    
                    <div className="flex gap-2 shrink-0">
                      {isEditing ? (
                        <>
                          <button onClick={() => saveEdit(bookmark.id)} className="p-1.5 text-white bg-green-500 hover:bg-green-600 border-2 border-gray-900 rounded-lg transition-all shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none"><CheckIcon /></button>
                          <button onClick={() => setEditingId(null)} className="p-1.5 text-gray-900 bg-white hover:bg-gray-100 border-2 border-gray-900 rounded-lg transition-all shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none"><XIcon /></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => { setEditingId(bookmark.id); setEditTitle(bookmark.title); setEditUrl(bookmark.url); setEditCategory(bookmark.category || 'Uncategorized') }} className="p-1.5 text-gray-900 bg-white hover:bg-yellow-100 border-2 border-gray-900 rounded-lg transition-all shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none"><EditIcon /></button>
                          <button onClick={() => deleteBookmark(bookmark.id)} className="p-1.5 text-white bg-red-500 hover:bg-red-600 border-2 border-gray-900 rounded-lg transition-all shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none"><TrashIcon /></button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Text Details */}
                  <div className="flex-1 flex flex-col justify-end">
                    {isEditing ? (
                      <div className="flex flex-col gap-2">
                        <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full px-2 py-1.5 bg-white border-2 border-gray-900 rounded-lg font-black text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-300" placeholder="Title" />
                        <input type="text" value={editUrl} onChange={(e) => setEditUrl(e.target.value)} className="w-full px-2 py-1.5 bg-white border-2 border-gray-900 rounded-lg font-bold text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-300" placeholder="URL" />
                        <input type="text" value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="w-full px-2 py-1.5 bg-white border-2 border-gray-900 rounded-lg font-bold text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-pink-300" placeholder="Category" />
                      </div>
                    ) : (
                      <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="group/link block outline-none rounded-sm focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2">
                        <h4 className="text-xl font-black text-gray-900 line-clamp-1 mb-1 group-hover/link:text-blue-600 transition-colors" title={bookmark.title}>{bookmark.title}</h4>
                        <div className="flex items-center gap-1.5">
                          <img src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`} alt="logo" className="w-4 h-4 object-contain grayscale opacity-70 group-hover/link:grayscale-0 group-hover/link:opacity-100 transition-all" />
                          <p className="text-sm font-bold text-gray-600 truncate group-hover/link:text-blue-500 transition-colors" title={bookmark.url}>{domain}</p>
                        </div>
                      </a>
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