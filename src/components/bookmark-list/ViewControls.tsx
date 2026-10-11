// Little building blocks of the "View" menu: the tile buttons and their pictures.

// --- View menu visuals ---
export const Tile = ({ active, onClick, label, children }: { active: boolean, onClick: () => void, label: string, children: React.ReactNode }) => (
  <button type="button" onClick={onClick} aria-pressed={active}
    className={`flex-1 min-w-0 flex flex-col items-center gap-1.5 py-2.5 rounded-xl border text-[11px] font-medium transition-colors ${active ? 'border-[#4D6A51] dark:border-[#8FAA91] bg-[#4D6A51]/[0.07] dark:bg-[#8FAA91]/10 text-[#171A17] dark:text-white' : 'border-black/10 dark:border-white/10 text-[#171A17]/55 dark:text-white/55 hover:bg-black/[0.03] dark:hover:bg-white/[0.05]'}`}>
    {children}<span>{label}</span>
  </button>
)
export const ColumnsGlyph = ({ n }: { n: number | 'auto' }) => {
  const bars = n === 'auto' ? 4 : Math.min(n, 9)
  const w = 30, gap = 2, bw = (w - gap * (bars - 1)) / bars
  return (
    <svg width="30" height="20" viewBox="0 0 30 20" fill="currentColor" aria-hidden="true" opacity={n === 'auto' ? 0.55 : 1}>
      {Array.from({ length: bars }).map((_, i) => {
        const h = [20, 13, 17, 10, 15, 12, 18, 11, 16][i % 9]
        return <rect key={i} x={i * (bw + gap)} y={0} width={bw} height={h} rx={n === 'auto' ? 1.5 : Math.min(1.5, bw / 2)} strokeDasharray={n === 'auto' ? '2 1.5' : undefined} />
      })}
    </svg>
  )
}
export const CardGlyph = ({ detailed }: { detailed: boolean }) => (
  <svg width="30" height="20" viewBox="0 0 30 20" fill="none" aria-hidden="true">
    <rect x="1" y="1" width="28" height="18" rx="3.5" stroke="currentColor" strokeWidth="1.5" />
    {detailed && <><rect x="5" y="11.5" width="14" height="2" rx="1" fill="currentColor" /><rect x="5" y="15" width="8" height="1.6" rx="0.8" fill="currentColor" opacity="0.5" /></>}
  </svg>
)

export const GroupGlyph = ({ grouped }: { grouped: boolean }) => (
  <svg width="30" height="20" viewBox="0 0 30 20" fill="currentColor" aria-hidden="true">
    {grouped ? (<>
      <rect x="0" y="0" width="12" height="2" rx="1" opacity="0.5" />
      <rect x="0" y="4" width="9" height="5" rx="1.2" /><rect x="10.5" y="4" width="9" height="5" rx="1.2" /><rect x="21" y="4" width="9" height="5" rx="1.2" />
      <rect x="0" y="11" width="8" height="2" rx="1" opacity="0.5" />
      <rect x="0" y="15" width="9" height="5" rx="1.2" /><rect x="10.5" y="15" width="9" height="5" rx="1.2" />
    </>) : (<>
      <rect x="0" y="0" width="9" height="9" rx="1.2" /><rect x="10.5" y="0" width="9" height="9" rx="1.2" /><rect x="21" y="0" width="9" height="9" rx="1.2" />
      <rect x="0" y="11" width="9" height="9" rx="1.2" /><rect x="10.5" y="11" width="9" height="9" rx="1.2" /><rect x="21" y="11" width="9" height="9" rx="1.2" />
    </>)}
  </svg>
)
