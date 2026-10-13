import { useState, useEffect } from 'react'

// How long to wait after the last keystroke before searching.
export const SEARCH_DEBOUNCE_MS = 250

// The search text that is actually sent to the database.
// Typing waits for a short pause, so one search runs per pause instead of one per key.
// Clearing the box is instant and cancels any search still waiting, so it never costs an extra request.
export function useDebouncedSearch(search: string) {
  const [debounced, setDebounced] = useState(search)
  useEffect(() => {
    if (search === '') { setDebounced(''); return }
    const t = setTimeout(() => setDebounced(search), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [search])
  return debounced
}
