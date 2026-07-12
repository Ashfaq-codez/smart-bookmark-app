'use client'

import { useState } from 'react'
import { Bookmark } from '@/types'
import toast from 'react-hot-toast'

const TrashIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
const EditIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
const ChevronRight = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
const MoveIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><path d="M12 11v6"/><path d="M9 14l3 3 3-3"/></svg>

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
  deleteBookmark
}: BookmarkCardProps) {
  const [isLive, setIsLive] = useState(false)
  const [isCheckingPreview, setIsCheckingPreview] = useState(false)

  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(bookmark.title)
  const [editUrl, setEditUrl] = useState(bookmark.url)
  const [editCategory, setEditCategory] = useState(bookmark.category || '')
  const [editSubCategory, setEditSubCategory] = useState(bookmark.sub_category || '')

  const [isMoving, setIsMoving] = useState(false)
  const [moveCategory, setMoveCategory] = useState(bookmark.category || '')
  const [moveSubCategory, setMoveSubCategory] = useState(bookmark.sub_category || '')

  const getDomain = (link: string) => {
    try { return new URL(link).hostname } catch { return 'link' }
  }

  const formatUrl = (rawUrl: string) => {
    const trimmed = rawUrl.trim()
    return (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) ? 'https://' + trimmed : trimmed
  }

  const togglePreviewMode = async () => {
    if (!isLive) {
      setIsCheckingPreview(true)
      try {
        const res = await fetch(`/api/check-frame?url=${encodeURIComponent(bookmark.url)}`)
        const data = await res.json()
        if (!data.allowIframe) {
          toast.error("Site security blocks live previews. Click the title to visit directly.");
          setIsCheckingPreview(false)
          return
        }
      } catch (error) {
        console.error("Failed to check iframe status", error)
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
      sub_category: editSubCategory.trim() || null
    })
    setIsEditing(false)
  }

  const handleSaveMove = async () => {
    await updateBookmark(bookmark.id, {
      category: moveCategory.trim() || 'Uncategorized',
      sub_category: moveSubCategory.trim() || null
    })
    setIsMoving(false)
  }

  const handleDelete = () => {
    // Replaced window.confirm with the custom Neo-Brutalist toast modal
    toast((t) => (
      <div className="flex flex-col gap-3 font-sans">
        <span className="text-lg font-black text-gray-900 uppercase tracking-tight">Delete Bookmark?</span>
        <span className="text-sm font-bold text-gray-600 truncate max-w-[200px]">{bookmark.title}</span>
        <div className="flex gap-3 mt-2">
          <button 
            onClick={() => {
              deleteBookmark(bookmark.id);
              toast.dismiss(t.id);
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
    ), { 
      duration: Infinity, 
      style: { border: '4px solid #111827', borderRadius: '1rem', padding: '1.5rem', boxShadow: '6px 6px 0px 0px rgba(17,24,39,1)' } 
    });
  }

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, bookmark.id)}
      onDragEnd={onDragEnd}
      className={`relative group flex flex-col bg-white border-2 border-gray-900 rounded-2xl overflow-hidden shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all cursor-grab active:cursor-grabbing ${isDragged ? 'opacity-50 scale-95' : ''}`}
    >
      {/* 1. FIXED PREVIEW BUTTON: Always visible on mobile, hover on desktop */}
      <button
        onClick={togglePreviewMode}
        title={isLive ? "Switch back to screenshot" : "Try Live Preview"}
        className="absolute top-2 left-2 z-10 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[9px] font-bold px-2 py-1 rounded-md shadow-sm border border-gray-700 cursor-pointer hover:bg-gray-800"
      >
        {isCheckingPreview ? 'CHECKING...' : (isLive ? 'IMAGE' : 'LIVE')}
      </button>

      <div className={`w-full aspect-video border-b-2 border-gray-900 overflow-hidden relative ${theme.card}`}>
        {isLive ? (
          <iframe src={bookmark.url} className="w-full h-full border-none pointer-events-none" sandbox="allow-scripts allow-same-origin" loading="lazy" />
        ) : (
          <img 
            // FIX: Replaced thum.io with WordPress mshots API and encoded the URL
            src={`https://s.wordpress.com/mshots/v1/${encodeURIComponent(bookmark.url)}?w=600`} 
            alt={bookmark.title} 
            className="w-full h-[300%] object-cover object-top group-hover:object-bottom transition-all duration-[4000ms] ease-linear" 
            onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${getDomain(bookmark.url)}&background=random&size=600&font-size=0.1` }} 
          />
        )}
      </div>

      <div className="p-3 flex flex-col min-h-[95px] relative">
        
        {/* 2. FIXED ACTION BUTTONS: Always visible on mobile, hover on desktop */}
        <div className="absolute right-3 top-3 flex gap-2 opacity-100 md:opacity-0 mb-5 md:group-hover:opacity-100 transition-opacity z-10">
          <button onClick={() => { setIsMoving(true); setIsEditing(false); }} className="p-1.5 bg-yellow-100 text-yellow-700 border border-gray-900 rounded-md hover:bg-yellow-200 transition-colors cursor-pointer" title="Move to Folder">
            <MoveIcon />
          </button>
          <button onClick={() => { setIsEditing(true); setIsMoving(false); }} className="p-1.5 bg-cyan-100 text-cyan-700 border border-gray-900 rounded-md hover:bg-cyan-200 transition-colors cursor-pointer" title="Edit">
            <EditIcon />
          </button>
          <button onClick={handleDelete} className="p-1.5 bg-pink-100 text-pink-700 border border-gray-900 rounded-md hover:bg-pink-200 transition-colors cursor-pointer" title="Delete">
            <TrashIcon />
          </button>
        </div>

        {isEditing ? (
          <div className="space-y-2 w-full mt-1 flex flex-col">
            <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full px-2 py-1.5 text-sm border-2 border-gray-900 rounded bg-white outline-none" placeholder="Title" />
            <input type="url" value={editUrl} onChange={(e) => setEditUrl(e.target.value)} className="w-full px-2 py-1.5 text-[10px] border-2 border-gray-900 rounded bg-white outline-none" placeholder="URL" />
            <div className="flex gap-2">
              <input type="text" list="category-options" value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="w-full px-2 py-1.5 text-[10px] border-2 border-gray-900 rounded bg-white outline-none" placeholder="Folder" />
              <input type="text" list="subcategory-options" value={editSubCategory} onChange={(e) => setEditSubCategory(e.target.value)} className="w-full px-2 py-1.5 text-[10px] border-2 border-dashed border-gray-500 rounded bg-white outline-none" placeholder="Sub (Opt)" />
            </div>
            <div className="flex gap-2 mt-1">
              <button onClick={handleSaveEdit} className="flex-1 py-1.5 bg-[#E06D53] text-white text-xs font-bold border-2 border-gray-900 rounded cursor-pointer">Save</button>
              <button onClick={() => setIsEditing(false)} className="flex-1 py-1.5 bg-gray-200 text-gray-700 text-xs font-bold border-2 border-gray-900 rounded cursor-pointer">Cancel</button>
            </div>
          </div>
        ) : isMoving ? (
          <div className="space-y-3 w-full mt-1 flex flex-col flex-1 justify-center">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-5">Move to Folder</p>
            <input type="text" list="category-options" value={moveCategory} onChange={(e) => setMoveCategory(e.target.value)} className="w-full px-2 py-2 text-xs border-2 border-gray-900 rounded bg-white outline-none" placeholder="Main Folder" />
            <input type="text" list="subcategory-options" value={moveSubCategory} onChange={(e) => setMoveSubCategory(e.target.value)} className="w-full px-2 py-2 text-xs border-2 border-dashed border-gray-500 rounded bg-white outline-none" placeholder="Subfolder (Optional)" />
            <div className="flex gap-2 mt-auto pt-2">
              <button onClick={handleSaveMove} className="flex-1 py-1.5 bg-yellow-400 text-gray-900 text-xs font-bold border-2 border-gray-900 rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-px hover:shadow-none transition-all cursor-pointer">Confirm</button>
              <button onClick={() => setIsMoving(false)} className="flex-1 py-1.5 bg-gray-200 text-gray-700 text-xs font-bold border-2 border-gray-900 rounded cursor-pointer">Cancel</button>
            </div>
          </div>
        ) : (
          <>
            <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="block max-w-[75%] cursor-pointer">
              <h3 className="font-medium text-sm text-gray-900 truncate leading-tight hover:underline">{bookmark.title}</h3>
            </a>
            <div className="mt-1 flex items-center gap-1.5 overflow-hidden">
              <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 min-w-0 cursor-pointer">
                <img src={`https://www.google.com/s2/favicons?domain=${getDomain(bookmark.url)}`} alt="favicon" className="w-3 h-3 opacity-60 shrink-0" />
                <p className="text-[10px] font-medium text-gray-500 truncate hover:text-gray-700">{getDomain(bookmark.url)}</p>
              </a>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              <span className="text-[9px] font-bold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-300 uppercase tracking-wider truncate max-w-full">
                {bookmark.category || 'Uncategorized'}
              </span>
              {bookmark.sub_category && (
                <span className="text-[9px] font-bold text-gray-600 bg-gray-50 px-1.5 py-0.5 rounded border border-dashed border-gray-300 uppercase tracking-wider truncate max-w-full flex items-center gap-1">
                  <ChevronRight /> {bookmark.sub_category}
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}