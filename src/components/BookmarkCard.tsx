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
    toast.success('SYS_UPDATED', { style: { background: '#000', color: '#0ff', border: '1px solid #0ff' } })
  }

  const handleConfirmDelete = async () => { await deleteBookmark(bookmark.id); setShowDeleteConfirm(false); handleCloseModal() }

  const previewImageUrl = bookmark.image_url || `https://s.wordpress.com/mshots/v1/${encodeURIComponent(bookmark.url)}?w=800`

  return (
    <>
      {/* ─── Y2K GRID CARD PREVIEW ─── */}
      <div draggable onDragStart={(e) => onDragStart(e, bookmark.id)} onDragEnd={onDragEnd} onClick={() => setIsModalOpen(true)} className={`group relative flex flex-col w-full min-w-0 cursor-pointer select-none transition-all duration-300 ease-out ${isDragged ? 'opacity-40 scale-95' : 'hover:-translate-y-1'}`}>
        <div className={`w-full bg-[#00111a] rounded-xl overflow-hidden shadow-[0_4px_15px_rgba(0,0,0,0.5)] hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all duration-300 border border-cyan-800 hover:border-cyan-400 relative`}>
          
          {/* Subtle Y2K Inner Bevel/Glow */}
          <div className="absolute inset-0 border-t border-white/10 rounded-xl pointer-events-none z-10" />

          {bookmark.type === 'note' ? (
            <div className="p-6 bg-gradient-to-br from-[#001a2c] to-[#00050a] flex flex-col min-h-[140px] gap-3 w-full">
              <h4 className="font-mono text-sm text-cyan-300 tracking-tight leading-snug w-full truncate">{bookmark.title}</h4>
              
              {/* FIX: whitespace-pre-wrap ensures proper formatting from source! */}
              <p className="font-sans text-sm text-cyan-600/90 leading-relaxed whitespace-pre-wrap break-words line-clamp-4 w-full">
                {bookmark.content}
              </p>
            </div>
          ) : (
            <div className="w-full overflow-hidden bg-black border-b border-cyan-900/50">
              <img src={previewImageUrl} alt={bookmark.title} className="w-full h-auto object-cover block group-hover:scale-[1.03] transition-transform duration-700 ease-out opacity-80 group-hover:opacity-100 filter contrast-[1.1]" loading="lazy" onError={(e) => { ;(e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${getDomain(bookmark.url)}&background=random&size=600&font-size=0.1` }} />
            </div>
          )}
        </div>
        <div className="mt-3 px-1 flex items-center justify-between overflow-hidden min-w-0 w-full opacity-80 group-hover:opacity-100 transition-opacity">
          <p className="text-[11px] font-mono uppercase text-gray-400 truncate max-w-[65%]">
            {bookmark.type === 'note' ? 'TXT_DATA' : bookmark.title}
          </p>
          <p className="text-[10px] font-mono text-fuchsia-500 truncate shrink-0 drop-shadow-[0_0_2px_rgba(217,70,239,0.8)]">
            {bookmark.type === 'note' ? new Date(bookmark.created_at).toLocaleDateString() : getDomain(bookmark.url)}
          </p>
        </div>
      </div>

      {/* ─── Y2K INSPECTION MODAL ─── */}
      {mounted && isModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 md:p-8 bg-black/60 backdrop-blur-sm transition-opacity" onMouseDown={handleCloseModal}>
          <div className="relative w-full max-w-[1300px] h-[95vh] sm:h-[85vh] flex flex-col md:flex-row bg-[#020813] rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.15)] overflow-hidden border border-cyan-500/50" onMouseDown={(e) => e.stopPropagation()}>
            
            {/* Modal Close Button */}
            <button onClick={handleCloseModal} className="absolute top-4 right-4 z-50 p-2 bg-black/80 text-cyan-400 border border-cyan-800 hover:border-cyan-400 hover:text-white hover:bg-cyan-900/50 hover:shadow-[0_0_10px_#0ff] backdrop-blur-md rounded transition-all cursor-pointer">
              <CloseIcon />
            </button>

            {/* LEFT PANE: CONTENT PREVIEW */}
            <div className={`w-full md:w-[65%] h-[40%] md:h-full bg-black relative flex flex-col ${bookmark.type === 'note' ? 'overflow-hidden' : 'items-center justify-center border-b md:border-b-0 md:border-r border-cyan-900'}`}>
              {bookmark.type === 'note' ? (
                <div className="w-full h-full flex flex-col bg-[linear-gradient(to_right,#06b6d411_1px,transparent_1px),linear-gradient(to_bottom,#06b6d411_1px,transparent_1px)] bg-[size:24px_24px]">
                  
                  {/* FIX: Proper text formatting container */}
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    onBlur={handleAutoSave}
                    placeholder="[ ENTER_DATA_STRING ]"
                    className="w-full h-full bg-transparent p-6 sm:p-10 font-sans text-base sm:text-lg leading-relaxed text-cyan-100 outline-none resize-none whitespace-pre-wrap selection:bg-cyan-500/30"
                  />
                </div>
              ) : bookmark.type === 'image' ? (
                <>
                  <img src={previewImageUrl} alt={bookmark.title} className="w-full h-full object-contain cursor-zoom-in drop-shadow-[0_0_30px_rgba(0,0,0,0.8)]" onClick={() => setIsFullscreenMedia(true)} />
                  <button onClick={() => setIsFullscreenMedia(true)} className="absolute bottom-6 right-6 px-4 py-2 bg-black/80 backdrop-blur-md text-cyan-400 font-mono text-xs uppercase border border-cyan-700 hover:border-cyan-300 flex items-center gap-2 shadow-[0_0_15px_rgba(0,0,0,0.8)] cursor-pointer transition-colors">
                    <FullscreenIcon /> Expand
                  </button>
                </>
              ) : (
                <>
                  <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="w-full h-full flex items-center justify-center p-6 group">
                    <img src={previewImageUrl} alt={bookmark.title} className="w-full h-full object-contain shadow-[0_0_40px_rgba(0,0,0,0.8)] group-hover:scale-[1.02] transition-transform duration-700 ease-out" />
                  </a>
                  <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="absolute bottom-6 right-6 px-5 py-3 bg-gradient-to-b from-cyan-600 to-cyan-800 border border-cyan-400 text-white font-mono text-xs uppercase tracking-widest shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:shadow-[0_0_20px_rgba(6,182,212,0.6)] flex items-center gap-2 transition-all">
                    <ExternalLinkIcon /> Open Source
                  </a>
                </>
              )}
            </div>

            {/* RIGHT PANE: SIDEBAR */}
            <div className="w-full md:w-[35%] h-[60%] md:h-full flex flex-col bg-[#010b14] border-t md:border-t-0 md:border-l border-cyan-900 p-6 sm:p-8 overflow-y-auto">
              
              <div className="mb-8">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={handleAutoSave}
                  placeholder="ENTRY_TITLE"
                  className="w-full bg-transparent border-none outline-none text-xl sm:text-2xl font-sans font-medium text-gray-100 mb-2 placeholder-gray-600 focus:text-cyan-300 transition-colors"
                />
                <div className="text-[10px] font-mono text-gray-500 flex flex-col gap-2">
                  <span>LOGGED: {new Date(bookmark.created_at).toLocaleDateString()}</span>
                  {bookmark.type !== 'note' && (
                    <input 
                      type="url"
                      value={editUrl}
                      onChange={(e) => setEditUrl(e.target.value)}
                      onBlur={handleAutoSave}
                      className="w-full bg-black border border-cyan-900/50 p-2 text-cyan-600 outline-none focus:border-cyan-500 transition-colors rounded"
                    />
                  )}
                </div>
              </div>

              <div className="mb-8">
                <label className="text-[10px] font-mono text-cyan-600 uppercase tracking-widest mb-3 block drop-shadow-[0_0_2px_rgba(6,182,212,0.5)]">Directories</label>
                <div className="flex flex-col gap-3">
                  <input
                    type="text"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    onBlur={handleAutoSave}
                    placeholder="FOLDER"
                    className="w-full text-sm font-sans px-4 py-2 bg-black text-cyan-100 border border-cyan-900 rounded outline-none focus:border-cyan-400 focus:shadow-[0_0_10px_rgba(6,182,212,0.2)] transition-all"
                  />
                  <input
                    type="text"
                    value={editSubCategory}
                    onChange={(e) => setEditSubCategory(e.target.value)}
                    onBlur={handleAutoSave}
                    placeholder="SUBFOLDER"
                    className="w-full text-sm font-sans px-4 py-2 bg-black text-cyan-100 border border-cyan-900 rounded outline-none focus:border-cyan-400 focus:shadow-[0_0_10px_rgba(6,182,212,0.2)] transition-all"
                  />
                </div>
              </div>

              <div className="flex-1 flex flex-col min-h-[160px]">
                <label className="text-[10px] font-mono text-fuchsia-600 uppercase tracking-widest mb-3 block drop-shadow-[0_0_2px_rgba(217,70,239,0.5)]">Personal Notes</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  onBlur={handleAutoSave}
                  placeholder="APPEND_DATA..."
                  className="w-full flex-1 bg-black border border-fuchsia-900/50 rounded p-4 text-sm font-sans text-gray-300 outline-none focus:border-fuchsia-500 focus:shadow-[0_0_10px_rgba(217,70,239,0.2)] resize-none transition-all leading-relaxed"
                />
              </div>

              <div className="mt-8 flex items-center justify-end">
                <button 
                  onClick={() => setShowDeleteConfirm(true)} 
                  className="px-4 py-2 bg-transparent text-red-500 font-mono text-xs border border-red-900 hover:border-red-500 hover:bg-red-900/20 hover:shadow-[0_0_10px_rgba(239,68,68,0.4)] rounded transition-all flex items-center gap-2"
                >
                  <TrashIcon /> PURGE
                </button>
              </div>
            </div>

            {/* Y2K Delete Overlay */}
            {showDeleteConfirm && (
              <div className="absolute inset-0 z-[100000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onMouseDown={(e) => e.stopPropagation()}>
                <div className="w-full max-w-sm bg-[#00050a] border border-red-600 p-8 shadow-[0_0_30px_rgba(220,38,38,0.3)] flex flex-col gap-6 text-center rounded">
                  <span className="text-xl font-mono uppercase text-red-500 drop-shadow-[0_0_5px_rgba(220,38,38,0.8)]">Confirm Purge?</span>
                  <div className="flex flex-col gap-3 mt-2">
                    <button onClick={handleConfirmDelete} className="w-full py-3 bg-red-600 text-white font-mono text-sm uppercase rounded hover:bg-red-500 hover:shadow-[0_0_15px_rgba(220,38,38,0.8)] transition-all">EXECUTE</button>
                    <button onClick={() => setShowDeleteConfirm(false)} className="w-full py-3 bg-transparent border border-cyan-800 text-cyan-500 font-mono text-sm uppercase rounded hover:border-cyan-400 hover:text-cyan-300 transition-colors">ABORT</button>
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
          <button onClick={() => setIsFullscreenMedia(false)} className="absolute top-4 right-4 md:top-8 md:right-8 p-3 bg-black text-cyan-400 border border-cyan-800 hover:border-cyan-400 rounded transition-colors shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <CloseIcon />
          </button>
          <img src={previewImageUrl} alt={bookmark.title} className="max-w-full max-h-[90vh] object-contain shadow-[0_0_40px_rgba(0,0,0,0.8)] border border-cyan-900/30" onClick={(e) => e.stopPropagation()} />
        </div>,
        document.body
      )}
    </>
  )
}