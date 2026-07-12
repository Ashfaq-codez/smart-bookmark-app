'use client'

import { useState, useMemo } from 'react'
import { useBookmarks } from '@/hooks/useBookmarks'
import { Bookmark } from '@/types'

// --- Icons ---
const PlusIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
const TrashIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
const ExternalLinkIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
const EditIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
const MonitorIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
const ImageIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
const SmallXIcon = () => <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
const CheckIcon = () => <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
const LayersIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
  </svg>
)

// --- Color Themes ---
const colorThemes = [
  { card: 'bg-sky-50', btn: 'bg-sky-200', hover: 'hover:bg-sky-300', text: 'text-sky-800' },
  { card: 'bg-teal-50', btn: 'bg-teal-200', hover: 'hover:bg-teal-300', text: 'text-teal-800' },
  { card: 'bg-rose-50', btn: 'bg-rose-200', hover: 'hover:bg-rose-300', text: 'text-rose-800' },
  { card: 'bg-amber-50', btn: 'bg-amber-200', hover: 'hover:bg-amber-300', text: 'text-amber-800' },
  { card: 'bg-indigo-50', btn: 'bg-indigo-200', hover: 'hover:bg-indigo-300', text: 'text-indigo-800' },
  { card: 'bg-emerald-50', btn: 'bg-emerald-200', hover: 'hover:bg-emerald-300', text: 'text-emerald-800' },
]

