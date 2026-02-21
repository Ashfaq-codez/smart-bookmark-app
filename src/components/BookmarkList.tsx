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

// Warm, vintage pastel pill colors
const pillColors = ['bg-[#FDECE8]', 'bg-[#E8F0F4]', 'bg-[#FDF4E3]', 'bg-[#E8EAE6]', 'bg-[#F4E8F4]']

export default function BookmarkList({ initialBookmarks }: { initialBookmarks: Bookmark[] }) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks)
  
  // Form States
  const [title, setTitle] = useState(''); 
  const [url, setUrl] = useState(''); 
  const [category, setCategory] = useState('')
  
  // Edit States
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState(''); 
  const [editUrl, setEditUrl] = useState(''); 
  const [editCategory, setEditCategory] = useState('')
  
  // Filter State
  const [activeFilter, setActiveFilter] = useState('All')

  const supabase = createClient()

  useEffect(() => {
    const setupRealtime = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      
      const channel = supabase.channel('realtime bookmarks')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'bookmarks' }, (payload) => {
            if (payload.eventType === 'INSERT') {
                setBookmarks((prev) => [payload.new as Bookmark, ...prev])
            } else if (payload.eventType === 'DELETE') {
                setBookmarks((prev) => prev.filter((b) => b.id !== payload.old.id))
            } else if (payload.eventType === 'UPDATE') {
                setBookmarks((prev) => prev.map((b) => b.id === payload.new.id ? (payload.new as Bookmark) : b))
            }
          }).subscribe()
          
      return () => { supabase.removeChannel(channel) }
    }
    setupRealtime()
  }, [supabase])

  // Computed states for filters
  const uniqueCategories = useMemo(() => ['All', ...Array.from(new Set(bookmarks.map(b => b.category || 'Uncategorized')))], [bookmarks])
  const matchCount = useMemo(() => activeFilter === 'All' ? bookmarks.length : bookmarks.filter(b => (b.category || 'Uncategorized') === activeFilter).length, [bookmarks, activeFilter])
  
  const formatUrl = (rawUrl: string) => (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) ? 'https://' + rawUrl : rawUrl

  const addBookmark = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !url) return
    const { error } = await supabase.from('bookmarks').insert([{ title, url: formatUrl(url), category: category.trim() || 'Uncategorized' }])
    
    if (error) {
        alert(error.message)
    } else { 
        setTitle(''); 
        setUrl(''); 
        setCategory('') 
    }
  }

  const saveEdit = async (id: number) => {
    if (!editTitle || !editUrl) return
    const { error } = await supabase.from('bookmarks').update({ title: editTitle, url: formatUrl(editUrl), category: editCategory.trim() || 'Uncategorized' }).eq('id', id)
    
    if (error) {
        alert(error.message)
    } else {
        setEditingId(null)
    }
  }

  const deleteBookmark = async (id: number) => { 
      const { error } = await supabase.from('bookmarks').delete().eq('id', id); 
      if (error) alert(error.message) 
  }
  
  const getDomain = (link: string) => { 
      try { return new URL(link).hostname } catch { return 'link' } 
  }

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 sm:px-6">
      
      {/* VINTAGE COMPACT INPUT FORM */}
      <div className="bg-[#FFFDFB] p-5 rounded border-2 border-stone-800 shadow-[4px_4px_0px_0px_rgba(28,25,23,1)] mb-10">
        <h2 className="text-lg font-bold text-stone-900 mb-4 uppercase tracking-wide">Add a new link</h2>
        <form onSubmit={addBookmark} className="flex flex-col sm:flex-row gap-3">
          <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="flex-1 px-3 py-2 bg-[#F9F8F6] border-2 border-stone-200 focus:border-stone-800 rounded-sm text-sm font-medium outline-none transition-colors placeholder:text-stone-400" required />
          <input type="text" placeholder="URL" value={url} onChange={(e) => setUrl(e.target.value)} className="flex-1 px-3 py-2 bg-[#F9F8F6] border-2 border-stone-200 focus:border-stone-800 rounded-sm text-sm font-medium outline-none transition-colors placeholder:text-stone-400" required />
          <input type="text" placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} className="w-full sm:w-40 px-3 py-2 bg-[#F9F8F6] border-2 border-stone-200 focus:border-stone-800 rounded-sm text-sm font-medium outline-none transition-colors placeholder:text-stone-400" />
          <button type="submit" className="flex shrink-0 items-center justify-center gap-1.5 bg-[#E06D53] hover:bg-[#c95a41] text-white text-sm font-bold py-2 px-6 rounded-sm border-2 border-[#b84a32] transition-colors shadow-[2px_2px_0px_0px_rgba(184,74,50,0.5)] active:translate-y-px active:translate-x-px active:shadow-none">
              <PlusIcon /><span>Save</span>
          </button>
        </form>
      </div>

      {/* FILTER BUTTONS */}
      {bookmarks.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-3">
          {uniqueCategories.map(cat => (
            <button 
                key={cat} 
                onClick={() => setActiveFilter(cat)} 
                className={`px-4 py-1.5 rounded-sm border-2 text-xs font-bold uppercase tracking-wider transition-all shadow-[2px_2px_0px_0px_rgba(28,25,23,1)] active:translate-y-px active:translate-x-px active:shadow-none
                ${activeFilter === cat 
                    ? 'border-stone-800 bg-stone-800 text-white' 
                    : 'border-stone-800 bg-[#FFFDFB] text-stone-700 hover:bg-stone-100'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* EMPTY STATE */}
      {matchCount === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 bg-[#FFFDFB] border-2 border-dashed border-stone-300 rounded">
          <div className="text-stone-400 mb-3"><ExternalLinkIcon /></div>
          <h4 className="text-lg font-bold text-stone-500 mb-1 uppercase tracking-wide">No Links Found</h4>
        </div>
      ) : (
        /* HORIZONTAL CARDS GRID */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {bookmarks.map((bookmark) => {
            const domain = getDomain(bookmark.url);
            const isEditing = editingId === bookmark.id;
            const pillColor = pillColors[bookmark.id % pillColors.length];
            
            // DOM Retention: Hide non-matching cards instead of destroying them
            const isVisible = activeFilter === 'All' || (bookmark.category || 'Uncategorized') === activeFilter;
            
            return (
              <div 
                key={bookmark.id} 
                className={`${isVisible ? 'flex' : 'hidden'} flex-col sm:flex-row bg-[#FFFDFB] rounded border-2 border-stone-800 shadow-[4px_4px_0px_0px_rgba(28,25,23,1)] overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(28,25,23,1)]`}
              >
                
                {/* LEFT: WIDE SCROLLING THUMBNAIL */}
                {/* WIDENED: sm:w-64 gives a beautiful, broad horizontal preview area */}
                <div className="w-full sm:w-64 h-40 sm:h-auto border-b-2 sm:border-b-0 sm:border-r-2 border-stone-800 relative group/thumb overflow-hidden bg-stone-100 shrink-0">
                  <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                    <img 
                      // Using a wider 800px base crop so the image looks sharp in the expanded horizontal space
                      src={`https://image.thum.io/get/width/800/crop/1200/${bookmark.url}`} 
                      alt="Preview" 
                      className="w-full h-full object-cover object-top transition-all duration-[4000ms] ease-in-out group-hover/thumb:object-bottom opacity-95 group-hover/thumb:opacity-100" 
                      onError={(e) => {(e.target as HTMLImageElement).src = `https://placehold.co/800x800/e7e5e4/1c1917?text=${domain}`}} 
                    />
                  </a>
                </div>

                {/* RIGHT: CONTENT & ACTIONS */}
                <div className="p-4 flex flex-col flex-1 min-w-0 justify-between">
                  
                  {/* Top Row: Category Pill & Edit/Delete */}
                  <div className="flex justify-between items-start mb-3 gap-2">
                    <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-stone-900 border border-stone-800 rounded-sm ${pillColor}`}>
                      {bookmark.category || 'Uncategorized'}
                    </span>
                    
                    <div className="flex gap-1.5 shrink-0">
                      {isEditing ? (
                        <>
                          <button onClick={() => saveEdit(bookmark.id)} className="p-1 text-[#E06D53] hover:bg-orange-50 rounded transition-colors" title="Save"><CheckIcon /></button>
                          <button onClick={() => setEditingId(null)} className="p-1 text-stone-500 hover:bg-stone-100 rounded transition-colors" title="Cancel"><XIcon /></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => { setEditingId(bookmark.id); setEditTitle(bookmark.title); setEditUrl(bookmark.url); setEditCategory(bookmark.category || 'Uncategorized') }} className="p-1 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded transition-colors" title="Edit"><EditIcon /></button>
                          <button onClick={() => deleteBookmark(bookmark.id)} className="p-1 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete"><TrashIcon /></button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Main Content Area */}
                  <div className="flex-1">
                    {isEditing ? (
                      <div className="flex flex-col gap-2">
                        <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full px-2 py-1 bg-white border border-stone-400 rounded-sm text-sm font-bold text-stone-900 focus:outline-none focus:border-[#E06D53]" placeholder="Title" />
                        <input type="text" value={editUrl} onChange={(e) => setEditUrl(e.target.value)} className="w-full px-2 py-1 bg-white border border-stone-400 rounded-sm text-xs font-medium text-stone-600 focus:outline-none focus:border-[#E06D53]" placeholder="URL" />
                        <input type="text" value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="w-full px-2 py-1 bg-white border border-stone-400 rounded-sm text-xs font-medium text-stone-600 focus:outline-none focus:border-[#E06D53]" placeholder="Category" />
                      </div>
                    ) : (
                      <div className="flex flex-col justify-center h-full">
                        {/* Interactive text links with terracotta hover */}
                        <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="group/link block outline-none rounded-sm focus-visible:ring-2 focus-visible:ring-stone-800 focus-visible:ring-offset-2">
                          <h4 className="text-base font-bold text-stone-900 line-clamp-2 leading-tight mb-1.5 group-hover/link:text-[#E06D53] transition-colors" title={bookmark.title}>{bookmark.title}</h4>
                          <div className="flex items-center gap-2">
                            <div className="p-0.5 bg-stone-100 border border-stone-200 rounded-sm">
                                <img src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`} alt="logo" className="w-3 h-3 object-contain grayscale opacity-70 group-hover/link:grayscale-0 group-hover/link:opacity-100 transition-all" />
                            </div>
                            <p className="text-xs font-medium text-stone-500 truncate group-hover/link:text-[#c95a41] transition-colors" title={bookmark.url}>{domain}</p>
                          </div>
                        </a>
                      </div>
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