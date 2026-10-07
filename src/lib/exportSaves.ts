// src/lib/exportSaves.ts
// Builds a backup of ALL of a user's saves, in the browser. No server, no extra cost.
// The functions that build the files are pure (easy to test); only downloadFile touches the page.

export type ExportRow = {
  id: number
  created_at: string
  updated_at?: string | null
  title: string
  url: string
  category?: string | null
  sub_category?: string | null
  description?: string | null
  content?: string | null
  image_url?: string | null
  tags?: string[] | null
  type?: string | null
  file_path?: string | null
  file_type?: string | null
  [key: string]: unknown
}

const BATCH = 500
const INTERNAL_URL = 'https://smart-bookmark.internal/'

// Reads every save in batches of 500 (keyset paging on id, so nothing is skipped or repeated).
export async function fetchAllSaves(
  client: any,
  onProgress?: (loaded: number) => void
): Promise<ExportRow[]> {
  const all: ExportRow[] = []
  let lastId = 0
  for (;;) {
    const { data, error } = await client
      .from('bookmarks')
      .select('*')
      .gt('id', lastId)
      .order('id', { ascending: true })
      .limit(BATCH)
    if (error) throw new Error(error.message || 'Could not read your saves')
    if (!data || data.length === 0) break
    all.push(...(data as ExportRow[]))
    lastId = data[data.length - 1].id
    onProgress?.(all.length)
    if (data.length < BATCH) break
  }
  return all
}

// Complete copy: everything, including full notes, tags and a public link for uploaded files.
export function buildJson(rows: ExportRow[], fileUrl: (path: string) => string | null, now = new Date()): string {
  const bookmarks = rows.map((r) => {
    const { search_text, content_preview, ...rest } = r as any
    return { ...rest, file_url: r.file_path ? fileUrl(r.file_path) : null }
  })
  return JSON.stringify(
    { app: 'inntoit', format_version: 1, exported_at: now.toISOString(), count: bookmarks.length, bookmarks },
    null,
    2
  )
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const seconds = (iso: string) => {
  const t = Math.floor(new Date(iso).getTime() / 1000)
  return Number.isFinite(t) ? t : 0
}

// Standard "Netscape bookmarks" file: Chrome, Brave, Edge, Firefox and Safari can all import it.
// Only saves with a real web address are included (notes and files have no address a browser can open).
export function buildBookmarksHtml(rows: ExportRow[], fileUrl: (path: string) => string | null): string {
  type Item = { title: string; url: string; added: number }
  const folders = new Map<string, Map<string, Item[]>>() // category -> sub-category -> items

  for (const r of rows) {
    let url = r.url
    if (r.file_path) url = fileUrl(r.file_path) || ''
    if (!url || url.startsWith(INTERNAL_URL) || !/^https?:\/\//i.test(url)) continue
    const cat = r.category || 'Uncategorized'
    const sub = r.sub_category || ''
    if (!folders.has(cat)) folders.set(cat, new Map())
    const subs = folders.get(cat)!
    if (!subs.has(sub)) subs.set(sub, [])
    subs.get(sub)!.push({ title: r.title || url, url, added: seconds(r.created_at) })
  }

  const link = (i: Item, pad: string) => `${pad}<DT><A HREF="${esc(i.url)}" ADD_DATE="${i.added}">${esc(i.title)}</A>`
  const lines: string[] = [
    '<!DOCTYPE NETSCAPE-Bookmark-file-1>',
    '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">',
    '<TITLE>Bookmarks</TITLE>',
    '<H1>Bookmarks</H1>',
    '<DL><p>',
    '    <DT><H3>inntoit</H3>',
    '    <DL><p>',
  ]
  for (const [cat, subs] of folders) {
    lines.push(`        <DT><H3>${esc(cat)}</H3>`, '        <DL><p>')
    for (const [sub, items] of subs) {
      if (sub) {
        lines.push(`            <DT><H3>${esc(sub)}</H3>`, '            <DL><p>')
        items.forEach((i) => lines.push(link(i, '                ')))
        lines.push('            </DL><p>')
      } else {
        items.forEach((i) => lines.push(link(i, '            ')))
      }
    }
    lines.push('        </DL><p>')
  }
  lines.push('    </DL><p>', '</DL><p>')
  return lines.join('\n')
}

export function downloadFile(filename: string, text: string, mime: string) {
  const url = URL.createObjectURL(new Blob([text], { type: mime }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

export const stamp = (d = new Date()) => d.toISOString().slice(0, 10)
