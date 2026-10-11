import { Bookmark } from '@/types'
import { XIcon } from '../../BookmarkIcons'
import { isVideoMedia, getTwitterAuthor, formatDate, renderTwitterText } from '@/utils/bookmarkHelpers'

export default function TwitterPreview({ bookmark }: { bookmark: Bookmark }) {
  return (
        <div className="w-full flex bg-[#151618] p-4 md:p-8 md:h-full md:overflow-y-auto custom-scrollbar">
          <div className="w-full max-w-[500px] bg-[#1C1E23] rounded-3xl flex flex-col shadow-2xl relative overflow-hidden border border-white/5 m-auto z-20 pointer-events-auto">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-[#1DA1F2]" />
            <div className="p-6 md:p-8 flex flex-col gap-5 relative z-20 pointer-events-auto">
              <div className="text-[15px] font-sans text-[#F3F0E9] leading-relaxed whitespace-pre-wrap relative z-20 pointer-events-auto">
                {renderTwitterText(bookmark.description || bookmark.title || '', true)}
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
  )
}
