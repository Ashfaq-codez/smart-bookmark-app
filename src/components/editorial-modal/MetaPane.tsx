import { useState } from 'react'
import { Bookmark } from '@/types'
import PinIcon from '../PinIcon'
import { TrashIcon, ExternalLinkIcon } from '../BookmarkIcons'
import { formatDateTime } from '@/utils/bookmarkHelpers'
import { ModalEdits } from './useModalEdits'

// The right-hand side of the editor: title, folders, pin, personal notes and the delete button.
export default function MetaPane({ bookmark, displayType, edits, folderHierarchy, isPinned, onTogglePin, onRequestDelete }: {
  bookmark: Bookmark
  displayType: string
  edits: ModalEdits
  folderHierarchy?: Record<string, string[]>
  isPinned?: boolean
  onTogglePin?: (id: number, pin: boolean) => void
  onRequestDelete: () => void
}) {
  const { editTitle, setEditTitle, editCategory, setEditCategory, editSubCategory, setEditSubCategory, editContent, setEditContent, handleAutoSave } = edits
  const [pinChoice, setPinChoice] = useState(!!isPinned)   // what the person picked here; applied when the editor closes
  const [showCatDropdown, setShowCatDropdown] = useState(false)
  const [showSubDropdown, setShowSubDropdown] = useState(false)

  const availableCats = folderHierarchy ? Object.keys(folderHierarchy).filter(c => c !== 'All') : []
  const filteredCats = availableCats.filter(c => c.toLowerCase().includes(editCategory.toLowerCase()))
  const availableSubs = (folderHierarchy && editCategory && folderHierarchy[editCategory]) ? folderHierarchy[editCategory] : []
  const filteredSubs = availableSubs.filter(s => s.toLowerCase().includes(editSubCategory.toLowerCase()))

  return (
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
      
        <button onClick={() => onRequestDelete()} className="text-[#171A17]/40 dark:text-white/40 hover:text-red-500 dark:hover:text-red-400 font-sans text-[11px] uppercase tracking-widest font-semibold transition-colors flex items-center gap-2 cursor-pointer w-max">
          <TrashIcon /> Delete Entry
        </button>
      </div>

    </div>
  </div>
  )
}
