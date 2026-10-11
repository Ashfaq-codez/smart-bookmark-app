import { useState } from 'react'
import toast from 'react-hot-toast'
import { Bookmark } from '@/types'

const formatUrl = (rawUrl: string) => { const t = rawUrl.trim(); if (!t) return ''; return !t.startsWith('http://') && !t.startsWith('https://') ? 'https://' + t : t }

// What the person is typing in the editor, plus the save that runs when they leave a field or close it.
export function useModalEdits(bookmark: Bookmark, onSave: (id: number, updates: Partial<Bookmark>) => Promise<void>) {
  const [editTitle, setEditTitle] = useState(bookmark.title || '')
  const [editUrl, setEditUrl] = useState(bookmark.url || '')
  const [editCategory, setEditCategory] = useState(bookmark.category || '')
  const [editSubCategory, setEditSubCategory] = useState(bookmark.sub_category || '')
  const [editDescription, setEditDescription] = useState(bookmark.description || '')
  const [editContent, setEditContent] = useState(bookmark.content || '')

  const handleAutoSave = async () => {
    if (editTitle.trim() === (bookmark.title || '') && formatUrl(editUrl) === bookmark.url && editCategory.trim() === (bookmark.category || '') && editSubCategory.trim() === (bookmark.sub_category || '') && editDescription.trim() === (bookmark.description || '') && editContent === (bookmark.content || '')) return;
    await onSave(bookmark.id, { title: editTitle.trim() || '', url: formatUrl(editUrl), category: editCategory.trim() || 'Uncategorized', sub_category: editSubCategory.trim() || null, description: editDescription.trim() || null, ...(editContent !== (bookmark.content || '') && { content: editContent || null }) })
    toast.success('Saved', { style: { background: '#4D6A51', color: 'white', border: 'none', borderRadius: '12px' } })
  }

  return {
    editTitle, setEditTitle, editUrl, setEditUrl, editCategory, setEditCategory,
    editSubCategory, setEditSubCategory, editDescription, setEditDescription, editContent, setEditContent,
    handleAutoSave,
  }
}

export type ModalEdits = ReturnType<typeof useModalEdits>
