'use client'

import { useState } from 'react'
import { Bookmark } from '@/types'
import toast from 'react-hot-toast'

// --- ICONS ---
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
}

export default function BookmarkCard({
  bookmark,
  theme,
  isDragged,
  onDragStart,
  onDragEnd,
  updateBookmark,
  deleteBookmark,
}: BookmarkCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isFullscreenImage, setIsFullscreenImage] = useState(false)
  const [activeModalTab, setActiveModalTab] = useState<'view' | 'edit' | 'move'>('view')

  const [editTitle, setEditTitle] = useState(bookmark.title)
  const [editUrl, setEditUrl] = useState(bookmark.url)
  const [editCategory, setEditCategory] = useState(bookmark.category || '')
  const [editSubCategory, setEditSubCategory] = useState(bookmark.sub_category || '')
  const [editDescription, setEditDescription] = useState(bookmark.description || '')

  const [moveCategory, setMoveCategory] = useState(bookmark.category || '')
  const [moveSubCategory, setMoveSubCategory] = useState(bookmark.sub_category || '')

  const getDomain = (link: string) => {
    try { return new URL(link).hostname.replace('www.', '') } catch { return 'source' }
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

  const handleDelete = () => {
    toast((t) => (
        <div className="flex flex-col gap-3 font-sans">
          <span className="text-lg font-black text-gray-900 uppercase tracking-tight">Delete Bookmark?</span>
          <span className="text-sm font-bold text-gray-800 truncate max-w-[220px]">{bookmark.title}</span>
          <div className="flex gap-3 mt-2">
            <button onClick={() => { deleteBookmark(bookmark.id); toast.dismiss(t.id); setIsModalOpen(false) }} className="flex-1 px-4 py-2 bg-red-400 text-gray-900 font-black uppercase text-xs border-2 border-gray-900 rounded-xl hover:shadow-[3px_3px_0px_0px_rgba(17,24,39,1)] transition-all cursor-pointer">Delete</button>
            <button onClick={() => toast.dismiss(t.id)} className="flex-1 px-4 py-2 bg-gray-100 text-gray-900 font-black uppercase text-xs border-2 border-gray-900 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer">Cancel</button>
          </div>
        </div>
      ), { duration: Infinity, style: { background: '#fef08a', border: '4px solid #111827', borderRadius: '1rem', padding: '1.25rem', boxShadow: '6px 6px 0px 0px rgba(17,24,39,1)' } }
    )
  }

  const previewImageUrl = bookmark.image_url || `https://s.wordpress.com/mshots/v1/${encodeURIComponent(bookmark.url)}?w=800`

  return (
    <>
      {/* CARD FACE */}
      <div
        draggable
        onDragStart={(e) => onDragStart(e, bookmark.id)}
        onDragEnd={onDragEnd}
        onClick={() => { setActiveModalTab('view'); setIsModalOpen(true); }}
        className={`group relative flex flex-col break-inside-avoid mb-6 sm:mb-8 inline-block w-full cursor-pointer select-none ${isDragged ? 'opacity-40 scale-95' : ''}`}
      >
        <div className={`w-full bg-white dark:bg-gray-800 border-[1.5px] sm:border-2 border-gray-900 dark:border-gray-700 rounded-[1rem] sm:rounded-2xl overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] sm:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.15)] transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:group-hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:group-hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.25)]`}>
          {bookmark.type === 'note' ? (
            <div className="p-5 sm:p-6 bg-[#fffdfa] dark:bg-gray-800 flex items-center justify-center min-h-[120px]">
              <p className="font-serif text-sm sm:text-base text-gray-800 dark:text-gray-100 leading-relaxed text-center break-words whitespace-pre-wrap line-clamp-6">
                "{bookmark.description || bookmark.title}"
              </p>
            </div>
          ) : (
            <div className={`w-full overflow-hidden bg-gray-100 dark:bg-gray-700 ${theme.card}`}>
              <img src={previewImageUrl} alt={bookmark.title} className="w-full h-auto object-cover block group-hover:scale-105 transition-transform duration-500 ease-out" loading="lazy" onError={(e) => { ;(e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${getDomain(bookmark.url)}&background=random&size=600&font-size=0.1` }} />
            </div>
          )}
        </div>
        <p className="mt-2 text-center text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 px-1 truncate">
          {bookmark.title}
        </p>
      </div>

      {/* DETAIL & ACTION POPUP MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={() => { setIsModalOpen(false); setActiveModalTab('view'); }}>
          
          {/* MODAL CONTAINER - Fixed 80vh / 80vw for desktop */}
          <div className="relative w-[95vw] md:w-[80vw] h-[90vh] md:h-[80vh] flex flex-col md:flex-row bg-[#fafafa] dark:bg-gray-900 border-4 border-gray-900 dark:border-gray-600 rounded-3xl shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] dark:shadow-[10px_10px_0px_0px_rgba(255,255,255,0.15)] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            
            {/* Close Button */}
            <button onClick={() => { setIsModalOpen(false); setActiveModalTab('view'); }} className="absolute top-4 right-4 z-50 p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-900 dark:border-gray-600 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-px hover:shadow-none transition-all cursor-pointer" title="Close"><CloseIcon /></button>

            {/* LEFT PANE - Independent Scrolling */}
            <div className={`w-full md:w-1/2 h-[45%] md:h-full bg-gray-50 dark:bg-gray-800 border-b-4 md:border-b-0 md:border-r-4 border-gray-900 dark:border-gray-600 relative flex ${bookmark.type === 'note' ? 'items-start p-6 md:p-12 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full' : 'items-center justify-center overflow-hidden p-6'}`}>
              {bookmark.type === 'note' ? (
                <div className="w-full h-full max-w-lg mx-auto">
                  <p className="font-serif text-lg sm:text-xl text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-wrap">
                    {bookmark.description || bookmark.title}
                  </p>
                </div>
              ) : (
                <>
                  <img src={previewImageUrl} alt={bookmark.title} className="w-full h-full object-contain cursor-pointer" onClick={() => setIsFullscreenImage(true)} title="Click for fullscreen" />
                  <button onClick={() => setIsFullscreenImage(true)} className="absolute bottom-4 right-4 p-2 bg-white/90 dark:bg-gray-800/90 text-gray-900 dark:text-white border-2 border-gray-900 dark:border-gray-600 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:scale-105 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"><FullscreenIcon /> Fullscreen</button>
                </>
              )}
            </div>

            {/* RIGHT PANE - Independent Scrolling & Flex Growth */}
            <div className="w-full md:w-1/2 h-[55%] md:h-full flex flex-col p-6 sm:p-8 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full">
              
              {/* Header Controls */}
              <div className="flex items-center justify-between pb-4 border-b-2 border-gray-200 dark:border-gray-700 mb-4 pr-10 shrink-0">
                <span className="text-xs font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">{bookmark.type ? bookmark.type.toUpperCase() : 'LINK'} DETAILS</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setActiveModalTab(activeModalTab === 'edit' ? 'view' : 'edit')} className={`p-1.5 border-2 border-gray-900 dark:border-gray-600 rounded-lg transition-all cursor-pointer ${activeModalTab === 'edit' ? 'bg-cyan-300 text-gray-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100'}`} title="Edit"><EditIcon /></button>
                  <button onClick={() => setActiveModalTab(activeModalTab === 'move' ? 'view' : 'move')} className={`p-1.5 border-2 border-gray-900 dark:border-gray-600 rounded-lg transition-all cursor-pointer ${activeModalTab === 'move' ? 'bg-yellow-300 text-gray-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100'}`} title="Move"><MoveIcon /></button>
                  <button onClick={handleDelete} className="p-1.5 bg-pink-100 dark:bg-pink-950/50 text-pink-700 dark:text-pink-300 border-2 border-gray-900 dark:border-gray-600 rounded-lg hover:bg-pink-200 transition-colors cursor-pointer" title="Delete"><TrashIcon /></button>
                </div>
              </div>

              {/* View / Edit / Move Container */}
              <div className="flex flex-col flex-1">
                {activeModalTab === 'edit' ? (
                  <div className="flex flex-col gap-3 py-2">
                    <div><label className="text-[10px] font-black uppercase text-gray-500">Title</label><input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full px-3 py-2 text-sm font-bold border-2 border-gray-900 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 dark:text-white outline-none" /></div>
                    <div><label className="text-[10px] font-black uppercase text-gray-500">Target URL</label><input type="url" value={editUrl} onChange={(e) => setEditUrl(e.target.value)} className="w-full px-3 py-2 text-xs font-mono border-2 border-gray-900 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 dark:text-white outline-none" /></div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className="text-[10px] font-black uppercase text-gray-500">Folder</label><input type="text" value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="w-full px-2.5 py-1.5 text-xs border-2 border-gray-900 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white outline-none" /></div>
                      <div><label className="text-[10px] font-black uppercase text-gray-500">Subfolder</label><input type="text" value={editSubCategory} onChange={(e) => setEditSubCategory(e.target.value)} className="w-full px-2.5 py-1.5 text-xs border-2 border-dashed border-gray-500 rounded-lg bg-white dark:bg-gray-800 dark:text-white outline-none" /></div>
                    </div>
                    <div className="flex gap-2 pt-4"><button onClick={handleSaveEdit} className="flex-1 py-3 bg-yellow-400 text-gray-900 text-xs font-black uppercase tracking-wider border-2 border-gray-900 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-y-px hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer">Save Changes</button><button onClick={() => setActiveModalTab('view')} className="px-5 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-bold border-2 border-gray-900 dark:border-gray-600 rounded-xl cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">Cancel</button></div>
                  </div>
                ) : activeModalTab === 'move' ? (
                  <div className="flex flex-col gap-3 py-2">
                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300">Select or type a destination folder:</p>
                    <div><label className="text-[10px] font-black uppercase text-gray-500">Folder</label><input type="text" value={moveCategory} onChange={(e) => setMoveCategory(e.target.value)} className="w-full px-3 py-2 text-xs border-2 border-gray-900 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 dark:text-white outline-none" /></div>
                    <div><label className="text-[10px] font-black uppercase text-gray-500">Subfolder</label><input type="text" value={moveSubCategory} onChange={(e) => setMoveSubCategory(e.target.value)} className="w-full px-3 py-2 text-xs border-2 border-dashed border-gray-500 rounded-xl bg-white dark:bg-gray-800 dark:text-white outline-none" /></div>
                    <div className="flex gap-2 pt-4"><button onClick={handleSaveMove} className="flex-1 py-3 bg-yellow-400 text-gray-900 text-xs font-black uppercase tracking-wider border-2 border-gray-900 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-y-px hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer">Confirm Move</button><button onClick={() => setActiveModalTab('view')} className="px-5 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-bold border-2 border-gray-900 dark:border-gray-600 rounded-xl cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">Cancel</button></div>
                  </div>
                ) : (
                  <div className="flex flex-col flex-1">
                    <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white leading-tight mb-4">{bookmark.title}</h2>
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-yellow-300 dark:bg-yellow-400 text-gray-900 font-black text-xs uppercase tracking-wider border-2 border-gray-900 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-px hover:shadow-none transition-all cursor-pointer w-fit"><span>{bookmark.type === 'note' ? 'Source Page' : 'Visit Link'}</span><ExternalLinkIcon /></a>
                      <span className="text-xs font-bold text-gray-500 dark:text-gray-400 px-2">{getDomain(bookmark.url)}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 pb-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-gray-800 dark:text-gray-200 bg-gray-200 dark:bg-gray-700 px-2.5 py-1 rounded-md border border-gray-400 dark:border-gray-500">{bookmark.category || 'Inbox'}</span>
                      {bookmark.sub_category && <span className="text-[10px] font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-md border border-dashed border-gray-400">{bookmark.sub_category}</span>}
                      {bookmark.tags?.map((tag) => <span key={tag} className="text-[10px] font-black uppercase tracking-wider text-gray-900 bg-yellow-200 dark:bg-yellow-400 px-2.5 py-1 rounded-full border border-gray-900">#{tag}</span>)}
                    </div>
                    
                    {/* FLEX GROW NOTES SECTION */}
                    <div className="flex flex-col flex-1 gap-2 pt-4 pb-2">
                      <label className="text-[11px] font-black uppercase tracking-widest text-gray-700 dark:text-gray-300">Personal Notes</label>
                      <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="Add personal thoughts, summaries, or context..." className="w-full flex-1 min-h-[120px] p-4 text-sm font-medium text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 border-2 border-gray-900 dark:border-gray-600 rounded-xl outline-none focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:focus:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.2)] resize-none transition-shadow" />
                      <button onClick={handleSaveEdit} className="mt-2 w-full sm:w-auto self-end px-5 py-2.5 bg-gray-900 text-white dark:bg-white dark:text-gray-900 text-xs font-bold uppercase tracking-wider rounded-xl border-2 border-transparent dark:border-gray-300 hover:scale-[1.02] active:scale-[0.98] transition-transform cursor-pointer">Save Note</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="pt-4 mt-auto shrink-0 border-t border-gray-200 dark:border-gray-800 text-[10px] font-medium text-gray-400 dark:text-gray-500">
                Added on {new Date(bookmark.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN IMAGE LIGHTBOX */}
      {isFullscreenImage && bookmark.type !== 'note' && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md cursor-zoom-out" onClick={() => setIsFullscreenImage(false)}>
          <button onClick={() => setIsFullscreenImage(false)} className="absolute top-6 right-6 p-2 bg-white text-gray-900 border-2 border-gray-900 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:scale-105 transition-transform cursor-pointer" title="Close Fullscreen"><CloseIcon /></button>
          <img src={previewImageUrl} alt={bookmark.title} className="max-w-full max-h-full object-contain rounded-lg border-2 border-white/20 shadow-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </>
  )
}