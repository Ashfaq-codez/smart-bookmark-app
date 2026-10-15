import { useEffect } from 'react'
import type { Bookmark } from '@/types'
import { getSubstackNotePost } from '@/lib/postData'
import { isLinkedInPostUrl } from '@/lib/urlTools'

// X, Instagram, YouTube, Reddit, Substack and Medium cards saved before snapshots existed (or whose read failed): ask the server, once per page load,
// to read the post. A failed one is asked at most once a day (here and again on the server). The stored snapshot then arrives through the normal live update and the card refreshes itself.
// At most 2 requests run at a time, so a page full of old X cards does not flood the server.

const DAY_MS = 24 * 60 * 60 * 1000
const MAX_PARALLEL = 2
const asked = new Set<number>()
const queue: number[] = []
let running = 0

function pump() {
  while (running < MAX_PARALLEL && queue.length) {
    const id = queue.shift()!
    running++
    fetch(`/api/bookmarks/${id}/snapshot`, { method: 'POST' })
      .catch(() => { /* offline: try again on the next page load */ })
      .finally(() => { running--; pump() })
  }
}

export function needsRepair(b: Pick<Bookmark, 'id' | 'post_data' | 'post_data_failed_at'> & { url?: string }, displayType: string, now = Date.now()) {
  if (!['twitter', 'instagram', 'youtube', 'reddit', 'substack', 'medium', 'substack-note', 'hackernews', 'spotify', 'threads', 'linkedin'].includes(displayType)) return false
  // LinkedIn profiles, jobs, company pages: no post to read.
  if (displayType === 'linkedin' && !isLinkedInPostUrl(b.url)) return false
  // A Substack Note first stored as an article snapshot is read again as a Note.
  if (displayType === 'substack-note' ? getSubstackNotePost(b) : b.post_data) return false
  if (!b.post_data_failed_at) return true
  const failed = Date.parse(b.post_data_failed_at)
  return isNaN(failed) || now - failed >= DAY_MS
}

export function useSnapshotRepair(bookmark: Bookmark, displayType: string) {
  const need = needsRepair(bookmark, displayType)
  useEffect(() => {
    if (!need || asked.has(bookmark.id)) return
    asked.add(bookmark.id)
    queue.push(bookmark.id)
    pump()
  }, [need, bookmark.id])
}
