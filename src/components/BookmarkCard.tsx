'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/utils/supabase/client'
import { Bookmark } from '@/types'
import toast from 'react-hot-toast'

// Base UI Icons
const TrashIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
const ExternalLinkIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
const CloseIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
const ExpandIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
const PlayCircleIcon = ({ className = "" }: { className?: string }) => <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>

// Social Brand Icons
const XIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/></svg>
const InstagramIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
const YouTubeIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.016 3.016 0 0 0-2.122 2.136C0 8.07 0 12 0 12s0 3.93.501 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.55 9.377.55 9.377.55s7.505 0 9.377-.55a3.016 3.016 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
const TikTokIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.12-3.44-3.17-3.61-5.46-.11-1.43.15-2.88.85-4.1 1.25-2.18 3.65-3.5 6.13-3.32.06 1.35.03 2.7.04 4.05-1.2-.2-2.48.06-3.41.87-.91.79-1.32 2.05-1.07 3.22.25 1.18 1.12 2.15 2.25 2.47 1.05.3 2.23.09 3.09-.59.85-.68 1.34-1.74 1.4-2.82.09-3.79.05-7.59.07-11.38Z"/></svg>

// Pure CSS SVG Document Icon for PDF
const CleanPdfIcon = () => (
  <svg width="64" height="84" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 2C0 0.895431 0.89543 0 2 0H14L24 10V30C24 31.1046 23.1046 32 22 32H2C0.89543 32 0 31.1046 0 30V2Z" fill="#3B82F6"/>
    <path d="M14 0V10H24L14 0Z" fill="#93C5FD"/>
    <rect x="4" y="14" width="16" height="2" rx="1" fill="white"/>
    <rect x="4" y="19" width="16" height="2" rx="1" fill="white"/>
    <rect x="4" y="24" width="10" height="2" rx="1" fill="white"/>
  </svg>
)

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
  folderHierarchy?: Record<string, string[]>;
}

