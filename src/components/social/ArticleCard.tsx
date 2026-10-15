'use client'
import { ExternalLink, Clock } from 'lucide-react'
import type { Bookmark, ArticlePost } from '@/types'
import { getArticlePost } from '@/lib/postData'
import { SubstackIcon, MediumIcon } from '../BookmarkIcons'
import { SafeImg, shortDate } from './bits'

// Substack and Medium articles, each in its own site's look.

const SUBSTACK = '#FF6719'

export function articleView(b: Bookmark, platform: ArticlePost['platform']): ArticlePost {
  const snap = getArticlePost(b)
  if (snap) return snap
  const t = (b.title || '').trim()
  let publication: string | null = null
  try {
    const host = new URL(b.url).hostname.toLowerCase()
    if (platform === 'substack' && host.endsWith('.substack.com')) publication = host.replace(/\.substack\.com$/, '')
  } catch { /* not an address */ }
  return {
    v: 1, platform, title: t && !/^https?:\/\//i.test(t) ? t : (platform === 'medium' ? 'Medium article' : 'Substack post'),
    subtitle: b.description || null, author: null, publication, image: b.image_url || null, published_at: null, read_minutes: null,
  }
}

const byline = (a: ArticlePost) =>
  [a.author, shortDate(a.published_at), a.read_minutes ? `${a.read_minutes} min read` : null].filter(Boolean).join(' · ')

// ---------- dashboard cards ----------
export function ArticleCard({ bookmark, platform }: { bookmark: Bookmark; platform: ArticlePost['platform'] }) {
  const a = articleView(bookmark, platform)
  return platform === 'substack' ? <SubstackCard a={a} /> : <MediumCard a={a} />
}

function SubstackCard({ a }: { a: ArticlePost }) {
  return (
    <div className="w-full bg-white dark:bg-[#1B1B1B] rounded-xl sm:rounded-2xl flex flex-col min-w-0 shadow-none group-hover:shadow-[0_10px_30px_rgba(0,0,0,0.10)] transition-shadow duration-300 relative overflow-hidden border border-black/[0.05] dark:border-white/[0.06]">
      <div className="absolute top-0 left-0 w-full h-[3px] z-10" style={{ background: SUBSTACK }} />
      {a.image && <div className="aspect-[16/9] bg-[#F4F4F4] dark:bg-[#262626] overflow-hidden"><SafeImg src={a.image} className="w-full h-full object-cover block" /></div>}
      <div className="p-4 flex flex-col gap-2">
        <div className="flex items-center gap-1.5 min-w-0 text-[11.5px] font-semibold" style={{ color: SUBSTACK }}>
          <SubstackIcon className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{a.publication || 'Substack'}</span>
        </div>
        <h3 className="font-serif text-[17px] leading-snug font-bold text-[#1B1B1B] dark:text-[#F2F2F2] line-clamp-3 break-words">{a.title}</h3>
        {a.subtitle && <p className="text-[13px] leading-relaxed text-[#6B6B6B] dark:text-[#A3A3A3] line-clamp-2 break-words">{a.subtitle}</p>}
        {byline(a) && <p className="text-[11.5px] text-[#8A8A8A] truncate">{byline(a)}</p>}
      </div>
    </div>
  )
}

