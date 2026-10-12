'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useBookmarks } from '@/hooks/useBookmarks'
import { usePreferences } from '@/hooks/usePreferences'
import { useQuickCapture } from '@/hooks/useQuickCapture'
import { useFileUpload } from '@/hooks/useFileUpload'
import { useFolders } from '@/hooks/useFolders'
import { useGridColumns } from '@/hooks/useGridColumns'
import { useListShortcuts } from '@/hooks/useListShortcuts'
import { Prefs } from '@/lib/preferences'
import { MEDIA_TYPE_MATCHERS, BookmarkStats, ListQuery } from '@/lib/bookmarkQuery'
import { Bookmark } from '@/types'
import BookmarkCard from '@/components/BookmarkCard'
import WelcomeGuide from '@/components/WelcomeGuide'
import CommandPalette from '@/components/CommandPalette'
import FeedbackModal from '@/components/FeedbackModal'
import SidebarDrawer from './SidebarDrawer'
import TopBar from './TopBar'
import PageHeader from './PageHeader'
import BookmarkGrid from './BookmarkGrid'
import CaptureComposer from './CaptureComposer'
import DuplicateDialog from './DuplicateDialog'
import DeleteFolderDialog from './DeleteFolderDialog'
import { FilterChip } from './FilterChips'
import { mediaTypeLabels } from './listHelpers'

// Anything that should be reachable from the command palette registers here (see `commands` in the component).
type Command = { id: string; group: string; label: string; hint?: string; run: () => void }

