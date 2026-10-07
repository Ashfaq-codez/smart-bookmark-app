// src/components/ExportSaves.tsx
'use client'

import { useState, type ReactNode } from 'react'
import toast from 'react-hot-toast'
import { createClient } from '@/utils/supabase/client'
import { fetchAllSaves, buildJson, buildBookmarksHtml, downloadFile, stamp } from '@/lib/exportSaves'

type Kind = 'json' | 'html'

const ArchiveIcon = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="4" rx="1.5" /><path d="M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8" /><path d="M10 12h4" /></svg>
const GlobeIcon = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18z" /></svg>
const DownloadIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 4v11" /><path d="M7 10l5 5 5-5" /><path d="M5 20h14" /></svg>
const Spinner = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin" aria-hidden="true"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>

const OPTIONS: { kind: Kind; title: string; hint: string; icon: ReactNode; tile: string }[] = [
  { kind: 'json', title: 'Full backup', hint: 'Saves and notes · .json', icon: <ArchiveIcon />, tile: 'bg-[#4D6A51]/10 text-[#4D6A51] dark:bg-[#8FAA91]/15 dark:text-[#8FAA91]' },
  { kind: 'html', title: 'Browser bookmarks', hint: '.html for any browser', icon: <GlobeIcon />, tile: 'bg-sky-500/10 text-sky-600 dark:bg-sky-400/15 dark:text-sky-400' },
]

// The Backup section of the profile menu. Both downloads are built entirely in the browser.
export default function ExportSaves() {
  const [busy, setBusy] = useState<Kind | null>(null)

  const run = async (kind: Kind) => {
    if (busy) return
    setBusy(kind)
    const toastId = toast.loading('Collecting your saves…')
    try {
      const supabase = createClient()
      const rows = await fetchAllSaves(supabase, (n) => toast.loading(`Collected ${n} saves…`, { id: toastId }))
      if (rows.length === 0) { toast.error('You have no saves to export yet', { id: toastId }); return }

      const fileUrl = (path: string) => supabase.storage.from('attachments').getPublicUrl(path).data.publicUrl || null

      if (kind === 'json') {
        downloadFile(`inntoit-backup-${stamp()}.json`, buildJson(rows, fileUrl), 'application/json')
      } else {
        downloadFile(`inntoit-bookmarks-${stamp()}.html`, buildBookmarksHtml(rows, fileUrl), 'text/html')
      }
      toast.success(`Saved ${rows.length} items to your downloads`, { id: toastId })
    } catch (e: any) {
      toast.error(e?.message || 'Export failed. Please try again.', { id: toastId })
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="p-5 border-b border-black/[0.04] dark:border-white/[0.04]">
      <p className="text-[10px] uppercase tracking-[0.2em] text-[#737B73] dark:text-[#8F998F] font-bold mb-3">Backup</p>
      <div className="flex flex-col gap-2">
        {OPTIONS.map(o => (
          <button
            key={o.kind}
            type="button"
            disabled={busy !== null}
            onClick={() => run(o.kind)}
            className="group w-full flex items-center gap-3 p-2.5 rounded-xl text-left border border-black/[0.05] dark:border-white/[0.06] bg-[#FBF9F4] dark:bg-[#151815] hover:bg-white dark:hover:bg-[#1E231E] hover:border-[#4D6A51]/30 dark:hover:border-[#8FAA91]/30 transition-colors disabled:opacity-60 disabled:cursor-wait"
          >
            <span className={`w-9 h-9 shrink-0 rounded-lg inline-flex items-center justify-center ${o.tile}`}>
              {busy === o.kind ? <Spinner /> : o.icon}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-[13px] font-medium text-[#171A17] dark:text-[#F3F0E9]">{busy === o.kind ? 'Preparing…' : o.title}</span>
              <span className="block text-[11px] text-[#737B73] dark:text-[#8F998F] truncate">{o.hint}</span>
            </span>
            <span className="text-[#171A17]/30 dark:text-white/30 group-hover:text-[#4D6A51] dark:group-hover:text-[#8FAA91] transition-colors">
              <DownloadIcon />
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}