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

const SendIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
const PaperclipIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
const SpinnerIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>

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
    
    // Default open on desktop, closed on mobile
    if (window.innerWidth >= 768) setIsSidebarOpen(true)
    
    return () => { observer.disconnect(); clearTimeout(timer) }
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // Close sidebar automatically when scrolling down
      if (currentScrollY > lastScrollY && currentScrollY > 60) {
        setIsSidebarOpen(false) 
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
        if (res.status === 409) {
          const match = bookmarks.find(b => normalizeUrl(b.url) === normalizeUrl(finalUrl))
          if (match) { setDuplicateMatch(match); setIsSaving(false); return }
          toast.error('Item exists.'); setIsSaving(false); return
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

  return (
    <div className="bg-[#FDFCF8] dark:bg-[#1A202C] min-h-screen font-sans text-[#2D3748] dark:text-[#E2E8F0] flex flex-col overflow-x-hidden selection:bg-[#EBF8FF] selection:text-[#2B6CB0] dark:selection:bg-[#2A4365] dark:selection:text-[#90CDF4] transition-colors duration-500">
      
      <header className="fixed top-0 left-0 w-full h-[72px] border-b border-[#E5E0D8] dark:border-[#4A5568] flex items-center px-4 md:px-8 bg-[#FDFCF8]/95 dark:bg-[#1A202C]/95 backdrop-blur-md z-50 transition-colors duration-500">
        <div className="w-1/3 flex items-center">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#2B6CB0] dark:text-[#90CDF4] hover:opacity-70 transition-opacity font-medium cursor-pointer">
            <span>{isSidebarOpen ? 'Close Index' : 'Index'}</span>
          </button>
        </div>
        <div className="w-1/3 flex justify-center">
          <h1 className="font-serif text-3xl font-medium tracking-wide text-[#2D3748] dark:text-[#E2E8F0]">Space</h1>
        </div>
        <div className="w-1/3 flex justify-end">
          <ProfileDropdown email={userEmail ?? ""} />
        </div>
      </header>

      {/* ─── EDITORIAL INPUT / SEARCH RIBBON WITH INTUITIVE MOBILE LAYOUT ─── */}
      <div className={`fixed top-[72px] right-0 z-40 flex flex-col sm:flex-row border-b border-[#E5E0D8] dark:border-[#4A5568] bg-white dark:bg-[#2D3748] transition-all duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] ${isSidebarOpen ? 'md:w-[calc(100%-320px)] left-0 md:left-[320px]' : 'w-full left-0'}`}>
        
        {/* Search Field */}
        <div className="flex-[1.2] flex items-center border-b sm:border-b-0 sm:border-r border-[#E5E0D8] dark:border-[#4A5568]">
          <input
            type="text"
            placeholder="Search publications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none outline-none px-4 sm:px-6 py-3.5 sm:py-4 font-serif text-base sm:text-lg text-[#2D3748] dark:text-[#E2E8F0] placeholder-[#A0AEC0] dark:placeholder-[#718096] transition-colors"
          />
        </div>

        {/* Input & Action Group (Unified for Mobile Intuition) */}
        <div className="flex-[1.5] flex items-stretch w-full">
          
          {/* Attachment Button */}
          <div className="flex shrink-0 items-center justify-center border-r border-[#E5E0D8] dark:border-[#4A5568] px-3 sm:px-5">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
              accept="image/*,video/*,application/pdf" 
            />
            <button 
              onClick={() => fileInputRef.current?.click()} 
              disabled={isUploading}
              title="Upload Image, Video, or PDF"
              className="text-[#718096] dark:text-[#A0AEC0] hover:text-[#2B6CB0] dark:hover:text-[#90CDF4] disabled:opacity-50 transition-colors cursor-pointer flex items-center justify-center h-full"
            >
              {isUploading ? <SpinnerIcon /> : <PaperclipIcon />}
            </button>
          </div>

          {/* Text Input & Send Button */}
          <div className="flex-1 flex items-stretch">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleQuickCapture() }}
              disabled={isSaving}
              placeholder="Add link or text snippet..."
              className="w-full h-full bg-transparent border-none outline-none px-4 sm:px-6 py-3.5 sm:py-4 font-serif text-base sm:text-lg text-[#2D3748] dark:text-[#E2E8F0] placeholder-[#A0AEC0] dark:placeholder-[#718096] transition-colors"
            />
            <button 
              onClick={handleQuickCapture} 
              disabled={isSaving || !inputValue.trim()} 
              className="px-4 sm:px-6 py-3.5 sm:py-4 text-[#2B6CB0] dark:text-[#90CDF4] hover:opacity-70 disabled:opacity-30 transition-opacity cursor-pointer flex items-center justify-center border-l border-[#E5E0D8] dark:border-[#4A5568]"
            >
              <SendIcon />
            </button>
          </div>
        </div>
      </div>

      <div className={`fixed left-0 top-[0px] bottom-0 z-40 bg-[#FDFCF8] dark:bg-[#1A202C] transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] flex flex-col ${isSidebarOpen ? 'translate-x-0 w-[85vw] sm:w-[320px]' : '-translate-x-full w-[320px]'}`}>
        <Sidebar userEmail={userEmail || null} handleSignOut={handleSignOut} isMobileMenuOpen={isSidebarOpen} setIsMobileMenuOpen={setIsSidebarOpen} activeFilter={activeFilter} setActiveFilter={setActiveFilter} activeSubFilter={activeSubFilter} setActiveSubFilter={setActiveSubFilter} getCounts={getCounts} folderHierarchy={folderHierarchy} expandedFolders={expandedFolders} toggleFolderExpand={toggleFolderExpand} customCategories={customCategories} handleDeleteCategory={handleDeleteCategory} handleDragOver={handleDragOver} handleDrop={handleDrop} creatingSubFor={creatingSubFor} setCreatingSubFor={setCreatingSubFor} newSubfolderName={newSubfolderName} setNewSubfolderName={setNewSubfolderName} handleAddSubfolder={handleAddSubfolder} isAddingCategory={isAddingCategory} setIsAddingCategory={setIsAddingCategory} newCategoryName={newCategoryName} setNewCategoryName={setNewCategoryName} handleAddCategory={handleAddCategory} />
      </div>

      {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/20 dark:bg-black/60 backdrop-blur-sm z-30 md:hidden transition-opacity" />}

      {/* Padding top updated to accurately accommodate 2-row ribbon on mobile */}
      <main className={`flex-1 flex flex-col transition-all duration-500 pb-32 pt-[175px] md:pt-[135px] ${isSidebarOpen ? 'md:ml-[320px]' : 'md:ml-0'}`}>
        <div className="w-full p-4 sm:p-8 md:p-10 flex gap-4 sm:gap-6 md:gap-8 items-start" ref={gridRef}>
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
    </div>
  )
}