'use client'

import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { LoaderCircle } from 'lucide-react'

// "Delete folder 'X'?" Asks first, and says plainly that the saves are kept and move to All.
export default function DeleteFolderDialog({ folder, itemCount, isDeleting, onConfirm, onCancel }: {
  folder: string | null        // null = closed
  itemCount: number
  isDeleting: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!folder) return
    cancelRef.current?.focus()   // the safe choice is focused first
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !isDeleting) { e.preventDefault(); onCancel() } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [folder, isDeleting, onCancel])

  return (
    <AnimatePresence>
      {folder && (
        <motion.div
          className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
          onClick={() => { if (!isDeleting) onCancel() }}
        >
          <motion.div
            role="alertdialog" aria-modal="true" aria-labelledby="delete-folder-title" aria-describedby="delete-folder-text"
            className="w-full max-w-sm bg-white dark:bg-[#151815] border border-black/[0.04] dark:border-white/[0.06] p-6 rounded-2xl shadow-2xl"
            initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="delete-folder-title" className="text-xl font-serif text-[#171A17] dark:text-white mb-2 break-words">
              Delete folder &lsquo;{folder}&rsquo;?
            </h3>
            <p id="delete-folder-text" className="text-sm text-[#636A63] dark:text-[#9DA59D] mb-5">
              {itemCount === 0
                ? 'This folder is empty.'
                : `Its ${itemCount} ${itemCount === 1 ? 'item' : 'items'} will move to All. Nothing is deleted.`}
            </p>
            <div className="flex gap-2">
              <button
                ref={cancelRef} onClick={onCancel} disabled={isDeleting}
                className="flex-1 h-10 bg-black/5 dark:bg-white/5 text-sm rounded-xl text-[#171A17] dark:text-[#F3F0E9] hover:bg-black/10 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
              >Cancel</button>
              <button
                onClick={onConfirm} disabled={isDeleting}
                className="flex-1 h-10 inline-flex items-center justify-center gap-2 bg-[#D93025] text-white text-sm font-medium rounded-xl hover:bg-[#B32015] transition-colors disabled:opacity-70"
              >{isDeleting && <LoaderCircle size={16} className="animate-spin" />}Delete</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
