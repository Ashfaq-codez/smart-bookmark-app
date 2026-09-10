'use client'

import { useState } from 'react'
import { Bookmark } from '@/types'
import toast from 'react-hot-toast'

// --- ICONS ---
const TrashIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
const EditIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
const ChevronRight = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6" /></svg>
const MoveIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /><path d="M12 11v6" /><path d="M9 14l3 3 3-3" /></svg>
const MaximizeIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
const CloseIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>

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
  const [isLive, setIsLive] = useState(false)
  const [isCheckingPreview, setIsCheckingPreview] = useState(false)
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Inline Edit State
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(bookmark.title)
  const [editUrl, setEditUrl] = useState(bookmark.url)
  const [editCategory, setEditCategory] = useState(bookmark.category || '')
  const [editSubCategory, setEditSubCategory] = useState(bookmark.sub_category || '')
  
  // Note/Description State for both Inline and Modal
  const [editDescription, setEditDescription] = useState(bookmark.description || '')

  const [isMoving, setIsMoving] = useState(false)
  const [moveCategory, setMoveCategory] = useState(bookmark.category || '')
  const [moveSubCategory, setMoveSubCategory] = useState(bookmark.sub_category || '')

  const getDomain = (link: string) => {
    try { return new URL(link).hostname } catch { return 'link' }
  }

  const formatUrl = (rawUrl: string) => {
    const trimmed = rawUrl.trim()
    return !trimmed.startsWith('http://') && !trimmed.startsWith('https://') ? 'https://' + trimmed : trimmed
  }

  const togglePreviewMode = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isLive) {
      setIsCheckingPreview(true)
      try {
        const res = await fetch(`/api/check-frame?url=${encodeURIComponent(bookmark.url)}`)
        const data = await res.json()
        if (!data.allowIframe) {
          toast.error('Site security blocks live previews. Click the title to visit directly.')
          setIsCheckingPreview(false)
          return
        }
      } catch (error) {
        console.error('Failed to check iframe status', error)
      }
      setIsCheckingPreview(false)
    }
    setIsLive(!isLive)
  }

  const handleSaveEdit = async () => {
    if (!editTitle || !editUrl) return
    await updateBookmark(bookmark.id, {
      title: editTitle,
      url: formatUrl(editUrl),
      category: editCategory.trim() || 'Uncategorized',
      sub_category: editSubCategory.trim() || null,
      description: editDescription.trim() || null,
    })
    setIsEditing(false)
    setIsModalOpen(false) // Close modal if saved from within modal
    toast.success('Updated successfully')
  }

  const handleSaveMove = async () => {
    await updateBookmark(bookmark.id, {
      category: moveCategory.trim() || 'Uncategorized',
      sub_category: moveSubCategory.trim() || null,
    })
    setIsMoving(false)
  }

  const handleDelete = () => {
    toast((t) => (
        <div className="flex flex-col gap-3 font-sans">
          <span className="text-lg font-black text-gray-900 uppercase tracking-tight">Delete Bookmark?</span>
          <span className="text-sm font-bold text-gray-800 truncate max-w-[200px]">{bookmark.title}</span>
          <div className="flex gap-3 mt-2">
            <button
              onClick={() => {
                deleteBookmark(bookmark.id)
                toast.dismiss(t.id)
                setIsModalOpen(false)
              }}
              className="flex-1 px-4 py-2 bg-red-400 text-gray-900 font-black uppercase text-sm border-2 border-gray-900 rounded-xl hover:shadow-[3px_3px_0px_0px_rgba(17,24,39,1)] hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              Delete
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-900 font-black uppercase text-sm border-2 border-gray-900 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      ), { duration: Infinity, style: { background: '#fef08a', border: '4px solid #111827', borderRadius: '1rem', padding: '1.5rem', boxShadow: '6px 6px 0px 0px rgba(17,24,39,1)' } }
    )
  }

  return (
    <>
      {/* ---> THE MAIN CARD <--- */}
      <div
        draggable
        onDragStart={(e) => onDragStart(e, bookmark.id)}
        onDragEnd={onDragEnd}
        className={`relative group flex flex-col bg-white dark:bg-gray-800 border-2 border-gray-900 dark:border-gray-700 rounded-2xl overflow-hidden shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.15)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[5px_5px_0px_0px_rgba(255,255,255,0.25)] hover:-translate-y-1 transition-all cursor-grab active:cursor-grabbing ${isDragged ? 'opacity-50 scale-95' : ''}`}
      >
        <button
          onClick={togglePreviewMode}
          title={isLive ? 'Switch back to preview' : 'Try Live Preview'}
          className="absolute top-2 left-2 z-10 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[9px] font-bold px-2 py-1 rounded-md shadow-sm border border-gray-700 cursor-pointer hover:bg-gray-800"
        >
          {isCheckingPreview ? 'CHECKING...' : isLive ? 'IMAGE' : 'LIVE'}
        </button>

        {/* Card Visuals (Clickable to open modal) */}
        <div
          onClick={() => setIsModalOpen(true)}
          className={`w-full aspect-video border-b-2 border-gray-900 dark:border-gray-700 overflow-hidden relative cursor-pointer ${theme.card}`}
        >
          {isLive ? (
            <iframe src={bookmark.url} className="w-full h-full border-none pointer-events-none" sandbox="allow-scripts allow-same-origin" loading="lazy" />
          ) : bookmark.image_url ? (
            <img src={bookmark.image_url} alt={bookmark.title} className="w-full h-full object-cover" onError={(e) => { ;(e.target as HTMLImageElement).src = `https://s.wordpress.com/mshots/v1/${encodeURIComponent(bookmark.url)}?w=600` }} />
          ) : bookmark.type === 'note' ? (
            <div className="w-full h-full flex flex-col justify-center items-center bg-yellow-100 dark:bg-yellow-950/40 p-4 text-center">
              <span className="text-2xl mb-1">📝</span>
              <span className="text-[10px] font-black uppercase tracking-wider text-yellow-900 dark:text-yellow-200">Note Snippet</span>
            </div>
          ) : (
            <img src={`https://s.wordpress.com/mshots/v1/${encodeURIComponent(bookmark.url)}?w=600`} alt={bookmark.title} className="w-full h-[300%] object-cover object-top group-hover:object-bottom transition-all duration-[4000ms] ease-linear" onError={(e) => { ;(e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${getDomain(bookmark.url)}&background=random&size=600&font-size=0.1` }} />
          )}
        </div>

        {/* Card Content */}
        <div className="p-3.5 flex flex-col flex-grow relative">
          
          {/* Quick Actions Menu */}
          <div className="absolute right-3 top-3 flex gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10">
            <button onClick={() => setIsModalOpen(true)} className="p-1.5 bg-indigo-100 dark:bg-gray-700 text-indigo-700 dark:text-indigo-400 border border-gray-900 dark:border-gray-600 rounded-md hover:bg-indigo-200 dark:hover:bg-gray-600 transition-colors cursor-pointer" title="Expand Details">
              <MaximizeIcon />
            </button>
            <button onClick={() => { setIsMoving(true); setIsEditing(false) }} className="p-1.5 bg-yellow-100 dark:bg-gray-700 text-yellow-700 dark:text-yellow-400 border border-gray-900 dark:border-gray-600 rounded-md hover:bg-yellow-200 dark:hover:bg-gray-600 transition-colors cursor-pointer" title="Move">
              <MoveIcon />
            </button>
            <button onClick={() => { setIsEditing(true); setIsMoving(false) }} className="p-1.5 bg-cyan-100 dark:bg-gray-700 text-cyan-700 dark:text-cyan-400 border border-gray-900 dark:border-gray-600 rounded-md hover:bg-cyan-200 dark:hover:bg-gray-600 transition-colors cursor-pointer" title="Edit">
              <EditIcon />
            </button>
            <button onClick={handleDelete} className="p-1.5 bg-pink-100 dark:bg-gray-700 text-pink-700 dark:text-pink-400 border border-gray-900 dark:border-gray-600 rounded-md hover:bg-pink-200 dark:hover:bg-gray-600 transition-colors cursor-pointer" title="Delete">
              <TrashIcon />
            </button>
          </div>

          {/* ... (Existing Edit & Move Forms remain exactly the same) ... */}
          {isEditing ? (
             <div className="space-y-2 w-full mt-1 flex flex-col">
             <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full px-2 py-1.5 text-sm border-2 border-gray-900 dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-white outline-none" placeholder="Title" />
             <input type="url" value={editUrl} onChange={(e) => setEditUrl(e.target.value)} className="w-full px-2 py-1.5 text-[10px] border-2 border-gray-900 dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-white outline-none" placeholder="URL" />
             <textarea rows={2} value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="w-full px-2 py-1 text-xs border-2 border-gray-900 dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-white outline-none resize-none" placeholder="Description / Notes (Optional)" />
             <div className="flex gap-2">
               <input type="text" list="category-options" value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="w-full px-2 py-1.5 text-[10px] border-2 border-gray-900 dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-white outline-none" placeholder="Folder" />
               <input type="text" list="subcategory-options" value={editSubCategory} onChange={(e) => setEditSubCategory(e.target.value)} className="w-full px-2 py-1.5 text-[10px] border-2 border-dashed border-gray-500 rounded bg-white dark:bg-gray-700 dark:text-white outline-none" placeholder="Sub (Opt)" />
             </div>
             <div className="flex gap-2 mt-1">
               <button onClick={handleSaveEdit} className="flex-1 py-1.5 bg-[#E06D53] text-white text-xs font-bold border-2 border-gray-900 rounded cursor-pointer">Save</button>
               <button onClick={() => setIsEditing(false)} className="flex-1 py-1.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-100 text-xs font-bold border-2 border-gray-900 dark:border-gray-500 rounded cursor-pointer">Cancel</button>
             </div>
           </div>
          ) : isMoving ? (
            <div className="space-y-3 w-full mt-1 flex flex-col flex-1 justify-center">
              <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Move to Folder</p>
              <input type="text" list="category-options" value={moveCategory} onChange={(e) => setMoveCategory(e.target.value)} className="w-full px-2 py-2 text-xs border-2 border-gray-900 dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-white outline-none" placeholder="Main Folder" />
              <input type="text" list="subcategory-options" value={moveSubCategory} onChange={(e) => setMoveSubCategory(e.target.value)} className="w-full px-2 py-2 text-xs border-2 border-dashed border-gray-500 rounded bg-white dark:bg-gray-700 dark:text-white outline-none" placeholder="Subfolder (Optional)" />
              <div className="flex gap-2 mt-auto pt-2">
                <button onClick={handleSaveMove} className="flex-1 py-1.5 bg-yellow-400 text-gray-900 text-xs font-bold border-2 border-gray-900 rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-px hover:shadow-none transition-all cursor-pointer">Confirm</button>
                <button onClick={() => setIsMoving(false)} className="flex-1 py-1.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-100 text-xs font-bold border-2 border-gray-900 dark:border-gray-500 rounded cursor-pointer">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col flex-grow">
              <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="block max-w-[70%] cursor-pointer">
                <h3 className="font-bold text-sm text-gray-900 dark:text-white truncate leading-tight hover:underline">{bookmark.title}</h3>
              </a>
              <div className="mt-1 flex items-center gap-1.5 overflow-hidden">
                <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 min-w-0 cursor-pointer">
                  <img src={`https://www.google.com/s2/favicons?domain=${getDomain(bookmark.url)}`} alt="favicon" className="w-3 h-3 opacity-60 shrink-0" />
                  <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 truncate hover:text-gray-700 dark:hover:text-gray-200">{getDomain(bookmark.url)}</p>
                </a>
              </div>
              
              {/* Clickable Note Preview */}
              {bookmark.description && (
                <p onClick={() => setIsModalOpen(true)} className="mt-2 text-xs text-gray-600 dark:text-gray-300 font-medium line-clamp-2 leading-relaxed cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors">
                  {bookmark.description}
                </p>
              )}

              <div className="mt-auto pt-3 flex flex-wrap items-center gap-1.5">
                <span className="text-[9px] font-bold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-600 uppercase tracking-wider truncate max-w-full">{bookmark.category || 'Uncategorized'}</span>
                {bookmark.sub_category && (
                  <span className="text-[9px] font-bold text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 px-1.5 py-0.5 rounded border border-dashed border-gray-300 dark:border-gray-600 uppercase tracking-wider truncate max-w-full flex items-center gap-1"><ChevronRight /> {bookmark.sub_category}</span>
                )}
                {bookmark.tags && bookmark.tags.length > 0 && bookmark.tags.map((tag) => (
                    <span key={tag} className="text-[9px] font-bold text-gray-900 bg-yellow-200 dark:bg-yellow-400 px-2 py-0.5 rounded-full border border-gray-900 uppercase tracking-wider">#{tag}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ---> MYMIND-STYLE DETAIL MODAL <--- */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-gray-900/60 backdrop-blur-md transition-opacity"
          onClick={() => setIsModalOpen(false)} // Close when clicking backdrop
        >
          {/* Modal Container */}
          <div 
            className="relative w-full max-w-5xl max-h-full flex flex-col md:flex-row bg-[#fafafa] dark:bg-gray-900 border-4 border-gray-900 dark:border-gray-600 rounded-3xl shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,0.1)] overflow-hidden"
            onClick={(e) => e.stopPropagation()} // Prevent bubbling to backdrop
          >
            
            {/* Close Button */}
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 z-50 p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-900 dark:border-gray-600 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-px hover:shadow-none transition-all cursor-pointer"
            >
              <CloseIcon />
            </button>

            {/* LEFT COLUMN: Visual Preview */}
            <div className="w-full md:w-3/5 h-64 md:h-auto bg-gray-100 dark:bg-gray-800 border-b-4 md:border-b-0 md:border-r-4 border-gray-900 dark:border-gray-600 relative flex items-center justify-center overflow-hidden">
                {bookmark.image_url ? (
                  <img src={bookmark.image_url} alt={bookmark.title} className="w-full h-full object-contain bg-black/5" />
                ) : bookmark.type === 'note' ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <span className="text-6xl mb-4">📝</span>
                    <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Saved Note</h2>
                  </div>
                ) : (
                  <img src={`https://s.wordpress.com/mshots/v1/${encodeURIComponent(bookmark.url)}?w=1200`} alt={bookmark.title} className="w-full h-full object-cover object-top" />
                )}
            </div>

            {/* RIGHT COLUMN: Interactive Details & Notes */}
            <div className="w-full md:w-2/5 p-6 md:p-8 flex flex-col h-full overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full">
              
              <div className="flex flex-col gap-2 mb-6 pr-8">
                <input 
                  type="text" 
                  value={editTitle} 
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="text-2xl font-black text-gray-900 dark:text-white bg-transparent border-none outline-none focus:ring-2 focus:ring-yellow-400 rounded-lg p-1 -ml-1 transition-shadow"
                  placeholder="Title..."
                />
                
                <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 group w-fit">
                  <img src={`https://www.google.com/s2/favicons?domain=${getDomain(bookmark.url)}`} className="w-4 h-4" alt="domain" />
                  <span className="text-sm font-bold text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white group-hover:underline transition-colors">
                    {getDomain(bookmark.url)}
                  </span>
                </a>
              </div>

              {/* Tags & Folders */}
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded-md border-2 border-gray-300 dark:border-gray-600 uppercase tracking-wider">{bookmark.category}</span>
                {bookmark.sub_category && (
                  <span className="text-xs font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-md border-2 border-dashed border-gray-300 dark:border-gray-600 uppercase tracking-wider">{bookmark.sub_category}</span>
                )}
                {bookmark.tags && bookmark.tags.map((tag) => (
                  <span key={tag} className="text-xs font-bold text-gray-900 bg-yellow-300 dark:bg-yellow-500 px-3 py-1 rounded-full border-2 border-gray-900 uppercase tracking-wider">#{tag}</span>
                ))}
              </div>

              {/* Dedicated Note Editor */}
              <div className="flex flex-col flex-grow mb-6">
                <label className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest mb-2 flex items-center gap-2">
                  <MaximizeIcon /> Personal Notes
                </label>
                <textarea 
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Add your thoughts, quotes, or context here..."
                  className="w-full flex-grow min-h-[150px] p-4 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border-4 border-gray-900 dark:border-gray-600 rounded-2xl outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:focus:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] resize-none transition-shadow"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-auto">
                <button 
                  onClick={handleSaveEdit}
                  className="flex-1 py-3 bg-yellow-400 text-gray-900 text-sm font-black uppercase tracking-wider border-2 border-gray-900 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-px hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
                >
                  Save Changes
                </button>
                <button 
                  onClick={handleDelete}
                  className="p-3 bg-pink-200 dark:bg-pink-900/40 text-pink-700 dark:text-pink-400 border-2 border-gray-900 dark:border-gray-600 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] hover:translate-y-px hover:shadow-none transition-all cursor-pointer"
                >
                  <TrashIcon />
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  )
}