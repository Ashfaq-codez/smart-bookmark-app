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

// --- ICONS ---
const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
)

const PaperclipIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
)

const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
)

const ChevronRight = ({ className = '' }: { className?: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={className}>
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

export default function BookmarkList({ initialBookmarks, userEmail }: { initialBookmarks: Bookmark[], userEmail?: string }) {
  const { bookmarks, updateBookmark, deleteBookmark } = useBookmarks(initialBookmarks)

  const [isLoading, setIsLoading] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const supabase = createClient()

  // Grid / Filter State
  const [activeFilter, setActiveFilter] = useState('All')
  const [activeSubFilter, setActiveSubFilter] = useState<string | null>(null)
  const [draggedId, setDraggedId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Quick Capture & Scroll State
  const [inputValue, setInputValue] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isInputVisible, setIsInputVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  // Sidebar Folder State
  const [customCategories, setCustomCategories] = useState<string[]>([])
  const [customSubCategories, setCustomSubCategories] = useState<Record<string, string[]>>({})
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({})
  const [creatingSubFor, setCreatingSubFor] = useState<string | null>(null)
  const [newSubfolderName, setNewSubfolderName] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600)
    return () => clearTimeout(timer)
  }, [])

  // Hide/Show Input Bar on Scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsInputVisible(false) // Scrolling down
      } else {
        setIsInputVisible(true) // Scrolling up
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

  // ────────────────────────────────────────────────────────────
  // SMART QUICK CAPTURE & BULK LOGIC
  // ────────────────────────────────────────────────────────────
  const handleQuickCapture = async () => {
    const rawInput = inputValue.trim()
    if (!rawInput) return
    setIsSaving(true)

    // Regex to accurately match URLs
    const urlRegex = /^(https?:\/\/)?([\w.-]+)\.([a-z]{2,})(:\d{1,5})?(\/.*)?$/i

    // Split input by whitespace, newlines, or commas
    const tokens = rawInput.split(/[\s,]+/).filter(Boolean)
    
    // Check if every single token extracted is a valid URL
    const isAllUrls = tokens.length > 0 && tokens.every(t => urlRegex.test(t))

    try {
      if (isAllUrls && tokens.length > 1) {
        // BULK MULTI-LINK SAVE
        await Promise.all(tokens.map(token => {
          const finalUrl = /^https?:\/\//i.test(token) ? token : 'https://' + token
          return fetch('/api/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: finalUrl })
          })
        }))
        toast.success(`Bulk saved ${tokens.length} links to your hub!`)
      } else {
        // SINGLE SAVE (Note or Link)
        const isSingleUrl = tokens.length === 1 && urlRegex.test(rawInput)
        let finalUrl = rawInput
        if (isSingleUrl && !/^https?:\/\//i.test(finalUrl)) {
          finalUrl = 'https://' + finalUrl
        }

        const payload = isSingleUrl
          ? { url: finalUrl }
          : {
              url: window.location.origin + '/note-' + Date.now(),
              description: rawInput,
              type: 'note'
            }

        const res = await fetch('/api/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })

        if (!res.ok) throw new Error('Failed to save snippet.')
      }

      setInputValue('')
    } catch (err) {
      toast.error('Error saving your content. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  // ... (Keep existing folder hierarchy & drag-drop logic below) ...
  const folderHierarchy = useMemo(() => {
    const tree: Record<string, string[]> = {};
    const baseCats = Array.from(new Set([...customCategories, ...bookmarks.map(b => b.category || 'Uncategorized')]));
    baseCats.forEach(cat => { if (cat !== 'All') tree[cat] = []; });
    bookmarks.forEach(b => {
      const parent = b.category || 'Uncategorized';
      if (b.sub_category) {
        if (!tree[parent]) tree[parent] = [];
        if (!tree[parent].includes(b.sub_category)) tree[parent].push(b.sub_category);
      }
    });
    Object.entries(customSubCategories).forEach(([parent, subs]) => {
      if (!tree[parent]) tree[parent] = [];
      subs.forEach(sub => { if (!tree[parent].includes(sub)) tree[parent].push(sub); });
    });
    return tree;
  }, [bookmarks, customCategories, customSubCategories])

  const getCounts = useMemo(() => {
    const counts: Record<string, number> = { 'All': bookmarks.length };
    bookmarks.forEach(b => {
      const cat = b.category || 'Uncategorized';
      const sub = b.sub_category;
      counts[cat] = (counts[cat] || 0) + 1;
      if (sub) {
        const subKey = `${cat}::${sub}`;
        counts[subKey] = (counts[subKey] || 0) + 1;
      }
    });
    return counts;
  }, [bookmarks])

  const handleAddCategory = () => {
    const trimmed = newCategoryName.trim();
    if (trimmed && !Object.keys(folderHierarchy).includes(trimmed)) {
      setCustomCategories(prev => [...prev, trimmed]);
      setActiveFilter(trimmed);
      setActiveSubFilter(null);
    }
    setNewCategoryName('');
    setIsAddingCategory(false);
  }

  const handleAddSubfolder = (parentFolder: string) => {
    const trimmed = newSubfolderName.trim();
    if (trimmed) {
      setCustomSubCategories(prev => {
        const existingSubs = prev[parentFolder] || [];
        if (existingSubs.includes(trimmed)) return prev;
        return { ...prev, [parentFolder]: [...existingSubs, trimmed] };
      });
      setActiveFilter(parentFolder);
      setActiveSubFilter(trimmed);
    }
    setNewSubfolderName('');
    setCreatingSubFor(null);
  }

  const handleDeleteCategory = async (catToDelete: string) => {
    toast((t) => (
      <div className="flex flex-col gap-3 font-sans">
        <span className="text-lg font-black text-gray-900 uppercase tracking-tight">Delete "{catToDelete}"?</span>
        <span className="text-sm font-bold text-gray-600">All links inside will remain in "Uncategorized".</span>
        <div className="flex gap-3 mt-2">
          <button onClick={() => { setCustomCategories(prev => prev.filter(c => c !== catToDelete)); if (activeFilter === catToDelete) { setActiveFilter('All'); setActiveSubFilter(null); } toast.dismiss(t.id); }} className="flex-1 px-4 py-2 bg-red-400 text-gray-900 font-black uppercase text-sm border-2 border-gray-900 rounded-xl hover:shadow-[3px_3px_0px_0px_rgba(17,24,39,1)] hover:-translate-y-0.5 transition-all">Delete</button>
          <button onClick={() => toast.dismiss(t.id)} className="flex-1 px-4 py-2 bg-gray-100 text-gray-900 font-black uppercase text-sm border-2 border-gray-900 rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
        </div>
      </div>
    ), { duration: Infinity, style: { background: '#fef08a', border: '4px solid #111827', borderRadius: '1rem', padding: '1.5rem', boxShadow: '6px 6px 0px 0px rgba(17,24,39,1)' } });
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
    <div className="bg-white dark:bg-gray-900 min-h-screen font-sans text-gray-900 dark:text-gray-100 flex flex-col pt-[72px]">
      
      {/* ────────────────────────────────────────────────────────────
          1. FIXED TOP HEADER (Wireframe Segmented Layout)
          ──────────────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 h-[72px] bg-white dark:bg-gray-900 border-b-[3px] border-gray-900 dark:border-gray-700 z-50 flex items-stretch">
        
        {/* Logo Segment */}
        <div className="hidden md:flex items-center justify-center w-[240px] border-r-[3px] border-gray-900 dark:border-gray-700 shrink-0">
          <span className="font-mono font-bold text-sm uppercase tracking-widest">smart bookmark</span>
        </div>

        {/* Global Search Segment */}
        <div className="flex-1 flex items-center px-4 md:px-8 border-r-[3px] border-gray-900 dark:border-gray-700 relative">
          <SearchIcon />
          <input
            type="text"
            placeholder="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-full bg-transparent outline-none pl-4 font-mono font-bold text-sm md:text-base placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>

        {/* Profile Segment */}
        <div className="flex items-center justify-center w-[160px] md:w-[240px] shrink-0 bg-gray-50 dark:bg-gray-800">
          <ProfileDropdown email={userEmail ?? ""} />
        </div>
      </header>

      {/* ────────────────────────────────────────────────────────────
          2. SLIDE-OUT SIDEBAR FLAP
          ──────────────────────────────────────────────────────────── */}
      <div className={`fixed left-0 top-[72px] bottom-0 z-40 bg-white dark:bg-gray-900 border-r-[3px] border-gray-900 dark:border-gray-700 transition-all duration-300 flex ${isSidebarOpen ? 'w-[280px]' : 'w-[48px]'}`}>
        
        {/* Toggle Flap */}
        <div 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
          className="w-[48px] h-full flex flex-col items-center py-6 cursor-pointer border-r-[3px] border-transparent hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"
        >
          <ChevronRight className={`transition-transform duration-300 ${isSidebarOpen ? 'rotate-180' : ''}`} />
          <span style={{ writingMode: 'vertical-rl' }} className="mt-6 font-mono text-xs font-bold uppercase tracking-widest text-gray-500">
            sidebar
          </span>
        </div>

        {/* Sidebar Content (Hidden when closed) */}
        <div className={`overflow-hidden h-full flex-1 transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
          <div className="w-[229px] h-full overflow-y-auto">
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
      </div>

      {/* ────────────────────────────────────────────────────────────
          3. MAIN CONTENT GRID
          ──────────────────────────────────────────────────────────── */}
      <main className="ml-[48px] flex-1 p-6 md:p-10 transition-all pb-32">
        <div className="relative z-0 columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 w-full max-w-[2000px] mx-auto">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="break-inside-avoid mb-6 inline-block w-full">
                <BookmarkSkeleton />
              </div>
            ))
          ) : (
            bookmarks.map((bookmark) => {
              const matchCategory = activeFilter === 'All' || (bookmark.category || 'Uncategorized') === activeFilter;
              const matchSubCategory = activeFilter === 'All' ? true : (activeSubFilter ? bookmark.sub_category === activeSubFilter : !bookmark.sub_category);

              const searchLower = searchQuery.toLowerCase();
              const matchSearch = searchQuery === '' || 
                bookmark.title.toLowerCase().includes(searchLower) ||
                bookmark.url.toLowerCase().includes(searchLower) ||
                (bookmark.description && bookmark.description.toLowerCase().includes(searchLower)) ||
                (bookmark.category && bookmark.category.toLowerCase().includes(searchLower)) ||
                (bookmark.sub_category && bookmark.sub_category.toLowerCase().includes(searchLower));

              if (!(matchCategory && matchSubCategory && matchSearch)) return null;

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
                />
              )
            })
          )}
        </div>
      </main>

      {/* ────────────────────────────────────────────────────────────
          4. FLOATING BOTTOM INPUT BAR (Hides on Scroll Down)
          ──────────────────────────────────────────────────────────── */}
      <div 
        className={`fixed bottom-6 md:bottom-8 left-[48px] right-0 z-50 flex justify-center px-4 pointer-events-none transition-transform duration-300 ease-in-out ${isInputVisible ? 'translate-y-0' : 'translate-y-32'}`}
      >
        <div className="pointer-events-auto w-full max-w-3xl bg-white dark:bg-gray-900 border-[3px] border-gray-900 dark:border-gray-600 rounded-3xl shadow-[8px_8px_0px_0px_rgba(17,24,39,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.15)] flex items-center p-2 gap-2 transition-all focus-within:-translate-y-1 focus-within:shadow-[12px_12px_0px_0px_rgba(17,24,39,1)] dark:focus-within:shadow-[12px_12px_0px_0px_rgba(255,255,255,0.2)]">

          {/* Attachment Button */}
          <button
            onClick={() => toast('File uploads require a storage bucket setup. We can build that next!', { icon: '🏗️' })}
            className="p-3 md:p-4 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-300 border-[3px] border-transparent hover:border-gray-900 dark:hover:border-gray-500 rounded-2xl transition-all cursor-pointer shrink-0"
            title="Attach File"
          >
            <PaperclipIcon />
          </button>

          {/* Input Box */}
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleQuickCapture(); }}
            disabled={isSaving}
            placeholder="input (paste links, notes, or bulk URLs...)"
            className="flex-1 bg-transparent border-none outline-none px-4 font-mono font-bold text-sm md:text-base text-gray-900 dark:text-white placeholder-gray-400 disabled:opacity-50"
          />

          {/* Submit Button */}
          <button
            onClick={handleQuickCapture}
            disabled={isSaving || !inputValue.trim()}
            className="p-3 md:p-4 bg-yellow-400 text-gray-900 border-[3px] border-gray-900 rounded-2xl shadow-[3px_3px_0px_0px_rgba(17,24,39,1)] hover:translate-y-px hover:shadow-[1px_1px_0px_0px_rgba(17,24,39,1)] disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center shrink-0"
          >
            <SendIcon />
          </button>
        </div>
      </div>
      
    </div>
  )
}