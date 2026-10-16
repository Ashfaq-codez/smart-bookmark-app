'use client'

import Image from 'next/image'
import { motion, AnimatePresence, LayoutGroup, useReducedMotion, useInView } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { Search, Heart, MessageCircle, Repeat2, ArrowBigUp, Play, Folder, FolderOpen, Link2, StickyNote, Image as ImageIcon, Check, BookmarkPlus, LayoutGrid, Plus, Loader2, MousePointer2, ExternalLink, Copy, Printer, ChevronRight, X as XIcon } from 'lucide-react'

// The inntoit product, drawn in the landing page's parchment style: the wall of saves (cards look like the real
// dashboard's), the Chrome extension (panel and right-click menu), the iPhone share sheet, search, the focus view
// with notes, and folders. Pure HTML. Every demo plays only while it is on screen, at a human pace (pointer moves
// on curves, presses dip, buttons show a short "saving…" state, cards fly to their place), and stands still,
// fully shown, when "reduce motion" is on.

export const TURQ = '#2F7F8C'
export const WOOD = '#A2683C'
const EASE = [0.22, 1, 0.36, 1] as const
const SPRING = { type: 'spring' as const, stiffness: 260, damping: 28, mass: 0.9 }

// brand marks (lucide has none)
const XMark = ({ className = '' }) => <svg viewBox="0 0 24 24" className={className} aria-hidden="true"><path fill="currentColor" d="M17.75 3h3.07l-6.7 7.66L22 21h-6.17l-4.83-6.32L5.47 21H2.4l7.17-8.2L2 3h6.33l4.37 5.78L17.75 3Zm-1.08 16.17h1.7L7.4 4.74H5.58l11.09 14.43Z" /></svg>
const RedditMark = ({ className = '' }) => <svg viewBox="0 0 24 24" className={className} aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#FF4500" /><path fill="#fff" d="M18.6 12.1a1.5 1.5 0 0 0-2.5-1.1 7.4 7.4 0 0 0-3.9-1.2l.7-3.1 2.2.5a1.1 1.1 0 1 0 .1-.7l-2.5-.5a.3.3 0 0 0-.4.2l-.8 3.6a7.4 7.4 0 0 0-4 1.2 1.5 1.5 0 1 0-1.7 2.4 2.8 2.8 0 0 0 0 .5c0 2.4 2.8 4.3 6.2 4.3s6.2-1.9 6.2-4.3a2.8 2.8 0 0 0 0-.5 1.5 1.5 0 0 0 .4-1.3ZM8.6 13.2a1 1 0 1 1 1 1 1 1 0 0 1-1-1Zm5.7 2.7a3.7 3.7 0 0 1-2.3.7 3.7 3.7 0 0 1-2.3-.7.3.3 0 0 1 .4-.4 3.1 3.1 0 0 0 1.9.5 3.1 3.1 0 0 0 1.9-.5.3.3 0 1 1 .4.4Zm-.2-1.7a1 1 0 1 1 1-1 1 1 0 0 1-1 1Z" /></svg>

const shell = 'rounded-[14px] bg-[#FBF6EC] ring-1 ring-[#DCCDB3] shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_10px_24px_-14px_rgba(70,50,25,0.35)] overflow-hidden'
const label = 'font-mono text-[9px] tracking-[0.18em] uppercase'

// ---------- timing: a demo's steps, only while visible ----------
function useSteps(durations: number[], ref: React.RefObject<Element | null>) {
  const reduce = useReducedMotion()
  const visible = useInView(ref, { margin: '-15%' })
  // same first picture on the server and in the browser; the still, finished state is set after loading
  const [step, setStep] = useState(0)
  useEffect(() => {
    if (reduce) { setStep(durations.length - 1); return }
    if (!visible) return
    let k = 0
    setStep(0)
    let t: ReturnType<typeof setTimeout>
    const next = () => { t = setTimeout(() => { k = (k + 1) % durations.length; setStep(k); next() }, durations[k]) }
    next()
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce, visible])
  return { step, reduce }
}

