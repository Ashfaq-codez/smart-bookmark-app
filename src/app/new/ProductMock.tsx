'use client'

import Image from 'next/image'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Search, Heart, MessageCircle, Repeat2, ArrowBigUp, Play, Folder, Link2, StickyNote, Image as ImageIcon, Check, BookmarkPlus, LayoutGrid, Share, Copy, Plus } from 'lucide-react'

// The inntoit product, drawn in the landing page's parchment style: the wall of saves (cards look like the
// real dashboard's: X post, Reddit thread, Substack article, YouTube video, notes, link previews), the
// save panel from the Chrome extension, the iPhone share sheet and search. Pure HTML, no screenshots.

export const ink = 'bg-gradient-to-r from-[#2F7F8C] via-[#3C8A8F] to-[#A2683C] bg-clip-text text-transparent'


// brand marks (lucide has none)
const XMark = ({ className = '' }) => <svg viewBox="0 0 24 24" className={className} aria-hidden="true"><path fill="currentColor" d="M17.75 3h3.07l-6.7 7.66L22 21h-6.17l-4.83-6.32L5.47 21H2.4l7.17-8.2L2 3h6.33l4.37 5.78L17.75 3Zm-1.08 16.17h1.7L7.4 4.74H5.58l11.09 14.43Z" /></svg>
const RedditMark = ({ className = '' }) => <svg viewBox="0 0 24 24" className={className} aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#FF4500" /><path fill="#fff" d="M18.6 12.1a1.5 1.5 0 0 0-2.5-1.1 7.4 7.4 0 0 0-3.9-1.2l.7-3.1 2.2.5a1.1 1.1 0 1 0 .1-.7l-2.5-.5a.3.3 0 0 0-.4.2l-.8 3.6a7.4 7.4 0 0 0-4 1.2 1.5 1.5 0 1 0-1.7 2.4 2.8 2.8 0 0 0 0 .5c0 2.4 2.8 4.3 6.2 4.3s6.2-1.9 6.2-4.3a2.8 2.8 0 0 0 0-.5 1.5 1.5 0 0 0 .4-1.3ZM8.6 13.2a1 1 0 1 1 1 1 1 1 0 0 1-1-1Zm5.7 2.7a3.7 3.7 0 0 1-2.3.7 3.7 3.7 0 0 1-2.3-.7.3.3 0 0 1 .4-.4 3.1 3.1 0 0 0 1.9.5 3.1 3.1 0 0 0 1.9-.5.3.3 0 1 1 .4.4Zm-.2-1.7a1 1 0 1 1 1-1 1 1 0 0 1-1 1Z" /></svg>

const shell = 'rounded-[14px] bg-[#FBF6EC] ring-1 ring-[#DCCDB3] shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_10px_24px_-14px_rgba(70,50,25,0.35)] overflow-hidden'

// ---------- cards ----------
export function XCard() {
  return (
    <div className={`${shell} p-3.5 relative`}>
      <div className="absolute inset-x-0 top-0 h-[3px] bg-[#1D1A16]" />
      <div className="flex items-center gap-2">
        <span className="h-7 w-7 rounded-full bg-[conic-gradient(from_200deg,#3F8C97,#A2683C,#3F8C97)]" />
        <div className="leading-tight min-w-0"><p className="text-[12px] font-semibold text-[#2A241D] truncate">Studio Form</p><p className="text-[10.5px] text-[#8F8169] truncate">@studioform · 2h</p></div>
        <XMark className="ml-auto h-3.5 w-3.5 text-[#2A241D]" />
      </div>
      <p className="mt-2.5 text-[12.5px] leading-snug text-[#3A3128]">Every door in Kyoto’s old quarter is a lesson in proportion. Saving all of these for the café build.</p>
      <div className="mt-2.5 flex gap-4 text-[10.5px] text-[#8F8169]"><span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />48</span><span className="flex items-center gap-1"><Repeat2 className="h-3 w-3" />312</span><span className="flex items-center gap-1"><Heart className="h-3 w-3" />2.4K</span></div>
    </div>
  )
}

