'use client'
import { ArrowBigUp, MessageSquareText, ExternalLink, EyeOff, Link2 } from 'lucide-react'
import type { Bookmark, RedditPost } from '@/types'
import { getRedditPost } from '@/lib/postData'
import { redditPostRef } from '@/lib/urlTools'
import { RedditIcon } from '../BookmarkIcons'
import { SafeImg, shortDate, compactNumber } from './bits'

const ORANGE = '#FF4500'

// What a Reddit card shows: the stored snapshot, or (before it arrives) what the bookmark itself has.
export function redditView(b: Bookmark): RedditPost {
  const snap = getRedditPost(b)
  if (snap) return snap
  const ref = redditPostRef(b.url)
  const t = (b.title || '').trim()
  const autoTitle = !t || /^https?:\/\//i.test(t) || /^(\(\d+\)\s*)?reddit\b/i.test(t)
  return {
    v: 1, platform: 'reddit', id: ref?.id || '', subreddit: ref?.sub || '', subreddit_icon: null, author: null,
    title: autoTitle ? 'Reddit post' : t, body: b.description || null, image: b.image_url || null, link: null,
    kind: 'other', nsfw: false, score: null, created_at: null,
  }
}

function SubredditBadge({ p, size = 20 }: { p: RedditPost; size?: number }) {
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center rounded-full overflow-hidden text-white" style={{ width: size, height: size, background: ORANGE }}>
      <RedditIcon className="w-[70%] h-[70%]" />
      {p.subreddit_icon && <SafeImg src={p.subreddit_icon} className="absolute inset-0 w-full h-full object-cover bg-white" />}
    </span>
  )
}

const domainOf = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, '') } catch { return '' } }

// ---------- dashboard card ----------
export function RedditCard({ bookmark }: { bookmark: Bookmark }) {
  const p = redditView(bookmark)
  return (
    <div className="w-full bg-white dark:bg-[#1A1A1B] rounded-xl sm:rounded-2xl p-4 flex flex-col min-w-0 gap-2.5 shadow-none group-hover:shadow-[0_10px_30px_rgba(0,0,0,0.10)] transition-shadow duration-300 relative overflow-hidden border border-black/[0.04] dark:border-white/[0.05]">
      <div className="absolute top-0 left-0 w-full h-[3px]" style={{ background: ORANGE }} />
      <div className="flex items-center gap-2 min-w-0 mt-0.5">
        <SubredditBadge p={p} />
        {p.subreddit && <span className="text-[12px] font-semibold text-[#1A1A1B] dark:text-[#D7DADC] truncate">r/{p.subreddit}</span>}
        {p.created_at && <span className="text-[11px] text-[#787C7E] shrink-0">· {shortDate(p.created_at)}</span>}
        <RedditIcon className="ml-auto w-4 h-4 shrink-0" />
      </div>
      <h3 className="text-[15px] leading-snug font-semibold text-[#1A1A1B] dark:text-[#D7DADC] line-clamp-3 break-words">{p.title}</h3>
      {p.nsfw ? (
        <div className="flex items-center gap-2 rounded-lg bg-[#F6F7F8] dark:bg-[#272729] px-3 py-2.5 text-[12px] text-[#787C7E]"><EyeOff className="w-4 h-4" />NSFW · picture hidden</div>
      ) : p.image ? (
        <div className="rounded-lg overflow-hidden bg-[#F6F7F8] dark:bg-[#272729]"><SafeImg src={p.image} className="w-full h-auto max-h-64 object-cover block" /></div>
      ) : p.body ? (
        <p className="text-[13px] leading-relaxed text-[#4A4D50] dark:text-[#A8AAAB] line-clamp-4 whitespace-pre-line break-words">{p.body}</p>
      ) : null}
      {p.link && !p.nsfw && (
        <span className="inline-flex items-center gap-1.5 self-start max-w-full rounded-full bg-[#F6F7F8] dark:bg-[#272729] px-2.5 py-1 text-[11px] text-[#0079D3] dark:text-[#4FBCFF]"><Link2 className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{domainOf(p.link)}</span></span>
      )}
      {(p.score != null || p.author) && (
        <div className="flex items-center gap-3 text-[11.5px] text-[#787C7E] min-w-0">
          {p.score != null && <span className="inline-flex items-center gap-0.5 font-semibold"><ArrowBigUp className="w-4 h-4" />{compactNumber(p.score)}</span>}
          {p.author && <span className="truncate">u/{p.author}</span>}
        </div>
      )}
    </div>
  )
}

// ---------- full view in the editor ----------
export function RedditPreview({ bookmark }: { bookmark: Bookmark }) {
  const p = redditView(bookmark)
  return (
    <div className="w-full flex bg-[#F4F5F6] dark:bg-[#0B0B0C] p-4 md:p-8 md:h-full md:overflow-y-auto custom-scrollbar">
      <article className="w-full max-w-[620px] m-auto bg-white dark:bg-[#1A1A1B] rounded-2xl border border-black/[0.06] dark:border-white/[0.06] shadow-sm overflow-hidden">
        <div className="h-[3px]" style={{ background: ORANGE }} />
        <div className="p-5 md:p-6 flex flex-col gap-4">
          <header className="flex items-center gap-2.5 min-w-0">
            <SubredditBadge p={p} size={32} />
            <div className="min-w-0">
              {p.subreddit && <div className="text-[13px] font-semibold text-[#1A1A1B] dark:text-[#D7DADC] truncate">r/{p.subreddit}</div>}
              <div className="text-[12px] text-[#787C7E] truncate">{[p.author && `u/${p.author}`, shortDate(p.created_at)].filter(Boolean).join(' · ')}</div>
            </div>
            <RedditIcon className="ml-auto w-5 h-5 shrink-0" />
          </header>
          <h1 className="text-[20px] md:text-[22px] leading-tight font-bold text-[#1A1A1B] dark:text-[#D7DADC] break-words">{p.title}</h1>
          {p.body && <p className="text-[15px] leading-relaxed text-[#1A1A1B] dark:text-[#D7DADC] whitespace-pre-line break-words">{p.body}</p>}
          {p.nsfw ? (
            <div className="flex items-center gap-2 rounded-xl bg-[#F6F7F8] dark:bg-[#272729] px-4 py-3 text-[13px] text-[#787C7E]"><EyeOff className="w-4 h-4" />Marked NSFW: the picture is not shown here.</div>
          ) : p.image ? (
            <div className="rounded-xl overflow-hidden bg-[#F6F7F8] dark:bg-[#272729]"><SafeImg src={p.image} className="w-full h-auto max-h-[70vh] object-contain block" /></div>
          ) : null}
          {p.link && (
            <a href={p.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-xl border border-black/[0.08] dark:border-white/[0.08] px-3.5 py-2.5 text-[13px] text-[#0079D3] dark:text-[#4FBCFF] hover:bg-[#F6F7F8] dark:hover:bg-[#272729] transition-colors min-w-0">
              <Link2 className="w-4 h-4 shrink-0" /><span className="truncate">{p.link}</span>
            </a>
          )}
          <footer className="flex items-center gap-4 pt-1 text-[13px] text-[#787C7E]">
            {p.score != null && <span className="inline-flex items-center gap-1 font-semibold"><ArrowBigUp className="w-5 h-5" />{compactNumber(p.score)}</span>}
            <span className="inline-flex items-center gap-1"><MessageSquareText className="w-4 h-4" />Comments on Reddit</span>
            <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="ml-auto inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold text-white transition-opacity hover:opacity-90" style={{ background: ORANGE }}>
              View on Reddit <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </footer>
        </div>
      </article>
    </div>
  )
}