// a pointer that glides on a slight curve and dips when it presses
function Pointer({ x, y, press, touch = false }: { x: string; y: string; press: boolean; touch?: boolean }) {
  return (
    <motion.div aria-hidden="true" className="pointer-events-none absolute z-30" initial={false}
      animate={{ left: x, top: y }} transition={{ left: { duration: 0.85, ease: EASE }, top: { duration: 0.85, ease: [0.5, 0, 0.2, 1] } }}>
      <motion.div animate={{ scale: press ? 0.86 : 1 }} transition={{ duration: 0.12 }} className="relative">
        {touch
          ? <span className="block h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2A241D]/25 ring-2 ring-white/70" />
          : <MousePointer2 className="h-[22px] w-[22px] fill-[#FBF6EC] text-[#2A241D] drop-shadow-[0_2px_2px_rgba(0,0,0,0.25)]" strokeWidth={1.4} />}
        <AnimatePresence>
          {press && <motion.span key="ring" className={`absolute rounded-full border-2 ${touch ? 'left-0 top-0 -translate-x-1/2 -translate-y-1/2' : '-left-2 -top-2'}`} style={{ borderColor: TURQ, width: 24, height: 24 }}
            initial={{ opacity: 0.8, scale: 0.4 }} animate={{ opacity: 0, scale: 2 }} exit={{ opacity: 0 }} transition={{ duration: 0.6, ease: 'easeOut' }} />}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}

// ---------- cards ----------
export function XCard() {
  return (
    <div className={`${shell} relative p-3.5`}>
      <div className="absolute inset-x-0 top-0 h-[3px] bg-[#1D1A16]" />
      <div className="flex items-center gap-2">
        <span className="relative h-7 w-7 overflow-hidden rounded-full"><Image src="/landing/10.webp" alt="" fill sizes="28px" className="object-cover" /></span>
        <div className="min-w-0 leading-tight"><p className="truncate text-[12px] font-semibold text-[#2A241D]">Studio Form</p><p className="truncate text-[10.5px] text-[#8F8169]">@studioform · 2h</p></div>
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
      <div className="absolute inset-x-0 top-0 z-10 h-[3px] bg-[#FF4500]" />
      <div className="p-3.5 pb-2.5">
        <div className="flex items-center gap-1.5 text-[10.5px] text-[#8F8169]"><RedditMark className="h-4 w-4" /><span className="font-semibold text-[#3A3128]">r/architecture</span><span>· u/limewash</span></div>
        <p className="mt-2 text-[13px] font-semibold leading-snug text-[#2A241D]">Found this carved door in Jaipur, 1890s. Anyone know the joinery?</p>
      </div>
      <div className="relative aspect-[4/3]"><Image src="/landing/3.webp" alt="" fill sizes="260px" className="object-cover" /></div>
      <div className="flex gap-4 px-3.5 py-2 text-[10.5px] text-[#8F8169]"><span className="flex items-center gap-1"><ArrowBigUp className="h-3.5 w-3.5" />4.1K</span><span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />286</span></div>
    </div>
  )
}

export function ArticleCard() {
  return (
    <div className={`${shell} relative`}>
      <div className="absolute inset-x-0 top-0 z-10 h-[3px] bg-[#FF6719]" />
      <div className="relative aspect-[16/10]"><Image src="/landing/9.webp" alt="" fill sizes="260px" className="object-cover object-[50%_45%]" /></div>
      <div className="p-3.5">
        <p className={`${label} text-[#FF6719]`}>Substack · 7 min read</p>
        <p className="mt-1.5 font-serif text-[16px] leading-tight text-[#2A241D]">Orange trees and the courtyard house</p>
        <p className="mt-1 text-[10.5px] text-[#8F8169]">Mara Ellis · Field Notes</p>
      </div>
    </div>
  )
}

export function VideoCard() {
  return (
    <div className={`${shell} relative`}>
      <div className="absolute inset-x-0 top-0 z-10 h-[3px] bg-[#E62117]" />
      <div className="relative aspect-video bg-[#2A241D]">
        <Image src="/landing/7.webp" alt="" fill sizes="260px" className="object-cover object-[50%_45%]" />
        <span className="absolute inset-0 m-auto flex h-9 w-9 items-center justify-center rounded-full bg-[#FBF6EC]/90 shadow"><Play className="h-4 w-4 translate-x-[1px] fill-[#2A241D] text-[#2A241D]" /></span>
        <span className="absolute bottom-1.5 right-1.5 rounded bg-black/70 px-1 font-mono text-[9px] text-white">18:42</span>
      </div>
      <div className="p-3"><p className="text-[12.5px] font-semibold leading-snug text-[#2A241D]">Why courtyards make cities calmer</p><p className="mt-0.5 text-[10.5px] text-[#8F8169]">Urban Light · YouTube</p></div>
    </div>
  )
}

export function NoteCard({ text = 'Arches everywhere. Warm light, terracotta, one turquoise door. This is the café.' }: { text?: string }) {
  return (
    <div className={`${shell} bg-[#F7EFE1] p-4`}>
      <p className={`${label} flex items-center gap-1.5`} style={{ color: TURQ }}><StickyNote className="h-3 w-3" />Note</p>
      <p className="mt-2 font-serif text-[16px] italic leading-snug text-[#3A3128]">{text}</p>
    </div>
  )
}

export function LinkCard({ img = '/landing/2.webp', title = 'Mashrabiya: a field guide', site = 'archdaily.com', pos = 'object-center' }: { img?: string; title?: string; site?: string; pos?: string }) {
  return (
    <div className={shell}>
      <div className="relative aspect-[4/3]"><Image src={img} alt="" fill sizes="260px" className={`object-cover ${pos}`} /></div>
      <div className="p-3"><p className="text-[12.5px] font-semibold leading-snug text-[#2A241D]">{title}</p><p className="mt-0.5 text-[10.5px] text-[#8F8169]">{site}</p></div>
    </div>
  )
}

// ---------- the extension's save panel ----------
type SaveState = 'idle' | 'saving' | 'saved'
export function SavePanel({ state }: { state: SaveState }) {
  return (
    <div className="w-[270px] rounded-[18px] bg-[#FBF6EC] p-3.5 ring-1 ring-[#DCCDB3] shadow-[0_24px_50px_-18px_rgba(50,35,15,0.55)]">
      <div className="flex items-center gap-2"><span className="font-serif text-[17px] font-semibold text-[#2A241D]">inntoit</span><span className={`${label} ml-auto text-[#8F8169]`}>Save</span></div>
      <div className="mt-3 flex items-center gap-2.5 rounded-xl bg-[#F1E9DB] p-2">
        <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg"><Image src="/landing/8.webp" alt="" fill sizes="40px" className="object-cover" /></span>
        <div className="min-w-0 leading-tight"><p className="truncate text-[12px] font-semibold text-[#2A241D]">The scalloped arches of Agra Fort</p><p className="truncate text-[10.5px] text-[#8F8169]">archdaily.com</p></div>
      </div>
      <div className="mt-2.5 rounded-xl border border-[#DCCDB3] bg-white/60 px-2.5 py-2 text-[11.5px] text-[#8F8169]">Add a note… <span className="text-[#3A3128]">arches for the café</span></div>
      <motion.div className="mt-2.5 flex h-9 items-center justify-center gap-1.5 rounded-xl text-[12.5px] font-medium text-[#F1E9DB]"
        animate={{ backgroundColor: state === 'saved' ? TURQ : '#2A241D' }} transition={{ duration: 0.35 }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span key={state} className="flex items-center gap-1.5" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
            {state === 'idle' && <><BookmarkPlus className="h-4 w-4" />Save</>}
            {state === 'saving' && <><Loader2 className="h-4 w-4 animate-spin" />Saving…</>}
            {state === 'saved' && <><Check className="h-4 w-4" />Saved to inntoit</>}
          </motion.span>
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

// ---------- the whole app: the panel saves a page, and the save flies onto the wall ----------
const SIDE = [[LayoutGrid, 'All', '314'], [Link2, 'Links', '166'], [StickyNote, 'Notes', '42'], [ImageIcon, 'Images', '58']] as const
const FOLDERS = [['Café build', '24'], ['Doors & windows', '61'], ['Reading', '33']] as const

export function AppWindow() {
  const ref = useRef<HTMLDivElement>(null)
  // 0 panel opens · 1 pointer reaches Save · 2 press, saving… · 3 saved · 4 the save flies to the wall · 5 rest
  const { step } = useSteps([900, 900, 800, 900, 4200, 900], ref)
  const panel = step <= 3
  const card = step >= 4

  return (
    <div ref={ref} className="relative rounded-[22px] bg-[#E9DECB] p-2 ring-1 ring-[#D3C3A7] shadow-[0_60px_120px_-50px_rgba(60,40,15,0.55)]">
      <div className="flex items-center gap-2 px-3 pb-2 pt-1">
        <span className="flex gap-1.5">{['#D98C6A', '#E3BE6E', '#8FB486'].map((c) => <span key={c} className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />)}</span>
        <span className="mx-auto rounded-full bg-[#F1E9DB] px-4 py-1 font-mono text-[10px] tracking-[0.1em] text-[#8F8169]">inntoit.app/dashboard</span>
        <span className="w-10" />
      </div>
      <div className="relative flex h-[min(620px,72vw)] min-h-[440px] overflow-hidden rounded-[16px] bg-[#F4ECDD]">
        <aside className="hidden w-[190px] shrink-0 flex-col border-r border-[#DCCDB3] bg-[#EFE5D3] p-4 md:flex">
          <span className="font-serif text-[22px] font-semibold text-[#2A241D]">inntoit</span>
          <p className={`${label} mt-6 text-[#8F8169]`}>Views</p>
          <ul className="mt-2 space-y-0.5">{SIDE.map(([I, t, n], i) => <li key={t} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-[12.5px] ${i === 0 ? 'bg-[#F8F1E4] text-[#2A241D] ring-1 ring-[#DCCDB3]' : 'text-[#5E5446]'}`}><I className="h-3.5 w-3.5" style={{ color: TURQ }} strokeWidth={1.75} />{t}<span className="ml-auto font-mono text-[9.5px] text-[#8F8169]">{i === 0 && card ? '315' : n}</span></li>)}</ul>
          <p className={`${label} mt-6 text-[#8F8169]`}>Folders</p>
          <ul className="mt-2 space-y-0.5">{FOLDERS.map(([t, n]) => <li key={t} className="flex items-center gap-2 px-2 py-1.5 text-[12.5px] text-[#5E5446]"><Folder className="h-3.5 w-3.5" style={{ color: WOOD }} strokeWidth={1.75} />{t}<span className="ml-auto font-mono text-[9.5px] text-[#8F8169]">{n}</span></li>)}</ul>
          <p className="mt-auto font-serif text-[13px] italic leading-snug text-[#8F8169]">Collect quietly.<br />Find it when you need it.</p>
        </aside>
        <div className="relative flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-3 border-b border-[#DCCDB3] px-4 py-3">
            <span className="font-serif text-[18px] text-[#2A241D] md:hidden">inntoit</span>
            <div className="flex h-9 flex-1 items-center gap-2 rounded-full bg-[#FBF6EC] px-3.5 text-[12px] text-[#8F8169] ring-1 ring-[#DCCDB3]"><Search className="h-3.5 w-3.5" />Search your mind…</div>
            <span className="hidden h-9 w-9 items-center justify-center rounded-full bg-[#FBF6EC] ring-1 ring-[#DCCDB3] sm:flex"><Plus className="h-4 w-4 text-[#5E5446]" /></span>
          </div>
          <div className="relative flex-1 overflow-hidden p-3 sm:p-4">
            <LayoutGroup>
              <div className="columns-2 gap-3 sm:columns-3 lg:columns-4 [&>*]:mb-3 [&>*]:break-inside-avoid">
                {card && (
                  // the panel's page turns into a card on the wall (shared layout: it flies from the panel to here)
                  <motion.div layoutId="incoming" transition={{ layout: { type: 'spring', stiffness: 170, damping: 24 } }} className="relative rounded-[14px]">
                    <LinkCard img="/landing/8.webp" title="The scalloped arches of Agra Fort" site="archdaily.com" />
                    <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }} className="absolute left-2 top-2 rounded-full px-2 py-0.5 font-mono text-[8.5px] tracking-[0.15em] uppercase text-white" style={{ background: TURQ }}>Just saved</motion.span>
                  </motion.div>
                )}
                {[<XCard key="x" />, <ArticleCard key="a" />, <NoteCard key="n" />, <RedditCard key="r" />, <VideoCard key="v" />, <LinkCard key="l" />, <NoteCard key="n2" text="Ask the carpenter about mashrabiya screens. Budget?" />].map((c) => (
                  <motion.div key={c.key} layout transition={{ layout: { type: 'spring', stiffness: 170, damping: 26 } }}>{c}</motion.div>
                ))}
              </div>
              <AnimatePresence>
                {panel && (
                  <motion.div key="panel" layoutId="incoming" className="absolute right-2 top-2 z-20 sm:right-5 sm:top-4"
                    initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: EASE }}>
                    <div className="w-[200px] sm:w-auto [&>div]:w-full sm:[&>div]:w-[270px]"><SavePanel state={step >= 3 ? 'saved' : step === 2 ? 'saving' : 'idle'} /></div>
                  </motion.div>
                )}
              </AnimatePresence>
            </LayoutGroup>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#F4ECDD] to-transparent" />
            {/* the pointer: comes in, presses Save, moves away */}
            <div className="absolute inset-0 hidden sm:block">
              <Pointer x={step === 0 ? '46%' : step <= 3 ? 'calc(100% - 150px)' : '58%'} y={step === 0 ? '78%' : step <= 3 ? '238px' : '88%'} press={step === 2} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------- right-click a picture on any page: "Save to inntoit" ----------
export function ContextMenuDemo() {
  const ref = useRef<HTMLDivElement>(null)
  // 0 pointer to the picture · 1 right-click, menu opens · 2 onto "Save to inntoit" · 3 click · 4 badge ✓ · 5 rest
  const { step } = useSteps([1000, 900, 700, 500, 2400, 600], ref)
  const menu = step >= 1 && step <= 3
  return (
    <div ref={ref} className="relative h-full min-h-[480px] overflow-hidden rounded-[22px] bg-[#E8DCC7] ring-1 ring-[#D3C3A7]">
      <div className="absolute inset-4 flex flex-col overflow-hidden rounded-[14px] bg-[#FBF6EC] ring-1 ring-[#DCCDB3] sm:inset-6">
        <div className="flex items-center gap-2 border-b border-[#E5D8C2] px-3 py-2">
          <span className="flex gap-1">{['#D98C6A', '#E3BE6E', '#8FB486'].map((c) => <span key={c} className="h-2 w-2 rounded-full" style={{ background: c }} />)}</span>
          <span className="mx-2 flex-1 truncate rounded-full bg-[#F1E9DB] px-3 py-1 font-mono text-[9.5px] text-[#8F8169]">archdaily.com/agra-fort-arches</span>
          <span className="relative flex h-6 w-6 items-center justify-center rounded-md bg-[#2A241D] font-serif text-[11px] font-semibold text-[#F1E9DB]">
            in
            <AnimatePresence>{step === 4 && <motion.span key="b" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={SPRING} className="absolute -right-1.5 -top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full text-white" style={{ background: TURQ }}><Check className="h-2.5 w-2.5" strokeWidth={3} /></motion.span>}</AnimatePresence>
          </span>
        </div>
        <div className="flex-1 p-5">
          <p className={`${label} text-[#8F8169]`}>Architecture · Agra</p>
          <p className="mt-2 max-w-[16rem] font-serif text-[24px] leading-tight text-[#2A241D]">The scalloped arches of Agra Fort</p>
          <div className="relative mt-4 h-[200px] overflow-hidden rounded-lg sm:h-[230px]">
            <Image src="/landing/8.webp" alt="" fill sizes="460px" className="object-cover object-[50%_38%]" />
            <motion.div className="absolute inset-0 rounded-lg border-4" style={{ borderColor: TURQ }} initial={false} animate={{ opacity: step === 4 ? [0, 0.9, 0] : 0 }} transition={{ duration: 0.9 }} />
          </div>
        </div>
      </div>
      <AnimatePresence>
        {menu && (
          <motion.div key="m" className="absolute left-[44%] top-[44%] z-20 w-[200px] origin-top-left rounded-xl bg-[#FBF6EC] p-1 text-[12px] text-[#3A3128] ring-1 ring-[#DCCDB3] shadow-[0_18px_40px_-12px_rgba(40,28,12,0.45)]"
            initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.16 }}>
            {([[ExternalLink, 'Open image in new tab'], [Copy, 'Copy image']] as const).map(([Icon, t]) => <div key={t} className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[#5E5446]"><Icon className="h-3.5 w-3.5" />{t}</div>)}
            <div className="my-1 h-px bg-[#E5D8C2]" />
            <motion.div className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 font-medium" animate={{ backgroundColor: step >= 2 ? '#E5F0EF' : 'rgba(0,0,0,0)', color: step >= 2 ? TURQ : '#3A3128' }} transition={{ duration: 0.15 }}>
              <BookmarkPlus className="h-3.5 w-3.5" />Save to inntoit<ChevronRight className="ml-auto h-3 w-3 opacity-50" />
            </motion.div>
            <div className="my-1 h-px bg-[#E5D8C2]" />
            <div className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[#5E5446]"><Printer className="h-3.5 w-3.5" />Print…</div>
          </motion.div>
        )}
      </AnimatePresence>
      <Pointer x={step === 0 ? '30%' : step === 1 ? '44%' : step <= 3 ? '58%' : '70%'} y={step === 0 ? '80%' : step === 1 ? '44%' : step <= 3 ? '61%' : '84%'} press={step === 1 || step === 3} />
      <div className="absolute inset-x-8 bottom-7 flex items-center gap-2 font-mono text-[10px] tracking-[0.18em] uppercase text-[#5E5446] sm:inset-x-10 sm:bottom-9"><BookmarkPlus className="h-3.5 w-3.5" style={{ color: TURQ }} />Right-click anything</div>
    </div>
  )
}

// ---------- the iPhone share sheet ----------
export function ShareSheetDemo() {
  const ref = useRef<HTMLDivElement>(null)
  // 0 tap Share · 1 sheet rises · 2 tap inntoit · 3 sheet goes, banner drops · 4 rest
  const { step } = useSteps([1100, 1200, 600, 2600, 700], ref)
  const sheet = step === 1 || step === 2
  return (
    <div ref={ref} className="relative flex h-full min-h-[480px] items-center justify-center overflow-hidden rounded-[22px] bg-[#E8DCC7] ring-1 ring-[#D3C3A7]">
      <div className="relative h-[440px] w-[220px] rounded-[38px] bg-[#2A241D] p-[7px] shadow-[0_30px_60px_-24px_rgba(40,28,12,0.6)]">
        <div className="relative h-full w-full overflow-hidden rounded-[32px] bg-[#F1E9DB]">
          <div className="absolute left-1/2 top-2 z-30 h-5 w-20 -translate-x-1/2 rounded-full bg-[#2A241D]" />
          <div className="absolute inset-x-0 top-9 flex items-center gap-2 px-3"><span className="relative h-6 w-6 overflow-hidden rounded-full"><Image src="/landing/9.webp" alt="" fill sizes="24px" className="object-cover" /></span><span className="text-[10.5px] font-semibold text-[#2A241D]">courtyard.journal</span></div>
          <div className="absolute inset-x-3 top-[68px] aspect-[4/5] overflow-hidden rounded-xl"><Image src="/landing/9.webp" alt="" fill sizes="200px" className="object-cover" /></div>
          <div className="absolute inset-x-3 top-[318px] flex items-center gap-3 text-[#2A241D]"><Heart className="h-4 w-4" /><MessageCircle className="h-4 w-4" /><svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg></div>
          <p className="absolute inset-x-3 top-[342px] text-[10px] leading-snug text-[#5E5446]">Morning light through the orange trees.</p>
          <motion.div initial={false} animate={{ y: sheet ? 0 : 280 }} transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            className="absolute inset-x-0 bottom-0 z-20 rounded-t-[22px] bg-[#FBF6EC]/95 px-3 pb-5 pt-3 ring-1 ring-[#DCCDB3] backdrop-blur">
            <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-[#CDBEA4]" />
            <div className="flex justify-between">
              {[{ k: 'inntoit', on: true, c: '#2A241D' }, { k: 'Messages', c: '#7FB77E' }, { k: 'Mail', c: '#6FA3C7' }, { k: 'Notes', c: '#E8C46A' }].map((a) => (
                <div key={a.k} className="flex w-11 flex-col items-center gap-1">
                  <motion.span animate={{ scale: a.on && step === 2 ? 0.88 : 1 }} transition={{ duration: 0.12 }} className="flex h-11 w-11 items-center justify-center rounded-[12px]" style={{ background: a.c }}>{a.on && <span className="font-serif text-[15px] font-semibold text-[#F1E9DB]">in</span>}</motion.span>
                  <span className="text-[8.5px] text-[#5E5446]">{a.k}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-1.5">{['Copy link', 'Add to Reading List'].map((t) => <div key={t} className="rounded-lg bg-white/70 px-2.5 py-1.5 text-[10.5px] text-[#3A3128]">{t}</div>)}</div>
          </motion.div>
          <AnimatePresence>
            {step === 3 && (
              <motion.div key="toast" className="absolute inset-x-2 top-8 z-40 flex items-center gap-2 rounded-2xl bg-[#FBF6EC]/95 px-3 py-2 shadow-lg ring-1 ring-[#DCCDB3] backdrop-blur"
                initial={{ y: -70, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -70, opacity: 0 }} transition={{ type: 'spring', stiffness: 320, damping: 28 }}>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#2A241D] font-serif text-[11px] font-semibold text-[#F1E9DB]">in</span>
                <div className="leading-tight"><p className="text-[10.5px] font-semibold text-[#2A241D]">Saved to inntoit</p><p className="text-[9.5px] text-[#8F8169]">courtyard.journal · Instagram</p></div>
              </motion.div>
            )}
          </AnimatePresence>
          <Pointer touch x={step === 0 ? '62%' : step <= 2 ? '22%' : '50%'} y={step === 0 ? '77%' : step <= 2 ? '80%' : '96%'} press={step === 0 || step === 2} />
        </div>
      </div>
      <div className="absolute inset-x-8 bottom-7 flex items-center gap-2 font-mono text-[10px] tracking-[0.18em] uppercase text-[#5E5446] sm:inset-x-10 sm:bottom-9"><svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke={TURQ} strokeWidth="2"><rect x="6" y="2" width="12" height="20" rx="3" /></svg>iPhone · Share sheet</div>
    </div>
  )
}

// ---------- search: typed at a human pace; the wall narrows to the matches ----------
const ALL = [
  { k: 'x', tags: 'door kyoto', el: <XCard /> }, { k: 'r', tags: 'door jaipur', el: <RedditCard /> },
  { k: 'a', tags: 'courtyard orange', el: <ArticleCard /> }, { k: 'n', tags: 'café door arches', el: <NoteCard /> },
  { k: 'v', tags: 'courtyard lanterns', el: <VideoCard /> }, { k: 'l', tags: 'window', el: <LinkCard /> },
]
const WORDS = ['door', 'courtyard']
export function SearchDemo() {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const visible = useInView(ref, { margin: '-15%' })
  const [typed, setTyped] = useState('')
  useEffect(() => {
    if (reduce) { setTyped(WORDS[0]); return }
    if (!visible) return
    let w = 0, i = 0, dir = 1
    let t: ReturnType<typeof setTimeout>
    const tick = () => {
      const word = WORDS[w]
      i += dir
      setTyped(word.slice(0, i))
      if (dir > 0 && i === word.length) { dir = -1; t = setTimeout(tick, 2600); return }
      if (dir < 0 && i === 0) { dir = 1; w = (w + 1) % WORDS.length; t = setTimeout(tick, 900); return }
      // people type unevenly: a little quicker mid-word, a short pause now and then
      t = setTimeout(tick, dir > 0 ? 90 + Math.random() * 140 + (Math.random() < 0.12 ? 220 : 0) : 45)
    }
    t = setTimeout(tick, 700)
    return () => clearTimeout(t)
  }, [reduce, visible])
  const q = typed.trim()
  const shown = q.length >= 3 ? ALL.filter((c) => c.tags.split(' ').some((tag) => tag.startsWith(q))) : ALL
  return (
    <div ref={ref} className="rounded-[20px] bg-[#EFE5D3] p-4 ring-1 ring-[#D3C3A7] sm:p-5">
      <div className="flex h-11 items-center gap-2.5 rounded-full bg-[#FBF6EC] px-4 ring-1 ring-[#DCCDB3]">
        <Search className="h-4 w-4" style={{ color: TURQ }} />
        <span className="text-[14px] text-[#2A241D]">{typed}<span className="ml-0.5 inline-block h-4 w-[1.5px] translate-y-[3px] animate-pulse" style={{ background: TURQ }} /></span>
        <span className={`${label} ml-auto text-[#8F8169]`}>{q.length >= 3 ? `${shown.length} found` : '314 saves'}</span>
      </div>
      <div className="relative mt-4 h-[380px] overflow-hidden sm:h-[420px]">
      <div className="grid grid-cols-2 items-start gap-3 sm:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {shown.map((c) => (
            <motion.div key={c.k} layout initial={{ opacity: 0, scale: 0.94, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94 }} transition={{ type: 'spring', stiffness: 240, damping: 26 }}>
              {c.el}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#EFE5D3] to-transparent" />
      </div>
    </div>
  )
}

// ---------- the focus view: the save on the left, your notes on the right, written as you think ----------
const NOTE = 'Scalloped arch, five lobes. Sandstone, not marble: warmer. Ask about cost per arch for the café front. Pair with the turquoise door.'
export function FocusDemo() {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const visible = useInView(ref, { margin: '-15%' })
  const [n, setN] = useState(0)
  useEffect(() => {
    if (reduce) { setN(NOTE.length); return }
    if (!visible) return
    let i = 0
    let t: ReturnType<typeof setTimeout>
    const tick = () => {
      i++
      setN(i)
      if (i >= NOTE.length) { t = setTimeout(() => { i = 0; setN(0); t = setTimeout(tick, 600) }, 3800); return }
      const ch = NOTE[i - 1]
      // pauses after a sentence or a comma, like someone thinking while they write
      t = setTimeout(tick, ch === '.' || ch === ':' ? 420 : ch === ',' ? 220 : ch === ' ' ? 70 : 38 + Math.random() * 60)
    }
    t = setTimeout(tick, 600)
    return () => clearTimeout(t)
  }, [reduce, visible])
  return (
    <div ref={ref} className="overflow-hidden rounded-[22px] bg-[#E9DECB] p-2 ring-1 ring-[#D3C3A7] shadow-[0_40px_90px_-40px_rgba(60,40,15,0.5)]">
      <div className="grid overflow-hidden rounded-[16px] bg-[#FBF6EC] md:grid-cols-[1.1fr_0.9fr]">
        <div className="relative min-h-[260px] md:min-h-[440px]">
          <Image src="/landing/8.webp" alt="" fill sizes="(min-width: 768px) 560px, 92vw" className="object-cover object-[50%_40%]" />
          <span className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#FBF6EC]/90 text-[#2A241D] shadow"><XIcon className="h-4 w-4" /></span>
        </div>
        <div className="flex flex-col border-t border-[#E5D8C2] p-5 sm:p-6 md:border-l md:border-t-0">
          <p className={`${label} text-[#8F8169]`}>archdaily.com · saved Tuesday</p>
          <p className="mt-2 font-serif text-[26px] leading-tight text-[#2A241D]">The scalloped arches of Agra Fort</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {['Café build', 'Arches'].map((t, i) => <span key={t} className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[10.5px]" style={{ background: i ? '#F3E6D6' : '#E3EFEE', color: i ? WOOD : TURQ }}><FolderOpen className="h-3 w-3" />{t}</span>)}
          </div>
          <div className="mt-5 h-px bg-[#E5D8C2]" />
          <p className={`${label} mt-5 flex items-center gap-1.5`} style={{ color: TURQ }}><StickyNote className="h-3 w-3" />Your note</p>
          <p className="mt-2 min-h-[120px] font-serif text-[18px] italic leading-relaxed text-[#3A3128]">
            {NOTE.slice(0, n)}<span className="ml-0.5 inline-block h-[18px] w-[1.5px] translate-y-[3px] animate-pulse" style={{ background: TURQ }} />
          </p>
          <p className="mt-auto pt-4 font-mono text-[9.5px] tracking-[0.18em] uppercase text-[#8F8169]">Saved automatically</p>
        </div>
      </div>
    </div>
  )
}

// ---------- folders: a save is picked up and dropped into a folder ----------
export function FolderDemo() {
  const ref = useRef<HTMLDivElement>(null)
  // 0 rest · 1 pick up · 2 carry to the folder · 3 drop: the folder opens and counts up · 4 rest
  const { step } = useSteps([1200, 500, 900, 1800, 700], ref)
  const carried = step === 1 || step === 2
  return (
    <div ref={ref} className="relative h-[420px] overflow-hidden rounded-[22px] bg-[#EFE5D3] ring-1 ring-[#D3C3A7]">
      <div className="absolute left-5 top-5 w-[52%] space-y-1.5 sm:w-[46%]">
        <p className={`${label} mb-3 text-[#8F8169]`}>Folders</p>
        {([['Café build', 24], ['Doors & windows', 61], ['Reading', 33], ['Recipes', 12]] as const).map(([t, c], i) => {
          const target = i === 0
          return (
            <motion.div key={t} animate={{ backgroundColor: target && step === 3 ? '#E3EFEE' : 'rgba(251,246,236,0.7)', scale: target && step === 2 ? 1.03 : 1 }} transition={{ duration: 0.25 }}
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] text-[#3A3128] ring-1 ring-[#DCCDB3]">
              {target && step === 3 ? <FolderOpen className="h-4 w-4" style={{ color: TURQ }} /> : <Folder className="h-4 w-4" style={{ color: WOOD }} />}
              {t}
              <span className="ml-auto font-mono text-[10px] text-[#8F8169]">{target && step >= 3 ? c + 1 : c}</span>
            </motion.div>
          )
        })}
        <p className="flex items-center gap-1.5 pl-3 pt-1 text-[12px] text-[#8F8169]"><ChevronRight className="h-3 w-3" />Inside: Kitchen · Façade · Lighting</p>
      </div>
      <AnimatePresence>
        {step <= 2 && (
          <motion.div key="card" className="absolute z-10 w-[38%] max-w-[200px]" initial={{ opacity: 0, scale: 0.95 }} exit={{ opacity: 0, scale: 0.4, transition: { duration: 0.3 } }}
            animate={{ opacity: 1, left: step <= 1 ? '58%' : '8%', top: step <= 1 ? '18%' : '14%', rotate: carried ? -4 : 0, scale: carried ? 1.05 : 1 }}
            transition={{ left: { duration: 0.9, ease: EASE }, top: { duration: 0.9, ease: [0.5, 0, 0.2, 1] }, rotate: SPRING, scale: SPRING }}
            style={{ filter: carried ? 'drop-shadow(0 18px 22px rgba(40,28,12,0.3))' : 'none' }}>
            <LinkCard img="/landing/10.webp" title="An arch that frames the sea" site="pinterest.com" />
          </motion.div>
        )}
      </AnimatePresence>
      <Pointer x={step === 0 ? '82%' : step <= 1 ? '74%' : '22%'} y={step === 0 ? '80%' : step <= 1 ? '32%' : '28%'} press={carried} />
    </div>
  )
}
