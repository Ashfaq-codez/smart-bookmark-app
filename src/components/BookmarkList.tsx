'use client'

import { useState, useMemo, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useBookmarks } from '@/hooks/useBookmarks'
import { Bookmark } from '@/types'
import Sidebar from '@/components/Sidebar'
import BookmarkForms from '@/components/BookmarkForms'
import BookmarkCard from '@/components/BookmarkCard'
import BookmarkSkeleton from '@/components/BookmarkSkeleton'
import { toast } from 'react-hot-toast';

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

const colorThemes = [
  { card: 'bg-sky-100', btn: 'bg-sky-300', hover: 'hover:bg-sky-400' },
  { card: 'bg-teal-100', btn: 'bg-teal-300', hover: 'hover:bg-teal-400' },
  { card: 'bg-rose-100', btn: 'bg-rose-300', hover: 'hover:bg-rose-400' },
  { card: 'bg-amber-100', btn: 'bg-amber-300', hover: 'hover:bg-amber-400' },
  { card: 'bg-indigo-100', btn: 'bg-indigo-300', hover: 'hover:bg-indigo-400' },
  { card: 'bg-emerald-100', btn: 'bg-emerald-300', hover: 'hover:bg-emerald-400' },
]

// FIX: Added userEmail to props
export default function BookmarkList({ initialBookmarks, userEmail }: { initialBookmarks: Bookmark[], userEmail?: string }) {
  const { bookmarks, addBookmark, addBulkBookmarks, updateBookmark, deleteBookmark } = useBookmarks(initialBookmarks)

  const [isLoading, setIsLoading] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const supabase = createClient()

  const [activeFilter, setActiveFilter] = useState('All')
  const [activeSubFilter, setActiveSubFilter] = useState<string | null>(null)
  const [draggedId, setDraggedId] = useState<number | null>(null)
  
  const [searchQuery, setSearchQuery] = useState('')

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
    // 3. CUSTOM TOAST MODAL: Replaces the ugly window.confirm
    toast((t) => (
      <div className="flex flex-col gap-3 font-sans">
        <span className="text-lg font-black text-gray-900 uppercase tracking-tight">Delete "{catToDelete}"?</span>
        <span className="text-sm font-bold text-gray-600">All links inside will remain in "Uncategorized".</span>
        <div className="flex gap-3 mt-2">
          <button 
            onClick={() => {
              setCustomCategories(prev => prev.filter(c => c !== catToDelete));
              if (activeFilter === catToDelete) {
                setActiveFilter('All');
                setActiveSubFilter(null);
              }
              toast.dismiss(t.id);
            }}
            className="flex-1 px-4 py-2 bg-red-400 text-gray-900 font-black uppercase text-sm border-2 border-gray-900 rounded-xl hover:shadow-[3px_3px_0px_0px_rgba(17,24,39,1)] hover:-translate-y-0.5 transition-all"
          >
            Delete
          </button>
          <button 
            onClick={() => toast.dismiss(t.id)}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-900 font-black uppercase text-sm border-2 border-gray-900 rounded-xl hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    ), { 
      duration: Infinity, 
      style: { 
        background: '#fef08a', // FIX: Added bold yellow background (yellow-200)
        border: '4px solid #111827', 
        borderRadius: '1rem', 
        padding: '1.5rem', 
        boxShadow: '6px 6px 0px 0px rgba(17,24,39,1)' 
      }
    });
  }

  const toggleFolderExpand = (folder: string) => {
    setExpandedFolders(prev => {
      return prev[folder] ? {} : { [folder]: true };
    });
  }

  const handleDragStart = (e: React.DragEvent, id: number) => {
    e.dataTransfer.setData('bookmarkId', id.toString())
    setDraggedId(id)
  }
  
  const handleDragEnd = () => setDraggedId(null)
  
  const handleDragOver = (e: React.DragEvent) => e.preventDefault()

  const handleDrop = async (e: React.DragEvent, targetCategory: string, targetSubCategory?: string) => {
    e.preventDefault()
    const bookmarkId = parseInt(e.dataTransfer.getData('bookmarkId'))
    if (!bookmarkId || isNaN(bookmarkId)) return

    const actualTarget = targetCategory === 'All' ? 'Uncategorized' : targetCategory
    const subTarget = targetSubCategory || null;

    await updateBookmark(bookmarkId, { category: actualTarget, sub_category: subTarget })
  }

  return (
    <div className="flex flex-col w-full min-h-screen">
      
      {/* ---> GLOBAL NAVBAR IMPORTED DIRECTLY INTO COMPONENT */}
      <nav className="bg-white border-b-4 border-gray-900 py-3 px-4 sm:px-6 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto flex justify-between items-center gap-y-4">

            {/* Logo Area */}
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6 sm:w-8 sm:h-8 fill-yellow-400 stroke-gray-900 stroke-[3px] drop-shadow-[2px_2px_0px_rgba(17,24,39,1)]">
                <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" strokeLinejoin="round"/>
              </svg>
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-gray-900 ml-1 uppercase">
                Smart Bookmarks
              </h1>
            </div>

            {/* Desktop Auth Area (Hidden on Mobile) */}
            <div className="hidden md:flex items-center justify-between gap-4">
                <div
                  className="bg-sky-100 border-[3px] border-gray-900 px-3 py-1.5 rounded-xl shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] max-w-xs"
                  title={userEmail}
                >
                  <p className="text-sm font-bold text-gray-600 truncate">
                    {userEmail}
                  </p>
                </div>
                <button onClick={handleSignOut} className="text-sm font-black uppercase text-gray-900 bg-white border-[3px] border-gray-900 px-4 py-1.5 rounded-xl hover:bg-rose-200 transition-all shadow-[3px_3px_0px_0px_rgba(17,24,39,1)] active:translate-y-1 active:translate-x-1 active:shadow-none cursor-pointer">
                  Sign Out
                </button>
            </div>

            {/* ---> NEW HAMBURGER MENU IN NAVBAR (Visible on Mobile) */}
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 bg-yellow-300 border-2 border-gray-900 rounded-lg shadow-[2px_2px_0px_0px_rgba(17,24,39,1)] active:translate-y-px active:shadow-none transition-all cursor-pointer"
            >
              <MenuIcon />
            </button>

        </div>
      </nav>

      {/* Main Content Area */}
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

        <main className="flex-1 space-y-8 min-w-0">
          
          <BookmarkForms 
            bookmarks={bookmarks}
            folderHierarchy={folderHierarchy}
            addBookmark={addBookmark}
            addBulkBookmarks={addBulkBookmarks}
          />

          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder="Search by title, URL, or folder..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-900 rounded-xl outline-none bg-white focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all font-medium placeholder-gray-400"
            />
          </div>

          <div className="relative z-0 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, index) => (
                <BookmarkSkeleton key={index} />
              ))
            ) : (
              bookmarks.map((bookmark) => {
                const matchCategory = activeFilter === 'All' || (bookmark.category || 'Uncategorized') === activeFilter;
                const matchSubCategory = activeFilter === 'All'
                  ? true
                  : (activeSubFilter
                      ? bookmark.sub_category === activeSubFilter
                      : !bookmark.sub_category);

                const searchLower = searchQuery.toLowerCase();
                const matchSearch = searchQuery === '' || 
                  bookmark.title.toLowerCase().includes(searchLower) ||
                  bookmark.url.toLowerCase().includes(searchLower) ||
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
    </div>
  )
}