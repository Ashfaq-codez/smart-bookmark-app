'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/utils/supabase/client'
import { Bookmark } from '@/types'
import toast from 'react-hot-toast'

const TrashIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
const ExternalLinkIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
const CloseIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
const PdfIcon = () => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-[#2B6CB0] dark:text-[#90CDF4]"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>

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
  const supabase = createClient()

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
        if (showDeleteConfirm) setShowDeleteConfirm(false)
        else if (isModalOpen) handleCloseModal()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isModalOpen, showDeleteConfirm])

  const handleCloseModal = () => { setIsModalOpen(false); setShowDeleteConfirm(false); if (onCloseForcedModal) onCloseForcedModal() }
  const getDomain = (link: string) => { try { const clean = link.split('#:~:text=')[0]; return new URL(clean).hostname.replace('www.', '') } catch { return 'source' } }
  const formatUrl = (rawUrl: string) => { const t = rawUrl.trim(); if (!t) return ''; return !t.startsWith('http://') && !t.startsWith('https://') ? 'https://' + t : t }

  const handleAutoSave = async () => {
    if (editTitle.trim() === (bookmark.title || '') && formatUrl(editUrl) === bookmark.url && editCategory.trim() === (bookmark.category || '') && editSubCategory.trim() === (bookmark.sub_category || '') && editDescription.trim() === (bookmark.description || '') && editContent === (bookmark.content || '')) return;
    await updateBookmark(bookmark.id, { title: editTitle.trim() || 'Untitled', url: formatUrl(editUrl), category: editCategory.trim() || 'Uncategorized', sub_category: editSubCategory.trim() || null, description: editDescription.trim() || null, content: editContent || null })
    toast.success('Saved', { style: { background: 'transparent', color: 'inherit', border: '1px solid #CBD5E0', borderRadius: '4px' } })
  }

  const handleConfirmDelete = async () => { 
    // Delete file from bucket if it exists
    if (bookmark.file_path) {
      await supabase.storage.from('attachments').remove([bookmark.file_path])
    }
    await deleteBookmark(bookmark.id); 
    setShowDeleteConfirm(false); 
    handleCloseModal(); 
  }

  const previewImageUrl = bookmark.image_url || `https://s.wordpress.com/mshots/v1/${encodeURIComponent(bookmark.url)}?w=800`
  const isRealWebLink = bookmark.url && (bookmark.url.startsWith('http://') || bookmark.url.startsWith('https://')) && !bookmark.url.includes('/note-')

  return (
    <>
      {/* ─── COLORFUL EDITORIAL CARD ─── */}
      <div draggable onDragStart={(e) => onDragStart(e, bookmark.id)} onDragEnd={onDragEnd} onClick={() => setIsModalOpen(true)} className={`group relative flex flex-col w-full min-w-0 cursor-pointer select-none transition-transform duration-300 ${isDragged ? 'opacity-40' : 'hover:-translate-y-1'}`}>
        
        <div className="w-full bg-white dark:bg-[#2D3748] border border-[#E5E0D8] dark:border-[#4A5568] flex flex-col min-w-0 overflow-hidden transition-colors duration-500 shadow-sm hover:shadow-md rounded-sm">
          
          <div className="border-b border-[#E5E0D8] dark:border-[#4A5568] px-4 py-2 flex items-center justify-between bg-[#FDFCF8] dark:bg-[#1A202C]">
            <span className="text-[9px] text-[#718096] dark:text-[#A0AEC0] uppercase tracking-widest truncate min-w-0">
              {bookmark.type === 'note' ? 'Excerpt' : bookmark.type === 'pdf' ? 'Document' : bookmark.type === 'video' ? 'Media' : 'Reference'}
            </span>
          </div>

          {bookmark.type === 'note' ? (
            <div className="p-6 md:p-8 flex flex-col min-w-0 gap-4 w-full">
              <span className="text-xl font-serif text-[#2D3748] dark:text-[#E2E8F0] tracking-wide truncate w-full">{bookmark.title}</span>
              <p className="text-sm font-serif text-[#4A5568] dark:text-[#CBD5E0] leading-relaxed whitespace-pre-wrap break-words line-clamp-6 w-full font-inherit">
                {bookmark.content}
              </p>
            </div>
          ) : bookmark.type === 'video' ? (
            <div className="w-full flex flex-col min-w-0">
              <div className="w-full relative overflow-hidden border-b border-[#E5E0D8] dark:border-[#4A5568] bg-[#1A202C]">
                <video src={bookmark.url} className="w-full h-48 object-cover opacity-90 group-hover:opacity-100 transition-opacity" muted loop onMouseEnter={(e) => (e.target as HTMLVideoElement).play()} onMouseLeave={(e) => (e.target as HTMLVideoElement).pause()} />
              </div>
              <div className="p-5 flex flex-col min-w-0 gap-1.5">
                <h4 className="text-lg font-serif text-[#2D3748] dark:text-[#E2E8F0] truncate tracking-wide w-full">{bookmark.title}</h4>
                <p className="text-[10px] text-[#2B6CB0] dark:text-[#90CDF4] uppercase tracking-widest truncate w-full">Local Media</p>
              </div>
            </div>
          ) : bookmark.type === 'pdf' ? (
            <div className="w-full flex flex-col min-w-0">
              <div className="w-full h-48 relative overflow-hidden border-b border-[#E5E0D8] dark:border-[#4A5568] bg-[#F7FAFC] dark:bg-[#171923] flex items-center justify-center">
                <PdfIcon />
              </div>
              <div className="p-5 flex flex-col min-w-0 gap-1.5">
                <h4 className="text-lg font-serif text-[#2D3748] dark:text-[#E2E8F0] truncate tracking-wide w-full">{bookmark.title}</h4>
                <p className="text-[10px] text-[#2B6CB0] dark:text-[#90CDF4] uppercase tracking-widest truncate w-full">Portable Document Format</p>
              </div>
            </div>
          ) : (
            <div className="w-full flex flex-col min-w-0">
              <div className="w-full relative overflow-hidden border-b border-[#E5E0D8] dark:border-[#4A5568] bg-[#F7FAFC] dark:bg-[#171923]">
                <img src={previewImageUrl} alt={bookmark.title} className="w-full h-auto object-cover block group-hover:scale-[1.03] transition-transform duration-700 ease-out" loading="lazy" onError={(e) => { ;(e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${getDomain(bookmark.url)}&background=random&size=600&font-size=0.1` }} />
              </div>
              <div className="p-5 flex flex-col min-w-0 gap-1.5">
                <h4 className="text-lg font-serif text-[#2D3748] dark:text-[#E2E8F0] truncate tracking-wide w-full">{bookmark.title}</h4>
                <p className="text-[10px] text-[#2B6CB0] dark:text-[#90CDF4] uppercase tracking-widest truncate w-full">{getDomain(bookmark.url)}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── EDITORIAL MODAL ─── */}
      {mounted && isModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-6 md:p-10 bg-[#FDFCF8]/90 dark:bg-[#1A202C]/90 backdrop-blur-sm transition-colors duration-500" onMouseDown={handleCloseModal}>
          
          <div className="relative w-full max-w-[1600px] h-[95vh] sm:h-[90vh] flex flex-col md:flex-row bg-white dark:bg-[#2D3748] border border-[#E5E0D8] dark:border-[#4A5568] shadow-2xl transition-colors duration-500 rounded-sm" onMouseDown={(e) => e.stopPropagation()}>
            
            <button onClick={handleCloseModal} className="absolute top-4 right-4 z-50 p-2 text-[#718096] dark:text-[#A0AEC0] hover:text-[#2D3748] dark:hover:text-white transition-colors cursor-pointer flex items-center justify-center">
              <CloseIcon />
            </button>

            {/* LEFT PANE: 60% */}
            <div className={`w-full md:w-[60%] h-[50%] md:h-full bg-white dark:bg-[#2D3748] relative flex flex-col border-b md:border-b-0 md:border-r border-[#E5E0D8] dark:border-[#4A5568] transition-colors duration-500 ${bookmark.type === 'note' ? 'overflow-hidden' : 'items-center justify-center'}`}>
              
              {bookmark.type === 'note' ? (
                <div className="w-full h-full flex flex-col overflow-hidden relative">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    onBlur={handleAutoSave}
                    placeholder="Enter text..."
                    className="w-full h-full bg-transparent p-8 sm:p-12 md:p-20 font-serif text-lg sm:text-xl md:text-2xl leading-loose text-[#2D3748] dark:text-[#E2E8F0] outline-none resize-none whitespace-pre-wrap break-words overflow-y-auto selection:bg-[#EBF8FF] selection:text-[#2B6CB0] dark:selection:bg-[#2A4365] dark:selection:text-[#90CDF4]"
                    spellCheck={false}
                  />
                </div>
              ) : bookmark.type === 'video' ? (
                <div className="w-full h-full p-6 flex items-center justify-center bg-[#050505] transition-colors duration-500">
                   <video src={bookmark.url} controls className="w-full max-h-full object-contain rounded-sm" />
                </div>
              ) : bookmark.type === 'pdf' ? (
                <div className="w-full h-full flex items-center justify-center bg-[#FDFCF8] dark:bg-[#1A202C] transition-colors duration-500">
                   <iframe src={bookmark.url} className="w-full h-full border-none" title={bookmark.title} />
                </div>
              ) : (
                <div className="w-full h-full p-8 md:p-16 flex items-center justify-center relative bg-[#FDFCF8] dark:bg-[#1A202C] transition-colors duration-500">
                  <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="w-full h-full flex items-center justify-center group">
                    <img src={previewImageUrl} alt={bookmark.title} className="w-full h-full object-contain border border-[#E5E0D8] dark:border-[#4A5568] shadow-sm rounded-sm" />
                  </a>
                </div>
              )}
            </div>

            {/* RIGHT PANE: 40% */}
            <div className="w-full md:w-[40%] h-[50%] md:h-full flex flex-col bg-[#FDFCF8] dark:bg-[#1A202C] overflow-y-auto transition-colors duration-500">
              
              <div className="px-8 md:px-12 py-12 flex flex-col gap-12">
                
                {/* Title */}
                <div className="flex flex-col gap-2 border-b border-[#E5E0D8] dark:border-[#4A5568] pb-8">
                  <label className="text-[10px] font-sans text-[#718096] dark:text-[#A0AEC0] uppercase tracking-widest">Title</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={handleAutoSave}
                    placeholder="Enter Title"
                    className="w-full bg-transparent border-none outline-none text-2xl md:text-4xl font-serif text-[#2D3748] dark:text-[#E2E8F0] tracking-wide transition-colors rounded-none placeholder-[#A0AEC0] dark:placeholder-[#718096]"
                  />
                  
                  {isRealWebLink && (
                    <div className="mt-4">
                      <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-xs font-sans text-[#2B6CB0] dark:text-[#90CDF4] hover:opacity-70 uppercase tracking-widest transition-opacity w-max font-medium">
                        <span>Read Source</span>
                        <ExternalLinkIcon />
                      </a>
                    </div>
                  )}
                  {bookmark.file_path && (
                    <div className="mt-4">
                      <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-xs font-sans text-[#2B6CB0] dark:text-[#90CDF4] hover:opacity-70 uppercase tracking-widest transition-opacity w-max font-medium">
                        <span>Download Original File</span>
                        <ExternalLinkIcon />
                      </a>
                    </div>
                  )}
                </div>

                {/* Organization */}
                <div className="flex flex-col gap-4 border-b border-[#E5E0D8] dark:border-[#4A5568] pb-8">
                  <label className="text-[10px] font-sans text-[#718096] dark:text-[#A0AEC0] uppercase tracking-widest">Filing</label>
                  <div className="flex flex-col gap-4">
                    <input
                      type="text"
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      onBlur={handleAutoSave}
                      placeholder="Publication / Folder"
                      className="w-full text-sm font-sans px-4 py-3 bg-white dark:bg-[#2D3748] text-[#2D3748] dark:text-[#E2E8F0] border border-[#E5E0D8] dark:border-[#4A5568] outline-none focus:border-[#2B6CB0] dark:focus:border-[#90CDF4] transition-colors rounded-sm placeholder-[#A0AEC0] dark:placeholder-[#718096]"
                    />
                    <input
                      type="text"
                      value={editSubCategory}
                      onChange={(e) => setEditSubCategory(e.target.value)}
                      onBlur={handleAutoSave}
                      placeholder="Section / Subfolder"
                      className="w-full text-sm font-sans px-4 py-3 bg-white dark:bg-[#2D3748] text-[#2D3748] dark:text-[#E2E8F0] border border-[#E5E0D8] dark:border-[#4A5568] outline-none focus:border-[#2B6CB0] dark:focus:border-[#90CDF4] transition-colors rounded-sm placeholder-[#A0AEC0] dark:placeholder-[#718096]"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="flex-1 flex flex-col min-h-[160px] gap-4">
                  <label className="text-[10px] font-sans text-[#718096] dark:text-[#A0AEC0] uppercase tracking-widest">Author Notes</label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    onBlur={handleAutoSave}
                    placeholder="Add editorial context..."
                    className="w-full flex-1 bg-white dark:bg-[#2D3748] border border-[#E5E0D8] dark:border-[#4A5568] p-4 text-sm font-serif text-[#2D3748] dark:text-[#E2E8F0] outline-none focus:border-[#2B6CB0] dark:focus:border-[#90CDF4] resize-none transition-colors rounded-sm placeholder-[#A0AEC0] dark:placeholder-[#718096]"
                  />
                </div>

                {/* Delete */}
                <div className="flex items-center justify-start pt-8 border-t border-[#E5E0D8] dark:border-[#4A5568]">
                  <button 
                    onClick={() => setShowDeleteConfirm(true)} 
                    className="text-[#A0AEC0] dark:text-[#718096] hover:text-[#C53030] dark:hover:text-[#FC8181] font-sans text-[10px] uppercase tracking-widest transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <TrashIcon /> Delete Entry
                  </button>
                </div>
              </div>
            </div>

            {/* Editorial Delete Confirmation */}
            {showDeleteConfirm && (
              <div className="absolute inset-0 z-[100000] flex items-center justify-center p-4 bg-white/95 dark:bg-[#1A202C]/95 backdrop-blur-sm transition-colors duration-500" onMouseDown={(e) => e.stopPropagation()}>
                <div className="w-full max-w-sm bg-white dark:bg-[#2D3748] border border-[#E5E0D8] dark:border-[#4A5568] flex flex-col shadow-xl rounded-sm">
                  <div className="p-8 flex flex-col gap-6 text-center">
                    <h3 className="text-2xl font-serif text-[#2D3748] dark:text-[#E2E8F0] leading-none">
                      Delete this entry?
                    </h3>
                    <p className="text-xs font-sans text-[#718096] dark:text-[#A0AEC0]">This action is permanent and cannot be undone.</p>
                    <div className="flex flex-col gap-2 mt-4">
                      <button onClick={handleConfirmDelete} className="w-full py-3 bg-[#C53030] text-white font-sans font-medium text-xs tracking-widest uppercase hover:bg-[#9B2C2C] transition-colors rounded-sm">Confirm</button>
                      <button onClick={() => setShowDeleteConfirm(false)} className="w-full py-3 bg-transparent text-[#4A5568] dark:text-[#A0AEC0] border border-[#CBD5E0] dark:border-[#4A5568] font-sans font-medium text-xs tracking-widest uppercase hover:bg-[#FDFCF8] dark:hover:bg-[#171923] transition-colors rounded-sm">Cancel</button>
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