import { ClearIcon } from './ListIcons'

export type FilterChip = { l: string; x: () => void }

// Removable chips for the active folder and search, plus "Clear all".
export default function FilterChips({ chips, clearAll }: { chips: FilterChip[]; clearAll: () => void }) {
  if (chips.length === 0) return null
  return (
  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#171A17] dark:text-[#F3F0E9]">
    {chips.map(f => (
      <span key={f.l} className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-md bg-black/[0.05] dark:bg-white/[0.07]">{f.l}
        <button aria-label={`Remove ${f.l}`} onClick={f.x} className="p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10"><ClearIcon /></button></span>
    ))}
    <button onClick={clearAll} className="px-1.5 py-1 font-medium text-[#4D6A51] dark:text-[#8FAA91] hover:underline">Clear all</button>
  </div>
  )
}