export function RedditCard() {
  return (
    <div className={`${shell} relative`}>
      <div className="absolute inset-x-0 top-0 h-[3px] bg-[#FF4500]" />
      <div className="p-3.5 pb-2.5">
        <div className="flex items-center gap-1.5 text-[10.5px] text-[#8F8169]"><RedditMark className="h-4 w-4" /><span className="font-semibold text-[#3A3128]">r/architecture</span><span>· u/limewash</span></div>
        <p className="mt-2 text-[13px] font-semibold leading-snug text-[#2A241D]">Found this carved door in Jaipur, 1890s. Anyone know the joinery?</p>
      </div>
      <div className="relative aspect-[4/3]"><Image src="/landing/3.webp" alt="" fill sizes="240px" className="object-cover" /></div>
      <div className="flex gap-4 px-3.5 py-2 text-[10.5px] text-[#8F8169]"><span className="flex items-center gap-1"><ArrowBigUp className="h-3.5 w-3.5" />4.1K</span><span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />286</span></div>
    </div>
  )
}

export function ArticleCard() {
  return (
    <div className={`${shell} relative`}>
      <div className="absolute inset-x-0 top-0 h-[3px] bg-[#FF6719]" />
      <div className="relative aspect-[16/10]"><Image src="/landing/1.webp" alt="" fill sizes="240px" className="object-cover object-[50%_35%]" /></div>
      <div className="p-3.5">
        <p className={`text-[9px] tracking-[0.18em] font-mono uppercase text-[#FF6719]`}>Substack · 7 min read</p>
        <p className="mt-1.5 font-serif text-[16px] leading-tight text-[#2A241D]">The quiet architecture of island towns</p>
        <p className="mt-1 text-[10.5px] text-[#8F8169]">Mara Ellis · Field Notes</p>
      </div>
    </div>
  )
}

export function VideoCard() {
  return (
    <div className={`${shell} relative`}>
      <div className="absolute inset-x-0 top-0 h-[3px] bg-[#E62117] z-10" />
      <div className="relative aspect-video bg-[#2A241D]">
        <Image src="/landing/4.webp" alt="" fill sizes="240px" className="object-cover object-[50%_40%] opacity-90" />
        <span className="absolute inset-0 m-auto flex h-9 w-9 items-center justify-center rounded-full bg-[#FBF6EC]/90 shadow"><Play className="h-4 w-4 translate-x-[1px] fill-[#2A241D] text-[#2A241D]" /></span>
        <span className={`absolute bottom-1.5 right-1.5 rounded bg-black/70 px-1 font-mono text-[9px] text-white`}>18:42</span>
      </div>
      <div className="p-3"><p className="text-[12.5px] font-semibold leading-snug text-[#2A241D]">Why courtyards make cities calmer</p><p className="mt-0.5 text-[10.5px] text-[#8F8169]">Urban Light · YouTube</p></div>
    </div>
  )
}

export function NoteCard({ text = 'Arches everywhere. Warm light, terracotta, one turquoise door. This is the café.' }: { text?: string }) {
  return (
    <div className={`${shell} p-4 bg-[linear-gradient(170deg,#FBF6EC,#F4EADA)]`}>
      <p className={`flex items-center gap-1.5 text-[9px] tracking-[0.18em] font-mono uppercase text-[#3F8C97]`}><StickyNote className="h-3 w-3" />Note</p>
      <p className="mt-2 font-serif text-[16px] italic leading-snug text-[#3A3128]">{text}</p>
    </div>
  )
}

export function LinkCard({ img = '/landing/2.webp', title = 'Mashrabiya: a field guide', site = 'archdaily.com' }: { img?: string; title?: string; site?: string }) {
  return (
    <div className={shell}>
      <div className="relative aspect-[4/3]"><Image src={img} alt="" fill sizes="240px" className="object-cover" /></div>
      <div className="p-3"><p className="text-[12.5px] font-semibold leading-snug text-[#2A241D]">{title}</p><p className="mt-0.5 text-[10.5px] text-[#8F8169]">{site}</p></div>
    </div>
  )
}

