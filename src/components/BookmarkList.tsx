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
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
)

const PaperclipIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
  </svg>
)

const ChevronRight = ({ className = '' }: { className?: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={className}>
    <path d="M9 18l6-6-6-6" />
  </svg>
)

const colorThemes = [
  { card: 'bg-sky-100', btn: 'bg-sky-300', hover: 'hover:bg-sky-400' },
  { card: 'bg-teal-100', btn: 'bg-teal-300', hover: 'hover:bg-teal-400' },
  { card: 'bg-rose-100', btn: 'bg-rose-300', hover: 'hover:bg-rose-400' },
  { card: 'bg-amber-100', btn: 'bg-amber-300', hover: 'hover:bg-amber-400' },
  { card: 'bg-indigo-100', btn: 'bg-indigo-300', hover: 'hover:bg-indigo-400' },
  { card: 'bg-emerald-100', btn: 'bg-emerald-300', hover: 'hover:bg-emerald-400' },
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
    const timer = setTimeout(() => setIsLoading(false), 300)
    return () => clearTimeout(timer)
  }, [])

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
          : { url: window.location.origin + '/note-' + Date.now(), description: rawInput, type: 'note' }

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
        <span className="text-base font-black text-gray-900 uppercase">Delete "{catToDelete}"?</span>
        <span className="text-xs font-bold text-gray-600">Saved items will remain in Uncategorized.</span>
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
            className="flex-1 px-3 py-1.5 bg-red-400 text-gray-900 font-black uppercase text-xs border-2 border-gray-900 rounded-lg"
          >
            Delete
          </button>
          <button 
            onClick={() => toast.dismiss(t.id)} 
            className="flex-1 px-3 py-1.5 bg-gray-100 text-gray-900 font-black uppercase text-xs border-2 border-gray-900 rounded-lg"
          >
            Cancel
          </button>
        </div>
      </div>
    ), { duration: Infinity, style: { background: '#fef08a', border: '3px solid #111827', borderRadius: '1rem', padding: '1.25rem' } })
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
    <div className="bg-[#f8f9fa] dark:bg-[#0f1115] min-h-screen font-sans text-gray-900 dark:text-gray-100 flex flex-col pt-[56px] sm:pt-[64px] overflow-x-hidden">
      
      {/* ────────────────────────────────────────────────────────────
          1. FIXED TOP HEADER (Restored Logo & Mobile Fixes)
          ──────────────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 h-[56px] sm:h-[64px] z-30 bg-white dark:bg-gray-900 border-b-2 sm:border-b-3 border-gray-900 dark:border-gray-700 flex items-stretch select-none">
        
        <div className="flex items-center px-2.5 sm:px-4 md:w-[280px] md:border-r-3 border-gray-900 dark:border-gray-700 shrink-0 gap-2.5">
          {/* Hamburger (Only visible on mobile) */}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className="md:hidden p-1.5 border-2 border-gray-900 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
            title="Toggle Menu"
          >
            <MenuIcon />
          </button>
          
          {/* Restored Logo */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6 fill-yellow-400 stroke-gray-900 dark:stroke-white stroke-[2.5px] transition-colors">
            <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" strokeLinejoin="round"/>
          </svg>

          <span className="hidden sm:inline font-mono font-black text-xs md:text-sm uppercase tracking-wider text-gray-900 dark:text-white">
            smart bookmark
          </span>
        </div>

        <div className="flex-1 flex items-center px-2 sm:px-4 border-l-2 md:border-l-0 border-r-2 sm:border-r-3 border-gray-900 dark:border-gray-700 relative bg-white dark:bg-gray-900">
          <div className="text-gray-900 dark:text-gray-400 mr-1.5 shrink-0">
            <SearchIcon />
          </div>
          <input
            type="text"
            placeholder="Search your mind..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-full bg-transparent outline-none font-bold text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400"
          />
        </div>

        {/* Profile (Only visible on Desktop) */}
        <div className="hidden md:flex items-center justify-center w-[150px] md:w-[200px] shrink-0 bg-white dark:bg-gray-900 font-mono text-xs">
          <ProfileDropdown email={userEmail ?? ""} />
        </div>
      </header>

      {/* ────────────────────────────────────────────────────────────
          2. SIDEBAR (Mobile Slide-Over & Desktop Push)
          ──────────────────────────────────────────────────────────── */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      <div 
        className={`fixed left-0 top-[56px] sm:top-[64px] bottom-0 z-40 bg-white dark:bg-gray-900 border-r-3 border-gray-900 dark:border-gray-700 transition-all duration-300 ease-in-out flex ${
          isSidebarOpen 
            ? 'translate-x-0 w-[82vw] sm:w-[320px] md:w-[280px]' 
            : '-translate-x-full md:translate-x-0 md:w-[48px]'
        }`}
      >
        <div 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
          className="hidden md:flex order-last w-[48px] h-full flex-col items-center py-5 cursor-pointer bg-gray-50 dark:bg-gray-800 border-l-3 border-gray-900 dark:border-gray-700 hover:bg-yellow-200 dark:hover:bg-gray-700 transition-colors shrink-0 select-none"
        >
          <ChevronRight className={`text-gray-900 dark:text-white transition-transform duration-300 ${isSidebarOpen ? 'rotate-180' : ''}`} />
          <span style={{ writingMode: 'vertical-rl' }} className="mt-6 font-mono text-[10px] font-black uppercase tracking-widest text-gray-800 dark:text-gray-300">
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
          3. MAIN MASONRY FEED (2 Columns on mobile, expands on desktop)
          ──────────────────────────────────────────────────────────── */}
      <main 
        className={`flex-1 p-2.5 sm:p-4 md:p-6 transition-all duration-300 ease-in-out min-w-0 max-w-full pb-24 ${
          isSidebarOpen 
            ? 'md:ml-[280px] w-full md:w-[calc(100%-280px)]' 
            : 'md:ml-[48px] w-full md:w-[calc(100%-48px)]'
        }`}
      >
        <div className="columns-2 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-2.5 sm:gap-4 w-full">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="break-inside-avoid mb-3 inline-block w-full">
                <BookmarkSkeleton />
              </div>
            ))
          ) : (
            bookmarks.map((bookmark) => {
              const matchCategory = activeFilter === 'All' || (bookmark.category || 'Uncategorized') === activeFilter
              const matchSubCategory = activeFilter === 'All' ? true : (activeSubFilter ? bookmark.sub_category === activeSubFilter : !bookmark.sub_category)

              const searchLower = searchQuery.toLowerCase()
              const matchSearch = searchQuery === '' || 
                bookmark.title.toLowerCase().includes(searchLower) ||
                bookmark.url.toLowerCase().includes(searchLower) ||
                (bookmark.description && bookmark.description.toLowerCase().includes(searchLower)) ||
                (bookmark.category && bookmark.category.toLowerCase().includes(searchLower)) ||
                (bookmark.sub_category && bookmark.sub_category.toLowerCase().includes(searchLower))

              if (!(matchCategory && matchSubCategory && matchSearch)) return null

              const theme = colorThemes[bookmark.id % colorThemes.length]

              return (
                <BookmarkCard 
                  key={bookmark.id}
                  bookmark={bookmark}
                  theme={theme}
                  isDragged={draggedId === bookmark.id}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  updateBookmark={updateBookmark}
                  deleteBookmark={deleteBookmark}
                  forceOpenModal={forcedInspectId === bookmark.id}
                  onCloseForcedModal={() => setForcedInspectId(null)}
                />
              )
            })
          )}
        </div>
      </main>

      {/* ────────────────────────────────────────────────────────────
          4. FLOATING QUICK CAPTURE INPUT BAR
          ──────────────────────────────────────────────────────────── */}
      <div 
        className={`fixed bottom-3 sm:bottom-5 z-30 flex justify-center px-2.5 sm:px-4 pointer-events-none transition-all duration-300 ease-in-out ${
          isInputVisible ? 'translate-y-0' : 'translate-y-[150%]'
        } ${isSidebarOpen ? 'md:left-[280px]' : 'md:left-[48px]'} left-0 right-0`}
      >
        <div className="pointer-events-auto w-full max-w-xl bg-white dark:bg-gray-900 border-2 sm:border-3 border-gray-900 dark:border-gray-600 rounded-2xl shadow-[3px_3px_0px_0px_rgba(17,24,39,1)] flex items-center p-1 sm:p-1.5 gap-1.5 transition-transform">
          <button
            onClick={() => toast('Attachment uploads coming with the storage bucket!', { icon: '📎' })}
            className="p-1.5 sm:p-2 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border border-gray-900 dark:border-gray-700 rounded-xl cursor-pointer shrink-0"
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
            className="flex-1 bg-transparent border-none outline-none px-2 font-mono font-bold text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 disabled:opacity-50 min-w-0"
          />

          <button
            onClick={handleQuickCapture}
            disabled={isSaving || !inputValue.trim()}
            className="p-1.5 sm:p-2 bg-yellow-400 text-gray-900 border-2 border-gray-900 rounded-xl shadow-[1.5px_1.5px_0px_0px_rgba(17,24,39,1)] active:translate-y-0.5 disabled:opacity-50 cursor-pointer flex items-center justify-center shrink-0"
          >
            <SendIcon />
          </button>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────
          5. DUPLICATE INSPECTION DIALOG (Fair Warning to User)
          ──────────────────────────────────────────────────────────── */}
      {duplicateMatch && (
        <div 
          className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
          onClick={() => setDuplicateMatch(null)}
        >
          <div 
            className="w-full max-w-md bg-white dark:bg-gray-900 border-4 border-gray-900 dark:border-yellow-400 p-5 sm:p-6 rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-yellow-500 font-mono text-xs font-black uppercase tracking-widest">
              <span>⚠️ Already Saved</span>
            </div>
            
            <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white leading-snug">
              This link is already in your hub!
            </h3>

            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl border-2 border-gray-900 dark:border-gray-700 flex flex-col gap-1">
              <span className="text-xs font-bold text-gray-900 dark:text-white truncate">
                {duplicateMatch.title}
              </span>
              <span className="text-[11px] font-mono text-gray-500 truncate">
                {duplicateMatch.url}
              </span>
              <span className="text-[10px] font-bold text-yellow-600 dark:text-yellow-400 uppercase tracking-wider mt-1">
                Folder: {duplicateMatch.category || 'Inbox'}
              </span>
            </div>

            <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
              Did you mean to review or edit this existing bookmark instead of saving it again?
            </p>

            <div className="flex flex-col sm:flex-row gap-2 mt-2">
              <button
                onClick={() => {
                  setForcedInspectId(duplicateMatch.id)
                  setDuplicateMatch(null)
                  setInputValue('')
                }}
                className="flex-1 py-2.5 bg-yellow-400 text-gray-900 font-black uppercase text-xs border-2 border-gray-900 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-px transition-all cursor-pointer"
              >
                Open Existing
              </button>
              <button
                onClick={() => setDuplicateMatch(null)}
                className="py-2.5 px-4 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold uppercase text-xs border-2 border-gray-900 dark:border-gray-600 rounded-xl cursor-pointer"
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