import { RefObject } from 'react'
import { PlusIcon, SpinnerIcon, PaperclipIcon } from './ListIcons'
import { KBD } from './listStyles'

// The row under the title: "Paste a link or write a note" plus the upload button.
export default function CaptureRow({ openCapture, triggerRef, fileInputRef, isUploading }: {
  openCapture: () => void
  triggerRef: RefObject<HTMLButtonElement | null>
  fileInputRef: RefObject<HTMLInputElement | null>
  isUploading: boolean
}) {
  return (
  <div className="mt-5 flex items-center gap-2 w-full max-w-2xl">
    <button ref={triggerRef} onClick={openCapture} aria-label="Save a link, note or file"
      className="group flex-1 min-w-0 h-12 flex items-center gap-3 px-4 rounded-xl bg-white dark:bg-[#151815] border border-black/[0.07] dark:border-white/10 text-left text-[#171A17]/50 dark:text-white/50 hover:border-[#4D6A51]/50 dark:hover:border-[#8FAA91]/50 hover:shadow-[0_4px_20px_rgba(0,0,0,0.05)] transition-all">
      <span className="text-[#4D6A51] dark:text-[#8FAA91]"><PlusIcon /></span>
      <span className="flex-1 truncate text-[15px]">Paste a link or write a note</span>
      <kbd className={KBD}>N</kbd>
    </button>
    <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} aria-label="Upload an image, video or PDF" title="Upload an image, video or PDF"
      className="h-12 w-12 shrink-0 inline-flex items-center justify-center rounded-xl bg-white dark:bg-[#151815] border border-black/[0.07] dark:border-white/10 text-[#171A17]/60 dark:text-white/60 hover:text-[#171A17] dark:hover:text-white hover:border-black/20 dark:hover:border-white/25 transition-colors disabled:opacity-50">
      {isUploading ? <SpinnerIcon /> : <PaperclipIcon />}
    </button>
  </div>
  )
}
