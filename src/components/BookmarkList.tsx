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

const SendIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
const PaperclipIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
const SpinnerIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
const MenuIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
const SearchIcon = ({ className }: { className?: string }) => <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>

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

  useEffect(() => {
    try {
      const savedCats = localStorage.getItem('space_custom_cats')
      const savedSubs = localStorage.getItem('space_custom_subs')
      if (savedCats) setCustomCategories(JSON.parse(savedCats))
      if (savedSubs) setCustomSubCategories(JSON.parse(savedSubs))
    } catch (e) {} finally { setFoldersLoaded(true) }
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
      else if (width >= 640) setColumnsCount(2)
      else setColumnsCount(1) // Better mobile masonry
    }
    const observer = new ResizeObserver(updateColumns)
    if (gridRef.current) observer.observe(gridRef.current)
    updateColumns()
    const timer = setTimeout(() => setIsLoading(false), 300)
    if (window.innerWidth >= 1024) setIsSidebarOpen(true)
    return () => { observer.disconnect(); clearTimeout(timer) }
  }, [])

  const handleSignOut = async () => { await supabase.auth.signOut(); window.location.href = '/' }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const fileExt = file.name.split('.').pop()
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Unauthenticated")

      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage.from('attachments').upload(fileName, file)
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('attachments').getPublicUrl(fileName)

      let type = 'file'
      if (file.type.startsWith('image/')) type = 'image'
      else if (file.type.startsWith('video/')) type = 'video'
      else if (file.type === 'application/pdf') type = 'pdf'

      const { error: dbError } = await supabase.from('bookmarks').insert([{
        user_id: user.id, title: file.name, url: publicUrl, type: type, file_path: fileName, file_type: file.type
      }])

      if (dbError) throw dbError
      toast.success('Document archived successfully')
    } catch (err) {
      toast.error('Upload failed.')
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
          if (data.existing) setDuplicateMatch(data.existing)
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
    setCustomCategories(p => p.filter(c => c !== catToDelete)); 
    if (activeFilter === catToDelete) { setActiveFilter('All'); setActiveSubFilter(null) };
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
    <div className="bg-[#FAF9F5] dark:bg-[#0F120F] min-h-screen font-sans text-[#3A3F3A] dark:text-[#E2E8F0] flex overflow-x-hidden selection:bg-[#EBF8FF] selection:text-[#2B6CB0] transition-colors duration-300">
      
      {/* ─── SIDEBAR ─── */}
      <div className={`fixed lg:sticky top-0 left-0 h-screen z-40 bg-[#F4F1EB] dark:bg-[#151815] transition-transform duration-300 flex flex-col w-[80vw] sm:w-[280px] border-r border-[#E8E1D7] dark:border-[#292E29] ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <Sidebar userEmail={userEmail || null} handleSignOut={handleSignOut} isMobileMenuOpen={isSidebarOpen} setIsMobileMenuOpen={setIsSidebarOpen} activeFilter={activeFilter} setActiveFilter={setActiveFilter} activeSubFilter={activeSubFilter} setActiveSubFilter={setActiveSubFilter} getCounts={getCounts} folderHierarchy={folderHierarchy} expandedFolders={expandedFolders} toggleFolderExpand={toggleFolderExpand} customCategories={customCategories} handleDeleteCategory={handleDeleteCategory} handleDragOver={handleDragOver} handleDrop={handleDrop} creatingSubFor={creatingSubFor} setCreatingSubFor={setCreatingSubFor} newSubfolderName={newSubfolderName} setNewSubfolderName={setNewSubfolderName} handleAddSubfolder={handleAddSubfolder} isAddingCategory={isAddingCategory} setIsAddingCategory={setIsAddingCategory} newCategoryName={newCategoryName} setNewCategoryName={setNewCategoryName} handleAddCategory={handleAddCategory} />
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/20 dark:bg-black/60 backdrop-blur-sm z-30 lg:hidden" />
      )}
        
      {/* ─── MAIN CONTENT ─── */}
      <div className="flex-1 flex flex-col min-h-screen relative w-full lg:w-[calc(100%-280px)]">
        
        {/* HEADER AREA */}
        <header className="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-8 py-4 bg-[#FAF9F5]/90 dark:bg-[#0F120F]/90 backdrop-blur-md border-b border-[#E8E1D7] dark:border-[#292E29]">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-[#7A827A] dark:text-[#A0AEC0]">
              <MenuIcon />
            </button>
            <div className="font-serif text-xl sm:text-2xl text-[#1B221B] dark:text-white lg:hidden">
              inntoit
            </div>
          </div>
          
          <div className="flex items-center gap-4 flex-1 justify-end">
            <div className="relative w-full max-w-[200px] sm:max-w-xs hidden sm:block">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A6A0]" />
              <input
                type="text"
                placeholder="Search your mind..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-[#1A202C] border border-[#E8E1D7] dark:border-[#292E29] outline-none pl-9 pr-4 py-1.5 rounded-full text-sm text-[#3A3F3A] dark:text-[#E2E8F0] placeholder-[#A0A6A0] focus:border-[#4D6A51] transition-colors"
              />
            </div>
            
            <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-[#1B221B] dark:bg-[#2D3748] text-white">
               <span className="text-sm font-serif">{userEmail ? userEmail.charAt(0).toUpperCase() : 'A'}</span>
               <div className="absolute inset-0 opacity-0 cursor-pointer">
                  <ProfileDropdown email={userEmail ?? ""} />
               </div>
            </div>
          </div>
        </header>

        {/* MOBILE SEARCH BAR */}
        <div className="px-4 py-3 sm:hidden border-b border-[#E8E1D7] dark:border-[#292E29] bg-[#FAF9F5] dark:bg-[#0F120F]">
           <div className="relative w-full">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A6A0]" />
              <input
                type="text"
                placeholder="Search your mind..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-[#1A202C] border border-[#E8E1D7] dark:border-[#292E29] outline-none pl-9 pr-4 py-2 rounded-xl text-sm text-[#3A3F3A] dark:text-[#E2E8F0] placeholder-[#A0A6A0]"
              />
            </div>
        </div>

        {/* MASONRY GRID */}
        <main className="flex-1 p-4 sm:p-8 pb-32">
          <div className="w-full flex gap-4 sm:gap-6 items-start" ref={gridRef}>
            {isLoading ? (
              Array.from({ length: columnsCount }).map((_, colIndex) => (
                <div key={colIndex} className="flex flex-col gap-4 sm:gap-6 w-full flex-1 min-w-0">
                  {Array.from({ length: 3 }).map((_, i) => <BookmarkSkeleton key={i} />)}
                </div>
              ))
            ) : (
              masonryColumns.map((colBookmarks, colIndex) => (
                <div key={colIndex} className="flex flex-col gap-4 sm:gap-6 w-full flex-1 min-w-0">
                  {colBookmarks.map(bookmark => (
                    <BookmarkCard 
                      key={bookmark.id} 
                      bookmark={bookmark} 
                      theme={{ card: 'border-[#E8E1D7] bg-white dark:border-[#292E29] dark:bg-[#151815]', btn: '', hover: '' }} 
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

        {/* CAPTURE BAR (Input Drawer) */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[92%] sm:w-[500px]">
          <div className="w-full flex items-center gap-2 bg-white dark:bg-[#151815] rounded-2xl px-3 py-2 shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-2xl border border-[#E8E1D7] dark:border-[#292E29]">
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,video/*,application/pdf" />
            
            <button 
              onClick={() => fileInputRef.current?.click()} 
              disabled={isUploading}
              className="w-8 h-8 shrink-0 text-[#A0A6A0] hover:text-[#3A3F3A] dark:hover:text-white flex items-center justify-center transition-colors disabled:opacity-50"
            >
              {isUploading ? <SpinnerIcon /> : <PaperclipIcon />}
            </button>
            
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleQuickCapture() }}
              disabled={isSaving}
              placeholder="Paste a link or write a note..."
              className="flex-1 bg-transparent border-none outline-none px-2 text-sm text-[#3A3F3A] dark:text-[#E2E8F0] placeholder-[#A0A6A0]"
            />

            <button 
              onClick={handleQuickCapture} 
              disabled={isSaving || !inputValue.trim()} 
              className="w-8 h-8 shrink-0 text-[#A0A6A0] hover:text-[#4D6A51] dark:hover:text-[#8FAA91] flex items-center justify-center transition-colors disabled:opacity-30"
            >
              <SendIcon />
            </button>
          </div>
        </div>

      </div>

      {/* DUPLICATE MODAL */}
      {duplicateMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm" onClick={() => { setDuplicateMatch(null); setInputValue(''); }}>
          <div className="w-full max-w-sm bg-white dark:bg-[#151815] border border-[#E8E1D7] dark:border-[#292E29] p-6 rounded-2xl shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-serif text-[#1B221B] dark:text-white mb-2">Already Cataloged</h3>
            <p className="text-sm text-[#7A827A] mb-4">This source currently exists in your Space.</p>
            <div className="p-3 bg-[#FAF9F5] dark:bg-[#202520] rounded-xl mb-4 border border-[#E8E1D7] dark:border-[#292E29]">
               <p className="text-sm font-medium truncate">{duplicateMatch.title}</p>
            </div>
            <div className="flex gap-2">
               <button onClick={() => { setForcedInspectId(duplicateMatch.id); setDuplicateMatch(null); setInputValue(''); }} className="flex-1 py-2 bg-[#4D6A51] text-white text-sm rounded-xl">View</button>
               <button onClick={() => { setDuplicateMatch(null); setInputValue(''); }} className="flex-1 py-2 border border-[#E8E1D7] dark:border-[#292E29] text-sm rounded-xl">Dismiss</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}