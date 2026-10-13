'use client'

import { useRef, RefObject } from 'react'
import { SearchIcon, ClearIcon } from './ListIcons'
import { KBD } from './listStyles'

// The search field in the top bar.
// - Focusing it (click, Tab, tap or the "/" shortcut) selects the old text, so typing replaces it.
// - A second click inside the already-focused field just moves the cursor.
// - Esc: first press clears the text, a second press (when empty) leaves the field.
export default function SearchBox({ searchRef, value, onChange }: {
  searchRef: RefObject<HTMLInputElement | null>
  value: string
  onChange: (q: string) => void
}) {
  const selectOnMouseUp = useRef(false)   // true only for the click that gave the field focus
  const windowBlurred = useRef(false)     // the browser window lost focus while the field was focused

  return (
    <div className="relative flex-1 max-w-xl md:ml-4">
      <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-black/45 dark:text-white/45 pointer-events-none" />
      <input
        ref={searchRef} type="text" aria-label="Search saves" placeholder="Search your saves" enterKeyHint="search"
        value={value} onChange={(e) => onChange(e.target.value)}
        onMouseDown={(e) => { selectOnMouseUp.current = document.activeElement !== e.currentTarget }}
        // Without this, releasing the mouse button right after focusing would drop the selection and place the cursor.
        onMouseUp={(e) => { if (selectOnMouseUp.current) { e.preventDefault(); selectOnMouseUp.current = false } }}
        onFocus={(e) => {
          const el = e.currentTarget
          if (windowBlurred.current) { windowBlurred.current = false; return }   // coming back to the tab: leave the cursor alone
          el.select()
          // iOS Safari ignores select() while focusing; setting the range one frame later works.
          requestAnimationFrame(() => { if (document.activeElement === el) el.setSelectionRange(0, el.value.length) })
        }}
        onBlur={(e) => { windowBlurred.current = document.activeElement === e.currentTarget }}
        onKeyDown={(e) => {
          if (e.key !== 'Escape') return
          // This Esc belongs to the search field only (not to the compose pop-up or the menus behind it).
          e.preventDefault()
          e.stopPropagation()
          if (value !== '') onChange('')
          else e.currentTarget.blur()
        }}
        className="w-full h-9 bg-black/[0.04] dark:bg-white/[0.06] border border-transparent focus:border-[#4D6A51] dark:focus:border-[#8FAA91] outline-none pl-9 pr-10 rounded-lg text-[16px] sm:text-sm text-[#171A17] dark:text-[#F3F0E9] placeholder-black/45 dark:placeholder-white/45 transition-colors"
      />
      {value
        ? <button
            type="button" aria-label="Clear search"
            onMouseDown={(e) => e.preventDefault()}   // keep the focus in the field
            onClick={() => { onChange(''); searchRef.current?.focus() }}
            className="absolute right-0.5 top-1/2 -translate-y-1/2 h-8 w-8 inline-flex items-center justify-center rounded-md text-black/50 hover:text-black dark:text-white/50 dark:hover:text-white outline-none focus-visible:ring-2 focus-visible:ring-[#4D6A51] dark:focus-visible:ring-[#8FAA91]"
          ><ClearIcon /></button>
        : <kbd className={`${KBD} absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none`}>/</kbd>}
    </div>
  )
}
