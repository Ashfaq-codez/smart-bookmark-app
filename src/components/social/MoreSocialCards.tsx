'use client'
import { ArrowUp, MessageSquare, ExternalLink, Heart, MessageCircle, Repeat2, ThumbsUp, Play, Music2, Clock, BadgeCheck } from 'lucide-react'
import type { Bookmark, HackerNewsPost, SpotifyPost, ThreadsPost, LinkedInPost } from '@/types'
import { getHackerNewsPost, getSpotifyPost, getThreadsPost, getLinkedInPost } from '@/lib/postData'
import { hackerNewsItemId, spotifyRef, threadsPostRef } from '@/lib/urlTools'
import { HackerNewsIcon, SpotifyIcon, ThreadsIcon, LinkedInIcon } from '../BookmarkIcons'
import { SafeImg, shortDate, compactNumber } from './bits'

// Hacker News, Spotify, Threads and LinkedIn: a dashboard card and a full view each, in the site's own look.

const CARD = 'w-full rounded-xl sm:rounded-2xl flex flex-col min-w-0 shadow-none group-hover:shadow-[0_10px_30px_rgba(0,0,0,0.10)] transition-shadow duration-300 relative overflow-hidden border'
const PANE = 'w-full flex bg-[#FAF9F5] dark:bg-[#0F120F] p-4 md:p-8 md:h-full md:overflow-y-auto custom-scrollbar'
const ARTICLE = 'w-full m-auto rounded-2xl border shadow-sm overflow-hidden'
const autoTitle = (t: string | null | undefined, url: string) => { const v = (t || '').trim(); return !v || v === url || /^https?:\/\//i.test(v) }
const domainOf = (u: string | null) => { try { return u ? new URL(u).hostname.replace(/^www\./, '') : '' } catch { return '' } }

function Initial({ name, avatar, size, color }: { name: string; avatar: string | null; size: number; color: string }) {
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center rounded-full overflow-hidden text-white font-semibold" style={{ width: size, height: size, background: color, fontSize: size * 0.42 }}>
      {(name || '?').replace(/^@/, '').slice(0, 1).toUpperCase()}
      {avatar && <SafeImg src={avatar} className="absolute inset-0 w-full h-full object-cover" />}
    </span>
  )
}

function OpenButton({ href, label, color, dark = false }: { href: string; label: string; color: string; dark?: boolean }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold transition-opacity hover:opacity-90 ${dark ? 'text-black' : 'text-white'}`} style={{ background: color }}>
      {label} <ExternalLink className="w-3.5 h-3.5" />
    </a>
  )
}

// ============================== Hacker News ==============================
const HN = '#FF6600'

export function hnView(b: Bookmark): HackerNewsPost {
  return getHackerNewsPost(b) || {
    v: 1, platform: 'hackernews', id: hackerNewsItemId(b.url) || '', kind: 'story',
    title: autoTitle(b.title, b.url) ? 'Hacker News' : b.title, link: null, text: b.description || null,
    author: null, points: null, comments: null, created_at: null,
  }
}

function HnMeta({ p, size = 'sm' }: { p: HackerNewsPost; size?: 'sm' | 'md' }) {
  const parts = [
    p.points != null ? `${compactNumber(p.points)} points` : null,
    p.author ? `by ${p.author}` : null,
    shortDate(p.created_at) || null,
  ].filter(Boolean)
  return (
    <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-[#828282] ${size === 'md' ? 'text-[13px]' : 'text-[11.5px]'}`}>
      {p.points != null && <ArrowUp className="w-3.5 h-3.5 -mr-1" />}
      <span>{parts.join(' · ')}</span>
      {p.comments != null && <span className="inline-flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" />{compactNumber(p.comments)}</span>}
    </div>
  )
}

