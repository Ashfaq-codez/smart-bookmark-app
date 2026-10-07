'use client'
/* eslint-disable react-hooks/exhaustive-deps */
// src/components/CommandPalette.tsx
// Ctrl/⌘ K: search saves and run commands. The commands themselves come from BookmarkList's `commands` list.

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { TYPE_META } from './TypeIcons'

export type Command = { id: string; group: string; label: string; hint?: string; run: () => void }
export type SaveHit = { id: number; title: string; url: string }

const Svg = ({ children }: { children: ReactNode }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
)
const SearchI = () => <Svg><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></Svg>
const PlusI = () => <Svg><path d="M12 5v14M5 12h14" /></Svg>
const UploadI = () => <Svg><path d="M12 16V4" /><path d="M7 9l5-5 5 5" /><path d="M5 20h14" /></Svg>
const CalendarI = () => <Svg><rect x="3" y="4" width="18" height="17" rx="2.5" /><path d="M16 2v4M8 2v4M3 10h18" /></Svg>
const CardI = () => <Svg><rect x="3" y="4" width="18" height="16" rx="3" /><path d="M7 14h8M7 17h5" /></Svg>
const CompassI = () => <Svg><circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" /></Svg>
const FolderI = () => <Svg><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></Svg>

const KBD = 'inline-flex items-center justify-center min-w-[1.4rem] h-5 px-1.5 rounded-md border border-black/10 dark:border-white/15 bg-white dark:bg-white/[0.06] text-[10px] font-medium text-[#171A17]/55 dark:text-white/55'
const neutral = 'text-[#171A17]/60 dark:text-white/60'
const green = 'text-[#4D6A51] dark:text-[#8FAA91]'

type Item = { key: string; group: string; label: string; sub?: string; hint?: string; icon: ReactNode; tint: string; run: () => void }

function iconFor(id: string, group: string): { icon: ReactNode; tint: string } {
  if (id === 'new-note') return { icon: <PlusI />, tint: green }
  if (id === 'upload') return { icon: <UploadI />, tint: neutral }
  if (id === 'group') return { icon: <CalendarI />, tint: neutral }
  if (id === 'details') return { icon: <CardI />, tint: neutral }
  if (id === 'guide') return { icon: <CompassI />, tint: green }
  if (id === 'all' || id.startsWith('type-')) {
    const m = TYPE_META[id === 'all' ? 'all' : id.slice(5)] ?? TYPE_META.all
    return { icon: <m.Icon className="w-4 h-4" />, tint: m.tint }
  }
  if (group === 'Folders') return { icon: <FolderI />, tint: 'text-amber-600 dark:text-amber-400' }
  return { icon: <SearchI />, tint: neutral }
}

const domain = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, '') } catch { return '' } }

