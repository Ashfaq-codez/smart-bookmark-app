'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Bookmark } from '@/types'
import toast from 'react-hot-toast'

const TrashIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
const EditIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
const MoveIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /><path d="M12 11v6" /><path d="M9 14l3 3 3-3" /></svg>
const ExternalLinkIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
const FullscreenIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
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
  const [activeModalTab, setActiveModalTab] = useState<'view' | 'edit' | 'move'>('view')

  const [editTitle, setEditTitle] = useState(bookmark.title)
  const [editUrl, setEditUrl] = useState(bookmark.url)
  const [editCategory, setEditCategory] = useState(bookmark.category || '')
  const [editSubCategory, setEditSubCategory] = useState(bookmark.sub_category || '')
  const [editDescription, setEditDescription] = useState(bookmark.description || '')
  const [editContent, setEditContent] = useState(bookmark.content || '')
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
    if (!editTitle) return
    await updateBookmark(bookmark.id, {
      title: editTitle.trim(),
      url: bookmark.type !== 'note' ? formatUrl(editUrl) : bookmark.url,
      category: editCategory.trim() || 'Uncategorized',
      sub_category: editSubCategory.trim() || null,
      description: editDescription.trim() || null,
      content: editContent.trim() || null
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

  return (
    <>
      <div
        draggable
        onDragStart={(e) => onDragStart(e, bookmark.id)}
        onDragEnd={onDragEnd}
        onClick={() => { setActiveModalTab('view'); setIsModalOpen(true); }}
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
                onError={(e) => { 
                  ;(e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${getDomain(bookmark.url)}&background=random&size=600&font-size=0.1` 
                }} 
              />
            </div>
          )}
        </div>
        
        <div className="mt-2.5 px-1 flex flex-col gap-0.5">
          <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
            {bookmark.type === 'note' ? 'Text Note' : bookmark.title}
          </p>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">
            {bookmark.type === 'note' ? new Date(bookmark.created_at).toLocaleDateString() : getDomain(bookmark.url)}
          </p>
        </div>
      </div>

      {mounted && isModalOpen && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-6 md:p-8 bg-black/50 dark:bg-black/80 backdrop-blur-sm transition-opacity"
          onClick={handleCloseModal}
        >
          <div 
            className="relative w-full sm:w-[95vw] md:w-[90vw] xl:w-[85vw] max-w-[1600px] h-[95vh] sm:h-[85vh] flex flex-col md:flex-row bg-[#fafafa] dark:bg-[#121316] border border-gray-200/50 dark:border-white/5 rounded-3xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={handleCloseModal}
              className="absolute top-4 right-4 z-50 p-2.5 bg-white/80 dark:bg-black/50 text-gray-600 dark:text-gray-300 backdrop-blur-md border border-gray-200/50 dark:border-white/10 rounded-full hover:bg-white dark:hover:bg-white/10 transition-all cursor-pointer"
              title="Close (Esc)"
            >
              <CloseIcon />
            </button>

            <div className={`w-full md:w-[65%] h-[45%] md:h-full bg-white dark:bg-[#0a0a0c] border-b md:border-b-0 md:border-r border-gray-200/60 dark:border-white/5 relative flex shrink-0 ${bookmark.type === 'note' ? 'items-start p-8 sm:p-12 md:p-20 overflow-y-auto' : 'items-center justify-center overflow-hidden p-6 sm:p-8 md:p-12'}`}>
              {bookmark.type === 'note' ? (
                <div className="w-full h-full max-w-3xl mx-auto flex flex-col gap-4 overflow-y-auto pb-12">
                  <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white leading-tight">
                    {bookmark.title}
                  </h2>
                  <p className="font-serif text-lg sm:text-2xl md:text-3xl text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap selection:bg-blue-200 dark:selection:bg-blue-900/50">
                    {bookmark.content}
                  </p>
                  {bookmark.description && (
                     <div className="mt-8 p-5 bg-gray-100 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Personal Note</span>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-3 leading-relaxed">{bookmark.description}</p>
                     </div>
                  )}
                  <button 
                    onClick={() => setIsFullscreenMedia(true)}
                    className="fixed bottom-6 right-6 md:absolute p-2.5 bg-white/80 dark:bg-black/50 backdrop-blur-md text-gray-600 dark:text-gray-300 border border-gray-200/50 dark:border-white/10 rounded-xl text-xs font-medium flex items-center gap-2 cursor-pointer hover:bg-white dark:hover:bg-white/10 transition-colors"
                  >
                    <FullscreenIcon /> Expand
                  </button>
                </div>
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
                    className="absolute bottom-6 right-6 p-2.5 bg-white/80 dark:bg-black/50 backdrop-blur-md text-gray-600 dark:text-gray-300 border border-gray-200/50 dark:border-white/10 rounded-xl text-xs font-medium flex items-center gap-2 cursor-pointer hover:bg-white dark:hover:bg-white/10 transition-colors"
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
                      className="w-full h-full object-contain drop-shadow-2xl group-hover:scale-[1.02] transition-transform duration-700 ease-out rounded-xl" 
                    />
                  </a>
                  <a 
                    href={bookmark.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="absolute bottom-6 right-6 px-4 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity shadow-xl"
                  >
                    <ExternalLinkIcon /> Open Link
                  </a>
                </>
              )}
            </div>

            <div className="w-full md:w-[35%] h-[55%] md:h-full flex flex-col p-6 sm:p-10 overflow-y-auto">
              <div className="flex items-center justify-between pb-6 mb-6 shrink-0 border-b border-gray-200/60 dark:border-white/5">
                <span className="text-[10px] md:text-xs font-semibold uppercase tracking-widest text-gray-400">
                  {bookmark.type ? bookmark.type.toUpperCase() : 'LINK'} DETAILS
                </span>
                
                {/* 👇 FIX: Added mr-12 md:mr-10 here to push the buttons safely away from the X button */}
                <div className="flex items-center gap-2 mr-12 md:mr-10">
                  <button 
                    onClick={() => setActiveModalTab(activeModalTab === 'edit' ? 'view' : 'edit')}
                    className={`p-2 rounded-xl cursor-pointer transition-colors ${activeModalTab === 'edit' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-700 dark:hover:text-gray-200'}`}
                    title="Edit"
                  >
                    <EditIcon />
                  </button>
                  <button 
                    onClick={() => setActiveModalTab(activeModalTab === 'move' ? 'view' : 'move')}
                    className={`p-2 rounded-xl cursor-pointer transition-colors ${activeModalTab === 'move' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-700 dark:hover:text-gray-200'}`}
                    title="Move"
                  >
                    <MoveIcon />
                  </button>
                  <button 
                    onClick={() => setShowDeleteConfirm(true)}
                    className="p-2 text-red-500/80 rounded-xl hover:bg-red-500/10 hover:text-red-600 cursor-pointer transition-colors"
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
                      <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5 block">Title</label>
                      <input 
                        type="text" 
                        value={editTitle} 
                        onChange={(e) => setEditTitle(e.target.value)} 
                        className="w-full px-4 py-3 text-sm font-medium border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#1a1b1e] dark:text-white outline-none focus:border-blue-500 transition-colors shadow-sm" 
                      />
                    </div>
                    {bookmark.type !== 'note' && (
                        <div>
                          <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5 block">Target URL</label>
                          <input 
                            type="url" 
                            value={editUrl} 
                            onChange={(e) => setEditUrl(e.target.value)} 
                            className="w-full px-4 py-3 text-xs font-mono border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#1a1b1e] dark:text-white outline-none focus:border-blue-500 transition-colors shadow-sm" 
                          />
                        </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5 block">Folder</label>
                        <input 
                          type="text" 
                          value={editCategory} 
                          onChange={(e) => setEditCategory(e.target.value)} 
                          className="w-full px-3 py-3 text-sm font-medium border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#1a1b1e] dark:text-white outline-none focus:border-blue-500 transition-colors shadow-sm" 
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5 block">Subfolder</label>
                        <input 
                          type="text" 
                          value={editSubCategory} 
                          onChange={(e) => setEditSubCategory(e.target.value)} 
                          className="w-full px-3 py-3 text-sm font-medium border border-dashed border-gray-300 dark:border-white/20 rounded-xl bg-white dark:bg-[#1a1b1e] dark:text-white outline-none focus:border-blue-500 transition-colors shadow-sm" 
                        />
                      </div>
                    </div>
                    <div className="flex gap-3 pt-6">
                      <button 
                        onClick={handleSaveEdit} 
                        className="flex-1 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-xl hover:opacity-90 transition-opacity cursor-pointer shadow-md"
                      >
                        Save
                      </button>
                      <button 
                        onClick={() => setActiveModalTab('view')} 
                        className="flex-1 py-3 bg-gray-200/50 dark:bg-white/5 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl cursor-pointer hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : activeModalTab === 'move' ? (
                  <div className="flex flex-col gap-4 py-1">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Move to another destination:</p>
                    <div>
                      <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5 block">Folder</label>
                      <input 
                        type="text" 
                        value={moveCategory} 
                        onChange={(e) => setMoveCategory(e.target.value)} 
                        className="w-full px-4 py-3 text-sm font-medium border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#1a1b1e] dark:text-white outline-none focus:border-blue-500 transition-colors shadow-sm" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5 block">Subfolder</label>
                      <input 
                        type="text" 
                        value={moveSubCategory} 
                        onChange={(e) => setMoveSubCategory(e.target.value)} 
                        className="w-full px-4 py-3 text-sm font-medium border border-dashed border-gray-300 dark:border-white/20 rounded-xl bg-white dark:bg-[#1a1b1e] dark:text-white outline-none focus:border-blue-500 transition-colors shadow-sm" 
                      />
                    </div>
                    <div className="flex gap-3 pt-6">
                      <button 
                        onClick={handleSaveMove} 
                        className="flex-1 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-xl hover:opacity-90 transition-opacity cursor-pointer shadow-md"
                      >
                        Move
                      </button>
                      <button 
                        onClick={() => setActiveModalTab('view')} 
                        className="flex-1 py-3 bg-gray-200/50 dark:bg-white/5 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl cursor-pointer hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col flex-1">
                    {bookmark.type !== 'note' && (
                      <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white leading-tight mb-5">
                        {bookmark.title}
                      </h2>
                    )}

                    <div className="flex flex-wrap items-center gap-2 pb-6 border-b border-gray-200/60 dark:border-white/5">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 bg-gray-200/50 dark:bg-white/10 px-2.5 py-1 rounded-md">
                        {bookmark.category || 'Inbox'}
                      </span>
                      {bookmark.sub_category && (
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 bg-transparent px-2.5 py-1 rounded-md border border-gray-200 dark:border-white/10">
                          {bookmark.sub_category}
                        </span>
                      )}
                      {bookmark.type !== 'note' && (
                        <span className="text-[11px] font-medium text-gray-400 ml-auto">
                          {getDomain(bookmark.url)}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col flex-1 min-h-[140px] gap-2 pt-6">
                      {bookmark.type === 'note' && (
                        <>
                          <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                            Snippet Content
                          </label>
                          <textarea 
                            value={editContent} 
                            onChange={(e) => setEditContent(e.target.value)} 
                            className="w-full flex-1 p-4 mb-4 text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-[#1a1b1e] border border-gray-200/60 dark:border-white/5 rounded-xl outline-none focus:border-blue-500 resize-none transition-colors shadow-inner" 
                          />
                        </>
                      )}
                      <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                        Personal Notes
                      </label>
                      <textarea 
                        value={editDescription} 
                        onChange={(e) => setEditDescription(e.target.value)} 
                        placeholder="Add personal thoughts..." 
                        className="w-full flex-1 p-4 text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-[#1a1b1e] border border-gray-200/60 dark:border-white/5 rounded-xl outline-none focus:border-blue-500 resize-none transition-colors shadow-inner" 
                      />
                      <button 
                        onClick={handleSaveEdit} 
                        className="self-end px-6 py-2.5 mt-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-semibold rounded-xl hover:opacity-90 transition-opacity cursor-pointer shadow-md"
                      >
                        Save Note
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 mt-4 text-[10px] font-medium text-gray-400 text-center">
                Added on {new Date(bookmark.created_at).toLocaleDateString()}
              </div>
            </div>

            {showDeleteConfirm && (
              <div 
                className="absolute inset-0 z-[100000] flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-full max-w-sm bg-white dark:bg-[#1a1b1e] border border-gray-200 dark:border-white/10 p-6 rounded-3xl shadow-2xl flex flex-col gap-4">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    Delete Bookmark?
                  </span>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {bookmark.title}
                  </p>
                  <div className="flex gap-3 mt-2">
                    <button 
                      onClick={handleConfirmDelete}
                      className="flex-1 py-3 bg-red-500 text-white font-semibold text-sm rounded-xl hover:bg-red-600 transition-colors cursor-pointer shadow-md shadow-red-500/20"
                    >
                      Delete
                    </button>
                    <button 
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 py-3 bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white font-semibold text-sm rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
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
      )}

      {mounted && isFullscreenMedia && bookmark.type !== 'link' && createPortal(
        <div 
          className="fixed inset-0 z-[100001] flex items-center justify-center bg-black/95 p-4 md:p-12 backdrop-blur-md cursor-zoom-out" 
          onClick={() => setIsFullscreenMedia(false)}
        >
          <button 
            onClick={() => setIsFullscreenMedia(false)} 
            className="absolute top-4 right-4 md:top-8 md:right-8 p-3 bg-white/10 text-white hover:bg-white/20 rounded-full cursor-pointer transition-colors"
          >
            <CloseIcon />
          </button>
          {bookmark.type === 'note' ? (
            <div 
              className="w-full max-w-4xl max-h-[85vh] overflow-y-auto bg-white dark:bg-[#0f0f11] p-8 md:p-16 rounded-3xl border border-gray-200/50 dark:border-white/5 cursor-auto shadow-2xl flex flex-col gap-6" 
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 dark:text-white leading-tight">
                {bookmark.title}
              </h2>
              <p className="font-serif text-lg sm:text-2xl md:text-3xl text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-wrap selection:bg-blue-200 dark:selection:bg-blue-900/50">
                {bookmark.content}
              </p>
            </div>
          ) : (
            <img 
              src={previewImageUrl} 
              alt={bookmark.title} 
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" 
              onClick={(e) => e.stopPropagation()} 
            />
          )}
        </div>,
        document.body
      )}
    </>
  )
}