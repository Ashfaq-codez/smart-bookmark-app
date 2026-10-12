// Database steps for deleting a folder. A folder is just the `category` / `sub_category` text on each bookmark,
// so "deleting" one means moving its bookmarks to "Uncategorized". Nothing here ever deletes a bookmark row.

// The "no folder" home. Dragging a card onto "All" already files it here.
export const UNFILED = 'Uncategorized'

export type FolderItem = { id: number; sub_category: string | null }

const CHUNK = 200      // how many bookmarks one update touches
const PAGE = 1000      // how many rows one read returns

// Reads which bookmarks are in a folder (and which subfolder each is in) so Undo can put them back exactly.
export async function fetchFolderItems(supabase: any, category: string): Promise<{ ok: boolean; items: FolderItem[] }> {
  const items: FolderItem[] = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('id, sub_category')
      .eq('category', category)
      .order('id', { ascending: true })
      .range(from, from + PAGE - 1)
    if (error || !data) return { ok: false, items: [] }
    items.push(...(data as FolderItem[]))
    if (data.length < PAGE) break
  }
  return { ok: true, items }
}

// Moves bookmarks out of their folder: category becomes "Uncategorized" and the subfolder is cleared.
export async function moveItemsToUnfiled(supabase: any, items: FolderItem[]): Promise<boolean> {
  for (let i = 0; i < items.length; i += CHUNK) {
    const ids = items.slice(i, i + CHUNK).map(it => it.id)
    const { error } = await supabase.from('bookmarks').update({ category: UNFILED, sub_category: null }).in('id', ids)
    if (error) return false
  }
  return true
}

// Undo: puts every bookmark back into its folder and its own subfolder.
export async function restoreItems(supabase: any, category: string, items: FolderItem[]): Promise<boolean> {
  const bySub = new Map<string | null, number[]>()
  for (const it of items) {
    const key = it.sub_category ?? null
    bySub.set(key, [...(bySub.get(key) || []), it.id])
  }
  for (const [sub, ids] of bySub) {
    for (let i = 0; i < ids.length; i += CHUNK) {
      const { error } = await supabase.from('bookmarks').update({ category, sub_category: sub }).in('id', ids.slice(i, i + CHUNK))
      if (error) return false
    }
  }
  return true
}
