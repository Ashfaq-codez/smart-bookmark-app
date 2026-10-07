// src/lib/bookmarkOrder.ts
// Pure helpers that decide where a save belongs after it changes (pinned, unpinned, edited, moved to another folder).
// Kept free of React so every rule is covered by tests.
import type { Bookmark } from '@/types'

export type Sort = 'desc' | 'asc'

// true when `a` comes before `b` in the list order (newest first for 'desc')
const comesBefore = (a: Bookmark, b: Bookmark, sort: Sort) => {
  const dir = sort === 'desc' ? 1 : -1
  if (a.created_at !== b.created_at) return (a.created_at > b.created_at ? 1 : -1) * dir > 0
  return (a.id > b.id ? 1 : -1) * dir > 0
}

// Puts an item into an already sorted list. If it would land after the last loaded card and more pages exist,
// it is skipped: it will arrive by itself when the person scrolls that far.
export function insertSorted(list: Bookmark[], item: Bookmark, sort: Sort, hasMore: boolean): Bookmark[] {
  if (list.some((b) => b.id === item.id)) return list
  const at = list.findIndex((b) => comesBefore(item, b, sort))
  if (at === -1) return hasMore ? list : [...list, item]
  return [...list.slice(0, at), item, ...list.slice(at)]
}

export const sortPins = (pins: Bookmark[]) =>
  pins.slice().sort((a, b) => (a.pinned_at! < b.pinned_at! ? 1 : a.pinned_at! > b.pinned_at! ? -1 : b.id - a.id))

type ListCtx = {
  matches: boolean        // does the changed save still belong to the open view (folder / type / search)?
  wasPinned: boolean      // was it in the pinned strip before this change?
  sort: Sort
  hasMore: boolean
}

// `item` is always the COMPLETE, up-to-date copy of the save that changed (the caller merges old + new).

// The normal (unpinned) list after one save changed.
export function applyToList(list: Bookmark[], item: Bookmark, ctx: ListCtx): Bookmark[] {
  if (item.pinned_at) return list.filter((b) => b.id !== item.id)            // pinned: leaves the normal list
  const idx = list.findIndex((b) => b.id === item.id)
  if (idx === -1) {
    // Not loaded. Only a save coming back from the pinned strip needs placing.
    return ctx.wasPinned && ctx.matches ? insertSorted(list, item, ctx.sort, ctx.hasMore) : list
  }
  if (!ctx.matches) return list.filter((b) => b.id !== item.id)              // moved out of this view
  const next = list.slice()
  next[idx] = item
  return next
}

// The pinned strip after one save changed.
export function applyToPins(pins: Bookmark[], item: Bookmark, matches: boolean): Bookmark[] {
  const rest = pins.filter((b) => b.id !== item.id)
  if (!item.pinned_at || !matches) return rest
  return sortPins([item, ...rest])
}
