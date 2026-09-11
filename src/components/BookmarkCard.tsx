'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Bookmark } from '@/types'
import toast from 'react-hot-toast'

const TrashIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
const ExternalLinkIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
const FullscreenIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
const CloseIcon = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>

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
      {/* ─── CARD LAYOUT: FIXED OVERFLOW ─── */}
      <div draggable onDragStart={(e) => onDragStart(e, bookmark.id)} onDragEnd={onDragEnd} onClick={() => setIsModalOpen(true)} className={`group relative flex flex-col w-full min-w-0 cursor-pointer select-none transition-all duration-500 ease-out ${isDragged ? 'opacity-40 scale-95' : 'hover:-translate-y-2'}`}>
        <div className={`w-full bg-white dark:bg-[#111] rounded-[32px] overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-200 dark:border-gray-800`}>
          {bookmark.type === 'note' ? (
            <div className="p-8 sm:p-10 bg-gradient-to-br from-fuchsia-50/50 to-orange-50/50 dark:from-fuchsia-900/10 dark:to-orange-900/10 flex flex-col min-h-[160px] gap-4 w-full">
              <h4 className="font-black text-xl text-gray-900 dark:text-gray-100 tracking-tight leading-snug w-full truncate">{bookmark.title}</h4>
              <p className="font-serif text-lg text-gray-700 dark:text-gray-300 leading-relaxed break-words whitespace-pre-wrap line-clamp-4 w-full overflow-hidden">
                {bookmark.content}
              </p>
            </div>
          ) : (
            <div className="w-full overflow-hidden bg-gray-50 dark:bg-[#050505]">
              <img src={previewImageUrl} alt={bookmark.title} className="w-full h-auto object-cover block group-hover:scale-110 transition-transform duration-1000 ease-out" loading="lazy" onError={(e) => { ;(e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${getDomain(bookmark.url)}&background=random&size=600&font-size=0.1` }} />
            </div>
          )}
        </div>
        <div className="mt-4 px-2 flex flex-col gap-1 overflow-hidden min-w-0 w-full">
          <p className="text-sm font-bold uppercase tracking-widest text-gray-900 dark:text-gray-300 truncate w-full">
            {bookmark.type === 'note' ? 'Snippet' : bookmark.title}
          </p>
          <p className="text-xs font-medium text-fuchsia-500 truncate w-full">
            {bookmark.type === 'note' ? new Date(bookmark.created_at).toLocaleDateString() : getDomain(bookmark.url)}
          </p>
        </div>
      </div>

      {/* ─── MAXIMALIST INSPECTION MODAL ─── */}
      {mounted && isModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-6 md:p-12 bg-black/60 backdrop-blur-xl transition-opacity" onMouseDown={handleCloseModal}>
          <div className="relative w-full max-w-[1600px] h-[98vh] sm:h-[90vh] flex flex-col md:flex-row bg-white dark:bg-[#0a0a0a] rounded-[40px] shadow-[0_0_80px_rgba(217,70,239,0.15)] overflow-hidden border border-gray-200 dark:border-gray-800" onMouseDown={(e) => e.stopPropagation()}>
            <button onClick={handleCloseModal} className="absolute top-6 right-6 z-50 p-3 bg-white/80 dark:bg-black/50 text-gray-900 dark:text-white hover:text-fuchsia-500 backdrop-blur-xl rounded-full transition-colors shadow-lg cursor-pointer">
              <CloseIcon />
            </button>

            {/* LEFT PANE */}
            <div className={`w-full md:w-[65%] h-[45%] md:h-full bg-white dark:bg-[#050505] relative flex flex-col ${bookmark.type === 'note' ? 'overflow-hidden' : 'items-center justify-center p-8'}`}>
              {bookmark.type === 'note' ? (
                <div className="w-full h-full flex flex-col overflow-hidden">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    onBlur={handleAutoSave}
                    placeholder="Start typing your thoughts..."
                    className="w-full h-full bg-transparent p-8 sm:p-12 md:p-20 font-serif text-2xl sm:text-3xl md:text-4xl leading-loose tracking-wide text-gray-900 dark:text-gray-100 outline-none resize-none whitespace-pre-wrap transition-all selection:bg-fuchsia-200 dark:selection:bg-fuchsia-900/50"
                  />
                </div>
              ) : bookmark.type === 'image' ? (
                <>
                  <img src={previewImageUrl} alt={bookmark.title} className="w-full h-full object-contain cursor-zoom-in drop-shadow-2xl" onClick={() => setIsFullscreenMedia(true)} />
                  <button onClick={() => setIsFullscreenMedia(true)} className="absolute bottom-8 right-8 px-6 py-4 bg-white/90 dark:bg-black/90 backdrop-blur-xl text-gray-900 dark:text-white font-black uppercase tracking-widest rounded-full flex items-center gap-3 shadow-xl hover:scale-105 transition-transform cursor-pointer">
                    <FullscreenIcon /> Expand
                  </button>
                </>
              ) : (
                <>
                  <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="w-full h-full flex items-center justify-center p-4 md:p-12 group">
                    <img src={previewImageUrl} alt={bookmark.title} className="w-full h-full object-contain rounded-2xl shadow-2xl group-hover:scale-105 transition-transform duration-700 ease-out" />
                  </a>
                  <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="absolute bottom-8 right-8 px-8 py-5 bg-gradient-to-r from-fuchsia-600 to-orange-500 text-white font-black uppercase tracking-widest rounded-full shadow-2xl hover:scale-105 transition-transform flex items-center gap-3">
                    <ExternalLinkIcon /> Open Source
                  </a>
                </>
              )}
            </div>

            {/* RIGHT PANE: SIDEBAR */}
            <div className="w-full md:w-[35%] h-[55%] md:h-full flex flex-col bg-gray-50 dark:bg-[#0c0c0c] border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-800 p-8 md:p-12 overflow-y-auto">
              
              <div className="mb-12">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={handleAutoSave}
                  placeholder="Give it a title"
                  className="w-full bg-transparent border-none outline-none text-4xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tighter leading-none mb-4 placeholder-gray-300 dark:placeholder-gray-800"
                />
                <div className="text-sm font-bold text-gray-400 flex flex-col gap-3 uppercase tracking-widest">
                  <span>Saved on {new Date(bookmark.created_at).toLocaleDateString()}</span>
                  {bookmark.type !== 'note' && (
                    <input 
                      type="url"
                      value={editUrl}
                      onChange={(e) => setEditUrl(e.target.value)}
                      onBlur={handleAutoSave}
                      className="w-full bg-transparent border-b-2 border-gray-200 dark:border-gray-800 pb-2 text-fuchsia-500 outline-none focus:border-fuchsia-500 transition-colors"
                    />
                  )}
                </div>
              </div>

              <div className="mb-12">
                <label className="text-xs font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest mb-4 block">Organization</label>
                <div className="flex flex-col gap-4">
                  <input
                    type="text"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    onBlur={handleAutoSave}
                    placeholder="Folder Name"
                    className="w-full text-lg font-bold px-6 py-4 bg-white dark:bg-[#111] text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 rounded-2xl outline-none focus:ring-2 focus:ring-fuchsia-500 transition-all shadow-sm"
                  />
                  <input
                    type="text"
                    value={editSubCategory}
                    onChange={(e) => setEditSubCategory(e.target.value)}
                    onBlur={handleAutoSave}
                    placeholder="Subfolder Name"
                    className="w-full text-lg font-bold px-6 py-4 bg-white dark:bg-[#111] text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 transition-all shadow-sm"
                  />
                </div>
              </div>

              <div className="flex-1 flex flex-col min-h-[200px]">
                <label className="text-xs font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest mb-4 block">Context & Notes</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  onBlur={handleAutoSave}
                  placeholder="Why did you save this?"
                  className="w-full flex-1 bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-3xl p-6 text-lg font-medium text-gray-700 dark:text-gray-300 outline-none focus:ring-2 focus:ring-fuchsia-500 resize-none shadow-sm transition-all leading-relaxed"
                />
              </div>

              <div className="mt-10 flex items-center justify-end">
                <button 
                  onClick={() => setShowDeleteConfirm(true)} 
                  className="px-6 py-4 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 font-black uppercase tracking-widest rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex items-center gap-3 cursor-pointer"
                >
                  <TrashIcon /> Delete
                </button>
              </div>
            </div>

            {/* Delete Overlay */}
            {showDeleteConfirm && (
              <div className="absolute inset-0 z-[100000] flex items-center justify-center p-4 bg-white/90 dark:bg-black/90 backdrop-blur-xl" onMouseDown={(e) => e.stopPropagation()}>
                <div className="w-full max-w-md flex flex-col gap-8 text-center">
                  <span className="text-5xl font-black uppercase text-gray-900 dark:text-white tracking-tighter">Obliterate?</span>
                  <div className="flex flex-col gap-4 mt-4">
                    <button onClick={handleConfirmDelete} className="w-full py-5 bg-red-600 text-white font-black uppercase tracking-widest rounded-full hover:scale-105 transition-transform shadow-xl cursor-pointer">Confirm Destruction</button>
                    <button onClick={() => setShowDeleteConfirm(false)} className="w-full py-5 bg-gray-200 dark:bg-gray-900 text-gray-900 dark:text-white font-black uppercase tracking-widest rounded-full hover:bg-gray-300 dark:hover:bg-gray-800 transition-colors cursor-pointer">Retreat</button>
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
        <div className="fixed inset-0 z-[100001] flex items-center justify-center bg-black/95 p-4 md:p-12 backdrop-blur-3xl cursor-zoom-out" onClick={() => setIsFullscreenMedia(false)}>
          <button onClick={() => setIsFullscreenMedia(false)} className="absolute top-6 right-6 md:top-12 md:right-12 p-4 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors backdrop-blur-md">
            <CloseIcon />
          </button>
          <img src={previewImageUrl} alt={bookmark.title} className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()} />
        </div>,
        document.body
      )}
    </>
  )
}