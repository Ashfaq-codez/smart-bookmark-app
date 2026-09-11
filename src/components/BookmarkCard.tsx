'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Bookmark } from '@/types'
import toast from 'react-hot-toast'

const TrashIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
const ExternalLinkIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
const FullscreenIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
const CloseIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>

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
    toast.success('Updated', { style: { background: '#eaf2f9', color: '#2c4054', border: '1px solid #a9cbed' }, iconTheme: { primary: '#609ad3', secondary: '#fff' } })
  }

  const handleConfirmDelete = async () => { await deleteBookmark(bookmark.id); setShowDeleteConfirm(false); handleCloseModal() }

  const previewImageUrl = bookmark.image_url || `https://s.wordpress.com/mshots/v1/${encodeURIComponent(bookmark.url)}?w=800`

  return (
    <>
      {/* ─── FRUTIGER AERO CARD PANEL ─── */}
      <div draggable onDragStart={(e) => onDragStart(e, bookmark.id)} onDragEnd={onDragEnd} onClick={() => setIsModalOpen(true)} className={`group relative flex flex-col w-full min-w-0 cursor-pointer select-none transition-transform duration-200 ${isDragged ? 'opacity-40 scale-95' : 'hover:-translate-y-[2px]'}`}>
        
        <div className="w-full bg-white/70 dark:bg-[#151c28]/80 backdrop-blur-md border border-white/80 dark:border-[#2a3f5a] rounded-lg shadow-[0_4px_10px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.6)] overflow-hidden flex flex-col min-w-0">
          
          {/* Card Window Header */}
          <div className="bg-gradient-to-b from-[#f2f7fc] to-[#dae8f5] dark:from-[#213045] dark:to-[#1a2332] border-b border-[#a9cbed] dark:border-[#2a3f5a] px-2 py-1 flex items-center justify-between">
            <span className="font-mono text-[9px] text-[#4a6b8c] dark:text-[#8ea4bd] tracking-widest uppercase truncate min-w-0">
              ++ {bookmark.type === 'note' ? 'content' : 'link'}.panel //
            </span>
          </div>

          {bookmark.type === 'note' ? (
            <div className="p-4 flex flex-col min-w-0 gap-2 w-full">
              <span className="text-[11px] font-bold text-[#324a66] dark:text-gray-200 uppercase tracking-widest truncate w-full">{bookmark.title}</span>
              {/* FIX: whitespace-pre-wrap ensures formatting is preserved from source */}
              <p className="text-xs font-mono text-[#4a6b8c] dark:text-[#8ea4bd] leading-relaxed whitespace-pre-wrap break-words line-clamp-6 w-full">
                {bookmark.content}
              </p>
            </div>
          ) : (
            <div className="w-full flex flex-col min-w-0">
              <div className="w-full relative overflow-hidden bg-[#e1eef9] dark:bg-[#0d1620] border-b border-[#c3d7eb] dark:border-[#2a3f5a]">
                <img src={previewImageUrl} alt={bookmark.title} className="w-full h-auto object-cover block group-hover:scale-[1.03] transition-transform duration-500 ease-out opacity-90 group-hover:opacity-100 mix-blend-multiply dark:mix-blend-normal" loading="lazy" onError={(e) => { ;(e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${getDomain(bookmark.url)}&background=random&size=600&font-size=0.1` }} />
              </div>
              <div className="p-3 flex flex-col min-w-0">
                <h4 className="text-xs font-medium text-[#2c4054] dark:text-gray-200 truncate w-full">{bookmark.title}</h4>
                <p className="text-[10px] text-[#5e81a5] font-mono truncate w-full mt-0.5">{getDomain(bookmark.url)}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── GLOSSY MODAL WINDOW ─── */}
      {mounted && isModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 md:p-8 bg-[#1a2332]/40 backdrop-blur-md transition-opacity" onMouseDown={handleCloseModal}>
          
          <div className="relative w-full max-w-[1100px] h-[95vh] sm:h-[85vh] flex flex-col md:flex-row bg-white/95 dark:bg-[#151c28]/95 backdrop-blur-xl border border-white dark:border-[#2a3f5a] shadow-[0_10px_40px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.8)] rounded-xl overflow-hidden" onMouseDown={(e) => e.stopPropagation()}>
            
            {/* Modal Close Box */}
            <button onClick={handleCloseModal} className="absolute top-2 right-2 z-50 p-1.5 bg-gradient-to-b from-[#fceced] to-[#fad2d5] border border-[#f1aab0] text-[#c53030] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] rounded flex items-center justify-center cursor-pointer hover:from-[#fad2d5] hover:to-[#f1aab0]">
              <CloseIcon />
            </button>

            {/* LEFT PANE: CONTENT PREVIEW */}
            <div className={`w-full md:w-[65%] h-[40%] md:h-full bg-[#f2f7fc] dark:bg-[#0d1620] relative flex flex-col border-b md:border-b-0 md:border-r border-[#c3d7eb] dark:border-[#2a3f5a] shadow-[inset_0_1px_4px_rgba(0,0,0,0.05)] ${bookmark.type === 'note' ? 'overflow-hidden' : 'items-center justify-center'}`}>
              
              <div className="w-full bg-gradient-to-b from-[#eaf2f9] to-[#d1e2f3] dark:from-[#213045] dark:to-[#1a2332] border-b border-[#a9cbed] dark:border-[#2a3f5a] px-3 py-1.5 flex items-center">
                <span className="font-mono text-[10px] text-[#4a6b8c] dark:text-[#8ea4bd] tracking-widest uppercase">++ main.panel //</span>
              </div>

              {bookmark.type === 'note' ? (
                <div className="w-full h-full flex flex-col overflow-hidden">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    onBlur={handleAutoSave}
                    placeholder="[ Input Data Stream ]"
                    className="w-full h-full bg-transparent p-6 sm:p-10 font-mono text-sm sm:text-base leading-relaxed text-[#2c4054] dark:text-gray-300 outline-none resize-none whitespace-pre-wrap selection:bg-[#a9cbed] dark:selection:bg-[#3a526b]"
                  />
                </div>
              ) : bookmark.type === 'image' ? (
                <div className="w-full h-full p-4 relative flex items-center justify-center">
                  <img src={previewImageUrl} alt={bookmark.title} className="w-full h-full object-contain cursor-zoom-in drop-shadow-md" onClick={() => setIsFullscreenMedia(true)} />
                  <button onClick={() => setIsFullscreenMedia(true)} className="absolute bottom-4 right-4 px-3 py-1.5 bg-gradient-to-b from-white to-[#eef4f9] border border-[#a9cbed] text-[#4a6b8c] text-[10px] font-bold uppercase rounded shadow-[0_2px_4px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.8)] flex items-center gap-1.5 cursor-pointer">
                    <FullscreenIcon /> Expand
                  </button>
                </div>
              ) : (
                <div className="w-full h-full p-6 sm:p-10 flex items-center justify-center relative">
                  <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="w-full h-full flex items-center justify-center group">
                    <img src={previewImageUrl} alt={bookmark.title} className="w-full h-full object-contain shadow-[0_4px_15px_rgba(0,0,0,0.1)] border border-[#c3d7eb] dark:border-[#2a3f5a] rounded-sm group-hover:scale-[1.02] transition-transform duration-500 ease-out bg-white dark:bg-[#151c28]" />
                  </a>
                  <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="absolute bottom-6 right-6 px-4 py-2 bg-gradient-to-b from-[#609ad3] to-[#3a75b0] border border-[#2f5b89] text-white text-[10px] font-bold uppercase tracking-widest rounded shadow-[0_2px_6px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.4)] hover:from-[#7cb3eb] hover:to-[#4a85c0] flex items-center gap-2 transition-all">
                    <ExternalLinkIcon /> Open Source
                  </a>
                </div>
              )}
            </div>

            {/* RIGHT PANE (METADATA) */}
            <div className="w-full md:w-[35%] h-[60%] md:h-full flex flex-col bg-[#fdfdfe] dark:bg-[#1a2332] overflow-y-auto">
              
              <div className="bg-gradient-to-b from-[#eaf2f9] to-[#d1e2f3] dark:from-[#213045] dark:to-[#1a2332] border-b border-[#a9cbed] dark:border-[#2a3f5a] px-3 py-1.5 flex items-center mb-6">
                <span className="font-mono text-[10px] text-[#4a6b8c] dark:text-[#8ea4bd] tracking-widest uppercase">++ meta.panel //</span>
              </div>

              <div className="px-6 pb-6 flex flex-col gap-6">
                
                <div className="flex flex-col gap-1">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={handleAutoSave}
                    placeholder="Entry Title"
                    className="w-full bg-transparent border-b border-[#c3d7eb] dark:border-[#3a526b] outline-none text-lg font-semibold text-[#2c4054] dark:text-white pb-1 focus:border-[#609ad3] transition-colors"
                  />
                  <div className="text-[10px] font-mono text-[#7999b8] flex flex-col gap-1 mt-1">
                    <span>Logged: {new Date(bookmark.created_at).toLocaleDateString()}</span>
                    {bookmark.type !== 'note' && (
                      <input 
                        type="url"
                        value={editUrl}
                        onChange={(e) => setEditUrl(e.target.value)}
                        onBlur={handleAutoSave}
                        className="w-full bg-transparent border-none outline-none text-[#5e81a5] truncate focus:text-[#2c4054] dark:focus:text-gray-200 transition-colors"
                      />
                    )}
                  </div>
                </div>

                <div className="p-3 bg-[#f2f7fc] dark:bg-[#151c28] border border-[#c3d7eb] dark:border-[#2a3f5a] rounded shadow-[inset_0_1px_3px_rgba(0,0,0,0.02)] flex flex-col gap-3">
                  <label className="text-[9px] font-mono text-[#4a6b8c] uppercase tracking-widest block">/ directories</label>
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      onBlur={handleAutoSave}
                      placeholder="root_folder"
                      className="w-full text-xs font-sans px-3 py-2 bg-white dark:bg-[#0d1620] text-[#2c4054] dark:text-gray-300 border border-[#a9cbed] dark:border-[#3a526b] rounded-sm outline-none focus:border-[#609ad3] transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
                    />
                    <input
                      type="text"
                      value={editSubCategory}
                      onChange={(e) => setEditSubCategory(e.target.value)}
                      onBlur={handleAutoSave}
                      placeholder="sub_folder"
                      className="w-full text-xs font-sans px-3 py-2 bg-white dark:bg-[#0d1620] text-[#2c4054] dark:text-gray-300 border border-[#a9cbed] dark:border-[#3a526b] rounded-sm outline-none focus:border-[#609ad3] transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
                    />
                  </div>
                </div>

                <div className="flex-1 flex flex-col min-h-[140px] p-3 bg-[#f2f7fc] dark:bg-[#151c28] border border-[#c3d7eb] dark:border-[#2a3f5a] rounded shadow-[inset_0_1px_3px_rgba(0,0,0,0.02)]">
                  <label className="text-[9px] font-mono text-[#4a6b8c] uppercase tracking-widest mb-2 block">/ personal.notes</label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    onBlur={handleAutoSave}
                    placeholder="Append log data..."
                    className="w-full flex-1 bg-white dark:bg-[#0d1620] border border-[#a9cbed] dark:border-[#3a526b] rounded-sm p-3 text-xs font-sans text-[#2c4054] dark:text-gray-300 outline-none focus:border-[#609ad3] resize-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] transition-all"
                  />
                </div>

                <div className="mt-2 flex items-center justify-end">
                  <button 
                    onClick={() => setShowDeleteConfirm(true)} 
                    className="px-3 py-1.5 bg-gradient-to-b from-[#fdf2f3] to-[#fadadd] border border-[#f1aab0] text-[#c53030] font-mono text-[10px] uppercase rounded shadow-[0_1px_3px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,1)] hover:from-[#fadadd] hover:to-[#f1aab0] transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <TrashIcon /> Purge
                  </button>
                </div>
              </div>
            </div>

            {/* Warning Overlay */}
            {showDeleteConfirm && (
              <div className="absolute inset-0 z-[100000] flex items-center justify-center p-4 bg-[#1a2332]/50 backdrop-blur-sm" onMouseDown={(e) => e.stopPropagation()}>
                <div className="w-full max-w-sm bg-white/95 dark:bg-[#151c28]/95 backdrop-blur-xl border border-white dark:border-[#2a3f5a] p-1 rounded shadow-[0_10px_30px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.8)]">
                  <div className="bg-gradient-to-b from-[#fceced] to-[#fad2d5] border-b border-[#f1aab0] px-3 py-1.5 flex items-center">
                    <span className="font-mono text-[10px] text-[#c53030] tracking-widest uppercase">++ warning.purge //</span>
                  </div>
                  <div className="p-6 text-center flex flex-col gap-4">
                    <span className="text-sm font-semibold text-[#2c4054] dark:text-gray-200">Confirm record deletion?</span>
                    <div className="flex gap-2 mt-2">
                      <button onClick={handleConfirmDelete} className="flex-1 py-1.5 bg-gradient-to-b from-[#e53e3e] to-[#c53030] border border-[#9b2c2c] text-white font-mono text-[10px] uppercase rounded shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] hover:opacity-90 transition-opacity">Execute</button>
                      <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-1.5 bg-gradient-to-b from-white to-[#eef4f9] border border-[#a9cbed] text-[#4a6b8c] font-mono text-[10px] uppercase rounded shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] hover:bg-[#e1eef9] transition-colors">Abort</button>
                    </div>
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
        <div className="fixed inset-0 z-[100001] flex items-center justify-center bg-[#151c28]/90 p-4 md:p-12 backdrop-blur-md cursor-zoom-out" onClick={() => setIsFullscreenMedia(false)}>
          <button onClick={() => setIsFullscreenMedia(false)} className="absolute top-4 right-4 md:top-8 md:right-8 p-2 bg-gradient-to-b from-white to-[#eef4f9] border border-[#a9cbed] text-[#4a6b8c] rounded shadow-[0_4px_10px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.8)] cursor-pointer">
            <CloseIcon />
          </button>
          <img src={previewImageUrl} alt={bookmark.title} className="max-w-full max-h-[90vh] object-contain shadow-2xl rounded-sm border border-[#2a3f5a]" onClick={(e) => e.stopPropagation()} />
        </div>,
        document.body
      )}
    </>
  )
}