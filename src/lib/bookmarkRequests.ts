// The two calls the list makes to /api/bookmarks/[id]. Kept apart from the React hook so they can be tested on their own.

export type DeleteResult = 'deleted' | 'gone' | 'failed'

// 404 means the save no longer exists (e.g. it was deleted in another tab), which is what we wanted anyway.
export async function requestDelete(id: number, doFetch: typeof fetch = fetch): Promise<DeleteResult> {
  try {
    const res = await doFetch(`/api/bookmarks/${id}`, { method: 'DELETE' })
    if (res.ok) return 'deleted'
    return res.status === 404 ? 'gone' : 'failed'
  } catch {
    return 'failed'
  }
}

export type ContentResult = { ok: true; content: string | null } | { ok: false; tooLong: boolean }

// Sends the note body to the server, which cleans the HTML. `content` is what the server really stored.
export async function requestContentUpdate(id: number, content: string | null, doFetch: typeof fetch = fetch): Promise<ContentResult> {
  try {
    const res = await doFetch(`/api/bookmarks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: content ?? '' }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || typeof data.content !== 'string') return { ok: false, tooLong: res.status === 413 }
    return { ok: true, content: data.content || null }
  } catch {
    return { ok: false, tooLong: false }
  }
}

export type UploadResult = 'saved' | 'limited' | 'failed'

// Step 2 of a file upload: the file is already in storage, now ask the server to create its bookmark (it checks the save limit).
export async function requestUploadBookmark(
  file: { path: string; type: string; title: string },
  doFetch: typeof fetch = fetch,
): Promise<UploadResult> {
  try {
    const res = await doFetch('/api/bookmarks/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_path: file.path, file_type: file.type, title: file.title }),
    })
    if (res.ok) return 'saved'
    return res.status === 429 ? 'limited' : 'failed'
  } catch {
    return 'failed'
  }
}
