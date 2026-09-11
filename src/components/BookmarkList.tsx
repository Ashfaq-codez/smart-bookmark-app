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

const PaperclipIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
)

const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
)

const MenuIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
  </svg>
)

const ChevronRight = ({ className = '' }: { className?: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M9 18l6-6-6-6" />
  </svg>
)

function normalizeUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim()
  if (!trimmed) return ''
  try {
    const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
    const parsed = new URL(withProto)
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '')
    const path = parsed.pathname.replace(/\/+$/, '') || '/'
    return `${parsed.protocol}//${host}${path}${parsed.search}`
  } catch {
    return trimmed.toLowerCase().replace(/\/+$/, '')
  }
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

  // Masonry layout state
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

  // 1. Container-Aware Resize Observer for perfect horizontal Masonry
  useEffect(() => {
    const updateColumns = () => {
      if (!gridRef.current) return
      const width = gridRef.current.offsetWidth
      if (width >= 1536) setColumnsCount(6)
      else if (width >= 1280) setColumnsCount(5)
      else if (width >= 1024) setColumnsCount(4)
      else if (width >= 768) setColumnsCount(3)
      else setColumnsCount(2) // Always 2 on mobile
    }

    const observer = new ResizeObserver(updateColumns)
    if (gridRef.current) observer.observe(gridRef.current)
    
    updateColumns() // Initial calculation
    const timer = setTimeout(() => setIsLoading(false), 300)
    
    return () => {
      observer.disconnect()
      clearTimeout(timer)
    }
  }, [])

  // 2. Hide bottom bar on scroll down
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      if (currentScrollY > lastScrollY && currentScrollY > 60) {
        setIsInputVisible(false)
      } else {
        setIsInputVisible(true)
      }
      setLastScrollY(currentScrollY)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  // 3. Global Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && duplicateMatch) {
        setDuplicateMatch(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [duplicateMatch])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const handleQuickCapture = async () => {
    const rawInput = inputValue.trim()
    if (!rawInput) return

    const urlRegex = /^(https?:\/\/)?([\w.-]+)\.([a-z]{2,})(:\d{1,5})?(\/.*)?$/i
    const tokens = rawInput.split(/[\s,]+/).filter(Boolean)
    const isAllUrls = tokens.length > 0 && tokens.every(t => urlRegex.test(t))

    if (isAllUrls && tokens.length === 1) {
      const targetNormalized = normalizeUrl(tokens[0])
      const existing = bookmarks.find(b => (b.type === 'link' || !b.type) && normalizeUrl(b.url) === targetNormalized)
      
      if (existing) {
        setDuplicateMatch(existing)
        return
      }
    }

    setIsSaving(true)
    const existingUrls = new Set(bookmarks.map(b => normalizeUrl(b.url)))

    try {
      if (isAllUrls && tokens.length > 1) {
        const validNewTokens = tokens.filter(token => !existingUrls.has(normalizeUrl(token)))

        if (validNewTokens.length === 0) {
          toast.error('All entered links are already in your hub!')
          setIsSaving(false)
          return
        }

        if (validNewTokens.length < tokens.length) {
          toast('Skipped duplicate URLs.', { icon: 'ℹ️' })
        }

        await Promise.all(validNewTokens.map(token => {
          const finalUrl = /^https?:\/\//i.test(token) ? token : 'https://' + token
          return fetch('/api/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: finalUrl })
          })
        }))
        toast.success(`Saved ${validNewTokens.length} new links!`)
      } else {
        const isSingleUrl = tokens.length === 1 && urlRegex.test(rawInput)
        let finalUrl = rawInput

        if (isSingleUrl) {
          finalUrl = /^https?:\/\//i.test(finalUrl) ? finalUrl : 'https://' + finalUrl
        }

        const payload = isSingleUrl
          ? { url: finalUrl }
          : { url: window.location.origin + '/note-' + Date.now(), content: rawInput, type: 'note' }

        const res = await fetch('/api/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })

        if (res.status === 409) {
          const match = bookmarks.find(b => normalizeUrl(b.url) === normalizeUrl(finalUrl))
          if (match) {
            setDuplicateMatch(match)
            setIsSaving(false)
            return
          }
          toast.error('This bookmark already exists!')
          setIsSaving(false)
          return
        }

        if (!res.ok) throw new Error('Failed to save.')
      }
      setInputValue('')
    } catch {
      toast.error('Could not save item.')
    } finally {
      setIsSaving(false)
    }
  }

  // Generate Filtered & Search Results
  const filteredBookmarks = useMemo(() => {
    return bookmarks.filter((bookmark) => {
      const matchCategory = activeFilter === 'All' || (bookmark.category || 'Uncategorized') === activeFilter
      const matchSubCategory = activeFilter === 'All' ? true : (activeSubFilter ? bookmark.sub_category === activeSubFilter : !bookmark.sub_category)

      const searchLower = searchQuery.toLowerCase()
      const matchSearch = searchQuery === '' || 
        bookmark.title.toLowerCase().includes(searchLower) ||
        bookmark.url.toLowerCase().includes(searchLower) ||
        (bookmark.content && bookmark.content.toLowerCase().includes(searchLower)) ||
        (bookmark.description && bookmark.description.toLowerCase().includes(searchLower)) ||
        (bookmark.category && bookmark.category.toLowerCase().includes(searchLower)) ||
        (bookmark.sub_category && bookmark.sub_category.toLowerCase().includes(searchLower))

      return matchCategory && matchSubCategory && matchSearch
    })
  }, [bookmarks, activeFilter, activeSubFilter, searchQuery])

  // Distribute mathematically left-to-right
  const masonryColumns = useMemo(() => {
    const cols: Bookmark[][] = Array.from({ length: columnsCount }, () => [])
    filteredBookmarks.forEach((bookmark, index) => {
      cols[index % columnsCount].push(bookmark)
    })
    return cols
  }, [filteredBookmarks, columnsCount])

  const folderHierarchy = useMemo(() => {
    const tree: Record<string, string[]> = {}
    const baseCats = Array.from(new Set([...customCategories, ...bookmarks.map(b => b.category || 'Uncategorized')]))
    baseCats.forEach(cat => { if (cat !== 'All') tree[cat] = [] })
    bookmarks.forEach(b => {
      const parent = b.category || 'Uncategorized'
      if (b.sub_category) {
        if (!tree[parent]) tree[parent] = []
        if (!tree[parent].includes(b.sub_category)) tree[parent].push(b.sub_category)
      }
    })
    Object.entries(customSubCategories).forEach(([parent, subs]) => {
      if (!tree[parent]) tree[parent] = []
      subs.forEach(sub => { if (!tree[parent].includes(sub)) tree[parent].push(sub) })
    })
    return tree
  }, [bookmarks, customCategories, customSubCategories])

  const getCounts = useMemo(() => {
    const counts: Record<string, number> = { 'All': bookmarks.length }
    bookmarks.forEach(b => {
      const cat = b.category || 'Uncategorized'
      const sub = b.sub_category
      counts[cat] = (counts[cat] || 0) + 1
      if (sub) {
        const subKey = `${cat}::${sub}`
        counts[subKey] = (counts[subKey] || 0) + 1
      }
    })
    return counts
  }, [bookmarks])

  const handleAddCategory = () => {
    const trimmed = newCategoryName.trim()
    if (trimmed && !Object.keys(folderHierarchy).includes(trimmed)) {
      setCustomCategories(prev => [...prev, trimmed])
      setActiveFilter(trimmed)
      setActiveSubFilter(null)
    }
    setNewCategoryName('')
    setIsAddingCategory(false)
  }

  const handleAddSubfolder = (parentFolder: string) => {
    const trimmed = newSubfolderName.trim()
    if (trimmed) {
      setCustomSubCategories(prev => {
        const existingSubs = prev[parentFolder] || []
        if (existingSubs.includes(trimmed)) return prev
        return { ...prev, [parentFolder]: [...existingSubs, trimmed] }
      })
      setActiveFilter(parentFolder)
      setActiveSubFilter(trimmed)
    }
    setNewSubfolderName('')
    setCreatingSubFor(null)
  }

  const handleDeleteCategory = async (catToDelete: string) => {
    toast((t) => (
      <div className="flex flex-col gap-3 font-sans">
        <span className="text-base font-semibold text-gray-900 dark:text-white">Delete folder "{catToDelete}"?</span>
        <span className="text-xs text-gray-500">Saved items will remain in Uncategorized.</span>
        <div className="flex gap-2 mt-2">
          <button 
            onClick={() => {
              setCustomCategories(prev => prev.filter(c => c !== catToDelete))
              if (activeFilter === catToDelete) {
                setActiveFilter('All')
                setActiveSubFilter(null)
              }
              toast.dismiss(t.id)
            }} 
            className="flex-1 px-3 py-2 bg-red-500 text-white font-medium text-xs rounded-lg cursor-pointer"
          >
            Delete
          </button>
          <button 
            onClick={() => toast.dismiss(t.id)} 
            className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-medium text-xs rounded-lg cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    ), { duration: Infinity, style: { background: 'transparent', boxShadow: 'none', padding: 0 } })
  }

  const toggleFolderExpand = (folder: string) => setExpandedFolders(prev => ({ ...prev, [folder]: !prev[folder] }))
  const handleDragStart = (e: React.DragEvent, id: number) => { e.dataTransfer.setData('bookmarkId', id.toString()); setDraggedId(id) }
  const handleDragEnd = () => setDraggedId(null)
  const handleDragOver = (e: React.DragEvent) => e.preventDefault()
  const handleDrop = async (e: React.DragEvent, targetCategory: string, targetSubCategory?: string) => {
    e.preventDefault()
    const bookmarkId = parseInt(e.dataTransfer.getData('bookmarkId'))
    if (!bookmarkId || isNaN(bookmarkId)) return
    await updateBookmark(bookmarkId, { category: targetCategory === 'All' ? 'Uncategorized' : targetCategory, sub_category: targetSubCategory || null })
  }

  return (
    <div className="bg-[#f2f3f5] dark:bg-[#0c0d0f] min-h-screen font-sans text-gray-900 dark:text-gray-100 flex flex-col overflow-x-hidden selection:bg-blue-200 dark:selection:bg-blue-900/50">
      
      {/* ────────────────────────────────────────────────────────────
          1. MINIMALIST MOBILE HEADER
          ──────────────────────────────────────────────────────────── */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-[60px] z-30 bg-[#f2f3f5]/90 dark:bg-[#0c0d0f]/90 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/5 flex items-center px-4 justify-between select-none">
        <button 
          onClick={() => setIsSidebarOpen(true)} 
          className="p-2 -ml-2 text-gray-600 dark:text-gray-400 cursor-pointer"
        >
          <MenuIcon />
        </button>
        <span className="font-medium text-sm text-gray-900 dark:text-white">
          Smart Bookmark
        </span>
        <div className="w-8" /> {/* Balance spacer */}
      </header>

      {/* ────────────────────────────────────────────────────────────
          2. MINIMALIST SIDEBAR & PROFILE
          ──────────────────────────────────────────────────────────── */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-sm transition-opacity"
        />
      )}

      <div 
        className={`fixed left-0 top-0 bottom-0 z-40 bg-[#fbfbfc] dark:bg-[#121316] border-r border-gray-200/60 dark:border-white/5 transition-all duration-300 ease-in-out flex flex-col ${
          isSidebarOpen 
            ? 'translate-x-0 w-[85vw] sm:w-[320px] md:w-[260px] shadow-2xl md:shadow-none' 
            : '-translate-x-full md:translate-x-0 md:w-[60px]'
        }`}
      >
        {/* Profile Dropdown moved seamlessly into the top of the Sidebar on Desktop */}
        <div className="hidden md:flex flex-col">
           {isSidebarOpen ? (
             <div className="p-4 border-b border-gray-200/60 dark:border-white/5">
                <ProfileDropdown email={userEmail ?? ""} />
             </div>
           ) : (
             <div className="h-[72px] flex items-center justify-center border-b border-gray-200/60 dark:border-white/5">
               <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                 {userEmail?.[0].toUpperCase()}
               </div>
             </div>
           )}
        </div>

        <div className={`h-full flex-1 overflow-hidden transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 md:hidden pointer-events-none'}`}>
          <Sidebar 
            userEmail={userEmail || null}
            handleSignOut={handleSignOut}
            isMobileMenuOpen={isSidebarOpen}
            setIsMobileMenuOpen={setIsSidebarOpen}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            activeSubFilter={activeSubFilter}
            setActiveSubFilter={setActiveSubFilter}
            getCounts={getCounts}
            folderHierarchy={folderHierarchy}
            expandedFolders={expandedFolders}
            toggleFolderExpand={toggleFolderExpand}
            customCategories={customCategories}
            handleDeleteCategory={handleDeleteCategory}
            handleDragOver={handleDragOver}
            handleDrop={handleDrop}
            creatingSubFor={creatingSubFor}
            setCreatingSubFor={setCreatingSubFor}
            newSubfolderName={newSubfolderName}
            setNewSubfolderName={setNewSubfolderName}
            handleAddSubfolder={handleAddSubfolder}
            isAddingCategory={isAddingCategory}
            setIsAddingCategory={setIsAddingCategory}
            newCategoryName={newCategoryName}
            setNewCategoryName={setNewCategoryName}
            handleAddCategory={handleAddCategory}
          />
        </div>

        {/* Desktop Collapse Flap */}
        <div 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
          className="hidden md:flex w-full h-[60px] items-center justify-center cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors border-t border-gray-200/60 dark:border-white/5 text-gray-400 dark:text-gray-500"
        >
          <ChevronRight className={`transition-transform duration-300 ${isSidebarOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────
          3. MAIN LAYOUT: GIANT SEARCH + MASONRY
          ──────────────────────────────────────────────────────────── */}
      <main 
        className={`flex-1 flex flex-col px-4 sm:px-8 md:px-12 transition-all duration-300 ease-in-out min-w-0 max-w-full pb-32 pt-[80px] md:pt-16 ${
          isSidebarOpen ? 'md:ml-[260px]' : 'md:ml-[60px]'
        }`}
      >
        {/* The "MyMind" style giant search header */}
        <div className="w-full max-w-6xl mx-auto mb-10 md:mb-16 mt-4 md:mt-8">
          <input
            type="text"
            placeholder="Search my mind..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none outline-none font-serif text-4xl sm:text-5xl md:text-6xl text-gray-800 dark:text-gray-200 placeholder-gray-400/60 dark:placeholder-gray-600/50 transition-colors"
          />
        </div>

        {/* The Programmatic Masonry Grid */}
        <div className="w-full max-w-7xl mx-auto flex gap-4 sm:gap-6 items-start" ref={gridRef}>
          {isLoading ? (
            Array.from({ length: columnsCount }).map((_, colIndex) => (
              <div key={colIndex} className="flex flex-col gap-4 sm:gap-6 w-full flex-1 min-w-0">
                {Array.from({ length: 3 }).map((_, i) => (
                  <BookmarkSkeleton key={i} />
                ))}
              </div>
            ))
          ) : (
            masonryColumns.map((colBookmarks, colIndex) => (
              <div key={colIndex} className="flex flex-col gap-4 sm:gap-6 w-full flex-1 min-w-0">
                {colBookmarks.map(bookmark => (
                  <BookmarkCard 
                    key={bookmark.id}
                    bookmark={bookmark}
                    theme={{ card: '', btn: '', hover: '' }} // Let the card handle its own sleek UI
                    isDragged={draggedId === bookmark.id}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    updateBookmark={updateBookmark}
                    deleteBookmark={deleteBookmark}
                    forceOpenModal={forcedInspectId === bookmark.id}
                    onCloseForcedModal={() => setForcedInspectId(null)}
                  />
                ))}
              </div>
            ))
          )}
        </div>
      </main>

      {/* ────────────────────────────────────────────────────────────
          4. FLOATING GLASS PILL INPUT BAR
          ──────────────────────────────────────────────────────────── */}
      <div 
        className={`fixed bottom-6 md:bottom-10 z-30 flex justify-center px-4 pointer-events-none transition-all duration-500 ease-in-out ${
          isInputVisible ? 'translate-y-0 opacity-100' : 'translate-y-[150%] opacity-0'
        } ${isSidebarOpen ? 'md:left-[260px]' : 'md:left-[60px]'} left-0 right-0`}
      >
        <div className="pointer-events-auto w-full max-w-2xl bg-white/90 dark:bg-[#1f2024]/90 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] flex items-center p-1.5 sm:p-2 gap-2 transition-transform hover:-translate-y-1">
          <button
            onClick={() => toast('Attachment uploads coming with the storage bucket!', { icon: '📎' })}
            className="p-2.5 sm:p-3 bg-gray-100/50 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white rounded-full cursor-pointer shrink-0 transition-colors"
            title="Attach"
          >
            <PaperclipIcon />
          </button>

          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleQuickCapture() }}
            disabled={isSaving}
            placeholder="Save link, note, or bulk URLs..."
            className="flex-1 bg-transparent border-none outline-none px-3 font-medium text-sm md:text-base text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-50 min-w-0"
          />

          <button
            onClick={handleQuickCapture}
            disabled={isSaving || !inputValue.trim()}
            className="p-2.5 sm:p-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full shadow-md active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center shrink-0 transition-all hover:opacity-90"
          >
            <SendIcon />
          </button>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────
          5. DUPLICATE INSPECTION DIALOG (Strict, No Override)
          ──────────────────────────────────────────────────────────── */}
      {duplicateMatch && (
        <div 
          className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
          onClick={() => setDuplicateMatch(null)}
        >
          <div 
            className="w-full max-w-md bg-white dark:bg-[#1a1b1e] border border-gray-200 dark:border-white/10 p-6 sm:p-8 rounded-3xl shadow-2xl flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-yellow-500 font-semibold text-xs uppercase tracking-widest">
              <span>⚠️ Already Saved</span>
            </div>
            
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white leading-snug">
              This item is already in your mind.
            </h3>

            <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 flex flex-col gap-1.5">
              <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {duplicateMatch.title}
              </span>
              <span className="text-xs text-gray-500 truncate">
                {duplicateMatch.url}
              </span>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              A second brain prevents clutter by rejecting duplicates. Would you like to review the existing note?
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <button
                onClick={() => {
                  setForcedInspectId(duplicateMatch.id)
                  setDuplicateMatch(null)
                  setInputValue('')
                }}
                className="flex-1 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium text-sm rounded-xl hover:opacity-90 transition-opacity cursor-pointer"
              >
                Open Note
              </button>
              <button
                onClick={() => setDuplicateMatch(null)}
                className="py-3 px-6 bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 font-medium text-sm rounded-xl cursor-pointer hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  )
}