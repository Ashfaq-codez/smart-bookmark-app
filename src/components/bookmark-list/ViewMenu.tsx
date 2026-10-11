import { Prefs } from '@/lib/preferences'
import { SortDescIcon, SortAscIcon, SlidersIcon } from './ListIcons'
import { Tile, ColumnsGlyph, CardGlyph, GroupGlyph } from './ViewControls'
import { BTN } from './listStyles'

type Sort = 'desc' | 'asc'

// The "Newest/Oldest" button and the "View" pop-up menu (columns, card details, grouping).
export default function ViewMenu({ sortOrder, setSortOrder, showGridMenu, setShowGridMenu, userColPreference, setUserColPreference, isMinimalist, toggleMinimalist, isGroupedByDate, setIsGroupedByDate }: {
  sortOrder: Sort
  setSortOrder: (v: Sort | ((o: Sort) => Sort)) => void
  showGridMenu: boolean
  setShowGridMenu: (v: boolean | ((o: boolean) => boolean)) => void
  userColPreference: Prefs['columns']
  setUserColPreference: (v: 'auto' | 5 | 6 | 9) => void
  isMinimalist: boolean
  toggleMinimalist: () => void
  isGroupedByDate: boolean
  setIsGroupedByDate: (v: boolean) => void
}) {
  return (
  <div className="relative flex items-center gap-2">
    <button
      onClick={() => setSortOrder(o => (o === 'desc' ? 'asc' : 'desc'))}
      aria-label={sortOrder === 'desc' ? 'Sorted newest first. Switch to oldest first' : 'Sorted oldest first. Switch to newest first'}
      title="Sort by date saved"
      className={BTN}
    >
      {sortOrder === 'desc' ? <SortDescIcon /> : <SortAscIcon />}
      <span>{sortOrder === 'desc' ? 'Newest' : 'Oldest'}</span>
    </button>
    <button onClick={() => setShowGridMenu(v => !v)} aria-haspopup="menu" aria-expanded={showGridMenu} className={BTN}><SlidersIcon />View</button>
    {showGridMenu && (
      <>
        <div className="fixed inset-0 z-40" onClick={() => setShowGridMenu(false)} />
        <div role="menu" className="absolute right-0 top-full mt-2 w-[19rem] z-50 p-4 space-y-5 rounded-2xl bg-white dark:bg-[#151815] border border-black/[0.06] dark:border-white/10 shadow-[0_16px_48px_rgba(0,0,0,0.16)]">
          <div className="hidden sm:block">
            <p className="mb-2 text-xs font-medium text-[#171A17]/50 dark:text-white/50">Layout</p>
            <div className="flex gap-2">
              {([['auto', 'Auto'], [5, '5'], [6, '6'], [9, '9']] as const).map(([v, label]) => (
                <Tile key={String(v)} active={userColPreference === v} label={label}
                  onClick={() => setUserColPreference(v)}>
                  <ColumnsGlyph n={v} />
                </Tile>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-[#171A17]/50 dark:text-white/50">Cards</p>
            <div className="flex gap-2">
              <Tile active={!isMinimalist} label="Details" onClick={() => { if (isMinimalist) toggleMinimalist() }}><CardGlyph detailed /></Tile>
              <Tile active={isMinimalist} label="Just the save" onClick={() => { if (!isMinimalist) toggleMinimalist() }}><CardGlyph detailed={false} /></Tile>
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-[#171A17]/50 dark:text-white/50">Arrange</p>
            <div className="flex gap-2">
              <Tile active={!isGroupedByDate} label="One grid" onClick={() => setIsGroupedByDate(false)}><GroupGlyph grouped={false} /></Tile>
              <Tile active={isGroupedByDate} label="By date" onClick={() => setIsGroupedByDate(true)}><GroupGlyph grouped /></Tile>
            </div>
          </div>
        </div>
      </>
    )}
  </div>
  )
}
