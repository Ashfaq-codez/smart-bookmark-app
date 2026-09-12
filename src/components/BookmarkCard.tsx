'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Bookmark } from '@/types'
import toast from 'react-hot-toast'

const TrashIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
const ExternalLinkIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
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
  const getDomain = (link: string) => { try { const clean = link.split('#:~:text=')[0]; return new URL(clean).hostname.replace('www.', '') } catch { return 'source' } }
  const formatUrl = (rawUrl: string) => { const t = rawUrl.trim(); if (!t) return ''; return !t.startsWith('http://') && !t.startsWith('https://') ? 'https://' + t : t }

  const handleAutoSave = async () => {
    if (editTitle.trim() === (bookmark.title || '') && formatUrl(editUrl) === bookmark.url && editCategory.trim() === (bookmark.category || '') && editSubCategory.trim() === (bookmark.sub_category || '') && editDescription.trim() === (bookmark.description || '') && editContent === (bookmark.content || '')) return;
    await updateBookmark(bookmark.id, { title: editTitle.trim() || 'Untitled', url: formatUrl(editUrl), category: editCategory.trim() || 'Uncategorized', sub_category: editSubCategory.trim() || null, description: editDescription.trim() || null, content: editContent || null })
    toast.success('Saved.', { style: { background: '#000', color: '#fff', border: '1px solid #000', borderRadius: '0', textTransform: 'uppercase', fontSize: '12px', fontWeight: 'bold' } })
  }

  const handleConfirmDelete = async () => { await deleteBookmark(bookmark.id); setShowDeleteConfirm(false); handleCloseModal() }

  const previewImageUrl = bookmark.image_url || `https://s.wordpress.com/mshots/v1/${encodeURIComponent(bookmark.url)}?w=800`
  const isRealWebLink = bookmark.url && (bookmark.url.startsWith('http://') || bookmark.url.startsWith('https://')) && !bookmark.url.includes('/note-')

  return (
    <>
      {/* ─── SWISS CARD ─── */}
      <div draggable onDragStart={(e) => onDragStart(e, bookmark.id)} onDragEnd={onDragEnd} onClick={() => setIsModalOpen(true)} className={`group relative flex flex-col w-full min-w-0 cursor-pointer select-none transition-transform duration-200 ${isDragged ? 'opacity-40 scale-95' : 'hover:-translate-y-1'}`}>
        
        <div className="w-full bg-white dark:bg-[#0a0a0a] border border-black dark:border-white flex flex-col min-w-0 overflow-hidden">
          
          <div className="border-b border-black dark:border-white px-3 sm:px-4 py-2 flex items-center justify-between bg-[#f4f4f0] dark:bg-[#111]">
            <span className="font-bold text-[9px] sm:text-[10px] text-gray-500 uppercase tracking-widest truncate min-w-0">
              No. {bookmark.id} // {bookmark.type === 'note' ? 'TXT' : 'LNK'}
            </span>
          </div>

          {bookmark.type === 'note' ? (
            <div className="p-4 sm:p-6 md:p-8 flex flex-col min-w-0 gap-4 w-full bg-white dark:bg-[#0a0a0a]">
              <span className="text-xl sm:text-2xl font-black text-black dark:text-white uppercase tracking-tighter leading-none truncate w-full">{bookmark.title}</span>
              <pre className="text-xs sm:text-sm font-sans text-gray-800 dark:text-gray-300 leading-relaxed whitespace-pre-wrap break-words line-clamp-6 w-full font-inherit">
                {bookmark.content}
              </pre>
            </div>
          ) : (
            <div className="w-full flex flex-col min-w-0">
              <div className="w-full relative overflow-hidden border-b border-black dark:border-white bg-gray-100 dark:bg-[#111]">
                <img src={previewImageUrl} alt={bookmark.title} className="w-full h-auto object-cover block filter grayscale group-hover:grayscale-0 transition-all duration-500" loading="lazy" onError={(e) => { ;(e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${getDomain(bookmark.url)}&background=random&size=600&font-size=0.1` }} />
              </div>
              <div className="p-4 sm:p-5 flex flex-col min-w-0 gap-1 bg-white dark:bg-[#0a0a0a]">
                <h4 className="text-base sm:text-lg font-black text-black dark:text-white truncate uppercase tracking-tight w-full">{bookmark.title}</h4>
                <p className="text-[10px] sm:text-xs text-gray-500 font-bold uppercase truncate w-full">{getDomain(bookmark.url)}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── SWISS SPLIT-SCREEN MODAL ─── */}
      {mounted && isModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/90 dark:bg-black/90 backdrop-blur-md transition-opacity" onMouseDown={handleCloseModal}>
          
          <div className="relative w-[98vw] max-w-[1800px] h-[96vh] flex flex-col md:flex-row bg-white dark:bg-[#0a0a0a] border border-black dark:border-white shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
            
            <button onClick={handleCloseModal} className="absolute top-4 right-4 z-50 p-2 md:p-3 bg-white dark:bg-black border border-black dark:border-white text-black dark:text-white hover:bg-[#ff0000] hover:text-white dark:hover:bg-[#ff0000] dark:hover:border-[#ff0000] transition-colors cursor-pointer flex items-center justify-center">
              <CloseIcon />
            </button>

            {/* LEFT PANE: 60% */}
            <div className={`w-full md:w-[60%] h-[50%] md:h-full bg-white dark:bg-[#0a0a0a] relative flex flex-col border-b md:border-b-0 md:border-r border-black dark:border-white ${bookmark.type === 'note' ? 'overflow-hidden' : 'items-center justify-center'}`}>
              
              <div className="w-full bg-[#f4f4f0] dark:bg-[#111] border-b border-black dark:border-white px-6 py-4 flex items-center justify-between">
                <span className="font-bold text-[10px] text-gray-500 tracking-widest uppercase">Data View</span>
                {isRealWebLink && (
                  <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="mr-14 flex items-center gap-2 text-xs font-bold text-black dark:text-white hover:text-[#ff0000] dark:hover:text-[#ff0000] uppercase tracking-widest transition-colors">
                    <span>Source</span>
                    <ExternalLinkIcon />
                  </a>
                )}
              </div>

              {bookmark.type === 'note' ? (
                <div className="w-full h-full flex flex-col overflow-hidden relative">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    onBlur={handleAutoSave}
                    placeholder="Input Text..."
                    style={{ tabSize: 2 }}
                    className="w-full h-full bg-transparent p-6 sm:p-10 md:p-16 font-sans text-lg sm:text-xl md:text-2xl leading-relaxed text-black dark:text-white outline-none resize-none whitespace-pre overflow-x-auto selection:bg-[#ff0000] selection:text-white"
                    spellCheck={false}
                  />
                </div>
              ) : bookmark.type === 'image' ? (
                <div className="w-full h-full p-8 md:p-16 relative flex items-center justify-center bg-[#f4f4f0] dark:bg-[#111]">
                  <img src={previewImageUrl} alt={bookmark.title} className="w-full h-full object-contain cursor-zoom-in border border-black dark:border-white bg-white dark:bg-black p-2 shadow-sm" onClick={() => setIsFullscreenMedia(true)} />
                  <button onClick={() => setIsFullscreenMedia(true)} className="absolute bottom-8 right-8 px-6 py-4 bg-white dark:bg-black border border-black dark:border-white text-black dark:text-white text-xs font-bold uppercase hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors flex items-center gap-3 cursor-pointer">
                    <FullscreenIcon /> Expand
                  </button>
                </div>
              ) : (
                <div className="w-full h-full p-8 md:p-16 flex items-center justify-center relative bg-[#f4f4f0] dark:bg-[#111]">
                  <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="w-full h-full flex items-center justify-center group">
                    <img src={previewImageUrl} alt={bookmark.title} className="w-full h-full object-contain border border-black dark:border-white bg-white dark:bg-black p-2 shadow-sm group-hover:scale-[1.01] transition-transform duration-300" />
                  </a>
                  <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="absolute bottom-8 right-8 px-8 py-5 bg-[#ff0000] border border-[#ff0000] text-white text-xs font-bold uppercase tracking-widest hover:bg-black hover:border-black dark:hover:bg-white dark:hover:text-black dark:hover:border-white transition-colors flex items-center gap-3">
                    <ExternalLinkIcon /> Open Source
                  </a>
                </div>
              )}
            </div>

            {/* RIGHT PANE: 40% */}
            <div className="w-full md:w-[40%] h-[50%] md:h-full flex flex-col bg-white dark:bg-[#0a0a0a] overflow-y-auto">
              
              <div className="bg-[#f4f4f0] dark:bg-[#111] border-b border-black dark:border-white px-6 py-4 flex items-center mb-8">
                <span className="font-bold text-[10px] text-gray-500 tracking-widest uppercase">Metadata</span>
              </div>

              <div className="px-6 md:px-10 pb-10 flex flex-col gap-10">
                
                {/* Title */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Title</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={handleAutoSave}
                    placeholder="Enter Title"
                    className="w-full bg-transparent border-b-2 border-black dark:border-white p-2 outline-none text-2xl md:text-4xl font-black text-black dark:text-white uppercase tracking-tighter focus:border-[#ff0000] transition-colors rounded-none"
                  />
                  <div className="text-[10px] font-bold text-gray-500 mt-2 flex flex-col gap-2 uppercase tracking-widest">
                    <span>Date: {new Date(bookmark.created_at).toLocaleString()}</span>
                    {bookmark.type !== 'note' && (
                      <input 
                        type="url"
                        value={editUrl}
                        onChange={(e) => setEditUrl(e.target.value)}
                        onBlur={handleAutoSave}
                        className="w-full bg-gray-50 dark:bg-[#111] border border-black dark:border-white p-3 outline-none text-black dark:text-white focus:border-[#ff0000] transition-colors truncate rounded-none"
                      />
                    )}
                  </div>
                </div>

                {/* Organization */}
                <div className="flex flex-col gap-4">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Classification</label>
                  <div className="flex gap-4">
                    <input
                      type="text"
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      onBlur={handleAutoSave}
                      placeholder="Folder"
                      className="w-full text-sm font-bold uppercase px-4 py-3 bg-white dark:bg-[#0a0a0a] text-black dark:text-white border border-black dark:border-white outline-none focus:border-[#ff0000] transition-colors rounded-none"
                    />
                    <input
                      type="text"
                      value={editSubCategory}
                      onChange={(e) => setEditSubCategory(e.target.value)}
                      onBlur={handleAutoSave}
                      placeholder="Subfolder"
                      className="w-full text-sm font-bold uppercase px-4 py-3 bg-white dark:bg-[#0a0a0a] text-black dark:text-white border border-black dark:border-white outline-none focus:border-[#ff0000] transition-colors rounded-none"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="flex-1 flex flex-col min-h-[160px] gap-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Annotations</label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    onBlur={handleAutoSave}
                    placeholder="Log details..."
                    className="w-full flex-1 bg-gray-50 dark:bg-[#111] border border-black dark:border-white p-4 text-sm font-medium text-black dark:text-white outline-none focus:border-[#ff0000] resize-none transition-colors rounded-none"
                  />
                </div>

                {/* Purge */}
                <div className="mt-4 flex items-center justify-end border-t border-black/10 dark:border-white/10 pt-6">
                  <button 
                    onClick={() => setShowDeleteConfirm(true)} 
                    className="px-6 py-4 bg-transparent border border-[#ff0000] text-[#ff0000] font-bold text-xs uppercase tracking-widest hover:bg-[#ff0000] hover:text-white transition-colors flex items-center gap-3 cursor-pointer"
                  >
                    <TrashIcon /> Delete Record
                  </button>
                </div>
              </div>
            </div>

            {/* Swiss Delete Confirmation */}
            {showDeleteConfirm && (
              <div className="absolute inset-0 z-[100000] flex items-center justify-center p-4 bg-white/90 dark:bg-black/90 backdrop-blur-sm" onMouseDown={(e) => e.stopPropagation()}>
                <div className="w-full max-w-md bg-white dark:bg-[#0a0a0a] border border-black dark:border-white flex flex-col shadow-2xl">
                  <div className="bg-[#ff0000] text-white px-6 py-4 flex items-center">
                    <span className="font-bold text-xs uppercase tracking-widest">Warning</span>
                  </div>
                  <div className="p-8 flex flex-col gap-6">
                    <h3 className="text-3xl font-black uppercase tracking-tighter text-black dark:text-white leading-none">
                      Confirm Deletion?
                    </h3>
                    <div className="flex gap-4 mt-4">
                      <button onClick={handleConfirmDelete} className="flex-1 py-4 bg-[#ff0000] text-white font-bold uppercase tracking-widest text-xs hover:bg-black dark:hover:bg-white dark:hover:text-black transition-colors">Execute</button>
                      <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-4 bg-transparent text-black dark:text-white border border-black dark:border-white font-bold uppercase tracking-widest text-xs hover:bg-gray-100 dark:hover:bg-[#111] transition-colors">Abort</button>
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
        <div className="fixed inset-0 z-[100001] flex items-center justify-center bg-white/95 dark:bg-black/95 p-4 md:p-12 backdrop-blur-md cursor-zoom-out" onClick={() => setIsFullscreenMedia(false)}>
          <button onClick={() => setIsFullscreenMedia(false)} className="absolute top-4 right-4 md:top-8 md:right-8 p-4 bg-white dark:bg-black border border-black dark:border-white text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors cursor-pointer">
            <CloseIcon />
          </button>
          <img src={previewImageUrl} alt={bookmark.title} className="max-w-full max-h-[90vh] object-contain border border-black dark:border-white bg-[#f4f4f0] dark:bg-[#111] p-4 shadow-xl" onClick={(e) => e.stopPropagation()} />
        </div>,
        document.body
      )}
    </>
  )
}