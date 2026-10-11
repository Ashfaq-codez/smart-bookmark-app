import { Bookmark } from '@/types'
import { SearchIcon, InfoIcon } from '../../BookmarkIcons'
import { getGoogleQuery, getYouTubeId } from '@/utils/bookmarkHelpers'

// Previews that mostly just frame an embedded page, video or document.

export function YouTubePreview({ bookmark }: { bookmark: Bookmark }) {
  return (
        <div className="w-full aspect-video md:h-full bg-[#050505] flex items-center justify-center relative overflow-hidden transition-colors duration-500">
          <iframe src={`https://www.youtube.com/embed/${getYouTubeId(bookmark.url)}`} className="w-full h-full border-none" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title="YouTube Video" />
        </div>
  )
}

export function GooglePreview({ bookmark }: { bookmark: Bookmark }) {
  return (
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
  )
}

export function TikTokPreview({ bookmark, previewImageUrl }: { bookmark: Bookmark; previewImageUrl?: string }) {
  return (
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
  )
}

export function VideoPreview({ bookmark }: { bookmark: Bookmark }) {
  return (
        <div className="w-full aspect-video md:h-full bg-[#050505] flex items-center justify-center relative overflow-hidden transition-colors duration-500">
           <video src={bookmark.url} controls autoPlay={true} className="w-full h-full object-contain" />
        </div>
  )
}

export function PdfPreview({ bookmark }: { bookmark: Bookmark }) {
  return (
        <div className="w-full aspect-[3/4] md:h-full bg-[#FAF9F5] dark:bg-[#0F120F] flex items-center justify-center relative overflow-hidden transition-colors duration-500">
           <iframe src={bookmark.url} className="w-full h-full border-none" title={bookmark.title} />
        </div>
  )
}