export function HackerNewsCard({ bookmark }: { bookmark: Bookmark }) {
  const p = hnView(bookmark)
  return (
    <div className={`${CARD} bg-[#F6F6EF] dark:bg-[#1D1F21] p-4 gap-2.5 border-black/[0.05] dark:border-white/[0.06]`}>
      <div className="absolute top-0 left-0 w-full h-[3px]" style={{ background: HN }} />
      <div className="flex items-center gap-2 mt-0.5 text-[12px] font-semibold text-[#1D1F21] dark:text-[#E6E6E6]">
        <HackerNewsIcon className="w-4 h-4 text-[#FF6600]" />Hacker News
        {p.kind !== 'story' && <span className="ml-auto rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wide bg-[#FF6600]/10 text-[#FF6600]">{p.kind === 'ask' ? 'Ask HN' : p.kind === 'show' ? 'Show HN' : p.kind}</span>}
      </div>
      <h3 className="text-[15px] leading-snug font-semibold text-[#1D1F21] dark:text-[#F2F2F2] line-clamp-3 break-words">
        {p.title}{p.link && <span className="font-normal text-[12px] text-[#828282]"> ({domainOf(p.link)})</span>}
      </h3>
      {p.text && <p className="text-[13px] leading-relaxed text-[#4A4A4A] dark:text-[#B3B3B3] line-clamp-4 whitespace-pre-line break-words">{p.text}</p>}
      <HnMeta p={p} />
    </div>
  )
}

export function HackerNewsPreview({ bookmark }: { bookmark: Bookmark }) {
  const p = hnView(bookmark)
  return (
    <div className={PANE}>
      <article className={`${ARTICLE} max-w-[640px] bg-[#F6F6EF] dark:bg-[#1D1F21] border-black/[0.06] dark:border-white/[0.06]`}>
        <div className="flex items-center gap-2 px-5 py-2.5 text-[13px] font-bold text-black" style={{ background: HN }}>
          <HackerNewsIcon className="w-5 h-5 text-white" />Hacker News
        </div>
        <div className="p-5 md:p-6 flex flex-col gap-4">
          <h1 className="text-[20px] md:text-[22px] leading-tight font-bold text-[#1D1F21] dark:text-[#F2F2F2] break-words">{p.title}</h1>
          {p.link && <a href={p.link} target="_blank" rel="noopener noreferrer" className="text-[13px] text-[#828282] hover:underline break-all">{domainOf(p.link)}</a>}
          <HnMeta p={p} size="md" />
          {p.text && <p className="text-[15px] leading-relaxed text-[#1D1F21] dark:text-[#DCDCDC] whitespace-pre-line break-words">{p.text}</p>}
          <div className="flex flex-wrap gap-2 pt-1">
            {p.link && <OpenButton href={p.link} label="Open article" color="#1D1F21" />}
            <OpenButton href={bookmark.url} label={p.comments ? `${compactNumber(p.comments)} comments on HN` : 'Discuss on HN'} color={HN} />
          </div>
        </div>
      </article>
    </div>
  )
}

// ============================== Spotify ==============================
const SPOTIFY = '#1DB954'
const KIND_LABEL: Record<SpotifyPost['kind'], string> = { track: 'Song', album: 'Album', playlist: 'Playlist', episode: 'Episode', show: 'Podcast', artist: 'Artist', audiobook: 'Audiobook' }
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

export function spotifyView(b: Bookmark): SpotifyPost {
  const ref = spotifyRef(b.url)
  return getSpotifyPost(b) || {
    v: 1, platform: 'spotify', kind: ref?.kind || 'track', id: ref?.id || '',
    title: autoTitle(b.title, b.url) ? 'Spotify' : b.title, subtitle: null, image: b.image_url || null, duration_s: null, track_count: null,
  }
}

const spotifyLine = (p: SpotifyPost) => [KIND_LABEL[p.kind], p.duration_s ? mmss(p.duration_s) : null, p.track_count ? `${p.track_count} songs` : null].filter(Boolean).join(' · ')

