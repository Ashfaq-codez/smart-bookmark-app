import { useState, useEffect } from 'react'
import { Bookmark } from '@/types'
import { ImageOff } from 'lucide-react'


export default function ImagePreview({ bookmark, previewImageUrl, onFullscreenImage }: { bookmark: Bookmark; previewImageUrl?: string; onFullscreenImage: (url: string) => void }) {
  const [imageFailed, setImageFailed] = useState(false)
  useEffect(() => { setImageFailed(false) }, [previewImageUrl])

  return (
        <div className="w-full flex relative overflow-hidden bg-[#FAF9F5] dark:bg-[#0F120F] transition-colors duration-500 cursor-zoom-in md:h-full" onClick={() => {if(previewImageUrl) onFullscreenImage(previewImageUrl)}}>
          {previewImageUrl && !imageFailed ? (
            <img src={previewImageUrl} alt={bookmark.title || "Image"} className="w-full h-auto object-cover md:h-full md:object-contain" onError={() => setImageFailed(true)} />
          ) : (
            <div className="w-full aspect-[4/3] md:h-full flex flex-col items-center justify-center gap-2 text-[#171A17]/45 dark:text-white/45">
              <ImageOff strokeWidth={1.5} className="w-10 h-10" />
              <span className="text-sm font-sans">Preview unavailable</span>
            </div>
          )}
        </div>
  )
}
