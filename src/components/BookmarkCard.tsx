'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Bookmark } from '@/types'
import toast from 'react-hot-toast'

const TrashIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
const ExternalLinkIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
const FullscreenIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
const CloseIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>

interface BookmarkCardProps {
  bookmark: Bookmark;
  theme: { card: string; btn: string; hover: string };
  isDragged: boolean;
  onDragStart: (e: React.DragEvent, id: number) => void;
  onDragEnd: () => void;
  updateBookmark: (id: number, updates: Partial<Bookmark>) => Promise<void>;
  deleteBookmark: (id: number) => Promise<void>;
  forceOpenModal?: boolean;
  onCloseForcedModal?: () => void;
}

export default function BookmarkCard({ bookmark, isDragged, onDragStart, onDragEnd, updateBookmark, deleteBookmark, forceOpenModal, onCloseForcedModal }: BookmarkCardProps) {
  const [mounted, setMounted] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isFullscreenMedia, setIsFullscreenMedia] = useState(false)

  const [editTitle, setEditTitle] = useState(bookmark.title || '')
  const [editUrl, setEditUrl] = useState(bookmark.url || '')
  const [editCategory, setEditCategory] = useState(bookmark.category || '')
  const [editSubCategory, setEditSubCategory] = useState(bookmark.sub_category || '')
  const [editDescription, setEditDescription] = useState(bookmark.description || '')
  const [editContent, setEditContent] = useState(bookmark.content || '')

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { if (forceOpenModal) setIsModalOpen(true) }, [forceOpenModal])
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullscreenMedia) setIsFullscreenMedia(false)
        else if (showDeleteConfirm) setShowDeleteConfirm(false)
        else if (isModalOpen) handleCloseModal()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isModalOpen, isFullscreenMedia, showDeleteConfirm])

  const handleCloseModal = () => { setIsModalOpen(false); setShowDeleteConfirm(false); if (onCloseForcedModal) onCloseForcedModal() }
  const getDomain = (link: string) => { try { return new URL(link).hostname.replace('www.', '') } catch { return 'source' } }
  const formatUrl = (rawUrl: string) => { const t = rawUrl.trim(); if (!t) return ''; return !t.startsWith('http://') && !t.startsWith('https://') ? 'https://' + t : t }

  const handleAutoSave = async () => {
    if (editTitle.trim() === (bookmark.title || '') && (bookmark.type === 'note' || formatUrl(editUrl) === bookmark.url) && editCategory.trim() === (bookmark.category || '') && editSubCategory.trim() === (bookmark.sub_category || '') && editDescription.trim() === (bookmark.description || '') && editContent.trim() === (bookmark.content || '')) return;
    await updateBookmark(bookmark.id, { title: editTitle.trim() || 'Untitled', url: bookmark.type !== 'note' ? formatUrl(editUrl) : bookmark.url, category: editCategory.trim() || 'Uncategorized', sub_category: editSubCategory.trim() || null, description: editDescription.trim() || null, content: editContent.trim() || null })
    toast.success('Saved', { duration: 2000, position: 'bottom-center' })
  }

  const handleConfirmDelete = async () => { await deleteBookmark(bookmark.id); setShowDeleteConfirm(false); handleCloseModal() }

  const previewImageUrl = bookmark.image_url || `https://s.wordpress.com/mshots/v1/${encodeURIComponent(bookmark.url)}?w=800`

  return (
    <>
      {/* ─── CARD LAYOUT: FIXED OVERFLOW & MYMIND AESTHETIC ─── */}
      <div draggable onDragStart={(e) => onDragStart(e, bookmark.id)} onDragEnd={onDragEnd} onClick={() => setIsModalOpen(true)} className={`group relative flex flex-col w-full min-w-0 cursor-pointer select-none transition-transform duration-300 ease-out ${isDragged ? 'opacity-40 scale-95' : 'hover:-translate-y-1'}`}>
        <div className={`w-full bg-white dark:bg-[#232428] rounded-2xl overflow-hidden flex flex-col min-w-0 border border-gray-100 dark:border-transparent shadow-sm hover:shadow-md transition-shadow`}>
          
          {bookmark.type === 'note' ? (
            <div className="p-5 flex flex-col min-w-0 gap-2">
              <span className="text-[10px] font-semibold text-orange-500 uppercase tracking-widest truncate w-full">{bookmark.title}</span>
              {/* whitespace-pre-wrap ensures formatting is kept, break-words stops overflow */}
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap break-words line-clamp-6 w-full">
                {bookmark.content}
              </p>
            </div>
          ) : (
            <div className="w-full flex flex-col min-w-0">
              <div className="w-full relative overflow-hidden bg-gray-100 dark:bg-[#1a1b1e]">
                <img src={previewImageUrl} alt={bookmark.title} className="w-full h-auto object-cover block group-hover:scale-[1.03] transition-transform duration-700 ease-out" loading="lazy" onError={(e) => { ;(e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${getDomain(bookmark.url)}&background=random&size=600&font-size=0.1` }} />
              </div>
              <div className="p-4 flex flex-col gap-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-200 truncate w-full">{bookmark.title}</h4>
                <p className="text-[11px] text-gray-500 truncate w-full">{getDomain(bookmark.url)}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── SLEEK INSPECTION MODAL ─── */}
      {mounted && isModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-6 md:p-12 bg-black/50 dark:bg-black/70 backdrop-blur-md transition-opacity" onMouseDown={handleCloseModal}>
          <div className="relative w-full max-w-[1200px] h-[95vh] sm:h-[85vh] flex flex-col md:flex-row bg-white dark:bg-[#1c1d20] rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-white/5" onMouseDown={(e) => e.stopPropagation()}>
            
            <button onClick={handleCloseModal} className="absolute top-4 right-4 z-50 p-2 bg-gray-100/50 dark:bg-black/20 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 backdrop-blur-md rounded-full transition-colors cursor-pointer">
              <CloseIcon />
            </button>

            {/* LEFT PANE */}
            <div className={`w-full md:w-[65%] h-[40%] md:h-full bg-[#f9fafb] dark:bg-[#131417] relative flex flex-col border-b md:border-b-0 md:border-r border-gray-200 dark:border-white/5 ${bookmark.type === 'note' ? 'overflow-hidden' : 'items-center justify-center p-6'}`}>
              {bookmark.type === 'note' ? (
                <div className="w-full h-full flex flex-col">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    onBlur={handleAutoSave}
                    placeholder="Start typing..."
                    className="w-full h-full bg-transparent p-8 sm:p-12 md:p-16 font-sans text-lg sm:text-xl leading-relaxed text-gray-800 dark:text-gray-200 outline-none resize-none whitespace-pre-wrap selection:bg-orange-500/20"
                  />
                </div>
              ) : bookmark.type === 'image' ? (
                <>
                  <img src={previewImageUrl} alt={bookmark.title} className="w-full h-full object-contain cursor-zoom-in drop-shadow-xl" onClick={() => setIsFullscreenMedia(true)} />
                  <button onClick={() => setIsFullscreenMedia(true)} className="absolute bottom-6 right-6 px-4 py-2 bg-white/80 dark:bg-black/50 backdrop-blur-md text-gray-800 dark:text-gray-200 text-xs font-medium rounded-full flex items-center gap-2 shadow-sm hover:bg-white dark:hover:bg-white/10 transition-colors cursor-pointer">
                    <FullscreenIcon /> Expand
                  </button>
                </>
              ) : (
                <>
                  <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="w-full h-full flex items-center justify-center p-4 md:p-8 group">
                    <img src={previewImageUrl} alt={bookmark.title} className="w-full h-full object-contain rounded-xl shadow-lg group-hover:scale-[1.02] transition-transform duration-500 ease-out" />
                  </a>
                  <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="absolute bottom-6 right-6 px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-medium rounded-full shadow-md hover:scale-105 transition-transform flex items-center gap-2">
                    <ExternalLinkIcon /> Open Link
                  </a>
                </>
              )}
            </div>

            {/* RIGHT PANE (SIDEBAR) */}
            <div className="w-full md:w-[35%] h-[60%] md:h-full flex flex-col bg-white dark:bg-[#1c1d20] p-6 sm:p-10 overflow-y-auto">
              
              <div className="mb-10 pr-6">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={handleAutoSave}
                  placeholder="Title"
                  className="w-full bg-transparent border-none outline-none text-2xl font-semibold text-gray-900 dark:text-white mb-2 placeholder-gray-300 dark:placeholder-gray-600 transition-colors"
                />
                <div className="text-[11px] font-medium text-gray-500 flex flex-col gap-2">
                  <span>Added {new Date(bookmark.created_at).toLocaleDateString()}</span>
                  {bookmark.type !== 'note' && (
                    <input 
                      type="url"
                      value={editUrl}
                      onChange={(e) => setEditUrl(e.target.value)}
                      onBlur={handleAutoSave}
                      className="w-full bg-transparent border-b border-gray-200 dark:border-gray-800 pb-1 text-gray-400 outline-none focus:border-gray-400 transition-colors truncate"
                    />
                  )}
                </div>
              </div>

              <div className="mb-10">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3 block">Organization</label>
                <div className="flex flex-col gap-3">
                  <input
                    type="text"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    onBlur={handleAutoSave}
                    placeholder="Folder"
                    className="w-full text-sm font-medium px-4 py-3 bg-gray-50 dark:bg-[#232428] text-gray-900 dark:text-white border border-gray-100 dark:border-transparent rounded-xl outline-none focus:border-gray-300 dark:focus:border-gray-600 transition-all"
                  />
                  <input
                    type="text"
                    value={editSubCategory}
                    onChange={(e) => setEditSubCategory(e.target.value)}
                    onBlur={handleAutoSave}
                    placeholder="Subfolder"
                    className="w-full text-sm font-medium px-4 py-3 bg-gray-50 dark:bg-[#232428] text-gray-900 dark:text-white border border-gray-100 dark:border-transparent rounded-xl outline-none focus:border-gray-300 dark:focus:border-gray-600 transition-all"
                  />
                </div>
              </div>

              <div className="flex-1 flex flex-col min-h-[160px]">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3 block">Personal Notes</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  onBlur={handleAutoSave}
                  placeholder="Type your notes here..."
                  className="w-full flex-1 bg-gray-50 dark:bg-[#232428] border border-gray-100 dark:border-transparent rounded-2xl p-5 text-sm font-medium text-gray-700 dark:text-gray-300 outline-none focus:border-gray-300 dark:focus:border-gray-600 resize-none transition-all leading-relaxed"
                />
              </div>

              <div className="mt-8 flex items-center justify-end">
                <button 
                  onClick={() => setShowDeleteConfirm(true)} 
                  className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-colors flex items-center gap-2 cursor-pointer"
                  title="Delete"
                >
                  <TrashIcon />
                </button>
              </div>
            </div>

            {/* Simple Delete Overlay */}
            {showDeleteConfirm && (
              <div className="absolute inset-0 z-[100000] flex items-center justify-center p-4 bg-white/80 dark:bg-black/80 backdrop-blur-sm" onMouseDown={(e) => e.stopPropagation()}>
                <div className="w-full max-w-xs bg-white dark:bg-[#1c1d20] border border-gray-100 dark:border-white/5 p-6 rounded-2xl shadow-xl flex flex-col gap-4 text-center">
                  <span className="text-lg font-medium text-gray-900 dark:text-white">Delete Item?</span>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2.5 bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 font-medium text-sm rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">Cancel</button>
                    <button onClick={handleConfirmDelete} className="flex-1 py-2.5 bg-red-500 text-white font-medium text-sm rounded-xl hover:bg-red-600 transition-colors shadow-sm">Delete</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Fullscreen Media */}
      {mounted && isFullscreenMedia && bookmark.type !== 'link' && createPortal(
        <div className="fixed inset-0 z-[100001] flex items-center justify-center bg-black/95 p-4 md:p-12 backdrop-blur-md cursor-zoom-out" onClick={() => setIsFullscreenMedia(false)}>
          <button onClick={() => setIsFullscreenMedia(false)} className="absolute top-4 right-4 md:top-8 md:right-8 p-3 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors">
            <CloseIcon />
          </button>
          <img src={previewImageUrl} alt={bookmark.title} className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl" onClick={(e) => e.stopPropagation()} />
        </div>,
        document.body
      )}
    </>
  )
}