export function SpotifyCard({ bookmark }: { bookmark: Bookmark }) {
  const p = spotifyView(bookmark)
  return (
    <div className={`${CARD} bg-[#121212] p-3 gap-3 border-white/[0.06] text-white`}>
      <div className={`relative w-full aspect-square rounded-lg overflow-hidden bg-[#282828] ${p.kind === 'artist' ? 'rounded-full' : ''}`}>
        <div className="absolute inset-0 flex items-center justify-center text-[#535353]"><Music2 className="w-10 h-10" /></div>
        <SafeImg src={p.image} className="absolute inset-0 w-full h-full object-cover" />
        <span className="absolute right-2.5 bottom-2.5 w-10 h-10 rounded-full flex items-center justify-center shadow-lg translate-y-1 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 [@media(hover:none)]:opacity-100 [@media(hover:none)]:translate-y-0 transition-all duration-300" style={{ background: SPOTIFY }}>
          <Play className="w-5 h-5 text-black fill-black ml-0.5" />
        </span>
      </div>
      <div className="min-w-0 px-0.5">
        <h3 className="text-[14.5px] font-bold leading-snug line-clamp-2 break-words">{p.title}</h3>
        {p.subtitle && <p className="text-[12.5px] text-[#B3B3B3] line-clamp-2 break-words mt-0.5">{p.subtitle}</p>}
        <div className="flex items-center gap-1.5 mt-2 text-[11px] text-[#B3B3B3]">
          <SpotifyIcon className="w-3.5 h-3.5 text-[#1DB954]" />{spotifyLine(p)}
        </div>
      </div>
    </div>
  )
}

export function SpotifyPreview({ bookmark }: { bookmark: Bookmark }) {
  const p = spotifyView(bookmark)
  const ref = spotifyRef(bookmark.url)
  const small = p.kind === 'track' || p.kind === 'episode'
  return (
    <div className={PANE}>
      <article className={`${ARTICLE} max-w-[560px] bg-[#121212] border-white/[0.06] text-white`}>
        <div className="p-5 md:p-6 flex flex-col gap-4">
          <div className="flex gap-4 items-end">
            <div className={`relative w-28 h-28 md:w-36 md:h-36 shrink-0 overflow-hidden bg-[#282828] shadow-2xl ${p.kind === 'artist' ? 'rounded-full' : 'rounded-lg'}`}>
              <SafeImg src={p.image} className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <div className="text-[12px] font-semibold text-[#B3B3B3]">{KIND_LABEL[p.kind]}</div>
              <h1 className="text-[22px] md:text-[28px] font-extrabold leading-tight break-words">{p.title}</h1>
              {p.subtitle && <p className="text-[13px] text-[#B3B3B3] mt-1 break-words">{p.subtitle}</p>}
              {(p.duration_s || p.track_count) && <p className="flex items-center gap-1 text-[12px] text-[#B3B3B3] mt-1"><Clock className="w-3.5 h-3.5" />{spotifyLine(p)}</p>}
            </div>
          </div>
          {/* Spotify's own player (made to be embedded): plays a preview, or the whole thing when signed in to Spotify. */}
          {ref && (
            <iframe title={`Play ${p.title} on Spotify`} src={`https://open.spotify.com/embed/${ref.kind}/${ref.id}?utm_source=inntoit`} width="100%" height={small ? 152 : 352}
              className="rounded-xl border-0" loading="lazy" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" />
          )}
          <div><OpenButton href={bookmark.url} label="Open in Spotify" color={SPOTIFY} dark /></div>
        </div>
      </article>
    </div>
  )
}

// ============================== Threads ==============================
export function threadsView(b: Bookmark): ThreadsPost {
  const ref = threadsPostRef(b.url)
  return getThreadsPost(b) || {
    v: 1, platform: 'threads', code: ref?.code || '', author: { handle: ref?.handle || 'threads', verified: false, avatar: null },
    text: b.description || (autoTitle(b.title, b.url) ? '' : b.title), images: b.image_url ? [b.image_url] : [], more_images: 0,
    created_at: null, likes: null, replies: null, reposts: null,
  }
}

