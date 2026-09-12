'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Bookmark } from '@/types'
import toast from 'react-hot-toast'

const TrashIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
const ExternalLinkIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
const FullscreenIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
const CloseIcon = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12" /></svg>

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
    } catch { return 'source' }
  }

  const formatUrl = (rawUrl: string) => {
    const t = rawUrl.trim()
    if (!t) return ''
    return !t.startsWith('http://') && !t.startsWith('https://') ? 'https://' + t : t
  }

  const handleAutoSave = async () => {
    if (editTitle.trim() === (bookmark.title || '') && formatUrl(editUrl) === bookmark.url && editCategory.trim() === (bookmark.category || '') && editSubCategory.trim() === (bookmark.sub_category || '') && editDescription.trim() === (bookmark.description || '') && editContent === (bookmark.content || '')) return;
    await updateBookmark(bookmark.id, { title: editTitle.trim() || 'Untitled', url: formatUrl(editUrl), category: editCategory.trim() || 'Uncategorized', sub_category: editSubCategory.trim() || null, description: editDescription.trim() || null, content: editContent || null })
    toast.success('SYS.UPDATE COMPLETE', { style: { background: '#000', color: '#fff', border: '4px solid #fff', borderRadius: '0', fontWeight: '900' } })
  }

  const handleConfirmDelete = async () => { await deleteBookmark(bookmark.id); setShowDeleteConfirm(false); handleCloseModal() }

  const previewImageUrl = bookmark.image_url || `https://s.wordpress.com/mshots/v1/${encodeURIComponent(bookmark.url)}?w=800`
  const isRealWebLink = bookmark.url && (bookmark.url.startsWith('http://') || bookmark.url.startsWith('https://')) && !bookmark.url.includes('/note-')

  return (
    <>
      {/* ─── BRUTALIST CARD ─── */}
      <div
        draggable
        onDragStart={(e) => onDragStart(e, bookmark.id)}
        onDragEnd={onDragEnd}
        onClick={() => setIsModalOpen(true)}
        className={`group relative flex flex-col w-full min-w-0 cursor-pointer select-none transition-all duration-150 ${isDragged ? 'opacity-40 scale-95' : 'hover:translate-x-[4px] hover:translate-y-[4px]'}`}
      >
        <div className="w-full bg-white dark:bg-black border-4 border-black dark:border-white shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_#fff] group-hover:shadow-none overflow-hidden flex flex-col min-w-0 rounded-none transition-shadow">
          <div className="bg-yellow-400 dark:bg-cyan-400 border-b-4 border-black dark:border-white px-3 py-2 flex items-center justify-between">
            <span className="font-black text-[10px] text-black tracking-widest uppercase truncate min-w-0">
              SYS.{bookmark.type === 'note' ? 'TXT' : 'LNK'}
            </span>
          </div>

          {bookmark.type === 'note' ? (
            <div className="p-6 md:p-8 flex flex-col min-w-0 gap-4 w-full">
              <span className="text-xl font-black text-black dark:text-white uppercase tracking-tighter truncate w-full">{bookmark.title}</span>
              <pre className="text-sm font-mono text-gray-800 dark:text-gray-300 leading-relaxed whitespace-pre-wrap break-words line-clamp-6 w-full font-inherit">
                {bookmark.content}
              </pre>
            </div>
          ) : (
            <div className="w-full flex flex-col min-w-0">
              <div className="w-full relative overflow-hidden bg-gray-100 dark:bg-[#111] border-b-4 border-black dark:border-white">
                <img src={previewImageUrl} alt={bookmark.title} className="w-full h-auto object-cover block filter grayscale group-hover:grayscale-0 transition-all duration-500" loading="lazy" onError={(e) => { ;(e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${getDomain(bookmark.url)}&background=random&size=600&font-size=0.1` }} />
              </div>
              <div className="p-5 flex flex-col min-w-0 gap-1">
                <h4 className="text-lg font-black text-black dark:text-white truncate uppercase tracking-tighter w-full">{bookmark.title}</h4>
                <p className="text-xs text-gray-500 font-black uppercase truncate w-full">{getDomain(bookmark.url)}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── BRUTALIST INSPECTION MODAL ─── */}
      {mounted && isModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 md:p-8 bg-black/80 backdrop-blur-sm transition-opacity" onMouseDown={handleCloseModal}>
          
          <div className="relative w-full max-w-[1800px] h-[98vh] sm:h-[90vh] flex flex-col md:flex-row bg-white dark:bg-black border-8 border-black dark:border-white shadow-[16px_16px_0_0_#fff] dark:shadow-[16px_16px_0_0_#fff] rounded-none overflow-hidden" onMouseDown={(e) => e.stopPropagation()}>
            
            <button onClick={handleCloseModal} className="absolute top-4 right-4 z-50 p-2 md:p-3 bg-red-500 border-4 border-black text-black shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all cursor-pointer rounded-none flex items-center justify-center">
              <CloseIcon />
            </button>

            {/* LEFT PANE */}
            <div className={`w-full md:w-[70%] h-[50%] md:h-full bg-white dark:bg-black relative flex flex-col border-b-8 md:border-b-0 md:border-r-8 border-black dark:border-white ${bookmark.type === 'note' ? 'overflow-hidden' : 'items-center justify-center'}`}>
              
              <div className="w-full bg-yellow-400 dark:bg-cyan-400 border-b-4 border-black dark:border-white px-6 py-3 flex items-center justify-between">
                <span className="font-black text-[12px] text-black tracking-widest uppercase">DATA.STREAM //</span>
                {isRealWebLink && (
                  <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="mr-14 flex items-center gap-2 text-xs font-black text-black hover:underline uppercase tracking-widest">
                    <span>SOURCE</span>
                    <ExternalLinkIcon />
                  </a>
                )}
              </div>

              {bookmark.type === 'note' ? (
                <div className="w-full h-full flex flex-col overflow-hidden relative p-4">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    onBlur={handleAutoSave}
                    placeholder="INPUT DATA..."
                    style={{ tabSize: 2 }}
                    className="w-full h-full bg-gray-50 dark:bg-[#111] border-4 border-black dark:border-white p-8 md:p-12 font-mono text-sm md:text-lg leading-relaxed text-black dark:text-white outline-none resize-none whitespace-pre overflow-x-auto focus:bg-yellow-100 dark:focus:bg-cyan-950 transition-colors shadow-[inset_4px_4px_0_0_rgba(0,0,0,0.1)] dark:shadow-[inset_4px_4px_0_0_rgba(255,255,255,0.1)]"
                    spellCheck={false}
                  />
                </div>
              ) : bookmark.type === 'image' ? (
                <div className="w-full h-full p-8 md:p-16 relative flex items-center justify-center">
                  <img src={previewImageUrl} alt={bookmark.title} className="w-full h-full object-contain cursor-zoom-in border-4 border-black dark:border-white shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_#fff]" onClick={() => setIsFullscreenMedia(true)} />
                  <button onClick={() => setIsFullscreenMedia(true)} className="absolute bottom-8 right-8 px-6 py-4 bg-cyan-400 border-4 border-black text-black text-sm font-black uppercase rounded-none shadow-[6px_6px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_0_#000] flex items-center gap-3 cursor-pointer transition-all">
                    <FullscreenIcon /> ENLARGE
                  </button>
                </div>
              ) : (
                <div className="w-full h-full p-8 md:p-16 flex items-center justify-center relative">
                  <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="w-full h-full flex items-center justify-center group">
                    <img src={previewImageUrl} alt={bookmark.title} className="w-full h-full object-contain border-4 border-black dark:border-white shadow-[12px_12px_0_0_#000] dark:shadow-[12px_12px_0_0_#fff] group-hover:translate-x-[4px] group-hover:translate-y-[4px] group-hover:shadow-none transition-all duration-200" />
                  </a>
                  <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="absolute bottom-12 right-12 px-8 py-5 bg-red-500 border-4 border-black text-black text-sm font-black uppercase tracking-widest shadow-[8px_8px_0_0_#000] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-[4px_4px_0_0_#000] flex items-center gap-3 transition-all">
                    <ExternalLinkIcon /> EXECUTE URL
                  </a>
                </div>
              )}
            </div>

            {/* RIGHT PANE: METADATA */}
            <div className="w-full md:w-[30%] h-[50%] md:h-full flex flex-col bg-gray-100 dark:bg-[#0a0a0a] overflow-y-auto">
              
              <div className="bg-yellow-400 dark:bg-cyan-400 border-b-4 border-black dark:border-white px-6 py-3 flex items-center mb-8">
                <span className="font-black text-[12px] text-black tracking-widest uppercase">META.DATA //</span>
              </div>

              <div className="px-6 pb-8 flex flex-col gap-8">
                
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">TITLE</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={handleAutoSave}
                    placeholder="ENTER TITLE"
                    className="w-full bg-white dark:bg-black border-4 border-black dark:border-white p-4 outline-none text-xl md:text-2xl font-black text-black dark:text-white uppercase tracking-tighter focus:bg-yellow-100 dark:focus:bg-cyan-950 transition-colors shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff]"
                  />
                  <div className="text-[10px] font-black text-gray-500 mt-2 flex flex-col gap-2 uppercase tracking-widest">
                    <span>LOGGED: {new Date(bookmark.created_at).toLocaleString()}</span>
                    {bookmark.type !== 'note' && (
                      <input 
                        type="url"
                        value={editUrl}
                        onChange={(e) => setEditUrl(e.target.value)}
                        onBlur={handleAutoSave}
                        className="w-full bg-white dark:bg-black border-4 border-black dark:border-white p-3 outline-none text-black dark:text-white focus:bg-yellow-100 dark:focus:bg-cyan-950 transition-colors truncate shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff]"
                      />
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">DIRECTORIES</label>
                  <input
                    type="text"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    onBlur={handleAutoSave}
                    placeholder="ROOT"
                    className="w-full text-sm font-black uppercase px-4 py-3 bg-white dark:bg-black text-black dark:text-white border-4 border-black dark:border-white outline-none focus:bg-yellow-100 dark:focus:bg-cyan-950 transition-colors shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff]"
                  />
                  <input
                    type="text"
                    value={editSubCategory}
                    onChange={(e) => setEditSubCategory(e.target.value)}
                    onBlur={handleAutoSave}
                    placeholder="SUB"
                    className="w-full text-sm font-black uppercase px-4 py-3 bg-white dark:bg-black text-black dark:text-white border-4 border-black dark:border-white outline-none focus:bg-yellow-100 dark:focus:bg-cyan-950 transition-colors shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff]"
                  />
                </div>

                <div className="flex-1 flex flex-col min-h-[160px] gap-2">
                  <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">NOTES</label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    onBlur={handleAutoSave}
                    placeholder="LOG DATA..."
                    className="w-full flex-1 bg-white dark:bg-black border-4 border-black dark:border-white p-4 text-sm font-black text-black dark:text-white outline-none focus:bg-yellow-100 dark:focus:bg-cyan-950 resize-none transition-colors shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff]"
                  />
                </div>

                <div className="mt-4 flex items-center justify-end">
                  <button 
                    onClick={() => setShowDeleteConfirm(true)} 
                    className="px-6 py-4 bg-red-500 border-4 border-black dark:border-white text-black font-black text-sm uppercase tracking-widest shadow-[6px_6px_0_0_#000] dark:shadow-[6px_6px_0_0_#fff] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_0_#000] dark:hover:shadow-[4px_4px_0_0_#fff] transition-all flex items-center gap-3 cursor-pointer"
                  >
                    <TrashIcon /> PURGE
                  </button>
                </div>
              </div>
            </div>

            {/* Brutalist Warning Overlay */}
            {showDeleteConfirm && (
              <div className="absolute inset-0 z-[100000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onMouseDown={(e) => e.stopPropagation()}>
                <div className="w-full max-w-md bg-white dark:bg-black border-8 border-red-500 p-8 md:p-12 shadow-[16px_16px_0_0_#ef4444]">
                  <div className="inline-block px-4 py-2 bg-red-500 border-4 border-black text-black font-black uppercase text-sm mb-6 shadow-[4px_4px_0_0_#000]">
                    ! WARNING
                  </div>
                  <h3 className="text-4xl md:text-5xl font-black text-black dark:text-white uppercase tracking-tighter leading-none mb-8">
                    CONFIRM PURGE?
                  </h3>
                  <div className="flex flex-col gap-4">
                    <button onClick={handleConfirmDelete} className="w-full py-4 bg-red-500 text-black border-4 border-black font-black uppercase tracking-widest text-lg shadow-[6px_6px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_0_#000] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none transition-all">EXECUTE</button>
                    <button onClick={() => setShowDeleteConfirm(false)} className="w-full py-4 bg-white dark:bg-black text-black dark:text-white border-4 border-black dark:border-white font-black uppercase tracking-widest text-lg shadow-[6px_6px_0_0_#000] dark:shadow-[6px_6px_0_0_#fff] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_0_#000] dark:hover:shadow-[4px_4px_0_0_#fff] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none transition-all">ABORT</button>
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
        <div className="fixed inset-0 z-[100001] flex items-center justify-center bg-black/95 p-4 md:p-12 backdrop-blur-xl cursor-zoom-out" onClick={() => setIsFullscreenMedia(false)}>
          <button onClick={() => setIsFullscreenMedia(false)} className="absolute top-4 right-4 md:top-8 md:right-8 p-4 bg-cyan-400 border-4 border-black text-black rounded-none shadow-[6px_6px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_0_#000] cursor-pointer transition-all">
            <CloseIcon />
          </button>
          <img src={previewImageUrl} alt={bookmark.title} className="max-w-full max-h-[90vh] object-contain shadow-[16px_16px_0_0_#fff] border-8 border-white" onClick={(e) => e.stopPropagation()} />
        </div>,
        document.body
      )}
    </>
  )
}