'use client'
import { useState, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Bookmark } from '@/types'
import toast from 'react-hot-toast'
import TipTapEditor from './TipTapEditor'
import PinIcon from './PinIcon'
import { 
  TrashIcon, ExternalLinkIcon, CloseIcon, PlayCircleIcon, InfoIcon, SearchIcon, 
  XIcon, InstagramIcon, YouTubeIcon, TikTokIcon, PinterestIcon, 
  InstaHeartIcon, InstaCommentIcon, InstaShareIcon, InstaSaveIcon, InstaDotsIcon 
} from './BookmarkIcons';
import { 
  isVideoMedia, getGoogleQuery, getYouTubeId, getTwitterAuthor, 
  formatDate, formatDateTime, getInstaMeta, renderInstagramText, renderTwitterText,
  getPlatformMeta, getUniversalEmbedUrl 
} from '@/utils/bookmarkHelpers';

interface EditorialModalProps {
  bookmark: Bookmark;
  isVisible: boolean;
  displayType: string;
  previewImageUrl?: string;
  folderHierarchy?: Record<string, string[]>;
  onClose: () => void;
  onSave: (id: number, updates: Partial<Bookmark>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  isPinned?: boolean;
  onTogglePin?: (id: number, pin: boolean) => void;
  onFullscreenImage: (url: string) => void;
  getDomain: (url: string) => string;
  onCyclePreview?: () => void;
}

// Plain-text notes (e.g. saved before HTML capture, or from inputs) have no block tags,
// so TipTap collapses their newlines into one paragraph. Convert them to real paragraphs/line breaks.
const toEditorHtml = (raw: string): string => {
  if (!raw) return ''
  if (/<(p|br|ul|ol|li|h[1-6]|blockquote|pre|hr|div|table)\b/i.test(raw)) return raw
  const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return raw
    .replace(/\r\n?/g, '\n')
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(Boolean)
    .map(p => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`)
    .join('')
}

export default function EditorialModal({ 
  bookmark, isVisible, displayType, previewImageUrl, folderHierarchy, 
  onClose, onSave, onDelete, isPinned, onTogglePin, onFullscreenImage, getDomain, onCyclePreview 
}: EditorialModalProps) {
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [imageFailed, setImageFailed] = useState(false)
  useEffect(() => { setImageFailed(false) }, [previewImageUrl])
  const [pinChoice, setPinChoice] = useState(!!isPinned)   // what the person picked here; applied when the editor closes
  const [igLiked, setIgLiked] = useState(false)
  const [igSaved, setIgSaved] = useState(false)
  const [showIgHeartAnim, setShowIgHeartAnim] = useState(false)
  const [igComments, setIgComments] = useState<string[]>([])
  const [showCatDropdown, setShowCatDropdown] = useState(false)
  const [showSubDropdown, setShowSubDropdown] = useState(false)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)
  
  const confirmDeleteRef = useRef<HTMLButtonElement>(null)

  const [editTitle, setEditTitle] = useState(bookmark.title || '')
  const [editUrl, setEditUrl] = useState(bookmark.url || '')
  const [editCategory, setEditCategory] = useState(bookmark.category || '')
  const [editSubCategory, setEditSubCategory] = useState(bookmark.sub_category || '')
  const [editDescription, setEditDescription] = useState(bookmark.description || '')
  const [editContent, setEditContent] = useState(bookmark.content || '')

  const formatUrl = (rawUrl: string) => { const t = rawUrl.trim(); if (!t) return ''; return !t.startsWith('http://') && !t.startsWith('https://') ? 'https://' + t : t }

  const handleAutoSave = async () => {
    if (editTitle.trim() === (bookmark.title || '') && formatUrl(editUrl) === bookmark.url && editCategory.trim() === (bookmark.category || '') && editSubCategory.trim() === (bookmark.sub_category || '') && editDescription.trim() === (bookmark.description || '') && editContent === (bookmark.content || '')) return;
    await onSave(bookmark.id, { title: editTitle.trim() || '', url: formatUrl(editUrl), category: editCategory.trim() || 'Uncategorized', sub_category: editSubCategory.trim() || null, description: editDescription.trim() || null, content: editContent || null })
    toast.success('Saved', { style: { background: '#4D6A51', color: 'white', border: 'none', borderRadius: '12px' } })
  }

  const handleTouchStart = (e: React.TouchEvent) => { setTouchStart(e.targetTouches[0].clientY); setTouchEnd(0) }
  const handleTouchMove = (e: React.TouchEvent) => { setTouchEnd(e.targetTouches[0].clientY) }
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    if (touchEnd - touchStart > 45) { handleAutoSave(); onClose(); }
    setTouchStart(0); setTouchEnd(0);
  }

  // 1. Auto-focus the Confirm button when the dialog appears
  useEffect(() => {
    if (showDeleteConfirm && confirmDeleteRef.current) {
      confirmDeleteRef.current.focus()
    }
  }, [showDeleteConfirm])

  // 2. Global Keydown Handler
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // Handle Escape to close modal or cancel delete
      if (e.key === 'Escape') {
        e.preventDefault()
        if (showDeleteConfirm) return setShowDeleteConfirm(false)
        await handleAutoSave()
        onClose()
      }
      
      // Handle Enter to safely confirm deletion
      if (e.key === 'Enter' && showDeleteConfirm) {
        e.preventDefault()
        setShowDeleteConfirm(false)
        onDelete(bookmark.id)
        onClose()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showDeleteConfirm, editTitle, editUrl, editCategory, editSubCategory, editDescription, editContent])

  const instaData = displayType === 'instagram' ? getInstaMeta({ ...bookmark, title: editTitle, description: editDescription, content: editContent }) : null;
  const displayedLikes = useMemo(() => {
    if (!instaData) return '1,248';
    if (!igLiked) return instaData.likes;
    const rawNum = parseInt(instaData.likes.replace(/,/g, ''), 10);
    if (!isNaN(rawNum)) return (rawNum + 1).toLocaleString();
    return `${instaData.likes}`;
  }, [instaData?.likes, igLiked]);

  const handleIgDoubleTap = () => {
    if (!igLiked) setIgLiked(true);
    setShowIgHeartAnim(true);
    setTimeout(() => setShowIgHeartAnim(false), 800);
  };

  const availableCats = folderHierarchy ? Object.keys(folderHierarchy).filter(c => c !== 'All') : []
  const filteredCats = availableCats.filter(c => c.toLowerCase().includes(editCategory.toLowerCase()))
  const availableSubs = (folderHierarchy && editCategory && folderHierarchy[editCategory]) ? folderHierarchy[editCategory] : []
  const filteredSubs = availableSubs.filter(s => s.toLowerCase().includes(editSubCategory.toLowerCase()))

  return createPortal(
    <div className={`fixed inset-0 z-[9999] flex items-end md:items-center justify-center p-0 md:p-6 lg:p-10 bg-[#FBF9F4]/80 dark:bg-[#080A08]/90 backdrop-blur-md transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`} onMouseDown={() => { handleAutoSave(); onClose(); }}>
      
      <div 
        className={`relative w-full h-[100dvh] md:h-[90vh] flex flex-col md:flex-row bg-[#FAF9F5] dark:bg-[#0F120F] border-0 md:border border-black/[0.04] dark:border-white/[0.04] shadow-[0_20px_60px_rgba(0,0,0,0.08)] md:shadow-2xl rounded-none md:rounded-3xl overflow-hidden transition-transform duration-300 ease-[cubic-bezier(0.19,1,0.22,1)] ${isVisible ? 'translate-y-0 scale-100' : 'translate-y-full md:translate-y-0 md:scale-95'}`} 
        onMouseDown={(e) => e.stopPropagation()}
      >

        {/* Drag Handle Top Bar on Mobile */}
        <div className="absolute top-0 left-0 w-full h-12 z-[60] md:hidden flex items-start justify-center pt-3 touch-none" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
          <div className="w-12 h-1.5 bg-black/10 dark:bg-white/20 rounded-full pointer-events-none" />
        </div>

        <button onClick={() => { handleAutoSave(); onClose(); }} className="absolute top-4 right-4 z-[100] p-2 text-[#171A17]/50 dark:text-white/50 hover:text-[#171A17] dark:hover:text-white transition-all cursor-pointer items-center justify-center bg-black/5 dark:bg-white/5 backdrop-blur-md rounded-full shadow-sm hover:bg-black/10 dark:hover:bg-white/10">
          <CloseIcon />
        </button>

        {/* Seamless Mobile Scroll Wrapper */}
        <div className="flex-1 w-full h-full overflow-y-auto md:overflow-hidden flex flex-col md:flex-row custom-scrollbar pt-12 md:pt-0">

          {/* LEFT PANE (Preview / Editor) */}
          <div className={`w-full md:w-[60%] flex flex-col shrink-0 md:shrink border-b md:border-b-0 md:border-r border-black/[0.04] dark:border-white/[0.04] transition-colors duration-500 ${displayType === 'note' ? 'bg-[#FAF9F5] dark:bg-[#0F120F]' : 'bg-white dark:bg-[#1A1D1A]'} md:h-full md:overflow-hidden`}>
            
            {displayType === 'note' ? (
              <div className="inntoit-note-pane w-full flex flex-col relative bg-[#FAF9F5] dark:bg-[#0F120F] h-auto min-h-[50dvh] md:h-full">
                 {/* Scoped to this pane only: the shared editor zeroes <p> margins, which made saved paragraphs run together */}
                 <style>{`.inntoit-note-pane .tiptap > p { margin-bottom: 0.85em !important; }`}</style>
                 <TipTapEditor value={toEditorHtml(editContent || '')} onChange={setEditContent} onBlur={handleAutoSave} isExpanded={true} />
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
                           <img src={bookmark.image_url || undefined} alt={bookmark.title || "Post attachment"} className="w-full h-auto object-contain max-h-[50vh] block" />
                        )}
                      </div>
                    )}
                  </div>
                  <div className="px-6 md:px-8 py-4 bg-[#181A1F] border-t border-white/5 flex items-center justify-between text-white/50">
                    <span className="text-[12px] font-sans">Post by {getTwitterAuthor(bookmark.url)} on {formatDate(bookmark.created_at)}</span>
                    <XIcon />
                  </div>
                </div>
              </div>

            ) : displayType === 'instagram' && instaData ? (
              <div className="w-full flex bg-[#FAFAFA] dark:bg-[#000000] p-0 md:p-4 py-8 md:h-full md:overflow-y-auto custom-scrollbar justify-center">
                <div className="w-full md:max-w-[470px] bg-white dark:bg-[#000000] md:border border-black/[0.08] dark:border-[#262626] md:rounded-[3px] flex flex-col m-auto md:my-auto">
                  <div className="flex items-center justify-between p-3 shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-gradient-to-tr from-yellow-400 via-rose-500 to-purple-600 p-[1.5px]">
                        <div className="w-full h-full bg-white dark:bg-black rounded-full overflow-hidden border-2 border-white dark:border-black">
                          <img src={`https://ui-avatars.com/api/?name=${instaData.username}&background=random&color=fff&size=100`} alt={instaData.username} className="w-full h-full object-cover" />
                        </div>
                      </div>
                      <a href={`https://www.instagram.com/${instaData.username}/`} target="_blank" rel="noreferrer" className="text-[14px] font-semibold font-sans text-[#262626] dark:text-[#F5F5F5] leading-tight hover:underline flex items-center gap-1.5">
                        <span>{instaData.username}</span>
                        <span className="text-[#737373] dark:text-[#a8a8a8] font-normal text-xs">• Following</span>
                      </a>
                    </div>
                    <a href={bookmark.url} target="_blank" rel="noreferrer" title="Open on Instagram" className="text-[#262626] dark:text-[#F5F5F5] hover:opacity-60 transition-opacity p-1">
                      <InstaDotsIcon />
                    </a>
                  </div>
                  <div className="w-full bg-[#FAFAFA] dark:bg-[#262626] relative shrink-0 flex items-center justify-center border-y border-black/[0.04] dark:border-[#262626] min-h-[300px] select-none cursor-pointer" onDoubleClick={handleIgDoubleTap}>
                    {isVideoMedia(bookmark.image_url) ? (
                       <video src={bookmark.image_url!} autoPlay={true} muted={true} playsInline={true} loop={true} className="w-full h-auto max-h-[585px] object-contain block" />
                    ) : (
                       previewImageUrl ? (
                         <img src={previewImageUrl} alt={instaData.caption || bookmark.title || "Instagram post"} className="w-full h-auto max-h-[585px] object-contain block" />
                       ) : (
                         <div className="flex flex-col items-center justify-center text-[#737373] dark:text-[#A8A8A8] gap-3 p-10">
                            <InstagramIcon className="w-12 h-12 opacity-50" />
                            <span className="text-sm font-medium">Image protected by Instagram</span>
                         </div>
                       )
                    )}
                    {showIgHeartAnim && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-ping duration-700">
                        <svg className="w-24 h-24 text-white drop-shadow-2xl fill-white" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                      </div>
                    )}
                  </div>
                  <div className="px-4 pt-3 pb-4 flex flex-col gap-1.5 shrink-0 font-sans">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-4 text-[#262626] dark:text-[#F5F5F5]">
                        <button onClick={() => { setIgLiked(!igLiked); if (!igLiked) { setShowIgHeartAnim(true); setTimeout(() => setShowIgHeartAnim(false), 800); } }} className="hover:opacity-60 transition-opacity cursor-pointer focus:outline-none">
                          {igLiked ? <svg className="w-6 h-6 text-[#FF3040] fill-[#FF3040]" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg> : <InstaHeartIcon />}
                        </button>
                        <button className="hover:opacity-60 transition-opacity cursor-pointer focus:outline-none text-[#262626] dark:text-[#F5F5F5]"><InstaCommentIcon /></button>
                        <button onClick={() => { if (bookmark.url) { navigator.clipboard.writeText(bookmark.url); toast.success('Instagram link copied!', { duration: 1500 }); } }} className="hover:opacity-60 transition-opacity cursor-pointer focus:outline-none text-[#262626] dark:text-[#F5F5F5]"><InstaShareIcon /></button>
                      </div>
                      <button onClick={() => { setIgSaved(!igSaved); toast.success(igSaved ? 'Removed from saved' : 'Saved to collection', { duration: 1500 }); }} className="hover:opacity-60 transition-opacity cursor-pointer focus:outline-none text-[#262626] dark:text-[#F5F5F5]">
                        {igSaved ? <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="20 21 12 13.44 4 21 4 3 20 3 20 21" /></svg> : <InstaSaveIcon />}
                      </button>
                    </div>
                    <div className="text-[14px] font-semibold text-[#262626] dark:text-[#F5F5F5]">{displayedLikes} likes</div>
                    {instaData.caption && (
                      <div className="text-[14px] text-[#262626] dark:text-[#F5F5F5] leading-snug mt-1 break-words">
                        <a href={`https://www.instagram.com/${instaData.username}/`} target="_blank" rel="noreferrer" className="font-semibold mr-1.5 hover:underline text-[#262626] dark:text-[#F5F5F5]">{instaData.username}</a>
                        <span className="whitespace-pre-wrap">{renderInstagramText(instaData.caption)}</span>
                      </div>
                    )}
                    {igComments.map((c, idx) => (
                      <div key={idx} className="text-[14px] text-[#262626] dark:text-[#F5F5F5] leading-snug"><span className="font-semibold mr-1.5">you</span><span>{c}</span></div>
                    ))}
                    <div className="text-[14px] text-[#737373] dark:text-[#A8A8A8] mt-1 cursor-pointer hover:underline">View all comments</div>
                    <div className="text-[10px] text-[#737373] dark:text-[#A8A8A8] uppercase mt-1 tracking-wide font-normal">{formatDate(bookmark.created_at)}</div>
                  </div>
                </div>
              </div>

            ) : displayType === 'pinterest' ? (
              <div className="w-full flex bg-[#F7F7F7] dark:bg-[#0F1010] p-4 md:p-8 md:h-full md:overflow-y-auto custom-scrollbar justify-center items-center">
                <div className="w-full max-w-[480px] bg-white dark:bg-[#1E1F22] rounded-3xl shadow-2xl border border-black/[0.06] dark:border-white/[0.08] overflow-hidden flex flex-col m-auto">
                  <div className="flex items-center justify-between p-4 pb-2 shrink-0">
                    <a href={bookmark.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-[#E9E9E9] dark:bg-[#333] hover:bg-[#D8D8D8] dark:hover:bg-[#444] text-[#111] dark:text-white px-4 py-2 rounded-full text-xs font-semibold transition-colors">
                      <span>Visit</span><ExternalLinkIcon />
                    </a>
                    <div className="flex items-center gap-2">
                      <button onClick={() => { if (bookmark.url) { navigator.clipboard.writeText(bookmark.url); toast.success('Pin link copied!', { duration: 1500 }); } }} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 transition-colors"><InstaShareIcon /></button>
                      <a href={bookmark.url} target="_blank" rel="noreferrer" className="bg-[#E60023] hover:bg-[#ad081b] text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-md transition-colors flex items-center gap-1.5">
                        <PinterestIcon className="w-4 h-4 text-white" /><span>Save</span>
                      </a>
                    </div>
                  </div>
                  <div className="p-3 sm:p-4">
                    <div className="w-full bg-[#F0F0F0] dark:bg-[#141517] rounded-2xl overflow-hidden relative cursor-zoom-in group/media" onClick={() => {if(previewImageUrl) onFullscreenImage(previewImageUrl)}}>
                      {previewImageUrl ? (
                        <img src={previewImageUrl} alt={bookmark.title || "Pinterest Pin"} className="w-full h-auto max-h-[55vh] object-contain rounded-2xl block m-auto group-hover/media:scale-[1.01] transition-transform duration-300" />
                      ) : (
                        <div className="w-full aspect-[2/3] flex flex-col items-center justify-center text-[#E60023] gap-3"><PinterestIcon className="w-16 h-16" /><span className="text-sm font-semibold text-gray-500">Pinterest Pin Preview</span></div>
                      )}
                    </div>
                  </div>
                  <div className="px-5 pb-6 pt-1 flex flex-col gap-2 font-sans">
                    <div className="text-[12px] font-medium text-gray-500 dark:text-gray-400">{getDomain(bookmark.url)}</div>
                    {bookmark.title && <h3 className="text-xl sm:text-2xl font-bold text-[#111] dark:text-[#EFEFEF] leading-tight">{bookmark.title}</h3>}
                    {bookmark.description && <p className="text-[14px] text-[#333] dark:text-[#CCCCCC] leading-relaxed mt-1">{bookmark.description}</p>}
                    <div className="flex items-center gap-3 mt-4 pt-4 border-t border-black/[0.06] dark:border-white/[0.06]">
                      <div className="w-10 h-10 rounded-full bg-[#E60023] text-white flex items-center justify-center shrink-0 font-bold text-base shadow-sm"><PinterestIcon className="w-5 h-5 text-white" /></div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-[#111] dark:text-white">Saved from Pinterest</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Pinned on {formatDate(bookmark.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            ) : displayType === 'youtube' ? (
              <div className="w-full aspect-video md:h-full bg-[#050505] flex items-center justify-center relative overflow-hidden transition-colors duration-500">
                <iframe src={`https://www.youtube.com/embed/${getYouTubeId(bookmark.url)}`} className="w-full h-full border-none" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title="YouTube Video" />
              </div>

            ) : displayType === 'google' ? (
              <div className="w-full flex bg-[#F8F9FA] dark:bg-[#202124] p-4 md:p-8 md:h-full md:overflow-y-auto custom-scrollbar justify-center items-center">
                <div className="w-full max-w-[500px] flex flex-col items-center gap-8">
                   <svg viewBox="0 0 272 92" width="150" height="50" xmlns="http://www.w3.org/2000/svg"><path fill="#EA4335" d="M115.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18C71.25 34.32 81.24 25 93.5 25s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44S80.99 39.2 80.99 47.18c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z"/><path fill="#FBBC05" d="M163.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18c0-12.86 9.99-22.18 22.25-22.18s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44s-12.51 5.46-12.51 13.44c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z"/><path fill="#4285F4" d="M209.75 26.34v39.82c0 16.38-9.66 23.07-21.08 23.07-10.75 0-17.22-7.19-19.66-13.07l8.48-3.53c1.51 3.61 5.21 7.87 11.17 7.87 7.31 0 11.84-4.51 11.84-13v-3.19h-.34c-2.18 2.69-6.38 5.04-11.68 5.04-11.09 0-21.25-9.66-21.25-22.09 0-12.52 10.16-22.26 21.25-22.26 5.29 0 9.49 2.35 11.68 4.96h.34v-3.61h9.25zm-8.56 20.92c0-7.81-5.21-13.52-11.84-13.52-6.72 0-12.35 5.71-12.35 13.52 0 7.73 5.63 13.36 12.35 13.36 6.63 0 11.84-5.63 11.84-13.36z"/><path fill="#34A853" d="M225 3v65h-9.5V3h9.5z"/><path fill="#EA4335" d="M262.02 54.48l7.56 5.04c-2.44 3.61-8.32 9.83-18.48 9.83-12.6 0-22.01-9.74-22.01-22.18 0-13.19 9.49-22.18 20.92-22.18 11.51 0 17.14 9.16 18.98 14.11l1.01 2.52-29.65 12.28c2.27 4.45 5.8 6.72 10.75 6.72 4.96 0 8.4-2.44 10.92-6.14zm-23.27-7.98l19.82-8.23c-1.09-2.77-4.37-4.7-8.23-4.7-4.95 0-11.84 4.37-11.59 12.93z"/><path fill="#4285F4" d="M35.29 41.41V32H67c.31 1.64.47 3.58.47 5.68 0 7.06-1.93 15.79-8.15 22.01-6.05 6.3-13.78 9.66-24.02 9.66C16.32 69.35.36 53.89.36 34.91.36 15.93 16.32.47 35.3.47c10.5 0 17.98 4.12 23.6 9.49l-6.64 6.64c-4.03-3.78-9.49-6.72-16.96-6.72-13.86 0-24.7 11.17-24.7 25.03 0 13.86 10.84 25.03 24.7 25.03 8.99 0 14.11-3.61 17.39-6.89 2.66-2.66 4.41-6.46 5.1-11.65l-22.5-.01z"/></svg>
                   <div className="w-full rounded-full bg-white dark:bg-[#303134] border border-[#dfe1e5] dark:border-[#5f6368] shadow-md flex items-center px-6 py-3.5 gap-4">
                      <SearchIcon className="text-[#9aa0a6] w-5 h-5 shrink-0" />
                      <span className="text-base text-[#202124] dark:text-[#e8eaed] truncate">{getGoogleQuery(bookmark.url) || 'Google Search'}</span>
                   </div>
                   <a href={bookmark.url} target="_blank" rel="noreferrer" className="px-6 py-2.5 bg-[#f8f9fa] dark:bg-[#303134] hover:bg-[#f1f3f4] dark:hover:bg-[#3c4043] border border-[#f8f9fa] dark:border-[#303134] text-[#3c4043] dark:text-[#e8eaed] rounded text-sm font-medium transition-colors">
                      Open Search Results
                   </a>
                </div>
              </div>

            ) : displayType === 'tiktok' ? (
              <div className="w-full aspect-[9/16] md:aspect-auto md:h-full relative flex items-center justify-center bg-[#FAF9F5] dark:bg-[#0F120F] overflow-hidden">
                <img src={previewImageUrl} alt={bookmark.title || "TikTok preview"} className="w-full h-full object-contain z-10" />
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
              <div className="w-full flex relative overflow-hidden bg-[#FAF9F5] dark:bg-[#0F120F] transition-colors duration-500 cursor-zoom-in md:h-full" onClick={() => {if(previewImageUrl) onFullscreenImage(previewImageUrl)}}>
                {previewImageUrl && !imageFailed ? (
                  <img src={previewImageUrl} alt={bookmark.title || "Image"} className="w-full h-auto object-cover md:h-full md:object-contain" onError={() => setImageFailed(true)} />
                ) : (
                  <div className="w-full aspect-[4/3] md:h-full flex flex-col items-center justify-center gap-2 text-[#171A17]/45 dark:text-white/45">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-10 h-10">
                      <path d="M2 2l20 20" /><path d="M10.41 10.41a2 2 0 1 1-2.83-2.83" /><path d="M13.5 13.5 6 21" /><path d="M18 12l3 3" /><path d="M3.59 3.59A2 2 0 0 0 3 5v14a2 2 0 0 0 2 2h14c.55 0 1.052-.22 1.41-.59" /><path d="M21 15V5a2 2 0 0 0-2-2H9" />
                    </svg>
                    <span className="text-sm font-sans">Preview unavailable</span>
                  </div>
                )}
              </div>
            ) : getUniversalEmbedUrl(bookmark.url) ? (
              <div className="w-full h-full bg-[#FAF9F5] dark:bg-[#0F120F] flex items-center justify-center p-0 md:p-8">
                <div className="w-full h-full md:max-h-[85vh] max-w-[800px] bg-white dark:bg-[#151815] md:rounded-2xl shadow-2xl border border-black/[0.08] dark:border-white/[0.08] overflow-hidden">
                   <iframe src={getUniversalEmbedUrl(bookmark.url)!} className="w-full h-full border-none" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                </div>
              </div>
            ) : (
              <div className="w-full flex relative overflow-hidden bg-[#FAF9F5] dark:bg-[#0F120F] transition-colors duration-500 md:h-full justify-center items-center group/preview">
                
                {/* Manual Cycle Preview Button */}
                {onCyclePreview && previewImageUrl && (
                  <button 
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onCyclePreview(); }}
                    className="absolute top-4 left-4 z-50 bg-black/40 hover:bg-black/70 text-white p-2.5 rounded-full backdrop-blur-md transition-all shadow-lg opacity-0 group-hover/preview:opacity-100"
                    title="Load alternative preview image"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path><path d="M3 22v-6h6"></path><path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path></svg>
                  </button>
                )}

                <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="w-full h-full block cursor-pointer hover:opacity-90 transition-opacity">
                  {previewImageUrl ? (
                    <img 
                      src={previewImageUrl} 
                      alt={bookmark.title || "Link preview"} 
                      className="w-full h-auto object-cover md:h-full md:object-contain bg-white dark:bg-[#151815]" 
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#F5F3EB] to-[#EAE6D8] dark:from-[#202520] dark:to-[#151815]">
                       <img src={`https://logo.clearbit.com/${getDomain(bookmark.url)}`} alt="Favicon" className="w-24 h-24 rounded-2xl shadow-xl mb-6 bg-white p-2" onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} />
                       <span className="text-xl font-bold text-[#171A17] dark:text-[#F3F0E9] text-center px-4">{getDomain(bookmark.url)}</span>
                       <span className="text-sm font-medium text-[#4D6A51] dark:text-[#8FAA91] mt-2 underline">Visit Website</span>
                    </div>
                  )}
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
                   {onTogglePin && (
                    <button
                      type="button"
                      aria-pressed={pinChoice}
                      onClick={() => { const next = !pinChoice; setPinChoice(next); onTogglePin(bookmark.id, next) }}
                      className={`self-start inline-flex items-center gap-2 h-9 px-3.5 rounded-full border font-sans text-xs font-semibold transition-colors ${pinChoice ? 'border-[#4D6A51] bg-[#4D6A51]/10 text-[#4D6A51] dark:border-[#8FAA91] dark:bg-[#8FAA91]/15 dark:text-[#8FAA91]' : 'border-black/10 dark:border-white/15 text-[#171A17]/60 dark:text-white/60 hover:text-[#4D6A51] dark:hover:text-[#8FAA91]'}`}
                    >
                      <PinIcon filled={pinChoice} className="w-3.5 h-3.5" />
                      {pinChoice ? 'Pinned to top' : 'Pin to top'}
                    </button>
                  )}
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
                            <li key={c} onMouseDown={(e) => { e.preventDefault(); setEditCategory(c); setShowCatDropdown(false); }} className="px-5 py-2.5 text-sm font-medium text-[#171A17] dark:text-[#F3F0E9] hover:bg-[#FAF9F5] dark:hover:bg-[#202520] cursor-pointer transition-colors">
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
                            <li key={s} onMouseDown={(e) => { e.preventDefault(); setEditSubCategory(s); setShowSubDropdown(false); }} className="px-5 py-2.5 text-sm font-medium text-[#171A17] dark:text-[#F3F0E9] hover:bg-[#FAF9F5] dark:hover:bg-[#202520] cursor-pointer transition-colors">
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
                      {['instagram', 'twitter', 'tiktok', 'pinterest'].includes(displayType || '') ? 'Caption / Notes' : 'Personal Notes'}
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
                
                <button onClick={() => setShowDeleteConfirm(true)} className="text-[#171A17]/40 dark:text-white/40 hover:text-red-500 dark:hover:text-red-400 font-sans text-[11px] uppercase tracking-widest font-semibold transition-colors flex items-center gap-2 cursor-pointer w-max">
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
                <h3 className="text-2xl font-serif text-[#171A17] dark:text-[#F3F0E9] leading-none">Delete this entry?</h3>
                <p className="text-sm font-sans text-[#171A17]/60 dark:text-white/60">This action is permanent and cannot be undone.</p>
                <div className="flex flex-col gap-2 mt-2">
                  <button 
                    ref={confirmDeleteRef}
                    onClick={() => { setShowDeleteConfirm(false); onDelete(bookmark.id); onClose(); }} 
                    onKeyDown={(e) => { if (e.key === 'Enter') { setShowDeleteConfirm(false); onDelete(bookmark.id); onClose(); } }}
                    className="w-full py-3 bg-[#D93025] text-white font-sans font-semibold text-xs tracking-widest uppercase hover:bg-[#B32015] transition-all rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D93025]"
                  >
                    Confirm
                  </button>
                  <button onClick={() => setShowDeleteConfirm(false)} className="w-full py-3 bg-black/5 dark:bg-white/5 text-[#171A17] dark:text-[#F3F0E9] font-sans font-semibold text-xs tracking-widest uppercase hover:bg-black/10 dark:hover:bg-white/10 transition-all rounded-2xl">
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
  )
}