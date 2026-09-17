'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useBookmarks } from '@/hooks/useBookmarks'
import { Bookmark } from '@/types'
import Sidebar from '@/components/Sidebar'
import BookmarkCard from '@/components/BookmarkCard'
import BookmarkSkeleton from '@/components/BookmarkSkeleton'
import { toast } from 'react-hot-toast'
import ProfileDropdown from './ProfileDropdown'

const SendIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
const PlusIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const SpinnerIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
const ClearIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>

function normalizeUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim()
  if (!trimmed) return ''
  try {
    const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
    const parsed = new URL(withProto)
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '')
    const path = parsed.pathname.replace(/\/+$/, '') || '/'
    let search = parsed.search

    if (host === 'youtube.com' && path === '/watch') {
      const videoId = parsed.searchParams.get('v')
      if (videoId) search = `?v=${videoId}`
    } else if (host === 'youtu.be') {
      const videoId = path.substring(1)
      if (videoId) return `${parsed.protocol}//youtube.com/watch?v=${videoId}`
    }

    return `${parsed.protocol}//${host}${path}${search}`
  } catch { return trimmed.toLowerCase().replace(/\/+$/, '') }
}

const getRandomVibrantColor = () => `hsl(${Math.floor(Math.random() * 360)}, 85%, 60%)`;

