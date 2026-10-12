import { Undo2 } from 'lucide-react'

// The message that appears for a few seconds after a folder is deleted, with an Undo button.
export default function FolderUndoToast({ visible, message, onUndo }: { visible: boolean; message: string; onUndo: () => void }) {
  return (
    <div
      role="status"
      className={`flex items-center gap-3 max-w-[calc(100vw-2rem)] pl-4 pr-2 py-2 rounded-xl bg-white dark:bg-[#1A1D1A] text-[#171A17] dark:text-[#F3F0E9] border border-black/[0.08] dark:border-white/10 shadow-[0_12px_32px_rgba(0,0,0,0.18)] transition-all duration-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
    >
      <span className="text-sm min-w-0 truncate">{message}</span>
      <button
        onClick={onUndo}
        className="shrink-0 h-8 px-3 inline-flex items-center gap-1.5 rounded-lg text-sm font-semibold text-[#4D6A51] dark:text-[#8FAA91] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
      ><Undo2 size={14} strokeWidth={2} />Undo</button>
    </div>
  )
}
