import { useState, useEffect, RefObject } from 'react'

// Keyboard shortcuts for the list: Ctrl/⌘ K (commands), / (search), N (new note), Esc (close menus).
// Returns the name of the modifier key to show in hints ("⌘" on Apple devices, "Ctrl" elsewhere).
export function useListShortcuts({ openCapture, searchRef, togglePalette, closeMenus }: {
  openCapture: () => void
  searchRef: RefObject<HTMLInputElement | null>
  togglePalette: () => void
  closeMenus: () => void
}) {
  const [mod, setMod] = useState('⌘')

  useEffect(() => {
    if (!/Mac|iPhone|iPad/i.test(navigator.platform)) setMod('Ctrl')
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      const typing = !!t && (/INPUT|TEXTAREA|SELECT/.test(t.tagName) || t.isContentEditable)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); togglePalette() }
      else if (e.key === 'Escape') closeMenus()
      else if (!typing && !e.metaKey && !e.ctrlKey && e.key === '/') { e.preventDefault(); searchRef.current?.focus() }
      else if (!typing && !e.metaKey && !e.ctrlKey && e.key.toLowerCase() === 'n') { e.preventDefault(); openCapture() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openCapture, searchRef, togglePalette, closeMenus])

  return mod
}
