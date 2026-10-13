'use client'

import { useState, ReactNode, DragEvent } from 'react'
import { motion } from 'motion/react'
import { Trash2 } from 'lucide-react'

// The right-hand edge of every sidebar row: [count] [delete slot]. Rows without a delete button still reserve the slot,
// so the counts line up in one column. The slot is 32px wide (a comfortable tap target) but pulled into the row's padding.
export const ROW_END_SLOT = 'w-8 -mr-2 shrink-0'

// One folder in the sidebar: [name ........ count  delete].
// The delete button fades in on hover or keyboard focus; on touch screens (no hover) it is always visible.
export default function FolderRow({ name, count, active, icon, onOpen, onDelete, onDragOver, onDrop }: {
  name: string
  count: number
  active: boolean
  icon: ReactNode
  onOpen: () => void
  onDelete?: () => void       // leave out for built-in folders that cannot be deleted
  onDragOver: (e: DragEvent) => void
  onDrop: (e: DragEvent) => void
}) {
  const [revealed, setRevealed] = useState(false)

  return (
    <div
      onDragOver={onDragOver} onDrop={onDrop} onClick={onOpen}
      onMouseEnter={() => setRevealed(true)} onMouseLeave={() => setRevealed(false)}
      onFocus={() => setRevealed(true)} onBlur={() => setRevealed(false)}
      className={`flex items-center gap-2 px-6 py-2 cursor-pointer transition-colors ${active ? 'text-[#171A17] dark:text-white font-medium bg-black/[0.03] dark:bg-white/[0.03]' : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.02]'}`}
    >
      {/* min-w-0 lets a long name shrink and show "…" instead of pushing the count out */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <span className="shrink-0">{icon}</span>
        <span className="text-sm truncate" title={name}>{name}</span>
      </div>
      <span className="shrink-0 min-w-[2ch] text-right tabular-nums text-[10px] text-[#A0A6A0]">{count}</span>
      {onDelete ? (
        <motion.button
          type="button"
          aria-label={`Delete folder ${name}`}
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          initial={false}
          animate={{ opacity: revealed ? 1 : 0 }}
          transition={{ duration: 0.15 }}
          className={`${ROW_END_SLOT} h-8 -my-2 inline-flex items-center justify-center rounded-md text-[#E53E3E] hover:bg-[#E53E3E]/10 outline-none focus-visible:ring-2 focus-visible:ring-[#E53E3E]/60 [@media(hover:none)]:opacity-100!`}
        >
          <Trash2 size={14} strokeWidth={1.8} />
        </motion.button>
      ) : (
        <span className={ROW_END_SLOT} aria-hidden="true" />
      )}
    </div>
  )
}
