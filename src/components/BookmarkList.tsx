'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState, useMemo } from 'react'

type Bookmark = {
  id: number; 
  title: string; 
  url: string; 
  category: string; 
  created_at: string; 
  user_id: string;
}

// Icons
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
const ExternalLinkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
const LayersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 12 12 17 22 12"/><polyline points="2 17 12 22 22 17"/></svg>
const LinkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
const MonitorIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
const ImageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
const SmallXIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>

// Summer Cool Palette
const filterColors = ['bg-sky-200', 'bg-teal-200', 'bg-indigo-200', 'bg-rose-200', 'bg-orange-200']
const colorThemes = [
  { card: 'bg-sky-100', btn: 'bg-sky-300', hover: 'hover:bg-sky-400' },
  { card: 'bg-teal-100', btn: 'bg-teal-300', hover: 'hover:bg-teal-400' },
  { card: 'bg-rose-100', btn: 'bg-rose-300', hover: 'hover:bg-rose-400' },
  { card: 'bg-amber-100', btn: 'bg-amber-300', hover: 'hover:bg-amber-400' },
  { card: 'bg-indigo-100', btn: 'bg-indigo-300', hover: 'hover:bg-indigo-400' },
  { card: 'bg-emerald-100', btn: 'bg-emerald-300', hover: 'hover:bg-emerald-400' },
]

