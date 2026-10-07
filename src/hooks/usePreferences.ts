// src/hooks/usePreferences.ts
// The person's view settings (sort, group by date, columns, card details).
//  - The server page reads them from the database before the page is drawn, so there is no flash of wrong settings.
//  - Changing one updates the screen instantly and saves to the database a moment later (all changes in a burst = one save).
//  - First time on the new system: settings the old version kept in this browser are carried over once.
import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import toast from 'react-hot-toast'
import { Prefs, sanitizePrefs, samePrefs, legacyPrefsFromStorage } from '@/lib/preferences'

const SAVE_DELAY_MS = 600

export function usePreferences({ userId, initial, hasSaved }: { userId: string; initial: Prefs; hasSaved: boolean }) {
  const supabase = useMemo(() => createClient(), [])
  const [prefs, setPrefs] = useState<Prefs>(initial)
  const latest = useRef(prefs); latest.current = prefs
  const lastSaved = useRef<Prefs | null>(hasSaved ? initial : null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const warned = useRef(false)

  const save = useCallback(async () => {
    clearTimeout(timer.current)
    const toSave = sanitizePrefs(latest.current)
    if (lastSaved.current && samePrefs(lastSaved.current, toSave)) return
    const { error } = await supabase.from('user_preferences').upsert({ user_id: userId, prefs: toSave }, { onConflict: 'user_id' })
    if (error) {
      console.error('saving preferences failed:', error.message)
      if (!warned.current) { warned.current = true; toast.error('Could not save your view settings') }
      return
    }
    lastSaved.current = toSave
  }, [supabase, userId])

  const schedule = useCallback(() => {
    clearTimeout(timer.current)
    timer.current = setTimeout(save, SAVE_DELAY_MS)
  }, [save])

  const setPref = useCallback(<K extends keyof Prefs>(key: K, value: Prefs[K]) => {
    setPrefs((prev) => (prev[key] === value ? prev : { ...prev, [key]: value }))
    schedule()
  }, [schedule])

  // One-time carry-over of the old browser-only settings (only when nothing is saved in the database yet)
  useEffect(() => {
    if (hasSaved) return
    try {
      const legacy = legacyPrefsFromStorage((k) => localStorage.getItem(k))
      if (Object.keys(legacy).length === 0) return
      setPrefs((prev) => ({ ...prev, ...legacy }))
      schedule()
    } catch { /* storage blocked: nothing to carry over */ }
  }, [hasSaved, schedule])

  // Don't lose a change made just before closing the tab
  useEffect(() => {
    const flush = () => { if (document.visibilityState === 'hidden') save() }
    document.addEventListener('visibilitychange', flush)
    return () => { document.removeEventListener('visibilitychange', flush); clearTimeout(timer.current) }
  }, [save])

  return { prefs, setPref }
}
