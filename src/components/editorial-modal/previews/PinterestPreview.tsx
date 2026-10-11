import toast from 'react-hot-toast'
import { Bookmark } from '@/types'
import { ExternalLinkIcon, PinterestIcon, InstaShareIcon } from '../../BookmarkIcons'
import { formatDate } from '@/utils/bookmarkHelpers'

export default function PinterestPreview({ bookmark, previewImageUrl, onFullscreenImage, getDomain }: { bookmark: Bookmark; previewImageUrl?: string; onFullscreenImage: (url: string) => void; getDomain: (url: string) => string }) {
  return (
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
  )
}
