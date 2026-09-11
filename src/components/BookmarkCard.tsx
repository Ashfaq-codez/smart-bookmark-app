'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Bookmark } from '@/types'
import toast from 'react-hot-toast'

const TrashIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
const EditIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
const MoveIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /><path d="M12 11v6" /><path d="M9 14l3 3 3-3" /></svg>
const ExternalLinkIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
const FullscreenIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
const CloseIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>

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
  theme,
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
  const [activeModalTab, setActiveModalTab] = useState<'view' | 'edit' | 'move'>('view')

  const [editTitle, setEditTitle] = useState(bookmark.title)
  const [editUrl, setEditUrl] = useState(bookmark.url)
  const [editCategory, setEditCategory] = useState(bookmark.category || '')
  const [editSubCategory, setEditSubCategory] = useState(bookmark.sub_category || '')
  const [editDescription, setEditDescription] = useState(bookmark.description || '')

  const [moveCategory, setMoveCategory] = useState(bookmark.category || '')
  const [moveSubCategory, setMoveSubCategory] = useState(bookmark.sub_category || '')

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (forceOpenModal) {
      setIsModalOpen(true)
      setActiveModalTab('view')
    }
  }, [forceOpenModal])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullscreenMedia) {
          setIsFullscreenMedia(false)
        } else if (showDeleteConfirm) {
          setShowDeleteConfirm(false)
        } else if (isModalOpen) {
          handleCloseModal()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isModalOpen, isFullscreenMedia, showDeleteConfirm])

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setShowDeleteConfirm(false)
    setActiveModalTab('view')
    if (onCloseForcedModal) onCloseForcedModal()
  }

  const getDomain = (link: string) => {
    try {
      return new URL(link).hostname.replace('www.', '')
    } catch {
      return 'source'
    }
  }

  const formatUrl = (rawUrl: string) => {
    const trimmed = rawUrl.trim()
    return !trimmed.startsWith('http://') && !trimmed.startsWith('https://') ? 'https://' + trimmed : trimmed
  }

  const handleSaveEdit = async () => {
    if (!editTitle || !editUrl) return
    await updateBookmark(bookmark.id, {
      title: editTitle.trim(),
      url: formatUrl(editUrl),
      category: editCategory.trim() || 'Uncategorized',
      sub_category: editSubCategory.trim() || null,
      description: editDescription.trim() || null,
    })
    setActiveModalTab('view')
    toast.success('Updated successfully')
  }

  const handleSaveMove = async () => {
    await updateBookmark(bookmark.id, {
      category: moveCategory.trim() || 'Uncategorized',
      sub_category: moveSubCategory.trim() || null,
    })
    setActiveModalTab('view')
    toast.success('Moved to folder')
  }

  const handleConfirmDelete = async () => {
    await deleteBookmark(bookmark.id)
    setShowDeleteConfirm(false)
    handleCloseModal()
  }

  const previewImageUrl = bookmark.image_url || `https://s.wordpress.com/mshots/v1/${encodeURIComponent(bookmark.url)}?w=800`
  const notePrimaryContent = bookmark.title === 'Quick Note' ? bookmark.description : bookmark.title;

  const ModalPortal = () => {
    if (!mounted || !isModalOpen) return null

    return createPortal(
      <div 
        className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-6 md:p-8 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={handleCloseModal}
      >
        <div 
          className="relative w-[100vw] sm:w-[95vw] md:w-[90vw] xl:w-[80vw] max-w-[1600px] h-[95vh] sm:h-[85vh] flex flex-col md:flex-row bg-white dark:bg-gray-900 border-t-4 sm:border-4 border-gray-900 dark:border-gray-700 rounded-t-3xl sm:rounded-3xl shadow-[0_16px_48px_rgba(0,0,0,0.5)] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            onClick={handleCloseModal}
            className="absolute top-3 right-3 sm:top-5 sm:right-5 z-50 p-2 sm:p-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-900 dark:border-gray-600 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-px active:shadow-none transition-all cursor-pointer"
            title="Close (Esc)"
          >
            <CloseIcon />
          </button>

          <div className={`w-full md:w-[60%] h-[40%] sm:h-[50%] md:h-full bg-gray-50 dark:bg-[#0a0a0a] border-b-4 md:border-b-0 md:border-r-4 border-gray-900 dark:border-gray-800 relative flex shrink-0 ${bookmark.type === 'note' ? 'items-start p-6 sm:p-10 md:p-16 overflow-y-auto' : 'items-center justify-center overflow-hidden p-6 sm:p-8 md:p-12'}`}>
            {bookmark.type === 'note' ? (
              <>
                <div className="w-full h-full max-w-3xl mx-auto">
                  <p className="font-serif text-lg sm:text-xl md:text-2xl text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-wrap selection:bg-yellow-200 dark:selection:bg-yellow-900">
                    {notePrimaryContent}
                  </p>
                </div>
                <button 
                  onClick={() => setIsFullscreenMedia(true)}
                  className="absolute bottom-4 right-4 p-2 bg-white text-gray-900 border-2 border-gray-900 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <FullscreenIcon /> Fullscreen
                </button>
              </>
            ) : bookmark.type === 'image' ? (
              <>
                <img 
                  src={previewImageUrl} 
                  alt={bookmark.title}
                  className="w-full h-full object-contain cursor-zoom-in drop-shadow-xl"
                  onClick={() => setIsFullscreenMedia(true)}
                />
                <button 
                  onClick={() => setIsFullscreenMedia(true)}
                  className="absolute bottom-4 right-4 p-2 bg-white text-gray-900 border-2 border-gray-900 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <FullscreenIcon /> Fullscreen
                </button>
              </>
            ) : (
              <>
                <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="w-full h-full flex items-center justify-center group">
                  <img 
                    src={previewImageUrl} 
                    alt={bookmark.title} 
                    className="w-full h-full object-contain drop-shadow-2xl group-hover:scale-[1.02] transition-transform duration-500 ease-out" 
                  />
                </a>
                <a 
                  href={bookmark.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="absolute bottom-4 right-4 p-2 bg-white text-gray-900 border-2 border-gray-900 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:bg-yellow-300 transition-colors"
                >
                  <ExternalLinkIcon /> Open Link
                </a>
              </>
            )}
          </div>

          <div className="w-full md:w-[40%] h-[60%] sm:h-[50%] md:h-full flex flex-col p-5 sm:p-8 md:p-10 overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b-2 border-gray-200 dark:border-gray-800 mb-5 pr-12 shrink-0">
              <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-400">
                {bookmark.type ? bookmark.type.toUpperCase() : 'LINK'} DETAILS
              </span>
              <div className="flex items-center gap-2.5">
                <button 
                  onClick={() => setActiveModalTab(activeModalTab === 'edit' ? 'view' : 'edit')}
                  className={`p-2 border-2 border-gray-900 dark:border-gray-600 rounded-xl cursor-pointer transition-colors ${activeModalTab === 'edit' ? 'bg-cyan-300 text-gray-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                  title="Edit"
                >
                  <EditIcon />
                </button>
                <button 
                  onClick={() => setActiveModalTab(activeModalTab === 'move' ? 'view' : 'move')}
                  className={`p-2 border-2 border-gray-900 dark:border-gray-600 rounded-xl cursor-pointer transition-colors ${activeModalTab === 'move' ? 'bg-yellow-300 text-gray-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                  title="Move"
                >
                  <MoveIcon />
                </button>
                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2 bg-red-100 text-red-700 border-2 border-gray-900 dark:border-gray-600 rounded-xl hover:bg-red-200 cursor-pointer transition-colors"
                  title="Delete"
                >
                  <TrashIcon />
                </button>
              </div>
            </div>

            <div className="flex flex-col flex-1">
              {activeModalTab === 'edit' ? (
                <div className="flex flex-col gap-4 py-1">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1 block">Title</label>
                    <input 
                      type="text" 
                      value={editTitle} 
                      onChange={(e) => setEditTitle(e.target.value)} 
                      className="w-full px-4 py-3 text-sm font-bold border-2 border-gray-900 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-yellow-400" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1 block">Target URL</label>
                    <input 
                      type="url" 
                      value={editUrl} 
                      onChange={(e) => setEditUrl(e.target.value)} 
                      className="w-full px-4 py-3 text-xs font-mono border-2 border-gray-900 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-yellow-400" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1 block">Folder</label>
                      <input 
                        type="text" 
                        value={editCategory} 
                        onChange={(e) => setEditCategory(e.target.value)} 
                        className="w-full px-3 py-2.5 text-xs font-bold border-2 border-gray-900 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-yellow-400" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1 block">Subfolder</label>
                      <input 
                        type="text" 
                        value={editSubCategory} 
                        onChange={(e) => setEditSubCategory(e.target.value)} 
                        className="w-full px-3 py-2.5 text-xs font-bold border-2 border-dashed border-gray-500 rounded-xl bg-gray-50 dark:bg-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-yellow-400" 
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button 
                      onClick={handleSaveEdit} 
                      className="flex-1 py-3 bg-yellow-400 text-gray-900 text-xs font-black uppercase tracking-wider border-2 border-gray-900 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-y-px hover:shadow-none transition-all cursor-pointer"
                    >
                      Save Changes
                    </button>
                    <button 
                      onClick={() => setActiveModalTab('view')} 
                      className="px-5 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-bold uppercase tracking-wider border-2 border-gray-900 dark:border-gray-600 rounded-xl cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : activeModalTab === 'move' ? (
                <div className="flex flex-col gap-4 py-1">
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Move to another destination:</p>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1 block">Folder</label>
                    <input 
                      type="text" 
                      value={moveCategory} 
                      onChange={(e) => setMoveCategory(e.target.value)} 
                      className="w-full px-4 py-3 text-sm font-bold border-2 border-gray-900 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-yellow-400" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1 block">Subfolder</label>
                    <input 
                      type="text" 
                      value={moveSubCategory} 
                      onChange={(e) => setMoveSubCategory(e.target.value)} 
                      className="w-full px-4 py-3 text-sm font-bold border-2 border-dashed border-gray-500 rounded-xl bg-gray-50 dark:bg-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-yellow-400" 
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button 
                      onClick={handleSaveMove} 
                      className="flex-1 py-3 bg-yellow-400 text-gray-900 text-xs font-black uppercase tracking-wider border-2 border-gray-900 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-y-px hover:shadow-none transition-all cursor-pointer"
                    >
                      Confirm Move
                    </button>
                    <button 
                      onClick={() => setActiveModalTab('view')} 
                      className="px-5 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-bold uppercase tracking-wider border-2 border-gray-900 dark:border-gray-600 rounded-xl cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col flex-1">
                  {bookmark.type !== 'note' && (
                    <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white leading-tight mb-3">
                      {bookmark.title}
                    </h2>
                  )}
                  
                  {bookmark.type !== 'note' && (
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <a 
                        href={bookmark.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-300 dark:bg-yellow-400 text-gray-900 font-black text-[11px] uppercase tracking-wider border-2 border-gray-900 rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-px hover:shadow-none transition-all"
                      >
                        <span>Visit Link</span>
                        <ExternalLinkIcon />
                      </a>
                      <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                        {getDomain(bookmark.url)}
                      </span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-1.5 pb-4 border-b-2 border-gray-100 dark:border-gray-800">
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded border border-gray-300 dark:border-gray-700">
                      {bookmark.category || 'Inbox'}
                    </span>
                    {bookmark.sub_category && (
                      <span className="text-[10px] font-black uppercase tracking-wider text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 px-2.5 py-1 rounded border border-dashed border-gray-300 dark:border-gray-700">
                        {bookmark.sub_category}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col flex-1 min-h-[140px] gap-2 pt-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                      Personal Notes
                    </label>
                    <textarea 
                      value={editDescription} 
                      onChange={(e) => setEditDescription(e.target.value)} 
                      placeholder="Add personal thoughts or summaries distinct from the saved content..." 
                      className="w-full flex-1 p-4 text-sm font-medium text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/50 border-2 border-gray-900 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-yellow-400 resize-none transition-shadow" 
                    />
                    <button 
                      onClick={handleSaveEdit} 
                      className="self-end px-5 py-2.5 mt-3 bg-gray-900 text-white dark:bg-white dark:text-gray-900 text-xs font-black uppercase tracking-wider rounded-xl border-2 border-transparent hover:scale-[1.02] active:scale-[0.98] transition-transform cursor-pointer"
                    >
                      Save Note
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 mt-4 border-t-2 border-gray-200 dark:border-gray-800 text-[14px] font-bold text-gray-500">
              Added on {new Date(bookmark.created_at).toLocaleDateString()}
            </div>
          </div>

          {showDeleteConfirm && (
            <div 
              className="absolute inset-0 z-[100000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-full max-w-sm bg-yellow-50 dark:bg-gray-900 border-4 border-gray-900 dark:border-gray-600 p-6 rounded-3xl shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-4">
                <span className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">
                  Delete Bookmark?
                </span>
                <p className="text-sm font-bold text-gray-700 dark:text-gray-300 truncate">
                  {bookmark.title}
                </p>
                <div className="flex gap-3 mt-3">
                  <button 
                    onClick={handleConfirmDelete}
                    className="flex-1 py-3 bg-red-400 text-gray-900 font-black uppercase text-xs border-2 border-gray-900 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-y-px hover:shadow-none transition-all cursor-pointer"
                  >
                    Yes, Delete
                  </button>
                  <button 
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-black uppercase text-xs border-2 border-gray-900 dark:border-gray-600 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>,
      document.body
    )
  }

  const LightboxPortal = () => {
    if (!mounted || !isFullscreenMedia || bookmark.type === 'link') return null
    
    return createPortal(
      <div 
        className="fixed inset-0 z-[100001] flex items-center justify-center bg-black/95 p-4 md:p-12 backdrop-blur-md cursor-zoom-out" 
        onClick={() => setIsFullscreenMedia(false)}
      >
        <button 
          onClick={() => setIsFullscreenMedia(false)} 
          className="absolute top-4 right-4 md:top-8 md:right-8 p-3 bg-white text-gray-900 border-2 border-gray-900 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer hover:scale-105 transition-transform"
        >
          <CloseIcon />
        </button>
        {bookmark.type === 'note' ? (
          <div 
            className="w-full max-w-4xl max-h-[85vh] overflow-y-auto bg-white dark:bg-gray-900 p-8 md:p-16 rounded-3xl border-4 border-gray-900 dark:border-gray-700 cursor-auto shadow-2xl" 
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-serif text-lg sm:text-2xl text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-wrap selection:bg-yellow-200 dark:selection:bg-yellow-900">
              {notePrimaryContent}
            </p>
          </div>
        ) : (
          <img 
            src={previewImageUrl} 
            alt={bookmark.title} 
            className="max-w-full max-h-[90vh] object-contain rounded-lg border-2 border-white/20 shadow-2xl" 
            onClick={(e) => e.stopPropagation()} 
          />
        )}
      </div>,
      document.body
    )
  }

  return (
    <>
      <div
        draggable
        onDragStart={(e) => onDragStart(e, bookmark.id)}
        onDragEnd={onDragEnd}
        onClick={() => { setActiveModalTab('view'); setIsModalOpen(true); }}
        className={`group relative flex flex-col inline-block break-inside-avoid mb-4 sm:mb-6 w-full cursor-pointer select-none transition-all duration-300 ease-out hover:z-10 ${isDragged ? 'opacity-40 scale-95' : ''}`}
      >
        <div className={`w-full bg-white dark:bg-gray-800 border-2 sm:border-3 border-gray-900 dark:border-gray-700 rounded-xl sm:rounded-2xl overflow-hidden shadow-[3px_3px_0px_0px_rgba(17,24,39,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.15)] transition-all group-hover:-translate-y-1.5 group-hover:-rotate-1 group-hover:shadow-[6px_6px_0px_0px_rgba(17,24,39,1)] dark:group-hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.25)]`}>
          {bookmark.type === 'note' ? (
            <div className="p-4 sm:p-5 bg-[#fffdfa] dark:bg-gray-800 flex items-center justify-center min-h-[90px] sm:min-h-[120px]">
              <p className="font-serif text-xs sm:text-sm md:text-base text-gray-800 dark:text-gray-100 leading-relaxed text-center break-words whitespace-pre-wrap line-clamp-5">
                "{notePrimaryContent}"
              </p>
            </div>
          ) : (
            <div className={`w-full overflow-hidden bg-gray-100 dark:bg-gray-700 ${theme.card}`}>
              <img 
                src={previewImageUrl} 
                alt={bookmark.title} 
                className="w-full h-auto object-cover block group-hover:scale-105 transition-transform duration-300 ease-out" 
                loading="lazy" 
                onError={(e) => { 
                  ;(e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${getDomain(bookmark.url)}&background=random&size=600&font-size=0.1` 
                }} 
              />
            </div>
          )}
        </div>
        <p className="mt-2 text-center text-[11px] sm:text-xs font-bold text-gray-600 dark:text-gray-400 px-1 truncate">
          {bookmark.title}
        </p>
      </div>

      <ModalPortal />
      <LightboxPortal />
    </>
  )
}