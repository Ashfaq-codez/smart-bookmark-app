'use client'

import { useState, useMemo } from 'react'
import { useBookmarks } from '@/hooks/useBookmarks'
import { Bookmark } from '@/types'
import Sidebar from '@/components/Sidebar'
import BookmarkForms from '@/components/BookmarkForms'
import BookmarkCard from '@/components/BookmarkCard'

// Summer Cool Palette
const colorThemes = [
  { card: 'bg-sky-100', btn: 'bg-sky-300', hover: 'hover:bg-sky-400' },
  { card: 'bg-teal-100', btn: 'bg-teal-300', hover: 'hover:bg-teal-400' },
  { card: 'bg-rose-100', btn: 'bg-rose-300', hover: 'hover:bg-rose-400' },
  { card: 'bg-amber-100', btn: 'bg-amber-300', hover: 'hover:bg-amber-400' },
  { card: 'bg-indigo-100', btn: 'bg-indigo-300', hover: 'hover:bg-indigo-400' },
  { card: 'bg-emerald-100', btn: 'bg-emerald-300', hover: 'hover:bg-emerald-400' },
]

export default function BookmarkList({ initialBookmarks }: { initialBookmarks: Bookmark[] }) {
  // 1. Core Data Hook
  const { 
    bookmarks, 
    addBookmark, 
    addBulkBookmarks,
    updateBookmark, 
    deleteBookmark 
  } = useBookmarks(initialBookmarks)

  // 2. Shared State (Filters & Dragging)
  const [activeFilter, setActiveFilter] = useState('All')
  const [activeSubFilter, setActiveSubFilter] = useState<string | null>(null)
  const [draggedId, setDraggedId] = useState<number | null>(null)

  // 3. Shared State (Category Management)
  const [customCategories, setCustomCategories] = useState<string[]>([])
  const [customSubCategories, setCustomSubCategories] = useState<Record<string, string[]>>({})
  
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({})
  const [creatingSubFor, setCreatingSubFor] = useState<string | null>(null)
  const [newSubfolderName, setNewSubfolderName] = useState('')

  // 4. Derived Data (Hierarchy & Counts)
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
      if (!sub) counts[cat] = (counts[cat] || 0) + 1;
      if (sub) {
        const subKey = `${cat}::${sub}`;
        counts[subKey] = (counts[subKey] || 0) + 1;
      }
    });
    return counts;
  }, [bookmarks])

  // 5. Sidebar Handlers
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
    if(window.confirm(`Delete the folder "${catToDelete}"? All links inside will remain in "Uncategorized".`)) {
      setCustomCategories(prev => prev.filter(c => c !== catToDelete));
      if (activeFilter === catToDelete) {
        setActiveFilter('All');
        setActiveSubFilter(null);
      }
    }
  }

  const toggleFolderExpand = (folder: string) => {
    setExpandedFolders(prev => ({ ...prev, [folder]: !prev[folder] }))
  }

  // 6. Drag and Drop Handlers
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
    <div className="flex flex-col md:flex-row gap-8 w-full max-w-[1600px] mx-auto p-4 md:p-8">
      
      {/* Extracted Sidebar Component */}
      <Sidebar 
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
        
        {/* Extracted Forms Component */}
        <BookmarkForms 
          bookmarks={bookmarks}
          folderHierarchy={folderHierarchy}
          addBookmark={addBookmark}
          addBulkBookmarks={addBulkBookmarks}
        />

        {/* Extracted Card Mapping */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {bookmarks.map((bookmark) => {
            const matchCategory = activeFilter === 'All' || (bookmark.category || 'Uncategorized') === activeFilter;
            const matchSubCategory = activeFilter === 'All'
              ? true
              : (activeSubFilter
                  ? bookmark.sub_category === activeSubFilter
                  : !bookmark.sub_category);

            if (!(matchCategory && matchSubCategory)) return null;

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
          })}
        </div>
      </main>
    </div>
  )
}