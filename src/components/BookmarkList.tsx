'use client'
import { createClient } from '@/utils/supabase/client'
import { useEffect, useState, useMemo } from 'react'

type Bookmark = {
  id: number;
  title: string;
  url: string;
  category: string;
  sub_category?: string | null;
  created_at: string;
  user_id: string;
}

// Icons
const PlusIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
const TrashIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
const EditIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
const SmallXIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
const ChevronRight = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
const ChevronDown = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
const MoveIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><path d="M12 11v6"/><path d="M9 14l3 3 3-3"/></svg>

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
  const [subCategory, setSubCategory] = useState('')
  
  // Bulk Input States
  const [bulkText, setBulkText] = useState('');
  const [bulkCategory, setBulkCategory] = useState('Open Tabs')
  
  // Edit States
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editCategory, setEditCategory] = useState('')
  const [editSubCategory, setEditSubCategory] = useState('')

  // Move States
  const [movingId, setMovingId] = useState<number | null>(null)
  const [moveCategory, setMoveCategory] = useState('')
  const [moveSubCategory, setMoveSubCategory] = useState('')
  
  const [iframeModes, setIframeModes] = useState<Record<number, boolean>>({})
  
  // Filter States
  const [activeFilter, setActiveFilter] = useState('All')
  const [activeSubFilter, setActiveSubFilter] = useState<string | null>(null)

  // Drag and Drop State
  const [draggedId, setDraggedId] = useState<number | null>(null)
  
  // Custom Folder States
  const [customCategories, setCustomCategories] = useState<string[]>([])
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  
  // Subfolder UI States
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({})
  const [creatingSubFor, setCreatingSubFor] = useState<string | null>(null)
  const [newSubfolderName, setNewSubfolderName] = useState('')
  const [customSubCategories, setCustomSubCategories] = useState<Record<string, string[]>>({})

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

  const folderHierarchy = useMemo(() => {
    const tree: Record<string, string[]> = {};
    const baseCats = Array.from(new Set([...customCategories, ...bookmarks.map(b => b.category || 'Uncategorized')]));
    baseCats.forEach(cat => { if (cat !== 'All') tree[cat] = []; });

    bookmarks.forEach(b => {
      const parent = b.category || 'Uncategorized';
      if (b.sub_category) {
        if (!tree[parent]) tree[parent] = [];
        if (!tree[parent].includes(b.sub_category)) tree[parent].push(b.sub_category);
      }
    });

    Object.entries(customSubCategories).forEach(([parent, subs]) => {
      if (!tree[parent]) tree[parent] = [];
      subs.forEach(sub => { if (!tree[parent].includes(sub)) tree[parent].push(sub); });
    });

    return tree;
  }, [bookmarks, customCategories, customSubCategories])

  // UPDATED: Precise Counting Logic
  const getCounts = useMemo(() => {
    const counts: Record<string, number> = { 'All': bookmarks.length };
    
    bookmarks.forEach(b => {
      const cat = b.category || 'Uncategorized';
      const sub = b.sub_category;
      
      // If it has NO subfolder, count it towards the main folder
      if (!sub) {
        counts[cat] = (counts[cat] || 0) + 1;
      }
      
      // If it HAS a subfolder, count it towards the specific Subfolder only
      if (sub) {
        const subKey = `${cat}::${sub}`;
        counts[subKey] = (counts[subKey] || 0) + 1;
      }
    });
    
    return counts;
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

  // --- FOLDER & SUBFOLDER MANAGEMENT ---
  const handleAddCategory = () => {
    const trimmed = newCategoryName.trim();
    if (trimmed && !Object.keys(folderHierarchy).includes(trimmed)) {
      setCustomCategories(prev => [...prev, trimmed]);
      setActiveFilter(trimmed);
      setActiveSubFilter(null);
    }
    setNewCategoryName('');
    setIsAddingCategory(false);
  }

  const handleAddSubfolder = (parentFolder: string) => {
    const trimmed = newSubfolderName.trim();
    if (trimmed) {
      setCustomSubCategories(prev => {
        const existingSubs = prev[parentFolder] || [];
        if (existingSubs.includes(trimmed)) return prev;
        return { ...prev, [parentFolder]: [...existingSubs, trimmed] };
      });
      setActiveFilter(parentFolder);
      setActiveSubFilter(trimmed);
    }
    setNewSubfolderName('');
    setCreatingSubFor(null);
  }

  const handleDeleteCategory = async (catToDelete: string) => {
    if(window.confirm(`Delete the folder "${catToDelete}"? All links inside will remain in "Uncategorized".`)) {
      setCustomCategories(prev => prev.filter(c => c !== catToDelete));
      if (activeFilter === catToDelete) {
        setActiveFilter('All');
        setActiveSubFilter(null);
      }
    }
  }

  const toggleFolderExpand = (folder: string) => {
    setExpandedFolders(prev => ({ ...prev, [folder]: !prev[folder] }))
  }

  // --- DRAG AND DROP HANDLERS ---
  const handleDragStart = (e: React.DragEvent, id: number) => {
    e.dataTransfer.setData('bookmarkId', id.toString())
    setDraggedId(id)
  }
  const handleDragEnd = () => setDraggedId(null)
  const handleDragOver = (e: React.DragEvent) => e.preventDefault()
  
  const handleDrop = async (e: React.DragEvent, targetCategory: string, targetSubCategory?: string) => {
    e.preventDefault()
    const bookmarkId = parseInt(e.dataTransfer.getData('bookmarkId'))
    if (!bookmarkId || isNaN(bookmarkId)) return

    const actualTarget = targetCategory === 'All' ? 'Uncategorized' : targetCategory
    const subTarget = targetSubCategory || null;

    setBookmarks(prev => prev.map(b => b.id === bookmarkId ? { ...b, category: actualTarget, sub_category: subTarget } : b))
    
    const { error } = await supabase.from('bookmarks').update({ category: actualTarget, sub_category: subTarget }).eq('id', bookmarkId)
    if (error) alert(error.message)
  }

  // --- CRUD LOGIC ---
  const addSingleBookmark = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !url) return
    const formatted = formatUrl(url);
    const finalCategory = category.trim() || 'Uncategorized';
    const finalSubCategory = subCategory.trim() || null;
    
    const existingBookmark = bookmarks.find(b => b.url === formatted);
    if (existingBookmark) {
      alert(`This bookmark is already saved in the '${existingBookmark.category}' folder!`);
      return;
    }

    const { data, error } = await supabase.from('bookmarks').insert([{ title, url: formatted, category: finalCategory, sub_category: finalSubCategory }]).select()
    if (error) alert(error.message)
    else if (data) {
      setBookmarks(prev => [...prev, data[0]])
      setTitle(''); setUrl(''); setCategory(''); setSubCategory('');
    }
  }

  const addBulkBookmarks = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bulkText.trim()) return
    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/g;
    const foundUrls = bulkText.match(urlRegex);
    if (!foundUrls || foundUrls.length === 0) return alert("No valid URLs found in the text.");

    const uniqueNewUrls = Array.from(new Set(foundUrls.map(formatUrl)));
    const finalUrlsToSave = uniqueNewUrls.filter(u => !bookmarks.some(b => b.url === u));

    if (finalUrlsToSave.length === 0) return alert("All URLs found in the text are already saved in your collection!");

    const newRows = finalUrlsToSave.map((formattedUrl) => ({ title: `${getDomain(formattedUrl)} Tab`, url: formattedUrl, category: bulkCategory.trim() || 'Open Tabs', sub_category: null }));
    const { data, error } = await supabase.from('bookmarks').insert(newRows).select()
    if (error) alert(error.message)
    else if (data) {
      setBookmarks(prev => [...prev, ...data])
      setBulkText(''); setBulkCategory('Open Tabs');
    }
  }

  const saveEdit = async (id: number) => {
    if (!editTitle || !editUrl) return
    const { data, error } = await supabase.from('bookmarks').update({ title: editTitle, url: formatUrl(editUrl), category: editCategory.trim() || 'Uncategorized', sub_category: editSubCategory.trim() || null }).eq('id', id).select()
    if (error) alert(error.message)
    else if (data) {
      setBookmarks(prev => prev.map(b => b.id === id ? data[0] : b))
      setEditingId(null)
    }
  }

  const saveMove = async (id: number) => {
    const finalCat = moveCategory.trim() || 'Uncategorized';
    const finalSub = moveSubCategory.trim() || null;
    const { data, error } = await supabase.from('bookmarks').update({ category: finalCat, sub_category: finalSub }).eq('id', id).select();
    
    if (error) alert(error.message)
    else if (data) {
      setBookmarks(prev => prev.map(b => b.id === id ? data[0] : b))
      setMovingId(null)
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
      {/* LEFT SIDEBAR: FOLDERS & SUBFOLDERS                    */}
      {/* ----------------------------------------------------- */}
      <aside className="w-full md:w-64 flex-shrink-0 md:sticky md:top-8 h-fit space-y-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">Folders</h2>
        </div>

        <div className="flex flex-col gap-2 overflow-x-hidden md:overflow-visible pb-2 md:pb-0">
          
          <div 
            onClick={() => { setActiveFilter('All'); setActiveSubFilter(null); }}
            className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${activeFilter === 'All' ? 'border-gray-900 bg-gray-900 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]' : 'border-gray-300 bg-white hover:border-gray-900 text-gray-700'}`}
          >
             <span className="font-medium text-sm">All Bookmarks</span>
             <span className={`text-xs px-2 py-1 rounded-md ${activeFilter === 'All' ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-500'}`}>
                {getCounts['All']}
             </span>
          </div>

          {Object.keys(folderHierarchy).map(parentFolder => {
            const isParentActive = activeFilter === parentFolder;
            const isExpanded = expandedFolders[parentFolder];
            const subfolders = folderHierarchy[parentFolder];
            const parentCount = getCounts[parentFolder] || 0;

            return (
              <div key={parentFolder} className="flex flex-col gap-1">
                <div 
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, parentFolder)}
                  className={`group flex items-center justify-between px-3 py-2 rounded-xl border-2 transition-all ${isParentActive && !activeSubFilter ? 'border-gray-900 bg-gray-900 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]' : 'border-gray-300 bg-white hover:border-gray-900 text-gray-700'}`}
                >
                  <div className="flex items-center gap-2 overflow-hidden cursor-pointer flex-1" onClick={() => { setActiveFilter(parentFolder); setActiveSubFilter(null); }}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleFolderExpand(parentFolder); }}
                      className={`p-1 rounded hover:bg-gray-200/20 transition-colors ${isParentActive && !activeSubFilter ? 'text-white' : 'text-gray-500'}`}
                    >
                      {isExpanded ? <ChevronDown /> : <ChevronRight />}
                    </button>
                    <span className="font-medium text-sm truncate">{parentFolder}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs px-2 py-1 rounded-md ${isParentActive && !activeSubFilter ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-500'}`}>
                      {parentCount}
                    </span>
                    {customCategories.includes(parentFolder) && (
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteCategory(parentFolder); }} className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400">
                        <SmallXIcon />
                      </button>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="ml-6 pl-2 border-l-2 border-gray-200 flex flex-col gap-1 py-1">
                    {subfolders.map(sub => {
                      const isSubActive = isParentActive && activeSubFilter === sub;
                      const subCount = getCounts[`${parentFolder}::${sub}`] || 0;
                      return (
                        <div
                          key={sub}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, parentFolder, sub)}
                          onClick={() => { setActiveFilter(parentFolder); setActiveSubFilter(sub); }}
                          className={`flex items-center justify-between px-3 py-2 text-sm rounded-lg border-2 cursor-pointer transition-all ${isSubActive ? 'border-gray-900 bg-gray-100 text-gray-900 font-bold' : 'border-transparent bg-transparent hover:border-gray-300 text-gray-600 hover:bg-white'}`}
                        >
                          <span className="truncate pr-2">{sub}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${isSubActive ? 'bg-gray-300 text-gray-800' : 'bg-gray-200 text-gray-500'}`}>
                            {subCount}
                          </span>
                        </div>
                      )
                    })}

                    {creatingSubFor === parentFolder ? (
                      <div className="flex gap-2 mt-1">
                        <input 
                          autoFocus
                          type="text"
                          placeholder="Subfolder..."
                          value={newSubfolderName}
                          onChange={(e) => setNewSubfolderName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddSubfolder(parentFolder)}
                          className="w-full px-2 py-1.5 text-xs border-2 border-gray-900 rounded outline-none bg-white"
                        />
                        <button onClick={() => setCreatingSubFor(null)} className="px-2 text-xs font-bold text-gray-500 hover:text-gray-900">X</button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setCreatingSubFor(parentFolder)}
                        className="flex items-center gap-2 px-3 py-1.5 mt-1 text-xs font-bold text-gray-400 hover:text-gray-900 transition-colors text-left"
                      >
                        <PlusIcon /> Add Subfolder
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
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
              <PlusIcon /> New Folder
            </button>
          )}
        </div>
      </aside>

      {/* ----------------------------------------------------- */}
      {/* RIGHT MAIN AREA: FORMS & BOOKMARK GRID                */}
      {/* ----------------------------------------------------- */}
      <main className="flex-1 space-y-8 min-w-0">
        
        <datalist id="category-options">
          {Object.keys(folderHierarchy).map(cat => (
            <option key={cat} value={cat} />
          ))}
        </datalist>

        <datalist id="subcategory-options">
          {/* Universal Subcategory list for the Move feature to use */}
          {Object.values(folderHierarchy).flat().filter((value, index, array) => array.indexOf(value) === index).map(sub => (
            <option key={sub} value={sub} />
          ))}
        </datalist>

        <div className="bg-white border-2 border-gray-900 rounded-2xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex gap-4 mb-6">
            <button onClick={() => setInputMode('single')} className={`pb-2 text-sm font-bold transition-all ${inputMode === 'single' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-400 hover:text-gray-600'}`}>
              Single Link
            </button>
            <button onClick={() => setInputMode('bulk')} className={`pb-2 text-sm font-bold transition-all ${inputMode === 'bulk' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-400 hover:text-gray-600'}`}>
              Bulk Extract
            </button>
          </div>

          {inputMode === 'single' ? (
            <form onSubmit={addSingleBookmark} className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="flex-1 px-4 py-3 border-2 border-gray-900 rounded-xl outline-none bg-slate-50 focus:bg-white transition-all" />
                <input type="url" placeholder="URL" value={url} onChange={(e) => setUrl(e.target.value)} className="flex-1 px-4 py-3 border-2 border-gray-900 rounded-xl outline-none bg-slate-50 focus:bg-white transition-all" />
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <input type="text" list="category-options" placeholder="Main Folder" value={category} onChange={(e) => setCategory(e.target.value)} className="flex-1 px-4 py-3 border-2 border-gray-900 rounded-xl outline-none bg-slate-50 focus:bg-white transition-all" />
                {category.trim().length > 0 && (
                  <input type="text" list="subcategory-options" placeholder="Subfolder (Optional)" value={subCategory} onChange={(e) => setSubCategory(e.target.value)} className="flex-1 px-4 py-3 border-2 border-dashed border-gray-400 focus:border-solid focus:border-gray-900 rounded-xl outline-none bg-slate-50 focus:bg-white transition-all" />
                )}
                <button type="submit" className="px-8 py-3 bg-[#E06D53] text-white font-bold border-2 border-gray-900 rounded-xl hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">Save</button>
              </div>
            </form>
          ) : (
            <form onSubmit={addBulkBookmarks} className="flex flex-col gap-4">
              <textarea placeholder="Paste text containing URLs here..." value={bulkText} onChange={(e) => setBulkText(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-900 rounded-xl h-32 resize-y outline-none bg-slate-50 focus:bg-white transition-all" />
              <div className="flex flex-col sm:flex-row gap-4">
                <input type="text" list="category-options" placeholder="Folder for these tabs" value={bulkCategory} onChange={(e) => setBulkCategory(e.target.value)} className="flex-1 px-4 py-3 border-2 border-gray-900 rounded-xl outline-none bg-slate-50 focus:bg-white transition-all" />
                <button type="submit" className="px-6 py-3 bg-indigo-500 text-white font-bold border-2 border-gray-900 rounded-xl hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">Extract & Save</button>
              </div>
            </form>
          )}
        </div>

        {/* The Bookmark Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {bookmarks.map((bookmark) => {
            // UPDATED: Strict Filtering Logic
            const matchCategory = activeFilter === 'All' || (bookmark.category || 'Uncategorized') === activeFilter;
            
            // If we are looking at 'All Bookmarks', show everything.
            // If we are looking at a Subfolder, match the exact subfolder.
            // If we are looking at a Main folder ONLY (activeSubFilter is null), only show bookmarks that have NO subfolder.
            const matchSubCategory = activeFilter === 'All' 
              ? true 
              : (activeSubFilter 
                  ? bookmark.sub_category === activeSubFilter 
                  : !bookmark.sub_category);

            const isVisible = matchCategory && matchSubCategory;

            if (!isVisible) return null;

            const theme = colorThemes[bookmark.id % colorThemes.length]

            return (
              <div
                key={bookmark.id}
                draggable
                onDragStart={(e) => handleDragStart(e, bookmark.id)}
                onDragEnd={handleDragEnd}
                className={`relative group flex flex-col bg-white border-2 border-gray-900 rounded-2xl overflow-hidden shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all cursor-grab active:cursor-grabbing ${draggedId === bookmark.id ? 'opacity-50 scale-95' : ''}`}
              >
                <button 
                  onClick={() => togglePreviewMode(bookmark.id)} 
                  className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[9px] font-bold px-2 py-1 rounded-md shadow-sm border border-gray-700"
                  title={iframeModes[bookmark.id] ? "Switch back to screenshot" : "Try Live Preview (May be blocked by some sites' security settings)"}
                >
                  {iframeModes[bookmark.id] ? 'IMAGE' : 'LIVE'}
                </button>

                <div className={`w-full aspect-video border-b-2 border-gray-900 overflow-hidden relative ${theme.card}`}>
                  {iframeModes[bookmark.id] ? (
                    <iframe src={bookmark.url} className="w-full h-full border-none pointer-events-none" sandbox="allow-scripts allow-same-origin" loading="lazy" />
                  ) : (
                    <img src={`https://image.thum.io/get/width/600/crop/1200/noanimate/${bookmark.url}`} alt={bookmark.title} className="w-full h-[300%] object-cover object-top group-hover:object-bottom duration-[4000ms] ease-linear" onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${getDomain(bookmark.url)}&background=random&size=600&font-size=0.1` }} />
                  )}
                </div>

                <div className="p-3 flex flex-col min-h-[95px] relative">
                  
                  {/* Action Buttons */}
                  <div className="absolute right-3 top-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button onClick={() => { setMovingId(bookmark.id); setMoveCategory(bookmark.category || ''); setMoveSubCategory(bookmark.sub_category || ''); setEditingId(null); }} className="p-1.5 bg-yellow-100 text-yellow-700 border border-gray-900 rounded-md hover:bg-yellow-200 transition-colors" title="Move to Folder">
                      <MoveIcon />
                    </button>
                    <button onClick={() => { setEditingId(bookmark.id); setEditTitle(bookmark.title); setEditUrl(bookmark.url); setEditCategory(bookmark.category || ''); setEditSubCategory(bookmark.sub_category || ''); setMovingId(null); }} className="p-1.5 bg-cyan-100 text-cyan-700 border border-gray-900 rounded-md hover:bg-cyan-200 transition-colors" title="Edit">
                      <EditIcon />
                    </button>
                    <button onClick={() => deleteBookmark(bookmark.id)} className="p-1.5 bg-pink-100 text-pink-700 border border-gray-900 rounded-md hover:bg-pink-200 transition-colors" title="Delete">
                      <TrashIcon />
                    </button>
                  </div>

                  {/* EDIT UI */}
                  {editingId === bookmark.id ? (
                    <div className="space-y-2 w-full mt-1">
                      <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full px-2 py-1 text-sm border-2 border-gray-900 rounded bg-white outline-none" placeholder="Title" />
                      <input type="url" value={editUrl} onChange={(e) => setEditUrl(e.target.value)} className="w-full px-2 py-1 text-[10px] border-2 border-gray-900 rounded bg-white outline-none" placeholder="URL" />
                      <div className="flex gap-2">
                        <input type="text" list="category-options" value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="w-full px-2 py-1 text-[10px] border-2 border-gray-900 rounded bg-white outline-none" placeholder="Folder" />
                        <input type="text" list="subcategory-options" value={editSubCategory} onChange={(e) => setEditSubCategory(e.target.value)} className="w-full px-2 py-1 text-[10px] border-2 border-dashed border-gray-500 rounded bg-white outline-none" placeholder="Sub (Opt)" />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => saveEdit(bookmark.id)} className="flex-1 py-1 bg-[#E06D53] text-white text-xs font-bold border-2 border-gray-900 rounded">Save</button>
                        <button onClick={() => setEditingId(null)} className="flex-1 py-1 bg-gray-200 text-gray-700 text-xs font-bold border-2 border-gray-900 rounded">Cancel</button>
                      </div>
                    </div>

                  /* MOVE UI */
                  ) : movingId === bookmark.id ? (
                    <div className="space-y-2 w-full mt-1">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Move to Folder</p>
                      <input type="text" list="category-options" value={moveCategory} onChange={(e) => setMoveCategory(e.target.value)} className="w-full px-2 py-1.5 text-xs border-2 border-gray-900 rounded bg-white outline-none" placeholder="Main Folder" />
                      <input type="text" list="subcategory-options" value={moveSubCategory} onChange={(e) => setMoveSubCategory(e.target.value)} className="w-full px-2 py-1.5 text-xs border-2 border-dashed border-gray-500 rounded bg-white outline-none" placeholder="Subfolder (Optional)" />
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => saveMove(bookmark.id)} className="flex-1 py-1 bg-yellow-400 text-gray-900 text-xs font-bold border-2 border-gray-900 rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-px hover:shadow-none transition-all">Confirm Move</button>
                        <button onClick={() => setMovingId(null)} className="flex-1 py-1 bg-gray-200 text-gray-700 text-xs font-bold border-2 border-gray-900 rounded">Cancel</button>
                      </div>
                    </div>

                  /* STANDARD VIEW */
                  ) : (
                    <>
                      <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="block max-w-[75%]">
                        <h3 className="font-medium text-sm text-gray-900 truncate leading-tight">{bookmark.title}</h3>
                      </a>
                      <div className="mt-1 flex items-center gap-1.5 overflow-hidden">
                        <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 min-w-0">
                          <img src={`https://www.google.com/s2/favicons?domain=${getDomain(bookmark.url)}`} alt="favicon" className="w-3 h-3 opacity-60 shrink-0" />
                          <p className="text-[10px] font-medium text-gray-500 truncate">{getDomain(bookmark.url)}</p>
                        </a>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                         <span className="text-[9px] font-bold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-300 uppercase tracking-wider truncate max-w-full">
                           {bookmark.category || 'Uncategorized'}
                         </span>
                         {bookmark.sub_category && (
                           <span className="text-[9px] font-bold text-gray-600 bg-gray-50 px-1.5 py-0.5 rounded border border-dashed border-gray-300 uppercase tracking-wider truncate max-w-full flex items-center gap-1">
                             <ChevronRight /> {bookmark.sub_category}
                           </span>
                         )}
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