export default function CommandPalette({ commands, search, onPick, onClose }: {
  commands: Command[]; search: (q: string) => Promise<SaveHit[]>; onPick: (b: SaveHit) => void; onClose: () => void
}) {
  const [q, setQ] = useState('')
  const [i, setI] = useState(0)
  const [hits, setHits] = useState<SaveHit[]>([])
  const [searching, setSearching] = useState(false)
  const listRef = useRef<HTMLUListElement>(null)
  const needle = q.trim().toLowerCase()

  useEffect(() => {
    if (!needle) { setHits([]); setSearching(false); return }
    let cancelled = false
    setSearching(true)
    const t = setTimeout(async () => {
      try { const r = await search(needle); if (!cancelled) setHits(r) }
      catch { if (!cancelled) setHits([]) }
      finally { if (!cancelled) setSearching(false) }
    }, 200)
    return () => { cancelled = true; clearTimeout(t) }
  }, [needle])

  const items = useMemo<Item[]>(() => {
    const cmds = commands.filter(c => !needle || c.label.toLowerCase().includes(needle))
    return [
      ...cmds.map(c => ({ key: c.id, group: c.group, label: c.label, hint: c.hint, run: c.run, ...iconFor(c.id, c.group) })),
      ...hits.map(b => {
        const isNote = (b.url || '').includes('/note-')
        const m = TYPE_META[isNote ? 'note' : 'link']
        return { key: `b${b.id}`, group: 'Saves', label: b.title || b.url, sub: isNote ? 'Note' : domain(b.url), icon: <m.Icon className="w-4 h-4" />, tint: m.tint, run: () => onPick(b) }
      }),
    ]
  }, [needle, commands, hits])

  // Keep the highlight on a real row, and scroll it into view when moving with the arrow keys
  useEffect(() => { setI(v => Math.min(v, Math.max(items.length - 1, 0))) }, [items.length])
  useEffect(() => { listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' }) }, [i])

  const go = (it: Item) => { onClose(); it.run() }

  return (
    <div className="fixed inset-0 z-[300] flex items-start justify-center pt-[10vh] sm:pt-[14vh] px-3 bg-black/25 dark:bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <style>{`@keyframes inntoit-cp-in { from { opacity: 0; transform: translateY(-6px) scale(.985) } to { opacity: 1; transform: none } } .inntoit-cp-in { animation: inntoit-cp-in .22s cubic-bezier(.22,1,.36,1) }`}</style>
      <div role="dialog" aria-modal="true" aria-label="Command palette" onClick={e => e.stopPropagation()}
        className="inntoit-cp-in w-full max-w-xl overflow-hidden rounded-2xl bg-white/95 dark:bg-[#151815]/95 backdrop-blur-xl border border-black/[0.06] dark:border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.22)]">

        <div className="flex items-center gap-3 px-4 border-b border-black/[0.06] dark:border-white/10">
          <span className={green}><SearchI /></span>
          <input autoFocus value={q} placeholder="Search saves or type a command…" aria-label="Search saves or run a command"
            onChange={e => { setQ(e.target.value); setI(0) }}
            onKeyDown={e => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setI(v => Math.min(v + 1, items.length - 1)) }
              else if (e.key === 'ArrowUp') { e.preventDefault(); setI(v => Math.max(v - 1, 0)) }
              else if (e.key === 'Enter' && items[i]) { e.preventDefault(); go(items[i]) }
              else if (e.key === 'Escape') { e.preventDefault(); onClose() }
            }}
            className="flex-1 min-w-0 h-14 bg-transparent outline-none text-base text-[#171A17] dark:text-[#F3F0E9] placeholder-black/35 dark:placeholder-white/35" />
          <kbd className={KBD}>Esc</kbd>
        </div>

        <ul ref={listRef} role="listbox" aria-label="Results" className="max-h-[min(52vh,420px)] overflow-y-auto p-2 custom-scrollbar">
          {items.length === 0 && !searching && (
            <li className="flex flex-col items-center gap-2 px-3 py-10 text-center">
              <span className="w-10 h-10 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] inline-flex items-center justify-center text-[#171A17]/40 dark:text-white/40"><SearchI /></span>
              <span className="text-sm text-[#171A17]/70 dark:text-white/70">Nothing matches “{q}”</span>
              <span className="text-xs text-[#171A17]/45 dark:text-white/45">Try another word, or part of a link</span>
            </li>
          )}
          {items.map((it, n) => (
            <li key={it.key} role="presentation">
              {(n === 0 || items[n - 1].group !== it.group) && (
                <p className="px-3 pt-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#171A17]/40 dark:text-white/40">{it.group}</p>
              )}
              <button role="option" aria-selected={n === i} data-active={n === i} onMouseMove={() => setI(n)} onClick={() => go(it)}
                className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-left text-sm transition-colors ${n === i ? 'bg-[#4D6A51]/[0.09] dark:bg-[#8FAA91]/[0.12]' : ''}`}>
                <span className={`w-8 h-8 shrink-0 rounded-lg inline-flex items-center justify-center transition-colors ${n === i ? 'bg-white dark:bg-[#202520] shadow-sm' : 'bg-black/[0.04] dark:bg-white/[0.06]'} ${it.tint}`}>{it.icon}</span>
                <span className="flex-1 min-w-0">
                  <span className="block truncate text-[#171A17] dark:text-[#F3F0E9]">{it.label}</span>
                  {it.sub && <span className="block truncate text-xs text-[#171A17]/45 dark:text-white/45">{it.sub}</span>}
                </span>
                {it.hint && <kbd className={`${KBD} hidden sm:inline-flex`}>{it.hint}</kbd>}
                {n === i && <span className={`hidden sm:inline text-xs ${green}`} aria-hidden="true">↵</span>}
              </button>
            </li>
          ))}
          {searching && <li className="px-3 py-3 text-xs text-[#171A17]/45 dark:text-white/45">Searching your saves…</li>}
        </ul>

        <div className="hidden sm:flex items-center gap-4 px-4 py-2.5 border-t border-black/[0.06] dark:border-white/10 text-[11px] text-[#171A17]/45 dark:text-white/45">
          <span className="inline-flex items-center gap-1"><kbd className={KBD}>↑</kbd><kbd className={KBD}>↓</kbd> move</span>
          <span className="inline-flex items-center gap-1"><kbd className={KBD}>↵</kbd> open</span>
          <span className="inline-flex items-center gap-1"><kbd className={KBD}>Esc</kbd> close</span>
          <span className="ml-auto font-serif text-xs text-[#171A17]/35 dark:text-white/35">inntoit</span>
        </div>
      </div>
    </div>
  )
}
