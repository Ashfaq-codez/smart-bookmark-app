'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useBookmarks } from '@/hooks/useBookmarks'
import { Bookmark } from '@/types'
import Sidebar from '@/components/Sidebar'
import BookmarkCard from '@/components/BookmarkCard'
import BookmarkSkeleton from '@/components/BookmarkSkeleton'
import { toast } from 'react-hot-toast'
import ProfileDropdown from './ProfileDropdown'

const SendIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
const MenuIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
const ExpandRightIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 18l6-6-6-6"/></svg>

function normalizeUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim()
  if (!trimmed) return ''
  try {
    const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
    const parsed = new URL(withProto)
    return `${parsed.protocol}//${parsed.hostname.toLowerCase().replace(/^www\./, '')}${parsed.pathname.replace(/\/+$/, '') || '/'}${parsed.search}`
  } catch { return trimmed.toLowerCase().replace(/\/+$/, '') }
}

export default function BookmarkList({ initialBookmarks, userEmail }: { initialBookmarks: Bookmark[], userEmail?: string }) {
  const { bookmarks, updateBookmark, deleteBookmark } = useBookmarks(initialBookmarks)
  const [isLoading, setIsLoading] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const supabase = createClient()
  const [activeFilter, setActiveFilter] = useState('All')
  const [activeSubFilter, setActiveSubFilter] = useState<string | null>(null)
  const [draggedId, setDraggedId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [inputValue, setInputValue] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [columnsCount, setColumnsCount] = useState(2) 
  const gridRef = useRef<HTMLDivElement>(null)
  const [duplicateMatch, setDuplicateMatch] = useState<Bookmark | null>(null)
  const [forcedInspectId, setForcedInspectId] = useState<number | null>(null)

  const [customCategories, setCustomCategories] = useState<string[]>([])
  const [customSubCategories, setCustomSubCategories] = useState<Record<string, string[]>>({})
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({})
  const [creatingSubFor, setCreatingSubFor] = useState<string | null>(null)
  const [newSubfolderName, setNewSubfolderName] = useState('')

  useEffect(() => {
    const updateColumns = () => {
      if (!gridRef.current) return
      const width = gridRef.current.offsetWidth
      if (width >= 1600) setColumnsCount(4)
      else if (width >= 1024) setColumnsCount(3)
      else setColumnsCount(2)
    }
    const observer = new ResizeObserver(updateColumns)
    if (gridRef.current) observer.observe(gridRef.current)
    updateColumns()
    const timer = setTimeout(() => setIsLoading(false), 300)
    if (window.innerWidth < 768) setIsSidebarOpen(false)
    return () => { observer.disconnect(); clearTimeout(timer) }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape' && duplicateMatch) setDuplicateMatch(null) }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [duplicateMatch])

  const handleSignOut = async () => { await supabase.auth.signOut(); window.location.href = '/' }

  const handleQuickCapture = async () => {
    const rawInput = inputValue.trim()
    if (!rawInput) return
    const urlRegex = /^(https?:\/\/)?([\w.-]+)\.([a-z]{2,})(:\d{1,5})?(\/.*)?$/i
    const tokens = rawInput.split(/[\s,]+/).filter(Boolean)
    const isAllUrls = tokens.length > 0 && tokens.every(t => urlRegex.test(t))

    if (isAllUrls && tokens.length === 1) {
      const existing = bookmarks.find(b => (b.type === 'link' || !b.type) && normalizeUrl(b.url) === normalizeUrl(tokens[0]))
      if (existing) { setDuplicateMatch(existing); return }
    }

    setIsSaving(true)
    const existingUrls = new Set(bookmarks.map(b => normalizeUrl(b.url)))

    try {
      if (isAllUrls && tokens.length > 1) {
        const validNewTokens = tokens.filter(token => !existingUrls.has(normalizeUrl(token)))
        if (validNewTokens.length === 0) { toast.error('DATA EXISTS'); setIsSaving(false); return }
        await Promise.all(validNewTokens.map(token => fetch('/api/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: /^https?:\/\//i.test(token) ? token : 'https://' + token }) })))
        toast.success(`SAVED ${validNewTokens.length}`)
      } else {
        const isSingleUrl = tokens.length === 1 && urlRegex.test(rawInput)
        let finalUrl = rawInput
        if (isSingleUrl) finalUrl = /^https?:\/\//i.test(finalUrl) ? finalUrl : 'https://' + finalUrl
        const payload = isSingleUrl ? { url: finalUrl } : { url: window.location.origin + '/note-' + Date.now(), content: rawInput, type: 'note' }
        const res = await fetch('/api/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        if (res.status === 409) {
          const match = bookmarks.find(b => normalizeUrl(b.url) === normalizeUrl(finalUrl))
          if (match) { setDuplicateMatch(match); setIsSaving(false); return }
          toast.error('RECORD EXISTS'); setIsSaving(false); return
        }
        if (!res.ok) throw new Error('Failed')
      }
      setInputValue('')
    } catch { toast.error('ERROR') } finally { setIsSaving(false) }
  }

  const filteredBookmarks = useMemo(() => {
    return bookmarks.filter((b) => {
      const matchCat = activeFilter === 'All' || (b.category || 'Uncategorized') === activeFilter
      const matchSub = activeFilter === 'All' || !activeSubFilter ? true : b.sub_category === activeSubFilter
      const s = searchQuery.toLowerCase()
      const matchSearch = s === '' || b.title.toLowerCase().includes(s) || b.url.toLowerCase().includes(s) || (b.content && b.content.toLowerCase().includes(s)) || (b.description && b.description.toLowerCase().includes(s))
      return matchCat && matchSub && matchSearch
    })
  }, [bookmarks, activeFilter, activeSubFilter, searchQuery])

  const masonryColumns = useMemo(() => {
    const cols: Bookmark[][] = Array.from({ length: columnsCount }, () => [])
    filteredBookmarks.forEach((b, i) => cols[i % columnsCount].push(b))
    return cols
  }, [filteredBookmarks, columnsCount])

  const folderHierarchy = useMemo(() => {
    const tree: Record<string, string[]> = {}
    const baseCats = Array.from(new Set([...customCategories, ...bookmarks.map(b => b.category || 'Uncategorized')]))
    baseCats.forEach(c => { if (c !== 'All') tree[c] = [] })
    bookmarks.forEach(b => {
      const p = b.category || 'Uncategorized'
      if (b.sub_category) { if (!tree[p]) tree[p] = []; if (!tree[p].includes(b.sub_category)) tree[p].push(b.sub_category) }
    })
    Object.entries(customSubCategories).forEach(([p, subs]) => {
      if (!tree[p]) tree[p] = []
      subs.forEach(s => { if (!tree[p].includes(s)) tree[p].push(s) })
    })
    return tree
  }, [bookmarks, customCategories, customSubCategories])

  const getCounts = useMemo(() => {
    const counts: Record<string, number> = { 'All': bookmarks.length }
    bookmarks.forEach(b => {
      const c = b.category || 'Uncategorized'
      counts[c] = (counts[c] || 0) + 1
      if (b.sub_category) counts[`${c}::${b.sub_category}`] = (counts[`${c}::${b.sub_category}`] || 0) + 1
    })
    return counts
  }, [bookmarks])

  const handleAddCategory = () => {
    const t = newCategoryName.trim()
    if (t && !Object.keys(folderHierarchy).includes(t)) { setCustomCategories(p => [...p, t]); setActiveFilter(t); setActiveSubFilter(null) }
    setNewCategoryName(''); setIsAddingCategory(false)
  }

  const handleAddSubfolder = (p: string) => {
    const t = newSubfolderName.trim()
    if (t) { setCustomSubCategories(prev => { const e = prev[p] || []; return e.includes(t) ? prev : { ...prev, [p]: [...e, t] } }); setActiveFilter(p); setActiveSubFilter(t) }
    setNewSubfolderName(''); setCreatingSubFor(null)
  }

  const handleDeleteCategory = async (catToDelete: string) => {
    toast((t) => (
      <div className="flex flex-col gap-4 font-sans p-6 bg-white dark:bg-[#111] border-4 border-black dark:border-white shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_#fff]">
        <span className="font-black text-2xl text-black dark:text-white uppercase tracking-tighter">DELETE {catToDelete}?</span>
        <div className="flex gap-2 mt-2">
          <button onClick={() => { setCustomCategories(p => p.filter(c => c !== catToDelete)); if (activeFilter === catToDelete) { setActiveFilter('All'); setActiveSubFilter(null) }; toast.dismiss(t.id) }} className="flex-1 px-4 py-3 bg-[#FF0000] text-white border-4 border-black font-black uppercase text-sm hover:translate-x-[2px] hover:translate-y-[2px] shadow-[4px_4px_0_0_#000] hover:shadow-none transition-all">PURGE</button>
          <button onClick={() => toast.dismiss(t.id)} className="flex-1 px-4 py-3 bg-white text-black border-4 border-black font-black uppercase text-sm hover:translate-x-[2px] hover:translate-y-[2px] shadow-[4px_4px_0_0_#000] hover:shadow-none transition-all">CANCEL</button>
        </div>
      </div>
    ), { duration: Infinity, style: { background: 'transparent', boxShadow: 'none', padding: 0 } })
  }

  const toggleFolderExpand = (folder: string) => setExpandedFolders(prev => ({ ...prev, [folder]: !prev[folder] }))
  const handleDragStart = (e: React.DragEvent, id: number) => { e.dataTransfer.setData('bookmarkId', id.toString()); setDraggedId(id) }
  const handleDragEnd = () => setDraggedId(null)
  const handleDragOver = (e: React.DragEvent) => e.preventDefault()
  const handleDrop = async (e: React.DragEvent, targetCategory: string, targetSubCategory?: string) => {
    e.preventDefault(); const id = parseInt(e.dataTransfer.getData('bookmarkId'))
    if (!id || isNaN(id)) return
    await updateBookmark(id, { category: targetCategory === 'All' ? 'Uncategorized' : targetCategory, sub_category: targetSubCategory || null })
  }

  return (
    <div className="bg-[#f0f0f0] dark:bg-[#050505] min-h-screen font-sans text-black dark:text-white flex flex-col overflow-x-hidden selection:bg-[#0000FF] selection:text-white relative z-0 transition-colors duration-500">
      
      {/* DESKTOP PROFILE */}
      <div className="hidden md:block fixed top-0 left-0 w-[320px] z-50">
        <ProfileDropdown email={userEmail ?? ""} />
      </div>

      {/* MOBILE HEADER */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-[60px] z-50 bg-[#FFD700] dark:bg-[#0000FF] border-b-4 border-black dark:border-white flex items-center px-4 justify-between transition-colors duration-500">
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-black dark:text-white">
          <MenuIcon />
        </button>
        <span className="font-black text-xl tracking-tighter uppercase text-black dark:text-white">
          INDEX
        </span>
        <div className="w-8" />
      </header>

      {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/60 z-40 md:hidden transition-opacity" />}

      {/* TOGGLE TAB (CLOSED) */}
      {!isSidebarOpen && (
        <button 
          onClick={() => setIsSidebarOpen(true)} 
          className="hidden md:flex fixed left-0 top-[20%] z-40 bg-[#FFD700] dark:bg-[#0000FF] border-4 border-black dark:border-white border-l-0 px-2 py-8 text-black dark:text-white shadow-[6px_6px_0_0_#000] dark:shadow-[6px_6px_0_0_#fff] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all cursor-pointer"
        >
          <ExpandRightIcon />
        </button>
      )}

      {/* COLORFUL BAUHAUS SIDEBAR */}
      <div className={`fixed left-0 top-[0px] md:top-[65px] bottom-0 z-40 bg-white dark:bg-[#0a0a0a] border-r-4 border-black dark:border-white transition-transform duration-300 ease-in-out flex flex-col ${isSidebarOpen ? 'translate-x-0 w-[85vw] sm:w-[320px]' : '-translate-x-full md:w-0 overflow-hidden border-none'}`}>
        <div className={`h-full flex-1 overflow-hidden transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 md:hidden'}`}>
          <Sidebar userEmail={userEmail || null} handleSignOut={handleSignOut} isMobileMenuOpen={isSidebarOpen} setIsMobileMenuOpen={setIsSidebarOpen} activeFilter={activeFilter} setActiveFilter={setActiveFilter} activeSubFilter={activeSubFilter} setActiveSubFilter={setActiveSubFilter} getCounts={getCounts} folderHierarchy={folderHierarchy} expandedFolders={expandedFolders} toggleFolderExpand={toggleFolderExpand} customCategories={customCategories} handleDeleteCategory={handleDeleteCategory} handleDragOver={handleDragOver} handleDrop={handleDrop} creatingSubFor={creatingSubFor} setCreatingSubFor={setCreatingSubFor} newSubfolderName={newSubfolderName} setNewSubfolderName={setNewSubfolderName} handleAddSubfolder={handleAddSubfolder} isAddingCategory={isAddingCategory} setIsAddingCategory={setIsAddingCategory} newCategoryName={newCategoryName} setNewCategoryName={setNewCategoryName} handleAddCategory={handleAddCategory} />
        </div>
      </div>

      {/* FIXED TOP CONTROL PANEL */}
      <div className={`fixed top-[60px] md:top-0 right-0 z-30 flex flex-col md:flex-row border-b-4 border-black dark:border-white shadow-[0_8px_0_0_rgba(0,0,0,1)] dark:shadow-[0_8px_0_0_rgba(255,255,255,1)] transition-all duration-300 ease-in-out ${isSidebarOpen ? 'md:w-[calc(100%-320px)] left-0 md:left-[320px]' : 'w-full left-0'}`}>
        
        <div className="md:w-[35%] border-b-4 md:border-b-0 md:border-r-4 border-black dark:border-white flex flex-col bg-[#0000FF] dark:bg-[#FF0000] transition-colors duration-500">
          <label className="text-[10px] font-black uppercase tracking-widest px-6 pt-4 text-white">Search Query</label>
          <input
            type="text"
            placeholder="FILTER INDEX..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none outline-none px-6 pb-4 pt-1 font-black text-xl md:text-2xl text-white placeholder-white/50 uppercase"
          />
        </div>

        <div className="flex-1 flex bg-[#FFD700] dark:bg-[#0000FF] transition-colors duration-500">
          <div className="flex-1 flex flex-col">
            <label className="text-[10px] font-black uppercase tracking-widest px-6 pt-4 text-black dark:text-white">Inject Data</label>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleQuickCapture() }}
              disabled={isSaving}
              placeholder="URL OR TEXT STRING..."
              className="w-full bg-transparent border-none outline-none px-6 pb-4 pt-1 font-black text-xl md:text-2xl text-black dark:text-white placeholder-black/50 dark:placeholder-white/50 uppercase"
            />
          </div>
          <button 
            onClick={handleQuickCapture} 
            disabled={isSaving || !inputValue.trim()} 
            className="px-8 md:px-12 bg-[#FF0000] dark:bg-[#FFD700] text-white dark:text-black border-l-4 border-black dark:border-white flex items-center justify-center hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors disabled:opacity-50 cursor-pointer"
          >
            <SendIcon />
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <main className={`flex-1 flex flex-col transition-all duration-300 pb-32 pt-[220px] md:pt-[120px] ${isSidebarOpen ? 'md:ml-[320px]' : 'md:ml-0'}`}>
        
        <div className="w-full p-4 sm:p-6 md:p-8 flex gap-4 sm:gap-6 md:gap-8 items-start" ref={gridRef}>
          {isLoading ? (
            Array.from({ length: columnsCount }).map((_, colIndex) => (
              <div key={colIndex} className="flex flex-col gap-4 sm:gap-6 md:gap-8 w-full flex-1 min-w-0">
                {Array.from({ length: 3 }).map((_, i) => <BookmarkSkeleton key={i} />)}
              </div>
            ))
          ) : (
            masonryColumns.map((colBookmarks, colIndex) => (
              <div key={colIndex} className="flex flex-col gap-4 sm:gap-6 md:gap-8 w-full flex-1 min-w-0">
                {colBookmarks.map(bookmark => (
                  <BookmarkCard 
                    key={bookmark.id} bookmark={bookmark} theme={{ card: '', btn: '', hover: '' }} isDragged={draggedId === bookmark.id} onDragStart={handleDragStart} onDragEnd={handleDragEnd} updateBookmark={updateBookmark} deleteBookmark={deleteBookmark} forceOpenModal={forcedInspectId === bookmark.id} onCloseForcedModal={() => setForcedInspectId(null)}
                  />
                ))}
              </div>
            ))
          )}
        </div>
      </main>

      {/* COLLISION MODAL */}
      {duplicateMatch && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-white/90 dark:bg-black/90 backdrop-blur-sm transition-colors duration-500" onClick={() => setDuplicateMatch(null)}>
          <div className="w-full max-w-lg bg-white dark:bg-[#0a0a0a] border-4 border-black dark:border-white shadow-[16px_16px_0_0_#000] dark:shadow-[16px_16px_0_0_#fff] flex flex-col rounded-none" onClick={(e) => e.stopPropagation()}>
            <div className="bg-[#FF0000] text-white border-b-4 border-black dark:border-white px-6 py-4 flex items-center">
              <span className="font-black text-sm uppercase tracking-widest">Error.Collision</span>
            </div>
            <div className="p-8 flex flex-col gap-6">
              <h3 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none text-black dark:text-white">
                RECORD EXISTS
              </h3>
              <div className="flex flex-col gap-2 border-l-4 border-black dark:border-white pl-4 py-2">
                <span className="text-xl font-black text-black dark:text-white truncate uppercase">{duplicateMatch.title}</span>
                <span className="text-sm font-bold text-gray-500 truncate">{duplicateMatch.url}</span>
              </div>
              <div className="flex gap-4 mt-6">
                <button onClick={() => { setForcedInspectId(duplicateMatch.id); setDuplicateMatch(null); setInputValue(''); }} className="flex-1 py-4 bg-[#0000FF] dark:bg-[#FFD700] text-white dark:text-black border-4 border-black dark:border-white font-black uppercase tracking-widest text-sm shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">INSPECT</button>
                <button onClick={() => setDuplicateMatch(null)} className="flex-1 py-4 bg-white dark:bg-black text-black dark:text-white border-4 border-black dark:border-white font-black uppercase tracking-widest text-sm shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">DISMISS</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}