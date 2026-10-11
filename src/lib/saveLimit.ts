// The save limit shared by every way of adding a bookmark (/api/save and file uploads).
// It is counted from the bookmarks table itself, so it needs no extra service.

// Most saves one person may make per minute.
export const MAX_SAVES_PER_MINUTE = 60;

// True when this person has already made the maximum in the last minute.
// If the count itself fails we let the save through rather than block a real user.
export async function isOverSaveLimit(supabase: any, userId: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('bookmarks')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', new Date(Date.now() - 60_000).toISOString());
  return !error && (count ?? 0) >= MAX_SAVES_PER_MINUTE;
}
