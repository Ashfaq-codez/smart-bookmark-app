import type { Bookmark, XPost, InstagramPost, YouTubePost } from '@/types';

// bookmarks.post_data holds an X, Instagram or YouTube snapshot. Every reader goes through these,
// so one platform's snapshot is never read as another's.

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

export function getYouTubePost(b: Pick<Bookmark, 'post_data'> | null | undefined): YouTubePost | null {
  const d = b?.post_data as Record<string, unknown> | null | undefined;
  return d && typeof d === 'object' && d.platform === 'youtube' && typeof d.title === 'string' ? (d as unknown as YouTubePost) : null;
}
