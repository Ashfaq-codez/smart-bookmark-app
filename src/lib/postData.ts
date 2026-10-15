import { hostIs } from '@/lib/urlTools';
import type { Bookmark, XPost, InstagramPost, YouTubePost, RedditPost, ArticlePost } from '@/types';

// bookmarks.post_data holds one platform's snapshot (X, Instagram, YouTube, Reddit, Substack, Medium). Every reader goes through these,
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

export function getRedditPost(b: Pick<Bookmark, 'post_data'> | null | undefined): RedditPost | null {
  const d = b?.post_data as Record<string, unknown> | null | undefined;
  return d && typeof d === 'object' && d.platform === 'reddit' && typeof d.title === 'string' ? (d as unknown as RedditPost) : null;
}

export function getArticlePost(b: Pick<Bookmark, 'post_data'> | null | undefined): ArticlePost | null {
  const d = b?.post_data as Record<string, unknown> | null | undefined;
  return d && typeof d === 'object' && (d.platform === 'substack' || d.platform === 'medium') && typeof d.title === 'string'
    ? (d as unknown as ArticlePost) : null;
}

// substack / medium from the stored snapshot, or from the address before the snapshot arrives.
export function articlePlatformOf(b: Pick<Bookmark, 'post_data' | 'url'>): ArticlePost['platform'] | null {
  const snap = getArticlePost(b)
  if (snap) return snap.platform
  try {
    const host = new URL(b.url).hostname.toLowerCase()
    if (hostIs(host, 'medium.com')) return 'medium'
    if (hostIs(host, 'substack.com')) return 'substack'
  } catch { /* not an address */ }
  return null
}
