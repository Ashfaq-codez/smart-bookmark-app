import { RefObject } from 'react'
import { MenuIcon, FeedbackIcon } from './ListIcons'
import SearchBox from './SearchBox'
import { KBD, BTN } from './listStyles'

// Sticky bar at the top: menu button, breadcrumb, search, command palette and feedback buttons.
export default function TopBar({ crumbs, clearAll, searchRef, searchQuery, setSearchQuery, mod, onOpenMenu, onOpenPalette, onOpenFeedback }: {
  crumbs: string[]
  clearAll: () => void
  searchRef: RefObject<HTMLInputElement | null>
  searchQuery: string
  setSearchQuery: (q: string) => void
  mod: string
  onOpenMenu: () => void
  onOpenPalette: () => void
  onOpenFeedback: () => void
}) {
  return (
  <div className="sticky top-0 z-40 w-full bg-[#FAF9F5]/90 dark:bg-[#0F120F]/90 backdrop-blur-xl border-b border-black/[0.06] dark:border-white/[0.06]">
    <header className="h-14 flex items-center gap-3 px-3 sm:px-8">
      <button aria-label="Open menu" onClick={() => onOpenMenu()} className="lg:hidden p-2 -ml-2 rounded-lg text-[#171A17]/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5"><MenuIcon /></button>
      <nav aria-label="Breadcrumb" className="hidden md:flex items-center gap-1.5 text-sm shrink-0 text-[#171A17]/55 dark:text-white/55">
        <button onClick={clearAll} className="hover:text-[#171A17] dark:hover:text-white transition-colors">Library</button>
        {crumbs.map(c => <span key={c} className="flex items-center gap-1.5"><span aria-hidden="true">/</span><span className="text-[#171A17] dark:text-white font-medium truncate max-w-[22ch]" title={c}>{c}</span></span>)}
      </nav>
      <SearchBox searchRef={searchRef} value={searchQuery} onChange={setSearchQuery} />
      <div className="ml-auto flex items-center gap-2">
        <button onClick={() => onOpenPalette()} aria-label="Open command palette" className={`${BTN} hidden md:inline-flex text-[#171A17]/60 dark:text-white/60`}>Commands <kbd className={KBD}>{mod} K</kbd></button>
        <button onClick={() => onOpenFeedback()} aria-label="Send feedback" title="Send feedback" className={`${BTN} w-9 px-0 justify-center md:w-auto md:px-3 text-[#171A17]/60 dark:text-white/60`}><FeedbackIcon /><span className="hidden md:inline">Feedback</span></button>
      </div>
    </header>
  </div>
  )
}