export default function BookmarkList({ initialBookmarks }: { initialBookmarks: Bookmark[] }) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks)
  
  const [inputMode, setInputMode] = useState<'single' | 'bulk'>('single')
  const [title, setTitle] = useState(''); const [url, setUrl] = useState(''); const [category, setCategory] = useState('')
  const [bulkText, setBulkText] = useState(''); const [bulkCategory, setBulkCategory] = useState('Open Tabs')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState(''); const [editUrl, setEditUrl] = useState(''); const [editCategory, setEditCategory] = useState('')
  const [iframeModes, setIframeModes] = useState<Record<number, boolean>>({})
  const [activeFilter, setActiveFilter] = useState('All')
  
  const [draggedId, setDraggedId] = useState<number | null>(null)
  
  const [customCategories, setCustomCategories] = useState<string[]>([])
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')

  // Create client once outside useEffect
  const supabase = createClient()

  // FIXED: Synchronous WebSockets with safe duplicate checking
  useEffect(() => {
    const channel = supabase.channel('realtime_bookmarks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookmarks' }, (payload) => {
          if (payload.eventType === 'INSERT') {
              // Only add if it doesn't already exist from our instant state update
              setBookmarks((prev) => prev.some(b => b.id === payload.new.id) ? prev : [payload.new as Bookmark, ...prev])
          }
          else if (payload.eventType === 'DELETE') {
              setBookmarks((prev) => prev.filter((b) => b.id !== payload.old.id))
          }
          else if (payload.eventType === 'UPDATE') {
              setBookmarks((prev) => prev.map((b) => b.id === payload.new.id ? (payload.new as Bookmark) : b))
          }
        }).subscribe()

    return () => { supabase.removeChannel(channel) }
  }, []) // Empty dependency array ensures this never tears down mid-session

  const uniqueCategories = useMemo(() => {
      const derived = bookmarks.map(b => b.category || 'Uncategorized')
      return ['All', ...Array.from(new Set([...customCategories, ...derived]))]
  }, [bookmarks, customCategories])
  
  const matchCount = useMemo(() => activeFilter === 'All' ? bookmarks.length : bookmarks.filter(b => (b.category || 'Uncategorized') === activeFilter).length, [bookmarks, activeFilter])
  
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { 'All': bookmarks.length }
    bookmarks.forEach(b => {
      const cat = b.category || 'Uncategorized'
      counts[cat] = (counts[cat] || 0) + 1
    })
    return counts
  }, [bookmarks])

  const formatUrl = (rawUrl: string) => {
    const trimmed = rawUrl.trim()
    return (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) ? 'https://' + trimmed : trimmed
  }

  const getDomain = (link: string) => { try { return new URL(link).hostname } catch { return 'link' } }

  const togglePreviewMode = (id: number) => { setIframeModes(prev => ({ ...prev, [id]: !prev[id] })) }

  const handleAddCategory = () => {
    const trimmed = newCategoryName.trim();
    if (trimmed && !uniqueCategories.includes(trimmed)) {
        setCustomCategories(prev => [...prev, trimmed]);
        setActiveFilter(trimmed); 
    }
    setNewCategoryName('');
    setIsAddingCategory(false);
  }

  const handleDeleteCategory = async (catToDelete: string) => {
    if(window.confirm(`Delete the tab "${catToDelete}"? All links inside will be safely moved to "Uncategorized".`)) {
        setCustomCategories(prev => prev.filter(c => c !== catToDelete));
        setBookmarks(prev => prev.map(b => b.category === catToDelete ? { ...b, category: 'Uncategorized' } : b));
        const { error } = await supabase.from('bookmarks').update({ category: 'Uncategorized' }).eq('category', catToDelete);
        if (error) alert("Failed to delete tab: " + error.message);
        if (activeFilter === catToDelete) setActiveFilter('All');
    }
  }

  // --- DRAG AND DROP HANDLERS ---
  const handleDragStart = (e: React.DragEvent, id: number) => {
    e.dataTransfer.setData('bookmarkId', id.toString())
    setDraggedId(id)
  }
  const handleDragEnd = () => { setDraggedId(null) }
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault() }
  
  const handleDrop = async (e: React.DragEvent, targetCategory: string) => {
    e.preventDefault()
    const bookmarkId = parseInt(e.dataTransfer.getData('bookmarkId'))
    if (!bookmarkId || isNaN(bookmarkId)) return

    // INSTANT UPDATE
    setBookmarks(prev => prev.map(b => b.id === bookmarkId ? { ...b, category: targetCategory } : b))
    const { error } = await supabase.from('bookmarks').update({ category: targetCategory }).eq('id', bookmarkId)
    if (error) alert("Failed to move tab: " + error.message)
  }

  // --- FIXED INSTANT CRUD LOGIC ---

  const addSingleBookmark = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !url) return
    
    // Notice `.select()` - this returns the generated row immediately!
    const { data, error } = await supabase.from('bookmarks')
        .insert([{ title, url: formatUrl(url), category: category.trim() || 'Uncategorized' }])
        .select();

    if (error) {
        alert(error.message)
    } else if (data && data.length > 0) {
        // INSTANTLY update state so it pops onto the screen
        setBookmarks(prev => [data[0], ...prev])
        setTitle(''); setUrl(''); setCategory('')
    }
  }

  const addBulkBookmarks = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bulkText.trim()) return
    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/g;
    const foundUrls = bulkText.match(urlRegex);
    if (!foundUrls || foundUrls.length === 0) { alert("No valid URLs found in the text."); return; }
    
    const newRows = foundUrls.map((foundUrl) => {
        const formattedUrl = formatUrl(foundUrl);
        return { title: `${getDomain(formattedUrl)} Tab`, url: formattedUrl, category: bulkCategory.trim() || 'Open Tabs' }
    });

    const { data, error } = await supabase.from('bookmarks').insert(newRows).select()
    if (error) {
        alert(error.message)
    } else if (data) {
        // INSTANTLY update state
        setBookmarks(prev => [...data, ...prev])
        setBulkText(''); setBulkCategory('Open Tabs');
    }
  }

  const saveEdit = async (id: number) => {
    if (!editTitle || !editUrl) return

    const { data, error } = await supabase.from('bookmarks')
        .update({ title: editTitle, url: formatUrl(editUrl), category: editCategory.trim() || 'Uncategorized' })
        .eq('id', id)
        .select()

    if (error) {
        alert(error.message)
    } else if (data && data.length > 0) {
        // INSTANTLY update state
        setBookmarks(prev => prev.map(b => b.id === id ? data[0] : b))
        setEditingId(null)
    }
  }

  const deleteBookmark = async (id: number) => { 
      // INSTANTLY hide the card from the UI
      setBookmarks(prev => prev.filter(b => b.id !== id))
      
      // Then delete from the database in the background
      const { error } = await supabase.from('bookmarks').delete().eq('id', id); 
      if (error) alert("Failed to delete from database: " + error.message) 
  }

 return (
    <div className="flex flex-col md:flex-row gap-8 w-full max-w-[1600px] mx-auto p-4 md:p-8">
      
      {/* ----------------------------------------------------- */}
      {/* LEFT SIDEBAR: CATEGORIES & DROP ZONES                 */}
      {/* ----------------------------------------------------- */}
      <aside className="w-full md:w-64 flex-shrink-0 md:sticky md:top-8 h-fit space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">Folders</h2>
        </div>

        {/* The Category Drop Zones */}
        <div className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 hide-scrollbar">
          {uniqueCategories.map(cat => (
            <div 
              key={cat}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, cat)}
              onClick={() => setActiveFilter(cat)}
              className={`
                group flex items-center justify-between px-4 py-3 rounded-xl border-2 cursor-pointer transition-all shrink-0 md:shrink
                ${activeFilter === cat 
                  ? 'border-gray-900 bg-gray-900 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]' 
                  : 'border-gray-300 bg-white hover:border-gray-900 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-gray-700'
                }
              `}
            >
              <span className="font-medium text-sm truncate pr-2">{cat}</span>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-md ${activeFilter === cat ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-500'}`}>
                  {categoryCounts[cat] || 0}
                </span>
                {/* Delete custom tab button */}
                {customCategories.includes(cat) && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat); }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400"
                  >
                    <SmallXIcon />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add New Category Tab */}
        <div className="pt-4 border-t-2 border-gray-200 border-dashed">
          {isAddingCategory ? (
            <div className="flex items-center gap-2">
              <input 
                autoFocus
                type="text"
                placeholder="Folder name..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                className="w-full px-3 py-2 text-sm border-2 border-gray-900 rounded-lg outline-none bg-white focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
              />
            </div>
          ) : (
            <button 
              onClick={() => setIsAddingCategory(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-gray-900 hover:text-gray-900 hover:bg-white transition-all"
            >
              <PlusIcon /> Add Folder
            </button>
          )}
        </div>
      </aside>

      {/* ----------------------------------------------------- */}
      {/* RIGHT MAIN AREA: FORMS & BOOKMARK GRID                */}
      {/* ----------------------------------------------------- */}
      <main className="flex-1 space-y-8 min-w-0">
        
        {/* Hidden Datalist for Native Autofill / Dropdown */}
        <datalist id="category-options">
          {uniqueCategories.filter(c => c !== 'All').map(cat => (
            <option key={cat} value={cat} />
          ))}
        </datalist>

        {/* The Input Form Container */}
        <div className="bg-white border-2 border-gray-900 rounded-2xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <form onSubmit={addSingleBookmark} className="flex flex-col sm:flex-row gap-4">
             <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="flex-1 px-4 py-3 border-2 border-gray-900 rounded-xl" />
             <input type="url" placeholder="URL" value={url} onChange={(e) => setUrl(e.target.value)} className="flex-1 px-4 py-3 border-2 border-gray-900 rounded-xl" />
             
             {/* THE NEW CATEGORY INPUT WITH AUTOFILL */}
             <input 
               type="text" 
               list="category-options" 
               placeholder="Folder / Category" 
               value={category} 
               onChange={(e) => setCategory(e.target.value)} 
               className="flex-1 px-4 py-3 border-2 border-gray-900 rounded-xl outline-none bg-slate-50 focus:bg-white focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all" 
             />
             
             <button type="submit" className="px-6 py-3 bg-[#E06D53] text-white font-bold border-2 border-gray-900 rounded-xl hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
                Save
             </button>
          </form>
        </div>

        {/* The 4-Column Bookmark Grid (Now safely inside the main tag) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {bookmarks.map((bookmark) => {
            const isVisible = activeFilter === 'All' || (bookmark.category || 'Uncategorized') === activeFilter
            const theme = colorThemes[bookmark.id % colorThemes.length]

            return (
              <div
                key={bookmark.id}
                draggable
                onDragStart={(e) => handleDragStart(e, bookmark.id)}
                onDragEnd={handleDragEnd}
                className={`
                  relative group flex flex-col bg-white border-2 border-gray-900 rounded-2xl overflow-hidden
                  shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all cursor-grab active:cursor-grabbing
                  ${isVisible ? 'flex' : 'hidden'}
                  ${draggedId === bookmark.id ? 'opacity-50 scale-95' : ''}
                `}
              >
                {/* Live Preview Toggle Button */}
                <button
                  onClick={() => togglePreviewMode(bookmark.id)}
                  className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[9px] font-bold px-2 py-1 rounded-md shadow-sm border border-gray-700"
                >
                  {iframeModes[bookmark.id] ? 'IMAGE' : 'LIVE'}
                </button>

                <div className={`w-full aspect-video border-b-2 border-gray-900 overflow-hidden relative ${theme.card}`}>
                  {iframeModes[bookmark.id] ? (
                    <iframe
                      src={bookmark.url}
                      className="w-full h-full border-none pointer-events-none"
                      sandbox="allow-scripts allow-same-origin"
                      loading="lazy"
                    />
                  ) : (
                    <img
                      src={`https://image.thum.io/get/width/600/crop/1200/noanimate/${bookmark.url}`}
                      alt={bookmark.title}
                      className="w-full h-[300%] object-cover object-top group-hover:object-bottom duration-[4000ms] ease-linear"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${getDomain(bookmark.url)}&background=random&size=600&font-size=0.1`
                      }}
                    />
                  )}
                </div>

                <div className="p-3 flex flex-col min-h-[90px] relative">
                  {/* Action Buttons inside Namespace */}
                  <div className="absolute right-3 top-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setEditingId(bookmark.id);
                        setEditTitle(bookmark.title);
                        setEditUrl(bookmark.url);
                        setEditCategory(bookmark.category || '');
                      }}
                      className="p-1.5 bg-cyan-100 text-cyan-700 border border-gray-900 rounded-md hover:bg-cyan-200 transition-colors"
                    >
                      <EditIcon />
                    </button>
                    <button
                      onClick={() => deleteBookmark(bookmark.id)}
                      className="p-1.5 bg-pink-100 text-pink-700 border border-gray-900 rounded-md hover:bg-pink-200 transition-colors"
                    >
                      <TrashIcon />
                    </button>
                  </div>

                  {editingId === bookmark.id ? (
                    <div className="space-y-2 w-full mt-1">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-2 py-1 text-sm border-2 border-gray-900 rounded bg-white outline-none"
                        placeholder="Title"
                      />
                      <input
                        type="url"
                        value={editUrl}
                        onChange={(e) => setEditUrl(e.target.value)}
                        className="w-full px-2 py-1 text-[10px] border-2 border-gray-900 rounded bg-white outline-none"
                        placeholder="URL"
                      />
                      <input
                        type="text"
                        list="category-options"
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="w-full px-2 py-1 text-[10px] border-2 border-gray-900 rounded bg-white outline-none"
                        placeholder="Category"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveEdit(bookmark.id)}
                          className="flex-1 py-1 bg-[#E06D53] text-white text-xs font-bold border-2 border-gray-900 rounded hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="flex-1 py-1 bg-gray-200 text-gray-700 text-xs font-bold border-2 border-gray-900 rounded hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="block max-w-[75%]">
                        <h3 className="font-medium text-sm text-gray-900 truncate leading-tight">
                          {bookmark.title}
                        </h3>
                      </a>
                      <div className="mt-1 flex items-center gap-1.5 overflow-hidden">
                        <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 min-w-0">
                          <img
                            src={`https://www.google.com/s2/favicons?domain=${getDomain(bookmark.url)}`}
                            alt="favicon"
                            className="w-3 h-3 opacity-60 shrink-0"
                          />
                          <p className="text-[10px] font-medium text-gray-500 truncate">
                            {getDomain(bookmark.url)}
                          </p>
                        </a>
                        <span className="text-[10px] text-gray-400 shrink-0">•</span>
                        <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wider truncate shrink-0">
                          {bookmark.category || 'Uncategorized'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
    