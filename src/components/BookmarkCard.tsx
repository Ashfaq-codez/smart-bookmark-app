'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Bookmark } from '@/types'
import toast from 'react-hot-toast'

const TrashIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
const ExternalLinkIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
const FullscreenIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
const CloseIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12" /></svg>

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
      {/* ─── MASONRY GRID CARD PREVIEW ─── */}
      <div
        draggable
        onDragStart={(e) => onDragStart(e, bookmark.id)}
        onDragEnd={onDragEnd}
        onClick={() => setIsModalOpen(true)}
        className={`group relative flex flex-col w-full cursor-pointer select-none transition-all duration-200 ease-out ${isDragged ? 'opacity-40 scale-95' : ''}`}
      >
        {/* Brutalist Main Card style */}
        <div className={`w-full bg-white dark:bg-[#121212] border-4 border-black dark:border-white rounded-lg overflow-hidden shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all`}>
          {bookmark.type === 'note' ? (
            <div className="p-6 bg-[#f4f4f0] dark:bg-[#1a1b1e] flex flex-col min-h-[120px] gap-3">
              <h4 className="font-black text-black dark:text-white uppercase tracking-wide truncate w-full">{bookmark.title}</h4>
              <p className="font-medium text-black dark:text-gray-300 leading-relaxed break-words whitespace-pre-wrap line-clamp-4 w-full">
                {bookmark.content}
              </p>
            </div>
          ) : (
            <div className="w-full overflow-hidden border-b-4 border-black dark:border-white bg-[#f4f4f0] dark:bg-black/50">
              <img 
                src={previewImageUrl} 
                alt={bookmark.title} 
                className="w-full h-auto object-cover block" 
                loading="lazy" 
                onError={(e) => { ;(e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${getDomain(bookmark.url)}&background=random&size=600&font-size=0.1` }} 
              />
            </div>
          )}
        </div>
        <div className="mt-3 px-1 flex flex-col gap-1">
          <p className="text-sm font-black uppercase tracking-wide text-black dark:text-white truncate">
            {bookmark.type === 'note' ? 'Text Note' : bookmark.title}
          </p>
          {/* <p className="text-xs font-bold text-gray-500 dark:text-gray-400 truncate">
            {bookmark.type === 'note' ? dateAdded : getDomain(bookmark.url)}
          </p> */}
        </div>
      </div>

      {/* ─── NEO-BRUTALIST FULL INSPECTION MODAL ─── */}
      {mounted && isModalOpen && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 md:p-10 bg-black/60 dark:bg-black/80 backdrop-blur-sm transition-opacity"
          onMouseDown={handleCloseModal} 
        >
          <div 
            className="relative w-full max-w-[1300px] h-[95vh] sm:h-[85vh] flex flex-col md:flex-row bg-white dark:bg-[#121212] border-4 border-black dark:border-white rounded-xl shadow-[12px_12px_0_0_#000] dark:shadow-[12px_12px_0_0_#fff] overflow-hidden"
            onMouseDown={(e) => e.stopPropagation()} 
          >
            {/* Brutalist Close Button */}
            <button 
              onClick={handleCloseModal}
              className="absolute top-4 right-4 z-50 p-2 bg-yellow-400 text-black border-4 border-black shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all cursor-pointer font-black"
            >
              <CloseIcon />
            </button>

            {/* ─── LEFT PANE: PRIMARY CONTENT / EDITABLE SNIPPET ─── */}
            <div className={`w-full md:w-[65%] h-[40%] md:h-full bg-white dark:bg-[#0a0a0c] border-b-4 md:border-b-0 md:border-r-4 border-black dark:border-white relative flex flex-col ${bookmark.type === 'note' ? 'p-6 sm:p-12' : 'items-center justify-center'}`}>
              {bookmark.type === 'note' ? (
                <div className="w-full h-full flex flex-col">
                  <label className="text-xs font-black uppercase tracking-widest text-black dark:text-white mb-4 block">Saved Snippet</label>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    onBlur={handleAutoSave}
                    placeholder="Type your snippet here..."
                    className="w-full flex-1 bg-[#f4f4f0] dark:bg-[#1a1a1a] p-6 border-4 border-black dark:border-white shadow-[6px_6px_0_0_#000] dark:shadow-[6px_6px_0_0_#fff] outline-none font-medium text-lg sm:text-2xl text-black dark:text-white resize-none focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-none transition-all"
                  />
                </div>
              ) : bookmark.type === 'image' ? (
                <>
                  <img 
                    src={previewImageUrl} 
                    alt={bookmark.title}
                    className="w-full h-full object-contain cursor-zoom-in"
                    onClick={() => setIsFullscreenMedia(true)}
                  />
                  <button onClick={() => setIsFullscreenMedia(true)} className="absolute bottom-6 right-6 px-4 py-2 bg-cyan-400 text-black font-black uppercase border-4 border-black shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center gap-2 cursor-pointer">
                    <FullscreenIcon /> Expand
                  </button>
                </>
              ) : (
                <>
                  <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="w-full h-full flex items-center justify-center p-8 bg-pink-50 dark:bg-black">
                    <img src={previewImageUrl} alt={bookmark.title} className="w-full h-full object-contain border-4 border-black dark:border-white shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_#fff] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all" />
                  </a>
                  <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="absolute bottom-8 right-8 px-5 py-3 bg-cyan-400 text-black font-black uppercase border-4 border-black shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center gap-2">
                    <ExternalLinkIcon /> Open Link
                  </a>
                </>
              )}
            </div>

            {/* ─── RIGHT PANE: INLINE SIDEBAR ─── */}
            <div className="w-full md:w-[35%] h-[60%] md:h-full flex flex-col bg-[#f4f4f0] dark:bg-[#121212] p-6 sm:p-10 overflow-y-auto">
              
              {/* Title & Meta */}
              <div className="mb-10 pr-8">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={handleAutoSave}
                  placeholder="Title goes here"
                  className="w-full bg-white dark:bg-[#1a1a1a] border-4 border-black dark:border-white p-3 text-xl font-black text-black dark:text-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-none transition-all outline-none mb-3"
                />
                <div className="text-xs font-black uppercase text-gray-500 flex flex-col gap-2">
                  <span>Added: {dateAdded}</span>
                  {bookmark.type !== 'note' && (
                    <div className="flex items-center gap-2">
                      <span>URL:</span>
                      <input 
                        type="url"
                        value={editUrl}
                        onChange={(e) => setEditUrl(e.target.value)}
                        onBlur={handleAutoSave}
                        className="flex-1 bg-white dark:bg-[#1a1a1a] border-2 border-black dark:border-white p-2 text-black dark:text-white shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff] outline-none"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Folders / Tags */}
              <div className="mb-10">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 block">Mind Tags</label>
                <div className="flex flex-col gap-3">
                  <input
                    type="text"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    onBlur={handleAutoSave}
                    placeholder="+ Add folder"
                    className="w-full text-sm font-bold px-4 py-3 bg-cyan-100 dark:bg-cyan-900 text-black dark:text-white border-4 border-black dark:border-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-none transition-all outline-none"
                  />
                  <input
                    type="text"
                    value={editSubCategory}
                    onChange={(e) => setEditSubCategory(e.target.value)}
                    onBlur={handleAutoSave}
                    placeholder="+ Subfolder"
                    className="w-full text-sm font-bold px-4 py-3 bg-pink-100 dark:bg-pink-900 text-black dark:text-white border-4 border-black dark:border-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-none transition-all outline-none"
                  />
                </div>
              </div>

              {/* Personal Notes */}
              <div className="flex-1 flex flex-col min-h-[180px]">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 block">Personal Notes</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  onBlur={handleAutoSave}
                  placeholder="Type here to add a note..."
                  className="w-full flex-1 bg-white dark:bg-[#1a1a1a] border-4 border-black dark:border-white p-5 text-sm font-medium text-black dark:text-white outline-none shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-none transition-all resize-none"
                />
              </div>

              {/* Bottom Action Bar */}
              <div className="mt-8 pt-4 flex items-center justify-end">
                <button 
                  onClick={() => setShowDeleteConfirm(true)} 
                  className="px-4 py-2 bg-red-500 text-black font-black uppercase border-4 border-black shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center gap-2"
                >
                  <TrashIcon /> Delete
                </button>
              </div>
            </div>

            {/* ─── BRUTALIST DELETE CONFIRMATION OVERLAY ─── */}
            {showDeleteConfirm && (
              <div 
                className="absolute inset-0 z-[100000] flex items-center justify-center p-4 bg-white/80 dark:bg-black/80 backdrop-blur-sm"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div className="w-full max-w-sm bg-white dark:bg-[#121212] border-4 border-black dark:border-white p-8 shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_#fff] flex flex-col gap-6 text-center">
                  <span className="text-2xl font-black uppercase text-black dark:text-white">Delete Item?</span>
                  <p className="text-sm font-bold text-gray-600 dark:text-gray-400">THIS ACTION CANNOT BE UNDONE.</p>
                  <div className="flex flex-col gap-3 mt-2">
                    <button onClick={handleConfirmDelete} className="w-full py-4 bg-red-500 text-black font-black uppercase border-4 border-black shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
                      Confirm Delete
                    </button>
                    <button onClick={() => setShowDeleteConfirm(false)} className="w-full py-4 bg-gray-200 dark:bg-gray-800 text-black dark:text-white font-black uppercase border-4 border-black dark:border-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
                      Cancel
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
          <button onClick={() => setIsFullscreenMedia(false)} className="absolute top-4 right-4 md:top-8 md:right-8 p-3 bg-yellow-400 text-black border-4 border-black shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all cursor-pointer">
            <CloseIcon />
          </button>
          <img src={previewImageUrl} alt={bookmark.title} className="max-w-full max-h-[90vh] object-contain border-4 border-white shadow-[8px_8px_0_0_#fff]" onClick={(e) => e.stopPropagation()} />
        </div>,
        document.body
      )}
    </>
  )
}