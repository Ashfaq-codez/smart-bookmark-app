import { Bookmark } from '@/types'

// "Already Cataloged": shown when the thing you tried to save is already in your library.
export default function DuplicateDialog({ match, onView, onDismiss }: { match: Bookmark; onView: () => void; onDismiss: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm" onClick={onDismiss}>
      <div className="w-full max-w-sm bg-white dark:bg-[#151815] border border-black/[0.04] dark:border-white/[0.04] p-6 rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-serif text-[#171A17] dark:text-white mb-2">Already Cataloged</h3>
        <p className="text-sm text-[#636A63] dark:text-[#9DA59D] mb-4">This source currently exists in your Space.</p>
        <div className="p-3 bg-[#F5F1E8]/50 dark:bg-[#202520] rounded-xl mb-4 border border-black/[0.04] dark:border-white/[0.04]">
           <p className="text-sm font-medium truncate text-[#171A17] dark:text-[#F3F0E9]">{match.title || match.url || 'Untitled Save'}</p>
           <p className="text-xs truncate text-[#737B73] dark:text-[#8F998F] mt-1">{match.url ? match.url.replace(/^https?:\/\/(www\.)?/, '') : ''}</p>
        </div>
        <div className="flex gap-2">
           <button onClick={onView} className="flex-1 py-2 bg-[#4D6A51] text-white text-sm rounded-xl hover:opacity-90 transition-opacity">
              View
           </button>
           <button onClick={onDismiss} className="flex-1 py-2 bg-black/5 dark:bg-white/5 text-sm rounded-xl text-[#171A17] dark:text-[#F3F0E9] hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
              Dismiss
           </button>
        </div>
      </div>
    </div>
  )
}
