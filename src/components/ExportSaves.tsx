// src/components/ExportSaves.tsx
'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { createClient } from '@/utils/supabase/client'
import { fetchAllSaves, buildJson, buildBookmarksHtml, downloadFile, stamp } from '@/lib/exportSaves'

type Kind = 'json' | 'html'

// Two small buttons for the profile menu. Both work entirely in the browser.
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

  const btn =
    'w-full text-left px-3 py-2 rounded-lg text-sm text-[#171A17] dark:text-[#F3F0E9] hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50'

  return (
    <div className="px-1 py-1">
      <p className="px-3 pb-1 text-[10px] uppercase tracking-wider text-[#A0A6A0]">Backup</p>
      <button type="button" className={btn} disabled={busy !== null} onClick={() => run('json')}>
        {busy === 'json' ? 'Preparing…' : 'Download everything (.json)'}
      </button>
      <button type="button" className={btn} disabled={busy !== null} onClick={() => run('html')}>
        {busy === 'html' ? 'Preparing…' : 'Download links for my browser (.html)'}
      </button>
    </div>
  )
}
