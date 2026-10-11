import { RefObject } from 'react'
import TipTapEditor from '@/components/editor/TipTapEditor'
import { SpinnerIcon, PaperclipIcon, SendIcon, ClearIcon } from './ListIcons'
import { KBD } from './listStyles'

// The pop-up where you paste a link, write a note or attach a file (opens from the capture row, N, or the command palette).
export default function CaptureComposer({
  isExpanded, setIsExpanded, captureBarRef, inputValue, setInputValue, setIsInputFocused,
  fileInputRef, handleFileUpload, isUploading, mod, handleQuickCapture, isSaving,
}: {
  isExpanded: boolean
  setIsExpanded: (open: boolean) => void
  captureBarRef: RefObject<HTMLDivElement | null>
  inputValue: string
  setInputValue: (html: string) => void
  setIsInputFocused: (focused: boolean) => void
  fileInputRef: RefObject<HTMLInputElement | null>
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  isUploading: boolean
  mod: string
  handleQuickCapture: () => void
  isSaving: boolean
}) {
  return (
    <>
      {/* 
        UNIVERSAL CSS NUKE
        Forces every single element inside the capture bar (including pasted spans, links, and headers) 
        to perfectly contrast with the green/white background.
      */}
      <style dangerouslySetInnerHTML={{__html: `
        /* Light Mode: Green Capture Bar -> White Text & Cursor */
        .capture-bar-wrapper .tiptap, 
        .capture-bar-wrapper .tiptap * {
          color: #171A17 !important;
          caret-color: #4D6A51 !important;
        }
        .capture-bar-wrapper .tiptap p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
          color: rgba(23, 26, 23, 0.38) !important;
        }

        /* Dark Mode: White Capture Bar -> Green Text & Cursor */
        .dark .capture-bar-wrapper .tiptap, 
        .dark .capture-bar-wrapper .tiptap * {
          color: #F3F0E9 !important;
          caret-color: #8FAA91 !important;
        }
        .dark .capture-bar-wrapper .tiptap p.is-editor-empty:first-child::before {
          color: rgba(243, 240, 233, 0.38) !important;
        }
      `}} />


      <div
        className={`fixed inset-0 bg-[#FBF9F4]/80 dark:bg-[#080A08]/90 backdrop-blur-md z-[90] transition-opacity duration-300 ${isExpanded ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onPointerDown={(e) => {
          e.preventDefault();
          setIsExpanded(false);
          if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
        }}
      />

      <div
        ref={captureBarRef}
        role="dialog"
        aria-label="Save to inntoit"
        className={`fixed z-[100] left-1/2 top-1/2 flex flex-col w-[92vw] sm:w-[640px] h-[min(60dvh,520px)] rounded-3xl bg-white dark:bg-[#151815] text-[#171A17] dark:text-[#F3F0E9] border border-black/[0.06] dark:border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.22)] overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] -translate-x-1/2 ${isExpanded ? '-translate-y-1/2 opacity-100 scale-100' : '-translate-y-[46%] opacity-0 scale-[0.97] pointer-events-none'}`}
      >
        <div className="flex items-center justify-between px-5 sm:px-6 pt-4 sm:pt-5 shrink-0">
          <div>
            <p className="text-sm font-semibold">Save to inntoit</p>
            <p className="text-xs text-[#171A17]/50 dark:text-white/50">Paste a link, write a note, or attach a file</p>
          </div>
          <button
            aria-label="Close"
            onClick={() => { setIsExpanded(false); if (document.activeElement instanceof HTMLElement) document.activeElement.blur() }}
            className="p-2 -mr-2 rounded-lg text-[#171A17]/50 dark:text-white/50 hover:bg-black/5 dark:hover:bg-white/5 hover:text-[#171A17] dark:hover:text-white transition-colors"
          ><ClearIcon /></button>
        </div>

        <div className="capture-bar-wrapper flex-1 min-h-0 w-full px-5 sm:px-6 py-4 overflow-y-auto custom-scrollbar text-base sm:text-lg">
          <TipTapEditor
            value={inputValue}
            onChange={setInputValue}
            onFocus={() => { setIsInputFocused(true); setIsExpanded(true); }}
            onBlur={() => setIsInputFocused(false)}
            isExpanded={isExpanded}
          />
        </div>

        <div className="shrink-0 flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-t border-black/[0.06] dark:border-white/10">
          <div className="flex items-center gap-2">
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,video/*,application/pdf" />
            <button onClick={() => fileInputRef.current?.click()} disabled={isUploading}
              className="h-9 px-3 inline-flex items-center gap-2 rounded-lg text-sm text-[#171A17]/65 dark:text-white/65 hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50">
              {isUploading ? <SpinnerIcon /> : <PaperclipIcon />}<span>Attach</span>
            </button>
          </div>
          <div className="flex items-center gap-3">
            <kbd className={KBD}>{mod} ↵</kbd>
            <button
              onClick={handleQuickCapture}
              disabled={isSaving || (!inputValue.replace(/<[^>]*>?/gm, '').trim() && !/<(img|hr|table)/i.test(inputValue))}
              className="h-9 px-4 inline-flex items-center gap-2 rounded-lg bg-[#4D6A51] dark:bg-[#8FAA91] text-white dark:text-[#151815] text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-30"
            >{isSaving ? <SpinnerIcon /> : <SendIcon />}<span>Save</span></button>
          </div>
        </div>
      </div>
    </>
  )
}
