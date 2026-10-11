import { Bookmark } from '@/types'
import { getUniversalEmbedUrl } from '@/utils/bookmarkHelpers'
import { RefreshCw } from 'lucide-react'

export default function LinkPreview({ bookmark, previewImageUrl, getDomain, onCyclePreview }: { bookmark: Bookmark; previewImageUrl?: string; getDomain: (url: string) => string; onCyclePreview?: () => void }) {
  return getUniversalEmbedUrl(bookmark.url) ? (
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
          <RefreshCw size={18} strokeWidth={2} />
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
  )
}
