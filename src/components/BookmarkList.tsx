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

const PaperclipIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
const SendIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="15" y2="22" /><line x1="11" y1="13" x2="2" y2="9" /><line x1="22" y1="2" x2="11" y2="13" /></svg>
const MenuIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
const ExpandRightIcon = ({ className = '' }: { className?: string }) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={className}><path d="M9 18l6-6-6-6"/></svg>

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

  // ─── MASSIVE CARDS: REDUCED COLUMNS ───
  useEffect(() => {
    const updateColumns = () => {
      if (!gridRef.current) return
      const width = gridRef.current.offsetWidth
      if (width >= 1600) setColumnsCount(4) // Only 4 on ultrawide
      else if (width >= 1100) setColumnsCount(3) // 3 on 1080p
      else if (width >= 640) setColumnsCount(2) // 2 on tablets
      else setColumnsCount(1) // 1 on mobile
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
        if (validNewTokens.length === 0) { toast.error('URLs already present.'); setIsSaving(false); return }
        await Promise.all(validNewTokens.map(token => fetch('/api/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: /^https?:\/\//i.test(token) ? token : 'https://' + token }) })))
        toast.success(`Saved ${validNewTokens.length} items`)
      } else {
        const isSingleUrl = tokens.length === 1 && urlRegex.test(rawInput)
        let finalUrl = rawInput
        if (isSingleUrl) finalUrl = /^https?:\/\//i.test(finalUrl) ? finalUrl : 'https://' + finalUrl
        const payload = isSingleUrl ? { url: finalUrl } : { url: window.location.origin + '/note-' + Date.now(), content: rawInput, type: 'note' }
        const res = await fetch('/api/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        if (res.status === 409) {
          const match = bookmarks.find(b => normalizeUrl(b.url) === normalizeUrl(finalUrl))
          if (match) { setDuplicateMatch(match); setIsSaving(false); return }
          toast.error('Item exists.'); setIsSaving(false); return
        }
        if (!res.ok) throw new Error('Failed')
      }
      setInputValue('')
    } catch { toast.error('Error saving item.') } finally { setIsSaving(false) }
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
      <div className="flex flex-col gap-2 font-sans text-sm">
        <span className="font-semibold text-[#324a66] dark:text-gray-200">Delete "{catToDelete}"?</span>
        <div className="flex gap-2 mt-2">
          <button onClick={() => { setCustomCategories(p => p.filter(c => c !== catToDelete)); if (activeFilter === catToDelete) { setActiveFilter('All'); setActiveSubFilter(null) }; toast.dismiss(t.id) }} className="flex-1 px-3 py-1.5 bg-red-100 text-red-600 border border-red-200 shadow-sm rounded hover:bg-red-200 transition-colors">Delete</button>
          <button onClick={() => toast.dismiss(t.id)} className="flex-1 px-3 py-1.5 bg-white text-[#324a66] border border-[#a2bcdc] shadow-sm rounded hover:bg-gray-50 transition-colors">Cancel</button>
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
    <div className="min-h-screen font-sans flex flex-col overflow-x-hidden selection:bg-[#a9cbed] selection:text-[#203a55] relative z-0">
      
      {/* ─── PURE CSS SKY / CLOUD GRADIENT BACKGROUND ─── */}
      {/* ─── SMOOTH CROSSFADING BACKGROUNDS ─── */}
      <div className="fixed inset-0 pointer-events-none z-[-1]">
        {/* Light Mode Layer */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#f1f7fc] via-[#b6d5f0] to-[#609ad3] transition-opacity duration-700 ease-in-out opacity-100 dark:opacity-0" />
        
        {/* Dark Mode Layer */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0d1620] via-[#152336] to-[#0f172a] transition-opacity duration-700 ease-in-out opacity-0 dark:opacity-100" />
      </div>
      
      {/* ─── DESKTOP PROFILE DROP (TOP RIGHT WINDOW PANEL) ─── */}
      <div className="hidden md:block fixed top-6 right-6 z-40 w-[240px]">
        <ProfileDropdown email={userEmail ?? ""} />
      </div>

      {/* MOBILE HEADER */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-[50px] z-30 bg-white/70 dark:bg-[#1a2332]/70 backdrop-blur-md border-b border-[#a9cbed] dark:border-[#2a3f5a] flex items-center px-4 justify-between shadow-sm">
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-[#4a6b8c] dark:text-[#8ea4bd] hover:text-[#2c4054] transition-colors">
          <MenuIcon />
        </button>
        <span className="font-mono text-[11px] tracking-widest text-[#4a6b8c] dark:text-[#a2bcdc] uppercase">
          ++ smart. space //
        </span>
        <div className="w-8" />
      </header>

      {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-[#2c4054]/50 backdrop-blur-sm z-40 md:hidden transition-opacity" />}

      {/* ─── SLEEK SIDEBAR TOGGLE TAB (WHEN CLOSED) ─── */}
      {!isSidebarOpen && (
        <button 
          onClick={() => setIsSidebarOpen(true)} 
          className="hidden md:flex fixed left-0 top-32 z-40 bg-white/70 dark:bg-[#151c28]/80 backdrop-blur-xl hover:bg-white dark:hover:bg-[#1a2332] border border-white/80 dark:border-[#2a3f5a] border-l-0 rounded-r-lg px-2 py-4 shadow-[0_4px_12px_rgba(44,64,84,0.1),inset_0_1px_0_rgba(255,255,255,0.6)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] text-[#5e81a5] dark:text-[#8ea4bd] hover:text-[#2c4054] dark:hover:text-white transition-all cursor-pointer group"
          title="Open Navigation"
        >
          <ExpandRightIcon className="group-hover:translate-x-0.5 transition-transform" />
        </button>
      )}

      {/* GLOSSY SIDEBAR */}
      <div className={`fixed left-0 top-0 bottom-0 z-40 bg-white/80 dark:bg-[#151c28]/80 backdrop-blur-2xl border-r border-[#a9cbed] dark:border-[#2a3f5a] shadow-[0_0_30px_rgba(0,0,0,0.08)] transition-transform duration-300 ease-in-out flex flex-col md:pt-6 ${isSidebarOpen ? 'translate-x-0 w-[85vw] sm:w-[280px]' : '-translate-x-full md:w-0 overflow-hidden'}`}>
        <div className={`h-full flex-1 overflow-hidden transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 md:hidden'}`}>
          <Sidebar userEmail={userEmail || null} handleSignOut={handleSignOut} isMobileMenuOpen={isSidebarOpen} setIsMobileMenuOpen={setIsSidebarOpen} activeFilter={activeFilter} setActiveFilter={setActiveFilter} activeSubFilter={activeSubFilter} setActiveSubFilter={setActiveSubFilter} getCounts={getCounts} folderHierarchy={folderHierarchy} expandedFolders={expandedFolders} toggleFolderExpand={toggleFolderExpand} customCategories={customCategories} handleDeleteCategory={handleDeleteCategory} handleDragOver={handleDragOver} handleDrop={handleDrop} creatingSubFor={creatingSubFor} setCreatingSubFor={setCreatingSubFor} newSubfolderName={newSubfolderName} setNewSubfolderName={setNewSubfolderName} handleAddSubfolder={handleAddSubfolder} isAddingCategory={isAddingCategory} setIsAddingCategory={setIsAddingCategory} newCategoryName={newCategoryName} setNewCategoryName={setNewCategoryName} handleAddCategory={handleAddCategory} />
        </div>
      </div>

      {/* MAIN CONTENT */}
      <main className={`flex-1 flex flex-col px-3 sm:px-6 md:px-10 transition-all duration-300 pb-36 pt-[70px] md:pt-6 ${isSidebarOpen ? 'md:ml-[280px]' : 'md:ml-0'}`}>
        
        {/* GLOSSY SEARCH PANEL */}
        <div className="w-full max-w-5xl mx-auto mb-8 md:mb-12 mt-2 bg-white/60 dark:bg-[#151c28]/60 backdrop-blur-xl border border-white/80 dark:border-[#2a3f5a] rounded-lg shadow-[0_8px_24px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.6)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] overflow-hidden">
          <div className="bg-gradient-to-b from-[#f2f7fc] to-[#dae8f5] dark:from-[#213045] dark:to-[#1a2332] border-b border-[#a9cbed] dark:border-[#2a3f5a] px-4 py-2 flex items-center">
            <span className="font-mono text-[10px] text-[#4a6b8c] dark:text-[#8ea4bd] tracking-widest uppercase drop-shadow-[0_1px_0_rgba(255,255,255,0.8)] dark:drop-shadow-none">++ search.query //</span>
          </div>
          <input
            type="text"
            placeholder="Type to filter database..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none outline-none px-6 py-5 font-sans text-base sm:text-lg text-[#2c4054] dark:text-gray-200 placeholder-[#7999b8] dark:placeholder-[#4a6b8c]"
          />
        </div>

        {/* MASONRY GRID */}
        <div className="w-full max-w-[1600px] mx-auto flex gap-4 sm:gap-6 md:gap-8 items-start" ref={gridRef}>
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

      {/* ─── STRUCTURED DATA CAPTURE WINDOW (NO MORE PILL) ─── */}
      <div className={`fixed bottom-6 md:bottom-10 z-30 flex justify-center px-4 pointer-events-none transition-all duration-500 ease-out ${isInputVisible ? 'translate-y-0 opacity-100' : 'translate-y-[150%] opacity-0'} ${isSidebarOpen ? 'md:left-[280px]' : 'left-0'} right-0`}>
        <div className="pointer-events-auto w-full max-w-4xl bg-white/80 dark:bg-[#151c28]/90 backdrop-blur-2xl border border-white/80 dark:border-[#2a3f5a] rounded-lg shadow-[0_12px_40px_rgba(44,64,84,0.2),inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)] flex flex-col overflow-hidden">
          
          {/* Header Panel */}
          <div className="bg-gradient-to-b from-[#eaf2f9]/90 to-[#d1e2f3]/90 dark:from-[#213045]/90 dark:to-[#1a2332]/90 border-b border-[#a9cbed] dark:border-[#2a3f5a] px-4 py-1.5 flex items-center justify-between">
            <span className="font-mono text-[9px] text-[#4a6b8c] dark:text-[#8ea4bd] tracking-widest uppercase drop-shadow-[0_1px_0_rgba(255,255,255,0.8)] dark:drop-shadow-none">++ data.input.stream //</span>
          </div>

          <div className="flex items-center p-2.5 sm:p-3 gap-3">
            <button onClick={() => toast('Attachments panel offline', { style: { background: '#eaf2f9', color: '#2c4054', border: '1px solid #a9cbed' } })} className="p-2 text-[#5e81a5] hover:text-[#2c4054] hover:bg-[#e1eef9] dark:hover:bg-[#2a3f5a] rounded shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] border border-transparent hover:border-[#a9cbed] dark:hover:border-[#3a526b] cursor-pointer transition-all">
              <PaperclipIcon />
            </button>
            
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleQuickCapture() }}
              disabled={isSaving}
              placeholder="Inject link, text string, or node data..."
              className="flex-1 bg-[#f8fbff] dark:bg-[#0d1620] border border-[#c3d7eb] dark:border-[#3a526b] shadow-[inset_0_1px_3px_rgba(0,0,0,0.05)] rounded px-4 py-2 outline-none font-sans text-sm md:text-base text-[#2c4054] dark:text-gray-200 focus:border-[#609ad3] transition-colors placeholder-[#7999b8] dark:placeholder-[#4a6b8c]"
            />
            
            <button onClick={handleQuickCapture} disabled={isSaving || !inputValue.trim()} className="px-5 py-2.5 bg-gradient-to-b from-[#609ad3] to-[#3a75b0] hover:from-[#7cb3eb] hover:to-[#4a85c0] text-white font-bold text-[11px] uppercase tracking-widest rounded shadow-[0_2px_5px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.4)] disabled:opacity-50 cursor-pointer flex items-center justify-center transition-all border border-[#2f5b89]">
              <span className="hidden sm:block mr-2">Submit</span>
              <SendIcon />
            </button>
          </div>
        </div>
      </div>

      {/* DUPLICATE MODAL */}
      {duplicateMatch && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-[#1a2332]/50 backdrop-blur-md" onClick={() => setDuplicateMatch(null)}>
          <div className="w-full max-w-md bg-white/90 dark:bg-[#151c28]/95 backdrop-blur-xl border border-white dark:border-[#2a3f5a] rounded-lg shadow-[0_10px_30px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.8)] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-b from-[#fceced] to-[#fad2d5] border-b border-[#f1aab0] px-4 py-2 flex items-center">
              <span className="font-mono text-[10px] text-[#c53030] tracking-widest uppercase">++ warning.collision //</span>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <h3 className="text-sm font-semibold text-[#2c4054] dark:text-white">Entry already exists in database.</h3>
              <div className="p-3 bg-white/50 dark:bg-[#0d1620] rounded border border-[#a9cbed] dark:border-[#2a3f5a] flex flex-col gap-1 overflow-hidden">
                <span className="text-xs font-semibold text-[#2c4054] dark:text-gray-300 truncate">{duplicateMatch.title}</span>
                <span className="text-[10px] font-mono text-[#5e81a5] truncate">{duplicateMatch.url}</span>
              </div>
              <div className="flex gap-2 mt-2">
                <button onClick={() => { setForcedInspectId(duplicateMatch.id); setDuplicateMatch(null); setInputValue('') }} className="flex-1 py-2 bg-gradient-to-b from-[#609ad3] to-[#3a75b0] text-white text-xs font-semibold rounded shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] hover:opacity-90 transition-opacity">Inspect Panel</button>
                <button onClick={() => setDuplicateMatch(null)} className="flex-1 py-2 bg-gradient-to-b from-[#f2f7fc] to-[#dae8f5] text-[#4a6b8c] text-xs font-semibold border border-[#a9cbed] rounded shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] hover:bg-[#e1eef9] transition-colors">Dismiss</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}