export default function BookmarkCard({ bookmark, isDragged, onDragStart, onDragEnd, updateBookmark, deleteBookmark, forceOpenModal, onCloseForcedModal, folderHierarchy }: BookmarkCardProps) {
  const [mounted, setMounted] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isFullscreenImage, setIsFullscreenImage] = useState(false)
  const [isReaderMode, setIsReaderMode] = useState(false)
  
  const [showCatDropdown, setShowCatDropdown] = useState(false)
  const [showSubDropdown, setShowSubDropdown] = useState(false)
  
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)
  
  const supabase = createClient()

  const [editTitle, setEditTitle] = useState(bookmark.title || '')
  const [editUrl, setEditUrl] = useState(bookmark.url || '')
  const [editCategory, setEditCategory] = useState(bookmark.category || '')
  const [editSubCategory, setEditSubCategory] = useState(bookmark.sub_category || '')
  const [editDescription, setEditDescription] = useState(bookmark.description || '')
  const [editContent, setEditContent] = useState(bookmark.content || '')

  useEffect(() => { setMounted(true) }, [])
  
  useEffect(() => { 
    if (forceOpenModal) setIsModalOpen(true) 
  }, [forceOpenModal])

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden'
      const timer = setTimeout(() => setIsVisible(true), 10)
      return () => clearTimeout(timer)
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isModalOpen])

  useEffect(() => {
    setEditTitle(bookmark.title || '')
    setEditUrl(bookmark.url || '')
    setEditCategory(bookmark.category || '')
    setEditSubCategory(bookmark.sub_category || '')
    setEditDescription(bookmark.description || '')
    setEditContent(bookmark.content || '')
  }, [bookmark])

  const formatUrl = (rawUrl: string) => { const t = rawUrl.trim(); if (!t) return ''; return !t.startsWith('http://') && !t.startsWith('https://') ? 'https://' + t : t }

  const handleAutoSave = async () => {
    if (editTitle.trim() === (bookmark.title || '') && formatUrl(editUrl) === bookmark.url && editCategory.trim() === (bookmark.category || '') && editSubCategory.trim() === (bookmark.sub_category || '') && editDescription.trim() === (bookmark.description || '') && editContent === (bookmark.content || '')) return;
    await updateBookmark(bookmark.id, { title: editTitle.trim() || '', url: formatUrl(editUrl), category: editCategory.trim() || 'Uncategorized', sub_category: editSubCategory.trim() || null, description: editDescription.trim() || null, content: editContent || null })
    toast.success('Saved', { style: { background: 'transparent', color: 'inherit', border: '1px solid #CBD5E0', borderRadius: '4px' } })
  }

  const handleCloseModal = () => { 
    setIsVisible(false) 
    setTimeout(() => {
      setIsModalOpen(false)
      setShowDeleteConfirm(false)
      setIsFullscreenImage(false)
      setIsReaderMode(false)
      if (onCloseForcedModal) onCloseForcedModal()
    }, 300) 
  }
  
  const handleCloseWithSave = async () => {
    await handleAutoSave()
    handleCloseModal()
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientY)
    setTouchEnd(0)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientY)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchEnd - touchStart
    if (distance > 45) {
      handleCloseWithSave()
    }
    setTouchStart(0)
    setTouchEnd(0)
  }

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (!isModalOpen) return
      if (e.key === 'Escape') {
        e.preventDefault()
        if (isFullscreenImage || isReaderMode) {
          setIsFullscreenImage(false)
          setIsReaderMode(false)
          return
        }
        if (showDeleteConfirm) {
          setShowDeleteConfirm(false)
          return
        }
        await handleCloseWithSave()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen, showDeleteConfirm, isFullscreenImage, isReaderMode, editTitle, editUrl, editCategory, editSubCategory, editDescription, editContent])

  const getDomain = (link: string) => { try { const clean = link.split('#:~:text=')[0]; return new URL(clean).hostname.replace('www.', '') } catch { return 'source' } }

  const handleConfirmDelete = async () => { 
    if (bookmark.file_path) await supabase.storage.from('attachments').remove([bookmark.file_path])
    await deleteBookmark(bookmark.id); 
    setShowDeleteConfirm(false); 
    handleCloseModal(); 
  }

  // Native ID extractors for Modal iFrames
  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&]{11})/);
    return match ? match[1] : '';
  }

  const getTweetId = (url: string) => {
    const match = url.match(/(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/);
    return match ? match[1] : '';
  }

  // --- DYNAMIC TYPE DERIVATION ---
  const deriveDisplayType = (b: Bookmark) => {
    if (['twitter', 'instagram', 'youtube', 'tiktok', 'github', 'note', 'pdf', 'image', 'video'].includes(b.type || '')) return b.type;
    if (b.url) {
      const url = b.url.toLowerCase();
      if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
      if (url.includes('instagram.com')) return 'instagram';
      if (url.includes('tiktok.com')) return 'tiktok';
      if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
      if (url.includes('github.com')) return 'github';
      if (url.endsWith('.pdf') || b.file_type === 'application/pdf') return 'pdf';
    }
    return b.type || 'link';
  }
  const displayType = deriveDisplayType(bookmark);

  const previewImageUrl = bookmark.image_url || `https://s.wordpress.com/mshots/v1/${encodeURIComponent(bookmark.url)}?w=800`
  const availableCats = folderHierarchy ? Object.keys(folderHierarchy).filter(c => c !== 'All') : []
  const filteredCats = availableCats.filter(c => c.toLowerCase().includes(editCategory.toLowerCase()))
  const availableSubs = (folderHierarchy && editCategory && folderHierarchy[editCategory]) ? folderHierarchy[editCategory] : []
  const filteredSubs = availableSubs.filter(s => s.toLowerCase().includes(editSubCategory.toLowerCase()))

  // Clean identification to hide default database strings
  const hasValidTitle = bookmark.title && !['Text Snippet', 'Saved Image', 'Saved Item', 'Untitled', ''].includes(bookmark.title);

  return (
    <>
      {/* ─── GRID CARD COMPONENT (Content-First Object UI) ─── */}
      <div 
        draggable 
        onDragStart={(e) => onDragStart(e, bookmark.id)} 
        onDragEnd={onDragEnd} 
        onClick={() => setIsModalOpen(true)} 
        className={`group relative flex flex-col w-full min-w-0 cursor-pointer gap-2.5 select-none transition-transform duration-300 ${isDragged ? 'opacity-40' : 'hover:-translate-y-1'}`}
      >
        
        {/* 1. THE OBJECT SHAPE */}
        {displayType === 'note' ? (
          <div className="w-full bg-white dark:bg-[#1E2024] rounded-2xl p-6 flex flex-col min-w-0 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-transparent dark:border-white/5 relative">
            <p className="text-[15px] font-serif text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap break-words line-clamp-10 w-full">
              {bookmark.content}
            </p>
          </div>
          
        ) : displayType === 'twitter' ? (
          <div className="w-full bg-white dark:bg-[#15171A] rounded-2xl p-4 flex flex-col min-w-0 gap-3 shadow-[0_2px_12px_rgba(0,0,0,0.04)] dark:shadow-none border border-gray-100 dark:border-white/5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-[#1DA1F2]" />
            <div className="text-[#0f1419] dark:text-[#e7e9ea] mt-1 pl-1">
              <XIcon />
            </div>
            <p className="text-[14px] font-sans text-gray-900 dark:text-gray-100 line-clamp-6 w-full leading-snug whitespace-pre-wrap px-1">
              {bookmark.content || bookmark.title}
            </p>
            {bookmark.image_url && (
              <div className="w-full mt-1 relative rounded-xl overflow-hidden border border-gray-100 dark:border-white/5">
                <img src={bookmark.image_url} className="w-full h-auto max-h-56 object-cover block" loading="lazy" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/20 transition-colors">
                   <PlayCircleIcon className="w-12 h-12 text-white/90 drop-shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            )}
          </div>

        ) : ['instagram', 'tiktok'].includes(displayType || '') ? (
          <div className="w-full aspect-[4/5] relative rounded-2xl overflow-hidden shadow-sm bg-gray-100 dark:bg-gray-900 border border-transparent dark:border-white/5">
            {displayType === 'instagram' ? (
              <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#FCAF45] z-20" />
            ) : (
              <div className="absolute top-0 left-0 w-full h-[4px] bg-[#25F4EE] z-20" />
            )}
            <img src={bookmark.image_url || previewImageUrl} className="w-full h-full object-cover block group-hover:scale-[1.03] transition-transform duration-700 ease-out" loading="lazy" />
            <div className="absolute top-4 left-4 text-white drop-shadow-md z-10">
              {displayType === 'instagram' ? <InstagramIcon /> : <TikTokIcon />}
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-colors z-10">
              <PlayCircleIcon className="w-14 h-14 text-white/90 drop-shadow-lg" />
            </div>
          </div>

        ) : displayType === 'youtube' ? (
          <div className="w-full aspect-video relative rounded-2xl overflow-hidden shadow-sm bg-black border border-transparent dark:border-white/5">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-[#FF0000] z-20" />
            <img src={bookmark.image_url || previewImageUrl} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/30 transition-colors z-10">
              <PlayCircleIcon className="w-12 h-12 text-white drop-shadow-lg" />
            </div>
          </div>

        ) : displayType === 'video' ? (
          <div className="w-full aspect-video relative rounded-2xl overflow-hidden shadow-sm bg-black border border-transparent dark:border-white/5">
            <video src={bookmark.url} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" muted loop onMouseEnter={(e) => (e.target as HTMLVideoElement).play()} onMouseLeave={(e) => (e.target as HTMLVideoElement).pause()} />
          </div>
          
        ) : displayType === 'pdf' ? (
          // Pure CSS Folded Paper layout with static blue Document SVG inside
          <div className="w-full relative aspect-[3/4] p-2">
            <div 
              className="w-full h-full bg-white dark:bg-[#E2E8F0] shadow-sm relative flex flex-col items-center justify-center"
              style={{ clipPath: 'polygon(0 0, calc(100% - 40px) 0, 100% 40px, 100% 100%, 0 100%)' }}
            >
              <div className="absolute top-0 right-0 w-[40px] h-[40px] bg-gray-200 dark:bg-gray-300 shadow-[-4px_4px_8px_rgba(0,0,0,0.1)] rounded-bl-lg z-10" />
              <CleanPdfIcon />
            </div>
          </div>
          
        ) : (
          // Default Web Link / Image fallback
          <div className="w-full relative rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 dark:border-white/5 bg-white dark:bg-[#1E2024]">
            <img src={previewImageUrl} alt={bookmark.title} className="w-full h-auto max-h-64 object-cover block group-hover:scale-[1.03] transition-transform duration-700 ease-out" loading="lazy" onError={(e) => { ;(e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${getDomain(bookmark.url)}&background=random&size=600&font-size=0.1` }} />
          </div>
        )}

        {/* 2. THE FLOATING METADATA */}
        {displayType !== 'note' && (
          <div className="px-1 flex flex-col min-w-0 gap-1 w-full">
            {hasValidTitle && (
              <h4 className="text-[13px] font-semibold font-sans text-gray-800 dark:text-gray-200 line-clamp-2 leading-snug w-full">
                {bookmark.title}
              </h4>
            )}
            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-sans line-clamp-1 w-full">
              {displayType === 'pdf' ? 'PDF DOCUMENT' : getDomain(bookmark.url)}
            </p>
          </div>
        )}
      </div>

      {/* ─── EDITORIAL MODAL (Mobile Drawer / Desktop Modal) ─── */}
      {mounted && isModalOpen && createPortal(
        <div className={`fixed inset-0 z-[9999] flex items-end md:items-center justify-center p-0 md:p-6 lg:p-10 bg-[#FDFCF8]/90 dark:bg-[#1A202C]/90 backdrop-blur-sm transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`} onMouseDown={handleCloseWithSave}>
          
          <div 
            className={`relative w-full h-[92dvh] md:h-[90vh] flex flex-col md:flex-row bg-white dark:bg-[#2D3748] border border-[#E5E0D8] dark:border-[#4A5568] shadow-[0_-15px_40px_rgba(0,0,0,0.15)] md:shadow-2xl rounded-t-2xl md:rounded-sm overflow-hidden transition-transform duration-300 ease-[cubic-bezier(0.19,1,0.22,1)] ${isVisible ? 'translate-y-0 scale-100' : 'translate-y-full md:translate-y-0 md:scale-95'}`} 
            onMouseDown={(e) => e.stopPropagation()}
          >
            
            <div 
              className="absolute top-0 left-0 w-full h-12 z-[60] md:hidden flex items-start justify-center pt-3 touch-none"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div className="w-12 h-1.5 bg-black/20 dark:bg-white/20 rounded-full pointer-events-none" />
            </div>

            <button onClick={handleCloseWithSave} className="hidden md:flex absolute top-6 right-6 z-[100] p-2 bg-transparent text-[#718096] dark:text-[#A0AEC0] hover:text-[#2D3748] dark:hover:text-white transition-all cursor-pointer items-center justify-center">
              <CloseIcon />
            </button>

            {/* LEFT PANE (Preview) */}
            <div className={`w-full md:w-[60%] h-[35%] min-h-[200px] md:min-h-0 md:h-full bg-white dark:bg-[#2D3748] relative flex flex-col border-b md:border-b-0 md:border-r border-[#E5E0D8] dark:border-[#4A5568] transition-colors duration-500 ${displayType === 'note' ? 'overflow-hidden' : 'items-center justify-center'}`}>
              
              {displayType === 'note' ? (
                <div className="w-full h-full flex flex-col overflow-hidden relative group">
                  <button onClick={() => setIsReaderMode(true)} className="absolute bottom-4 right-4 md:bottom-6 md:right-6 z-10 p-2.5 bg-white/90 dark:bg-[#171923]/90 hover:bg-white dark:hover:bg-black text-[#4A5568] dark:text-[#A0AEC0] rounded-full opacity-100 md:opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-md border border-[#E5E0D8] dark:border-[#4A5568]" title="Fullscreen Reader">
                    <ExpandIcon />
                  </button>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    onBlur={handleAutoSave}
                    placeholder="Enter text..."
                    className="w-full h-full bg-transparent p-6 pt-14 md:p-20 font-serif text-lg sm:text-xl md:text-2xl leading-loose text-[#2D3748] dark:text-[#E2E8F0] outline-none resize-none whitespace-pre-wrap break-words overflow-y-auto selection:bg-[#EBF8FF] selection:text-[#2B6CB0] dark:selection:bg-[#2A4365] dark:selection:text-[#90CDF4]"
                    spellCheck={false}
                  />
                </div>

              ) : displayType === 'twitter' ? (
                // NATIVE TWITTER IFRAME EMBED (No more Sorry Note)
                <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-[#000000] overflow-y-auto p-4">
                  <iframe 
                    src={`https://platform.twitter.com/embed/Tweet.html?dnt=true&theme=dark&id=${getTweetId(bookmark.url)}`} 
                    className="w-full max-w-[550px] h-[95%] border-none bg-transparent" 
                    title="X Post"
                  />
                </div>

              ) : displayType === 'youtube' ? (
                // NATIVE YOUTUBE IFRAME EMBED
                <div className="w-full h-full bg-[#050505] flex items-center justify-center relative overflow-hidden transition-colors duration-500">
                  <iframe 
                    src={`https://www.youtube.com/embed/${getYouTubeId(bookmark.url)}?autoplay=1`} 
                    className="w-full h-full border-none" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen 
                    title="YouTube Video"
                  />
                </div>

              ) : ['instagram', 'tiktok'].includes(displayType || '') ? (
                // RESTRICTED PLATFORMS (Sorry Note Overlay remains)
                <div className="w-full h-full relative overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-[#0f1419]">
                  <img src={bookmark.image_url || previewImageUrl} className="w-full h-full object-cover absolute inset-0 blur-2xl opacity-40 scale-110" />
                  
                  <div className="relative z-10 p-6 md:p-8 w-[85%] max-w-[320px] bg-white/90 dark:bg-[#1A202C]/90 backdrop-blur-2xl rounded-[2rem] shadow-2xl flex flex-col items-center gap-4 text-center border border-white/20">
                     <div className="w-14 h-14 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-sm mb-1">
                        <PlayCircleIcon className="w-7 h-7 text-gray-800 dark:text-gray-200" />
                     </div>
                     <p className="text-[14px] font-medium font-sans text-gray-900 dark:text-gray-100 leading-tight">
                       This content plays at the original link, not within Space.
                     </p>
                     <p className="text-[12px] font-sans text-gray-500 dark:text-gray-400 leading-relaxed px-2">
                       Platforms like {displayType === 'instagram' ? 'Instagram' : 'TikTok'} actively block us from embedding their content outside their walls. This is out of our control.
                     </p>
                     <a href={bookmark.url} target="_blank" rel="noreferrer" className="mt-2 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full text-xs font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-transform shadow-md">
                       Watch Original
                     </a>
                  </div>
                </div>

              ) : displayType === 'video' ? (
                <div className="w-full h-full bg-[#050505] flex items-center justify-center relative overflow-hidden transition-colors duration-500">
                   <video src={bookmark.url} controls className="w-full h-full object-contain" />
                </div>
              ) : displayType === 'pdf' ? (
                <div className="w-full h-full bg-[#FDFCF8] dark:bg-[#1A202C] flex items-center justify-center relative overflow-hidden transition-colors duration-500">
                   <iframe src={bookmark.url} className="w-full h-full border-none" title={bookmark.title} />
                </div>
              ) : displayType === 'image' ? (
                <div className="w-full h-full relative overflow-hidden bg-[#FDFCF8] dark:bg-[#1A202C] transition-colors duration-500 cursor-zoom-in" onClick={() => setIsFullscreenImage(true)}>
                  <img src={previewImageUrl} alt={bookmark.title} className="w-full h-full object-cover md:object-contain" />
                </div>
              ) : (
                <div className="w-full h-full relative overflow-hidden bg-[#FDFCF8] dark:bg-[#1A202C] transition-colors duration-500">
                  <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="w-full h-full block cursor-pointer hover:opacity-90 transition-opacity">
                    <img src={previewImageUrl} alt={bookmark.title} className="w-full h-full object-cover md:object-contain" />
                  </a>
                </div>
              )}
            </div>

            {/* RIGHT PANE (Editor) */}
            <div className="w-full md:w-[40%] flex-1 md:h-full flex flex-col bg-[#FDFCF8] dark:bg-[#1A202C] overflow-y-auto transition-colors duration-500 pb-16 md:pb-0">
              <div className="px-6 md:px-12 py-8 md:py-12 flex flex-col gap-10 md:gap-12">
                
                {/* Title & Links */}
                <div className="flex flex-col gap-2 border-b border-[#E5E0D8] dark:border-[#4A5568] pb-6 md:pb-8">
                  <label className="text-[10px] font-sans text-[#718096] dark:text-[#A0AEC0] uppercase tracking-widest">Title</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={handleAutoSave}
                    placeholder="Enter Title"
                    className="w-full bg-transparent border-none outline-none text-xl md:text-3xl font-serif text-[#2D3748] dark:text-[#E2E8F0] tracking-wide transition-colors rounded-none placeholder-[#A0AEC0] dark:placeholder-[#718096]"
                  />
                  
                  {bookmark.url && !bookmark.url.includes('/note-') && (
                    <div className="mt-4 flex flex-col gap-2">
                      <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-xs font-sans text-[#2B6CB0] dark:text-[#90CDF4] hover:opacity-70 uppercase tracking-widest transition-opacity w-max font-medium">
                        <span>Read Source</span>
                        <ExternalLinkIcon />
                      </a>
                      <span className="text-[11px] font-sans text-[#D97706] dark:text-[#FBD38D] truncate max-w-full select-all mt-1">
                        {bookmark.url}
                      </span>
                    </div>
                  )}
                </div>

                {/* Organization */}
                <div className="flex flex-col gap-4 border-b border-[#E5E0D8] dark:border-[#4A5568] pb-6 md:pb-8">
                  <label className="text-[10px] font-sans text-[#718096] dark:text-[#A0AEC0] uppercase tracking-widest">Folder</label>
                  <div className="flex flex-col gap-4">
                    
                    <div className="relative">
                      <input
                        type="text"
                        value={editCategory}
                        onChange={(e) => { setEditCategory(e.target.value); setShowCatDropdown(true); }}
                        onFocus={() => setShowCatDropdown(true)}
                        onBlur={() => { setTimeout(() => setShowCatDropdown(false), 200); handleAutoSave(); }}
                        placeholder="Main Folder"
                        className="w-full text-sm font-sans px-4 py-3 bg-white dark:bg-[#2D3748] text-[#2D3748] dark:text-[#E2E8F0] border border-[#E5E0D8] dark:border-[#4A5568] outline-none focus:border-[#2B6CB0] dark:focus:border-[#90CDF4] transition-colors rounded-sm placeholder-[#A0AEC0] dark:placeholder-[#718096]"
                      />
                      {showCatDropdown && filteredCats.length > 0 && (
                        <ul className="absolute z-10 w-full mt-1 max-h-48 overflow-y-auto bg-white dark:bg-[#2D3748] border border-[#E5E0D8] dark:border-[#4A5568] shadow-lg rounded-sm py-1">
                          {filteredCats.map(c => (
                            <li 
                              key={c} 
                              onMouseDown={(e) => { e.preventDefault(); setEditCategory(c); setShowCatDropdown(false); }}
                              className="px-4 py-2 text-sm text-[#2D3748] dark:text-[#E2E8F0] hover:bg-[#F7FAFC] dark:hover:bg-[#1A202C] cursor-pointer transition-colors"
                            >
                              {c}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        value={editSubCategory}
                        onChange={(e) => { setEditSubCategory(e.target.value); setShowSubDropdown(true); }}
                        onFocus={() => setShowSubDropdown(true)}
                        onBlur={() => { setTimeout(() => setShowSubDropdown(false), 200); handleAutoSave(); }}
                        placeholder="Subfolder"
                        className="w-full text-sm font-sans px-4 py-3 bg-white dark:bg-[#2D3748] text-[#2D3748] dark:text-[#E2E8F0] border border-[#E5E0D8] dark:border-[#4A5568] outline-none focus:border-[#2B6CB0] dark:focus:border-[#90CDF4] transition-colors rounded-sm placeholder-[#A0AEC0] dark:placeholder-[#718096]"
                      />
                      {showSubDropdown && filteredSubs.length > 0 && (
                        <ul className="absolute z-10 w-full mt-1 max-h-48 overflow-y-auto bg-white dark:bg-[#2D3748] border border-[#E5E0D8] dark:border-[#4A5568] shadow-lg rounded-sm py-1">
                          {filteredSubs.map(s => (
                            <li 
                              key={s} 
                              onMouseDown={(e) => { e.preventDefault(); setEditSubCategory(s); setShowSubDropdown(false); }}
                              className="px-4 py-2 text-sm text-[#2D3748] dark:text-[#E2E8F0] hover:bg-[#F7FAFC] dark:hover:bg-[#1A202C] cursor-pointer transition-colors"
                            >
                              {s}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                  </div>
                </div>

                {/* Notes */}
                <div className="flex-1 flex flex-col min-h-[140px] gap-4">
                  <label className="text-[10px] font-sans text-[#718096] dark:text-[#A0AEC0] uppercase tracking-widest">Personal Notes</label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    onBlur={handleAutoSave}
                    placeholder="Add editorial context..."
                    className="w-full flex-1 bg-white dark:bg-[#2D3748] border border-[#E5E0D8] dark:border-[#4A5568] p-4 text-sm font-serif text-[#2D3748] dark:text-[#E2E8F0] outline-none focus:border-[#2B6CB0] dark:focus:border-[#90CDF4] resize-none transition-colors rounded-sm placeholder-[#A0AEC0] dark:placeholder-[#718096]"
                  />
                </div>

                {/* Delete */}
                <div className="flex items-center justify-start pt-6 border-t border-[#E5E0D8] dark:border-[#4A5568]">
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

      {/* ─── FULLSCREEN OVERLAYS ─── */}
      {mounted && isFullscreenImage && createPortal(
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/95 backdrop-blur-md cursor-zoom-out" onClick={() => setIsFullscreenImage(false)}>
          <button className="absolute top-4 right-4 md:top-6 md:right-6 text-white/70 hover:text-white bg-black/40 hover:bg-black/60 rounded-full p-2 transition-colors z-50 cursor-pointer">
            <CloseIcon />
          </button>
          <img src={previewImageUrl} alt={bookmark.title} className="max-w-[90vw] max-h-[90vh] object-contain shadow-2xl" />
        </div>,
        document.body
      )}

      {mounted && isReaderMode && createPortal(
        <div className="fixed inset-0 z-[100000] flex justify-center bg-[#FDFCF8] dark:bg-[#1A202C] overflow-y-auto" onClick={() => setIsReaderMode(false)}>
          <button className="fixed top-4 right-4 md:top-6 md:right-6 text-[#718096] dark:text-[#A0AEC0] hover:text-[#2D3748] dark:hover:text-white bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-2 z-[110] transition-colors cursor-pointer">
            <CloseIcon />
          </button>
          <div className="w-full max-w-3xl py-20 md:py-24 px-6 md:px-12 flex flex-col" onClick={(e) => e.stopPropagation()}>
             <h2 className="text-3xl md:text-5xl font-serif text-[#2D3748] dark:text-[#E2E8F0] tracking-wide mb-12 border-b border-[#E5E0D8] dark:border-[#4A5568] pb-8">{bookmark.title}</h2>
             <p className="font-serif text-lg md:text-xl text-[#2D3748] dark:text-[#E2E8F0] leading-relaxed whitespace-pre-wrap break-words">{bookmark.content}</p>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}