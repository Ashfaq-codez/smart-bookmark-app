'use client'

import { useState, useMemo } from 'react'
import { useBookmarks } from '@/hooks/useBookmarks' // Hook integrated
import { Bookmark } from '@/types'
import BookmarkCard from '@/components/BookmarkCard'
import Sidebar from '@/components/Sidebar'
import BookmarkForms from '@/components/BookmarkForms'

// Icons
const PlusIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
const TrashIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
const EditIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
const SmallXIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
const ChevronRight = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
const ChevronDown = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
const MoveIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><path d="M12 11v6"/><path d="M9 14l3 3 3-3"/></svg>

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
  // Hook replaces Supabase client and raw state
  const { 
    bookmarks, 
    addBookmark, 
    addBulkBookmarks,
    updateBookmark, 
    deleteBookmark 
  } = useBookmarks(initialBookmarks)

  const [inputMode, setInputMode] = useState<'single' | 'bulk'>('single')
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('')
  const [subCategory, setSubCategory] = useState('')

  const [bulkText, setBulkText] = useState('');
  const [bulkCategory, setBulkCategory] = useState('Open Tabs')

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editCategory, setEditCategory] = useState('')
  const [editSubCategory, setEditSubCategory] = useState('')

  const [movingId, setMovingId] = useState<number | null>(null)
  const [moveCategory, setMoveCategory] = useState('')
  const [moveSubCategory, setMoveSubCategory] = useState('')

  const [iframeModes, setIframeModes] = useState<Record<number, boolean>>({})
  const [isCheckingPreview, setIsCheckingPreview] = useState<Record<number, boolean>>({}) 

  const [activeFilter, setActiveFilter] = useState('All')
  const [activeSubFilter, setActiveSubFilter] = useState<string | null>(null)

  const [draggedId, setDraggedId] = useState<number | null>(null)

  const [customCategories, setCustomCategories] = useState<string[]>([])
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')

  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({})
  const [creatingSubFor, setCreatingSubFor] = useState<string | null>(null)
  const [newSubfolderName, setNewSubfolderName] = useState('')
  const [customSubCategories, setCustomSubCategories] = useState<Record<string, string[]>>({})

  // Restored Hierarchical Folder Logic
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

  const formatUrl = (rawUrl: string) => {
    const trimmed = rawUrl.trim()
    return (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) ? 'https://' + trimmed : trimmed
  }

  const getDomain = (link: string) => {
    try { return new URL(link).hostname } catch { return 'link' }
  }

  // Restored Live Preview Check Logic
  const togglePreviewMode = async (id: number, url: string) => {
    if (!iframeModes[id]) {
      setIsCheckingPreview(prev => ({ ...prev, [id]: true }))

      try {
        const res = await fetch(`/api/check-frame?url=${encodeURIComponent(url)}`)
        const data = await res.json()

        if (!data.allowIframe) {
          alert("This website's security settings block live previews. You must click the title to visit it directly.")
          setIsCheckingPreview(prev => ({ ...prev, [id]: false }))
          return;
        }
      } catch (error) {
        console.error("Failed to check iframe status", error)
      }
      setIsCheckingPreview(prev => ({ ...prev, [id]: false })) 
    }

    setIframeModes(prev => ({ ...prev, [id]: !prev[id] }))
  }

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

    // Call custom hook update
    await updateBookmark(bookmarkId, { category: actualTarget, sub_category: subTarget })
  }

  const handleAddSingle = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !url) return
    const formatted = formatUrl(url);
    const finalCategory = category.trim() || 'Uncategorized';
    const finalSubCategory = subCategory.trim() || null;

    const existingBookmark = bookmarks.find(b => b.url === formatted);
    if (existingBookmark) {
      alert(`This bookmark is already saved in the '${existingBookmark.category}' folder!`);
      return;
    }

    await addBookmark({ title, url: formatted, category: finalCategory, sub_category: finalSubCategory })
    setTitle(''); setUrl(''); setCategory(''); setSubCategory('');
  }

  const handleAddBulk = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bulkText.trim()) return
    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/g;
    const foundUrls = bulkText.match(urlRegex);
    if (!foundUrls || foundUrls.length === 0) return alert("No valid URLs found in the text.");

    const uniqueNewUrls = Array.from(new Set(foundUrls.map(formatUrl)));
    const finalUrlsToSave = uniqueNewUrls.filter(u => !bookmarks.some(b => b.url === u));

    if (finalUrlsToSave.length === 0) return alert("All URLs found in the text are already saved in your collection!");

    const newRows = finalUrlsToSave.map((formattedUrl) => ({ 
      title: `${getDomain(formattedUrl)} Tab`, 
      url: formattedUrl, 
      category: bulkCategory.trim() || 'Open Tabs', 
      sub_category: null 
    }));
    
    await addBulkBookmarks(newRows)
    setBulkText(''); setBulkCategory('Open Tabs');
  }

  const saveEdit = async (id: number) => {
    if (!editTitle || !editUrl) return
    await updateBookmark(id, { 
      title: editTitle, 
      url: formatUrl(editUrl), 
      category: editCategory.trim() || 'Uncategorized', 
      sub_category: editSubCategory.trim() || null 
    })
    setEditingId(null)
  }

  const saveMove = async (id: number) => {
    const finalCat = moveCategory.trim() || 'Uncategorized';
    const finalSub = moveSubCategory.trim() || null;
    await updateBookmark(id, { category: finalCat, sub_category: finalSub })
    setMovingId(null)
  }

  return (
    <div className="flex flex-col md:flex-row gap-8 w-full max-w-[1600px] mx-auto p-4 md:p-8">

      {/* LEFT SIDEBAR: Extracted Component */}
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

      {/* RIGHT MAIN AREA */}
      <main className="flex-1 space-y-8 min-w-0">

        <BookmarkForms 
          bookmarks={bookmarks}
          folderHierarchy={folderHierarchy}
          addBookmark={addBookmark}
          addBulkBookmarks={addBulkBookmarks}
        />

        {/* The Bookmark Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {bookmarks.map((bookmark) => {
            const matchCategory = activeFilter === 'All' || (bookmark.category || 'Uncategorized') === activeFilter;
            const matchSubCategory = activeFilter === 'All'
              ? true
              : (activeSubFilter
                  ? bookmark.sub_category === activeSubFilter
                  : !bookmark.sub_category);

            const isVisible = matchCategory && matchSubCategory;

            if (!isVisible) return null;

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