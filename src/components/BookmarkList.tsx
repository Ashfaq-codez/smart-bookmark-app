'use client'

import { useState, useMemo, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useBookmarks } from '@/hooks/useBookmarks'
import { Bookmark } from '@/types'
import Sidebar from '@/components/Sidebar'
import BookmarkCard from '@/components/BookmarkCard'
import BookmarkSkeleton from '@/components/BookmarkSkeleton'
import { toast } from 'react-hot-toast'
import ProfileDropdown from './ProfileDropdown'

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
)

const PaperclipIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
)

const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
)

const MenuIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

// Simplified elegant themes replacing brutalist colors
const colorThemes = [
  { card: 'bg-[#f0f4f8] dark:bg-[#1a1b1e]', btn: 'bg-blue-500/10 text-blue-600 dark:text-blue-400', hover: 'hover:bg-blue-500/20' },
  { card: 'bg-[#f0fdf4] dark:bg-[#181f1b]', btn: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', hover: 'hover:bg-emerald-500/20' },
  { card: 'bg-[#fdf4ff] dark:bg-[#1f181f]', btn: 'bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400', hover: 'hover:bg-fuchsia-500/20' },
  { card: 'bg-[#fffbeb] dark:bg-[#1f1d17]', btn: 'bg-amber-500/10 text-amber-600 dark:text-amber-400', hover: 'hover:bg-amber-500/20' },
]

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

  // Masonry Column State
  const [columns, setColumns] = useState(1)

  const [customCategories, setCustomCategories] = useState<string[]>([])
  const [customSubCategories, setCustomSubCategories] = useState<Record<string, string[]>>({})
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({})
  const [creatingSubFor, setCreatingSubFor] = useState<string | null>(null)
  const [newSubfolderName, setNewSubfolderName] = useState('')

  // Handle Loading & Resize for Programmatic Masonry
  useEffect(() => {
    const updateColumns = () => {
      if (window.innerWidth >= 1280) setColumns(5)
      else if (window.innerWidth >= 1024) setColumns(4)
      else if (window.innerWidth >= 768) setColumns(3)
      else if (window.innerWidth >= 640) setColumns(2)
      else setColumns(2) // 2 columns on mobile as requested in prior references
    }
    
    updateColumns()
    window.addEventListener('resize', updateColumns)
    
    const timer = setTimeout(() => setIsLoading(false), 300)
    
    return () => {
      window.removeEventListener('resize', updateColumns)
      clearTimeout(timer)
    }
  }, [])

  // Scroll visibility for input bar
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

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const handleQuickCapture = async () => {
    const rawInput = inputValue.trim()
    if (!rawInput) return

    setIsSaving(true)
    const urlRegex = /^(https?:\/\/)?([\w.-]+)\.([a-z]{2,})(:\d{1,5})?(\/.*)?$/i
    const tokens = rawInput.split(/[\s,]+/).filter(Boolean)
    const isAllUrls = tokens.length > 0 && tokens.every(t => urlRegex.test(t))
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
          toast.success(`Skipped ${tokens.length - validNewTokens.length} duplicate URLs.`)
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
          : { url: window.location.origin + '/note-' + Date.now(), title: rawInput, description: '', type: 'note' }

        const res = await fetch('/api/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })

        if (res.status === 409) {
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
            className="flex-1 px-3 py-2 bg-red-500 text-white font-medium text-xs rounded-lg"
          >
            Delete
          </button>
          <button 
            onClick={() => toast.dismiss(t.id)} 
            className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-medium text-xs rounded-lg"
          >
            Cancel
          </button>
        </div>
      </div>
    ), { duration: Infinity, style: { background: 'transparent', boxShadow: 'none', padding: 0 } }) // Relies on internal modal styles
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

  // Pre-filter bookmarks before distributing to masonry columns
  const filteredBookmarks = useMemo(() => {
    return bookmarks.filter((bookmark) => {
      const matchCategory = activeFilter === 'All' || (bookmark.category || 'Uncategorized') === activeFilter
      const matchSubCategory = activeFilter === 'All' ? true : (activeSubFilter ? bookmark.sub_category === activeSubFilter : !bookmark.sub_category)

      const searchLower = searchQuery.toLowerCase()
      const matchSearch = searchQuery === '' || 
        bookmark.title.toLowerCase().includes(searchLower) ||
        bookmark.url.toLowerCase().includes(searchLower) ||
        (bookmark.description && bookmark.description.toLowerCase().includes(searchLower)) ||
        (bookmark.category && bookmark.category.toLowerCase().includes(searchLower)) ||
        (bookmark.sub_category && bookmark.sub_category.toLowerCase().includes(searchLower))

      return matchCategory && matchSubCategory && matchSearch
    })
  }, [bookmarks, activeFilter, activeSubFilter, searchQuery])

  return (
    <div className="bg-[#f4f4f5] dark:bg-[#0a0a0c] min-h-screen font-sans text-gray-900 dark:text-gray-100 flex flex-col pt-[56px] sm:pt-[64px] overflow-x-hidden selection:bg-blue-200 dark:selection:bg-blue-900/50">
      
      {/* ────────────────────────────────────────────────────────────
          1. ELEGANT GLASS HEADER
          ──────────────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 h-[56px] sm:h-[64px] z-30 bg-white/70 dark:bg-[#0a0a0c]/80 backdrop-blur-xl border-b border-gray-200/60 dark:border-white/5 flex items-stretch select-none">
        <div className="flex items-center px-2.5 sm:px-4 md:w-[280px] md:border-r border-gray-200/60 dark:border-white/5 shrink-0 gap-3">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className="md:hidden p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5 cursor-pointer transition-colors"
          >
            <MenuIcon />
          </button>
          
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5 sm:w-5 sm:h-5 fill-blue-500/90 stroke-none transition-colors">
            <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" strokeLinejoin="round"/>
          </svg>

          <span className="hidden sm:inline font-medium text-xs md:text-sm tracking-wide text-gray-800 dark:text-gray-200">
            Smart Bookmark
          </span>
        </div>

        <div className="flex-1 flex items-center px-2 sm:px-4 relative">
          <div className="text-gray-400 dark:text-gray-500 mr-2 shrink-0">
            <SearchIcon />
          </div>
          <input
            type="text"
            placeholder="Search your mind..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-full bg-transparent outline-none font-medium text-xs sm:text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600"
          />
        </div>

        <div className="hidden md:flex items-center justify-center w-[150px] md:w-[200px] shrink-0 border-l border-gray-200/60 dark:border-white/5">
          <ProfileDropdown email={userEmail ?? ""} />
        </div>
      </header>

      {/* ────────────────────────────────────────────────────────────
          2. MINIMALIST SIDEBAR
          ──────────────────────────────────────────────────────────── */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-sm transition-opacity"
        />
      )}

      <div 
        className={`fixed left-0 top-[56px] sm:top-[64px] bottom-0 z-40 bg-[#fafafa] dark:bg-[#0f0f11] border-r border-gray-200/60 dark:border-white/5 transition-all duration-300 ease-in-out flex ${
          isSidebarOpen 
            ? 'translate-x-0 w-[82vw] sm:w-[320px] md:w-[280px] shadow-2xl md:shadow-none' 
            : '-translate-x-full md:translate-x-0 md:w-[48px]'
        }`}
      >
        <div 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
          className="hidden md:flex order-last w-[48px] h-full flex-col items-center py-6 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0 select-none border-l border-gray-200/60 dark:border-white/5"
        >
          <ChevronRight className={`text-gray-400 dark:text-gray-500 transition-transform duration-300 ${isSidebarOpen ? 'rotate-180' : ''}`} />
          <span style={{ writingMode: 'vertical-rl' }} className="mt-8 text-[10px] font-semibold tracking-widest text-gray-400 dark:text-gray-500 uppercase">
            sidebar
          </span>
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
      </div>

      {/* ────────────────────────────────────────────────────────────
          3. HORIZONTAL PROGRAMMATIC MASONRY GRID 
          ──────────────────────────────────────────────────────────── */}
      <main 
        className={`flex-1 p-3 sm:p-6 transition-all duration-300 ease-in-out min-w-0 max-w-full pb-28 ${
          isSidebarOpen 
            ? 'md:ml-[280px] w-full md:w-[calc(100%-280px)]' 
            : 'md:ml-[48px] w-full md:w-[calc(100%-48px)]'
        }`}
      >
        <div className="flex gap-3 sm:gap-5 w-full items-start">
          {isLoading ? (
            Array.from({ length: columns }).map((_, colIndex) => (
              <div key={colIndex} className="flex flex-col gap-3 sm:gap-5 w-full flex-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <BookmarkSkeleton key={i} />
                ))}
              </div>
            ))
          ) : (
            // Programmatic Column Mapping for Left-To-Right Reading Order
            Array.from({ length: columns }).map((_, colIndex) => (
              <div key={colIndex} className="flex flex-col gap-3 sm:gap-5 w-full flex-1">
                {filteredBookmarks.filter((_, i) => i % columns === colIndex).map(bookmark => (
                  <BookmarkCard 
                    key={bookmark.id}
                    bookmark={bookmark}
                    theme={colorThemes[bookmark.id % colorThemes.length]}
                    isDragged={draggedId === bookmark.id}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    updateBookmark={updateBookmark}
                    deleteBookmark={deleteBookmark}
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
        className={`fixed bottom-4 md:bottom-8 z-30 flex justify-center px-4 pointer-events-none transition-all duration-500 ease-in-out ${
          isInputVisible ? 'translate-y-0 opacity-100' : 'translate-y-[150%] opacity-0'
        } ${isSidebarOpen ? 'md:left-[280px]' : 'md:left-[48px]'} left-0 right-0`}
      >
        <div className="pointer-events-auto w-full max-w-2xl bg-white/80 dark:bg-[#1a1a1c]/80 backdrop-blur-2xl border border-gray-200/50 dark:border-white/10 rounded-full shadow-2xl flex items-center p-1.5 sm:p-2 gap-2 transition-transform hover:-translate-y-1">
          <button
            onClick={() => toast('Attachment uploads coming with the storage bucket!', { icon: '📎' })}
            className="p-2 sm:p-2.5 bg-gray-100/50 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white rounded-full cursor-pointer shrink-0 transition-colors"
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
            className="flex-1 bg-transparent border-none outline-none px-2 font-medium text-sm md:text-base text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 disabled:opacity-50 min-w-0"
          />

          <button
            onClick={handleQuickCapture}
            disabled={isSaving || !inputValue.trim()}
            className="p-2 sm:p-2.5 bg-blue-500 dark:bg-blue-600 text-white rounded-full shadow-md active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center shrink-0 transition-all"
          >
            <SendIcon />
          </button>
        </div>
      </div>
      
    </div>
  )
}