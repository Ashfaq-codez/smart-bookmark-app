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

const PaperclipIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
const SendIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
const MenuIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
const ChevronRight = ({ className = '' }: { className?: string }) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><path d="M9 18l6-6-6-6" /></svg>

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
        if (validNewTokens.length === 0) { toast.error('DATA_ALREADY_IN_MAINFRAME'); setIsSaving(false); return }
        await Promise.all(validNewTokens.map(token => fetch('/api/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: /^https?:\/\//i.test(token) ? token : 'https://' + token }) })))
        toast.success(`UPLOADED_${validNewTokens.length}_NODES`)
      } else {
        const isSingleUrl = tokens.length === 1 && urlRegex.test(rawInput)
        let finalUrl = rawInput
        if (isSingleUrl) finalUrl = /^https?:\/\//i.test(finalUrl) ? finalUrl : 'https://' + finalUrl
        const payload = isSingleUrl ? { url: finalUrl } : { url: window.location.origin + '/note-' + Date.now(), content: rawInput, type: 'note' }
        const res = await fetch('/api/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        if (res.status === 409) {
          const match = bookmarks.find(b => normalizeUrl(b.url) === normalizeUrl(finalUrl))
          if (match) { setDuplicateMatch(match); setIsSaving(false); return }
          toast.error('NODE_EXISTS'); setIsSaving(false); return
        }
        if (!res.ok) throw new Error('Failed')
      }
      setInputValue('')
    } catch { toast.error('SYSTEM_ERROR') } finally { setIsSaving(false) }
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
      <div className="flex flex-col gap-4 font-mono p-2">
        <span className="text-sm font-bold text-cyan-400">DELETE_DIRECTORY // {catToDelete}?</span>
        <div className="flex gap-3 mt-2">
          <button onClick={() => { setCustomCategories(p => p.filter(c => c !== catToDelete)); if (activeFilter === catToDelete) { setActiveFilter('All'); setActiveSubFilter(null) }; toast.dismiss(t.id) }} className="flex-1 px-4 py-2 bg-black border border-fuchsia-500 text-fuchsia-500 font-bold hover:bg-fuchsia-500 hover:text-black hover:shadow-[0_0_10px_#d946ef] transition-all text-xs">CONFIRM</button>
          <button onClick={() => toast.dismiss(t.id)} className="flex-1 px-4 py-2 bg-black border border-cyan-500 text-cyan-400 font-bold hover:bg-cyan-500 hover:text-black hover:shadow-[0_0_10px_#06b6d4] transition-all text-xs">ABORT</button>
        </div>
      </div>
    ), { duration: Infinity, style: { background: '#000', border: '1px solid #06b6d4', color: '#06b6d4' } })
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
    <div className="bg-black min-h-screen font-sans text-cyan-50 flex flex-col overflow-x-hidden selection:bg-fuchsia-500 selection:text-white relative z-0">
      
      {/* ─── Y2K GRID BACKGROUND ─── */}
      <div className="fixed inset-0 pointer-events-none z-[-1] opacity-20 bg-[linear-gradient(to_right,#06b6d4_1px,transparent_1px),linear-gradient(to_bottom,#06b6d4_1px,transparent_1px)] bg-[size:32px_32px]"></div>

      {/* ─── MOBILE HEADER ─── */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-[60px] z-30 bg-black/80 backdrop-blur-md border-b border-cyan-500/50 flex items-center px-4 justify-between shadow-[0_0_15px_rgba(6,182,212,0.3)]">
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-cyan-400 hover:text-fuchsia-400 transition-colors">
          <MenuIcon />
        </button>
        <span className="font-mono text-sm tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 drop-shadow-[0_0_5px_rgba(6,182,212,0.8)]">
          // SYS.MIND
        </span>
        <div className="w-8" />
      </header>

      {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden transition-opacity" />}

      {/* ─── Y2K SIDEBAR ─── */}
      <div className={`fixed left-0 top-0 bottom-0 z-40 bg-black border-r border-cyan-500/50 transition-transform duration-300 ease-out flex flex-col ${isSidebarOpen ? 'translate-x-0 w-[85vw] sm:w-[300px] shadow-[0_0_30px_rgba(6,182,212,0.2)]' : '-translate-x-full md:translate-x-0 md:w-[70px]'}`}>
        <div className="hidden md:flex flex-col">
           {isSidebarOpen ? (
             <div className="p-4 border-b border-cyan-500/50"><ProfileDropdown email={userEmail ?? ""} /></div>
           ) : (
             <div className="h-[70px] flex items-center justify-center border-b border-cyan-500/50 bg-black">
               <div className="w-10 h-10 border border-cyan-400 text-cyan-400 rounded-full flex items-center justify-center font-mono font-bold text-lg shadow-[0_0_10px_rgba(6,182,212,0.5)] bg-black">
                 {userEmail?.[0].toUpperCase()}
               </div>
             </div>
           )}
        </div>

        <div onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="hidden md:flex w-full h-[40px] items-center justify-center cursor-pointer bg-[#00111a] hover:bg-cyan-950 border-b border-cyan-500/50 text-cyan-500 transition-colors">
          <ChevronRight className={`transition-transform duration-300 drop-shadow-[0_0_5px_rgba(6,182,212,1)] ${isSidebarOpen ? 'rotate-180' : ''}`} />
        </div>

        <div className={`h-full flex-1 overflow-hidden transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 md:hidden'}`}>
          <Sidebar userEmail={userEmail || null} handleSignOut={handleSignOut} isMobileMenuOpen={isSidebarOpen} setIsMobileMenuOpen={setIsSidebarOpen} activeFilter={activeFilter} setActiveFilter={setActiveFilter} activeSubFilter={activeSubFilter} setActiveSubFilter={setActiveSubFilter} getCounts={getCounts} folderHierarchy={folderHierarchy} expandedFolders={expandedFolders} toggleFolderExpand={toggleFolderExpand} customCategories={customCategories} handleDeleteCategory={handleDeleteCategory} handleDragOver={handleDragOver} handleDrop={handleDrop} creatingSubFor={creatingSubFor} setCreatingSubFor={setCreatingSubFor} newSubfolderName={newSubfolderName} setNewSubfolderName={setNewSubfolderName} handleAddSubfolder={handleAddSubfolder} isAddingCategory={isAddingCategory} setIsAddingCategory={setIsAddingCategory} newCategoryName={newCategoryName} setNewCategoryName={setNewCategoryName} handleAddCategory={handleAddCategory} />
        </div>
      </div>

      {/* ─── MAIN CONTENT ─── */}
      <main className={`flex-1 flex flex-col px-4 sm:px-8 md:px-12 transition-all duration-300 pb-32 pt-[80px] md:pt-4 ${isSidebarOpen ? 'md:ml-[300px]' : 'md:ml-[70px]'}`}>
        
        {/* Y2K Header */}
        <div className="w-full max-w-6xl mx-auto mb-10 md:mb-16 mt-4 md:mt-10 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-fuchsia-500/20 blur-3xl rounded-full z-[-1]" />
          <input
            type="text"
            placeholder="[ SEARCH_DATABASE... ]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/50 backdrop-blur-md border border-cyan-500/30 rounded-2xl px-6 py-4 font-mono text-xl sm:text-3xl md:text-4xl text-cyan-300 placeholder-cyan-800 transition-all focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(6,182,212,0.4)] outline-none"
          />
        </div>

        {/* Grid */}
        <div className="w-full max-w-7xl mx-auto flex gap-4 sm:gap-6 items-start" ref={gridRef}>
          {isLoading ? (
            Array.from({ length: columnsCount }).map((_, colIndex) => (
              <div key={colIndex} className="flex flex-col gap-4 sm:gap-6 w-full flex-1">
                {Array.from({ length: 3 }).map((_, i) => <BookmarkSkeleton key={i} />)}
              </div>
            ))
          ) : (
            masonryColumns.map((colBookmarks, colIndex) => (
              <div key={colIndex} className="flex flex-col gap-4 sm:gap-6 w-full flex-1">
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

      {/* ─── Y2K CAPTURE PILL ─── */}
      <div className={`fixed bottom-6 md:bottom-10 z-30 flex justify-center px-4 pointer-events-none transition-all duration-500 ease-out ${isInputVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-[150%] opacity-0 scale-95'} ${isSidebarOpen ? 'md:left-[300px]' : 'md:left-[70px]'} left-0 right-0`}>
        <div className="pointer-events-auto w-full max-w-3xl bg-black/80 backdrop-blur-xl border border-cyan-500 rounded-full shadow-[0_0_25px_rgba(6,182,212,0.3)] flex items-center p-1.5 gap-2 transition-transform hover:shadow-[0_0_35px_rgba(6,182,212,0.5)]">
          <button onClick={() => toast('AWAITING_UPLOAD_MODULE', { style: { background: '#000', color: '#0ff', border: '1px solid #0ff' } })} className="p-3 text-cyan-600 hover:text-fuchsia-400 hover:bg-cyan-900/30 rounded-full cursor-pointer transition-colors" title="Attach">
            <PaperclipIcon />
          </button>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleQuickCapture() }}
            disabled={isSaving}
            placeholder="INPUT_URL_OR_DATA_STRING..."
            className="flex-1 bg-transparent border-none outline-none px-2 font-mono text-sm md:text-base text-cyan-100 placeholder-cyan-800 tracking-wide"
          />
          <button onClick={handleQuickCapture} disabled={isSaving || !inputValue.trim()} className="p-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-full shadow-[0_0_15px_rgba(6,182,212,0.8)] cursor-pointer flex items-center justify-center transition-transform hover:scale-105 active:scale-95 disabled:opacity-50">
            <SendIcon />
          </button>
        </div>
      </div>

      {/* ─── DUPLICATE MODAL ─── */}
      {duplicateMatch && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md" onClick={() => setDuplicateMatch(null)}>
          <div className="w-full max-w-md bg-[#00111a] border border-fuchsia-500 p-8 rounded-xl shadow-[0_0_40px_rgba(217,70,239,0.3)] flex flex-col gap-6" onClick={(e) => e.stopPropagation()}>
            <div className="inline-block px-3 py-1 bg-fuchsia-500/20 text-fuchsia-400 font-mono text-xs border border-fuchsia-500/50 w-max shadow-[0_0_10px_rgba(217,70,239,0.5)]">
              ! DATA_COLLISION_DETECTED
            </div>
            <h3 className="text-xl font-mono text-cyan-300 uppercase leading-snug">
              Node already exists in mainframe.
            </h3>
            <div className="p-4 bg-black/50 rounded-lg flex flex-col gap-1 border border-cyan-900">
              <span className="text-sm font-medium text-gray-200 truncate">{duplicateMatch.title}</span>
              <span className="text-xs text-cyan-600 font-mono truncate">{duplicateMatch.url}</span>
            </div>
            <div className="flex flex-col gap-3 mt-2">
              <button onClick={() => { setForcedInspectId(duplicateMatch.id); setDuplicateMatch(null); setInputValue('') }} className="w-full py-3 bg-fuchsia-600 text-white font-mono text-sm rounded hover:bg-fuchsia-500 hover:shadow-[0_0_15px_rgba(217,70,239,0.8)] transition-all">INSPECT_NODE</button>
              <button onClick={() => setDuplicateMatch(null)} className="w-full py-3 bg-transparent border border-cyan-700 text-cyan-500 font-mono text-sm rounded hover:bg-cyan-900/50 hover:border-cyan-500 hover:text-cyan-300 transition-all">DISMISS</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}