export default function BookmarkList({ initialBookmarks, initialPins, initialHasMore, initialStats, initialPrefs, hasSavedPrefs, userId, userEmail }: {
  initialBookmarks: Bookmark[], initialPins: Bookmark[], initialHasMore: boolean, initialStats: BookmarkStats,
  initialPrefs: Prefs, hasSavedPrefs: boolean, userId: string, userEmail?: string
}) {
  const supabase = createClient()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const [activeFilter, setActiveFilter] = useState('All')
  const [activeSubFilter, setActiveSubFilter] = useState<string | null>(null)
  const [activeMediaType, setActiveMediaType] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // How the person likes their saves arranged. Saved to their account, so it follows them to every device.
  const { prefs, setPref } = usePreferences({ userId, initial: initialPrefs, hasSaved: hasSavedPrefs })
  const sortOrder = prefs.sort
  const isGroupedByDate = prefs.groupByDate
  const userColPreference = prefs.columns
  const isMinimalist = prefs.minimalist
  const setSortOrder = (v: 'desc' | 'asc' | ((o: 'desc' | 'asc') => 'desc' | 'asc')) => setPref('sort', typeof v === 'function' ? v(prefs.sort) : v)
  const setIsGroupedByDate = (v: boolean | ((o: boolean) => boolean)) => setPref('groupByDate', typeof v === 'function' ? v(prefs.groupByDate) : v)
  const setUserColPreference = (v: 'auto' | 5 | 6 | 9) => setPref('columns', v)
  const toggleMinimalist = () => setPref('minimalist', !prefs.minimalist)

  const [showGridMenu, setShowGridMenu] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [duplicateMatch, setDuplicateMatch] = useState<Bookmark | null>(null)
  const [forcedInspectId, setForcedInspectId] = useState<number | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // The database does the filtering, searching and sorting; the hook loads one page at a time.
  const query = useMemo<ListQuery>(
    () => ({ category: activeFilter, sub: activeSubFilter, mediaType: activeMediaType, search: searchQuery, sort: sortOrder }),
    [activeFilter, activeSubFilter, activeMediaType, searchQuery, sortOrder]
  )
  const {
    bookmarks, pins, pinned, hasMore, isFetching, isLoadingMore, stats,
    loadMore, updateBookmark, deleteBookmark, togglePin, pinById, clearPinned, searchSaves, reload,
  } = useBookmarks({ initialBookmarks, initialPins, initialHasMore, initialStats, query })

  const { gridRef, columnsCount, isLoading } = useGridColumns(userColPreference)
  const { isUploading, fileInputRef, handleFileUpload } = useFileUpload()
  const capture = useQuickCapture({ bookmarks, onDuplicate: setDuplicateMatch })
  const { openCapture } = capture
  const folders = useFolders({ stats, activeFilter, setActiveFilter, setActiveSubFilter, updateBookmark, onItemsChanged: reload })
  const { folderHierarchy, getCounts } = folders

  const mod = useListShortcuts({
    openCapture,
    searchRef,
    togglePalette: useCallback(() => setPaletteOpen(o => !o), []),
    closeMenus: useCallback(() => { setPaletteOpen(false); setShowGridMenu(false) }, []),
  })

  // Show the tour once, automatically, to someone whose library is empty
  const startTotal = initialStats.total
  useEffect(() => {
    try {
      if (startTotal <= 1 && !localStorage.getItem('inntoit_guide_seen')) {
        setGuideOpen(true)
        localStorage.setItem('inntoit_guide_seen', '1')
      }
    } catch {}
  }, [startTotal])

  // A shared link like /dashboard?b=123 may point at a save that is not on the first page (opened once)
  const openedSharedLink = useRef(false)
  useEffect(() => {
    if (openedSharedLink.current) return
    openedSharedLink.current = true
    const b = new URLSearchParams(window.location.search).get('b')
    if (b && /^\d+$/.test(b)) pinById(Number(b))
  }, [pinById])

  useEffect(() => {
    if (isSidebarOpen && window.innerWidth < 1024) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; }
  }, [isSidebarOpen]);

  const handleSignOut = async () => { await supabase.auth.signOut(); window.location.href = '/' }

  const filteredBookmarks = useMemo(() => {
    const loaded = new Set(bookmarks.map(b => b.id))
    return [...pinned.filter(p => !loaded.has(p.id)), ...bookmarks]
  }, [bookmarks, pinned])

  const hasFilters = activeFilter !== 'All' || activeMediaType !== null || searchQuery !== ''
  const clearAll = () => { setActiveFilter('All'); setActiveSubFilter(null); setActiveMediaType(null); setSearchQuery(''); clearPinned() }
  const viewTitle = activeSubFilter || (activeFilter !== 'All' ? activeFilter : activeMediaType ? mediaTypeLabels[activeMediaType] : 'All saves')
  const crumbs = [activeFilter !== 'All' && activeFilter, activeFilter !== 'All' && activeSubFilter, activeFilter === 'All' && activeMediaType && mediaTypeLabels[activeMediaType]].filter(Boolean) as string[]
  const typeCounts = useMemo(() => Object.fromEntries(Object.keys(mediaTypeLabels).map(t => [
    t, stats.types.filter(x => (MEDIA_TYPE_MATCHERS[t] || [t]).includes(x.type || 'link')).reduce((sum, x) => sum + x.n, 0)
  ])) as Record<string, number>, [stats])
  // The grid only holds the pages loaded so far, so the header count comes from the database totals when it can.
  const knownViewCount: number | null =
    searchQuery ? null
    : activeFilter !== 'All' ? (activeMediaType ? null : (getCounts[activeSubFilter ? `${activeFilter}::${activeSubFilter}` : activeFilter] ?? 0))
    : activeMediaType ? (typeCounts[activeMediaType] ?? 0)
    : stats.total
  const viewCountLabel = knownViewCount !== null ? String(knownViewCount) : `${filteredBookmarks.length + pins.length}${hasMore ? '+' : ''}`
  const viewIsFiltered = knownViewCount === null ? true : knownViewCount !== stats.total
  const chips = [
    activeFilter !== 'All' && { l: activeSubFilter ? `${activeFilter} / ${activeSubFilter}` : activeFilter, x: () => { setActiveFilter('All'); setActiveSubFilter(null) } },
    searchQuery && { l: `“${searchQuery}”`, x: () => setSearchQuery('') },
  ].filter(Boolean) as FilterChip[]

  // Extension point: future features add an entry here and they show up in the palette (and can take a shortcut hint).
  const commands: Command[] = [
    { id: 'new-note', group: 'Create', label: 'New note', hint: 'N', run: openCapture },
    { id: 'upload', group: 'Create', label: 'Upload a file', run: () => fileInputRef.current?.click() },
    { id: 'group', group: 'View', label: isGroupedByDate ? 'Ungroup by date' : 'Group by date', run: () => setIsGroupedByDate(v => !v) },
    { id: 'details', group: 'View', label: isMinimalist ? 'Show card details' : 'Hide card details', run: toggleMinimalist },
    { id: 'guide', group: 'Help', label: 'How inntoit works', run: () => setGuideOpen(true) },
    { id: 'feedback', group: 'Help', label: 'Send feedback', run: () => setFeedbackOpen(true) },
    { id: 'all', group: 'Go to', label: 'All saves', run: clearAll },
    ...Object.entries(mediaTypeLabels).map(([t, label]) => ({ id: `type-${t}`, group: 'Go to', label, run: () => setActiveMediaType(t) })),
    ...Object.keys(folderHierarchy).map(f => ({ id: `folder-${f}`, group: 'Folders', label: f, run: () => { setActiveFilter(f); setActiveSubFilter(null) } })),
  ]

  // One place that draws a card, used by the pinned strip, the date groups and the plain grid.
  const renderCard = (bookmark: Bookmark) => (
    <BookmarkCard
      key={bookmark.id}
      bookmark={bookmark}
      theme={{ card: 'border border-black/[0.04] dark:border-white/[0.04] bg-white dark:bg-[#151815] shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none', btn: '', hover: '' }}
      isDragged={folders.draggedId === bookmark.id}
      onDragStart={folders.handleDragStart}
      onDragEnd={folders.handleDragEnd}
      updateBookmark={updateBookmark}
      deleteBookmark={deleteBookmark}
      onTogglePin={togglePin}
      onOpenGuide={() => setGuideOpen(true)}
      forceOpenModal={forcedInspectId === bookmark.id}
      onCloseForcedModal={() => setForcedInspectId(null)}
      folderHierarchy={folderHierarchy}
      isMinimalist={isMinimalist}
    />
  )

  // Show a save that may be on a later page, then open it.
  const showSave = (id: number) => { pinById(id); setTimeout(() => setForcedInspectId(id), 100) }

  return (
    <div className="bg-[#FAF9F5] dark:bg-[#0F120F] min-h-screen font-sans text-[#171A17] dark:text-[#F3F0E9] flex selection:bg-[#E8EFE5] selection:text-[#4D6A51] dark:selection:bg-[#202820] dark:selection:text-[#69866E] transition-colors duration-500">

      <SidebarDrawer
        isOpen={isSidebarOpen}
        setOpen={setIsSidebarOpen}
        userEmail={userEmail || null}
        handleSignOut={handleSignOut}
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        activeSubFilter={activeSubFilter}
        setActiveSubFilter={setActiveSubFilter}
        onOpenGuide={() => { setGuideOpen(true); if (window.innerWidth < 1024) setIsSidebarOpen(false) }}
        getCounts={getCounts}
        folderHierarchy={folderHierarchy}
        handleDragOver={folders.handleDragOver}
        handleDrop={folders.handleDrop}
        {...folders.sidebarFolders}
      />

      {/* ─── MAIN CONTENT ─── */}
      <div className={`flex-1 flex flex-col min-h-screen relative w-full transition-all duration-300 ${isSidebarOpen ? 'lg:ml-[280px] lg:w-[calc(100%-280px)]' : 'lg:ml-[72px] lg:w-[calc(100%-72px)]'}`}>

        <TopBar
          crumbs={crumbs} clearAll={clearAll} searchRef={searchRef} searchQuery={searchQuery} setSearchQuery={setSearchQuery} mod={mod}
          onOpenMenu={() => setIsSidebarOpen(true)} onOpenPalette={() => setPaletteOpen(true)} onOpenFeedback={() => setFeedbackOpen(true)}
        />

        <PageHeader
          viewTitle={viewTitle} viewCountLabel={viewCountLabel} viewIsFiltered={viewIsFiltered} stats={stats}
          viewMenu={{ sortOrder, setSortOrder, showGridMenu, setShowGridMenu, userColPreference, setUserColPreference, isMinimalist, toggleMinimalist, isGroupedByDate, setIsGroupedByDate }}
          openCapture={openCapture} fileInputRef={fileInputRef} isUploading={isUploading}
          typeTabs={{ activeMediaType, setActiveMediaType, stats, typeCounts }}
          chips={chips} clearAll={clearAll}
        />

        {/* MAIN GRID VIEW OR EMPTY STATE */}
        <main className="flex-1 px-3 sm:px-8 pt-4 pb-32">
          <BookmarkGrid
            gridRef={gridRef} isLoading={isLoading} columnsCount={columnsCount} totalSaves={stats.total}
            bookmarks={filteredBookmarks} pins={pins} hasMore={hasMore} isFetching={isFetching} isLoadingMore={isLoadingMore} loadMore={loadMore}
            isGroupedByDate={isGroupedByDate} hasFilters={hasFilters} clearAll={clearAll}
            openCapture={openCapture} openFilePicker={() => fileInputRef.current?.click()} openGuide={() => setGuideOpen(true)}
            mod={mod} renderCard={renderCard}
          />
        </main>

        <CaptureComposer
          isExpanded={capture.isExpanded} setIsExpanded={capture.setIsExpanded} captureBarRef={capture.captureBarRef}
          inputValue={capture.inputValue} setInputValue={capture.setInputValue} setIsInputFocused={capture.setIsInputFocused}
          fileInputRef={fileInputRef} handleFileUpload={handleFileUpload} isUploading={isUploading}
          mod={mod} handleQuickCapture={capture.handleQuickCapture} isSaving={capture.isSaving}
        />
      </div>

      {guideOpen && <WelcomeGuide mod={mod} onClose={() => setGuideOpen(false)} onStart={openCapture} />}

      {feedbackOpen && <FeedbackModal mod={mod} onClose={() => setFeedbackOpen(false)} />}

      {paletteOpen && <CommandPalette commands={commands} search={searchSaves} onClose={() => setPaletteOpen(false)} onPick={(b) => { clearAll(); showSave(b.id) }} />}

      <DeleteFolderDialog {...folders.deleteFolderDialog} />

      {duplicateMatch && (
        <DuplicateDialog
          match={duplicateMatch}
          onDismiss={() => { setDuplicateMatch(null); capture.setInputValue('') }}
          onView={() => {
            setActiveFilter('All'); setActiveSubFilter(null); setActiveMediaType(null); setSearchQuery('')
            showSave(duplicateMatch.id)
            setDuplicateMatch(null); capture.setInputValue('')
          }}
        />
      )}
    </div>
  )
}