// ---------- the save panel (Chrome extension) ----------
export function SavePanel({ saved }: { saved: boolean }) {
  return (
    <div className="w-[270px] rounded-[18px] bg-[#FBF6EC] p-3.5 ring-1 ring-[#DCCDB3] shadow-[0_24px_50px_-18px_rgba(50,35,15,0.55)]">
      <div className="flex items-center gap-2"><span className="font-serif text-[17px] font-semibold text-[#2A241D]">inntoit</span><span className={`ml-auto text-[9px] tracking-[0.18em] font-mono uppercase text-[#8F8169]`}>Save</span></div>
      <div className="mt-3 flex items-center gap-2.5 rounded-xl bg-[#F1E9DB] p-2">
        <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg"><Image src="/landing/5.webp" alt="" fill sizes="40px" className="object-cover" /></span>
        <div className="min-w-0 leading-tight"><p className="truncate text-[12px] font-semibold text-[#2A241D]">The Haveli Facades of Jaisalmer</p><p className="truncate text-[10.5px] text-[#8F8169]">archdaily.com</p></div>
      </div>
      <div className="mt-2.5 rounded-xl border border-[#DCCDB3] bg-white/60 px-2.5 py-2 text-[11.5px] text-[#8F8169]">Add a note… <span className="text-[#3A3128]">for the café façade</span></div>
      <div className={`mt-2.5 flex h-9 items-center justify-center gap-1.5 rounded-xl text-[12.5px] font-medium transition-colors duration-500 ${saved ? 'bg-[#3F8C97] text-white' : 'bg-[#2A241D] text-[#F1E9DB]'}`}>
        {saved ? <><Check className="h-4 w-4" />Saved to inntoit</> : <><BookmarkPlus className="h-4 w-4" />Save</>}
      </div>
    </div>
  )
}

