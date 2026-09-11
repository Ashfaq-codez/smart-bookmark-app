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
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
)

const MenuIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const supabase = createClient()

  // Grid / Filter State
  const [activeFilter, setActiveFilter] = useState('All')
  const [activeSubFilter, setActiveSubFilter] = useState<string | null>(null)
  const [draggedId, setDraggedId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Quick Capture State
  const [inputValue, setInputValue] = useState('')
  const [isSaving, setIsSaving] = useState(false)

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

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/' 
  }

  // ────────────────────────────────────────────────────────────
  // SMART QUICK CAPTURE LOGIC
  // ────────────────────────────────────────────────────────────
  const handleQuickCapture = async () => {
    if (!inputValue.trim()) return
    setIsSaving(true)

    // Extremely simple URL check
    const isUrl = /^https?:\/\//i.test(inputValue.trim()) || /^www\./i.test(inputValue.trim())
    let finalUrl = inputValue.trim()

    if (isUrl && !/^https?:\/\//i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl
    }

    // Build the payload for the existing backend /api/save route
    const payload = isUrl
      ? { url: finalUrl }
      : {
          url: window.location.origin + '/note-' + Date.now(), // Fallback dummy URL for notes
          description: inputValue.trim(),
          type: 'note'
        }

    try {
      const res = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        setInputValue('')
        // Toast is skipped here because your Supabase Realtime hook will pop a "Saved to Hub!" toast automatically when it syncs!
      } else {
        toast.error('Failed to capture snippet.')
      }
    } catch (err) {
      toast.error('Network error during save.')
    } finally {
      setIsSaving(false)
    }
  }

  // ... (Keep existing folder hierarchy & drag-drop logic below exactly as it was) ...
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

  const toggleFolderExpand = (folder: string) => setExpandedFolders(prev => ({ [folder]: !prev[folder] }))
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
    <div className="flex flex-col w-full min-h-screen relative pb-32">
      
      {/* ---> FLOATING PILL NAVBAR <--- */}
      <div className="sticky top-4 sm:top-6 z-40 flex justify-center w-full px-4 mb-6 sm:mb-10 pointer-events-none">
        <nav className="pointer-events-auto w-full max-w-4xl bg-white dark:bg-gray-800 border-4 border-gray-900 dark:border-gray-600 rounded-[2rem] py-2 px-3 sm:px-4 shadow-[6px_6px_0px_0px_rgba(17,24,39,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.1)] flex justify-between items-center gap-4 transition-colors">
          <div className="flex items-center gap-2 pl-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6 sm:w-7 sm:h-7 fill-yellow-400 stroke-gray-900 dark:stroke-white stroke-[3px] drop-shadow-[2px_2px_0px_rgba(17,24,39,1)] dark:drop-shadow-[2px_2px_0px_rgba(255,255,255,0.2)] transition-colors">
              <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" strokeLinejoin="round"/>
            </svg>
            <h1 className="text-base sm:text-lg font-black tracking-tight text-gray-900 dark:text-white uppercase transition-colors">
              Smart Bookmarks
            </h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden md:block"><ProfileDropdown email={userEmail ?? ""} /></div>
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 bg-yellow-300 dark:bg-yellow-500 border-2 border-gray-900 rounded-full shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] active:translate-y-px active:shadow-none transition-all cursor-pointer"><MenuIcon /></button>
          </div>
        </nav>
      </div>
      
      {/* Main Grid Area */}
      <div className="flex flex-col md:flex-row gap-8 w-full max-w-[2500px] mx-auto p-4 md:p-8 flex-1">
        
        <Sidebar 
          userEmail={userEmail || null}
          handleSignOut={handleSignOut}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
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

        <main className="flex-1 min-w-0">
          
          {/* ---> SEARCH BAR <--- */}
          <div className="relative w-full max-w-xl mx-auto mb-8 sm:mb-12">
            <div className="absolute inset-y-0 left-0 flex items-center pl-5 pointer-events-none text-gray-500 dark:text-gray-400">
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder="Search your mind..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-6 py-4 md:py-5 text-sm md:text-base font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-800 border-4 border-gray-900 dark:border-gray-700 rounded-2xl outline-none focus:-translate-y-1 focus:shadow-[6px_6px_0px_0px_rgba(17,24,39,1)] dark:focus:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.1)] transition-all placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>

          <div className="relative z-0 columns-2 md:columns-3 xl:columns-4 gap-3 sm:gap-6 w-full">
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
      </div>

      {/* ────────────────────────────────────────────────────────────
          BOTTOM QUICK CAPTURE BAR
          ──────────────────────────────────────────────────────────── */}
      <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-2xl bg-white dark:bg-gray-900 border-4 border-gray-900 dark:border-gray-600 rounded-3xl shadow-[8px_8px_0px_0px_rgba(17,24,39,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.15)] flex items-center p-2 gap-2 transition-all focus-within:-translate-y-1 focus-within:shadow-[10px_10px_0px_0px_rgba(17,24,39,1)] dark:focus-within:shadow-[10px_10px_0px_0px_rgba(255,255,255,0.2)]">

          {/* Attachment / File Upload Button */}
          <button
            onClick={() => toast('File uploads require a storage bucket setup. We can build that next!', { icon: '🏗️' })}
            className="p-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-300 border-2 border-transparent hover:border-gray-900 dark:hover:border-gray-500 rounded-2xl transition-all cursor-pointer"
            title="Attach File (Coming Soon)"
          >
            <PaperclipIcon />
          </button>

          {/* Master Input Field */}
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleQuickCapture(); }}
            disabled={isSaving}
            placeholder="Paste a URL, quote, or type a note..."
            className="flex-1 bg-transparent border-none outline-none px-2 text-sm md:text-base font-bold text-gray-900 dark:text-white placeholder-gray-400 disabled:opacity-50"
          />

          {/* Save / Enter Button */}
          <button
            onClick={handleQuickCapture}
            disabled={isSaving || !inputValue.trim()}
            className="p-3 md:px-6 bg-yellow-400 text-gray-900 border-2 border-gray-900 rounded-2xl shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] hover:translate-y-px hover:shadow-[1px_1px_0px_0px_rgba(17,24,39,1)] disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-2 shrink-0"
          >
            <span className="hidden md:inline font-black uppercase tracking-wider text-xs">Save</span>
            <SendIcon />
          </button>
        </div>
      </div>
      
    </div>
  )
}