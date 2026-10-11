import { useState, useEffect } from 'react'
import { Bookmark } from '@/types'


export default function ImagePreview({ bookmark, previewImageUrl, onFullscreenImage }: { bookmark: Bookmark; previewImageUrl?: string; onFullscreenImage: (url: string) => void }) {
  const [imageFailed, setImageFailed] = useState(false)
  useEffect(() => { setImageFailed(false) }, [previewImageUrl])

  return (
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
  )
}
