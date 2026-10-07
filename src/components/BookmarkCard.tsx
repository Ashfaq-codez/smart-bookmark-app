'use client'
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/utils/supabase/client'
import { Bookmark } from '@/types'
import { 
  CloseIcon, PlayCircleIcon, InfoIcon, 
  XIcon, InstagramIcon, YouTubeIcon, TikTokIcon, PinterestIcon, SearchIcon 
} from './BookmarkIcons';
import { 
  isVideoMedia, getYouTubeId, getTwitterAuthor, deriveDisplayType, renderTwitterText, getPlatformMeta, getGoogleQuery 
} from '@/utils/bookmarkHelpers';
import EditorialModal from './EditorialModal'
import PinIcon from './PinIcon'

interface BookmarkCardProps {
  bookmark: Bookmark;
  theme: { card: string; btn: string; hover: string };
  isDragged: boolean;
  onDragStart: (e: React.DragEvent, id: number) => void;
  onDragEnd: () => void;
  updateBookmark: (id: number, updates: Partial<Bookmark>) => Promise<void>;
  deleteBookmark: (id: number) => Promise<void>;
  onTogglePin?: (id: number, pin: boolean) => void;
  forceOpenModal?: boolean;
  onCloseForcedModal?: () => void;
  folderHierarchy?: Record<string, string[]>;
  isMinimalist?: boolean;
}

