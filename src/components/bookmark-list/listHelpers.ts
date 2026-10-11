import { Bookmark } from '@/types'
import { deriveDisplayType } from '@/utils/bookmarkHelpers'

export const mediaTypeLabels: Record<string, string> = {
  'link': 'Links',
  'note': 'Notes',
  'image': 'Images',
  'videos': 'Videos',
  'documents': 'Documents',
  'socials': 'Socials'
};

export function formatDateHeader(dateString?: string): string {
  if (!dateString) return 'Unknown Date';
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

// --- Masonry: place each card in the currently shortest column (cards keep their newest-first order) ---
// Real heights aren't known before images load, so each card gets a height estimate relative to column width (=100).
const estimateCardHeight = (b: Bookmark): number => {
    if (b.url === 'https://inntoit.app/welcome') return 95
  const t = deriveDisplayType(b) as string | null | undefined
  const textLen = (b.content || '').replace(/<[^>]*>?/gm, '').trim().length
  switch (t) {
    case 'note': return Math.min(160, 40 + textLen * 0.22)
    case 'twitter': return 60 + Math.min(70, ((b.description || b.content || '').length) * 0.25) + (b.image_url ? 55 : 0)
    case 'instagram':
    case 'tiktok': return 125
    case 'youtube': return (b.url || '').toLowerCase().includes('/shorts/') ? 125 : 56
    case 'pinterest': return 150
    case 'pdf': return 133
    case 'google': return 56
    case 'video': return 56
    case 'image': return 90
    default: return (b.image_url ? 62 : 56)
  }
}

export const distributeIntoColumns = (items: Bookmark[], count: number): Bookmark[][] => {
  const cols: Bookmark[][] = Array.from({ length: count }, () => [])
  const heights: number[] = Array.from({ length: count }, () => 0)
  items.forEach((b) => {
    let target = 0
    for (let i = 1; i < count; i++) if (heights[i] < heights[target] - 0.5) target = i
    cols[target].push(b)
    heights[target] += estimateCardHeight(b) + 6
  })
  return cols
}
