import { useEffect, useRef, useState } from 'react'

type KeyActions = {
  showDeleteConfirm: boolean
  setShowDeleteConfirm: (open: boolean) => void
  handleAutoSave: () => Promise<void>
  onClose: () => void
  onDelete: (id: number) => Promise<void>
  bookmarkId: number
}

// Esc closes the editor (or cancels the delete dialog); Enter confirms a delete.
// The listener is added once and always calls the LATEST functions through a ref, so it never uses stale values.
export function useModalKeys(actions: KeyActions) {
  const latest = useRef(actions)
  useEffect(() => { latest.current = actions })

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      const { showDeleteConfirm, setShowDeleteConfirm, handleAutoSave, onClose, onDelete, bookmarkId } = latest.current

      // Handle Escape to close modal or cancel delete
      if (e.key === 'Escape') {
        e.preventDefault()
        if (showDeleteConfirm) return setShowDeleteConfirm(false)
        await handleAutoSave()
        onClose()
      }

      // Handle Enter to safely confirm deletion
      if (e.key === 'Enter' && showDeleteConfirm) {
        e.preventDefault()
        setShowDeleteConfirm(false)
        onDelete(bookmarkId)
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
}

// Swiping down on the mobile drag handle saves and closes.
export function useSwipeDown(onSwipeDown: () => void) {
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)

  return {
    onTouchStart: (e: React.TouchEvent) => { setTouchStart(e.targetTouches[0].clientY); setTouchEnd(0) },
    onTouchMove: (e: React.TouchEvent) => { setTouchEnd(e.targetTouches[0].clientY) },
    onTouchEnd: () => {
      if (!touchStart || !touchEnd) return;
      if (touchEnd - touchStart > 45) onSwipeDown();
      setTouchStart(0); setTouchEnd(0);
    },
  }
}
