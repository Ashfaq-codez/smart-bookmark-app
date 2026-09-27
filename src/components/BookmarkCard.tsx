'use client'
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/utils/supabase/client'
import { Bookmark } from '@/types'
import { 
  CloseIcon, PlayCircleIcon, InfoIcon, 
  XIcon, InstagramIcon, YouTubeIcon, TikTokIcon, PinterestIcon 
} from './BookmarkIcons';
import { 
  isVideoMedia, getYouTubeId, getTwitterAuthor, deriveDisplayType, renderTwitterText, getPlatformMeta 
} from '@/utils/bookmarkHelpers';
import EditorialModal from './EditorialModal'

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

export default function BookmarkCard({ 
  bookmark, isDragged, onDragStart, onDragEnd, 
  updateBookmark, deleteBookmark, forceOpenModal, onCloseForcedModal, 
  folderHierarchy, isMinimalist 
}: BookmarkCardProps) {
  
  const [mounted, setMounted] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [isFullscreenImage, setIsFullscreenImage] = useState(false)
  const [fullscreenImageUrl, setFullscreenImageUrl] = useState('')
  const supabase = createClient()

  useEffect(() => { setMounted(true) }, [])

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
    }, 300) 

    const params = new URLSearchParams(window.location.search);
    if (params.get('b') === String(bookmark.id)) {
      params.delete('b');
      const newUrl = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname;
      window.history.pushState({}, '', newUrl);
    }
  }

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

    if (fallbackStep === 0) {
      return ytHighResThumbnail || bookmark.image_url || undefined;
    }
    if (fallbackStep === 1 && bookmark.url) {
      // Prioritize the official, stable Open Graph image first
      return `https://api.microlink.io?url=${encodeURIComponent(bookmark.url)}&embed=image.url`;
    }
    if (fallbackStep === 2 && bookmark.url) {
      // Prevent whole-page screenshots for IG/TikTok to avoid login walls
      if (displayType === 'instagram' || displayType === 'tiktok') return undefined;
      return `https://image.thum.io/get/width/800/crop/600/noanimate/${bookmark.url}`;
    }
    
    return undefined;
  }, [bookmark.image_url, bookmark.url, ytHighResThumbnail, fallbackStep, displayType]);

  const hasValidTitle = bookmark.title && !['Text Snippet', 'Saved Image', 'Saved Item', 'Untitled', ''].includes(bookmark.title);
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

      <div draggable onDragStart={(e) => onDragStart(e, bookmark.id)} onDragEnd={onDragEnd} onClick={openModal} className={`group relative flex flex-col w-full min-w-0 cursor-pointer gap-1 sm:gap-2.5 select-none transition-transform duration-300 ${isDragged ? 'opacity-40' : 'hover:-translate-y-1'}`}>
        
        {displayType === 'note' ? (
          <div className="w-full bg-white dark:bg-[#151815] rounded-xl sm:rounded-2xl p-4 sm:p-6 flex flex-col min-w-0 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-black/[0.04] dark:border-white/[0.04] relative overflow-hidden max-h-[260px] sm:max-h-[340px]">
            <div className="tiptap prose prose-sm sm:prose-base dark:prose-invert max-w-none font-serif text-[#171A17] dark:text-[#F3F0E9] break-words w-full" dangerouslySetInnerHTML={{ __html: bookmark.content || '' }} />
            {isLongNote && <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-white dark:from-[#151815] to-transparent pointer-events-none" />}
          </div>
          
        ) : displayType === 'twitter' ? (
          <div className="w-full bg-white dark:bg-[#1C1D21] rounded-xl sm:rounded-2xl p-4 md:p-5 flex flex-col min-w-0 gap-3 shadow-[0_2px_12px_rgba(0,0,0,0.04)] dark:shadow-none border border-gray-100 dark:border-transparent relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-[#1DA1F2]" />
            <div className="text-[#0f1419] dark:text-[#e7e9ea] mt-1 pl-1"><XIcon /></div>
            <div className="text-[13px] sm:text-[14px] font-sans text-[#171A17] dark:text-[#F3F0E9] line-clamp-6 w-full leading-relaxed whitespace-pre-wrap px-1 relative z-20 pointer-events-auto">
              {renderTwitterText(bookmark.description || bookmark.content || bookmark.title || '', false)}
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
          <div className="w-full aspect-[4/5] relative rounded-xl sm:rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.04)] bg-gray-100 dark:bg-[#151815] border border-black/[0.04] dark:border-white/[0.04]">
            {displayType === 'instagram' ? <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#FCAF45] z-20" /> : <div className="absolute top-0 left-0 w-full h-[4px] bg-[#25F4EE] z-20" />}
            {previewImageUrl ? (
                <img src={previewImageUrl} alt={bookmark.title || "Post thumbnail"} className="w-full h-full object-cover block group-hover:scale-[1.03] transition-transform duration-700 ease-out" loading="lazy" onError={() => setFallbackStep(prev => prev + 1)} />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-[#262626]">
                    {displayType === 'instagram' ? <InstagramIcon className="w-12 h-12 text-black/20 dark:text-white/20" /> : <TikTokIcon className="w-12 h-12 text-black/20 dark:text-white/20" />}
                </div>
            )}
            <div className={`absolute top-3 left-3 sm:top-4 sm:left-4 z-10 rounded-full p-1 sm:p-1.5 shadow-sm ${displayType === 'instagram' ? 'bg-white' : 'bg-black text-white'}`}>
              {displayType === 'instagram' ? <InstagramIcon /> : <TikTokIcon />}
            </div>
            {previewImageUrl && <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-colors z-10 pointer-events-none"><PlayCircleIcon className="w-10 h-10 sm:w-14 sm:h-14 text-white/90 drop-shadow-lg" /></div>}
          </div>

        ) : displayType === 'youtube' ? (
          <div className={`w-full ${isYouTubeShort ? 'aspect-[4/5]' : 'aspect-video'} relative rounded-xl sm:rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.04)] bg-black border border-black/[0.04] dark:border-white/[0.04]`}>
            <div className="absolute top-0 left-0 w-full h-[3px] bg-[#FF0000] z-20" />
            <img src={previewImageUrl} alt={bookmark.title || "YouTube thumbnail"} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" onError={() => setFallbackStep(prev => prev + 1)} />
            <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 rounded-full p-1 sm:p-1.5 shadow-sm bg-white"><YouTubeIcon className="text-[#FF0000]" /></div>
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/30 transition-colors z-10 pointer-events-none"><PlayCircleIcon className="w-10 h-10 sm:w-12 sm:h-12 text-white drop-shadow-lg" /></div>
          </div>

        ) : displayType === 'google' ? (
          <div className="w-full aspect-[4/3] sm:aspect-video relative rounded-xl sm:rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-black/[0.04] dark:border-white/[0.04] bg-[#F8F9FA] dark:bg-[#202124] flex flex-col items-center justify-center p-6 gap-6">
             <div className="w-[85%] max-w-[300px] h-10 rounded-full bg-white dark:bg-[#303134] border border-[#dfe1e5] dark:border-[#5f6368] shadow-[0_1px_6px_rgba(32,33,36,0.28)] flex items-center px-4 gap-2.5 overflow-hidden mt-10">
                <span className="text-sm text-[#202124] dark:text-[#e8eaed] truncate pb-0.5">Google Search</span>
             </div>
          </div>

        ) : displayType === 'pinterest' ? (
          <div className="w-full aspect-[2/3] relative rounded-xl sm:rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.04)] bg-gray-100 dark:bg-[#151815] border border-black/[0.04] dark:border-white/[0.04] group/pin">
            <div className="absolute top-0 left-0 w-full h-[4px] bg-[#E60023] z-20" />
            {previewImageUrl ? (
              <img src={previewImageUrl} alt={bookmark.title || "Pinterest Pin"} className="w-full h-full object-cover block group-hover/pin:scale-[1.03] transition-transform duration-700 ease-out" loading="lazy" onError={() => setFallbackStep(prev => prev + 1)} />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-[#202020] text-[#E60023] gap-2"><PinterestIcon className="w-12 h-12" /></div>
            )}
            <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 rounded-full p-1.5 shadow-sm bg-white text-[#E60023]"><PinterestIcon className="w-4 h-4" /></div>
            <div className="absolute inset-x-0 bottom-0 pt-8 pb-3 px-3 bg-gradient-to-t from-black/70 via-black/25 to-transparent flex items-center justify-between z-10">
              <span className="text-white text-[11px] font-medium font-sans truncate drop-shadow-sm max-w-[80%]">{getDomain(bookmark.url)}</span>
            </div>
          </div>

        ) : displayType === 'video' ? (
          <div className="w-full aspect-video relative rounded-xl sm:rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.04)] bg-black border border-black/[0.04] dark:border-white/[0.04]">
            <video src={bookmark.url} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" muted autoPlay playsInline loop onMouseEnter={(e) => (e.target as HTMLVideoElement).play()} onMouseLeave={(e) => (e.target as HTMLVideoElement).pause()} />
          </div>
          
        ) : displayType === 'pdf' ? (
          <div className="w-full relative aspect-[3/4] bg-[#8ba3a0] dark:bg-[#334155] rounded-xl sm:rounded-2xl overflow-hidden flex items-center justify-center p-3 md:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-transparent dark:border-white/5">
            <div className="w-full h-full bg-[#FAF9F5] shadow-xl relative flex flex-col items-center justify-center overflow-hidden" style={{ clipPath: 'polygon(0 0, calc(100% - 36px) 0, 100% 36px, 100% 100%, 0 100%)' }}>
              <div className="absolute top-0 right-0 w-[24px] h-[24px] sm:w-[36px] sm:h-[36px] bg-[#c1ccc9] shadow-[-2px_2px_6px_rgba(0,0,0,0.15)] rounded-bl z-20" />
              <div className="w-full h-full relative z-10 bg-white">
                 <iframe src={`${bookmark.url}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`} className="absolute top-1/2 left-1/2 w-[115%] h-[115%] -translate-x-1/2 -translate-y-1/2 border-none pointer-events-none bg-white" title="PDF Preview" scrolling="no" tabIndex={-1} />
              </div>
            </div>
          </div>
          
        ) : displayType === 'image' ? (
          <div className="w-full flex relative overflow-hidden bg-[#FAF9F5] dark:bg-[#0F120F] transition-colors duration-500 md:h-full" onClick={() => setIsFullscreenImage(true)}>
            <img src={previewImageUrl} alt={bookmark.title || "Image"} className="w-full h-auto object-cover md:h-full md:object-contain" onError={() => setFallbackStep(prev => prev + 1)} />
          </div>
        ) : (
          <div className="w-full relative rounded-xl sm:rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-black/[0.04] dark:border-white/[0.04] bg-[#FAF9F5] dark:bg-[#151815] flex flex-col group/fallback">
            
            {/* Dynamic Brand Accent Line */}
            {getPlatformMeta(bookmark.url).color !== 'transparent' && (
               <div className="absolute top-0 left-0 w-full h-[3px] z-20" style={{ backgroundColor: getPlatformMeta(bookmark.url).color }} />
            )}

            {/* Dynamic Official Platform Logo Badge */}
            <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 rounded-full p-1.5 shadow-md bg-white border border-black/[0.04] w-8 h-8 flex items-center justify-center">
               <img src={`https://www.google.com/s2/favicons?domain=${getDomain(bookmark.url)}&sz=128`} alt="Platform Logo" className="w-full h-full object-contain rounded-sm" onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} />
            </div>

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
                 <img src={`https://www.google.com/s2/favicons?domain=${getDomain(bookmark.url)}&sz=128`} alt="Favicon" className="w-12 h-12 rounded-xl shadow-md mb-4 bg-white p-1 z-10" onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} />
                 <span className="text-sm font-semibold text-[#171A17] dark:text-[#F3F0E9] z-10 text-center line-clamp-2 px-4 leading-tight">{getDomain(bookmark.url)}</span>
              </div>
            )}
          </div>
        )}

        {!isMinimalist && displayType !== 'note' && displayType !== 'twitter' && (
          <div className="px-1 flex flex-col min-w-0 gap-1 w-full mt-1 pb-1 sm:pb-0">
            {hasValidTitle && displayType !== 'instagram' && (
              <h4 className="text-[13px] sm:text-[14px] font-semibold font-sans text-[#171A17] dark:text-[#F3F0E9] line-clamp-2 leading-snug w-full">{bookmark.title}</h4>
            )}
            <p className="text-[11px] sm:text-[12px] text-gray-500 dark:text-gray-400 font-sans line-clamp-1 w-full">
              {displayType === 'pdf' ? 'PDF DOCUMENT' : displayType === 'pinterest' ? 'PINTEREST PIN' : displayType === 'google' ? 'GOOGLE SEARCH' : getDomain(bookmark.url)}
            </p>
          </div>
        )}
      </div>

      {mounted && isModalOpen && (
        <EditorialModal 
          bookmark={bookmark} 
          isVisible={isVisible} 
          displayType={displayType || 'link'} 
          previewImageUrl={previewImageUrl} 
          folderHierarchy={folderHierarchy} 
          onClose={handleCloseModal} 
          onSave={updateBookmark} 
          onDelete={handleDelete} 
          onFullscreenImage={(url) => { setFullscreenImageUrl(url); setIsFullscreenImage(true); }}
          getDomain={getDomain}
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