function ThreadsHeader({ p, size }: { p: ThreadsPost; size: number }) {
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <Initial name={p.author.handle} avatar={p.author.avatar} size={size} color="#101010" />
      <span className="text-[14px] font-semibold text-black dark:text-[#F3F5F7] truncate">{p.author.handle}</span>
      {p.author.verified && <BadgeCheck className="w-4 h-4 shrink-0 text-[#0095F6]" aria-label="Verified" />}
      {p.created_at && <span className="text-[12px] text-[#999999] shrink-0">{shortDate(p.created_at)}</span>}
      <ThreadsIcon className="ml-auto w-4 h-4 shrink-0 text-black dark:text-white" />
    </div>
  )
}

function ThreadsCounts({ p }: { p: ThreadsPost }) {
  const items: [typeof Heart, string | null, string][] = [[Heart, p.likes, 'likes'], [MessageCircle, p.replies, 'replies'], [Repeat2, p.reposts, 'reposts']]
  const shown = items.filter(([, n]) => n)
  if (!shown.length) return null
  return (
    <div className="flex items-center gap-4 text-[12px] text-[#999999]">
      {shown.map(([Icon, n, label]) => <span key={label} className="inline-flex items-center gap-1" aria-label={`${n} ${label}`}><Icon className="w-4 h-4" />{n}</span>)}
    </div>
  )
}

export function ThreadsCard({ bookmark }: { bookmark: Bookmark }) {
  const p = threadsView(bookmark)
  return (
    <div className={`${CARD} bg-white dark:bg-[#101010] p-4 gap-3 border-black/[0.06] dark:border-white/[0.08]`}>
      <div className="mt-0.5"><ThreadsHeader p={p} size={32} /></div>
      {p.text && <p className="text-[14px] leading-relaxed text-black dark:text-[#F3F5F7] whitespace-pre-line break-words line-clamp-6">{p.text}</p>}
      {p.images[0] && (
        <div className="relative rounded-xl overflow-hidden bg-[#F5F5F5] dark:bg-[#1E1E1E] aspect-[4/5]">
          <SafeImg src={p.images[0]} className="w-full h-full object-cover" />
          {p.more_images > 0 && <span className="absolute right-2 bottom-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white">+{p.more_images}</span>}
        </div>
      )}
      <ThreadsCounts p={p} />
    </div>
  )
}

export function ThreadsPreview({ bookmark }: { bookmark: Bookmark }) {
  const p = threadsView(bookmark)
  return (
    <div className={PANE}>
      <article className={`${ARTICLE} max-w-[560px] bg-white dark:bg-[#101010] border-black/[0.06] dark:border-white/[0.08]`}>
        <div className="p-5 md:p-6 flex flex-col gap-4">
          <ThreadsHeader p={p} size={40} />
          {p.text && <p className="text-[16px] leading-relaxed text-black dark:text-[#F3F5F7] whitespace-pre-line break-words">{p.text}</p>}
          {p.images[0] && <div className="rounded-xl overflow-hidden bg-[#F5F5F5] dark:bg-[#1E1E1E]"><SafeImg src={p.images[0]} className="w-full h-auto max-h-[70vh] object-contain block" /></div>}
          {p.more_images > 0 && <p className="text-[12px] text-[#999999]">+{p.more_images} more {p.more_images === 1 ? 'picture' : 'pictures'} on Threads</p>}
          <div className="flex items-center gap-3 pt-3 border-t border-black/[0.06] dark:border-white/[0.08]">
            <ThreadsCounts p={p} />
            <span className="ml-auto"><OpenButton href={bookmark.url} label="View on Threads" color="#101010" /></span>
          </div>
        </div>
      </article>
    </div>
  )
}

