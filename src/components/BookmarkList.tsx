'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useBookmarks } from '@/hooks/useBookmarks'
import { Bookmark } from '@/types'
import Sidebar from '@/components/Sidebar'
import BookmarkCard from '@/components/BookmarkCard'
import BookmarkSkeleton from '@/components/BookmarkSkeleton'
import TipTapEditor from '@/components/TipTapEditor'
import { toast } from 'react-hot-toast'

const SendIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
const PaperclipIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
const SpinnerIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
const MenuIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
const SearchIcon = ({ className }: { className?: string }) => <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
const ClearIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>

const SortDescIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5h10"></path><path d="M11 9h7"></path><path d="M11 13h4"></path><path d="M4 14v7"></path><path d="M7 18l-3 3-3-3"></path></svg>
const SortAscIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 19h10"></path><path d="M11 15h7"></path><path d="M11 11h4"></path><path d="M4 10V3"></path><path d="M7 6l-3-3-3 3"></path></svg>
const CalendarIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>

const mediaTypeLabels: Record<string, string> = {
  'link': 'Links',
  'note': 'Notes',
  'image': 'Images',
  'videos': 'Videos',
  'documents': 'Documents',
  'socials': 'Socials'
};

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

function formatDateHeader(dateString?: string): string {
  if (!dateString) return 'Unknown Date';
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export default function BookmarkList({ initialBookmarks, userEmail }: { initialBookmarks: Bookmark[], userEmail?: string }) {
  const { bookmarks, updateBookmark, deleteBookmark } = useBookmarks(initialBookmarks)
  const [isLoading, setIsLoading] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const supabase = createClient()

  const [activeFilter, setActiveFilter] = useState('All')
  const [activeSubFilter, setActiveSubFilter] = useState<string | null>(null)
  const [activeMediaType, setActiveMediaType] = useState<string | null>(null)

  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')
  const [isGroupedByDate, setIsGroupedByDate] = useState(false)

  const [draggedId, setDraggedId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [inputValue, setInputValue] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  
  const [isInputFocused, setIsInputFocused] = useState(false)

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

  // Auto-blur (release) the input bar on page scroll
  useEffect(() => {
    const handleGlobalScroll = () => {
      if (isInputFocused && document.activeElement instanceof HTMLElement) {
        document.activeElement.blur()
      }
    }
    window.addEventListener('scroll', handleGlobalScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleGlobalScroll)
  }, [isInputFocused])

  useEffect(() => {
    if (isSidebarOpen && window.innerWidth < 1024) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; }
  }, [isSidebarOpen]);

  useEffect(() => {
    let initialScroll = window.scrollY;
    const handleSidebarCloseOnScroll = () => {
      if (isSidebarOpen && Math.abs(window.scrollY - initialScroll) > 10) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('scroll', handleSidebarCloseOnScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleSidebarCloseOnScroll);
  }, [isSidebarOpen]);

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
      else setColumnsCount(2)
    }
    const observer = new ResizeObserver(updateColumns)
    if (gridRef.current) observer.observe(gridRef.current)
    updateColumns()
    const timer = setTimeout(() => setIsLoading(false), 300)
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
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = inputValue
    const rawInput = (tempDiv.textContent || tempDiv.innerText || '').trim()

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
        
        const payload = isSingleUrl ? { url: finalUrl } : { url: window.location.origin + '/note-' + Date.now(), content: inputValue, type: 'note' }

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
    const filtered = bookmarks.filter((bookmark) => {
      const isCategoryMatch = activeFilter === 'All' || (bookmark.category || 'Uncategorized') === activeFilter;
      const isSubCategoryMatch = activeFilter === 'All' || !activeSubFilter ? true : bookmark.sub_category === activeSubFilter;

      let isMediaTypeMatch = true;
      if (activeMediaType !== null) {
        const bookmarkType = bookmark.type || 'link';
        if (activeMediaType === 'socials') {
          isMediaTypeMatch = bookmarkType === 'twitter' || bookmarkType === 'instagram' || bookmarkType === 'linkedin' || bookmarkType === 'github';
        } else if (activeMediaType === 'videos') {
          isMediaTypeMatch = bookmarkType === 'video' || bookmarkType === 'youtube';
        } else if (activeMediaType === 'documents') {
          isMediaTypeMatch = bookmarkType === 'pdf' || bookmarkType === 'file';
        } else {
          isMediaTypeMatch = bookmarkType === activeMediaType;
        }
      }

      const searchTarget = searchQuery.toLowerCase();
      const isSearchMatch = searchTarget === '' ||
        bookmark.title.toLowerCase().includes(searchTarget) ||
        bookmark.url.toLowerCase().includes(searchTarget) ||
        (bookmark.content !== null && bookmark.content !== undefined && bookmark.content.toLowerCase().includes(searchTarget)) ||
        (bookmark.description !== null && bookmark.description !== undefined && bookmark.description.toLowerCase().includes(searchTarget)) ||
        (bookmark.category !== null && bookmark.category !== undefined && bookmark.category.toLowerCase().includes(searchTarget)) ||
        (bookmark.sub_category !== null && bookmark.sub_category !== undefined && bookmark.sub_category.toLowerCase().includes(searchTarget));

      return isCategoryMatch && isSubCategoryMatch && isMediaTypeMatch && isSearchMatch;
    });

    return filtered.sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }, [bookmarks, activeFilter, activeSubFilter, activeMediaType, searchQuery, sortOrder]);

  const masonryColumns = useMemo(() => {
    if (isGroupedByDate) return [];
    const cols: Bookmark[][] = Array.from({ length: columnsCount }, () => [])
    filteredBookmarks.forEach((b, i) => cols[i % columnsCount].push(b))
    return cols
  }, [filteredBookmarks, columnsCount, isGroupedByDate])

  const groupedBookmarks = useMemo(() => {
    if (!isGroupedByDate) return null;

    const groups: Record<string, Bookmark[]> = {};
    filteredBookmarks.forEach(bookmark => {
      const header = formatDateHeader(bookmark.created_at);
      if (!groups[header]) groups[header] = [];
      groups[header].push(bookmark);
    });
    return groups;
  }, [filteredBookmarks, isGroupedByDate]);

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
    <div className="bg-[#FAF9F5] dark:bg-[#0F120F] min-h-screen font-sans text-[#171A17] dark:text-[#F3F0E9] flex selection:bg-[#E8EFE5] selection:text-[#4D6A51] dark:selection:bg-[#202820] dark:selection:text-[#69866E] transition-colors duration-500">

      {/* ─── SIDEBAR DRAWER ─── */}
      <div className={`fixed top-0 left-0 h-screen z-50 bg-[#FBF9F4] dark:bg-[#151815] transition-all duration-300 flex flex-col border-r border-black/[0.04] dark:border-white/[0.04] shadow-[4px_0_24px_rgba(0,0,0,0.02)] lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0 w-[80vw] sm:w-[280px]' : '-translate-x-full lg:w-[72px]'}`}>
        <Sidebar
          isCollapsed={!isSidebarOpen}
          userEmail={userEmail || null}
          handleSignOut={handleSignOut}
          isMobileMenuOpen={isSidebarOpen}
          setIsMobileMenuOpen={setIsSidebarOpen}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          activeSubFilter={activeSubFilter}
          setActiveSubFilter={setActiveSubFilter}

          activeMediaType={activeMediaType}
          setActiveMediaType={setActiveMediaType}

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

      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          onTouchMove={() => setIsSidebarOpen(false)}
          onWheel={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/10 dark:bg-black/40 backdrop-blur-sm z-40 transition-opacity lg:hidden"
        />
      )}

      {/* ─── MAIN CONTENT ─── */}
      <div className={`flex-1 flex flex-col min-h-screen relative w-full transition-all duration-300 ${isSidebarOpen ? 'lg:ml-[280px] lg:w-[calc(100%-280px)]' : 'lg:ml-[72px] lg:w-[calc(100%-72px)]'}`}>

        {/* PERMANENTLY FIXED HEADER AREA */}
        <div className="sticky top-0 z-40 w-full">
          <header className="flex items-center justify-between px-4 sm:px-8 py-4 bg-white/50 dark:bg-black/40 backdrop-blur-2xl saturate-150 border-b border-white/40 dark:border-white/10 shadow-sm transition-colors">
            <div className="flex items-center gap-4">
              <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-[#171A17]/70 dark:text-white/70 hover:text-[#171A17] dark:hover:text-white transition-colors">
                <MenuIcon />
              </button>

              <div className="flex items-center gap-3">
                <div className="font-serif text-xl sm:text-2xl font-medium text-[#171A17] dark:text-[#F4F1EA]">
                  inntoit
                </div>
                {activeMediaType && (
                   <span className="px-2.5 py-0.5 rounded-full text-[10px] font-sans font-bold uppercase tracking-wider bg-[#4D6A51]/10 text-[#4D6A51] dark:bg-[#8FAA91]/20 dark:text-[#8FAA91]">
                     {mediaTypeLabels[activeMediaType]}
                   </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 flex-1 justify-end">
              <div className="hidden sm:flex items-center gap-2 w-full max-w-[500px] justify-end">
                <div className="relative flex-1">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-black/50 dark:text-white/50" />
                  <input
                    type="text"
                    placeholder="Search your mind..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-[0_2px_16px_rgba(0,0,0,0.06)] outline-none pl-9 pr-8 py-2 rounded-2xl text-[16px] sm:text-sm text-[#171A17] dark:text-[#F3F0E9] placeholder-black/50 dark:placeholder-white/50 focus:bg-white/60 dark:focus:bg-white/10 transition-all"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-black/50 hover:text-black dark:text-white/50 dark:hover:text-white transition-colors">
                      <ClearIcon />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setIsGroupedByDate(!isGroupedByDate)}
                  title={isGroupedByDate ? "Disable Timeline View" : "Group by Date"}
                  className={`shrink-0 p-2 rounded-2xl backdrop-blur-xl border shadow-[0_2px_16px_rgba(0,0,0,0.06)] transition-all ${
                    isGroupedByDate
                      ? 'bg-[#4D6A51] border-[#4D6A51] text-white dark:bg-[#8FAA91] dark:border-[#8FAA91] dark:text-[#151815]'
                      : 'bg-white/40 dark:bg-white/5 border-white/50 dark:border-white/10 text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/10'
                  }`}
                >
                  <CalendarIcon />
                </button>

                <button
                  onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                  title={`Sort: ${sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}`}
                  className="shrink-0 p-2 rounded-2xl bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-[0_2px_16px_rgba(0,0,0,0.06)] text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white transition-all hover:bg-white/60 dark:hover:bg-white/10"
                >
                  {sortOrder === 'desc' ? <SortDescIcon /> : <SortAscIcon />}
                </button>
              </div>
            </div>
          </header>

          <div className="px-4 py-3 sm:hidden border-b border-white/40 dark:border-white/10 bg-white/50 dark:bg-black/40 backdrop-blur-2xl saturate-150">
             <div className="flex items-center gap-2 w-full">
                <div className="relative flex-1">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-black/50 dark:text-white/50" />
                  <input
                    type="text"
                    placeholder="Search your mind..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-[0_2px_16px_rgba(0,0,0,0.06)] outline-none pl-9 pr-8 py-2.5 rounded-2xl text-[16px] text-[#171A17] dark:text-[#F3F0E9] placeholder-black/50 dark:placeholder-white/50 focus:bg-white/60 dark:focus:bg-white/10 transition-all"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-black/50 hover:text-black dark:text-white/50 dark:hover:text-white transition-colors">
                      <ClearIcon />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setIsGroupedByDate(!isGroupedByDate)}
                  title={isGroupedByDate ? "Disable Timeline View" : "Group by Date"}
                  className={`shrink-0 p-2.5 rounded-2xl backdrop-blur-xl border shadow-[0_2px_16px_rgba(0,0,0,0.06)] transition-all ${
                    isGroupedByDate
                      ? 'bg-[#4D6A51] border-[#4D6A51] text-white dark:bg-[#8FAA91] dark:border-[#8FAA91] dark:text-[#151815]'
                      : 'bg-white/40 dark:bg-white/5 border-white/50 dark:border-white/10 text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white'
                  }`}
                >
                  <CalendarIcon />
                </button>

                <button
                  onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                  title={`Sort: ${sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}`}
                  className="shrink-0 p-2.5 rounded-2xl bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-[0_2px_16px_rgba(0,0,0,0.06)] text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white transition-all"
                >
                  {sortOrder === 'desc' ? <SortDescIcon /> : <SortAscIcon />}
                </button>
             </div>
          </div>
        </div>

        <main className="flex-1 p-4 sm:p-8 pb-32">
          <div className="w-full flex flex-col items-start" ref={gridRef}>
            {isLoading ? (
              <div className="w-full flex gap-3 sm:gap-6">
                {Array.from({ length: columnsCount }).map((_, colIndex) => (
                  <div key={colIndex} className="flex flex-col gap-3 sm:gap-6 w-full flex-1 min-w-0">
                    {Array.from({ length: 3 }).map((_, i) => <BookmarkSkeleton key={i} />)}
                  </div>
                ))}
              </div>
            ) : isGroupedByDate && groupedBookmarks ? (
              Object.entries(groupedBookmarks).map(([dateLabel, groupBookmarks]) => {
                const groupCols: Bookmark[][] = Array.from({ length: columnsCount }, () => [])
                groupBookmarks.forEach((b, i) => groupCols[i % columnsCount].push(b))

                return (
                  <div key={dateLabel} className="w-full mb-10">
                    <div className="flex items-center gap-4 mb-6">
                      <h3 className="text-sm font-semibold text-[#171A17] dark:text-[#E2E8F0] shrink-0 tracking-wide">
                        {dateLabel}
                      </h3>
                      <div className="h-px bg-black/[0.06] dark:bg-white/[0.06] flex-1"></div>
                    </div>

                    <div className="w-full flex gap-3 sm:gap-6 items-start">
                      {groupCols.map((colBookmarks, colIndex) => (
                        <div key={colIndex} className="flex flex-col gap-3 sm:gap-6 w-full flex-1 min-w-0">
                          {colBookmarks.map(bookmark => (
                            <BookmarkCard
                              key={bookmark.id}
                              bookmark={bookmark}
                              theme={{ card: 'border border-black/[0.04] dark:border-white/[0.04] bg-white dark:bg-[#151815] shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none', btn: '', hover: '' }}
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
                      ))}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="w-full flex gap-3 sm:gap-6 items-start">
                {masonryColumns.map((colBookmarks, colIndex) => (
                  <div key={colIndex} className="flex flex-col gap-3 sm:gap-6 w-full flex-1 min-w-0">
                    {colBookmarks.map(bookmark => (
                      <BookmarkCard
                        key={bookmark.id}
                        bookmark={bookmark}
                        theme={{ card: 'border border-black/[0.04] dark:border-white/[0.04] bg-white dark:bg-[#151815] shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none', btn: '', hover: '' }}
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
                ))}
              </div>
            )}
          </div>
        </main>

        {/* EXPANDING CAPTURE BAR WITH TIPTAP */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[92%] sm:w-[500px]">
          <div className={`w-full flex ${isInputFocused || (inputValue && inputValue !== '<p></p>') ? 'items-end py-3' : 'items-center py-2'} gap-2 bg-white/95 dark:bg-[#151815]/95 backdrop-blur-3xl saturate-150 rounded-3xl px-3 shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-black/5 dark:border-white/10 transition-all duration-300`}>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,video/*,application/pdf" />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className={`w-9 h-9 shrink-0 text-black/50 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-full flex items-center justify-center transition-all duration-300 disabled:opacity-50 ${isInputFocused || (inputValue && inputValue !== '<p></p>') ? 'mb-1' : 'mb-0'}`}
            >
              {isUploading ? <SpinnerIcon /> : <PaperclipIcon />}
            </button>

            {/* Dynamic expanding wrapper for the Editor */}
            <div className={`flex-1 flex flex-col justify-center min-w-0 overflow-y-auto custom-scrollbar px-2 text-[16px] sm:text-sm transition-all duration-300 ${isInputFocused || (inputValue && inputValue !== '<p></p>') ? 'min-h-[80px] max-h-[250px]' : 'min-h-[24px] max-h-[24px]'}`}>
              <TipTapEditor 
                value={inputValue} 
                onChange={setInputValue} 
                onFocus={() => setIsInputFocused(true)} 
                onBlur={() => setIsInputFocused(false)} 
              />
            </div>

            <button
              onClick={handleQuickCapture}
              disabled={isSaving || !inputValue.trim() || inputValue === '<p></p>'}
              className={`w-9 h-9 shrink-0 text-white bg-[#4D6A51] dark:bg-[#8FAA91] dark:text-[#151815] hover:opacity-90 rounded-full flex items-center justify-center transition-all duration-300 disabled:opacity-30 ${isInputFocused || (inputValue && inputValue !== '<p></p>') ? 'mb-1' : 'mb-0'}`}
            >
              <SendIcon />
            </button>
          </div>
        </div>

      </div>

      {duplicateMatch && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm" onClick={() => { setDuplicateMatch(null); setInputValue(''); }}>
          <div className="w-full max-w-sm bg-white dark:bg-[#151815] border border-black/[0.04] dark:border-white/[0.04] p-6 rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-serif text-[#171A17] dark:text-white mb-2">Already Cataloged</h3>
            <p className="text-sm text-[#636A63] dark:text-[#9DA59D] mb-4">This source currently exists in your Space.</p>
            <div className="p-3 bg-[#F5F1E8]/50 dark:bg-[#202520] rounded-xl mb-4 border border-black/[0.04] dark:border-white/[0.04]">
               <p className="text-sm font-medium truncate text-[#171A17] dark:text-[#F3F0E9]">{duplicateMatch.title || duplicateMatch.url || 'Untitled Save'}</p>
               <p className="text-xs truncate text-[#737B73] dark:text-[#8F998F] mt-1">{duplicateMatch.url ? duplicateMatch.url.replace(/^https?:\/\/(www\.)?/, '') : ''}</p>
            </div>
            <div className="flex gap-2">
               <button onClick={() => {
                  setActiveFilter('All');
                  setActiveSubFilter(null);
                  setActiveMediaType(null);
                  setSearchQuery('');
                  setTimeout(() => setForcedInspectId(duplicateMatch.id), 100);
                  setDuplicateMatch(null);
                  setInputValue('');
               }} className="flex-1 py-2 bg-[#4D6A51] text-white text-sm rounded-xl hover:opacity-90 transition-opacity">
                  View
               </button>
               <button onClick={() => { setDuplicateMatch(null); setInputValue(''); }} className="flex-1 py-2 bg-black/5 dark:bg-white/5 text-sm rounded-xl text-[#171A17] dark:text-[#F3F0E9] hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                  Dismiss
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}