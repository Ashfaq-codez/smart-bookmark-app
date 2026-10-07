'use client'

import { useCallback, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'

// Re-runs the /admin server page in the background so new feedback appears without a manual reload.
// Only refreshes while the tab is visible, and right away when you come back to the tab.
export default function AdminAutoRefresh({ intervalMs = 30_000 }: { intervalMs?: number }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const refresh = useCallback(() => {
    startTransition(() => router.refresh())
  }, [router])

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    const id = window.setInterval(tick, intervalMs)
    document.addEventListener('visibilitychange', tick)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [refresh, intervalMs])

  return (
    <button
      onClick={refresh}
      disabled={isPending}
      className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#737B73] dark:text-[#8F998F] hover:text-[#171A17] dark:hover:text-[#F3F0E9] transition-colors cursor-pointer disabled:cursor-default"
      title={`Updates automatically every ${Math.round(intervalMs / 1000)} seconds`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full bg-[#4D6A51] dark:bg-[#8FAA91] ${isPending ? 'animate-ping' : ''}`}
        aria-hidden
      />
      {isPending ? 'Updating…' : 'Live'}
    </button>
  )
}
