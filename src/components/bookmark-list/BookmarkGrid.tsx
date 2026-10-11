import { useMemo, useEffect, useRef, RefObject, ReactNode } from 'react'
import { Bookmark } from '@/types'
import PinIcon from '@/components/PinIcon'
import BookmarkSkeleton from '@/components/BookmarkSkeleton'
import { BTN } from './listStyles'
import { formatDateHeader, distributeIntoColumns } from './listHelpers'

// The main area: loading placeholders, the two empty states, the pinned strip, and the cards (grouped by date or in one grid).
export default function BookmarkGrid({
  gridRef, isLoading, columnsCount, totalSaves, bookmarks, pins, hasMore, isFetching, isLoadingMore, loadMore,
  isGroupedByDate, hasFilters, clearAll, openCapture, openFilePicker, openGuide, mod, renderCard,
}: {
  gridRef: RefObject<HTMLDivElement | null>
  isLoading: boolean
  columnsCount: number
  totalSaves: number
  bookmarks: Bookmark[]          // everything to show in the main grid (loaded pages plus saves opened by link)
  pins: Bookmark[]
  hasMore: boolean
  isFetching: boolean
  isLoadingMore: boolean
  loadMore: () => void
  isGroupedByDate: boolean
  hasFilters: boolean
  clearAll: () => void
  openCapture: () => void
  openFilePicker: () => void
  openGuide: () => void
  mod: string
  renderCard: (bookmark: Bookmark) => ReactNode
}) {
  const sentinelRef = useRef<HTMLDivElement>(null)
  const loadMoreRef = useRef(loadMore)
  useEffect(() => { loadMoreRef.current = loadMore })

  const pinColumns = useMemo(() => distributeIntoColumns(pins, columnsCount), [pins, columnsCount])

  const masonryColumns = useMemo(() => {
    if (isGroupedByDate) return [];
    return distributeIntoColumns(bookmarks, columnsCount)
  }, [bookmarks, columnsCount, isGroupedByDate])

  const groupedBookmarks = useMemo(() => {
    if (!isGroupedByDate) return null;

    const groups: Record<string, Bookmark[]> = {};
    bookmarks.forEach(bookmark => {
      const header = formatDateHeader(bookmark.created_at);
      if (!groups[header]) groups[header] = [];
      groups[header].push(bookmark);
    });
    return groups;
  }, [bookmarks, isGroupedByDate]);

  // Load the next page when the bottom of the grid is near the screen
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const io = new IntersectionObserver((entries) => { if (entries[0]?.isIntersecting) loadMoreRef.current() }, { rootMargin: '900px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [hasMore, bookmarks.length, isGroupedByDate])

  return (
    <div className="w-full flex flex-col items-start" ref={gridRef}>
      {isLoading ? (
        <div className="w-full flex gap-2 sm:gap-4">
          {Array.from({ length: columnsCount }).map((_, colIndex) => (
            <div key={colIndex} className="flex flex-col gap-2 sm:gap-4 w-full flex-1 min-w-0">
              {Array.from({ length: 3 }).map((_, i) => <BookmarkSkeleton key={i} />)}
            </div>
          ))}
        </div>
      ) : totalSaves === 0 ? (
        <div className="w-full max-w-xl mx-auto mt-[8vh] text-center px-4 animate-fade-in">
          <h2 className="font-serif text-2xl sm:text-3xl text-[#171A17] dark:text-[#F3F0E9]">Create a sanctuary for the inspiration you wish to return to </h2>
          <p className="mt-3 text-sm sm:text-base leading-relaxed text-[#171A17]/60 dark:text-white/60">Paste a link, write a note or upload a file. inntoit keeps the preview, not just the address.</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button onClick={openCapture} className="h-10 px-5 rounded-lg bg-[#4D6A51] dark:bg-[#8FAA91] text-white dark:text-[#151815] text-sm font-medium hover:opacity-90 transition-opacity">Add your first save</button>
            <button onClick={() => openFilePicker()} className={`${BTN} h-10 px-5`}>Upload a file</button>
            <button onClick={() => openGuide()} className={`${BTN} h-10 px-5`}>How it works</button>
          </div>
          <p className="mt-6 text-xs text-[#171A17]/45 dark:text-white/45">Press N to write a note, or {mod} K to search and run commands.</p>
        </div>
      ) : bookmarks.length + pins.length === 0 ? (
        <div className="w-full max-w-md mx-auto mt-[8vh] text-center px-4">
          <h2 className="font-serif text-xl sm:text-2xl text-[#171A17] dark:text-[#F3F0E9]">No saves match</h2>
          <p className="mt-2 text-sm text-[#171A17]/60 dark:text-white/60">Try a different search, or remove a filter to see everything again.</p>
          {hasFilters && <button onClick={clearAll} className={`${BTN} mt-6`}>Clear filters</button>}
        </div>
      ) : (<>
      {pins.length > 0 && (
        <section aria-label="Pinned saves" className="w-full mb-10">
          <div className="flex items-center gap-2 py-2.5 mb-4 text-[#4D6A51] dark:text-[#8FAA91]">
            <PinIcon filled className="w-3.5 h-3.5" />
            <h3 className="text-sm font-semibold text-[#171A17] dark:text-[#E2E8F0]">Pinned</h3>
            <span className="text-xs tabular-nums text-[#171A17]/45 dark:text-white/45">{pins.length}</span>
          </div>
          <div className="w-full flex gap-2 sm:gap-4 items-start">
            {pinColumns.map((col, colIndex) => (
              <div key={colIndex} className="flex flex-col gap-2 sm:gap-4 w-full flex-1 min-w-0">
                {col.map(renderCard)}
              </div>
            ))}
          </div>
          {bookmarks.length > 0 && <div className="mt-10 border-t border-black/[0.06] dark:border-white/10" />}
        </section>
      )}
      {isGroupedByDate && groupedBookmarks ? (
        Object.entries(groupedBookmarks).map(([dateLabel, groupBookmarks]) => {
          const groupCols = distributeIntoColumns(groupBookmarks, columnsCount)

          return (
            <div key={dateLabel} className="w-full mb-10">
              <div className="sticky top-14 z-30 flex items-baseline gap-2.5 py-2.5 mb-4 bg-[#FAF9F5]/90 dark:bg-[#0F120F]/90 backdrop-blur">
                <h3 className="text-sm font-semibold text-[#171A17] dark:text-[#E2E8F0]">{dateLabel}</h3>
                <span className="text-xs tabular-nums text-[#171A17]/45 dark:text-white/45">{groupBookmarks.length}</span>
              </div>

              <div className="w-full flex gap-2 sm:gap-4 items-start">
                {groupCols.map((colBookmarks, colIndex) => (
                  <div key={colIndex} className="flex flex-col gap-2 sm:gap-4 w-full flex-1 min-w-0">
                    {colBookmarks.map(bookmark => renderCard(bookmark))}
                  </div>
                ))}
              </div>
            </div>
          )
        })
      ) : (
        <div className="w-full flex gap-2 sm:gap-4 items-start">
          {masonryColumns.map((colBookmarks, colIndex) => (
            <div key={colIndex} className="flex flex-col gap-2 sm:gap-4 w-full flex-1 min-w-0">
              {colBookmarks.map(bookmark => renderCard(bookmark))}
            </div>
          ))}
        </div>
      )}
      </>)}

      {/* Infinite scroll: when this line comes near the screen, the next page loads */}
      <div ref={sentinelRef} aria-hidden="true" className="h-px w-full" />
      {isFetching && <div className="fixed top-0 left-0 right-0 h-0.5 bg-[#4D6A51] dark:bg-[#8FAA91] animate-pulse z-[250]" />}
      {isLoadingMore && <p className="w-full py-6 text-center text-xs text-[#171A17]/45 dark:text-white/45">Loading more…</p>}
    </div>
  )
}