export default function BookmarkCard({ 
  bookmark, isDragged, onDragStart, onDragEnd, 
  updateBookmark, deleteBookmark, onTogglePin, forceOpenModal, onCloseForcedModal, 
  folderHierarchy, isMinimalist 
}: BookmarkCardProps) {
  
  const [mounted, setMounted] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [isFullscreenImage, setIsFullscreenImage] = useState(false)
  const [fullscreenImageUrl, setFullscreenImageUrl] = useState('')
  const [faviconError, setFaviconError] = useState(false);
  // The list only carries a trimmed note body. The editor must receive the FULL row, or saving would overwrite the note.
  const [fullBookmark, setFullBookmark] = useState<Bookmark | null>(null)
  const supabase = createClient()

  useEffect(() => { setMounted(true) }, [])

  const isPinned = !!bookmark.pinned_at
  // A pin chosen inside the open editor is applied when it closes: pinning moves the card to the Pinned strip,
  // which would otherwise close the editor under the person's hands.
  const pendingPin = useRef<boolean | null>(null)
  const applyPendingPin = () => {
    const want = pendingPin.current
    pendingPin.current = null
    if (want !== null && want !== isPinned) onTogglePin?.(bookmark.id, want)
  }

  useEffect(() => {
    if (!mounted) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('b') === String(bookmark.id)) setIsModalOpen(true);

    const handlePopState = () => {
      const currentParams = new URLSearchParams(window.location.search);
      if (currentParams.get('b') === String(bookmark.id)) {
        setIsModalOpen(true);
      } else if (isModalOpen) {
        setIsVisible(false);
        setTimeout(() => { setIsModalOpen(false); applyPendingPin(); }, 300);
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

  useEffect(() => { if (forceOpenModal) openModal(); }, [forceOpenModal, openModal]);

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

  const handleCloseModal = () => { 
    setIsVisible(false) 
    setTimeout(() => {
      setIsModalOpen(false)
      setIsFullscreenImage(false)
      if (onCloseForcedModal) onCloseForcedModal()
      applyPendingPin()
    }, 300) 

    const params = new URLSearchParams(window.location.search);
    if (params.get('b') === String(bookmark.id)) {
      params.delete('b');
      const newUrl = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname;
      window.history.pushState({}, '', newUrl);
    }
  }

  useEffect(() => {
    if (!isModalOpen) { setFullBookmark(null); return }
    let cancelled = false
    supabase.from('bookmarks').select('*').eq('id', bookmark.id).maybeSingle().then(({ data, error }) => {
      if (cancelled) return
      if (error || !data) { handleCloseModal(); return }   // never leave the page locked with no editor on screen
      setFullBookmark(data as Bookmark)
    })
    return () => { cancelled = true }
  }, [isModalOpen, bookmark.id])

  const handleDelete = async (id: number) => {
    if (bookmark.file_path) await supabase.storage.from('attachments').remove([bookmark.file_path])
    await deleteBookmark(id);
    handleCloseModal();
  }

  const getDomain = (link: string) => { try { const clean = link.split('#:~:text=')[0]; return new URL(clean).hostname.replace('www.', '') } catch { return 'source' } }
  
  const displayType = deriveDisplayType(bookmark);
  const ytVideoId = getYouTubeId(bookmark.url);
  const isYouTubeShort = bookmark.url?.toLowerCase().includes('/shorts/');
  const ytHighResThumbnail = ytVideoId ? `https://img.youtube.com/vi/${ytVideoId}/maxresdefault.jpg` : undefined;

  const initialStep = (bookmark.image_url || ytHighResThumbnail) ? 0 : 1;
  const [fallbackStep, setFallbackStep] = useState(initialStep);

  useEffect(() => {
    setFallbackStep((bookmark.image_url || ytHighResThumbnail) ? 0 : 1);
  }, [bookmark.image_url, ytHighResThumbnail]);

 const previewImageUrl = useMemo(() => {
    if (displayType === 'google') return undefined;

    // Step 0: DB Image or YouTube Thumb
    if (fallbackStep === 0) {
      return ytHighResThumbnail || bookmark.image_url || undefined;
    }
    // No more third-party screenshot services (they showed "not authorized" and leaked saved addresses).
    // Without a saved image the card shows the site's icon instead.
    return undefined; // Triggers Favicon UI
  }, [bookmark.image_url, bookmark.url, ytHighResThumbnail, fallbackStep, displayType]);

  const hasValidTitle = bookmark.title && !['Text Snippet', 'Saved Image', 'Saved Item', 'Untitled', ''].includes(bookmark.title);
  const previewHtml = bookmark.content_preview ?? bookmark.content ?? '';
  const plainTextLength = previewHtml ? previewHtml.replace(/<[^>]*>?/gm, '').trim().length : 0;
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

      <div draggable onDragStart={(e) => onDragStart(e, bookmark.id)} onDragEnd={onDragEnd} onClick={openModal} className={`group relative isolate flex flex-col w-full min-w-0 cursor-pointer gap-1 sm:gap-2.5 select-none transition-transform duration-300 ${isDragged ? 'opacity-40' : 'hover:-translate-y-1'}`}>
        {onTogglePin && (
          <button
            type="button"
            aria-label={isPinned ? 'Unpin from top' : 'Pin to top'}
            title={isPinned ? 'Unpin' : 'Pin to top'}
            onClick={(e) => { e.stopPropagation(); onTogglePin(bookmark.id, !isPinned) }}
            onDragStart={(e) => e.preventDefault()}
            className={`absolute top-2 right-2 z-40 h-8 w-8 inline-flex items-center justify-center rounded-full bg-white/90 dark:bg-black/60 backdrop-blur shadow-sm transition-opacity hover:bg-white dark:hover:bg-black/80 focus-visible:opacity-100 ${isPinned ? 'opacity-100 text-[#4D6A51] dark:text-[#8FAA91]' : 'opacity-0 group-hover:opacity-100 text-[#171A17]/70 dark:text-white/80'}`}
          >
            <PinIcon filled={isPinned} />
          </button>
        )}
        
        {displayType === 'note' ? (
          <div className="w-full bg-white dark:bg-[#151815] rounded-xl sm:rounded-2xl p-4 sm:p-6 flex flex-col min-w-0 shadow-none group-hover:shadow-[0_10px_30px_rgba(0,0,0,0.10)] transition-shadow duration-300 relative overflow-hidden max-h-[260px] sm:max-h-[340px]">
            <div className="tiptap prose prose-sm sm:prose-base dark:prose-invert max-w-none font-serif text-[#171A17] dark:text-[#F3F0E9] break-words w-full" dangerouslySetInnerHTML={{ __html: previewHtml }} />
            {isLongNote && <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-white dark:from-[#151815] to-transparent pointer-events-none" />}
          </div>
          
        ) : displayType === 'twitter' ? (
          <div className="w-full bg-white dark:bg-[#1C1D21] rounded-xl sm:rounded-2xl p-4 md:p-5 flex flex-col min-w-0 gap-3 shadow-none group-hover:shadow-[0_10px_30px_rgba(0,0,0,0.10)] transition-shadow duration-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-[#1DA1F2]" />
            <div className="text-[#0f1419] dark:text-[#e7e9ea] mt-1 pl-1"><XIcon /></div>
            <div className="text-[13px] sm:text-[14px] font-sans text-[#171A17] dark:text-[#F3F0E9] line-clamp-6 w-full leading-relaxed whitespace-pre-wrap px-1 relative z-20 pointer-events-auto">
              {renderTwitterText(bookmark.description || previewHtml || bookmark.title || '', false)}
            </div>
            {bookmark.image_url && (
              <div className="w-full mt-1 relative rounded-lg sm:rounded-xl overflow-hidden border border-gray-100 dark:border-white/5">
                {isVideoMedia(bookmark.image_url) ? (
                  <video src={bookmark.image_url} autoPlay={true} muted={true} playsInline={true} loop={true} className="w-full h-auto max-h-56 object-cover block" />
                ) : (
                  <><img src={bookmark.image_url || undefined} alt={bookmark.title || "Post media"} className="w-full h-auto max-h-56 object-cover block" loading="lazy" /><div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/10 transition-colors"><PlayCircleIcon className="w-12 h-12 text-white/90 drop-shadow-md opacity-0 group-hover:opacity-100 transition-opacity" /></div></>
                )}
              </div>
            )}
            <p className="text-[11px] sm:text-[12px] text-gray-500 dark:text-[#6B7280] font-sans mt-1 px-1">by {getTwitterAuthor(bookmark.url)}</p>
          </div>

        ) : ['instagram', 'tiktok'].includes(displayType || '') ? (
          <div className="w-full aspect-[4/5] relative rounded-xl sm:rounded-2xl overflow-hidden shadow-none group-hover:shadow-[0_10px_30px_rgba(0,0,0,0.10)] transition-shadow duration-300 bg-gray-100 dark:bg-[#151815]">
            {displayType === 'instagram' ? <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#FCAF45] z-20" /> : <div className="absolute top-0 left-0 w-full h-[4px] bg-[#25F4EE] z-20" />}
            {previewImageUrl ? (
                <img src={previewImageUrl} alt={bookmark.title || "Post thumbnail"} className="w-full h-full object-cover block group-hover:scale-[1.03] transition-transform duration-700 ease-out" loading="lazy" onError={() => setFallbackStep(prev => prev + 1)} />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-[#262626]">
                    {displayType === 'instagram' ? <InstagramIcon className="w-12 h-12 text-black/20 dark:text-white/20" /> : <TikTokIcon className="w-12 h-12 text-black/20 dark:text-white/20" />}
                </div>
            )}
            <div className={`absolute top-3 left-3 sm:top-4 sm:left-4 z-10 opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity duration-300 rounded-full p-1 sm:p-1.5 shadow-sm ${displayType === 'instagram' ? 'bg-white' : 'bg-black text-white'}`}>
              {displayType === 'instagram' ? <InstagramIcon /> : <TikTokIcon />}
            </div>
            {previewImageUrl && <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-colors z-10 pointer-events-none"><PlayCircleIcon className="w-10 h-10 sm:w-14 sm:h-14 text-white/90 drop-shadow-lg" /></div>}
          </div>

        ) : displayType === 'youtube' ? (
          <div className={`w-full ${isYouTubeShort ? 'aspect-[4/5]' : 'aspect-video'} relative rounded-xl sm:rounded-2xl overflow-hidden shadow-none group-hover:shadow-[0_10px_30px_rgba(0,0,0,0.10)] transition-shadow duration-300 bg-black`}>
            <div className="absolute top-0 left-0 w-full h-[3px] bg-[#FF0000] z-20" />
            <img src={previewImageUrl} alt={bookmark.title || "YouTube thumbnail"} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" onError={() => setFallbackStep(prev => prev + 1)} />
            <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity duration-300 rounded-full p-1 sm:p-1.5 shadow-sm bg-white"><YouTubeIcon className="text-[#FF0000]" /></div>
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/30 transition-colors z-10 pointer-events-none"><PlayCircleIcon className="w-10 h-10 sm:w-12 sm:h-12 text-white drop-shadow-lg" /></div>
          </div>

        ) : displayType === 'google' ? (
          <div className="w-full aspect-[4/3] sm:aspect-video relative rounded-xl sm:rounded-2xl overflow-hidden shadow-none group-hover:shadow-[0_10px_30px_rgba(0,0,0,0.10)] transition-shadow duration-300 bg-[#F8F9FA] dark:bg-[#202124] flex flex-col items-center justify-center p-6 gap-4 group/google cursor-pointer hover:bg-[#f1f3f4] dark:hover:bg-[#303134] transition-colors" onClick={() => window.open(bookmark.url, '_blank')}>
             {/* Google Authentic Logo SVG */}
             <svg viewBox="0 0 272 92" width="75" height="24" xmlns="http://www.w3.org/2000/svg" className="opacity-90 group-hover/google:opacity-100 transition-opacity"><path fill="#EA4335" d="M115.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18C71.25 34.32 81.24 25 93.5 25s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44S80.99 39.2 80.99 47.18c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z"/><path fill="#FBBC05" d="M163.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18c0-12.86 9.99-22.18 22.25-22.18s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44s-12.51 5.46-12.51 13.44c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z"/><path fill="#4285F4" d="M209.75 26.34v39.82c0 16.38-9.66 23.07-21.08 23.07-10.75 0-17.22-7.19-19.66-13.07l8.48-3.53c1.51 3.61 5.21 7.87 11.17 7.87 7.31 0 11.84-4.51 11.84-13v-3.19h-.34c-2.18 2.69-6.38 5.04-11.68 5.04-11.09 0-21.25-9.66-21.25-22.09 0-12.52 10.16-22.26 21.25-22.26 5.29 0 9.49 2.35 11.68 4.96h.34v-3.61h9.25zm-8.56 20.92c0-7.81-5.21-13.52-11.84-13.52-6.72 0-12.35 5.71-12.35 13.52 0 7.73 5.63 13.36 12.35 13.36 6.63 0 11.84-5.63 11.84-13.36z"/><path fill="#34A853" d="M225 3v65h-9.5V3h9.5z"/><path fill="#EA4335" d="M262.02 54.48l7.56 5.04c-2.44 3.61-8.32 9.83-18.48 9.83-12.6 0-22.01-9.74-22.01-22.18 0-13.19 9.49-22.18 20.92-22.18 11.51 0 17.14 9.16 18.98 14.11l1.01 2.52-29.65 12.28c2.27 4.45 5.8 6.72 10.75 6.72 4.96 0 8.4-2.44 10.92-6.14zm-23.27-7.98l19.82-8.23c-1.09-2.77-4.37-4.7-8.23-4.7-4.95 0-11.84 4.37-11.59 12.93z"/><path fill="#4285F4" d="M35.29 41.41V32H67c.31 1.64.47 3.58.47 5.68 0 7.06-1.93 15.79-8.15 22.01-6.05 6.3-13.78 9.66-24.02 9.66C16.32 69.35.36 53.89.36 34.91.36 15.93 16.32.47 35.3.47c10.5 0 17.98 4.12 23.6 9.49l-6.64 6.64c-4.03-3.78-9.49-6.72-16.96-6.72-13.86 0-24.7 11.17-24.7 25.03 0 13.86 10.84 25.03 24.7 25.03 8.99 0 14.11-3.61 17.39-6.89 2.66-2.66 4.41-6.46 5.1-11.65l-22.5-.01z"/></svg>
             {/* Search Bar mockup */}
             <div className="w-full max-w-[200px] h-8 rounded-full bg-white dark:bg-[#303134] border border-[#dfe1e5] dark:border-[#5f6368] shadow-[0_1px_3px_rgba(32,33,36,0.1)] flex items-center px-3 gap-2 overflow-hidden">
                <SearchIcon className="w-3.5 h-3.5 text-[#9aa0a6] shrink-0" />
                <span className="text-[11px] text-[#202124] dark:text-[#e8eaed] truncate pb-0.5">{getGoogleQuery(bookmark.url) || 'Search...'}</span>
             </div>
          </div>

        ) : displayType === 'pinterest' ? (
          <div className="w-full aspect-[2/3] relative rounded-xl sm:rounded-2xl overflow-hidden shadow-none group-hover:shadow-[0_10px_30px_rgba(0,0,0,0.10)] transition-shadow duration-300 bg-gray-100 dark:bg-[#151815] group/pin">
            <div className="absolute top-0 left-0 w-full h-[4px] bg-[#E60023] z-20" />
            {previewImageUrl ? (
              <img src={previewImageUrl} alt={bookmark.title || "Pinterest Pin"} className="w-full h-full object-cover block group-hover/pin:scale-[1.03] transition-transform duration-700 ease-out" loading="lazy" onError={() => setFallbackStep(prev => prev + 1)} />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-[#202020] text-[#E60023] gap-2"><PinterestIcon className="w-12 h-12" /></div>
            )}
            <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity duration-300 rounded-full p-1.5 shadow-sm bg-white text-[#E60023]"><PinterestIcon className="w-4 h-4" /></div>
            
          </div>

        ) : displayType === 'video' ? (
          <div className="w-full aspect-video relative rounded-xl sm:rounded-2xl overflow-hidden shadow-none group-hover:shadow-[0_10px_30px_rgba(0,0,0,0.10)] transition-shadow duration-300 bg-black">
            <video src={bookmark.url} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" muted autoPlay playsInline loop onMouseEnter={(e) => (e.target as HTMLVideoElement).play()} onMouseLeave={(e) => (e.target as HTMLVideoElement).pause()} />
          </div>
          
        ) : displayType === 'pdf' ? (
          <div className="w-full relative aspect-[3/4] bg-[#8ba3a0] dark:bg-[#334155] rounded-xl sm:rounded-2xl overflow-hidden flex items-center justify-center p-3 md:p-6 shadow-none group-hover:shadow-[0_10px_30px_rgba(0,0,0,0.10)] transition-shadow duration-300">
            <div className="w-full h-full bg-[#FAF9F5] shadow-xl relative flex flex-col items-center justify-center overflow-hidden" style={{ clipPath: 'polygon(0 0, calc(100% - 36px) 0, 100% 36px, 100% 100%, 0 100%)' }}>
              <div className="absolute top-0 right-0 w-[24px] h-[24px] sm:w-[36px] sm:h-[36px] bg-[#c1ccc9] shadow-[-2px_2px_6px_rgba(0,0,0,0.15)] rounded-bl z-20" />
              <div className="w-full h-full relative z-10 bg-white">
                 <iframe src={`${bookmark.url}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`} className="absolute top-1/2 left-1/2 w-[115%] h-[115%] -translate-x-1/2 -translate-y-1/2 border-none pointer-events-none bg-white" title="PDF Preview" scrolling="no" tabIndex={-1} />
              </div>
            </div>
          </div>
          
        ) : displayType === 'image' ? (
          <div className="w-full flex relative overflow-hidden bg-[#FAF9F5] dark:bg-[#0F120F] transition-colors duration-500 cursor-zoom-in md:h-full" onClick={() => setIsFullscreenImage(true)}>
            <img src={previewImageUrl} alt={bookmark.title || "Image"} className="w-full h-auto object-cover md:h-full md:object-contain" onError={() => setFallbackStep(prev => prev + 1)} />
          </div>
        ) : (
          <div className="w-full relative rounded-xl sm:rounded-2xl overflow-hidden shadow-none group-hover:shadow-[0_10px_30px_rgba(0,0,0,0.10)] transition-shadow duration-300 bg-[#FAF9F5] dark:bg-[#151815] flex flex-col group/fallback">
            
            {/* Dynamic Brand Accent Line */}
            {getPlatformMeta(bookmark.url).color !== 'transparent' && (
               <div className="absolute top-0 left-0 w-full h-[3px] z-20" style={{ backgroundColor: getPlatformMeta(bookmark.url).color }} />
            )}

            {/* Dynamic Official Platform Logo Badge (Hides entirely if Logo fails) */}
            {!faviconError && (
              <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity duration-300 rounded-full p-1.5 shadow-md bg-white border border-black/[0.04] w-8 h-8 flex items-center justify-center">
                 <img 
                   src={`https://logo.clearbit.com/${getDomain(bookmark.url)}`} 
                   alt="Platform Logo" 
                   className="w-full h-full object-contain rounded-sm" 
                   onError={() => setFaviconError(true)} 
                 />
              </div>
            )}

            {previewImageUrl ? (
              <img 
                src={previewImageUrl} 
                alt={bookmark.title || "Link preview"} 
                className="w-full h-auto max-h-64 object-cover block group-hover/fallback:scale-[1.03] transition-transform duration-700 ease-out bg-white dark:bg-[#151815]" 
                loading="lazy" 
                onError={() => setFallbackStep(prev => prev + 1)} 
              />
            ) : (
              <div className="w-full aspect-[4/3] sm:aspect-video flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#F5F3EB] to-[#EAE6D8] dark:from-[#202520] dark:to-[#151815] relative overflow-hidden group-hover/fallback:opacity-90 transition-opacity">
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[120px] font-bold text-black/5 dark:text-white/5 uppercase select-none pointer-events-none">
                    {getDomain(bookmark.url).substring(0, 1)}
                 </div>
                 {!faviconError && (
                    <img 
                      src={`https://logo.clearbit.com/${getDomain(bookmark.url)}`} 
                      alt="Favicon" 
                      className="w-12 h-12 rounded-xl shadow-md mb-4 bg-white p-1 z-10" 
                      onError={() => setFaviconError(true)} 
                    />
                 )}
                 <span className="text-sm font-semibold text-[#171A17] dark:text-[#F3F0E9] z-10 text-center line-clamp-2 px-4 leading-tight">{getDomain(bookmark.url)}</span>
              </div>
            )}
          </div>
        )}

        {!isMinimalist && displayType !== 'note' && displayType !== 'twitter' && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex flex-col gap-0.5 px-3.5 pb-3 pt-12 rounded-b-xl sm:rounded-b-2xl bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity duration-300">
            {hasValidTitle && displayType !== 'instagram' && (
              <h4 className="text-[13px] font-semibold font-sans text-white line-clamp-2 leading-snug drop-shadow-sm">{bookmark.title}</h4>
            )}
            <p className="text-[11px] font-sans text-white/75 line-clamp-1">
              {displayType === 'pdf' ? 'PDF DOCUMENT' : displayType === 'pinterest' ? 'PINTEREST PIN' : displayType === 'google' ? 'GOOGLE SEARCH' : getDomain(bookmark.url)}
            </p>
          </div>
        )}
      </div>

      {mounted && isModalOpen && fullBookmark && (
        <EditorialModal 
          bookmark={fullBookmark} 
          isVisible={isVisible} 
          displayType={displayType || 'link'} 
          previewImageUrl={previewImageUrl} 
          folderHierarchy={folderHierarchy} 
          onClose={handleCloseModal} 
          onSave={updateBookmark} 
          onDelete={handleDelete} 
          isPinned={isPinned}
          onTogglePin={onTogglePin ? (_id, pin) => { pendingPin.current = pin } : undefined}
          onFullscreenImage={(url) => { setFullscreenImageUrl(url); setIsFullscreenImage(true); }}
          getDomain={getDomain}
          onCyclePreview={() => setFallbackStep(prev => prev + 1)}
        />
      )}

      {mounted && isFullscreenImage && createPortal(
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/95 backdrop-blur-md cursor-zoom-out" onClick={() => setIsFullscreenImage(false)}>
          <button className="absolute top-4 right-4 md:top-6 md:right-6 text-white/70 hover:text-white bg-black/40 hover:bg-black/60 rounded-full p-2 transition-colors z-50 cursor-pointer">
            <CloseIcon />
          </button>
          <img src={fullscreenImageUrl || previewImageUrl} alt={bookmark.title} className="max-w-[90vw] max-h-[90vh] object-contain shadow-2xl" />
        </div>,
        document.body
      )}
    </>
  )
}