// ============================== LinkedIn ==============================
const LINKEDIN = '#0A66C2'

export function linkedInView(b: Bookmark): LinkedInPost {
  return getLinkedInPost(b) || {
    v: 1, platform: 'linkedin', author: { name: 'LinkedIn', avatar: null, url: null },
    text: b.description || (autoTitle(b.title, b.url) ? '' : b.title), image: b.image_url || null, created_at: null, likes: null, comments: null,
  }
}

function LinkedInHeader({ p, size }: { p: LinkedInPost; size: number }) {
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <Initial name={p.author.name} avatar={p.author.avatar} size={size} color={LINKEDIN} />
      <div className="min-w-0 leading-tight">
        <div className="text-[14px] font-semibold text-[#191919] dark:text-[#E9E9E9] truncate">{p.author.name}</div>
        {p.created_at && <div className="text-[11.5px] text-[#666666] dark:text-[#A0A0A0]">{shortDate(p.created_at)}</div>}
      </div>
      <LinkedInIcon className="ml-auto w-4 h-4 shrink-0 text-[#0A66C2]" />
    </div>
  )
}

function LinkedInCounts({ p }: { p: LinkedInPost }) {
  if (p.likes == null && p.comments == null) return null
  return (
    <div className="flex items-center gap-4 text-[12px] text-[#666666] dark:text-[#A0A0A0]">
      {p.likes != null && <span className="inline-flex items-center gap-1"><ThumbsUp className="w-3.5 h-3.5" />{compactNumber(p.likes)}</span>}
      {p.comments != null && <span className="inline-flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" />{compactNumber(p.comments)} comments</span>}
    </div>
  )
}

export function LinkedInCard({ bookmark }: { bookmark: Bookmark }) {
  const p = linkedInView(bookmark)
  return (
    <div className={`${CARD} bg-white dark:bg-[#1B1F23] p-4 gap-3 border-black/[0.06] dark:border-white/[0.08]`}>
      <div className="absolute top-0 left-0 w-full h-[3px]" style={{ background: LINKEDIN }} />
      <div className="mt-0.5"><LinkedInHeader p={p} size={34} /></div>
      {p.text && <p className="text-[13.5px] leading-relaxed text-[#191919] dark:text-[#E9E9E9] whitespace-pre-line break-words line-clamp-6">{p.text}</p>}
      {p.image && <div className="rounded-lg overflow-hidden bg-[#F3F2EF] dark:bg-[#2A2F33]"><SafeImg src={p.image} className="w-full h-auto max-h-64 object-cover block" /></div>}
      <LinkedInCounts p={p} />
    </div>
  )
}

export function LinkedInPreview({ bookmark }: { bookmark: Bookmark }) {
  const p = linkedInView(bookmark)
  return (
    <div className={PANE}>
      <article className={`${ARTICLE} max-w-[600px] bg-white dark:bg-[#1B1F23] border-black/[0.06] dark:border-white/[0.08]`}>
        <div className="h-[3px]" style={{ background: LINKEDIN }} />
        <div className="p-5 md:p-6 flex flex-col gap-4">
          <LinkedInHeader p={p} size={44} />
          {p.text && <p className="text-[15px] leading-relaxed text-[#191919] dark:text-[#E9E9E9] whitespace-pre-line break-words">{p.text}</p>}
          {p.image && <div className="rounded-lg overflow-hidden bg-[#F3F2EF] dark:bg-[#2A2F33]"><SafeImg src={p.image} className="w-full h-auto max-h-[70vh] object-contain block" /></div>}
          <div className="flex items-center gap-3 pt-3 border-t border-black/[0.06] dark:border-white/[0.08]">
            <LinkedInCounts p={p} />
            <span className="ml-auto"><OpenButton href={bookmark.url} label="View on LinkedIn" color={LINKEDIN} /></span>
          </div>
        </div>
      </article>
    </div>
  )
}
