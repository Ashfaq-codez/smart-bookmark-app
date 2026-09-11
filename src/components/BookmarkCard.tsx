'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Bookmark } from '@/types'
import toast from 'react-hot-toast'

const TrashIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
const ExternalLinkIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
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

export default function BookmarkCard({
  bookmark,
  isDragged,
  onDragStart,
  onDragEnd,
  updateBookmark,
  deleteBookmark,
  forceOpenModal,
  onCloseForcedModal,
}: BookmarkCardProps) {
  const [mounted, setMounted] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isFullscreenMedia, setIsFullscreenMedia] = useState(false)

  // Edit State
  const [editTitle, setEditTitle] = useState(bookmark.title || '')
  const [editUrl, setEditUrl] = useState(bookmark.url || '')
  const [editCategory, setEditCategory] = useState(bookmark.category || '')
  const [editSubCategory, setEditSubCategory] = useState(bookmark.sub_category || '')
  const [editDescription, setEditDescription] = useState(bookmark.description || '')
  const [editContent, setEditContent] = useState(bookmark.content || '')

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (forceOpenModal) setIsModalOpen(true)
  }, [forceOpenModal])

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

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setShowDeleteConfirm(false)
    if (onCloseForcedModal) onCloseForcedModal()
  }

  const getDomain = (link: string) => {
    try { return new URL(link).hostname.replace('www.', '') } 
    catch { return 'source' }
  }

  const formatUrl = (rawUrl: string) => {
    const trimmed = rawUrl.trim()
    if (!trimmed) return ''
    return !trimmed.startsWith('http://') && !trimmed.startsWith('https://') ? 'https://' + trimmed : trimmed
  }

  // Auto-save logic on Blur (clicks away from input)
  const handleAutoSave = async () => {
    // Prevent unneeded database calls if nothing actually changed
    if (
      editTitle.trim() === (bookmark.title || '') &&
      (bookmark.type === 'note' || formatUrl(editUrl) === bookmark.url) &&
      editCategory.trim() === (bookmark.category || '') &&
      editSubCategory.trim() === (bookmark.sub_category || '') &&
      editDescription.trim() === (bookmark.description || '') &&
      editContent.trim() === (bookmark.content || '')
    ) {
      return; 
    }

    await updateBookmark(bookmark.id, {
      title: editTitle.trim() || 'Untitled',
      url: bookmark.type !== 'note' ? formatUrl(editUrl) : bookmark.url,
      category: editCategory.trim() || 'Uncategorized',
      sub_category: editSubCategory.trim() || null,
      description: editDescription.trim() || null,
      content: editContent.trim() || null
    })
    toast.success('Changes saved', { duration: 2000, position: 'bottom-center' })
  }

  const handleConfirmDelete = async () => {
    await deleteBookmark(bookmark.id)
    setShowDeleteConfirm(false)
    handleCloseModal()
  }

  const previewImageUrl = bookmark.image_url || `https://s.wordpress.com/mshots/v1/${encodeURIComponent(bookmark.url)}?w=800`
  const dateAdded = new Date(bookmark.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })

  return (
    <>
      {/* ─── MASONRY GRID CARD PREVIEW ───────────────────────────────── */}
      <div
        draggable
        onDragStart={(e) => onDragStart(e, bookmark.id)}
        onDragEnd={onDragEnd}
        onClick={() => setIsModalOpen(true)}
        className={`group relative flex flex-col w-full cursor-pointer select-none transition-all duration-300 ease-out hover:z-10 ${isDragged ? 'opacity-40 scale-95' : ''}`}
      >
        <div className={`w-full bg-white dark:bg-[#1a1b1e] border border-gray-200/60 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl dark:shadow-none transition-all duration-300`}>
          {bookmark.type === 'note' ? (
            <div className="p-6 sm:p-8 bg-[#fafafa] dark:bg-[#1a1b1e] flex flex-col items-start justify-start min-h-[120px] sm:min-h-[160px] gap-3">
              <h4 className="font-bold text-gray-900 dark:text-white truncate w-full text-sm sm:text-base">{bookmark.title}</h4>
              <p className="font-serif text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed break-words whitespace-pre-wrap line-clamp-4 w-full">
                {bookmark.content}
              </p>
            </div>
          ) : (
            <div className="w-full overflow-hidden bg-gray-100 dark:bg-black/50">
              <img 
                src={previewImageUrl} 
                alt={bookmark.title} 
                className="w-full h-auto object-cover block group-hover:scale-[1.03] transition-transform duration-700 ease-out" 
                loading="lazy" 
                onError={(e) => { ;(e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${getDomain(bookmark.url)}&background=random&size=600&font-size=0.1` }} 
              />
            </div>
          )}
        </div>
        <div className="mt-2.5 px-1 flex flex-col gap-0.5">
          <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
            {bookmark.type === 'note' ? 'Text Note' : bookmark.title}
          </p>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">
            {bookmark.type === 'note' ? dateAdded : getDomain(bookmark.url)}
          </p>
        </div>
      </div>

      {/* ─── FULL INSPECTION MODAL ────────────────────────────────────── */}
      {mounted && isModalOpen && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 md:p-8 bg-black/40 dark:bg-black/70 backdrop-blur-sm transition-opacity"
          onMouseDown={handleCloseModal} // Close on backdrop click
        >
          <div 
            className="relative w-full max-w-[1200px] h-[95vh] sm:h-[85vh] flex flex-col md:flex-row bg-white dark:bg-[#121316] rounded-2xl shadow-2xl overflow-hidden"
            onMouseDown={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
          >
            <button 
              onClick={handleCloseModal}
              className="absolute top-4 right-4 z-50 p-2 text-gray-400 hover:text-gray-800 dark:hover:text-white bg-white/50 dark:bg-black/50 backdrop-blur-md rounded-full transition-colors cursor-pointer"
            >
              <CloseIcon />
            </button>

            {/* ─── LEFT PANE: PRIMARY CONTENT / EDITABLE SNIPPET ─── */}
            <div className={`w-full md:w-[65%] h-[40%] md:h-full bg-white dark:bg-[#0a0a0c] relative flex flex-col ${bookmark.type === 'note' ? 'p-8 sm:p-12' : 'items-center justify-center p-4 sm:p-8'}`}>
              {bookmark.type === 'note' ? (
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  onBlur={handleAutoSave}
                  placeholder="Type your snippet here..."
                  className="w-full h-full bg-transparent border-none outline-none font-serif text-lg sm:text-2xl text-gray-800 dark:text-gray-200 resize-none leading-relaxed selection:bg-blue-200 dark:selection:bg-blue-900/50"
                />
              ) : bookmark.type === 'image' ? (
                <>
                  <img 
                    src={previewImageUrl} 
                    alt={bookmark.title}
                    className="w-full h-full object-contain drop-shadow-lg cursor-zoom-in"
                    onClick={() => setIsFullscreenMedia(true)}
                  />
                  <button onClick={() => setIsFullscreenMedia(true)} className="absolute bottom-6 right-6 p-2.5 bg-white/80 dark:bg-black/50 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-medium flex items-center gap-2 cursor-pointer hover:bg-white dark:hover:bg-white/10">
                    <FullscreenIcon /> Expand
                  </button>
                </>
              ) : (
                <>
                  <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="w-full h-full flex items-center justify-center group">
                    <img src={previewImageUrl} alt={bookmark.title} className="w-full h-full object-contain rounded-lg drop-shadow-xl group-hover:scale-[1.02] transition-transform duration-500 ease-out" />
                  </a>
                  <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="absolute bottom-6 right-6 px-4 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg hover:opacity-90 transition-opacity">
                    <ExternalLinkIcon /> Open Link
                  </a>
                </>
              )}
            </div>

            {/* ─── RIGHT PANE: INLINE SIDEBAR ─── */}
            <div className="w-full md:w-[35%] h-[60%] md:h-full flex flex-col bg-[#f9fafb] dark:bg-[#16171a] border-t md:border-t-0 md:border-l border-gray-100 dark:border-white/5 p-6 sm:p-8 overflow-y-auto">
              
              {/* Title & Meta */}
              <div className="mb-8 pr-8">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={handleAutoSave}
                  placeholder="Title goes here"
                  className="w-full bg-transparent border-none outline-none text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-700 mb-1"
                />
                <div className="text-xs text-gray-400 font-medium px-1 flex items-center gap-2">
                  <span>Added {dateAdded}</span>
                  {bookmark.type !== 'note' && (
                    <>
                      <span>•</span>
                      <input 
                        type="url"
                        value={editUrl}
                        onChange={(e) => setEditUrl(e.target.value)}
                        onBlur={handleAutoSave}
                        className="bg-transparent border-none outline-none text-gray-400 w-32 md:w-40 hover:text-gray-600 focus:text-gray-600 dark:focus:text-gray-300 truncate"
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Folders / Tags */}
              <div className="mb-8">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 block px-1">Mind Tags</label>
                <div className="flex flex-wrap gap-2">
                  <input
                    type="text"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    onBlur={handleAutoSave}
                    placeholder="+ Add folder"
                    className="text-xs font-medium px-4 py-2 bg-white dark:bg-[#202124] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10 rounded-full outline-none focus:border-blue-500 transition-colors shadow-sm w-32"
                  />
                  <input
                    type="text"
                    value={editSubCategory}
                    onChange={(e) => setEditSubCategory(e.target.value)}
                    onBlur={handleAutoSave}
                    placeholder="+ Subfolder"
                    className="text-xs font-medium px-4 py-2 bg-white dark:bg-[#202124] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10 rounded-full outline-none focus:border-blue-500 transition-colors shadow-sm w-32"
                  />
                </div>
              </div>

              {/* Personal Notes */}
              <div className="flex-1 flex flex-col min-h-[160px]">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 block px-1">Personal Notes</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  onBlur={handleAutoSave}
                  placeholder="Type here to add a note..."
                  className="w-full flex-1 bg-white dark:bg-[#202124] border border-gray-200 dark:border-white/10 rounded-2xl p-5 text-sm text-gray-700 dark:text-gray-300 outline-none focus:border-blue-500 resize-none shadow-sm transition-colors"
                />
              </div>

              {/* Bottom Action Bar */}
              <div className="mt-8 pt-4 flex items-center justify-end gap-2 text-gray-400">
                <button 
                  onClick={() => setShowDeleteConfirm(true)} 
                  className="p-2.5 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400 rounded-full transition-colors cursor-pointer"
                  title="Delete Item"
                >
                  <TrashIcon />
                </button>
              </div>
            </div>

            {/* ─── DELETE CONFIRMATION OVERLAY ─── */}
            {showDeleteConfirm && (
              <div 
                className="absolute inset-0 z-[100000] flex items-center justify-center p-4 bg-white/80 dark:bg-black/80 backdrop-blur-sm"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div className="w-full max-w-sm bg-white dark:bg-[#1a1b1e] border border-gray-200 dark:border-white/10 p-8 rounded-3xl shadow-2xl flex flex-col gap-4 text-center">
                  <span className="text-xl font-bold text-gray-900 dark:text-white">Delete Item?</span>
                  <p className="text-sm text-gray-500 dark:text-gray-400">This action cannot be undone.</p>
                  <div className="flex gap-3 mt-4">
                    <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white font-semibold text-sm rounded-xl hover:bg-gray-200 transition-colors cursor-pointer">
                      Cancel
                    </button>
                    <button onClick={handleConfirmDelete} className="flex-1 py-3 bg-red-500 text-white font-semibold text-sm rounded-xl hover:bg-red-600 transition-colors cursor-pointer shadow-md">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* ─── FULLSCREEN MEDIA ─── */}
      {mounted && isFullscreenMedia && bookmark.type !== 'link' && createPortal(
        <div 
          className="fixed inset-0 z-[100001] flex items-center justify-center bg-black/95 p-4 md:p-12 backdrop-blur-md cursor-zoom-out" 
          onClick={() => setIsFullscreenMedia(false)}
        >
          <button onClick={() => setIsFullscreenMedia(false)} className="absolute top-4 right-4 md:top-8 md:right-8 p-3 bg-white/10 text-white hover:bg-white/20 rounded-full cursor-pointer transition-colors">
            <CloseIcon />
          </button>
          <img src={previewImageUrl} alt={bookmark.title} className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
        </div>,
        document.body
      )}
    </>
  )
}