// ---------- the iPhone share sheet ----------
export function ShareSheet({ open }: { open: boolean }) {
  return (
    <div className="relative mx-auto h-[440px] w-[220px] rounded-[38px] bg-[#2A241D] p-[7px] shadow-[0_30px_60px_-24px_rgba(40,28,12,0.6)]">
      <div className="relative h-full w-full overflow-hidden rounded-[32px] bg-[#F1E9DB]">
        <div className="absolute left-1/2 top-2 h-5 w-20 -translate-x-1/2 rounded-full bg-[#2A241D]" />
        <div className="relative mt-10 mx-3 aspect-[4/5] overflow-hidden rounded-xl"><Image src="/landing/1.webp" alt="" fill sizes="200px" className="object-cover" /></div>
        <p className="mx-3 mt-2 text-[11px] font-semibold text-[#2A241D]">@island.homes</p>
        <motion.div
          initial={false}
          animate={{ y: open ? 0 : 260 }}
          transition={{ type: 'spring', stiffness: 260, damping: 30 }}
          className="absolute inset-x-0 bottom-0 rounded-t-[22px] bg-[#FBF6EC]/95 px-3 pb-5 pt-3 backdrop-blur ring-1 ring-[#DCCDB3]"
        >
          <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-[#CDBEA4]" />
          <div className="flex justify-between">
            {[
              { k: 'inntoit', c: 'bg-[#2A241D] text-[#F1E9DB]', on: true },
              { k: 'Messages', c: 'bg-[#7FB77E]' }, { k: 'Mail', c: 'bg-[#6FA3C7]' }, { k: 'Notes', c: 'bg-[#E8C46A]' },
            ].map((a) => (
              <div key={a.k} className="flex w-11 flex-col items-center gap-1">
                <span className={`flex h-11 w-11 items-center justify-center rounded-[12px] ${a.c} ${a.on ? 'ring-2 ring-[#3F8C97] ring-offset-2 ring-offset-[#FBF6EC]' : ''}`}>{a.on && <span className="font-serif text-[15px] font-semibold">in</span>}</span>
                <span className="text-[8.5px] text-[#5E5446]">{a.k}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 space-y-1.5">
            {[[Copy, 'Copy link'], [Share, 'Share to…']].map(([I, t]) => { const Icon = I as typeof Copy; return <div key={t as string} className="flex items-center justify-between rounded-lg bg-white/70 px-2.5 py-1.5 text-[10.5px] text-[#3A3128]">{t as string}<Icon className="h-3 w-3" /></div> })}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

// ---------- the whole app window: sidebar, search, the wall; a new save drops in ----------
const SIDE = [[LayoutGrid, 'All', '314'], [Link2, 'Links', '166'], [StickyNote, 'Notes', '42'], [ImageIcon, 'Images', '58']] as const
const FOLDERS = [['Café build', '24'], ['Doors & windows', '61'], ['Reading', '33']] as const

export function AppWindow() {
  const reduce = useReducedMotion()
  const [step, setStep] = useState(0)   // 0 = panel opens, 1 = saved, 2 = card lands on the wall
  useEffect(() => {
    if (reduce) { setStep(2); return }
    const seq = [1400, 1300, 4200]
    let i = 0, t: ReturnType<typeof setTimeout>
    const next = () => { t = setTimeout(() => { i = (i + 1) % 3; setStep(i); next() }, seq[i]) }
    next()
    return () => clearTimeout(t)
  }, [reduce])

  return (
    <div className="relative rounded-[22px] bg-[#E9DECB] p-2 ring-1 ring-[#D3C3A7] shadow-[0_60px_120px_-50px_rgba(60,40,15,0.55)]">
      {/* window bar */}
      <div className="flex items-center gap-2 px-3 pb-2 pt-1">
        <span className="flex gap-1.5">{['#D98C6A', '#E3BE6E', '#8FB486'].map((c) => <span key={c} className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />)}</span>
        <span className={`mx-auto rounded-full bg-[#F1E9DB] px-4 py-1 text-[10px] tracking-[0.1em] font-mono text-[#8F8169]`}>inntoit.app/dashboard</span>
        <span className="w-10" />
      </div>
      <div className="flex h-[min(620px,68vw)] min-h-[420px] overflow-hidden rounded-[16px] bg-[#F4ECDD]">
        {/* sidebar */}
        <aside className="hidden w-[190px] shrink-0 flex-col border-r border-[#DCCDB3] bg-[#EFE5D3] p-4 md:flex">
          <span className="font-serif text-[22px] font-semibold text-[#2A241D]">inntoit</span>
          <p className={`mt-6 text-[9px] tracking-[0.2em] font-mono uppercase text-[#8F8169]`}>Views</p>
          <ul className="mt-2 space-y-0.5">{SIDE.map(([I, t, n], i) => <li key={t} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-[12.5px] ${i === 0 ? 'bg-[#F8F1E4] text-[#2A241D] ring-1 ring-[#DCCDB3]' : 'text-[#5E5446]'}`}><I className="h-3.5 w-3.5 text-[#3F8C97]" strokeWidth={1.75} />{t}<span className={`ml-auto text-[9.5px] font-mono text-[#8F8169]`}>{n}</span></li>)}</ul>
          <p className={`mt-6 text-[9px] tracking-[0.2em] font-mono uppercase text-[#8F8169]`}>Folders</p>
          <ul className="mt-2 space-y-0.5">{FOLDERS.map(([t, n]) => <li key={t} className="flex items-center gap-2 px-2 py-1.5 text-[12.5px] text-[#5E5446]"><Folder className="h-3.5 w-3.5 text-[#A2683C]" strokeWidth={1.75} />{t}<span className={`ml-auto text-[9.5px] font-mono text-[#8F8169]`}>{n}</span></li>)}</ul>
          <p className="mt-auto font-serif text-[13px] italic leading-snug text-[#8F8169]">Collect quietly.<br />Find it when you need it.</p>
        </aside>
        {/* main */}
        <div className="relative flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-3 border-b border-[#DCCDB3] px-4 py-3">
            <span className="font-serif text-[18px] text-[#2A241D] md:hidden">inntoit</span>
            <div className="flex h-9 flex-1 items-center gap-2 rounded-full bg-[#FBF6EC] px-3.5 text-[12px] text-[#8F8169] ring-1 ring-[#DCCDB3]"><Search className="h-3.5 w-3.5" />Search your mind…</div>
            <span className="hidden h-9 w-9 items-center justify-center rounded-full bg-[#FBF6EC] ring-1 ring-[#DCCDB3] sm:flex"><Plus className="h-4 w-4 text-[#5E5446]" /></span>
          </div>
          <div className="relative flex-1 overflow-hidden p-3 sm:p-4">
            <div className="columns-2 gap-3 sm:columns-3 lg:columns-4 [&>*]:mb-3 [&>*]:break-inside-avoid">
              <AnimatePresence initial={false}>
                {step === 2 && (
                  <motion.div key="new" layout initial={{ opacity: 0, y: -30, scale: 0.92 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ type: 'spring', stiffness: 220, damping: 22 }}>
                    <div className="relative">
                      <LinkCard img="/landing/5.webp" title="The Haveli Facades of Jaisalmer" site="archdaily.com" />
                      <span className={`absolute left-2 top-2 rounded-full bg-[#3F8C97] px-2 py-0.5 text-[8.5px] tracking-[0.15em] font-mono uppercase text-white`}>Just saved</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <motion.div layout><XCard /></motion.div>
              <motion.div layout><ArticleCard /></motion.div>
              <motion.div layout><NoteCard /></motion.div>
              <motion.div layout><RedditCard /></motion.div>
              <motion.div layout><VideoCard /></motion.div>
              <motion.div layout><LinkCard /></motion.div>
              <motion.div layout><NoteCard text="Ask the carpenter about mashrabiya screens. Budget?" /></motion.div>
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#F4ECDD] to-transparent" />
            {/* the extension's save panel, top right */}
            <AnimatePresence>
              {step < 2 && (
                <motion.div key="panel" className="absolute right-2 top-2 z-20 origin-top-right scale-[0.72] sm:right-5 sm:top-4 sm:scale-100"
                  initial={{ opacity: 0, y: -10, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.96 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
                  <SavePanel saved={step === 1} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------- search: typing a word and the wall narrows to the matches ----------
const ALL = [
  { k: 'x', tags: 'door kyoto', el: <XCard /> }, { k: 'r', tags: 'door jaipur', el: <RedditCard /> },
  { k: 'a', tags: 'island', el: <ArticleCard /> }, { k: 'n', tags: 'café door', el: <NoteCard /> },
  { k: 'v', tags: 'courtyard', el: <VideoCard /> }, { k: 'l', tags: 'window', el: <LinkCard /> },
]
export function SearchDemo() {
  const reduce = useReducedMotion()
  const word = 'door'
  const [typed, setTyped] = useState(reduce ? word : '')
  useEffect(() => {
    if (reduce) return
    let i = 0, dir = 1, t: ReturnType<typeof setTimeout>
    const tick = () => {
      i += dir
      setTyped(word.slice(0, i))
      if (i === word.length) { dir = -1; t = setTimeout(tick, 2600); return }
      if (i === 0) { dir = 1; t = setTimeout(tick, 1400); return }
      t = setTimeout(tick, dir > 0 ? 160 : 70)
    }
    t = setTimeout(tick, 900)
    return () => clearTimeout(t)
  }, [reduce])
  const shown = typed.length >= 3 ? ALL.filter((c) => c.tags.includes(typed)) : ALL
  return (
    <div className="rounded-[20px] bg-[#EFE5D3] p-4 ring-1 ring-[#D3C3A7] sm:p-5">
      <div className="flex h-11 items-center gap-2.5 rounded-full bg-[#FBF6EC] px-4 ring-1 ring-[#DCCDB3]">
        <Search className="h-4 w-4 text-[#3F8C97]" />
        <span className="text-[14px] text-[#2A241D]">{typed}<span className="ml-0.5 inline-block h-4 w-[1.5px] translate-y-[3px] animate-pulse bg-[#3F8C97]" /></span>
        <span className={`ml-auto text-[9.5px] tracking-[0.18em] font-mono uppercase text-[#8F8169]`}>{shown.length} found</span>
      </div>
      <motion.div layout className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {shown.map((c) => (
            <motion.div key={c.k} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ type: 'spring', stiffness: 260, damping: 26 }}>
              {c.el}
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
