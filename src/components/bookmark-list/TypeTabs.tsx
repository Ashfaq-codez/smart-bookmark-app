import { BookmarkStats } from '@/lib/bookmarkQuery'
import { TYPE_META } from '@/components/TypeIcons'
import { mediaTypeLabels } from './listHelpers'

// The row of type filters: All, Links, Notes, Images and so on, each with its count.
export default function TypeTabs({ activeMediaType, setActiveMediaType, stats, typeCounts }: {
  activeMediaType: string | null
  setActiveMediaType: (t: string | null) => void
  stats: BookmarkStats
  typeCounts: Record<string, number>
}) {
  return (
  <div role="tablist" aria-label="Filter by type" className="mt-5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
    {[{ k: null as string | null, label: 'All' }, ...Object.entries(mediaTypeLabels).map(([k, label]) => ({ k: k as string | null, label }))].map(t => {
      const on = activeMediaType === t.k
      const meta = TYPE_META[t.k ?? 'all'] ?? TYPE_META.all
      const Icon = meta.Icon
      const count = t.k === null ? stats.total : (typeCounts[t.k] ?? 0)
      return (
        <button key={t.label} role="tab" aria-selected={on} onClick={() => setActiveMediaType(t.k)}
          className={`group/pill shrink-0 inline-flex items-center gap-2 h-10 pl-1.5 pr-2 rounded-full text-sm font-medium border transition-all duration-200 ${on
            ? 'bg-[#171A17] border-[#171A17] text-white shadow-[0_6px_18px_rgba(23,26,23,0.18)] dark:bg-[#F3F0E9] dark:border-[#F3F0E9] dark:text-[#151815]'
            : `bg-white dark:bg-[#151815] border-black/[0.07] dark:border-white/10 text-[#171A17]/75 dark:text-white/75 hover:border-black/20 dark:hover:border-white/25 hover:text-[#171A17] dark:hover:text-white ${count === 0 ? 'opacity-55' : ''}`}`}>
          <span className={`w-7 h-7 inline-flex items-center justify-center rounded-full transition-colors ${on ? `bg-white/10 dark:bg-black/[0.07] ${meta.tintOn}` : `bg-black/[0.04] dark:bg-white/[0.06] group-hover/pill:bg-black/[0.07] dark:group-hover/pill:bg-white/[0.1] ${meta.tint}`}`}>
            <Icon className="w-4 h-4" />
          </span>
          <span>{t.label}</span>
          <span className={`min-w-6 h-6 px-1.5 inline-flex items-center justify-center rounded-full text-[11px] tabular-nums ${on ? 'bg-white/15 text-white/85 dark:bg-black/10 dark:text-[#151815]/75' : 'bg-black/[0.05] dark:bg-white/[0.07] text-[#171A17]/55 dark:text-white/55'}`}>{count}</span>
        </button>
      )
    })}
  </div>
  )
}
