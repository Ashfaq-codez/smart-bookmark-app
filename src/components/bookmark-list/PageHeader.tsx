import { RefObject, ComponentProps } from 'react'
import { BookmarkStats } from '@/lib/bookmarkQuery'
import ViewMenu from './ViewMenu'
import CaptureRow from './CaptureRow'
import TypeTabs from './TypeTabs'
import FilterChips, { FilterChip } from './FilterChips'

// Title and count, the sort/view controls, the capture row, the type tabs and the active filter chips.
export default function PageHeader({ viewTitle, viewCountLabel, viewIsFiltered, stats, viewMenu, openCapture, fileInputRef, isUploading, typeTabs, chips, clearAll }: {
  viewTitle: string
  viewCountLabel: string
  viewIsFiltered: boolean
  stats: BookmarkStats
  viewMenu: ComponentProps<typeof ViewMenu>
  openCapture: () => void
  fileInputRef: RefObject<HTMLInputElement | null>
  isUploading: boolean
  typeTabs: ComponentProps<typeof TypeTabs>
  chips: FilterChip[]
  clearAll: () => void
}) {
  return (
    <div className="px-3 sm:px-8 pt-6 pb-2">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-serif text-2xl sm:text-3xl font-medium leading-tight text-[#171A17] dark:text-[#F4F1EA] break-words">{viewTitle}</h1>
          <p className="mt-1 text-sm text-[#171A17]/55 dark:text-white/55">{viewCountLabel} {viewCountLabel === '1' ? 'save' : 'saves'}{viewIsFiltered ? ` of ${stats.total}` : ''}</p>
        </div>
        {/* Extension point: put future page-level actions (share, export, select) beside the View menu. */}
        <ViewMenu {...viewMenu} />
      </div>

      {/* CAPTURE: the one place to add something */}
      <CaptureRow openCapture={openCapture} fileInputRef={fileInputRef} isUploading={isUploading} />

      <TypeTabs {...typeTabs} />

      <FilterChips chips={chips} clearAll={clearAll} />
    </div>
  )
}
