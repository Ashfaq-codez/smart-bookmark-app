// src/hooks/useBookmarks.ts
import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Bookmark } from '@/types'
import { normalizeUrl } from '@/utils/normalizeUrl'
import {
  PAGE_SIZE, MAX_PINS, LIST_COLUMNS, ListQuery, BookmarkStats, buildListQuery, rowMatchesQuery, escapeLike,
} from '@/lib/bookmarkQuery'
import { applyToList, applyToPins } from '@/lib/bookmarkOrder'
import toast from 'react-hot-toast'

// Realtime keeps the list in sync while the tab is open. After a long sleep the websocket may have missed events,
// so we reload the FIRST PAGE only (never the whole table).
const STALE_AFTER_MS = 5 * 60 * 1000
const SEARCH_DEBOUNCE_MS = 250

type SaveHit = { id: number; title: string; url: string }

// Realtime rows carry the full note body and the search text. The grid only needs the trimmed version.
const toLight = (row: any): Bookmark => {
  const { content, search_text, ...rest } = row
  return rest as Bookmark
}
const withoutUndefined = (o: Record<string, any>) =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined))

export const useBookmarks = ({
  initialBookmarks, initialPins, initialHasMore, initialStats, query,
}: {
  initialBookmarks: Bookmark[]
  initialPins: Bookmark[]      // saves the person pinned to the top (matching the first view)
  initialHasMore: boolean
  initialStats: BookmarkStats
  query: ListQuery
}) => {
  const supabase = useMemo(() => createClient(), [])

  const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [isFetching, setIsFetching] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [stats, setStats] = useState<BookmarkStats>(initialStats)
  // `pins` = saves the person PINNED to the top on purpose (shown in the "Pinned" strip).
  const [pins, setPins] = useState<Bookmark[]>(initialPins)
  // `pinned` (older name) = extra saves shown only because they were opened by link / search / "already saved".
  const [pinned, setPinned] = useState<Bookmark[]>([])

  // --- search is debounced so we don't hit the database on every keystroke ---
  const [debouncedSearch, setDebouncedSearch] = useState(query.search)
  useEffect(() => {
    if (query.search === '') { setDebouncedSearch(''); return }
    const t = setTimeout(() => setDebouncedSearch(query.search), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [query.search])

  const effectiveQuery = useMemo<ListQuery>(
    () => ({ category: query.category, sub: query.sub, mediaType: query.mediaType, search: debouncedSearch, sort: query.sort }),
    [query.category, query.sub, query.mediaType, query.sort, debouncedSearch]
  )
  const queryKey = JSON.stringify(effectiveQuery)

  // Refs let long-lived callbacks (realtime, observers) always see the latest values without re-subscribing.
  const queryRef = useRef(effectiveQuery); queryRef.current = effectiveQuery
  const bookmarksRef = useRef(bookmarks); bookmarksRef.current = bookmarks
  const pinsRef = useRef(pins); pinsRef.current = pins
  const extraRef = useRef(pinned); extraRef.current = pinned
  const hasMoreRef = useRef(hasMore); hasMoreRef.current = hasMore
  const busyRef = useRef(false)
  const requestId = useRef(0)
  // The server already sent the first view (using the person's saved sort order), so remember which one it was.
  const loadedKey = useRef(JSON.stringify({ category: 'All', sub: null, mediaType: null, search: '', sort: query.sort }))

  // ---------- counts for the sidebar ----------
  const refreshStats = useCallback(async () => {
    const { data, error } = await supabase.rpc('bookmark_stats')
    if (!error && data) setStats(data as BookmarkStats)
  }, [supabase])

  const statsTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const scheduleStats = useCallback(() => {
    clearTimeout(statsTimer.current)
    statsTimer.current = setTimeout(refreshStats, 600)
  }, [refreshStats])

  // ---------- first page for the current filters ----------
  const loadFirstPage = useCallback(async (q: ListQuery) => {
    const id = ++requestId.current
    setIsFetching(true)
    const [{ data, error }, pinRes] = await Promise.all([
      buildListQuery(supabase, q, null, PAGE_SIZE + 1),
      buildListQuery(supabase, q, null, MAX_PINS, 'pinned'),
    ])
    if (id !== requestId.current) return // a newer request replaced this one
    setIsFetching(false)
    if (error || !data) { toast.error('Could not load your saves'); return }
    setHasMore(data.length > PAGE_SIZE)
    setBookmarks(data.slice(0, PAGE_SIZE) as Bookmark[])
    if (!pinRes.error && pinRes.data) setPins(pinRes.data as Bookmark[])
  }, [supabase])

  useEffect(() => {
    if (loadedKey.current === queryKey) return // the server already sent this exact view
    loadedKey.current = queryKey
    loadFirstPage(queryRef.current)
  }, [queryKey, loadFirstPage])

  // ---------- next page (called when the bottom of the grid comes into view) ----------
  const loadMore = useCallback(async () => {
    if (busyRef.current || !hasMoreRef.current) return
    const list = bookmarksRef.current
    const last = list[list.length - 1]
    if (!last) return

    busyRef.current = true
    const id = requestId.current
    setIsLoadingMore(true)
    const { data, error } = await buildListQuery(
      supabase, queryRef.current, { created_at: last.created_at, id: last.id }, PAGE_SIZE + 1
    )
    busyRef.current = false
    setIsLoadingMore(false)
    if (id !== requestId.current || error || !data) return

    setHasMore(data.length > PAGE_SIZE)
    setBookmarks((prev) => {
      const seen = new Set(prev.map((b) => b.id))
      return [...prev, ...(data.slice(0, PAGE_SIZE) as Bookmark[]).filter((b) => !seen.has(b.id))]
    })
  }, [supabase])

  // ---------- one place that decides where a changed save belongs: normal list, pinned strip, or neither ----------
  const findAnywhere = useCallback((id: number): Bookmark | undefined =>
    bookmarksRef.current.find((b) => b.id === id) || pinsRef.current.find((b) => b.id === id) || extraRef.current.find((b) => b.id === id), [])

  // `item` must be the complete, up-to-date copy of the save.
  const applyChange = useCallback((item: Bookmark, searchText?: string | null) => {
    const q = queryRef.current
    const matches = rowMatchesQuery({ ...item, search_text: searchText ?? undefined }, q)
    const wasPinned = pinsRef.current.some((b) => b.id === item.id)
    setPins((prev) => applyToPins(prev, item, matches))
    setBookmarks((prev) => applyToList(prev, item, { matches, wasPinned, sort: q.sort, hasMore: hasMoreRef.current }))
    setPinned((prev) => prev.map((b) => (b.id === item.id ? { ...b, ...item } : b)))
  }, [])

  // ---------- live updates (Realtime) + reload after a long sleep ----------
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null
    let hiddenAt: number | null = null

    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      channel = supabase
        .channel(`realtime_bookmarks_${user.id}_${crypto.randomUUID()}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'bookmarks', filter: `user_id=eq.${user.id}` },
          (payload) => {
            const q = queryRef.current

            if (payload.eventType === 'INSERT') {
              scheduleStats()
              const row = payload.new as any
              if (!rowMatchesQuery(row, q)) return
              const light = toLight(row)
              setBookmarks((prev) => {
                if (prev.some((b) => b.id === light.id)) return prev
                if (light.type === 'link' || !light.type) {
                  const target = normalizeUrl(light.url)
                  if (prev.some((b) => (b.type === 'link' || !b.type) && normalizeUrl(b.url) === target)) return prev
                }
                if (q.sort === 'desc') return [light, ...prev]
                return hasMoreRef.current ? prev : [...prev, light]
              })
            } else if (payload.eventType === 'UPDATE') {
              scheduleStats()
              const row = payload.new as any
              applyChange({ ...(findAnywhere(row.id) || {}), ...withoutUndefined(toLight(row)) } as Bookmark, row.search_text)
            }
          }
        )
        // DELETE events cannot be filtered by user (the database only sends the id of the removed row),
        // so they need their own listener WITHOUT a filter. It only removes ids that are in this user's list.
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'bookmarks' },
          (payload) => {
            const id = (payload.old as any)?.id
            if (id == null) return
            scheduleStats()
            setBookmarks((prev) => prev.filter((b) => b.id !== id))
            setPins((prev) => prev.filter((b) => b.id !== id))
            setPinned((prev) => prev.filter((b) => b.id !== id))
          }
        )
        .subscribe()
    }
    setupRealtime()

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') { hiddenAt = Date.now(); return }
      if (hiddenAt !== null && Date.now() - hiddenAt > STALE_AFTER_MS) {
        loadFirstPage(queryRef.current)
        refreshStats()
      }
      hiddenAt = null
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      if (channel) supabase.removeChannel(channel)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      clearTimeout(statsTimer.current)
    }
  }, [supabase, loadFirstPage, refreshStats, scheduleStats, findAnywhere, applyChange])

  // ---------- delete ----------
  const deleteBookmark = async (id: number) => {
    const { error } = await supabase.from('bookmarks').delete().eq('id', id)
    if (error) { toast.error('Failed to delete'); return }
    setBookmarks((prev) => prev.filter((b) => b.id !== id))
    setPins((prev) => prev.filter((b) => b.id !== id))
    setPinned((prev) => prev.filter((b) => b.id !== id))
    scheduleStats()
    toast.success('Bookmark removed')
  }

  // ---------- update ----------
  const updateBookmark = async (id: number, updates: Partial<Bookmark>) => {
    const payload = { ...updates }
    if (payload.url) payload.url = normalizeUrl(payload.url)

    const { error } = await supabase.from('bookmarks').update(payload).eq('id', id)
    if (error) {
      if (error.code === '23505') { toast.error('A bookmark with this URL already exists.'); return }
      toast.error('Failed to update')
      return
    }

    // The list holds only a trimmed copy of the note body, so keep it that way locally.
    const localPatch: Partial<Bookmark> = { ...payload }
    if ('content' in payload) { localPatch.content_preview = payload.content ?? null; delete localPatch.content }

    const current = findAnywhere(id)
    if (current) applyChange({ ...current, ...localPatch } as Bookmark)
    scheduleStats()
  }

  // ---------- pin / unpin ----------
  const togglePin = useCallback(async (id: number, pin: boolean) => {
    const current = findAnywhere(id)
    if (!current) return
    if (pin && !current.pinned_at && pinsRef.current.length >= MAX_PINS) {
      toast.error(`You can pin up to ${MAX_PINS} saves. Unpin one first.`)
      return
    }
    const before = current
    const pinned_at = pin ? new Date().toISOString() : null
    applyChange({ ...current, pinned_at })                      // instant, then confirm with the database
    const { error } = await supabase.from('bookmarks').update({ pinned_at }).eq('id', id)
    if (error) {
      applyChange(before)                                        // put it back
      toast.error(pin ? 'Could not pin' : 'Could not unpin')
    }
  }, [supabase, findAnywhere, applyChange])

  // ---------- open a save that is not on the loaded pages (deep link, command palette, "already saved") ----------
  const pinById = useCallback(async (id: number) => {
    if (bookmarksRef.current.some((b) => b.id === id)) return
    const { data } = await supabase.from('bookmarks').select(LIST_COLUMNS).eq('id', id).maybeSingle()
    if (data) setPinned((prev) => (prev.some((b) => b.id === id) ? prev : [data as Bookmark, ...prev]))
  }, [supabase])
  const clearPinned = useCallback(() => setPinned([]), [])

  // ---------- command palette search (whole library, not just loaded pages) ----------
  const searchSaves = useCallback(async (term: string): Promise<SaveHit[]> => {
    const s = term.trim().toLowerCase()
    if (!s) return []
    const { data } = await supabase
      .from('bookmarks')
      .select('id,title,url')
      .ilike('search_text', `%${escapeLike(s)}%`)
      .order('created_at', { ascending: false })
      .limit(6)
    return (data || []) as SaveHit[]
  }, [supabase])

  return {
    bookmarks, pins, pinned, hasMore, isFetching, isLoadingMore, stats,
    loadMore, updateBookmark, deleteBookmark, togglePin, pinById, clearPinned, searchSaves,
  }
}