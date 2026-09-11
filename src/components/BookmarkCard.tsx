'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Bookmark } from '@/types'
import toast from 'react-hot-toast'

const TrashIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
const ExternalLinkIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
const FullscreenIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
const CloseIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12" /></svg>

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

  const getDomain = (link: string) => {
    try {
      const clean = link.split('#:~:text=')[0]
      return new URL(clean).hostname.replace('www.', '')
    } catch {
      return 'source'
    }
  }

  const formatUrl = (rawUrl: string) => {
    const t = rawUrl.trim()
    if (!t) return ''
    return !t.startsWith('http://') && !t.startsWith('https://') ? 'https://' + t : t
  }

  const handleAutoSave = async () => {
    if (
      editTitle.trim() === (bookmark.title || '') &&
      formatUrl(editUrl) === bookmark.url &&
      editCategory.trim() === (bookmark.category || '') &&
      editSubCategory.trim() === (bookmark.sub_category || '') &&
      editDescription.trim() === (bookmark.description || '') &&
      editContent === (bookmark.content || '')
    ) return;

    await updateBookmark(bookmark.id, {
      title: editTitle.trim() || 'Untitled',
      url: formatUrl(editUrl),
      category: editCategory.trim() || 'Uncategorized',
      sub_category: editSubCategory.trim() || null,
      description: editDescription.trim() || null,
      content: editContent || null
    })
    toast.success('Updated', {
      style: { background: '#eaf2f9', color: '#2c4054', border: '1px solid #a9cbed' },
      iconTheme: { primary: '#609ad3', secondary: '#fff' }
    })
  }

  const handleConfirmDelete = async () => {
    await deleteBookmark(bookmark.id)
    setShowDeleteConfirm(false)
    handleCloseModal()
  }

  const previewImageUrl = bookmark.image_url || `https://s.wordpress.com/mshots/v1/${encodeURIComponent(bookmark.url)}?w=800`
  const isRealWebLink = bookmark.url && (bookmark.url.startsWith('http://') || bookmark.url.startsWith('https://')) && !bookmark.url.includes('/note-')

  return (
    <>
      {/* ─── CARD PANEL ─── */}
      <div
        draggable
        onDragStart={(e) => onDragStart(e, bookmark.id)}
        onDragEnd={onDragEnd}
        onClick={() => setIsModalOpen(true)}
        className={`group relative flex flex-col w-full min-w-0 cursor-pointer select-none transition-transform duration-200 ${isDragged ? 'opacity-40 scale-95' : 'hover:-translate-y-[2px]'}`}
      >
        <div className="w-full bg-white/70 dark:bg-[#151c28]/80 backdrop-blur-md border border-white/80 dark:border-[#2a3f5a] rounded-lg shadow-[0_4px_10px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.6)] overflow-hidden flex flex-col min-w-0">
          <div className="bg-gradient-to-b from-[#f2f7fc] to-[#dae8f5] dark:from-[#213045] dark:to-[#1a2332] border-b border-[#a9cbed] dark:border-[#2a3f5a] px-3 py-1.5 flex items-center justify-between">
            <span className="font-mono text-[9px] text-[#4a6b8c] dark:text-[#8ea4bd] tracking-widest uppercase truncate min-w-0">
              ++ {bookmark.type === 'note' ? 'snippet' : 'link'}.panel //
            </span>
          </div>

          {bookmark.type === 'note' ? (
            <div className="p-5 flex flex-col min-w-0 gap-2 w-full">
              <span className="text-sm font-bold text-[#324a66] dark:text-gray-200 uppercase tracking-wide truncate w-full">{bookmark.title}</span>
              {/* Preserves formatting in card view */}
              <pre className="text-xs font-mono text-[#4a6b8c] dark:text-[#8ea4bd] leading-relaxed whitespace-pre-wrap break-words line-clamp-6 w-full font-inherit">
                {bookmark.content}
              </pre>
            </div>
          ) : (
            <div className="w-full flex flex-col min-w-0">
              <div className="w-full relative overflow-hidden bg-[#e1eef9] dark:bg-[#0d1620] border-b border-[#c3d7eb] dark:border-[#2a3f5a]">
                <img src={previewImageUrl} alt={bookmark.title} className="w-full h-auto object-cover block group-hover:scale-[1.03] transition-transform duration-500 ease-out opacity-90 group-hover:opacity-100 mix-blend-multiply dark:mix-blend-normal" loading="lazy" onError={(e) => { ;(e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${getDomain(bookmark.url)}&background=random&size=600&font-size=0.1` }} />
              </div>
              <div className="p-4 flex flex-col min-w-0">
                <h4 className="text-sm font-semibold text-[#2c4054] dark:text-gray-200 truncate w-full">{bookmark.title}</h4>
                <p className="text-[11px] text-[#5e81a5] font-mono truncate w-full mt-0.5">{getDomain(bookmark.url)}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── ULTRA-WIDE FULLSCREEN MODAL (98vw / 98vh) ─── */}
      {mounted && isModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 bg-[#1a2332]/60 backdrop-blur-xl transition-opacity" onMouseDown={handleCloseModal}>
          
          <div className="relative w-[98vw] max-w-[1900px] h-[98vh] flex flex-col md:flex-row bg-white/90 dark:bg-[#080d14]/90 backdrop-blur-3xl border border-white dark:border-[#2a3f5a] shadow-[0_20px_60px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.5)] rounded-xl overflow-hidden" onMouseDown={(e) => e.stopPropagation()}>
            
            {/* Close Button */}
            <button onClick={handleCloseModal} className="absolute top-3 right-3 z-50 p-1.5 bg-gradient-to-b from-[#ff8a8a] to-[#e53e3e] dark:from-[#c53030] dark:to-[#9b2c2c] border border-[#c53030] dark:border-[#7f1d1d] text-white shadow-[0_2px_5px_rgba(229,62,62,0.4),inset_0_1px_0_rgba(255,255,255,0.6)] rounded flex items-center justify-center cursor-pointer hover:opacity-90 transition-all">
              <CloseIcon />
            </button>

            {/* ─── LEFT PANE: RAW FORMATTED EDITOR (72% WIDTH) ─── */}
            <div className={`w-full md:w-[72%] h-[55%] md:h-full bg-[#f8fbff]/90 dark:bg-[#03060a]/95 relative flex flex-col border-b md:border-b-0 md:border-r border-[#c3d7eb] dark:border-[#2a3f5a] shadow-[inset_0_0_30px_rgba(0,0,0,0.03)] ${bookmark.type === 'note' ? 'overflow-hidden' : 'items-center justify-center'}`}>
              
              <div className="w-full bg-gradient-to-b from-[#eaf2f9]/90 to-[#d1e2f3]/90 dark:from-[#1a2536]/90 dark:to-[#111824]/90 border-b border-[#a9cbed] dark:border-[#2a3f5a] px-4 py-2 flex items-center justify-between">
                <span className="font-mono text-[10px] text-[#4a6b8c] dark:text-[#5e81a5] tracking-widest uppercase">++ source.editor.buffer //</span>
                {isRealWebLink && (
                  <a
                    href={bookmark.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mr-10 flex items-center gap-1.5 text-[11px] font-mono text-[#3a75b0] dark:text-[#609ad3] hover:underline"
                    title="Jump directly to this highlight on the source website"
                  >
                    <span>Jump to Source Paragraph</span>
                    <ExternalLinkIcon />
                  </a>
                )}
              </div>

              {bookmark.type === 'note' ? (
                <div className="w-full h-full flex flex-col overflow-hidden relative">
                  {/* whitespace-pre + tab-size-2 strictly maintains source indentation, lines, and formatting */}
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    onBlur={handleAutoSave}
                    placeholder="[ Input Data Stream ]"
                    style={{ tabSize: 2 }}
                    className="w-full h-full bg-transparent p-6 sm:p-10 md:p-12 font-mono text-xs sm:text-sm md:text-base leading-relaxed text-[#2c4054] dark:text-[#cbd5e1] outline-none resize-none whitespace-pre overflow-x-auto selection:bg-[#a9cbed] dark:selection:bg-[#3a526b]"
                    spellCheck={false}
                  />
                </div>
              ) : bookmark.type === 'image' ? (
                <div className="w-full h-full p-8 relative flex items-center justify-center">
                  <img src={previewImageUrl} alt={bookmark.title} className="w-full h-full object-contain cursor-zoom-in drop-shadow-2xl" onClick={() => setIsFullscreenMedia(true)} />
                  <button onClick={() => setIsFullscreenMedia(true)} className="absolute bottom-8 right-8 px-4 py-2 bg-gradient-to-b from-white to-[#eef4f9] dark:from-[#2a3f5a] dark:to-[#1a2332] border border-[#a9cbed] dark:border-[#4a6b8c] text-[#4a6b8c] dark:text-gray-200 text-xs font-bold uppercase rounded shadow-sm flex items-center gap-2 cursor-pointer hover:scale-105 transition-transform">
                    <FullscreenIcon /> Expand
                  </button>
                </div>
              ) : (
                <div className="w-full h-full p-8 sm:p-16 flex items-center justify-center relative">
                  <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="w-full h-full flex items-center justify-center group">
                    <img src={previewImageUrl} alt={bookmark.title} className="w-full h-full object-contain shadow-2xl border border-[#c3d7eb] dark:border-[#2a3f5a] rounded-md group-hover:scale-[1.01] transition-transform duration-500 ease-out bg-white dark:bg-[#0d1620]" />
                  </a>
                  <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="absolute bottom-8 right-8 px-6 py-3 bg-gradient-to-b from-[#609ad3] to-[#3a75b0] hover:from-[#7cb3eb] hover:to-[#4a85c0] border border-[#2f5b89] text-white text-xs font-bold uppercase tracking-widest rounded shadow-lg flex items-center gap-2 transition-all">
                    <ExternalLinkIcon /> Open Source
                  </a>
                </div>
              )}
            </div>

            {/* ─── RIGHT PANE: METADATA & SOURCE (28% WIDTH) ─── */}
            <div className="w-full md:w-[28%] h-[45%] md:h-full flex flex-col bg-white/50 dark:bg-[#0d1620]/80 overflow-y-auto">
              
              <div className="bg-gradient-to-b from-[#eaf2f9]/90 to-[#d1e2f3]/90 dark:from-[#1a2536]/90 dark:to-[#111824]/90 border-b border-[#a9cbed] dark:border-[#2a3f5a] px-4 py-2 flex items-center mb-6">
                <span className="font-mono text-[10px] text-[#4a6b8c] dark:text-[#5e81a5] tracking-widest uppercase">++ meta.panel //</span>
              </div>

              <div className="px-6 pb-8 flex flex-col gap-6">
                
                {/* Title and Origin */}
                <div className="flex flex-col gap-2">
                  <label className="text-[9px] font-mono text-[#4a6b8c] dark:text-[#5e81a5] uppercase tracking-widest block">/ document.title</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={handleAutoSave}
                    placeholder="Entry Title"
                    className="w-full bg-transparent border-b-2 border-[#c3d7eb] dark:border-[#3a526b] outline-none text-lg md:text-xl font-semibold text-[#2c4054] dark:text-white pb-1 focus:border-[#609ad3] transition-colors"
                  />
                  <span className="text-[10px] font-mono text-[#7999b8] dark:text-[#5e81a5] mt-1">
                    Logged: {new Date(bookmark.created_at).toLocaleString()}
                  </span>
                </div>

                {/* Source Page Info & Direct Link */}
                <div className="p-3 bg-white/60 dark:bg-[#080d14]/60 border border-[#c3d7eb] dark:border-[#2a3f5a] rounded-lg shadow-sm flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] font-mono text-[#4a6b8c] dark:text-[#5e81a5] uppercase tracking-widest">/ source.url</label>
                    {isRealWebLink && (
                      <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-mono text-[#3a75b0] dark:text-[#609ad3] hover:underline flex items-center gap-1">
                        <span>Launch</span>
                        <ExternalLinkIcon />
                      </a>
                    )}
                  </div>
                  <input
                    type="url"
                    value={editUrl}
                    onChange={(e) => setEditUrl(e.target.value)}
                    onBlur={handleAutoSave}
                    placeholder="https://..."
                    className="w-full text-xs font-mono px-3 py-2 bg-[#f8fbff] dark:bg-[#050b14] text-[#2c4054] dark:text-gray-300 border border-[#a9cbed] dark:border-[#3a526b] rounded outline-none focus:border-[#609ad3] transition-all truncate"
                  />
                </div>

                {/* Directory Inputs */}
                <div className="p-3 bg-white/60 dark:bg-[#080d14]/60 border border-[#c3d7eb] dark:border-[#2a3f5a] rounded-lg shadow-sm flex flex-col gap-3">
                  <label className="text-[9px] font-mono text-[#4a6b8c] dark:text-[#5e81a5] uppercase tracking-widest block">/ directories</label>
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      onBlur={handleAutoSave}
                      placeholder="root_folder"
                      className="w-full text-xs font-sans px-3 py-2 bg-[#f8fbff] dark:bg-[#050b14] text-[#2c4054] dark:text-gray-300 border border-[#a9cbed] dark:border-[#3a526b] rounded outline-none focus:border-[#609ad3] transition-all"
                    />
                    <input
                      type="text"
                      value={editSubCategory}
                      onChange={(e) => setEditSubCategory(e.target.value)}
                      onBlur={handleAutoSave}
                      placeholder="sub_folder"
                      className="w-full text-xs font-sans px-3 py-2 bg-[#f8fbff] dark:bg-[#050b14] text-[#2c4054] dark:text-gray-300 border border-[#a9cbed] dark:border-[#3a526b] rounded outline-none focus:border-[#609ad3] transition-all"
                    />
                  </div>
                </div>

                {/* Personal Notes Box */}
                <div className="flex-1 flex flex-col min-h-[140px] p-3 bg-white/60 dark:bg-[#080d14]/60 border border-[#c3d7eb] dark:border-[#2a3f5a] rounded-lg shadow-sm">
                  <label className="text-[9px] font-mono text-[#4a6b8c] dark:text-[#5e81a5] uppercase tracking-widest mb-2 block">/ personal.notes</label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    onBlur={handleAutoSave}
                    placeholder="Append log observations..."
                    className="w-full flex-1 bg-[#f8fbff] dark:bg-[#050b14] border border-[#a9cbed] dark:border-[#3a526b] rounded p-3 text-xs font-sans text-[#2c4054] dark:text-gray-300 outline-none focus:border-[#609ad3] resize-none transition-all"
                  />
                </div>

                {/* Delete Button */}
                <div className="flex items-center justify-end">
                  <button 
                    onClick={() => setShowDeleteConfirm(true)} 
                    className="px-4 py-2 bg-gradient-to-b from-[#ffe5e5] to-[#fecaca] dark:from-[#3b1515] dark:to-[#2a0e0e] border border-[#fca5a5] dark:border-[#7f1d1d] text-[#c53030] dark:text-[#f87171] font-mono text-[10px] uppercase tracking-widest rounded shadow-sm hover:opacity-90 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <TrashIcon /> Purge Record
                  </button>
                </div>
              </div>
            </div>

            {/* Delete Confirmation */}
            {showDeleteConfirm && (
              <div className="absolute inset-0 z-[100000] flex items-center justify-center p-4 bg-[#1a2332]/60 backdrop-blur-md" onMouseDown={(e) => e.stopPropagation()}>
                <div className="w-full max-w-sm bg-white/95 dark:bg-[#111827]/95 backdrop-blur-2xl border border-white dark:border-[#2a3f5a] p-1 rounded-lg shadow-2xl">
                  <div className="bg-gradient-to-b from-[#fceced] to-[#fad2d5] dark:from-[#3b1515] dark:to-[#2a0e0e] border-b border-[#f1aab0] dark:border-[#7f1d1d] px-4 py-2 flex items-center">
                    <span className="font-mono text-[10px] text-[#c53030] dark:text-[#f87171] tracking-widest uppercase">++ warning.purge //</span>
                  </div>
                  <div className="p-6 text-center flex flex-col gap-5">
                    <span className="text-sm font-semibold text-[#2c4054] dark:text-gray-200">Confirm record deletion?</span>
                    <div className="flex gap-2 mt-2">
                      <button onClick={handleConfirmDelete} className="flex-1 py-2 bg-gradient-to-b from-[#e53e3e] to-[#c53030] border border-[#9b2c2c] text-white font-mono text-[10px] uppercase rounded shadow-sm hover:opacity-90 transition-opacity">Execute</button>
                      <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2 bg-gradient-to-b from-white to-[#eef4f9] dark:from-[#1f2937] dark:to-[#111827] border border-[#a9cbed] dark:border-[#374151] text-[#4a6b8c] dark:text-gray-300 font-mono text-[10px] uppercase rounded shadow-sm hover:bg-[#e1eef9] dark:hover:bg-[#374151] transition-colors">Abort</button>
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
        <div className="fixed inset-0 z-[100001] flex items-center justify-center bg-[#0d1620]/95 p-4 md:p-12 backdrop-blur-xl cursor-zoom-out" onClick={() => setIsFullscreenMedia(false)}>
          <button onClick={() => setIsFullscreenMedia(false)} className="absolute top-4 right-4 md:top-8 md:right-8 p-2.5 bg-gradient-to-b from-white/20 to-white/5 border border-white/20 text-white rounded-md shadow cursor-pointer hover:bg-white/30 transition-all">
            <CloseIcon />
          </button>
          <img src={previewImageUrl} alt={bookmark.title} className="max-w-full max-h-[90vh] object-contain shadow-2xl rounded-sm border border-[#2a3f5a]" onClick={(e) => e.stopPropagation()} />
        </div>,
        document.body
      )}
    </>
  )
}