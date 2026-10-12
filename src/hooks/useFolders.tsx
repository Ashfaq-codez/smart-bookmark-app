import { useState, useEffect, useMemo } from 'react'
import toast from 'react-hot-toast'
import { createClient } from '@/utils/supabase/client'
import { BookmarkStats } from '@/lib/bookmarkQuery'
import { UNFILED, fetchFolderItems, moveItemsToUnfiled, restoreItems, FolderItem } from '@/lib/folderActions'
import FolderUndoToast from '@/components/bookmark-list/FolderUndoToast'
import { Bookmark } from '@/types'

// Folders (categories and subfolders) shown in the sidebar, the counts next to them, and dragging a card onto a folder.
export function useFolders({ stats, activeFilter, setActiveFilter, setActiveSubFilter, updateBookmark, onItemsChanged }: {
  stats: BookmarkStats
  activeFilter: string
  setActiveFilter: (f: string) => void
  setActiveSubFilter: (f: string | null) => void
  updateBookmark: (id: number, updates: Partial<Bookmark>) => Promise<void>
  onItemsChanged: () => void     // called after saves were moved, so the list and the counts reload
}) {
  const supabase = useMemo(() => createClient(), [])
  const [customCategories, setCustomCategories] = useState<string[]>([])
  const [customSubCategories, setCustomSubCategories] = useState<Record<string, string[]>>({})
  const [foldersLoaded, setFoldersLoaded] = useState(false)
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({})
  const [creatingSubFor, setCreatingSubFor] = useState<string | null>(null)
  const [newSubfolderName, setNewSubfolderName] = useState('')
  const [draggedId, setDraggedId] = useState<number | null>(null)
  const [folderToDelete, setFolderToDelete] = useState<string | null>(null)   // folder named in the confirm dialog
  const [isDeletingFolder, setIsDeletingFolder] = useState(false)

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

  // Step 1: the trash button only asks. "Uncategorized" is where deleted folders' saves go, so it cannot be deleted.
  const handleDeleteCategory = (name: string) => { if (name !== UNFILED && name !== 'All') setFolderToDelete(name) }
  const cancelDeleteFolder = () => { if (!isDeletingFolder) setFolderToDelete(null) }

  // Step 2: after "Delete" is pressed. Only moves saves to Uncategorized; no bookmark is ever deleted.
  const confirmDeleteFolder = async () => {
    const name = folderToDelete
    if (!name || isDeletingFolder) return
    setIsDeletingFolder(true)
    try {
      const { ok, items } = await fetchFolderItems(supabase, name)
      if (!ok) { toast.error('Could not delete the folder. Nothing was changed.'); return }

      if (!(await moveItemsToUnfiled(supabase, items))) {
        await restoreItems(supabase, name, items)   // put back anything that already moved
        toast.error('Could not delete the folder. Nothing was changed.')
        return
      }

      // Remember what to bring back on Undo
      const wasCustom = customCategories.includes(name)
      const savedSubs = customSubCategories[name]

      setCustomCategories(p => p.filter(c => c !== name))
      setCustomSubCategories(p => { const rest = { ...p }; delete rest[name]; return rest })
      if (activeFilter === name) { setActiveFilter('All'); setActiveSubFilter(null) }
      setFolderToDelete(null)
      onItemsChanged()

      toast.custom((t) => (
        <FolderUndoToast
          visible={t.visible}
          message={`Folder \u2018${name}\u2019 deleted`}
          onUndo={() => { toast.dismiss(t.id); undoDelete(name, items, wasCustom, savedSubs) }}
        />
      ), { duration: 6000 })
    } finally {
      setIsDeletingFolder(false)
    }
  }

  const undoDelete = async (name: string, items: FolderItem[], wasCustom: boolean, savedSubs?: string[]) => {
    if (!(await restoreItems(supabase, name, items))) { toast.error('Could not undo. The saves are safe in Uncategorized.'); return }
    if (wasCustom) setCustomCategories(p => (p.includes(name) ? p : [...p, name]))
    if (savedSubs) setCustomSubCategories(p => ({ ...p, [name]: savedSubs }))
    onItemsChanged()
    toast.success(`Folder \u2018${name}\u2019 restored`)
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
    // The "Delete folder?" dialog
    deleteFolderDialog: {
      folder: folderToDelete,
      itemCount: folderToDelete ? (getCounts[folderToDelete] ?? 0) : 0,
      isDeleting: isDeletingFolder,
      onConfirm: confirmDeleteFolder,
      onCancel: cancelDeleteFolder,
    },
    // Everything the sidebar needs for creating, opening and deleting folders
    sidebarFolders: {
      expandedFolders, toggleFolderExpand, customCategories, handleDeleteCategory,
      creatingSubFor, setCreatingSubFor, newSubfolderName, setNewSubfolderName, handleAddSubfolder,
      isAddingCategory, setIsAddingCategory, newCategoryName, setNewCategoryName, handleAddCategory,
    },
  }
}
