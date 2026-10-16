import { useEffect } from 'react'
import type { Bookmark } from '@/types'
import { needsPreview } from '@/lib/previewRule'

// Link cards without a picture of their own: ask the server, once per page load, to copy the picture into our
// storage, read the page again or take a screenshot. The server tries each card at most once every few hours. One request at a time (each starts a headless Chrome).
// The picture then arrives through the normal live update and the card refreshes itself.

const asked = new Set<number>()
const queue: number[] = []
let running = false

function pump() {
  if (running || !queue.length) return
  const id = queue.shift()!
  running = true
  fetch(`/api/bookmarks/${id}/preview`, { method: 'POST' })
    .catch(() => { /* offline: try again on the next page load */ })
    .finally(() => { running = false; pump() })
}

export function usePreviewRepair(bookmark: Bookmark, displayType: string) {
  const need = displayType !== 'google' && needsPreview(bookmark)
  useEffect(() => {
    if (!need || asked.has(bookmark.id)) return
    asked.add(bookmark.id)
    queue.push(bookmark.id)
    pump()
  }, [need, bookmark.id])
}
