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

const PaperclipIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
const SendIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter"><line x1="22" y1="2" x2="15" y2="22" /><line x1="11" y1="13" x2="2" y2="9" /><line x1="22" y1="2" x2="11" y2="13" /></svg>
const MenuIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
const ExpandRightIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M9 18l6-6-6-6"/></svg>
const ChevronUpIcon = ({ className = '' }: { className?: string }) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className={className}><path d="M18 15l-6-6-6 6"/></svg>

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const supabase = createClient()
  const [activeFilter, setActiveFilter] = useState('All')
  const [activeSubFilter, setActiveSubFilter] = useState<string | null>(null)
  const [draggedId, setDraggedId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [inputValue, setInputValue] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false) // Replaces auto-hide scroll behavior
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
      else if (width >= 1100) setColumnsCount(3)
      else if (width >= 640) setColumnsCount(2)
      else setColumnsCount(1)
    }
    const observer = new ResizeObserver(updateColumns)
    if (gridRef.current) observer.observe(gridRef.current)
    updateColumns()
    const timer = setTimeout(() => setIsLoading(false), 300)
    return () => { observer.disconnect(); clearTimeout(timer) }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { 
      if (e.key === 'Escape' && duplicateMatch) setDuplicateMatch(null)
      if (e.key === 'Escape' && isDrawerOpen) setIsDrawerOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [duplicateMatch, isDrawerOpen])

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
        if (validNewTokens.length === 0) { toast.error('DATA ALREADY IN SYSTEM'); setIsSaving(false); return }
        await Promise.all(validNewTokens.map(token => fetch('/api/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: /^https?:\/\//i.test(token) ? token : 'https://' + token }) })))
        toast.success(`SAVED ${validNewTokens.length} ITEMS`)
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
      setIsDrawerOpen(false)
    } catch { toast.error('SYSTEM ERROR') } finally { setIsSaving(false) }
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
      <div className="flex flex-col gap-4 font-sans text-sm p-2">
        <span className="font-black text-xl text-black dark:text-white uppercase tracking-tighter">DELETE {catToDelete}?</span>
        <div className="flex gap-3 mt-2">
          <button onClick={() => { setCustomCategories(p => p.filter(c => c !== catToDelete)); if (activeFilter === catToDelete) { setActiveFilter('All'); setActiveSubFilter(null) }; toast.dismiss(t.id) }} className="flex-1 px-4 py-3 bg-red-500 text-black border-4 border-black font-black uppercase shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">PURGE</button>
          <button onClick={() => toast.dismiss(t.id)} className="flex-1 px-4 py-3 bg-white text-black border-4 border-black font-black uppercase shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">ABORT</button>
        </div>
      </div>
    ), { duration: Infinity, style: { background: '#fff', border: '4px solid #000', borderRadius: '0', padding: '16px' } })
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
    <div className="bg-[#e2e8f0] dark:bg-[#0f172a] min-h-screen font-sans text-black dark:text-white flex flex-col overflow-x-hidden selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black relative z-0">
      
      {/* ─── DOT GRID BACKGROUND ─── */}
      <div className="fixed inset-0 pointer-events-none z-[-1] bg-[radial-gradient(#cbd5e1_2px,transparent_2px)] dark:bg-[radial-gradient(#334155_2px,transparent_2px)] bg-[size:32px_32px] transition-colors" />

      {/* ─── DESKTOP PROFILE ─── */}
      <div className="hidden md:block fixed top-6 right-6 z-40 w-[260px]">
        <ProfileDropdown email={userEmail ?? ""} />
      </div>

      {/* MOBILE HEADER */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-[70px] z-30 bg-white dark:bg-black border-b-4 border-black dark:border-white flex items-center px-4 justify-between shadow-[0_4px_0_0_#000] dark:shadow-[0_4px_0_0_#fff]">
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-black dark:text-white bg-yellow-400 dark:bg-cyan-400 border-4 border-black dark:border-white shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff]">
          <MenuIcon />
        </button>
        <span className="font-black text-xl tracking-widest text-black dark:text-white uppercase">
          SYS.DB
        </span>
        <div className="w-8" />
      </header>

      {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden transition-opacity" />}

      {/* ─── SIDEBAR TOGGLE TAB (CLOSED) ─── */}
      {!isSidebarOpen && (
        <button 
          onClick={() => setIsSidebarOpen(true)} 
          className="hidden md:flex fixed left-0 top-32 z-40 bg-white dark:bg-black border-4 border-black dark:border-white border-l-0 rounded-none px-4 py-6 shadow-[6px_6px_0_0_#000] dark:shadow-[6px_6px_0_0_#fff] text-black dark:text-white hover:bg-yellow-400 dark:hover:bg-cyan-400 hover:text-black hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all cursor-pointer group"
        >
          <ExpandRightIcon />
        </button>
      )}

      {/* BRUTALIST SIDEBAR */}
      <div className={`fixed left-0 top-0 bottom-0 z-40 bg-white dark:bg-black border-r-4 border-black dark:border-white shadow-[12px_0_0_0_#000] dark:shadow-[12px_0_0_0_#fff] transition-transform duration-300 ease-out flex flex-col md:pt-6 ${isSidebarOpen ? 'translate-x-0 w-[90vw] sm:w-[320px]' : '-translate-x-full md:w-0 overflow-hidden border-none shadow-none'}`}>
        <div className={`h-full flex-1 overflow-hidden transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 md:hidden'}`}>
          <Sidebar userEmail={userEmail || null} handleSignOut={handleSignOut} isMobileMenuOpen={isSidebarOpen} setIsMobileMenuOpen={setIsSidebarOpen} activeFilter={activeFilter} setActiveFilter={setActiveFilter} activeSubFilter={activeSubFilter} setActiveSubFilter={setActiveSubFilter} getCounts={getCounts} folderHierarchy={folderHierarchy} expandedFolders={expandedFolders} toggleFolderExpand={toggleFolderExpand} customCategories={customCategories} handleDeleteCategory={handleDeleteCategory} handleDragOver={handleDragOver} handleDrop={handleDrop} creatingSubFor={creatingSubFor} setCreatingSubFor={setCreatingSubFor} newSubfolderName={newSubfolderName} setNewSubfolderName={setNewSubfolderName} handleAddSubfolder={handleAddSubfolder} isAddingCategory={isAddingCategory} setIsAddingCategory={setIsAddingCategory} newCategoryName={newCategoryName} setNewCategoryName={setNewCategoryName} handleAddCategory={handleAddCategory} />
        </div>
      </div>

      {/* MAIN CONTENT */}
      {/* Dynamic left margin based on sidebar state */}
      <main className={`flex-1 flex flex-col px-4 sm:px-8 md:px-12 transition-all duration-300 pb-48 pt-[90px] md:pt-24 ${isSidebarOpen ? 'md:ml-[320px]' : 'md:ml-0'}`}>
        
        {/* MASSIVE SEARCH BAR */}
        <div className="w-full max-w-[1600px] mx-auto mb-10 md:mb-16 mt-2 bg-white dark:bg-black border-4 border-black dark:border-white shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_#fff] rounded-none overflow-hidden flex flex-col">
          <div className="bg-yellow-400 dark:bg-cyan-400 border-b-4 border-black dark:border-white px-5 py-3 flex items-center">
            <span className="font-black text-[12px] text-black tracking-widest uppercase">SYS.QUERY.EXECUTE</span>
          </div>
          <input
            type="text"
            placeholder="SEARCH DATABASE..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none outline-none px-6 py-6 font-black text-2xl md:text-4xl text-black dark:text-white placeholder-gray-400 uppercase tracking-tighter focus:bg-gray-100 dark:focus:bg-[#1a1a1a] transition-colors"
          />
        </div>

        {/* BRUTALIST MASONRY GRID */}
        <div className="w-full max-w-[1600px] mx-auto flex gap-6 sm:gap-8 md:gap-10 items-start" ref={gridRef}>
          {isLoading ? (
            Array.from({ length: columnsCount }).map((_, colIndex) => (
              <div key={colIndex} className="flex flex-col gap-6 sm:gap-8 md:gap-10 w-full flex-1 min-w-0">
                {Array.from({ length: 3 }).map((_, i) => <BookmarkSkeleton key={i} />)}
              </div>
            ))
          ) : (
            masonryColumns.map((colBookmarks, colIndex) => (
              <div key={colIndex} className="flex flex-col gap-6 sm:gap-8 md:gap-10 w-full flex-1 min-w-0">
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

      {/* ─── THE COMMAND DRAWER (BOTTOM SLIDER) ─── */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 flex flex-col items-center transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] ${isSidebarOpen ? 'md:left-[320px]' : 'left-0'} ${isDrawerOpen ? 'translate-y-0' : 'translate-y-[calc(100%-48px)]'}`}>
        
        {/* Toggle Tab */}
        <button 
          onClick={() => setIsDrawerOpen(!isDrawerOpen)}
          className="bg-black dark:bg-white text-white dark:text-black border-4 border-b-0 border-black dark:border-white px-8 py-3 font-black uppercase tracking-widest text-sm rounded-t-lg shadow-[0_-4px_15px_rgba(0,0,0,0.2)] hover:bg-yellow-400 dark:hover:bg-cyan-400 hover:text-black transition-colors flex items-center gap-3 cursor-pointer"
        >
          <ChevronUpIcon className={`transition-transform duration-300 ${isDrawerOpen ? 'rotate-180' : ''}`} />
          {isDrawerOpen ? 'CLOSE TERMINAL' : 'ADD NEW DATA'}
        </button>

        {/* Drawer Panel */}
        <div className="w-full bg-white dark:bg-black border-t-8 border-black dark:border-white shadow-[0_-10px_40px_rgba(0,0,0,0.3)] p-6 md:p-10 flex flex-col gap-6 h-auto max-h-[50vh] overflow-y-auto">
          <div className="w-full max-w-[1200px] mx-auto flex flex-col md:flex-row items-stretch md:items-center gap-4">
            
            <button onClick={() => toast('SYS.ATTACHMENTS OFFLINE', { style: { background: '#000', color: '#fff', border: '4px solid #fff' } })} className="p-4 md:p-5 bg-gray-100 dark:bg-[#1a1a1a] text-black dark:text-white border-4 border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center justify-center cursor-pointer">
              <PaperclipIcon />
            </button>
            
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleQuickCapture(); } }}
              disabled={isSaving}
              placeholder="INJECT DATA STRING OR URL LIST HERE..."
              className="flex-1 bg-gray-50 dark:bg-[#111] border-4 border-black dark:border-white p-5 font-mono text-lg md:text-2xl text-black dark:text-white outline-none resize-none focus:bg-yellow-100 dark:focus:bg-cyan-950 transition-colors placeholder-gray-400 shadow-[inset_4px_4px_0_0_rgba(0,0,0,0.1)] dark:shadow-[inset_4px_4px_0_0_rgba(255,255,255,0.1)] min-h-[100px]"
            />
            
            <button onClick={handleQuickCapture} disabled={isSaving || !inputValue.trim()} className="px-8 py-5 md:py-0 md:h-[100px] bg-red-500 border-4 border-black dark:border-white text-black font-black text-xl uppercase tracking-widest shadow-[6px_6px_0_0_#000] dark:shadow-[6px_6px_0_0_#fff] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_0_#000] dark:hover:shadow-[4px_4px_0_0_#fff] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none disabled:opacity-50 disabled:grayscale cursor-pointer flex items-center justify-center gap-3 transition-all">
              <span className="hidden md:block">EXECUTE</span>
              <SendIcon />
            </button>

          </div>
        </div>
      </div>

      {/* DUPLICATE MODAL */}
      {duplicateMatch && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setDuplicateMatch(null)}>
          <div className="w-full max-w-lg bg-white dark:bg-black border-8 border-black dark:border-white p-8 md:p-12 shadow-[16px_16px_0_0_#000] dark:shadow-[16px_16px_0_0_#fff] overflow-hidden rounded-none" onClick={(e) => e.stopPropagation()}>
            <div className="inline-block px-4 py-2 bg-yellow-400 border-4 border-black text-black font-black uppercase text-sm mb-6 shadow-[4px_4px_0_0_#000]">
              ! COLLISION
            </div>
            <h3 className="text-4xl md:text-5xl font-black text-black dark:text-white uppercase tracking-tighter leading-none mb-6">
              RECORD ALREADY EXISTS.
            </h3>
            <div className="p-5 bg-gray-100 dark:bg-[#1a1a1a] border-4 border-black dark:border-white flex flex-col gap-2 overflow-hidden mb-8 shadow-[inset_4px_4px_0_0_rgba(0,0,0,0.1)] dark:shadow-[inset_4px_4px_0_0_rgba(255,255,255,0.1)]">
              <span className="text-lg font-black text-black dark:text-white truncate">{duplicateMatch.title}</span>
              <span className="text-sm font-mono text-gray-500 truncate">{duplicateMatch.url}</span>
            </div>
            <div className="flex flex-col gap-4">
              <button onClick={() => { setForcedInspectId(duplicateMatch.id); setDuplicateMatch(null); setInputValue(''); setIsDrawerOpen(false); }} className="w-full py-4 bg-cyan-400 text-black border-4 border-black font-black uppercase tracking-widest text-lg shadow-[6px_6px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_0_#000] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none transition-all">INSPECT NODE</button>
              <button onClick={() => setDuplicateMatch(null)} className="w-full py-4 bg-white dark:bg-black text-black dark:text-white border-4 border-black dark:border-white font-black uppercase tracking-widest text-lg shadow-[6px_6px_0_0_#000] dark:shadow-[6px_6px_0_0_#fff] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_0_#000] dark:hover:shadow-[4px_4px_0_0_#fff] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none transition-all">ABORT</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}