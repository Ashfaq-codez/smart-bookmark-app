'use client'
import { Heart, Repeat2, MessageCircle, ExternalLink } from 'lucide-react'
import type { Bookmark, SubstackNotePost } from '@/types'
import { getSubstackNotePost } from '@/lib/postData'
import { SubstackIcon } from '../BookmarkIcons'
import { SafeImg, shortDate, compactNumber } from './bits'

// A Substack Note: a short post, shown like one (author, text, pictures, likes / restacks / replies).

const SUBSTACK = '#FF6719'

export function noteView(b: Bookmark): SubstackNotePost {
  const snap = getSubstackNotePost(b)
  if (snap) return snap
  // Before the note is read: Substack's page title is "Name (@handle)", its description the text.
  const m = (b.title || '').match(/^(.{1,100}) \(@([A-Za-z0-9_.-]{1,60})\)$/)
  const handle = m?.[2] || b.url.match(/substack\.com\/@([A-Za-z0-9_.-]{1,60})\//)?.[1] || null
  return {
    v: 1, platform: 'substack-note', id: '', author: { name: m?.[1] || handle || 'Substack', handle, avatar: null },
    text: b.description || '', images: b.image_url ? [{ url: b.image_url, width: 4, height: 3 }] : [],
    created_at: null, likes: null, restacks: null, replies: null,
  }
}

function Avatar({ p, size }: { p: SubstackNotePost; size: number }) {
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center rounded-full overflow-hidden text-white font-semibold" style={{ width: size, height: size, background: SUBSTACK, fontSize: size * 0.42 }}>
      {(p.author.name || '?').slice(0, 1).toUpperCase()}
      {p.author.avatar && <SafeImg src={p.author.avatar} className="absolute inset-0 w-full h-full object-cover" />}
    </span>
  )
}

function Header({ p, size }: { p: SubstackNotePost; size: number }) {
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <Avatar p={p} size={size} />
      <div className="min-w-0 leading-tight">
        <div className="text-[13.5px] font-semibold text-[#1B1B1B] dark:text-[#F2F2F2] truncate">{p.author.name}</div>
        <div className="text-[11.5px] text-[#8A8A8A] truncate">{[p.author.handle && `@${p.author.handle}`, shortDate(p.created_at)].filter(Boolean).join(' · ')}</div>
      </div>
      <SubstackIcon className="ml-auto w-4 h-4 shrink-0 text-[#FF6719]" />
    </div>
  )
}

function Counts({ p, big = false }: { p: SubstackNotePost; big?: boolean }) {
  const items: [typeof Heart, number | null, string][] = [[Heart, p.likes, 'likes'], [Repeat2, p.restacks, 'restacks'], [MessageCircle, p.replies, 'replies']]
  const shown = items.filter(([, n]) => n != null)
  if (!shown.length) return null
  return (
    <div className={`flex items-center gap-4 text-[#8A8A8A] ${big ? 'text-[13px]' : 'text-[11.5px]'}`}>
      {shown.map(([Icon, n, label]) => (
        <span key={label} className="inline-flex items-center gap-1" aria-label={`${n} ${label}`}><Icon className={big ? 'w-4 h-4' : 'w-3.5 h-3.5'} />{compactNumber(n)}</span>
      ))}
    </div>
  )
}

// ---------- dashboard card ----------
export function SubstackNoteCard({ bookmark }: { bookmark: Bookmark }) {
  const p = noteView(bookmark)
  const img = p.images[0]
  return (
    <div className="w-full bg-white dark:bg-[#1B1B1B] rounded-xl sm:rounded-2xl p-4 flex flex-col min-w-0 gap-3 shadow-none group-hover:shadow-[0_10px_30px_rgba(0,0,0,0.10)] transition-shadow duration-300 relative overflow-hidden border border-black/[0.05] dark:border-white/[0.06]">
      <div className="absolute top-0 left-0 w-full h-[3px]" style={{ background: SUBSTACK }} />
      <div className="mt-0.5"><Header p={p} size={32} /></div>
      {p.text && <p className="text-[14px] leading-relaxed text-[#1B1B1B] dark:text-[#E6E6E6] whitespace-pre-line break-words line-clamp-6">{p.text}</p>}
      {img && (
        // The picture's own shape is reserved, so the grid doesn't jump while it loads (very tall ones are capped).
        <div className="rounded-xl overflow-hidden bg-[#F4F4F4] dark:bg-[#262626]" style={{ aspectRatio: `${img.width} / ${Math.min(img.height, img.width * 1.25)}` }}>
          <SafeImg src={img.url} className="w-full h-full object-cover block" />
        </div>
      )}
      <Counts p={p} />
    </div>
  )
}

// ---------- full view in the editor ----------
export function SubstackNotePreview({ bookmark }: { bookmark: Bookmark }) {
  const p = noteView(bookmark)
  return (
    <div className="w-full flex bg-[#FAF9F5] dark:bg-[#0F120F] p-4 md:p-8 md:h-full md:overflow-y-auto custom-scrollbar">
      <article className="w-full max-w-[560px] m-auto bg-white dark:bg-[#1A1A1A] rounded-2xl border border-black/[0.06] dark:border-white/[0.06] shadow-sm overflow-hidden">
        <div className="h-[3px]" style={{ background: SUBSTACK }} />
        <div className="p-5 md:p-6 flex flex-col gap-4">
          <Header p={p} size={42} />
          {p.text && <p className="text-[16px] leading-relaxed text-[#1B1B1B] dark:text-[#E6E6E6] whitespace-pre-line break-words">{p.text}</p>}
          {p.images.length > 0 && (
            <div className={`grid gap-1.5 rounded-xl overflow-hidden ${p.images.length > 1 ? 'grid-cols-2' : ''}`}>
              {p.images.map((im) => (
                <div key={im.url} className="bg-[#F4F4F4] dark:bg-[#262626]" style={{ aspectRatio: p.images.length > 1 ? '1 / 1' : `${im.width} / ${im.height}` }}>
                  <SafeImg src={im.url} className="w-full h-full object-cover block" />
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-3 pt-1 border-t border-black/[0.06] dark:border-white/[0.06]">
            <div className="pt-3"><Counts p={p} big /></div>
            <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="ml-auto mt-3 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold text-white transition-opacity hover:opacity-90" style={{ background: SUBSTACK }}>
              View on Substack <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </article>
    </div>
  )
}
