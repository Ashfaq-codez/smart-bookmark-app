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

const PaperclipIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
const SendIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
const MenuIcon = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
const ChevronRight = ({ className = '' }: { className?: string }) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={className}><path d="M9 18l6-6-6-6" /></svg>

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
  const [isInputVisible, setIsInputVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [columnsCount, setColumnsCount] = useState(4)
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
      if (width >= 1536) setColumnsCount(6)
      else if (width >= 1280) setColumnsCount(5)
      else if (width >= 1024) setColumnsCount(4)
      else if (width >= 768) setColumnsCount(3)
      else setColumnsCount(2)
    }
    const observer = new ResizeObserver(updateColumns)
    if (gridRef.current) observer.observe(gridRef.current)
    updateColumns()
    const timer = setTimeout(() => setIsLoading(false), 300)
    return () => { observer.disconnect(); clearTimeout(timer) }
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      if (currentScrollY > lastScrollY && currentScrollY > 60) setIsInputVisible(false)
      else setIsInputVisible(true)
      setLastScrollY(currentScrollY)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

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
        if (validNewTokens.length === 0) { toast.error('All links already in hub!'); setIsSaving(false); return }
        await Promise.all(validNewTokens.map(token => fetch('/api/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: /^https?:\/\//i.test(token) ? token : 'https://' + token }) })))
        toast.success(`Saved ${validNewTokens.length} links!`)
      } else {
        const isSingleUrl = tokens.length === 1 && urlRegex.test(rawInput)
        let finalUrl = rawInput
        if (isSingleUrl) finalUrl = /^https?:\/\//i.test(finalUrl) ? finalUrl : 'https://' + finalUrl
        const payload = isSingleUrl ? { url: finalUrl } : { url: window.location.origin + '/note-' + Date.now(), content: rawInput, type: 'note' }
        const res = await fetch('/api/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        if (res.status === 409) {
          const match = bookmarks.find(b => normalizeUrl(b.url) === normalizeUrl(finalUrl))
          if (match) { setDuplicateMatch(match); setIsSaving(false); return }
          toast.error('Item exists!'); setIsSaving(false); return
        }
        if (!res.ok) throw new Error('Failed')
      }
      setInputValue('')
    } catch { toast.error('Could not save item.') } finally { setIsSaving(false) }
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
      <div className="flex flex-col gap-4 font-sans p-2">
        <span className="text-xl font-black uppercase text-gray-900 dark:text-white">Delete "{catToDelete}"?</span>
        <div className="flex gap-3 mt-2">
          <button onClick={() => { setCustomCategories(p => p.filter(c => c !== catToDelete)); if (activeFilter === catToDelete) { setActiveFilter('All'); setActiveSubFilter(null) }; toast.dismiss(t.id) }} className="flex-1 px-4 py-3 bg-red-600 text-white font-black uppercase text-sm rounded-xl">Delete</button>
          <button onClick={() => toast.dismiss(t.id)} className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white font-black uppercase text-sm rounded-xl">Cancel</button>
        </div>
      </div>
    ), { duration: Infinity })
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
    <div className="bg-[#fbfbfb] dark:bg-[#070707] min-h-screen font-sans text-gray-900 dark:text-gray-100 flex flex-col overflow-x-hidden selection:bg-fuchsia-400 selection:text-white">
      
      {/* ─── MOBILE HEADER ─── */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-[70px] z-30 bg-white/80 dark:bg-black/80 backdrop-blur-2xl border-b border-gray-200 dark:border-gray-800 flex items-center px-6 justify-between">
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-fuchsia-600 dark:text-fuchsia-400">
          <MenuIcon />
        </button>
        <span className="font-black text-xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-500 to-orange-500">
          SECOND BRAIN
        </span>
        <div className="w-8" />
      </header>

      {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 md:hidden transition-opacity" />}

      {/* ─── EXPANSIVE SIDEBAR ─── */}
      <div className={`fixed left-0 top-0 bottom-0 z-40 bg-white dark:bg-[#0c0c0c] border-r border-gray-200 dark:border-gray-800 transition-transform duration-500 cubic-bezier(0.19, 1, 0.22, 1) flex flex-col ${isSidebarOpen ? 'translate-x-0 w-[85vw] sm:w-[360px] shadow-2xl' : '-translate-x-full md:translate-x-0 md:w-[80px]'}`}>
        <div className="hidden md:flex flex-col">
           {isSidebarOpen ? (
             <div className="p-6 border-b border-gray-200 dark:border-gray-800"><ProfileDropdown email={userEmail ?? ""} /></div>
           ) : (
             <div className="h-[90px] flex items-center justify-center border-b border-gray-200 dark:border-gray-800 bg-gradient-to-br from-fuchsia-600 to-orange-600">
               <div className="w-12 h-12 rounded-full bg-white dark:bg-black flex items-center justify-center font-black text-xl text-fuchsia-600 dark:text-fuchsia-400 shadow-xl">{userEmail?.[0].toUpperCase()}</div>
             </div>
           )}
        </div>
        <div className={`h-full flex-1 overflow-hidden transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 md:hidden'}`}>
          <Sidebar userEmail={userEmail || null} handleSignOut={handleSignOut} isMobileMenuOpen={isSidebarOpen} setIsMobileMenuOpen={setIsSidebarOpen} activeFilter={activeFilter} setActiveFilter={setActiveFilter} activeSubFilter={activeSubFilter} setActiveSubFilter={setActiveSubFilter} getCounts={getCounts} folderHierarchy={folderHierarchy} expandedFolders={expandedFolders} toggleFolderExpand={toggleFolderExpand} customCategories={customCategories} handleDeleteCategory={handleDeleteCategory} handleDragOver={handleDragOver} handleDrop={handleDrop} creatingSubFor={creatingSubFor} setCreatingSubFor={setCreatingSubFor} newSubfolderName={newSubfolderName} setNewSubfolderName={setNewSubfolderName} handleAddSubfolder={handleAddSubfolder} isAddingCategory={isAddingCategory} setIsAddingCategory={setIsAddingCategory} newCategoryName={newCategoryName} setNewCategoryName={setNewCategoryName} handleAddCategory={handleAddCategory} />
        </div>
        <div onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="hidden md:flex w-full h-[80px] items-center justify-center cursor-pointer bg-gray-50 dark:bg-[#111] hover:bg-gray-100 dark:hover:bg-[#1a1a1a] border-t border-gray-200 dark:border-gray-800 text-gray-400 transition-colors">
          <ChevronRight className={`transition-transform duration-500 ${isSidebarOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* ─── MAIN CONTENT ─── */}
      <main className={`flex-1 flex flex-col px-4 sm:px-8 md:px-16 transition-all duration-500 pb-40 pt-[90px] md:pt-16 ${isSidebarOpen ? 'md:ml-[360px]' : 'md:ml-[80px]'}`}>
        
        {/* Maximalist Header */}
        <div className="w-full max-w-7xl mx-auto mb-16 md:mb-24 mt-8 md:mt-16">
          <input
            type="text"
            placeholder="SEARCH MY MIND"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none outline-none font-black text-6xl sm:text-8xl md:text-[110px] tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 via-purple-600 to-orange-500 placeholder-gray-200 dark:placeholder-gray-900 transition-all leading-none"
          />
        </div>

        {/* Masonry Grid */}
        <div className="w-full max-w-7xl mx-auto flex gap-6 sm:gap-10 items-start" ref={gridRef}>
          {isLoading ? (
            Array.from({ length: columnsCount }).map((_, colIndex) => (
              <div key={colIndex} className="flex flex-col gap-6 sm:gap-10 w-full flex-1">
                {Array.from({ length: 3 }).map((_, i) => <BookmarkSkeleton key={i} />)}
              </div>
            ))
          ) : (
            masonryColumns.map((colBookmarks, colIndex) => (
              <div key={colIndex} className="flex flex-col gap-6 sm:gap-10 w-full flex-1">
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

      {/* ─── MAXIMALIST CAPTURE PILL ─── */}
      <div className={`fixed bottom-8 md:bottom-12 z-30 flex justify-center px-4 pointer-events-none transition-all duration-700 ease-out ${isInputVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-[150%] opacity-0 scale-95'} ${isSidebarOpen ? 'md:left-[360px]' : 'md:left-[80px]'} left-0 right-0`}>
        <div className="pointer-events-auto w-full max-w-4xl bg-white/90 dark:bg-[#111]/90 backdrop-blur-2xl rounded-full shadow-[0_20px_60px_-15px_rgba(217,70,239,0.3)] dark:shadow-[0_20px_60px_-15px_rgba(217,70,239,0.15)] flex items-center p-3 gap-4 transition-transform hover:-translate-y-2 border border-gray-100 dark:border-gray-800">
          <button onClick={() => toast('Attachments coming soon', { icon: '📎' })} className="p-4 bg-gray-100 dark:bg-gray-900 text-gray-500 hover:text-fuchsia-600 rounded-full cursor-pointer transition-colors" title="Attach">
            <PaperclipIcon />
          </button>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleQuickCapture() }}
            disabled={isSaving}
            placeholder="TYPE OR PASTE ANYTHING..."
            className="flex-1 bg-transparent border-none outline-none px-2 font-black uppercase text-lg md:text-2xl text-gray-900 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-700 tracking-wide"
          />
          <button onClick={handleQuickCapture} disabled={isSaving || !inputValue.trim()} className="p-4 bg-gradient-to-r from-fuchsia-600 to-orange-500 text-white rounded-full shadow-lg disabled:opacity-50 cursor-pointer flex items-center justify-center transition-transform hover:scale-105 active:scale-95">
            <SendIcon />
          </button>
        </div>
      </div>

      {/* ─── DUPLICATE MODAL ─── */}
      {duplicateMatch && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl" onClick={() => setDuplicateMatch(null)}>
          <div className="w-full max-w-lg bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-800 p-10 rounded-[40px] shadow-2xl flex flex-col gap-8" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-4xl font-black uppercase text-gray-900 dark:text-white leading-none tracking-tighter">Already Saved.</h3>
            <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-2xl flex flex-col gap-2 border border-gray-100 dark:border-gray-800">
              <span className="text-xl font-bold text-gray-900 dark:text-white truncate">{duplicateMatch.title}</span>
              <span className="text-sm text-gray-500 truncate">{duplicateMatch.url}</span>
            </div>
            <div className="flex flex-col gap-4 mt-2">
              <button onClick={() => { setForcedInspectId(duplicateMatch.id); setDuplicateMatch(null); setInputValue('') }} className="w-full py-5 bg-gradient-to-r from-fuchsia-600 to-orange-500 text-white font-black uppercase tracking-widest text-sm rounded-full shadow-lg hover:shadow-xl transition-all">Inspect Original</button>
              <button onClick={() => setDuplicateMatch(null)} className="w-full py-5 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white font-black uppercase tracking-widest text-sm rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-all">Dismiss</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}