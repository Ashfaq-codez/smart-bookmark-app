'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Bookmark } from '@/types'
import toast from 'react-hot-toast'

const TrashIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
const ExternalLinkIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
const FullscreenIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
const CloseIcon = () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>

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
    toast.success('UPDATED', { style: { background: '#0000FF', color: '#FFF', border: '4px solid #000', borderRadius: '0', fontWeight: '900', letterSpacing: '2px' } })
  }

  const handleConfirmDelete = async () => { await deleteBookmark(bookmark.id); setShowDeleteConfirm(false); handleCloseModal() }

  const previewImageUrl = bookmark.image_url || `https://s.wordpress.com/mshots/v1/${encodeURIComponent(bookmark.url)}?w=800`
  const isRealWebLink = bookmark.url && (bookmark.url.startsWith('http://') || bookmark.url.startsWith('https://')) && !bookmark.url.includes('/note-')

  return (
    <>
      <div draggable onDragStart={(e) => onDragStart(e, bookmark.id)} onDragEnd={onDragEnd} onClick={() => setIsModalOpen(true)} className={`group relative flex flex-col w-full min-w-0 cursor-pointer select-none transition-transform duration-200 ${isDragged ? 'opacity-40 scale-95' : 'hover:-translate-y-[4px]'}`}>
        
        <div className="w-full bg-white dark:bg-black border-4 border-black dark:border-white flex flex-col min-w-0 overflow-hidden transition-colors duration-500 shadow-[8px_8px_0_0_rgba(0,0,0,1)] dark:shadow-[8px_8px_0_0_rgba(255,255,255,1)] group-hover:shadow-none group-hover:translate-x-[8px] group-hover:translate-y-[8px]">
          
          <div className="border-b-4 border-black dark:border-white px-4 py-3 flex items-center justify-between bg-[#FFD700] dark:bg-[#0000FF]">
            <span className="font-black text-[12px] text-black dark:text-white uppercase tracking-widest truncate min-w-0">
              No. {bookmark.id} // {bookmark.type === 'note' ? 'TXT' : 'LNK'}
            </span>
          </div>

          {bookmark.type === 'note' ? (
            <div className="p-6 md:p-10 flex flex-col min-w-0 gap-6 w-full bg-white dark:bg-[#0a0a0a]">
              <span className="text-2xl sm:text-3xl font-black text-black dark:text-white uppercase tracking-tighter leading-none truncate w-full">{bookmark.title}</span>
              <pre className="text-sm sm:text-base font-bold text-gray-800 dark:text-gray-300 leading-relaxed whitespace-pre-wrap break-words line-clamp-6 w-full font-sans">
                {bookmark.content}
              </pre>
            </div>
          ) : (
            <div className="w-full flex flex-col min-w-0">
              <div className="w-full relative overflow-hidden border-b-4 border-black dark:border-white bg-gray-100 dark:bg-[#111]">
                <img src={previewImageUrl} alt={bookmark.title} className="w-full h-auto object-cover block filter grayscale group-hover:grayscale-0 transition-all duration-500" loading="lazy" onError={(e) => { ;(e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${getDomain(bookmark.url)}&background=random&size=600&font-size=0.1` }} />
              </div>
              <div className="p-6 md:p-8 flex flex-col min-w-0 gap-2 bg-white dark:bg-[#0a0a0a]">
                <h4 className="text-xl sm:text-2xl font-black text-black dark:text-white truncate uppercase tracking-tighter w-full">{bookmark.title}</h4>
                <p className="text-xs text-[#0000FF] dark:text-[#FFD700] font-black uppercase truncate w-full tracking-widest">{getDomain(bookmark.url)}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {mounted && isModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-6 md:p-12 bg-white/90 dark:bg-black/90 backdrop-blur-md transition-opacity" onMouseDown={handleCloseModal}>
          
          <div className="relative w-full max-w-[1800px] h-[95vh] sm:h-[90vh] flex flex-col md:flex-row bg-white dark:bg-[#0a0a0a] border-8 border-black dark:border-white shadow-[16px_16px_0_0_rgba(0,0,0,1)] dark:shadow-[16px_16px_0_0_rgba(255,255,255,1)] transition-colors duration-500" onMouseDown={(e) => e.stopPropagation()}>
            
            <button onClick={handleCloseModal} className="absolute top-6 right-6 z-50 p-4 bg-[#FF0000] border-4 border-black text-white shadow-[4px_4px_0_0_#000] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all cursor-pointer flex items-center justify-center">
              <CloseIcon />
            </button>

            {/* LEFT PANE: 65% */}
            <div className={`w-full md:w-[65%] h-[50%] md:h-full bg-white dark:bg-[#0a0a0a] relative flex flex-col border-b-8 md:border-b-0 md:border-r-8 border-black dark:border-white transition-colors duration-500 ${bookmark.type === 'note' ? 'overflow-hidden' : 'items-center justify-center'}`}>
              
              <div className="w-full bg-[#0000FF] dark:bg-[#FFD700] border-b-4 border-black dark:border-white px-8 py-5 flex items-center justify-between">
                <span className="font-black text-[14px] text-white dark:text-black tracking-widest uppercase">DATA.VIEW</span>
                {isRealWebLink && (
                  <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="mr-24 flex items-center gap-2 text-sm font-black text-white dark:text-black hover:opacity-50 uppercase tracking-widest transition-opacity">
                    <span>SOURCE</span>
                    <ExternalLinkIcon />
                  </a>
                )}
              </div>

              {bookmark.type === 'note' ? (
                <div className="w-full h-full flex flex-col overflow-hidden relative p-6 md:p-10">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    onBlur={handleAutoSave}
                    placeholder="ENTER TEXT..."
                    style={{ tabSize: 2 }}
                    className="w-full h-full bg-[#f4f4f0] dark:bg-[#111] border-4 border-black dark:border-white p-8 sm:p-12 md:p-16 font-sans font-bold text-lg sm:text-xl md:text-2xl leading-loose text-black dark:text-white outline-none resize-none whitespace-pre-wrap break-words overflow-y-auto selection:bg-[#0000FF] selection:text-white focus:bg-white dark:focus:bg-black transition-colors shadow-[inset_4px_4px_0_0_rgba(0,0,0,0.1)] dark:shadow-[inset_4px_4px_0_0_rgba(255,255,255,0.1)]"
                    spellCheck={false}
                  />
                </div>
              ) : bookmark.type === 'image' ? (
                <div className="w-full h-full p-8 md:p-16 relative flex items-center justify-center bg-[#f4f4f0] dark:bg-[#111]">
                  <img src={previewImageUrl} alt={bookmark.title} className="w-full h-full object-contain cursor-zoom-in border-4 border-black dark:border-white bg-white dark:bg-black p-4 shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_#fff]" onClick={() => setIsFullscreenMedia(true)} />
                  <button onClick={() => setIsFullscreenMedia(true)} className="absolute bottom-12 right-12 px-8 py-5 bg-white dark:bg-black border-4 border-black dark:border-white text-black dark:text-white text-sm font-black uppercase shadow-[6px_6px_0_0_#000] dark:shadow-[6px_6px_0_0_#fff] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all flex items-center gap-3 cursor-pointer">
                    <FullscreenIcon /> EXPAND
                  </button>
                </div>
              ) : (
                <div className="w-full h-full p-8 md:p-16 flex items-center justify-center relative bg-[#f4f4f0] dark:bg-[#111]">
                  <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="w-full h-full flex items-center justify-center group">
                    <img src={previewImageUrl} alt={bookmark.title} className="w-full h-full object-contain border-4 border-black dark:border-white bg-white dark:bg-black p-4 shadow-[12px_12px_0_0_#000] dark:shadow-[12px_12px_0_0_#fff] group-hover:translate-x-[6px] group-hover:translate-y-[6px] group-hover:shadow-none transition-all duration-200" />
                  </a>
                  <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="absolute bottom-12 right-12 px-10 py-6 bg-[#FF0000] border-4 border-black dark:border-white text-white dark:text-black font-black text-sm uppercase tracking-widest shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_#fff] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all flex items-center gap-3">
                    <ExternalLinkIcon /> EXECUTE URL
                  </a>
                </div>
              )}
            </div>

            {/* RIGHT PANE: 35% */}
            <div className="w-full md:w-[35%] h-[50%] md:h-full flex flex-col bg-[#f4f4f0] dark:bg-[#111] overflow-y-auto transition-colors duration-500">
              
              <div className="bg-[#FF0000] border-b-4 border-black dark:border-white px-8 py-5 flex items-center mb-10">
                <span className="font-black text-[14px] text-white tracking-widest uppercase">META.DATA</span>
              </div>

              <div className="px-8 md:px-12 pb-12 flex flex-col gap-10">
                
                {/* Title */}
                <div className="flex flex-col gap-3">
                  <label className="text-[12px] font-black text-black dark:text-white uppercase tracking-widest">TITLE</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={handleAutoSave}
                    placeholder="ENTER TITLE"
                    className="w-full bg-white dark:bg-black border-4 border-black dark:border-white p-5 outline-none text-2xl md:text-4xl font-black text-black dark:text-white tracking-tighter uppercase focus:bg-[#0000FF] focus:text-white dark:focus:bg-[#FFD700] dark:focus:text-black transition-colors rounded-none shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff]"
                  />
                  
                  <div className="text-[11px] font-black text-gray-500 mt-3 flex flex-col gap-3 uppercase tracking-widest">
                    <span>DATE: {new Date(bookmark.created_at).toLocaleString()}</span>
                    {bookmark.type !== 'note' && (
                      <input 
                        type="url"
                        value={editUrl}
                        onChange={(e) => setEditUrl(e.target.value)}
                        onBlur={handleAutoSave}
                        className="w-full bg-white dark:bg-black border-4 border-black dark:border-white p-4 outline-none text-black dark:text-white focus:bg-[#0000FF] focus:text-white dark:focus:bg-[#FFD700] dark:focus:text-black transition-colors truncate rounded-none shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff]"
                      />
                    )}
                  </div>
                </div>

                {/* Organization */}
                <div className="flex flex-col gap-3">
                  <label className="text-[12px] font-black text-black dark:text-white uppercase tracking-widest">FILING</label>
                  <div className="flex flex-col gap-4">
                    <input
                      type="text"
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      onBlur={handleAutoSave}
                      placeholder="FOLDER"
                      className="w-full text-sm font-black uppercase px-5 py-4 bg-white dark:bg-black text-black dark:text-white border-4 border-black dark:border-white outline-none focus:bg-[#0000FF] focus:text-white dark:focus:bg-[#FFD700] dark:focus:text-black transition-colors rounded-none shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff]"
                    />
                    <input
                      type="text"
                      value={editSubCategory}
                      onChange={(e) => setEditSubCategory(e.target.value)}
                      onBlur={handleAutoSave}
                      placeholder="SUBFOLDER"
                      className="w-full text-sm font-black uppercase px-5 py-4 bg-white dark:bg-black text-black dark:text-white border-4 border-black dark:border-white outline-none focus:bg-[#0000FF] focus:text-white dark:focus:bg-[#FFD700] dark:focus:text-black transition-colors rounded-none shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff]"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="flex-1 flex flex-col min-h-[160px] gap-3">
                  <label className="text-[12px] font-black text-black dark:text-white uppercase tracking-widest">ANNOTATIONS</label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    onBlur={handleAutoSave}
                    placeholder="LOG DETAILS..."
                    className="w-full flex-1 bg-white dark:bg-black border-4 border-black dark:border-white p-5 text-sm font-bold text-black dark:text-white outline-none focus:bg-[#0000FF] focus:text-white dark:focus:bg-[#FFD700] dark:focus:text-black resize-none transition-colors rounded-none shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff]"
                  />
                </div>

                {/* Delete */}
                <div className="mt-6 flex items-center justify-end">
                  <button 
                    onClick={() => setShowDeleteConfirm(true)} 
                    className="px-6 py-4 bg-[#FF0000] border-4 border-black dark:border-white text-white font-black text-xs uppercase tracking-widest shadow-[6px_6px_0_0_#000] dark:shadow-[6px_6px_0_0_#fff] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all flex items-center gap-3 cursor-pointer"
                  >
                    <TrashIcon /> PURGE RECORD
                  </button>
                </div>
              </div>
            </div>

            {/* Brutalist Delete Confirmation */}
            {showDeleteConfirm && (
              <div className="absolute inset-0 z-[100000] flex items-center justify-center p-4 bg-white/90 dark:bg-black/90 backdrop-blur-md transition-colors duration-500" onMouseDown={(e) => e.stopPropagation()}>
                <div className="w-full max-w-md bg-white dark:bg-black border-8 border-black dark:border-white flex flex-col shadow-[16px_16px_0_0_#FF0000]">
                  <div className="bg-[#FF0000] text-white px-8 py-5 flex items-center">
                    <span className="font-black text-sm uppercase tracking-widest">! WARNING</span>
                  </div>
                  <div className="p-10 flex flex-col gap-8 text-center">
                    <h3 className="text-4xl font-black uppercase tracking-tighter text-black dark:text-white leading-none">
                      CONFIRM PURGE?
                    </h3>
                    <div className="flex flex-col gap-4 mt-2">
                      <button onClick={handleConfirmDelete} className="w-full py-5 bg-[#FF0000] text-white border-4 border-black dark:border-white font-black uppercase tracking-widest text-sm shadow-[6px_6px_0_0_#000] dark:shadow-[6px_6px_0_0_#fff] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all">EXECUTE</button>
                      <button onClick={() => setShowDeleteConfirm(false)} className="w-full py-5 bg-white dark:bg-black text-black dark:text-white border-4 border-black dark:border-white font-black uppercase tracking-widest text-sm shadow-[6px_6px_0_0_#000] dark:shadow-[6px_6px_0_0_#fff] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all">ABORT</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}