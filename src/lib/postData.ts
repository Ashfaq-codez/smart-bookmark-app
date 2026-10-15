import type { Bookmark, XPost, InstagramPost } from '@/types';

// bookmarks.post_data holds an X OR an Instagram snapshot. Every reader goes through these two,
// so an X snapshot is never read as Instagram data or the other way round.

// X snapshots stored before Instagram ones existed have no `platform`; they are recognised by their author.
export function getXPost(b: Pick<Bookmark, 'post_data'> | null | undefined): XPost | null {
  const d = b?.post_data as Record<string, unknown> | null | undefined;
  if (!d || typeof d !== 'object') return null;
  if (d.platform === 'x') return d as unknown as XPost;
  if (d.platform === undefined && d.author && typeof d.id === 'string') return d as unknown as XPost;
  return null;
}

export function getInstagramPost(b: Pick<Bookmark, 'post_data'> | null | undefined): InstagramPost | null {
  const d = b?.post_data as Record<string, unknown> | null | undefined;
  return d && typeof d === 'object' && d.platform === 'instagram' && typeof d.handle === 'string' ? (d as unknown as InstagramPost) : null;
}
