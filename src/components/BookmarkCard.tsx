'use client'
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/utils/supabase/client'
import { Bookmark } from '@/types'
import toast from 'react-hot-toast'
import TipTapEditor from './TipTapEditor'

// Base UI Icons
const TrashIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
const ExternalLinkIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
const CloseIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
const PlayCircleIcon = ({ className = "" }: { className?: string }) => <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
const InfoIcon = ({ className = "" }: { className?: string }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>

// Social Brand Icons
const XIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/></svg>

const InstagramIcon = ({ className = "" }: { className?: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="url(#ig-gradient)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <defs>
      <linearGradient id="ig-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#FCAF45" />
        <stop offset="50%" stopColor="#FD1D1D" />
        <stop offset="100%" stopColor="#833AB4" />
      </linearGradient>
    </defs>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
)

const YouTubeIcon = ({ className = "" }: { className?: string }) => <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.016 3.016 0 0 0-2.122 2.136C0 8.07 0 12 0 12s0 3.93.501 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.55 9.377.55 9.377.55s7.505 0 9.377-.55a3.016 3.016 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
const TikTokIcon = ({ className = "" }: { className?: string }) => <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.12-3.44-3.17-3.61-5.46-.11-1.43.15-2.88.85-4.1 1.25-2.18 3.65-3.5 6.13-3.32.06 1.35.03 2.7.04 4.05-1.2-.2-2.48.06-3.41.87-.91.79-1.32 2.05-1.07 3.22.25 1.18 1.12 2.15 2.25 2.47 1.05.3 2.23.09 3.09-.59.85-.68 1.34-1.74 1.4-2.82.09-3.79.05-7.59.07-11.38Z"/></svg>

// Instagram Native Modal Icons
const InstaHeartIcon = () => <svg aria-label="Like" fill="currentColor" height="24" role="img" viewBox="0 0 24 24" width="24"><path d="M16.792 3.904A4.989 4.989 0 0 1 21.5 9.122c0 3.072-2.652 4.959-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.438-.283-1.791-1.509-4.303-3.752C5.152 14.081 2.5 12.194 2.5 9.122a4.989 4.989 0 0 1 4.708-5.218 4.21 4.21 0 0 1 3.675 1.941c.84 1.175.98 1.514 1.117 1.514s.277-.339 1.117-1.514a4.21 4.21 0 0 1 3.675-1.941z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2"></path></svg>
const InstaCommentIcon = () => <svg aria-label="Comment" fill="currentColor" height="24" role="img" viewBox="0 0 24 24" width="24"><path d="M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L22 22Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2"></path></svg>
const InstaShareIcon = () => <svg aria-label="Share Post" fill="currentColor" height="24" role="img" viewBox="0 0 24 24" width="24"><line fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" x1="22" x2="9.218" y1="3" y2="10.083"></line><polygon fill="none" points="11.698 20.334 22 3.001 2 3.001 9.218 10.084 11.698 20.334" stroke="currentColor" strokeLinejoin="round" strokeWidth="2"></polygon></svg>
const InstaSaveIcon = () => <svg aria-label="Save" fill="currentColor" height="24" role="img" viewBox="0 0 24 24" width="24"><polygon fill="none" points="20 21 12 13.44 4 21 4 3 20 3 20 21" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></polygon></svg>
const InstaDotsIcon = () => <svg aria-label="More Options" fill="currentColor" height="24" role="img" viewBox="0 0 24 24" width="24"><circle cx="12" cy="12" r="1.5"></circle><circle cx="6" cy="12" r="1.5"></circle><circle cx="18" cy="12" r="1.5"></circle></svg>

const isVideoMedia = (url?: string | null) => {
  if (!url) return false;
  const l = url.toLowerCase();
  
  // 1. Strictly block ALL image domains and known thumbnails
  if (l.includes('pbs.twimg.com') || l.match(/\.(jpe?g|png|gif|webp)/i) || l.includes('format=jpg') || l.includes('format=png') || l.includes('thumb')) {
    return false;
  }
  
  // 2. Only accept true video extensions
  return l.includes('.mp4') || l.includes('.webm') || l.includes('.mov');
};

const renderTwitterText = (text: string, isExpanded: boolean = false) => {
  if (!text) return null;
  
  const parts = text.split(/(https?:\/\/(?:twitter\.com|x\.com)\/\w+\/status\/\d+(?:\?[^\s]*)?)/g);
  
  return parts.map((part, i) => {
    const quoteMatch = part.match(/https?:\/\/(?:twitter\.com|x\.com)\/(\w+)\/status\/(\d+)/);
    
    if (quoteMatch) {
      return (
        <div key={i} className="mt-3 mb-1 w-full rounded-xl overflow-hidden border border-black/[0.04] dark:border-white/[0.04] bg-gray-50 dark:bg-black pointer-events-auto relative z-20" onPointerDown={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
           <iframe 
             src={`https://platform.twitter.com/embed/Tweet.html?dnt=true&theme=dark&id=${quoteMatch[2]}`} 
             className={`w-full border-none bg-transparent ${isExpanded ? 'h-[350px] overflow-y-auto custom-scrollbar' : 'h-[200px]'}`} 
             title="Nested X Post"
             scrolling={isExpanded ? "yes" : "no"}
           />
        </div>
      );
    }

    const subParts = part.split(/(https?:\/\/[^\s]+|@\w+|#\w+)/g);
    return subParts.map((sub, j) => {
      if (sub.match(/^(https?:\/\/[^\s]+|@\w+|#\w+)$/)) {
        return (
          <a 
            key={`${i}-${j}`} 
            href={sub.startsWith('http') ? sub : `https://x.com/${sub}`} 
            target="_blank" 
            rel="noreferrer" 
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()} 
            onClick={(e) => e.stopPropagation()} 
            className="text-[#1DA1F2] hover:underline relative z-20 pointer-events-auto"
          >
            {sub}
          </a>
        );
      }
      return <span key={`${i}-${j}`}>{sub}</span>;
    });
  });
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
  isMinimalist?: boolean;
}

export default function BookmarkCard({ bookmark, isDragged, onDragStart, onDragEnd, updateBookmark, deleteBookmark, forceOpenModal, onCloseForcedModal, folderHierarchy, isMinimalist }: BookmarkCardProps) {
  const [mounted, setMounted] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isFullscreenImage, setIsFullscreenImage] = useState(false)
  
  const [showCatDropdown, setShowCatDropdown] = useState(false)
  const [showSubDropdown, setShowSubDropdown] = useState(false)
  
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)
  
  const confirmDeleteRef = useRef<HTMLButtonElement>(null)
  
  const supabase = createClient()

  const [editTitle, setEditTitle] = useState(bookmark.title || '')
  const [editUrl, setEditUrl] = useState(bookmark.url || '')
  const [editCategory, setEditCategory] = useState(bookmark.category || '')
  const [editSubCategory, setEditSubCategory] = useState(bookmark.sub_category || '')
  const [editDescription, setEditDescription] = useState(bookmark.description || '')
  const [editContent, setEditContent] = useState(bookmark.content || '')

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('b') === String(bookmark.id)) {
      setIsModalOpen(true);
    }

    const handlePopState = () => {
      const currentParams = new URLSearchParams(window.location.search);
      if (currentParams.get('b') === String(bookmark.id)) {
        setIsModalOpen(true);
      } else if (isModalOpen) {
        setIsVisible(false);
        setTimeout(() => setIsModalOpen(false), 300);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [mounted, bookmark.id, isModalOpen]);

  const openModal = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('b') !== String(bookmark.id)) {
      params.set('b', String(bookmark.id));
      window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
    }
    setIsModalOpen(true);
  }, [bookmark.id]);

  useEffect(() => { 
    if (forceOpenModal) openModal(); 
  }, [forceOpenModal, openModal]);

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

  useEffect(() => {
    if (showDeleteConfirm && confirmDeleteRef.current) {
      confirmDeleteRef.current.focus()
    }
  }, [showDeleteConfirm])

  const formatUrl = (rawUrl: string) => { const t = rawUrl.trim(); if (!t) return ''; return !t.startsWith('http://') && !t.startsWith('https://') ? 'https://' + t : t }

  const handleAutoSave = async () => {
    if (editTitle.trim() === (bookmark.title || '') && formatUrl(editUrl) === bookmark.url && editCategory.trim() === (bookmark.category || '') && editSubCategory.trim() === (bookmark.sub_category || '') && editDescription.trim() === (bookmark.description || '') && editContent === (bookmark.content || '')) return;
    await updateBookmark(bookmark.id, { title: editTitle.trim() || '', url: formatUrl(editUrl), category: editCategory.trim() || 'Uncategorized', sub_category: editSubCategory.trim() || null, description: editDescription.trim() || null, content: editContent || null })
    
    toast.success('Saved', { style: { background: '#4D6A51', color: 'white', border: 'none', borderRadius: '12px' } })
  }

  const handleCloseModal = () => { 
    setIsVisible(false) 
    setTimeout(() => {
      setIsModalOpen(false)
      setShowDeleteConfirm(false)
      setIsFullscreenImage(false)
      if (onCloseForcedModal) onCloseForcedModal()
    }, 300) 

    const params = new URLSearchParams(window.location.search);
    if (params.get('b') === String(bookmark.id)) {
      params.delete('b');
      const newUrl = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname;
      window.history.pushState({}, '', newUrl);
    }
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
        if (isFullscreenImage) {
          setIsFullscreenImage(false)
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
  }, [isModalOpen, showDeleteConfirm, isFullscreenImage, editTitle, editUrl, editCategory, editSubCategory, editDescription, editContent])

  const getDomain = (link: string) => { try { const clean = link.split('#:~:text=')[0]; return new URL(clean).hostname.replace('www.', '') } catch { return 'source' } }

  const handleConfirmDelete = async () => { 
    if (bookmark.file_path) await supabase.storage.from('attachments').remove([bookmark.file_path])
    await deleteBookmark(bookmark.id); 
    setShowDeleteConfirm(false); 
    handleCloseModal(); 
  }

  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([^?&/]{11})/);
    return match ? match[1] : '';
  }

  const getTwitterAuthor = (url: string) => {
    const match = url.match(/(?:twitter\.com|x\.com)\/([^/]+)/);
    return match ? match[1] : 'unknown';
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
  const isYouTubeShort = bookmark.url?.toLowerCase().includes('/shorts/');
  const ytHighResThumbnail = ytVideoId ? `https://img.youtube.com/vi/${ytVideoId}/maxresdefault.jpg` : null;

  const previewImageUrl = bookmark.image_url || ytHighResThumbnail || `https://s.wordpress.com/mshots/v1/${encodeURIComponent(bookmark.url)}?w=800`
  const hasValidTitle = bookmark.title && !['Text Snippet', 'Saved Image', 'Saved Item', 'Untitled', ''].includes(bookmark.title);
  const instaData = displayType === 'instagram' ? getInstaMeta(bookmark) : null;
  
  const availableCats = folderHierarchy ? Object.keys(folderHierarchy).filter(c => c !== 'All') : []
  const filteredCats = availableCats.filter(c => c.toLowerCase().includes(editCategory.toLowerCase()))
  const availableSubs = (folderHierarchy && editCategory && folderHierarchy[editCategory]) ? folderHierarchy[editCategory] : []
  const filteredSubs = availableSubs.filter(s => s.toLowerCase().includes(editSubCategory.toLowerCase()))

  const plainTextLength = bookmark.content ? bookmark.content.replace(/<[^>]*>?/gm, '').trim().length : 0;
  const isLongNote = plainTextLength > 250;

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(156, 163, 175, 0.3); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(156, 163, 175, 0.5); }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(75, 85, 99, 0.5); }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(75, 85, 99, 0.8); }
      `}} />

      <div 
        draggable 
        onDragStart={(e) => onDragStart(e, bookmark.id)} 
        onDragEnd={onDragEnd} 
        onClick={openModal} 
        className={`group relative flex flex-col w-full min-w-0 cursor-pointer gap-1 sm:gap-2.5 select-none transition-transform duration-300 ${isDragged ? 'opacity-40' : 'hover:-translate-y-1'}`}
      >
        
        {displayType === 'note' ? (
          <div className="w-full bg-white dark:bg-[#151815] rounded-xl sm:rounded-2xl p-4 sm:p-6 flex flex-col min-w-0 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-black/[0.04] dark:border-white/[0.04] relative overflow-hidden max-h-[260px] sm:max-h-[340px]">
            <div className="tiptap prose prose-sm sm:prose-base dark:prose-invert max-w-none font-serif text-[#171A17] dark:text-[#F3F0E9] break-words w-full" dangerouslySetInnerHTML={{ __html: bookmark.content || '' }} />
            {isLongNote && (
              <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-white dark:from-[#151815] to-transparent pointer-events-none" />
            )}
          </div>
          
        ) : displayType === 'twitter' ? (
          <div className="w-full bg-white dark:bg-[#1C1D21] rounded-xl sm:rounded-2xl p-4 md:p-5 flex flex-col min-w-0 gap-3 shadow-[0_2px_12px_rgba(0,0,0,0.04)] dark:shadow-none border border-gray-100 dark:border-transparent relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-[#1DA1F2]" />
            <div className="text-[#0f1419] dark:text-[#e7e9ea] mt-1 pl-1">
              <XIcon />
            </div>
            
            <div className="text-[13px] sm:text-[14px] font-sans text-[#171A17] dark:text-[#F3F0E9] line-clamp-6 w-full leading-relaxed whitespace-pre-wrap px-1 relative z-20 pointer-events-auto">
              {renderTwitterText(bookmark.description || bookmark.content || bookmark.title || '', false)}
            </div>
            
            {bookmark.image_url && (
              <div className="w-full mt-1 relative rounded-lg sm:rounded-xl overflow-hidden border border-gray-100 dark:border-white/5">
                {isVideoMedia(bookmark.image_url) ? (
                  <video src={bookmark.image_url} autoPlay={true} muted={true} playsInline={true} loop={true} className="w-full h-auto max-h-56 object-cover block" />
                ) : (
                  <>
                    <img src={bookmark.image_url} className="w-full h-auto max-h-56 object-cover block" loading="lazy" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/10 transition-colors">
                       <PlayCircleIcon className="w-12 h-12 text-white/90 drop-shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </>
                )}
              </div>
            )}
            
            <p className="text-[11px] sm:text-[12px] text-gray-500 dark:text-[#6B7280] font-sans mt-1 px-1">
              by {getTwitterAuthor(bookmark.url)}
            </p>
          </div>

        ) : ['instagram', 'tiktok'].includes(displayType || '') ? (
          <div className="w-full aspect-[4/5] relative rounded-xl sm:rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.04)] bg-gray-100 dark:bg-[#151815] border border-black/[0.04] dark:border-white/[0.04]">
            {displayType === 'instagram' ? (
              <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#FCAF45] z-20" />
            ) : (
              <div className="absolute top-0 left-0 w-full h-[4px] bg-[#25F4EE] z-20" />
            )}
            
            <img src={bookmark.image_url || previewImageUrl} className="w-full h-full object-cover block group-hover:scale-[1.03] transition-transform duration-700 ease-out" loading="lazy" />
            
            <div className={`absolute top-3 left-3 sm:top-4 sm:left-4 z-10 rounded-full p-1 sm:p-1.5 shadow-sm ${displayType === 'instagram' ? 'bg-white' : 'bg-black text-white'}`}>
              {displayType === 'instagram' ? <InstagramIcon /> : <TikTokIcon />}
            </div>
            
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-colors z-10 pointer-events-none">
              <PlayCircleIcon className="w-10 h-10 sm:w-14 sm:h-14 text-white/90 drop-shadow-lg" />
            </div>
          </div>

        ) : displayType === 'youtube' ? (
          <div className={`w-full ${isYouTubeShort ? 'aspect-[4/5]' : 'aspect-video'} relative rounded-xl sm:rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.04)] bg-black border border-black/[0.04] dark:border-white/[0.04]`}>
            <div className="absolute top-0 left-0 w-full h-[3px] bg-[#FF0000] z-20" />
            <img src={ytHighResThumbnail || previewImageUrl} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
            
            <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 rounded-full p-1 sm:p-1.5 shadow-sm bg-white">
              <YouTubeIcon className="text-[#FF0000]" />
            </div>

            <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/30 transition-colors z-10 pointer-events-none">
              <PlayCircleIcon className="w-10 h-10 sm:w-12 sm:h-12 text-white drop-shadow-lg" />
            </div>
          </div>

        ) : displayType === 'video' ? (
          <div className="w-full aspect-video relative rounded-xl sm:rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.04)] bg-black border border-black/[0.04] dark:border-white/[0.04]">
            <video src={bookmark.url} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" muted autoPlay playsInline loop onMouseEnter={(e) => (e.target as HTMLVideoElement).play()} onMouseLeave={(e) => (e.target as HTMLVideoElement).pause()} />
          </div>
          
        ) : displayType === 'pdf' ? (
          <div className="w-full relative aspect-[3/4] bg-[#8ba3a0] dark:bg-[#334155] rounded-xl sm:rounded-2xl overflow-hidden flex items-center justify-center p-3 md:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-transparent dark:border-white/5">
            <div 
              className="w-full h-full bg-[#FAF9F5] shadow-xl relative flex flex-col items-center justify-center overflow-hidden"
              style={{ clipPath: 'polygon(0 0, calc(100% - 36px) 0, 100% 36px, 100% 100%, 0 100%)' }}
            >
              <div className="absolute top-0 right-0 w-[24px] h-[24px] sm:w-[36px] sm:h-[36px] bg-[#c1ccc9] shadow-[-2px_2px_6px_rgba(0,0,0,0.15)] rounded-bl z-20" />
              <div className="w-full h-full relative z-10 bg-white">
                 <iframe 
                   src={`${bookmark.url}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`} 
                   className="absolute top-1/2 left-1/2 w-[115%] h-[115%] -translate-x-1/2 -translate-y-1/2 border-none pointer-events-none bg-white" 
                   title="PDF Preview"
                   scrolling="no"
                   tabIndex={-1}
                 />
                 <div className="absolute inset-0 z-20 bg-transparent" />
              </div>
            </div>
          </div>
          
        ) : (
          <div className="w-full relative rounded-xl sm:rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-black/[0.04] dark:border-white/[0.04] bg-white dark:bg-[#151815]">
            <img src={previewImageUrl} alt={bookmark.title} className="w-full h-auto max-h-64 object-cover block group-hover:scale-[1.03] transition-transform duration-700 ease-out" loading="lazy" onError={(e) => { ;(e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${getDomain(bookmark.url)}&background=random&size=600&font-size=0.1` }} />
          </div>
        )}

        {/* Minimalist View hides this meta section */}
        {!isMinimalist && displayType !== 'note' && displayType !== 'twitter' && (
          <div className="px-1 flex flex-col min-w-0 gap-1 w-full mt-1 pb-1 sm:pb-0">
            {hasValidTitle && displayType !== 'instagram' && (
              <h4 className="text-[13px] sm:text-[14px] font-semibold font-sans text-[#171A17] dark:text-[#F3F0E9] line-clamp-2 leading-snug w-full">
                {bookmark.title}
              </h4>
            )}
            <p className="text-[11px] sm:text-[12px] text-gray-500 dark:text-gray-400 font-sans line-clamp-1 w-full">
              {displayType === 'pdf' ? 'PDF DOCUMENT' : getDomain(bookmark.url)}
            </p>
          </div>
        )}
      </div>

      {mounted && isModalOpen && createPortal(
        <div className={`fixed inset-0 z-[9999] flex items-end md:items-center justify-center p-0 md:p-6 lg:p-10 bg-[#FBF9F4]/80 dark:bg-[#080A08]/90 backdrop-blur-md transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`} onMouseDown={handleCloseWithSave}>
          
          <div 
            className={`relative w-full h-[100dvh] md:h-[90vh] flex flex-col md:flex-row bg-[#FAF9F5] dark:bg-[#0F120F] border-0 md:border border-black/[0.04] dark:border-white/[0.04] shadow-[0_20px_60px_rgba(0,0,0,0.08)] md:shadow-2xl rounded-none md:rounded-3xl overflow-hidden transition-transform duration-300 ease-[cubic-bezier(0.19,1,0.22,1)] ${isVisible ? 'translate-y-0 scale-100' : 'translate-y-full md:translate-y-0 md:scale-95'}`} 
            onMouseDown={(e) => e.stopPropagation()}
          >

            {/* Drag Handle Top Bar on Mobile */}
            <div 
              className="absolute top-0 left-0 w-full h-12 z-[60] md:hidden flex items-start justify-center pt-3 touch-none"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div className="w-12 h-1.5 bg-black/10 dark:bg-white/20 rounded-full pointer-events-none" />
            </div>

            <button onClick={handleCloseWithSave} className="absolute top-4 right-4 z-[100] p-2 text-[#171A17]/50 dark:text-white/50 hover:text-[#171A17] dark:hover:text-white transition-all cursor-pointer items-center justify-center bg-black/5 dark:bg-white/5 backdrop-blur-md rounded-full shadow-sm hover:bg-black/10 dark:hover:bg-white/10">
              <CloseIcon />
            </button>

            {/* Seamless Mobile Scroll Wrapper */}
            <div className="flex-1 w-full h-full overflow-y-auto md:overflow-hidden flex flex-col md:flex-row custom-scrollbar pt-12 md:pt-0">

              {/* LEFT PANE (Preview / Editor) */}
              <div className={`w-full md:w-[60%] flex flex-col shrink-0 md:shrink border-b md:border-b-0 md:border-r border-black/[0.04] dark:border-white/[0.04] transition-colors duration-500 ${displayType === 'note' ? 'bg-[#FAF9F5] dark:bg-[#0F120F]' : 'bg-white dark:bg-[#1A1D1A]'} md:h-full md:overflow-hidden`}>
                
                {displayType === 'note' ? (
                  <div className="w-full flex flex-col relative bg-[#FAF9F5] dark:bg-[#0F120F] h-auto min-h-[50dvh] md:h-full">
                     <TipTapEditor
                       value={editContent || ''}
                       onChange={setEditContent}
                       onBlur={handleAutoSave}
                       isExpanded={true} 
                     />
                  </div>
                ) : displayType === 'twitter' ? (
                  <div className="w-full flex bg-[#151618] p-4 md:p-8 md:h-full md:overflow-y-auto custom-scrollbar">
                    <div className="w-full max-w-[500px] bg-[#1C1E23] rounded-3xl flex flex-col shadow-2xl relative overflow-hidden border border-white/5 m-auto z-20 pointer-events-auto">
                      <div className="absolute top-0 left-0 w-full h-[3px] bg-[#1DA1F2]" />
                      
                      <div className="p-6 md:p-8 flex flex-col gap-5 relative z-20 pointer-events-auto">
                        <div className="text-[15px] font-sans text-[#F3F0E9] leading-relaxed whitespace-pre-wrap relative z-20 pointer-events-auto">
                          {renderTwitterText(bookmark.description || bookmark.content || bookmark.title || '', true)}
                        </div>
                        
                        {bookmark.image_url && (
                          <div className="w-full relative rounded-xl overflow-hidden border border-white/5 bg-black/20">
                            {isVideoMedia(bookmark.image_url) ? (
                               <video src={bookmark.image_url} autoPlay={true} muted={true} playsInline={true} loop={true} className="w-full h-auto object-contain max-h-[50vh] block" />
                            ) : (
                               <img src={bookmark.image_url} className="w-full h-auto object-contain max-h-[50vh] block" />
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="px-6 md:px-8 py-4 bg-[#181A1F] border-t border-white/5 flex items-center justify-between text-white/50">
                        <span className="text-[12px] font-sans">
                          Post by {getTwitterAuthor(bookmark.url)} on {formatDate(bookmark.created_at)}
                        </span>
                        <XIcon />
                      </div>
                    </div>
                  </div>

                ) : displayType === 'instagram' && instaData ? (
                  <div className="w-full flex bg-gray-50 dark:bg-black p-0 md:p-4 py-8 md:h-full md:overflow-y-auto custom-scrollbar">
                    <div className="w-full md:max-w-[450px] bg-white dark:bg-[#151815] md:border border-black/[0.04] dark:border-white/[0.04] md:rounded-3xl flex flex-col m-auto shadow-xl">
                      
                      <div className="flex items-center justify-between p-4 border-b border-black/[0.04] dark:border-white/[0.04] shrink-0">
                        <div className="flex items-center gap-3">
                          <span className="text-[14px] font-semibold text-[#171A17] dark:text-white leading-none">{instaData.username}</span>
                        </div>
                        <div className="text-[#171A17] dark:text-white"><InstaDotsIcon /></div>
                      </div>

                      <div className="w-full bg-black relative shrink-0 flex items-center justify-center">
                        {isVideoMedia(bookmark.image_url) ? (
                           <video src={bookmark.image_url!} autoPlay={true} muted={true} playsInline={true} loop={true} className="w-full h-auto max-h-[600px] object-contain block" />
                        ) : (
                           <img src={bookmark.image_url || previewImageUrl} className="w-full h-auto max-h-[600px] object-contain block" />
                        )}
                      </div>

                      <div className="p-5 flex flex-col gap-2 shrink-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-4 text-[#171A17] dark:text-white">
                            <InstaHeartIcon />
                            <InstaCommentIcon />
                            <InstaShareIcon />
                          </div>
                          <div className="text-[#171A17] dark:text-white"><InstaSaveIcon /></div>
                        </div>
                        
                        {instaData.likes && (
                          <div className="text-[14px] font-semibold text-[#171A17] dark:text-white">{instaData.likes} likes</div>
                        )}
                        
                        <div className="text-[14px] text-[#171A17] dark:text-white whitespace-pre-wrap leading-relaxed mt-1">
                          <span className="font-semibold mr-2">{instaData.username}</span>
                          {instaData.caption}
                        </div>
                        
                        <div className="text-[10px] text-[#171A17]/50 dark:text-white/50 uppercase mt-2 tracking-wide font-bold">
                          {formatDate(bookmark.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>

                ) : displayType === 'youtube' ? (
                  <div className="w-full aspect-video md:h-full bg-[#050505] flex items-center justify-center relative overflow-hidden transition-colors duration-500">
                    <iframe 
                      src={`https://www.youtube.com/embed/${getYouTubeId(bookmark.url)}`} 
                      className="w-full h-full border-none" 
                      allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowFullScreen 
                      title="YouTube Video"
                    />
                  </div>

                ) : displayType === 'tiktok' ? (
                  <div className="w-full aspect-[9/16] md:aspect-auto md:h-full relative flex items-center justify-center bg-[#FAF9F5] dark:bg-[#0F120F] overflow-hidden">
                    <img src={bookmark.image_url || previewImageUrl} className="w-full h-full object-contain z-10" />
                    
                    <div className="absolute bottom-4 left-4 z-20 group/info flex flex-col items-start gap-2">
                       <div className="opacity-0 group-hover/info:opacity-100 transition-opacity bg-black/80 backdrop-blur-md text-white text-[12px] p-4 rounded-2xl max-w-[260px] shadow-lg pointer-events-none border border-white/10">
                           This content plays at the original link. TikTok blocks us from embedding their media.
                           <div className="mt-3">
                              <a href={bookmark.url} target="_blank" rel="noreferrer" className="text-blue-400 font-bold hover:underline pointer-events-auto">Watch Original</a>
                           </div>
                       </div>
                       <div className="bg-black/40 backdrop-blur-md p-3 rounded-full text-white cursor-pointer hover:bg-black/60 transition shadow-sm">
                          <InfoIcon className="w-5 h-5" />
                       </div>
                    </div>
                  </div>

                ) : displayType === 'video' ? (
                  <div className="w-full aspect-video md:h-full bg-[#050505] flex items-center justify-center relative overflow-hidden transition-colors duration-500">
                     <video src={bookmark.url} controls autoPlay={true} className="w-full h-full object-contain" />
                  </div>
                ) : displayType === 'pdf' ? (
                  <div className="w-full aspect-[3/4] md:h-full bg-[#FAF9F5] dark:bg-[#0F120F] flex items-center justify-center relative overflow-hidden transition-colors duration-500">
                     <iframe src={bookmark.url} className="w-full h-full border-none" title={bookmark.title} />
                  </div>
                ) : displayType === 'image' ? (
                  <div className="w-full flex relative overflow-hidden bg-[#FAF9F5] dark:bg-[#0F120F] transition-colors duration-500 cursor-zoom-in md:h-full" onClick={() => setIsFullscreenImage(true)}>
                    <img src={previewImageUrl} alt={bookmark.title} className="w-full h-auto object-cover md:h-full md:object-contain" />
                  </div>
                ) : (
                  <div className="w-full flex relative overflow-hidden bg-[#FAF9F5] dark:bg-[#0F120F] transition-colors duration-500 md:h-full">
                    <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="w-full h-full block cursor-pointer hover:opacity-90 transition-opacity">
                      <img src={previewImageUrl} alt={bookmark.title} className="w-full h-auto object-cover md:h-full md:object-contain" />
                    </a>
                  </div>
                )}
              </div>

              {/* RIGHT PANE (Meta) */}
              <div className={`w-full md:w-[40%] flex flex-col shrink-0 md:shrink bg-[#FAF9F5] dark:bg-[#151815] transition-colors duration-500 md:h-full md:overflow-y-auto custom-scrollbar pb-16 md:pb-12`}>
                <div className="px-6 md:px-10 py-8 md:py-10 flex flex-col min-h-full">
                  
                  <div className="flex flex-col gap-10 md:gap-12 flex-1 mt-4 md:mt-0">
                    
                    <div className="flex flex-col gap-3 border-b border-black/[0.04] dark:border-white/[0.04] pb-6 md:pb-8">
                      <label className="text-[10px] font-sans text-[#171A17]/50 dark:text-white/50 uppercase tracking-widest font-semibold">Title</label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={handleAutoSave}
                        placeholder="Enter Title"
                        className="w-full bg-transparent border-none outline-none text-xl md:text-2xl font-serif font-medium text-[#171A17] dark:text-[#F3F0E9] transition-colors rounded-none placeholder-[#171A17]/30 dark:placeholder-white/30"
                      />
                      
                      {bookmark.url && !bookmark.url.includes('/note-') && (
                        <div className="mt-2 flex flex-col gap-2">
                          <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-xs font-sans text-[#4D6A51] dark:text-[#8FAA91] hover:opacity-70 uppercase tracking-widest transition-opacity w-max font-semibold">
                            <span>Read Source</span>
                            <ExternalLinkIcon />
                          </a>
                          <span className="text-[11px] font-sans text-[#171A17]/40 dark:text-white/40 truncate max-w-full select-all mt-1">
                            {bookmark.url}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-4 border-b border-black/[0.04] dark:border-white/[0.04] pb-6 md:pb-8">
                      <label className="text-[10px] font-sans text-[#171A17]/50 dark:text-white/50 uppercase tracking-widest font-semibold">Folder Structure</label>
                      <div className="flex flex-col gap-4">
                        
                        <div className="relative">
                          <input
                            type="text"
                            value={editCategory}
                            onChange={(e) => { setEditCategory(e.target.value); setShowCatDropdown(true); }}
                            onFocus={() => setShowCatDropdown(true)}
                            onBlur={() => { setTimeout(() => setShowCatDropdown(false), 200); handleAutoSave(); }}
                            placeholder="Main Folder"
                            className="w-full text-sm font-sans px-5 py-3.5 bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-[0_2px_16px_rgba(0,0,0,0.06)] outline-none focus:bg-white/60 dark:focus:bg-white/10 transition-all rounded-2xl placeholder-black/40 dark:placeholder-white/40 text-[#171A17] dark:text-[#F3F0E9]"
                          />
                          {showCatDropdown && filteredCats.length > 0 && (
                            <ul className="absolute z-50 w-full mt-2 max-h-48 custom-scrollbar overflow-y-auto bg-white/90 dark:bg-[#1A1D1A]/90 backdrop-blur-xl border border-black/[0.04] dark:border-white/[0.04] shadow-lg rounded-2xl py-2">
                              {filteredCats.map(c => (
                                <li 
                                  key={c} 
                                  onMouseDown={(e) => { e.preventDefault(); setEditCategory(c); setShowCatDropdown(false); }}
                                  className="px-5 py-2.5 text-sm font-medium text-[#171A17] dark:text-[#F3F0E9] hover:bg-[#FAF9F5] dark:hover:bg-[#202520] cursor-pointer transition-colors"
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
                            className="w-full text-sm font-sans px-5 py-3.5 bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-[0_2px_16px_rgba(0,0,0,0.06)] outline-none focus:bg-white/60 dark:focus:bg-white/10 transition-all rounded-2xl placeholder-black/40 dark:placeholder-white/40 text-[#171A17] dark:text-[#F3F0E9]"
                          />
                          {showSubDropdown && filteredSubs.length > 0 && (
                            <ul className="absolute z-50 w-full mt-2 max-h-48 custom-scrollbar overflow-y-auto bg-white/90 dark:bg-[#1A1D1A]/90 backdrop-blur-xl border border-black/[0.04] dark:border-white/[0.04] shadow-lg rounded-2xl py-2">
                              {filteredSubs.map(s => (
                                <li 
                                  key={s} 
                                  onMouseDown={(e) => { e.preventDefault(); setEditSubCategory(s); setShowSubDropdown(false); }}
                                  className="px-5 py-2.5 text-sm font-medium text-[#171A17] dark:text-[#F3F0E9] hover:bg-[#FAF9F5] dark:hover:bg-[#202520] cursor-pointer transition-colors"
                                >
                                  {s}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>

                      </div>
                    </div>

                    {displayType !== 'note' && (
                      <div className="flex-1 flex flex-col min-h-[140px] gap-4">
                        <label className="text-[10px] font-sans text-[#171A17]/50 dark:text-white/50 uppercase tracking-widest font-semibold">
                          {['instagram', 'twitter', 'tiktok'].includes(displayType || '') ? 'Caption / Notes' : 'Personal Notes'}
                        </label>
                        <textarea
                          value={editContent || ''}
                          onChange={(e) => setEditContent(e.target.value)}
                          onBlur={handleAutoSave}
                          placeholder="Add personal notes..."
                          className="w-full flex-1 bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-[0_2px_16px_rgba(0,0,0,0.06)] p-5 text-base font-serif text-[#171A17] dark:text-[#F3F0E9] outline-none focus:bg-white/60 dark:focus:bg-white/10 resize-none transition-all rounded-2xl placeholder-black/40 dark:placeholder-white/40 custom-scrollbar overflow-y-auto"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 pt-6 border-t border-black/[0.04] dark:border-white/[0.04] mt-8">
                    <div className="text-[13px] font-medium font-sans text-[#171A17]/50 dark:text-white/50">
                       Saved {formatDateTime(bookmark.created_at)}
                    </div>
                    <button 
                      onClick={() => setShowDeleteConfirm(true)} 
                      className="text-[#171A17]/40 dark:text-white/40 hover:text-red-500 dark:hover:text-red-400 font-sans text-[11px] uppercase tracking-widest font-semibold transition-colors flex items-center gap-2 cursor-pointer w-max"
                    >
                      <TrashIcon /> Delete Entry
                    </button>
                  </div>

                </div>
              </div>
            </div>

            {showDeleteConfirm && (
              <div className="absolute inset-0 z-[100000] flex items-center justify-center p-4 bg-[#FBF9F4]/80 dark:bg-[#080A08]/90 backdrop-blur-md transition-colors duration-500" onMouseDown={(e) => e.stopPropagation()}>
                <div className="w-full max-w-sm bg-white dark:bg-[#151815] border border-black/[0.04] dark:border-white/[0.04] flex flex-col shadow-2xl rounded-3xl">
                  <div className="p-8 flex flex-col gap-5 text-center">
                    <h3 className="text-2xl font-serif text-[#171A17] dark:text-[#F3F0E9] leading-none">
                      Delete this entry?
                    </h3>
                    <p className="text-sm font-sans text-[#171A17]/60 dark:text-white/60">This action is permanent and cannot be undone.</p>
                    <div className="flex flex-col gap-2 mt-2">
                      <button 
                        ref={confirmDeleteRef}
                        onClick={handleConfirmDelete} 
                        onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmDelete() }}
                        className="w-full py-3 bg-[#D93025] text-white font-sans font-semibold text-xs tracking-widest uppercase hover:bg-[#B32015] transition-all rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D93025]"
                      >
                        Confirm
                      </button>
                      <button 
                        onClick={() => setShowDeleteConfirm(false)} 
                        className="w-full py-3 bg-black/5 dark:bg-white/5 text-[#171A17] dark:text-[#F3F0E9] font-sans font-semibold text-xs tracking-widest uppercase hover:bg-black/10 dark:hover:bg-white/10 transition-all rounded-2xl"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {mounted && isFullscreenImage && createPortal(
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/95 backdrop-blur-md cursor-zoom-out" onClick={() => setIsFullscreenImage(false)}>
          <button className="absolute top-4 right-4 md:top-6 md:right-6 text-white/70 hover:text-white bg-black/40 hover:bg-black/60 rounded-full p-2 transition-colors z-50 cursor-pointer">
            <CloseIcon />
          </button>
          <img src={previewImageUrl} alt={bookmark.title} className="max-w-[90vw] max-h-[90vh] object-contain shadow-2xl" />
        </div>,
        document.body
      )}
    </>
  )
}