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
const PlusIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
const TrashIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
const EditIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
const SmallXIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>

// Summer Cool Palette
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
  
  // Tab Management State
  const [inputMode, setInputMode] = useState<'single' | 'bulk'>('single')
  
  // Single Input States
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('')
  
  // Bulk Input States
  const [bulkText, setBulkText] = useState('');
  const [bulkCategory, setBulkCategory] = useState('Open Tabs')
  
  // Edit & Display States
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editCategory, setEditCategory] = useState('')
  const [iframeModes, setIframeModes] = useState<Record<number, boolean>>({})
  const [activeFilter, setActiveFilter] = useState('All')

  // Drag and Drop State
  const [draggedId, setDraggedId] = useState<number | null>(null)
  
  // Custom Tabs State
  const [customCategories, setCustomCategories] = useState<string[]>([])
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')

  const supabase = createClient()

  useEffect(() => {
    let channel: any;
    const setupRealtime = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      channel = supabase
        .channel('realtime_bookmarks')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'bookmarks' }, (payload) => {
          if (payload.eventType === 'INSERT') setBookmarks(prev => [...prev, payload.new as Bookmark])
          if (payload.eventType === 'DELETE') setBookmarks(prev => prev.filter(b => b.id !== payload.old.id))
          if (payload.eventType === 'UPDATE') setBookmarks(prev => prev.map(b => b.id === payload.new.id ? payload.new as Bookmark : b))
        })
        .subscribe()
    }
    setupRealtime()
    return () => { if (channel) supabase.removeChannel(channel) }
  }, [supabase])

  const uniqueCategories = useMemo(() => {
    const derived = bookmarks.map(b => b.category || 'Uncategorized')
    return ['All', ...Array.from(new Set([...customCategories, ...derived]))]
  }, [bookmarks, customCategories])

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

  const getDomain = (link: string) => {
    try { return new URL(link).hostname } catch { return 'link' }
  }

  const togglePreviewMode = (id: number) => {
    setIframeModes(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // --- TAB MANAGEMENT LOGIC ---
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
    if(window.confirm(`Delete the folder "${catToDelete}"? All links inside will remain in "Uncategorized".`)) {
      setCustomCategories(prev => prev.filter(c => c !== catToDelete));
      if (activeFilter === catToDelete) setActiveFilter('All');
    }
  }

  // --- DRAG AND DROP HANDLERS ---
  const handleDragStart = (e: React.DragEvent, id: number) => {
    e.dataTransfer.setData('bookmarkId', id.toString())
    setDraggedId(id)
  }
  const handleDragEnd = () => setDraggedId(null)
  const handleDragOver = (e: React.DragEvent) => e.preventDefault()
  
  const handleDrop = async (e: React.DragEvent, targetCategory: string) => {
    e.preventDefault()
    const bookmarkId = parseInt(e.dataTransfer.getData('bookmarkId'))
    if (!bookmarkId || isNaN(bookmarkId)) return

    const actualTarget = targetCategory === 'All' ? 'Uncategorized' : targetCategory
    setBookmarks(prev => prev.map(b => b.id === bookmarkId ? { ...b, category: actualTarget } : b))
    
    const { error } = await supabase.from('bookmarks').update({ category: actualTarget }).eq('id', bookmarkId)
    if (error) alert(error.message)
  }

  // --- CRUD LOGIC WITH VALIDATION ---
  const addSingleBookmark = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !url) return
    
    const formatted = formatUrl(url);
    
    // VALIDATION: Check if URL already exists
    const existingBookmark = bookmarks.find(b => b.url === formatted);
    if (existingBookmark) {
      alert(`This bookmark is already saved in the '${existingBookmark.category || 'Uncategorized'}' folder!`);
      return;
    }

    const { data, error } = await supabase.from('bookmarks').insert([{ title, url: formatted, category: category.trim() || 'Uncategorized' }]).select()
    if (error) alert(error.message)
    else if (data) {
      setBookmarks(prev => [...prev, data[0]])
      setTitle(''); setUrl(''); setCategory('');
    }
  }

  const addBulkBookmarks = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bulkText.trim()) return
    
    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/g;
    const foundUrls = bulkText.match(urlRegex);
    if (!foundUrls || foundUrls.length === 0) {
      alert("No valid URLs found in the text.");
      return;
    }

    // VALIDATION: Filter out duplicates
    const uniqueNewUrls = Array.from(new Set(foundUrls.map(formatUrl)));
    const finalUrlsToSave = uniqueNewUrls.filter(u => !bookmarks.some(b => b.url === u));

    if (finalUrlsToSave.length === 0) {
      alert("All URLs found in the text are already saved in your collection!");
      return;
    }

    const duplicatesCount = uniqueNewUrls.length - finalUrlsToSave.length;
    if (duplicatesCount > 0) {
      alert(`Skipped ${duplicatesCount} duplicates. Saving ${finalUrlsToSave.length} new bookmarks.`);
    }

    const newRows = finalUrlsToSave.map((formattedUrl) => {
      return { title: `${getDomain(formattedUrl)} Tab`, url: formattedUrl, category: bulkCategory.trim() || 'Open Tabs' }
    });

    const { data, error } = await supabase.from('bookmarks').insert(newRows).select()
    if (error) alert(error.message)
    else if (data) {
      setBookmarks(prev => [...prev, ...data])
      setBulkText(''); setBulkCategory('Open Tabs');
    }
  }

  const saveEdit = async (id: number) => {
    if (!editTitle || !editUrl) return
    const { data, error } = await supabase.from('bookmarks').update({ title: editTitle, url: formatUrl(editUrl), category: editCategory.trim() || 'Uncategorized' }).eq('id', id).select()
    if (error) alert(error.message)
    else if (data) {
      setBookmarks(prev => prev.map(b => b.id === id ? data[0] : b))
      setEditingId(null)
    }
  }

  const deleteBookmark = async (id: number) => {
    setBookmarks(prev => prev.filter(b => b.id !== id))
    const { error } = await supabase.from('bookmarks').delete().eq('id', id);
    if (error) alert(error.message)
  }

  return (
    <div className="flex flex-col md:flex-row gap-8 w-full max-w-[1600px] mx-auto p-4 md:p-8">
      
      {/* ----------------------------------------------------- */}
      {/* LEFT SIDEBAR: FOLDERS & DROP ZONES                    */}
      {/* ----------------------------------------------------- */}
      <aside className="w-full md:w-64 flex-shrink-0 md:sticky md:top-8 h-fit space-y-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">Folders</h2>
        </div>

        <div className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 [&::-webkit-scrollbar]:hidden -mx-4 px-4 md:mx-0 md:px-0 snap-x">
          {uniqueCategories.map(cat => (
            <div 
              key={cat}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, cat)}
              onClick={() => setActiveFilter(cat)}
              className={`
                group flex items-center justify-between px-4 py-3 rounded-xl border-2 cursor-pointer transition-all shrink-0 md:shrink snap-start
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

        <div className="pt-4 border-t-2 border-gray-200 border-dashed hidden md:block">
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
        
        {/* Hidden Datalist for Native Dropdown Autofill */}
        <datalist id="category-options">
          {uniqueCategories.filter(c => c !== 'All').map(cat => (
            <option key={cat} value={cat} />
          ))}
        </datalist>

        {/* Form Container (Keeps your exact Neo-brutalist theme and bulk feature) */}
        <div className="bg-white border-2 border-gray-900 rounded-2xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex gap-4 mb-6">
            <button 
              onClick={() => setInputMode('single')}
              className={`pb-2 text-sm font-bold transition-all ${inputMode === 'single' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Single Link
            </button>
            <button 
              onClick={() => setInputMode('bulk')}
              className={`pb-2 text-sm font-bold transition-all ${inputMode === 'bulk' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Bulk Extract
            </button>
          </div>

          {inputMode === 'single' ? (
            <form onSubmit={addSingleBookmark} className="flex flex-col sm:flex-row gap-4">
              <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="flex-1 px-4 py-3 border-2 border-gray-900 rounded-xl outline-none bg-slate-50 focus:bg-white focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all" />
              <input type="url" placeholder="URL" value={url} onChange={(e) => setUrl(e.target.value)} className="flex-1 px-4 py-3 border-2 border-gray-900 rounded-xl outline-none bg-slate-50 focus:bg-white focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all" />
              
              {/* Category input using the native datalist */}
              <input 
                type="text" 
                list="category-options"
                placeholder="Folder" 
                value={category} 
                onChange={(e) => setCategory(e.target.value)} 
                className="flex-1 px-4 py-3 border-2 border-gray-900 rounded-xl outline-none bg-slate-50 focus:bg-white focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all" 
              />
              <button type="submit" className="px-6 py-3 bg-[#E06D53] text-white font-bold border-2 border-gray-900 rounded-xl hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
                Save
              </button>
            </form>
          ) : (
            <form onSubmit={addBulkBookmarks} className="flex flex-col gap-4">
              <textarea 
                placeholder="Paste a wall of text here. I will extract all the URLs automatically..." 
                value={bulkText} 
                onChange={(e) => setBulkText(e.target.value)} 
                className="w-full px-4 py-3 border-2 border-gray-900 rounded-xl h-32 resize-y outline-none bg-slate-50 focus:bg-white focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all" 
              />
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Bulk Category input using the native datalist */}
                <input 
                  type="text" 
                  list="category-options"
                  placeholder="Folder for these tabs (e.g., Open Tabs)" 
                  value={bulkCategory} 
                  onChange={(e) => setBulkCategory(e.target.value)} 
                  className="flex-1 px-4 py-3 border-2 border-gray-900 rounded-xl outline-none bg-slate-50 focus:bg-white focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all" 
                />
                <button type="submit" className="px-6 py-3 bg-indigo-500 text-white font-bold border-2 border-gray-900 rounded-xl hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
                  Extract & Save
                </button>
              </div>
            </form>
          )}
        </div>

        {/* The 4-Column Bookmark Grid (Keeps exact themes and DOM retention) */}
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
                        placeholder="Folder"
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