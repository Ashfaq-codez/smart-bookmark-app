// src/lib/bookmarkQuery.ts
// Plain TypeScript (no React) so both the server page and the client hook can import it.
import type { Bookmark } from '@/types'

export const PAGE_SIZE = 60

// Everything a card needs, WITHOUT the full note body (content_preview is a trimmed copy made by the database).
export const LIST_COLUMNS =
  'id,created_at,updated_at,title,url,user_id,category,sub_category,description,image_url,tags,type,file_path,file_type,content_preview'

export type SortOrder = 'desc' | 'asc'

export type ListQuery = {
  category: string            // 'All' or a folder name
  sub: string | null
  mediaType: string | null    // key of MEDIA_TYPE_MATCHERS
  search: string
  sort: SortOrder
}

export type BookmarkStats = {
  total: number
  folders: { category: string; sub_category: string | null; n: number }[]
  types: { type: string; n: number }[]
}

export const EMPTY_STATS: BookmarkStats = { total: 0, folders: [], types: [] }

export const DEFAULT_QUERY: ListQuery = { category: 'All', sub: null, mediaType: null, search: '', sort: 'desc' }

// One source of truth for media types. To add a category: add its label in BookmarkList and its raw types here.
export const MEDIA_TYPE_MATCHERS: Record<string, string[]> = {
  link: ['link'], note: ['note'], image: ['image'],
  videos: ['video', 'youtube'], documents: ['pdf', 'file'],
  socials: ['twitter', 'instagram', 'pinterest', 'linkedin', 'github'],
}

export const escapeLike = (s: string) => s.replace(/[\\%_]/g, (m) => '\\' + m)

// Builds the paged, filtered list request. `client` is a supabase-js client.
// cursor = the last card currently on screen; the next page starts right after it (keyset paging).
export function buildListQuery(client: any, q: ListQuery, cursor: { created_at: string; id: number } | null, limit: number) {
  let req = client.from('bookmarks').select(LIST_COLUMNS)

  if (q.category !== 'All') {
    req = q.category === 'Uncategorized'
      ? req.or('category.eq.Uncategorized,category.is.null')
      : req.eq('category', q.category)
    if (q.sub) req = req.eq('sub_category', q.sub)
  }

  if (q.mediaType) {
    const types = MEDIA_TYPE_MATCHERS[q.mediaType] || [q.mediaType]
    req = types.includes('link')
      ? req.or(`type.in.(${types.join(',')}),type.is.null`)
      : req.in('type', types)
  }

  const s = q.search.trim().toLowerCase()
  if (s) req = req.ilike('search_text', `%${escapeLike(s)}%`)

  const asc = q.sort === 'asc'
  if (cursor) {
    const op = asc ? 'gt' : 'lt'
    req = req.or(
      `created_at.${op}."${cursor.created_at}",and(created_at.eq."${cursor.created_at}",id.${op}.${cursor.id})`
    )
  }

  return req.order('created_at', { ascending: asc }).order('id', { ascending: asc }).limit(limit)
}

// Same rules as buildListQuery, for rows that arrive live (Realtime) so we know whether they belong in the current view.
export function rowMatchesQuery(b: Partial<Bookmark> & { search_text?: string | null }, q: ListQuery): boolean {
  if (q.category !== 'All') {
    if ((b.category || 'Uncategorized') !== q.category) return false
    if (q.sub && b.sub_category !== q.sub) return false
  }
  if (q.mediaType) {
    const types = MEDIA_TYPE_MATCHERS[q.mediaType] || [q.mediaType]
    if (!types.includes(b.type || 'link')) return false
  }
  const s = q.search.trim().toLowerCase()
  if (s && typeof b.search_text === 'string' && !b.search_text.includes(s)) return false
  return true
}   