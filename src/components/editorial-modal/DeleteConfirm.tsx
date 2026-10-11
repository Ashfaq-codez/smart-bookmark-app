import { useEffect, useRef } from 'react'

// "Delete this entry?" dialog shown over the editor.
export default function DeleteConfirm({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  const confirmDeleteRef = useRef<HTMLButtonElement>(null)

  // Auto-focus the Confirm button when the dialog appears
  useEffect(() => { confirmDeleteRef.current?.focus() }, [])

  return (
  <div className="absolute inset-0 z-[100000] flex items-center justify-center p-4 bg-[#FBF9F4]/80 dark:bg-[#080A08]/90 backdrop-blur-md transition-colors duration-500" onMouseDown={(e) => e.stopPropagation()}>
    <div className="w-full max-w-sm bg-white dark:bg-[#151815] border border-black/[0.04] dark:border-white/[0.04] flex flex-col shadow-2xl rounded-3xl">
      <div className="p-8 flex flex-col gap-5 text-center">
        <h3 className="text-2xl font-serif text-[#171A17] dark:text-[#F3F0E9] leading-none">Delete this entry?</h3>
        <p className="text-sm font-sans text-[#171A17]/60 dark:text-white/60">This action is permanent and cannot be undone.</p>
        <div className="flex flex-col gap-2 mt-2">
          <button 
            ref={confirmDeleteRef}
            onClick={onConfirm} 
            onKeyDown={(e) => { if (e.key === 'Enter') onConfirm() }}
            className="w-full py-3 bg-[#D93025] text-white font-sans font-semibold text-xs tracking-widest uppercase hover:bg-[#B32015] transition-all rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D93025]"
          >
            Confirm
          </button>
          <button onClick={onCancel} className="w-full py-3 bg-black/5 dark:bg-white/5 text-[#171A17] dark:text-[#F3F0E9] font-sans font-semibold text-xs tracking-widest uppercase hover:bg-black/10 dark:hover:bg-white/10 transition-all rounded-2xl">
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
  )
}