export default function BookmarkList({ initialBookmarks }: { initialBookmarks: Bookmark[] }) {
  // 1. Hook Integration: All Supabase logic is now handled here
  const {
    bookmarks,
    addBookmark,
    addBulkBookmarks,
    updateBookmark,
    deleteBookmark
  } = useBookmarks(initialBookmarks)

  // 2. UI State
  const [inputMode, setInputMode] = useState<'single' | 'bulk'>('single')
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('')
  const [bulkText, setBulkText] = useState('');
  const [bulkCategory, setBulkCategory] = useState('Open Tabs')

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editCategory, setEditCategory] = useState('')

  const [iframeModes, setIframeModes] = useState<Record<number, boolean>>({})
  const [activeFilter, setActiveFilter] = useState('All')

  const [draggedId, setDraggedId] = useState<number | null>(null)
  const [customCategories, setCustomCategories] = useState<string[]>([])
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')

  // 3. Derived State (useMemo)
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

  // 4. Helper Functions
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

  const handleDeleteCategory = (catToDelete: string) => {
    if(window.confirm(`Delete the tab "${catToDelete}"? All links inside will be safely moved to "Uncategorized".`)) {
      setCustomCategories(prev => prev.filter(c => c !== catToDelete));
      bookmarks.forEach(b => {
        if (b.category === catToDelete) {
           updateBookmark(b.id, { category: 'Uncategorized' });
        }
      });
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

    const bookmarkToMove = bookmarks.find(b => b.id === bookmarkId)
    if (bookmarkToMove && bookmarkToMove.category !== targetCategory) {
      await updateBookmark(bookmarkId, { category: targetCategory })
    }
  }

  // --- CRUD WRAPPERS ---
  const handleAddSingle = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !url) return
    await addBookmark({ title, url: formatUrl(url), category: category.trim() || 'Uncategorized' })
    setTitle(''); setUrl(''); setCategory('')
  }

  const handleAddBulk = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bulkText.trim()) return
    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/g;
    const foundUrls = bulkText.match(urlRegex);

    if (!foundUrls || foundUrls.length === 0) {
      alert("No valid URLs found in the text.");
      return;
    }

    const newRows = foundUrls.map((foundUrl) => ({
      title: `${getDomain(formatUrl(foundUrl))} Tab`,
      url: formatUrl(foundUrl),
      category: bulkCategory.trim() || 'Open Tabs'
    }));

    await addBulkBookmarks(newRows)
    setBulkText(''); setBulkCategory('Open Tabs');
  }

  const handleSaveEdit = async (id: number) => {
    if (!editTitle || !editUrl) return
    await updateBookmark(id, { 
      title: editTitle, 
      url: formatUrl(editUrl), 
      category: editCategory.trim() || 'Uncategorized' 
    })
    setEditingId(null)
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10">

      {/* 1. INPUT FORM */}
      <div className="bg-white border-2 border-gray-900 shadow-[4px_4px_0px_0px_rgba(17,24,39,1)] rounded-xl p-6">
        <div className="flex gap-4 mb-6 border-b-2 border-gray-100 pb-4">
          <button onClick={() => setInputMode('single')} className={`px-4 py-2 font-bold rounded-lg border-2 ${inputMode === 'single' ? 'bg-yellow-300 border-gray-900 shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]' : 'bg-transparent border-transparent text-gray-500 hover:bg-gray-50'}`}>Single Link</button>
          <button onClick={() => setInputMode('bulk')} className={`px-4 py-2 font-bold rounded-lg border-2 ${inputMode === 'bulk' ? 'bg-yellow-300 border-gray-900 shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]' : 'bg-transparent border-transparent text-gray-500 hover:bg-gray-50'}`}>Bulk Import</button>
        </div>

        {inputMode === 'single' ? (
          <form onSubmit={handleAddSingle} className="flex flex-col md:flex-row gap-4">
            <input type="text" placeholder="Title (e.g. Portfolio)" value={title} onChange={(e) => setTitle(e.target.value)} className="flex-1 px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-gray-900 focus:bg-white transition-colors font-medium placeholder-gray-400" required />
            <input type="url" placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} className="flex-1 px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-gray-900 focus:bg-white transition-colors font-medium placeholder-gray-400" required />
            <input type="text" list="category-list" placeholder="Category (Optional)" value={category} onChange={(e) => setCategory(e.target.value)} className="flex-1 px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-gray-900 focus:bg-white transition-colors font-medium placeholder-gray-400" />
            <datalist id="category-list">
              {uniqueCategories.filter(c => c !== 'All').map(cat => <option key={cat} value={cat} />)}
            </datalist>
            <button type="submit" className="px-8 py-3 bg-gray-900 text-white font-bold rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 border-2 border-gray-900"><PlusIcon /> Save</button>
          </form>
        ) : (
          <form onSubmit={handleAddBulk} className="flex flex-col gap-4">
            <textarea placeholder="Paste text containing multiple URLs here..." value={bulkText} onChange={(e) => setBulkText(e.target.value)} className="w-full h-32 px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-gray-900 focus:bg-white transition-colors font-medium placeholder-gray-400 resize-none" required />
            <div className="flex gap-4">
               <input type="text" list="category-list" placeholder="Folder Name (e.g. Open Tabs)" value={bulkCategory} onChange={(e) => setBulkCategory(e.target.value)} className="flex-1 px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-gray-900 focus:bg-white transition-colors font-medium placeholder-gray-400" />
               <button type="submit" className="px-8 py-3 bg-gray-900 text-white font-bold rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 border-2 border-gray-900"><PlusIcon /> Extract & Save All</button>
            </div>
          </form>
        )}
      </div>

      {/* 2. CATEGORY FILTERS (TAB MANAGER) */}
      <div className="flex flex-wrap gap-3 items-center">
        {uniqueCategories.map(cat => (
          <div key={cat} className="group flex items-center"
               onDragOver={handleDragOver}
               onDrop={(e) => handleDrop(e, cat)}>
            <button onClick={() => setActiveFilter(cat)} className={`px-5 py-2 rounded-full border-2 font-bold transition-all flex items-center gap-2 ${activeFilter === cat ? 'bg-gray-900 text-white border-gray-900 shadow-[3px_3px_0px_0px_rgba(209,213,219,1)]' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-900 hover:text-gray-900'}`}>
              {cat} <span className={`text-[10px] px-2 py-0.5 rounded-full ${activeFilter === cat ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>{categoryCounts[cat] || 0}</span>
            </button>
            {cat !== 'All' && customCategories.includes(cat) && (
               <button onClick={() => handleDeleteCategory(cat)} className="ml-1 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><SmallXIcon /></button>
            )}
          </div>
        ))}

        {isAddingCategory ? (
          <div className="flex items-center gap-2 bg-white rounded-full border-2 border-gray-900 p-1 shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]">
            <input type="text" autoFocus value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()} placeholder="Tab name..." className="w-24 px-3 py-1 bg-transparent text-sm font-bold focus:outline-none" />
            <button onClick={handleAddCategory} className="p-1 bg-green-200 rounded-full border border-gray-900 hover:bg-green-300"><CheckIcon /></button>
            <button onClick={() => setIsAddingCategory(false)} className="p-1 bg-red-200 rounded-full border border-gray-900 hover:bg-red-300"><SmallXIcon /></button>
          </div>
        ) : (
          <button onClick={() => setIsAddingCategory(true)} className="px-4 py-2 rounded-full border-2 border-dashed border-gray-400 text-gray-500 font-bold hover:border-gray-900 hover:text-gray-900 transition-colors flex items-center gap-1"><PlusIcon /> Add Tab</button>
        )}
      </div>

      {/* 3. BOOKMARK GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {bookmarks.map((bookmark) => {
          const isVisible = activeFilter === 'All' || (bookmark.category || 'Uncategorized') === activeFilter;
          const theme = colorThemes[bookmark.id % colorThemes.length];
          const isLive = iframeModes[bookmark.id];

          return (
            <div
              key={bookmark.id}
              draggable
              onDragStart={(e) => handleDragStart(e, bookmark.id)}
              onDragEnd={handleDragEnd}
              className={`${isVisible ? 'flex' : 'hidden'} flex-col bg-white border-2 border-gray-900 shadow-[4px_4px_0px_0px_rgba(17,24,39,1)] rounded-xl overflow-hidden group cursor-grab active:cursor-grabbing transition-transform hover:-translate-y-1 ${draggedId === bookmark.id ? 'opacity-50' : 'opacity-100'}`}
            >

              {/* THUMBNAIL AREA */}
              <div className={`w-full aspect-video border-b-2 border-gray-900 relative bg-gray-100 overflow-hidden ${isLive ? '' : 'group-hover/thumb'}`}>

                {/* PREVIEW TOGGLE */}
                <button onClick={() => togglePreviewMode(bookmark.id)} className="absolute top-2 left-2 z-20 px-2 py-1 bg-gray-900 text-white text-[10px] font-bold rounded flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity border border-white/20 shadow-lg hover:bg-gray-800" title="Toggle Live/Image Preview">
                  {isLive ? <ImageIcon /> : <MonitorIcon />} {isLive ? 'IMAGE' : 'LIVE'}
                </button>

                {isLive ? (
                   <iframe src={bookmark.url} className="w-full h-full border-0 pointer-events-none" sandbox="allow-same-origin allow-scripts" />
                ) : (
                  <img src={`https://image.thum.io/get/width/600/crop/1200/noanimate/${bookmark.url}`} alt={bookmark.title} className="w-full h-[300%] object-cover object-top transition-all duration-[4000ms] ease-linear group-hover:-translate-y-[66%] relative z-10" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                )}

                {/* FALLBACK (Shows if thum.io fails) */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 z-0">
                  <LayersIcon />
                  <span className="text-xs font-bold mt-2 uppercase tracking-wider">{getDomain(bookmark.url)}</span>
                </div>
              </div>

              {/* TEXT & ACTION AREA */}
              <div className={`flex-1 p-4 flex flex-col ${theme.card}`}>
                {editingId === bookmark.id ? (
                  <div className="space-y-3 flex-1">
                    <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full px-2 py-1 border-2 border-gray-900 rounded text-sm font-bold" />
                    <input type="url" value={editUrl} onChange={(e) => setEditUrl(e.target.value)} className="w-full px-2 py-1 border-2 border-gray-900 rounded text-sm" />
                    <input type="text" value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="w-full px-2 py-1 border-2 border-gray-900 rounded text-sm" />
                    <div className="flex gap-2 pt-2">
                      <button onClick={() => handleSaveEdit(bookmark.id)} className="flex-1 py-1 bg-green-400 border-2 border-gray-900 rounded font-bold text-xs">Save</button>
                      <button onClick={() => setEditingId(null)} className="flex-1 py-1 bg-gray-200 border-2 border-gray-900 rounded font-bold text-xs">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-gray-900 leading-tight flex-1">
                        {bookmark.title}
                      </a>

                      {/* ACTION BUTTONS */}
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button onClick={() => { setEditingId(bookmark.id); setEditTitle(bookmark.title); setEditUrl(bookmark.url); setEditCategory(bookmark.category || 'Uncategorized'); }} className={`p-1.5 border-2 border-gray-900 rounded-md text-gray-900 ${theme.btn} ${theme.hover} transition-colors`}><EditIcon /></button>
                        <button onClick={() => deleteBookmark(bookmark.id)} className="p-1.5 border-2 border-gray-900 rounded-md bg-red-200 text-red-700 hover:bg-red-300 transition-colors"><TrashIcon /></button>
                      </div>
                    </div>
                    <div className="mt-auto flex items-center gap-1.5 text-[10px] text-gray-600 font-medium">
                      <img src={`https://www.google.com/s2/favicons?domain=${getDomain(bookmark.url)}`} alt="" className="w-3 h-3 opacity-60" />
                      <span className="truncate max-w-[120px]">{getDomain(bookmark.url)}</span>
                      <span className="text-gray-300">•</span>
                      <span className={`px-1.5 py-0.5 rounded border border-gray-900/10 ${theme.text} bg-white/50 truncate`}>{bookmark.category || 'Uncategorized'}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {bookmarks.length === 0 && (
        <div className="text-center py-20 bg-white border-2 border-dashed border-gray-300 rounded-2xl">
          <LayersIcon />
          <h3 className="mt-4 text-lg font-bold text-gray-900">Your archive is empty</h3>
          <p className="text-gray-500 mt-1">Add your first bookmark above or paste a list of links.</p>
        </div>
      )}
    </div>
  )
}