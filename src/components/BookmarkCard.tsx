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
const InfoIcon = ({ className = "" }: { className?: string }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>

// Social Brand Icons
const XIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/></svg>
const InstagramIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
const YouTubeIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.016 3.016 0 0 0-2.122 2.136C0 8.07 0 12 0 12s0 3.93.501 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.55 9.377.55 9.377.55s7.505 0 9.377-.55a3.016 3.016 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
const TikTokIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.12-3.44-3.17-3.61-5.46-.11-1.43.15-2.88.85-4.1 1.25-2.18 3.65-3.5 6.13-3.32.06 1.35.03 2.7.04 4.05-1.2-.2-2.48.06-3.41.87-.91.79-1.32 2.05-1.07 3.22.25 1.18 1.12 2.15 2.25 2.47 1.05.3 2.23.09 3.09-.59.85-.68 1.34-1.74 1.4-2.82.09-3.79.05-7.59.07-11.38Z"/></svg>

// Instagram Native Modal Icons
const InstaHeartIcon = () => <svg aria-label="Like" fill="currentColor" height="24" role="img" viewBox="0 0 24 24" width="24"><path d="M16.792 3.904A4.989 4.989 0 0 1 21.5 9.122c0 3.072-2.652 4.959-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.438-.283-1.791-1.509-4.303-3.752C5.152 14.081 2.5 12.194 2.5 9.122a4.989 4.989 0 0 1 4.708-5.218 4.21 4.21 0 0 1 3.675 1.941c.84 1.175.98 1.514 1.117 1.514s.277-.339 1.117-1.514a4.21 4.21 0 0 1 3.675-1.941z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2"></path></svg>
const InstaCommentIcon = () => <svg aria-label="Comment" fill="currentColor" height="24" role="img" viewBox="0 0 24 24" width="24"><path d="M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L22 22Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2"></path></svg>
const InstaShareIcon = () => <svg aria-label="Share Post" fill="currentColor" height="24" role="img" viewBox="0 0 24 24" width="24"><line fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" x1="22" x2="9.218" y1="3" y2="10.083"></line><polygon fill="none" points="11.698 20.334 22 3.001 2 3.001 9.218 10.084 11.698 20.334" stroke="currentColor" strokeLinejoin="round" strokeWidth="2"></polygon></svg>
const InstaSaveIcon = () => <svg aria-label="Save" fill="currentColor" height="24" role="img" viewBox="0 0 24 24" width="24"><polygon fill="none" points="20 21 12 13.44 4 21 4 3 20 3 20 21" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></polygon></svg>
const InstaDotsIcon = () => <svg aria-label="More Options" fill="currentColor" height="24" role="img" viewBox="0 0 24 24" width="24"><circle cx="12" cy="12" r="1.5"></circle><circle cx="6" cy="12" r="1.5"></circle><circle cx="18" cy="12" r="1.5"></circle></svg>

const CleanPdfIcon = () => (
  <svg width="48" height="64" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 2C0 0.895431 0.89543 0 2 0H14L24 10V30C24 31.1046 23.1046 32 22 32H2C0.89543 32 0 31.1046 0 30V2Z" fill="#3B82F6"/>
    <path d="M14 0V10H24L14 0Z" fill="#93C5FD"/>
    <rect x="4" y="14" width="16" height="2" rx="1" fill="white"/>
    <rect x="4" y="19" width="16" height="2" rx="1" fill="white"/>
    <rect x="4" y="24" width="10" height="2" rx="1" fill="white"/>
  </svg>
)

const isVideoMedia = (url?: string | null) => {
  if (!url) return false;
  return url.includes('.mp4') || url.includes('.webm') || url.includes('.mov');
};

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

  // --- NATIVE ID & DATA EXTRACTORS ---
  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&]{11})/);
    return match ? match[1] : '';
  }

  const getTweetId = (url: string) => {
    const match = url.match(/(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/);
    return match ? match[1] : '';
  }

  const getInstaMeta = (b: Bookmark) => {
    let username = 'instagram_user';
    let likes = '';
    let caption = b.description || ''; 

    const descMatch = b.description?.match(/([\d,KMB]+)\s+likes?.*?-\s+([^ ]+)\s+on\s+[^:]+:\s+"(.*)"/i);
    if (descMatch) {
        likes = descMatch[1];
        username = descMatch[2];
        caption = descMatch[3];
    } else if (b.title && b.title.includes('on Instagram:')) {
        username = b.title.split(' on Instagram:')[0].replace(/[^a-zA-Z0-9_.]/g, '').toLowerCase();
        caption = b.title.split('on Instagram: "')[1]?.slice(0, -1) || caption;
    } else if (b.url) {
        const urlMatch = b.url.match(/instagram\.com\/([^/]+)/);
        if (urlMatch && !['p','reel','tv'].includes(urlMatch[1])) username = urlMatch[1];
    }
    return { username, likes, caption };
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' at ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

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
  const ytVideoId = getYouTubeId(bookmark.url);
  const ytHighResThumbnail = ytVideoId ? `https://img.youtube.com/vi/${ytVideoId}/maxresdefault.jpg` : null;

  const previewImageUrl = bookmark.image_url || ytHighResThumbnail || `https://s.wordpress.com/mshots/v1/${encodeURIComponent(bookmark.url)}?w=800`
  const hasValidTitle = bookmark.title && !['Text Snippet', 'Saved Image', 'Saved Item', 'Untitled', ''].includes(bookmark.title);
  const instaData = displayType === 'instagram' ? getInstaMeta(bookmark) : null;
  
  const availableCats = folderHierarchy ? Object.keys(folderHierarchy).filter(c => c !== 'All') : []
  const filteredCats = availableCats.filter(c => c.toLowerCase().includes(editCategory.toLowerCase()))
  const availableSubs = (folderHierarchy && editCategory && folderHierarchy[editCategory]) ? folderHierarchy[editCategory] : []
  const filteredSubs = availableSubs.filter(s => s.toLowerCase().includes(editSubCategory.toLowerCase()))

  return (
    <>
      {/* ─── GLOBAL CUSTOM SCROLLBARS ─── */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(156, 163, 175, 0.3); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(156, 163, 175, 0.5); }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(75, 85, 99, 0.5); }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(75, 85, 99, 0.8); }
      `}} />

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
            <p className="text-[16px] font-serif text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap break-words line-clamp-10 w-full">
              {bookmark.content}
            </p>
          </div>
          
        ) : displayType === 'twitter' ? (
          // NATIVE EMBED FOR GRID VIEW: Securely captures Quote Tweets and Threads. 
          // Uses fixed height with hidden overflow to act as a preview thumbnail without breaking grid.
          <div className="w-full bg-white dark:bg-[#000000] rounded-2xl relative overflow-hidden shadow-sm border border-gray-100 dark:border-white/5 h-[350px]">
            <iframe 
              src={`https://platform.twitter.com/embed/Tweet.html?dnt=true&theme=dark&id=${getTweetId(bookmark.url)}`} 
              className="absolute top-0 left-0 w-full h-[600px] border-none bg-transparent pointer-events-none scale-[0.98] origin-top" 
              title="X Post"
              scrolling="no"
              tabIndex={-1}
            />
            {/* Click shield allows dragging/clicking the card without triggering iframe interactions */}
            <div className="absolute inset-0 z-10 bg-transparent hover:bg-white/5 transition-colors" />
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
            <img src={ytHighResThumbnail || previewImageUrl} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/30 transition-colors z-10">
              <PlayCircleIcon className="w-12 h-12 text-white drop-shadow-lg" />
            </div>
          </div>

        ) : displayType === 'video' ? (
          <div className="w-full aspect-video relative rounded-2xl overflow-hidden shadow-sm bg-black border border-transparent dark:border-white/5">
            <video src={bookmark.url} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" muted autoPlay playsInline loop onMouseEnter={(e) => (e.target as HTMLVideoElement).play()} onMouseLeave={(e) => (e.target as HTMLVideoElement).pause()} />
          </div>
          
        ) : displayType === 'pdf' ? (
          <div className="w-full relative aspect-[3/4] bg-[#8ba3a0] dark:bg-[#334155] rounded-xl overflow-hidden flex items-center justify-center p-4 md:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-transparent dark:border-white/5">
            <div 
              className="w-full h-full bg-white shadow-xl relative flex flex-col items-center justify-center overflow-hidden"
              style={{ clipPath: 'polygon(0 0, calc(100% - 36px) 0, 100% 36px, 100% 100%, 0 100%)' }}
            >
              <div className="absolute top-0 right-0 w-[36px] h-[36px] bg-[#c1ccc9] shadow-[-2px_2px_6px_rgba(0,0,0,0.15)] rounded-bl z-20" />
              <div className="w-full h-full relative z-10 bg-white">
                 <iframe 
                   src={`${bookmark.url}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`} 
                   className="absolute top-[-16px] left-[-16px] w-[calc(200%+32px)] h-[calc(200%+32px)] scale-[0.5] origin-top-left border-none pointer-events-none bg-white" 
                   title="PDF Preview"
                   scrolling="no"
                   tabIndex={-1}
                 />
                 <div className="absolute inset-0 z-20 bg-transparent" />
              </div>
            </div>
          </div>
          
        ) : (
          // Default Web Link / Image fallback
          <div className="w-full relative rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 dark:border-white/5 bg-white dark:bg-[#1E2024]">
            <img src={previewImageUrl} alt={bookmark.title} className="w-full h-auto max-h-64 object-cover block group-hover:scale-[1.03] transition-transform duration-700 ease-out" loading="lazy" onError={(e) => { ;(e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${getDomain(bookmark.url)}&background=random&size=600&font-size=0.1` }} />
          </div>
        )}

        {/* 2. THE FLOATING METADATA */}
        {displayType !== 'note' && displayType !== 'twitter' && (
          <div className="px-1 flex flex-col min-w-0 gap-1 w-full mt-1">
            {hasValidTitle && displayType !== 'instagram' && (
              <h4 className="text-[14px] font-semibold font-sans text-gray-800 dark:text-gray-200 line-clamp-2 leading-snug w-full">
                {bookmark.title}
              </h4>
            )}
            <p className="text-[12px] text-gray-500 dark:text-gray-400 font-sans line-clamp-1 w-full">
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
            <div className={`w-full md:w-[60%] h-[35%] min-h-[200px] md:min-h-0 md:h-full bg-white dark:bg-[#2D3748] relative flex flex-col border-b md:border-b-0 md:border-r border-[#E5E0D8] dark:border-[#4A5568] transition-colors duration-500 custom-scrollbar overflow-y-auto ${displayType === 'note' ? 'overflow-hidden' : 'items-center justify-center'}`}>
              
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
                    className="w-full h-full bg-transparent p-6 pt-14 md:p-20 font-serif text-lg sm:text-xl md:text-2xl leading-loose text-[#2D3748] dark:text-[#E2E8F0] outline-none resize-none whitespace-pre-wrap break-words custom-scrollbar overflow-y-auto selection:bg-[#EBF8FF] selection:text-[#2B6CB0] dark:selection:bg-[#2A4365] dark:selection:text-[#90CDF4]"
                    spellCheck={false}
                  />
                </div>

              ) : displayType === 'twitter' ? (
                // NATIVE EMBED FOR MODAL VIEW: Shows exact full content (threads, videos, quotes). 
                // Scaled specifically to prevent horizontal cutoff and scrollbar overflows.
                <div className="w-full h-full flex bg-[#151618] dark:bg-[#000000] p-4 md:p-8 custom-scrollbar overflow-y-auto">
                  <div className="w-full max-w-[550px] m-auto bg-transparent relative flex justify-center min-h-[85vh]">
                    <iframe 
                      src={`https://platform.twitter.com/embed/Tweet.html?dnt=true&theme=dark&id=${getTweetId(bookmark.url)}`} 
                      className="w-full h-[85vh] border-none bg-transparent custom-scrollbar" 
                      title="X Post"
                    />
                  </div>
                </div>

              ) : displayType === 'instagram' && instaData ? (
                <div className="w-full min-h-full flex bg-gray-50 dark:bg-[#000000] p-0 md:p-4 py-12 md:py-8 overflow-y-auto custom-scrollbar">
                  <div className="w-full md:max-w-[450px] bg-white dark:bg-[#000000] md:border border-gray-200 dark:border-white/10 md:rounded-sm flex flex-col m-auto shadow-xl">
                    
                    <div className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-white/10 shrink-0">
                      <div className="flex items-center gap-3">
                        <span className="text-[14px] font-semibold text-gray-900 dark:text-white leading-none">{instaData.username}</span>
                      </div>
                      <div className="text-gray-900 dark:text-white"><InstaDotsIcon /></div>
                    </div>

                    <div className="w-full bg-black relative shrink-0 flex items-center justify-center">
                      {isVideoMedia(bookmark.image_url) ? (
                         <video src={bookmark.image_url!} autoPlay muted playsInline loop className="w-full h-auto max-h-[600px] object-contain block" />
                      ) : (
                         <img src={bookmark.image_url || previewImageUrl} className="w-full h-auto max-h-[600px] object-contain block" />
                      )}
                    </div>

                    <div className="p-4 flex flex-col gap-2 shrink-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-4 text-gray-900 dark:text-white">
                          <InstaHeartIcon />
                          <InstaCommentIcon />
                          <InstaShareIcon />
                        </div>
                        <div className="text-gray-900 dark:text-white"><InstaSaveIcon /></div>
                      </div>
                      
                      {instaData.likes && (
                        <div className="text-[14px] font-semibold text-gray-900 dark:text-white">{instaData.likes} likes</div>
                      )}
                      
                      <div className="text-[14px] text-gray-900 dark:text-white whitespace-pre-wrap leading-relaxed mt-1">
                        <span className="font-semibold mr-2">{instaData.username}</span>
                        {instaData.caption}
                      </div>
                      
                      <div className="text-[10px] text-gray-400 uppercase mt-2 tracking-wide">
                        {formatDate(bookmark.created_at)}
                      </div>
                    </div>
                  </div>
                </div>

              ) : displayType === 'youtube' ? (
                <div className="w-full h-full bg-[#050505] flex items-center justify-center relative overflow-hidden transition-colors duration-500">
                  <iframe 
                    src={`https://www.youtube.com/embed/${getYouTubeId(bookmark.url)}`} 
                    className="w-full h-full border-none" 
                    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen 
                    title="YouTube Video"
                  />
                </div>

              ) : displayType === 'tiktok' ? (
                <div className="w-full h-full relative flex items-center justify-center bg-gray-100 dark:bg-[#0f1419] overflow-hidden">
                  <img src={bookmark.image_url || previewImageUrl} className="w-full h-full object-contain z-10" />
                  
                  <div className="absolute bottom-4 left-4 z-20 group/info flex flex-col items-start gap-2">
                     <div className="opacity-0 group-hover/info:opacity-100 transition-opacity bg-black/80 backdrop-blur text-white text-[12px] p-3 rounded-xl max-w-[260px] shadow-lg pointer-events-none">
                         This content plays at the original link. TikTok blocks us from embedding their media.
                         <div className="mt-2">
                            <a href={bookmark.url} target="_blank" rel="noreferrer" className="text-blue-400 font-bold hover:underline pointer-events-auto">Watch Original</a>
                         </div>
                     </div>
                     <div className="bg-black/40 backdrop-blur p-2.5 rounded-full text-white cursor-pointer hover:bg-black/60 transition shadow-sm">
                        <InfoIcon className="w-5 h-5" />
                     </div>
                  </div>
                </div>

              ) : displayType === 'video' ? (
                <div className="w-full h-full bg-[#050505] flex items-center justify-center relative overflow-hidden transition-colors duration-500">
                   <video src={bookmark.url} controls autoPlay className="w-full h-full object-contain" />
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
            <div className="w-full md:w-[40%] flex-1 md:h-full flex flex-col bg-[#FDFCF8] dark:bg-[#1A202C] custom-scrollbar overflow-y-auto transition-colors duration-500 pb-16 md:pb-0">
              <div className="px-6 md:px-12 py-8 md:py-12 flex flex-col min-h-full">
                
                <div className="flex flex-col gap-10 md:gap-12 flex-1">
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
                          <ul className="absolute z-10 w-full mt-1 max-h-48 custom-scrollbar overflow-y-auto bg-white dark:bg-[#2D3748] border border-[#E5E0D8] dark:border-[#4A5568] shadow-lg rounded-sm py-1">
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
                          <ul className="absolute z-10 w-full mt-1 max-h-48 custom-scrollbar overflow-y-auto bg-white dark:bg-[#2D3748] border border-[#E5E0D8] dark:border-[#4A5568] shadow-lg rounded-sm py-1">
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
                  {displayType !== 'note' && (
                    <div className="flex-1 flex flex-col min-h-[140px] gap-4">
                      <label className="text-[10px] font-sans text-[#718096] dark:text-[#A0AEC0] uppercase tracking-widest">
                        {['instagram', 'twitter', 'tiktok'].includes(displayType || '') ? 'Caption / Notes' : 'Personal Notes'}
                      </label>
                      <textarea
                        value={editContent || ''}
                        onChange={(e) => setEditContent(e.target.value)}
                        onBlur={handleAutoSave}
                        placeholder="Add personal notes..."
                        className="w-full flex-1 bg-white dark:bg-[#2D3748] border border-[#E5E0D8] dark:border-[#4A5568] p-4 text-sm font-serif text-[#2D3748] dark:text-[#E2E8F0] outline-none focus:border-[#2B6CB0] dark:focus:border-[#90CDF4] resize-none transition-colors rounded-sm placeholder-[#A0AEC0] dark:placeholder-[#718096] custom-scrollbar overflow-y-auto"
                      />
                    </div>
                  )}
                </div>

                {/* Footer: Date & Delete */}
                <div className="flex flex-col gap-3 pt-6 border-t border-[#E5E0D8] dark:border-[#4A5568] mt-8">
                  <div className="text-[14px] font-medium font-sans text-[#718096] dark:text-[#A0AEC0]">
                     Saved {formatDateTime(bookmark.created_at)}
                  </div>
                  <button 
                    onClick={() => setShowDeleteConfirm(true)} 
                    className="text-[#A0AEC0] dark:text-[#718096] hover:text-[#C53030] dark:hover:text-[#FC8181] font-sans text-[10px] uppercase tracking-widest transition-colors flex items-center gap-2 cursor-pointer w-max"
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

      {/* Reader Overlay omitted here for brevity since it's unmodified */}
    </>
  )
}