function MediumCard({ a }: { a: ArticlePost }) {
  return (
    <div className="w-full bg-white dark:bg-[#191919] rounded-xl sm:rounded-2xl p-4 flex flex-col min-w-0 gap-2.5 shadow-none group-hover:shadow-[0_10px_30px_rgba(0,0,0,0.10)] transition-shadow duration-300 relative overflow-hidden border border-black/[0.05] dark:border-white/[0.06]">
      <div className="absolute top-0 left-0 w-full h-[3px] bg-[#191919] dark:bg-[#F2F2F2]" />
      <div className="flex items-center gap-1.5 min-w-0 mt-0.5 text-[12px] text-[#242424] dark:text-[#E6E6E6]">
        <MediumIcon className="w-4 h-4 shrink-0" />
        <span className="truncate">{[a.author, a.publication && `in ${a.publication}`].filter(Boolean).join(' ') || 'Medium'}</span>
      </div>
      <div className="flex gap-3 min-w-0">
        <div className="min-w-0 flex-1 flex flex-col gap-1">
          <h3 className="text-[16px] leading-snug font-bold tracking-[-0.01em] text-[#242424] dark:text-[#F2F2F2] line-clamp-3 break-words">{a.title}</h3>
          {a.subtitle && <p className="text-[13px] leading-snug text-[#6B6B6B] dark:text-[#A8A8A8] line-clamp-2 break-words">{a.subtitle}</p>}
        </div>
        {a.image && <div className="w-[72px] h-[72px] shrink-0 rounded-md overflow-hidden bg-[#F2F2F2] dark:bg-[#2A2A2A]"><SafeImg src={a.image} className="w-full h-full object-cover" /></div>}
      </div>
      {(a.published_at || a.read_minutes) && (
        <p className="flex items-center gap-1.5 text-[11.5px] text-[#6B6B6B] dark:text-[#8A8A8A]">
          {shortDate(a.published_at)}{a.published_at && a.read_minutes ? ' · ' : ''}{a.read_minutes ? <><Clock className="w-3 h-3" />{a.read_minutes} min read</> : null}
        </p>
      )}
    </div>
  )
}

// ---------- full view in the editor ----------
export function ArticlePreview({ bookmark, platform }: { bookmark: Bookmark; platform: ArticlePost['platform'] }) {
  const a = articleView(bookmark, platform)
  const isSub = platform === 'substack'
  return (
    <div className="w-full flex bg-[#FAF9F5] dark:bg-[#0F120F] p-4 md:p-8 md:h-full md:overflow-y-auto custom-scrollbar">
      <article className="w-full max-w-[640px] m-auto bg-white dark:bg-[#1A1A1A] rounded-2xl border border-black/[0.06] dark:border-white/[0.06] shadow-sm overflow-hidden">
        <div className="h-[3px]" style={{ background: isSub ? SUBSTACK : undefined }} />
        {a.image && <div className="aspect-[16/9] bg-[#F4F4F4] dark:bg-[#262626] overflow-hidden"><SafeImg src={a.image} className="w-full h-full object-cover block" /></div>}
        <div className="p-6 md:p-8 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-[13px] font-semibold" style={{ color: isSub ? SUBSTACK : undefined }}>
            {isSub ? <SubstackIcon className="w-4 h-4" /> : <MediumIcon className="w-5 h-5 text-[#242424] dark:text-[#F2F2F2]" />}
            <span className={isSub ? '' : 'text-[#242424] dark:text-[#F2F2F2]'}>{a.publication || (isSub ? 'Substack' : 'Medium')}</span>
          </div>
          <h1 className={`${isSub ? 'font-serif' : 'tracking-[-0.02em]'} text-[26px] md:text-[32px] leading-tight font-bold text-[#1B1B1B] dark:text-[#F2F2F2] break-words`}>{a.title}</h1>
          {a.subtitle && <p className="text-[17px] leading-relaxed text-[#6B6B6B] dark:text-[#A8A8A8] break-words">{a.subtitle}</p>}
          {byline(a) && <p className="text-[13px] text-[#8A8A8A] border-t border-black/[0.06] dark:border-white/[0.06] pt-4">{byline(a)}</p>}
          <a href={bookmark.url} target="_blank" rel="noopener noreferrer"
            className={`self-start inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[14px] font-semibold transition-opacity hover:opacity-90 ${isSub ? 'text-white' : 'bg-[#191919] text-white dark:bg-[#F2F2F2] dark:text-[#191919]'}`}
            style={isSub ? { background: SUBSTACK } : undefined}>
            Read on {isSub ? 'Substack' : 'Medium'} <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </article>
    </div>
  )
}
