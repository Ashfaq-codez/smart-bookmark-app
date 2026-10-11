import { useState, useEffect, useMemo } from 'react'
import { BookmarkStats } from '@/lib/bookmarkQuery'
import { Bookmark } from '@/types'

// Folders (categories and subfolders) shown in the sidebar, the counts next to them, and dragging a card onto a folder.
export function useFolders({ stats, activeFilter, setActiveFilter, setActiveSubFilter, updateBookmark }: {
  stats: BookmarkStats
  activeFilter: string
  setActiveFilter: (f: string) => void
  setActiveSubFilter: (f: string | null) => void
  updateBookmark: (id: number, updates: Partial<Bookmark>) => Promise<void>
}) {
  const [customCategories, setCustomCategories] = useState<string[]>([])
  const [customSubCategories, setCustomSubCategories] = useState<Record<string, string[]>>({})
  const [foldersLoaded, setFoldersLoaded] = useState(false)
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({})
  const [creatingSubFor, setCreatingSubFor] = useState<string | null>(null)
  const [newSubfolderName, setNewSubfolderName] = useState('')
  const [draggedId, setDraggedId] = useState<number | null>(null)

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

  const folderHierarchy = useMemo(() => {
    const tree: Record<string, string[]> = {}
    const baseCats = Array.from(new Set([...customCategories, ...stats.folders.map(f => f.category || 'Uncategorized')]))
    baseCats.forEach(c => { if (c !== 'All') tree[c] = [] })
    stats.folders.forEach(f => {
      const p = f.category || 'Uncategorized'
      if (f.sub_category) { if (!tree[p]) tree[p] = []; if (!tree[p].includes(f.sub_category)) tree[p].push(f.sub_category) }
    })
    Object.entries(customSubCategories).forEach(([p, subs]) => {
      if (!tree[p]) tree[p] = []
      subs.forEach(s => { if (!tree[p].includes(s)) tree[p].push(s) })
    })
    return tree
  }, [stats, customCategories, customSubCategories])

  const getCounts = useMemo(() => {
    const counts: Record<string, number> = { 'All': stats.total }
    stats.folders.forEach(f => {
      const c = f.category || 'Uncategorized'
      counts[c] = (counts[c] || 0) + f.n
      if (f.sub_category) counts[`${c}::${f.sub_category}`] = (counts[`${c}::${f.sub_category}`] || 0) + f.n
    })
    return counts
  }, [stats])

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

  return {
    folderHierarchy, getCounts, draggedId, handleDragStart, handleDragEnd, handleDragOver, handleDrop,
    // Everything the sidebar needs for creating, opening and deleting folders
    sidebarFolders: {
      expandedFolders, toggleFolderExpand, customCategories, handleDeleteCategory,
      creatingSubFor, setCreatingSubFor, newSubfolderName, setNewSubfolderName, handleAddSubfolder,
      isAddingCategory, setIsAddingCategory, newCategoryName, setNewCategoryName, handleAddCategory,
    },
  }
}