export default function BookmarkList({ initialBookmarks, userEmail }: { initialBookmarks: Bookmark[], userEmail?: string }) {
  const { bookmarks, updateBookmark, deleteBookmark } = useBookmarks(initialBookmarks)
  const [isLoading, setIsLoading] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isNavVisible, setIsNavVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const supabase = createClient()
  const [activeFilter, setActiveFilter] = useState('All')
  const [activeSubFilter, setActiveSubFilter] = useState<string | null>(null)
  const [draggedId, setDraggedId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [inputValue, setInputValue] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [columnsCount, setColumnsCount] = useState(2) 
  const gridRef = useRef<HTMLDivElement>(null)
  const [duplicateMatch, setDuplicateMatch] = useState<Bookmark | null>(null)
  const [forcedInspectId, setForcedInspectId] = useState<number | null>(null)

  const [customCategories, setCustomCategories] = useState<string[]>([])
  const [customSubCategories, setCustomSubCategories] = useState<Record<string, string[]>>({})
  const [foldersLoaded, setFoldersLoaded] = useState(false)
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({})
  const [creatingSubFor, setCreatingSubFor] = useState<string | null>(null)
  const [newSubfolderName, setNewSubfolderName] = useState('')

  // Typewriter State & Dynamic Colors
  const [titleText, setTitleText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [titleColor, setTitleColor] = useState('#2B6CB0')
  const [orbitalColor, setOrbitalColor] = useState('#90CDF4')
  const fullTitle = "Space"

  useEffect(() => {
    setOrbitalColor(getRandomVibrantColor());
  }, [])

  // Typewriter Effect Logic (with color randomization per cycle)
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (isDeleting) {
      timer = setTimeout(() => {
        setTitleText(prev => prev.slice(0, -1))
        if (titleText === '') {
          setIsDeleting(false)
          setTitleColor(getRandomVibrantColor()) // New color when typing starts again
        }
      }, 100)
    } else {
      timer = setTimeout(() => {
        setTitleText(fullTitle.slice(0, titleText.length + 1))
        if (titleText === fullTitle) setTimeout(() => setIsDeleting(true), 4000)
      }, 200)
    }
    return () => clearTimeout(timer)
  }, [titleText, isDeleting])

  useEffect(() => {
    try {
      const savedCats = localStorage.getItem('space_custom_cats')
      const savedSubs = localStorage.getItem('space_custom_subs')
      if (savedCats) setCustomCategories(JSON.parse(savedCats))
      if (savedSubs) setCustomSubCategories(JSON.parse(savedSubs))
    } catch (e) {
      console.error('Failed to parse folders from local storage', e)
    } finally {
      setFoldersLoaded(true)
    }
  }, [])

  useEffect(() => {
    if (foldersLoaded) {
      localStorage.setItem('space_custom_cats', JSON.stringify(customCategories))
      localStorage.setItem('space_custom_subs', JSON.stringify(customSubCategories))
    }
  }, [customCategories, customSubCategories, foldersLoaded])

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
    
    if (window.innerWidth >= 768) setIsSidebarOpen(true)
    
    return () => { observer.disconnect(); clearTimeout(timer) }
  }, [])

  // Smart Hide-on-Scroll Logic
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setIsSidebarOpen(false) 
        setIsNavVisible(false)
      } else {
        setIsNavVisible(true)
      }
      setLastScrollY(currentScrollY)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  const handleSignOut = async () => { await supabase.auth.signOut(); window.location.href = '/' }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    
    try {
      const { error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(fileName, file)
        
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('attachments')
        .getPublicUrl(fileName)

      let type = 'file'
      if (file.type.startsWith('image/')) type = 'image'
      else if (file.type.startsWith('video/')) type = 'video'
      else if (file.type === 'application/pdf') type = 'pdf'

      const { error: dbError } = await supabase.from('bookmarks').insert([{
        title: file.name,
        url: publicUrl,
        type: type,
        file_path: fileName,
        file_type: file.type
      }])

      if (dbError) throw dbError
      toast.success('Document archived successfully', { style: { background: '#FDFCF8', color: '#2B6CB0', border: '1px solid #E5E0D8' } })
    } catch (err) {
      toast.error('Upload failed. Check storage permissions.')
      console.error(err)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

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
        if (validNewTokens.length === 0) { toast.error('Already cataloged.'); setIsSaving(false); return }
        await Promise.all(validNewTokens.map(token => fetch('/api/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: /^https?:\/\//i.test(token) ? token : 'https://' + token }) })))
        toast.success(`Cataloged ${validNewTokens.length} items`)
      } else {
        const isSingleUrl = tokens.length === 1 && urlRegex.test(rawInput)
        let finalUrl = rawInput
        if (isSingleUrl) finalUrl = /^https?:\/\//i.test(finalUrl) ? finalUrl : 'https://' + finalUrl
        const payload = isSingleUrl ? { url: finalUrl } : { url: window.location.origin + '/note-' + Date.now(), content: rawInput, type: 'note' }
        
        const res = await fetch('/api/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        const data = await res.json().catch(() => ({}))

        if (res.status === 409) {
          if (data.existing) {
            setDuplicateMatch(data.existing)
          } else {
            const match = bookmarks.find(b => normalizeUrl(b.url) === normalizeUrl(finalUrl))
            if (match) setDuplicateMatch(match)
            else toast.error('Item exists.')
          }
          setIsSaving(false)
          return
        }
        if (!res.ok) throw new Error('Failed')
      }
      setInputValue('')
    } catch { toast.error('Error.') } finally { setIsSaving(false) }
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
      <div className="flex flex-col gap-4 font-sans p-4 bg-white dark:bg-[#1A202C] border border-[#E5E0D8] dark:border-[#4A5568] shadow-lg">
        <span className="font-serif text-xl text-[#2D3748] dark:text-[#E2E8F0]">Delete {catToDelete}?</span>
        <div className="flex gap-2 mt-2">
          <button onClick={() => { setCustomCategories(p => p.filter(c => c !== catToDelete)); if (activeFilter === catToDelete) { setActiveFilter('All'); setActiveSubFilter(null) }; toast.dismiss(t.id) }} className="flex-1 px-4 py-2 bg-[#C53030] text-white font-medium text-xs rounded-sm">Delete</button>
          <button onClick={() => toast.dismiss(t.id)} className="flex-1 px-4 py-2 border border-[#CBD5E0] dark:border-[#4A5568] text-[#4A5568] dark:text-[#A0AEC0] font-medium text-xs rounded-sm">Cancel</button>
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

  // Generate data for the Single-Text Orbital Badge
  const userNameDisplay = userEmail ? userEmail.split('@')[0] : 'GUEST'
  const firstLetter = userNameDisplay.charAt(0).toUpperCase()
  const orbitalText = userNameDisplay

  const isInputVisible = !isSidebarOpen && isNavVisible;

  return (
    <div className="bg-[#FDFCF8] dark:bg-[#1A202C] min-h-screen font-sans text-[#2D3748] dark:text-[#E2E8F0] flex flex-col overflow-x-hidden selection:bg-[#EBF8FF] selection:text-[#2B6CB0] dark:selection:bg-[#2A4365] dark:selection:text-[#90CDF4] transition-colors duration-[900ms]">
      
      {/* CSS HACKS: Scrollbars, Blinking Cursor, and Phantom Dropdown Trigger */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes custom-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        .animate-custom-blink { animation: custom-blink 1s step-end infinite; }
        
        /* Force ProfileDropdown's default button to be absolutely invisible but fully clickable */
        .profile-hide-trigger button[aria-haspopup="menu"],
        .profile-hide-trigger > button,
        .profile-hide-trigger > div > button {
           opacity: 0 !important;
           color: transparent !important;
           background: transparent !important;
           position: absolute !important;
           inset: 0 !important;
           width: 100% !important;
           height: 100% !important;
           cursor: pointer !important;
           z-index: 50 !important;
        }
      `}} />

      {/* ─── FIXED HEADER ─── */}
      <header className="fixed top-0 left-0 w-full h-[72px] border-b border-[#E5E0D8] dark:border-[#4A5568] flex items-center justify-between px-2 md:px-8 bg-[#FDFCF8]/95 dark:bg-[#1A202C]/95 backdrop-blur-md z-50 transition-colors duration-[900ms]">
        
        {/* LEFT: Seamless Button-ified Index */}
        <div className="flex-[1] flex items-center justify-start z-20">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className="px-5 py-2.5 bg-transparent border-none outline-none flex items-center gap-2 text-[10px] md:text-xs uppercase tracking-widest text-[#2B6CB0] dark:text-[#90CDF4] transition-opacity hover:opacity-70 font-bold cursor-pointer"
          >
            <span>{isSidebarOpen ? 'Close' : 'Index'}</span>
          </button>
        </div>

        {/* CENTER: Typewriter Title (Random Colors) */}
        <div className="absolute left-1/2 -translate-x-1/2 z-10 flex justify-center pointer-events-none w-[150px] text-center">
          <h1 
            className="font-serif text-2xl sm:text-3xl font-medium tracking-wide pointer-events-auto flex items-center justify-center transition-colors duration-1000"
            style={{ color: titleColor }}
          >
            {titleText}
            {/* Blinking cursor matching the random title color */}
            <span className="inline-block w-[3px] h-[24px] sm:h-[28px] bg-current ml-[2px] animate-custom-blink" />
          </h1>
        </div>

        {/* RIGHT: Orbital Username Badge */}
        <div className="flex-[1] flex justify-end items-center z-20 pr-2 sm:pr-4">
          <div className="relative flex items-center justify-center w-[54px] h-[54px] group">
            
            {/* Spinning SVG Text Ring (Single Name, Colored Randomly on Load) */}
            <svg className="absolute inset-0 w-full h-full animate-[spin_10s_linear_infinite] transition-colors duration-700 pointer-events-none" style={{ color: orbitalColor }} viewBox="0 0 100 100">
              <path id="textPath" d="M 50, 50 m -34, 0 a 34,34 0 1,1 68,0 a 34,34 0 1,1 -68,0" fill="none" />
              <text fontSize="14" fill="currentColor" fontWeight="bold" letterSpacing="1.5" className="uppercase font-sans">
                <textPath href="#textPath" startOffset="50%" textAnchor="middle">
                  {orbitalText}
                </textPath>
              </text>
            </svg>
            
            {/* Center Profile Anchor - First Letter */}
            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
              <span className="text-xl font-serif font-bold text-[#2D3748] dark:text-[#E2E8F0] group-hover:scale-110 transition-transform">
                {firstLetter}
              </span>
            </div>

            {/* Profile Dropdown logic wrapper. Re-mounts to force-close if sidebar opens. */}
            <div 
              className="profile-hide-trigger absolute inset-0 w-full h-full z-20 cursor-pointer"
              onClick={() => setIsSidebarOpen(false)}
            >
               <ProfileDropdown key={isSidebarOpen ? 'closed' : 'open'} email={userEmail ?? ""} />
            </div>
          </div>
        </div>
      </header>

      {/* ─── SIDEBAR ─── */}
      <div className={`fixed left-0 top-[0px] bottom-0 z-40 bg-[#FDFCF8] dark:bg-[#1A202C] transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] flex flex-col w-[85vw] sm:w-[320px] ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar userEmail={userEmail || null} handleSignOut={handleSignOut} isMobileMenuOpen={isSidebarOpen} setIsMobileMenuOpen={setIsSidebarOpen} activeFilter={activeFilter} setActiveFilter={setActiveFilter} activeSubFilter={activeSubFilter} setActiveSubFilter={setActiveSubFilter} getCounts={getCounts} folderHierarchy={folderHierarchy} expandedFolders={expandedFolders} toggleFolderExpand={toggleFolderExpand} customCategories={customCategories} handleDeleteCategory={handleDeleteCategory} handleDragOver={handleDragOver} handleDrop={handleDrop} creatingSubFor={creatingSubFor} setCreatingSubFor={setCreatingSubFor} newSubfolderName={newSubfolderName} setNewSubfolderName={setNewSubfolderName} handleAddSubfolder={handleAddSubfolder} isAddingCategory={isAddingCategory} setIsAddingCategory={setIsAddingCategory} newCategoryName={newCategoryName} setNewCategoryName={setNewCategoryName} handleAddCategory={handleAddCategory} />
      </div>

      <div onClick={() => setIsSidebarOpen(false)} className={`fixed inset-0 bg-black/20 dark:bg-black/60 backdrop-blur-sm z-30 md:hidden transition-opacity duration-[900ms] ${isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} />
        
      {/* ─── MAIN GRID AREA ─── */}
      <main className={`flex-1 flex flex-col transition-all duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] pb-32 pt-[90px] md:pt-[100px] ${isSidebarOpen ? 'md:ml-[320px]' : 'md:ml-0'}`}>
        
        {/* ─── FLOATING SEARCH PILL WITH CLEAR BUTTON ─── */}
        <div className="w-full px-4 sm:px-8 md:px-10 flex justify-center mb-6 z-20 relative">
          <div className="w-full max-w-2xl relative flex items-center justify-center">
            <input
              type="text"
              placeholder="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-[#1A202C] border border-gray-100 dark:border-transparent outline-none px-6 py-3.5 sm:py-4 rounded-xl font-serif text-[16px] sm:text-xl text-[#2D3748] dark:text-[#E2E8F0] shadow-[0_4px_20px_rgba(0,0,0,0.06)] dark:shadow-none placeholder-[#A0AEC0] dark:placeholder-[#4A5568] transition-colors duration-500 text-center focus:shadow-[0_8px_30px_rgba(0,0,0,0.1)] focus:dark:shadow-none pr-14"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-4 sm:right-6 z-10 text-[#A0AEC0] hover:text-[#4A5568] dark:hover:text-white transition-colors cursor-pointer"
                title="Clear Search"
              >
                <ClearIcon />
              </button>
            )}
          </div>
        </div>

        {/* ─── MASONRY GRID ─── */}
        <div className="w-full px-4 sm:px-8 md:px-10 flex gap-4 sm:gap-6 md:gap-8 items-start" ref={gridRef}>
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
                    key={bookmark.id} 
                    bookmark={bookmark} 
                    theme={{ card: '', btn: '', hover: '' }} 
                    isDragged={draggedId === bookmark.id} 
                    onDragStart={handleDragStart} 
                    onDragEnd={handleDragEnd} 
                    updateBookmark={updateBookmark} 
                    deleteBookmark={deleteBookmark} 
                    forceOpenModal={forcedInspectId === bookmark.id} 
                    onCloseForcedModal={() => setForcedInspectId(null)}
                    folderHierarchy={folderHierarchy}
                  />
                ))}
              </div>
            ))
          )}
        </div>
      </main>

      {/* ─── HALF CARD DRAWER (INPUT SECTION) ─── */}
      <div className={`fixed bottom-0 z-40 transition-all duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] flex justify-center w-full md:w-[700px] left-1/2 -translate-x-1/2 ${isInputVisible ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-[150%] opacity-0 pointer-events-none'}`}>
        <div className="w-full flex items-center gap-3 bg-white dark:bg-[#1A202C] rounded-t-[32px] px-4 py-4 md:px-6 md:py-5 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-x border-gray-200 dark:border-white/10 pointer-events-auto transition-colors duration-500 pb-8 md:pb-6">
          
          {/* Upload Button */}
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,video/*,application/pdf" />
          <button 
            onClick={() => fileInputRef.current?.click()} 
            disabled={isUploading}
            className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 bg-[#FDFCF8] dark:bg-[#2D3748] text-[#4A5568] dark:text-[#A0AEC0] rounded-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-black transition-colors disabled:opacity-50 cursor-pointer border border-[#E5E0D8] dark:border-[#4A5568]"
          >
            {isUploading ? <SpinnerIcon /> : <PlusIcon />}
          </button>
          
          {/* Input Area (text-[16px] specifically prevents iOS Mobile Zoom) */}
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleQuickCapture() }}
            disabled={isSaving}
            placeholder="input text links image video pdfs docs"
            className="flex-1 bg-transparent border-none outline-none px-2 font-serif text-[16px] sm:text-xl text-[#2D3748] dark:text-[#E2E8F0] placeholder-[#A0AEC0] dark:placeholder-[#4A5568] text-center"
          />

          {/* Send Button */}
          <button 
            onClick={handleQuickCapture} 
            disabled={isSaving || !inputValue.trim()} 
            className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 text-[#2B6CB0] dark:text-[#90CDF4] flex items-center justify-center hover:scale-110 disabled:opacity-30 transition-transform cursor-pointer"
          >
            <SendIcon />
          </button>
        </div>
      </div>

      {/* ─── EDITORIAL COLLISION MODAL ─── */}
      {duplicateMatch && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-[#FDFCF8]/90 dark:bg-[#1A202C]/90 backdrop-blur-sm transition-colors duration-500" onClick={() => { setDuplicateMatch(null); setInputValue(''); }}>
          <div className="w-full max-w-sm bg-white dark:bg-[#2D3748] border border-[#E5E0D8] dark:border-[#4A5568] flex flex-col shadow-xl transition-colors duration-500 rounded-sm" onClick={(e) => e.stopPropagation()}>
            <div className="p-8 md:p-10 flex flex-col gap-6 text-center">
              
              <div className="flex flex-col gap-3 items-center">
                <span className="text-[10px] font-sans text-[#C53030] dark:text-[#FC8181] uppercase tracking-widest font-bold">Conflict</span>
                <h3 className="text-3xl font-serif text-[#2D3748] dark:text-[#E2E8F0] leading-none">
                  Already Cataloged
                </h3>
              </div>
              
              <p className="text-xs font-sans text-[#718096] dark:text-[#A0AEC0]">
                This source currently exists in your Space.
              </p>
              
              <div className="flex flex-col gap-1 p-4 border border-[#E5E0D8] dark:border-[#4A5568] bg-[#FDFCF8] dark:bg-[#1A202C] text-left rounded-sm">
                <span className="text-sm font-serif font-medium text-[#2D3748] dark:text-[#E2E8F0] truncate">{duplicateMatch.title}</span>
                <span className="text-[9px] font-sans uppercase tracking-widest text-[#2B6CB0] dark:text-[#90CDF4] truncate mt-1">
                  {duplicateMatch.url.replace(/^https?:\/\/(www\.)?/, '')}
                </span>
              </div>
              
              <div className="flex flex-col gap-2 mt-2">
                <button onClick={() => { setForcedInspectId(duplicateMatch.id); setDuplicateMatch(null); setInputValue(''); }} className="w-full py-3 bg-[#2D3748] dark:bg-[#E2E8F0] text-white dark:text-[#1A202C] font-sans font-medium text-xs tracking-widest uppercase hover:opacity-80 transition-opacity rounded-sm cursor-pointer">
                  View Entry
                </button>
                <button onClick={() => { setDuplicateMatch(null); setInputValue(''); }} className="w-full py-3 bg-transparent text-[#4A5568] dark:text-[#A0AEC0] border border-[#CBD5E0] dark:border-[#4A5568] font-sans font-medium text-xs tracking-widest uppercase hover:bg-[#FDFCF8] dark:hover:bg-[#171923] transition-colors rounded-sm cursor-pointer">
                  Dismiss
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  )
}