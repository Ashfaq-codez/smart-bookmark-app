'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { Cormorant_Garamond, IBM_Plex_Mono } from 'next/font/google'
import Lenis from 'lenis'
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useMotionValue, useReducedMotion } from 'motion/react'
import { ArrowRight, ArrowUpRight, ShieldCheck, EyeOff, MonitorSmartphone, ImageIcon, Search, PenLine, FolderTree, Plus, Check, Ruler, BookOpen, ChefHat, GraduationCap } from 'lucide-react'
import { ArchShape } from './Arch'
import { AppWindow, ContextMenuDemo, ShareSheetDemo, SearchDemo, FocusDemo, FolderDemo, XCard, RedditCard, ArticleCard, VideoCard, NoteCard, LinkCard, TURQ, WOOD } from './ProductMock'

// The landing page as an architect's portfolio, with the product as the subject: warm parchment, fine serif
// headlines, drafting labels ("FIG. 01"), measured lines that draw themselves. Two accent inks, used separately:
// turquoise (the doors) and wood (the carved balconies). Smooth scrolling (Lenis), scroll-linked motion and lifelike
// product demos (Motion). Everything still shows, standing still, when "reduce motion" is on.

const serif = Cormorant_Garamond({ weight: ['400', '500', '600'], style: ['normal', 'italic'], subsets: ['latin'], display: 'swap', variable: '--font-cormorant' })
const mono = IBM_Plex_Mono({ weight: ['400', '500'], subsets: ['latin'], display: 'swap', variable: '--font-plex' })
const EASE = [0.22, 1, 0.36, 1] as const

// the two inks
const T = ({ children }: { children: React.ReactNode }) => <em className="font-normal" style={{ color: TURQ }}>{children}</em>
const W = ({ children }: { children: React.ReactNode }) => <em className="font-normal" style={{ color: WOOD }}>{children}</em>

// ---------- building blocks ----------

function Fig({ n, children, light = false }: { n: string; children: React.ReactNode; light?: boolean }) {
  return (
    <p className={`font-mono text-[10.5px] tracking-[0.22em] uppercase ${light ? 'text-[#E6D6BF]' : 'text-[#7A6D5A]'}`}>
      <span style={{ color: light ? '#9FD6DB' : TURQ }}>Fig. {n}</span> <span className="mx-1.5 opacity-50">·</span> {children}
    </p>
  )
}

function Dimension({ label, className = '' }: { label: string; className?: string }) {
  const reduce = useReducedMotion()
  return (
    <div className={`pointer-events-none relative select-none ${className}`} aria-hidden="true">
      <svg className="h-full w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 10">
        <motion.line x1="0" y1="5" x2="100" y2="5" stroke="#B9A88C" strokeWidth="0.7" vectorEffect="non-scaling-stroke"
          initial={reduce ? false : { pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.4, ease: [0.65, 0, 0.35, 1] }} />
        <line x1="0" y1="0" x2="0" y2="10" stroke="#B9A88C" strokeWidth="0.7" vectorEffect="non-scaling-stroke" />
        <line x1="100" y1="0" x2="100" y2="10" stroke="#B9A88C" strokeWidth="0.7" vectorEffect="non-scaling-stroke" />
      </svg>
      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap bg-[#F1E9DB] px-2 font-mono text-[9.5px] tracking-[0.2em] uppercase text-[#8F8169]">{label}</span>
    </div>
  )
}

// rises into place as it scrolls into view; `now` = on page load instead (the hero)
function Reveal({ children, delay = 0, className = '', now = false }: { children: React.ReactNode; delay?: number; className?: string; now?: boolean }) {
  const reduce = useReducedMotion()
  const shown = { opacity: 1, y: 0 }
  return (
    <motion.div className={className} initial={{ opacity: 0, y: 26 }}
      {...(now || reduce ? { animate: shown } : { whileInView: shown, viewport: { once: true, amount: 0.15 } })}
      transition={{ duration: reduce ? 0.3 : 1, delay: reduce ? 0 : delay, ease: EASE }}>
      {children}
    </motion.div>
  )
}

// headline words rise one by one from behind a mask
function Words({ text, delay = 0 }: { text: string; delay?: number }) {
  const reduce = useReducedMotion()
  return (
    <>
      {text.split(' ').map((w, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.12em] align-bottom">
          <motion.span className="inline-block" initial={reduce ? false : { y: '110%', rotate: 3 }} animate={{ y: '0%', rotate: 0 }} transition={{ duration: 1.1, delay: delay + i * 0.08, ease: EASE }}>
            {w}&nbsp;
          </motion.span>
        </span>
      ))}
    </>
  )
}

function Cta({ children = 'Start saving, free', dark = true }: { children?: React.ReactNode; dark?: boolean }) {
  // an arched doorway of a button; it leans a little toward the pointer
  const x = useMotionValue(0), y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 220, damping: 16 }), sy = useSpring(y, { stiffness: 220, damping: 16 })
  return (
    <motion.span style={{ x: sx, y: sy }} className="inline-block"
      onPointerMove={(e) => { if (e.pointerType !== 'mouse') return; const r = e.currentTarget.getBoundingClientRect(); x.set((e.clientX - r.left - r.width / 2) * 0.14); y.set((e.clientY - r.top - r.height / 2) * 0.24) }}
      onPointerLeave={() => { x.set(0); y.set(0) }}>
      <Link href="/login" className="group inline-block rounded-[6px] focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-4" style={{ outlineColor: TURQ }}>
        <ArchShape fill={dark ? '#2A241D' : '#F6EEE1'} line={dark ? 'rgba(231,180,138,0.55)' : 'rgba(162,104,60,0.5)'}
          className={`h-[66px] px-9 pt-[22px] text-[15px] font-medium transition-transform duration-300 group-hover:-translate-y-0.5 ${dark ? 'text-[#F1E9DB]' : 'text-[#2A241D]'}`}>
          {children}
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={1.75} style={{ color: dark ? '#E7B48A' : WOOD }} />
        </ArchShape>
      </Link>
    </motion.span>
  )
}

// the product window tilts toward the pointer and settles flat as it scrolls in
function Tilt({ children }: { children: React.ReactNode }) {
  const reduceMotion = useReducedMotion()
  const [small, setSmall] = useState(true)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const on = () => setSmall(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  const reduce = reduceMotion || small
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'start 25%'] })
  const settle = useTransform(scrollYProgress, [0, 1], [reduce ? 0 : 14, 0])
  const scale = useTransform(scrollYProgress, [0, 1], [reduce ? 1 : 0.94, 1])
  const px = useMotionValue(0), py = useMotionValue(0)
  const tx = useSpring(py, { stiffness: 110, damping: 20 }), ty = useSpring(px, { stiffness: 110, damping: 20 })
  const rotateX = useTransform(() => settle.get() - tx.get() * 6)
  const rotateY = useTransform(() => ty.get() * 8)
  return (
    <div ref={ref} className="[perspective:1700px]"
      onPointerMove={(e) => { if (reduce || e.pointerType !== 'mouse') return; const r = e.currentTarget.getBoundingClientRect(); px.set((e.clientX - r.left) / r.width - 0.5); py.set((e.clientY - r.top) / r.height - 0.5) }}
      onPointerLeave={() => { px.set(0); py.set(0) }}>
      <motion.div style={{ rotateX, rotateY, scale, transformOrigin: '50% 0%' }}>{children}</motion.div>
    </div>
  )
}

// a number that counts up once, when it comes into view
function Count({ to, suffix = '' }: { to: number; suffix?: string }) {
  const reduce = useReducedMotion()
  const [n, setN] = useState(0)
  useEffect(() => { if (reduce) setN(to) }, [reduce, to])
  return (
    <motion.span onViewportEnter={() => {
      if (reduce) return
      const start = performance.now()
      const run = (t: number) => { const p = Math.min(1, (t - start) / 1400); setN(Math.round(to * (1 - Math.pow(1 - p, 3)))); if (p < 1) requestAnimationFrame(run) }
      requestAnimationFrame(run)
    }} viewport={{ once: true }}>{n}{suffix}</motion.span>
  )
}

function Faq({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-[#D3C3A7]">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open}
        className="flex w-full items-center justify-between gap-6 py-6 text-left font-serif text-[22px] leading-snug text-[#2A241D] transition-colors hover:text-[#3A3128] focus:outline-none focus-visible:underline sm:text-[25px]">
        {q}
        <motion.span animate={{ rotate: open ? 45 : 0 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-1 ring-[#C9B89B]" style={{ color: open ? TURQ : WOOD }}>
          <Plus className="h-4 w-4" strokeWidth={1.6} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div key="a" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.45, ease: EASE }} className="overflow-hidden">
            <p className="max-w-2xl pb-7 text-[16px] leading-relaxed text-[#5E5446]">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ---------- page ----------

export default function Landing() {
  const reduce = useReducedMotion()

  // weighted, smooth scrolling; in-page links glide too
  useEffect(() => {
    if (reduce) return
    const lenis = new Lenis({ lerp: 0.085, smoothWheel: true })
    let raf = 0
    const loop = (t: number) => { lenis.raf(t); raf = requestAnimationFrame(loop) }
    raf = requestAnimationFrame(loop)
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest('a[href^="#"]') as HTMLAnchorElement | null
      if (!a) return
      e.preventDefault()
      lenis.scrollTo(a.getAttribute('href')!, { offset: -90, duration: 1.4 })
    }
    document.addEventListener('click', onClick)
    return () => { cancelAnimationFrame(raf); document.removeEventListener('click', onClick); lenis.destroy() }
  }, [reduce])

  // hero picture drifts a little slower than the page (depth)
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress: heroP } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroImgY = useTransform(heroP, [0, 1], ['0%', reduce ? '0%' : '14%'])
  const chipY = useTransform(heroP, [0, 1], ['0%', reduce ? '0%' : '-40%'])

  // Keep: pinned, the cards slide sideways
  const rail = useRef<HTMLDivElement>(null)
  const { scrollYProgress: railP } = useScroll({ target: rail, offset: ['start start', 'end end'] })
  const railX = useTransform(railP, [0, 1], ['0%', reduce ? '0%' : '-55%'])

  const court = useRef<HTMLDivElement>(null)
  const { scrollYProgress: courtP } = useScroll({ target: court, offset: ['start end', 'end start'] })
  const courtY = useTransform(courtP, [0, 1], reduce ? ['0%', '0%'] : ['-5%', '5%'])

  const door = useRef<HTMLDivElement>(null)
  const { scrollYProgress: doorP } = useScroll({ target: door, offset: ['start end', 'end end'] })
  const doorScale = useTransform(doorP, [0, 0.6], reduce ? [1, 1] : [0.94, 1])

  const { scrollYProgress } = useScroll()
  const bar = useSpring(scrollYProgress, { stiffness: 120, damping: 30 })

  return (
    <main
      className={`${serif.variable} ${mono.variable} min-h-dvh overflow-x-clip bg-[#F1E9DB] text-[#2A241D] [background-image:radial-gradient(rgba(120,95,60,0.07)_1px,transparent_1px)] [background-size:22px_22px]`}
      style={{ ['--font-serif' as string]: 'var(--font-cormorant), Georgia, serif', ['--font-mono' as string]: 'var(--font-plex), ui-monospace, monospace' }}
    >
      <motion.div style={{ scaleX: bar, background: TURQ }} className="fixed inset-x-0 top-0 z-[60] h-[2px] origin-left" />

      {/* ---------- top bar ---------- */}
      <header className="fixed inset-x-0 top-0 z-50 px-4 sm:px-6">
        <div className="mx-auto mt-4 flex max-w-6xl items-center justify-between gap-4 rounded-full border border-[#D9CBB2]/80 bg-[#F1E9DB]/80 px-4 py-2.5 backdrop-blur-md sm:px-6">
          <Link href="/new" className="font-serif text-[24px] font-semibold leading-none tracking-tight">inntoit</Link>
          <nav className="hidden items-center gap-7 font-mono text-[11px] tracking-[0.2em] uppercase text-[#5E5446] md:flex">
            {[['#save', 'Save'], ['#keep', 'Keep'], ['#find', 'Find'], ['#real', 'The app'], ['#faq', 'FAQ']].map(([h, t]) => <a key={h} href={h} className="transition-colors hover:text-[#2A241D]">{t}</a>)}
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden h-9 items-center px-4 text-[14px] text-[#5E5446] transition-colors hover:text-[#2A241D] sm:inline-flex">Sign in</Link>
            <Link href="/login" className="group rounded-[4px] focus:outline-none focus-visible:outline-2" style={{ outlineColor: TURQ }}>
              <ArchShape fill="#2A241D" line="rgba(231,180,138,0.5)" className="h-[46px] px-5 pt-[16px] text-[13.5px] text-[#F1E9DB]">Begin <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5" strokeWidth={1.75} style={{ color: '#E7B48A' }} /></ArchShape>
            </Link>
          </div>
        </div>
      </header>

      {/* ---------- hero ---------- */}
      <section ref={heroRef} className="relative mx-auto max-w-6xl px-4 pt-32 sm:px-6 sm:pt-40">
        <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10">
          <div className="relative z-10">
            <Reveal now><Fig n="00">Elevation · A home for what you keep</Fig></Reveal>
            <h1 className="mt-6 font-serif text-[clamp(44px,6.3vw,92px)] font-medium leading-[0.94] tracking-[-0.025em]">
              <Words text="A quiet home for" /><br />
              <Words text="everything" delay={0.25} /> <T><Words text="you" delay={0.35} /></T><W><Words text="save." delay={0.43} /></W>
            </h1>
            <Reveal now delay={0.5}>
              <p className="mt-8 max-w-[33rem] text-[17.5px] leading-relaxed text-[#5E5446]">
                inntoit keeps the links, posts, notes and pictures you find, each one looking like itself, on one calm wall that’s yours alone.
                Save in a click on desktop, or from the share sheet on your phone.
              </p>
            </Reveal>
            <Reveal now delay={0.6} className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-4">
              <Cta />
              <a href="#save" className="font-mono text-[11px] tracking-[0.2em] uppercase text-[#5E5446] transition-colors hover:text-[#2A241D]">See how it works ↓</a>
            </Reveal>
          </div>

          {/* the picture: a painted door, framed like a plate in a drawing, with two saves resting on it */}
          <Reveal now delay={0.2} className="relative mx-auto w-full max-w-[420px]">
            <Dimension label="Plate I" className="mb-4 h-3 w-full" />
            <div className="relative aspect-[3/4] overflow-hidden rounded-t-[999px] ring-1 ring-[#D3C3A7] shadow-[0_40px_80px_-40px_rgba(70,45,20,0.55)]">
              <motion.div style={{ y: heroImgY }} className="absolute inset-[-8%_0]">
                <Image src="/landing/11.webp" alt="A painted wooden door in a pink wall, with a green parrot" fill priority sizes="(min-width: 1024px) 420px, 90vw" className="object-cover object-[50%_70%]" />
              </motion.div>
            </div>
            <motion.div style={{ y: chipY }} className="absolute bottom-16 left-2 w-[200px] rotate-[-3deg] sm:-left-14 sm:w-[210px]">
              <NoteCard text="This pink. This door. Front of the café." />
            </motion.div>
            <motion.div style={{ y: chipY }} className="absolute -right-4 top-24 hidden w-[190px] rotate-[3deg] sm:block lg:-right-10">
              <div className="flex items-center gap-2 rounded-full bg-[#FBF6EC] px-3 py-2 text-[12px] text-[#2A241D] ring-1 ring-[#DCCDB3] shadow-[0_12px_28px_-14px_rgba(40,28,12,0.45)]">
                <span className="flex h-5 w-5 items-center justify-center rounded-full text-white" style={{ background: TURQ }}><Check className="h-3 w-3" strokeWidth={3} /></span>Saved to <b className="font-semibold">Café build</b>
              </div>
            </motion.div>
            <p className="mt-4 flex justify-between font-mono text-[10px] tracking-[0.2em] uppercase text-[#8F8169]"><span>Saved · 2 a.m.</span><span>Found · 3 s</span></p>
          </Reveal>
        </div>

        {/* the product */}
        <div className="relative mt-20 sm:mt-28">
          <Dimension label="Plate II · The wall" className="mx-auto mb-5 h-3 w-[min(560px,80%)]" />
          <Tilt><AppWindow /></Tilt>
        </div>
      </section>

      {/* ---------- what it keeps ---------- */}
      <section aria-label="What inntoit keeps" className="mt-24 overflow-hidden border-y border-[#D9CBB2] bg-[#E8DCC7]/60 py-5">
        <motion.div className="flex w-max gap-12 whitespace-nowrap font-serif text-[26px] italic text-[#5E5446]"
          animate={reduce ? undefined : { x: ['0%', '-50%'] }} transition={{ duration: 45, repeat: Infinity, ease: 'linear' }}>
          {[0, 1].map((k) => (
            <div key={k} className="flex gap-12" aria-hidden={k === 1}>
              {['Links', 'Notes', 'X posts', 'Instagram', 'Reddit threads', 'YouTube', 'Substack', 'Medium', 'Threads', 'Spotify', 'Hacker News', 'LinkedIn', 'Pictures', 'PDFs'].map((w, i) => (
                <span key={w} className="flex items-center gap-12">{w}<span className="text-[14px] not-italic" style={{ color: i % 2 ? WOOD : TURQ }}>✦</span></span>
              ))}
            </div>
          ))}
        </motion.div>
      </section>

      {/* ---------- numbers ---------- */}
      <section className="mx-auto grid max-w-6xl grid-cols-2 gap-px px-4 pt-24 sm:px-6 lg:grid-cols-4" aria-label="inntoit in numbers">
        {[
          { n: 1, s: ' click', d: 'to save from Chrome', c: TURQ },
          { n: 14, s: '', d: 'kinds of saves it understands', c: WOOD },
          { n: 3, s: ' s', d: 'to find anything again', c: TURQ },
          { n: 0, s: '', d: 'ads, feeds or trackers', c: WOOD },
        ].map((x, i) => (
          <Reveal key={x.d} delay={i * 0.06} className="border-t border-[#D3C3A7] py-6 pr-4">
            <p className="font-serif text-[clamp(44px,6vw,72px)] font-medium leading-none" style={{ color: x.c }}><Count to={x.n} suffix={x.s} /></p>
            <p className="mt-3 max-w-[12rem] text-[14.5px] text-[#5E5446]">{x.d}</p>
          </Reveal>
        ))}
      </section>

      {/* ---------- 01 save ---------- */}
      <section id="save" className="mx-auto max-w-6xl px-4 py-28 sm:px-6 sm:py-36">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-end">
          <div>
            <Reveal><Fig n="01">Save</Fig></Reveal>
            <Reveal delay={0.08}><h2 className="mt-5 font-serif text-[clamp(38px,5.4vw,66px)] font-medium leading-[1] tracking-[-0.02em]">One click on <T>desktop.</T> One tap on your <W>phone.</W></h2></Reveal>
          </div>
          <Reveal delay={0.14}><p className="text-[16px] leading-relaxed text-[#5E5446]">Click the inntoit icon, right-click a post, a picture or a passage, or share from any app on your iPhone. The save is on your wall before you’ve looked away.</p></Reveal>
        </div>
        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          <Reveal><ContextMenuDemo /></Reveal>
          <Reveal delay={0.1}><ShareSheetDemo /></Reveal>
        </div>
      </section>

      {/* ---------- 02 keep (pinned rail) ---------- */}
      <section id="keep" ref={rail} className="relative h-[240vh] border-y border-[#D9CBB2] bg-[#E8DCC7]/50">
        <div className="sticky top-0 flex h-dvh flex-col justify-center overflow-hidden">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <Fig n="02">Keep</Fig>
            <h2 className="mt-5 max-w-3xl font-serif text-[clamp(36px,5.4vw,66px)] font-medium leading-[1] tracking-[-0.02em]">An X post stays an X post. <T>Everything</T> keeps its <W>shape.</W></h2>
          </div>
          <motion.div style={{ x: railX }} className="mt-10 flex w-max items-start gap-6 pl-4 sm:mt-12 sm:pl-[max(1.5rem,calc((100vw-72rem)/2+1.5rem))]">
            {[
              { el: <XCard />, l: 'X post', d: 'Author, text and counts' },
              { el: <RedditCard />, l: 'Reddit', d: 'Subreddit, title, picture' },
              { el: <ArticleCard />, l: 'Substack & Medium', d: 'Cover, author, reading time' },
              { el: <VideoCard />, l: 'YouTube', d: 'Plays right on the card' },
              { el: <NoteCard />, l: 'Your notes', d: 'Beside any save, or alone' },
              { el: <LinkCard img="/landing/1.webp" title="Whitewash and timber balconies" site="dezeen.com" pos="object-[50%_40%]" />, l: 'Any website', d: 'A picture that lasts' },
            ].map((c, i) => (
              <div key={c.l} className="w-[240px] shrink-0 sm:w-[290px]" style={{ marginTop: i % 2 ? 40 : 0 }}>
                {c.el}
                <p className="mt-4 font-mono text-[10px] tracking-[0.2em] uppercase" style={{ color: i % 2 ? WOOD : TURQ }}>0{i + 1} · {c.l}</p>
                <p className="mt-1 font-serif text-[19px] italic text-[#5E5446]">{c.d}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ---------- 03 open: the focus view ---------- */}
      <section className="mx-auto max-w-6xl px-4 py-28 sm:px-6 sm:py-36">
        <div className="max-w-2xl">
          <Reveal><Fig n="03">Open</Fig></Reveal>
          <Reveal delay={0.08}><h2 className="mt-5 font-serif text-[clamp(38px,5.4vw,62px)] font-medium leading-[1] tracking-[-0.02em]">Open a save. <T>Think</T> beside <W>it.</W></h2></Reveal>
          <Reveal delay={0.14}><p className="mt-5 text-[16px] leading-relaxed text-[#5E5446]">Every save opens into a quiet room: the post, the video or the page on one side, your own notes on the other. Write as much or as little as you like. It saves as you type.</p></Reveal>
        </div>
        <Reveal delay={0.1} className="mt-14"><FocusDemo /></Reveal>
      </section>

      {/* ---------- 04 find + 05 arrange ---------- */}
      <section id="find" className="border-t border-[#D9CBB2] bg-[#E8DCC7]/40">
        <div className="mx-auto max-w-6xl px-4 py-28 sm:px-6 sm:py-36">
          <div className="grid items-center gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <div>
              <Reveal><Fig n="04">Find</Fig></Reveal>
              <Reveal delay={0.08}><h2 className="mt-5 font-serif text-[clamp(38px,5.4vw,62px)] font-medium leading-[1] tracking-[-0.02em]">Type a word. <T>It’s</T> already <W>there.</W></h2></Reveal>
              <Reveal delay={0.16}>
                <ul className="mt-8 space-y-4 text-[15.5px] text-[#5E5446]">
                  {([[Search, 'Search titles, notes and the text of every save', TURQ], [PenLine, 'Your own notes are searched too', WOOD], [MonitorSmartphone, 'The same results on every device', TURQ]] as const).map(([Icon, t, c]) => (
                    <li key={t} className="flex items-start gap-3"><Icon className="mt-0.5 h-[18px] w-[18px] shrink-0" style={{ color: c }} strokeWidth={1.5} />{t}</li>
                  ))}
                </ul>
              </Reveal>
            </div>
            <Reveal delay={0.1}><SearchDemo /></Reveal>
          </div>

          <div className="mt-32 grid items-center gap-14 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
            <Reveal className="order-2 lg:order-1"><FolderDemo /></Reveal>
            <div className="order-1 lg:order-2">
              <Reveal><Fig n="05">Arrange</Fig></Reveal>
              <Reveal delay={0.08}><h2 className="mt-5 font-serif text-[clamp(38px,5.4vw,62px)] font-medium leading-[1] tracking-[-0.02em]">Rooms inside <T>rooms.</T></h2></Reveal>
              <Reveal delay={0.16}><p className="mt-5 text-[16px] leading-relaxed text-[#5E5446]">Drop saves into folders, and folders into folders: a project, its kitchen, its lighting. Or leave everything on the main wall and let search do the work.</p></Reveal>
              <Reveal delay={0.2}><p className="mt-6 flex items-center gap-2 font-mono text-[10.5px] tracking-[0.2em] uppercase" style={{ color: WOOD }}><FolderTree className="h-4 w-4" />Nested folders · drag and drop</p></Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- the real app: actual screenshots (dark mode) ---------- */}
      <section id="real" className="mx-auto max-w-6xl px-4 py-28 sm:px-6 sm:py-36">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-end">
          <div>
            <Reveal><Fig n="06">Plate III · As it is today</Fig></Reveal>
            <Reveal delay={0.08}><h2 className="mt-5 font-serif text-[clamp(38px,5.4vw,62px)] font-medium leading-[1] tracking-[-0.02em]">The real <T>wall.</T> The real <W>room.</W></h2></Reveal>
          </div>
          <Reveal delay={0.14}><p className="text-[16px] leading-relaxed text-[#5E5446]">Not a mock-up: this is inntoit today, in dark mode. Your wall of saves, and a save opened with its folders and your notes beside it.</p></Reveal>
        </div>
        <div className="relative mt-14 pb-[18%]">
          <Reveal>
            <figure className="overflow-hidden rounded-[18px] bg-[#1C1C1C] p-1.5 ring-1 ring-[#2E2A25] shadow-[0_50px_100px_-40px_rgba(40,28,12,0.65)]">
              <Image src="/landing/real-dashboard.webp" alt="The inntoit dashboard: a wall of saved links, posts and videos" width={1600} height={889} sizes="(min-width: 1152px) 1100px, 94vw" className="h-auto w-full rounded-[13px]" />
            </figure>
          </Reveal>
          <Reveal delay={0.15} className="absolute bottom-0 right-[-2%] w-[62%] sm:right-[-4%]">
            <figure className="overflow-hidden rounded-[16px] bg-[#1C1C1C] p-1.5 ring-1 ring-[#2E2A25] shadow-[0_40px_80px_-30px_rgba(20,14,6,0.7)]">
              <Image src="/landing/real-editor.webp" alt="A save opened in inntoit, with its folder and a notes area" width={1400} height={742} sizes="(min-width: 1152px) 700px, 62vw" className="h-auto w-full rounded-[11px]" />
            </figure>
          </Reveal>
        </div>
        <div className="mt-6 flex justify-between font-mono text-[10px] tracking-[0.2em] uppercase text-[#8F8169]"><span>Fig. 06.a · The wall</span><span>Fig. 06.b · A save, opened</span></div>
      </section>

      {/* ---------- the courtyard: the picture in an arched window, at its own size (stays sharp) ---------- */}
      <section ref={court} className="relative overflow-hidden bg-[#2A241D]" aria-label="Not a feed. A place.">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-24 sm:px-6 sm:py-28 lg:grid-cols-[1fr_0.9fr] lg:gap-16">
          <div>
            <Reveal><Fig n="07" light>The courtyard</Fig></Reveal>
            <Reveal delay={0.08}>
              <p className="mt-5 max-w-3xl font-serif text-[clamp(42px,6vw,84px)] font-medium leading-[0.96] tracking-[-0.02em] text-[#F6EEE1]">
                Not a feed.<br /><em className="font-normal" style={{ color: '#9FD6DB' }}>A</em> <em className="font-normal" style={{ color: '#E7B48A' }}>place.</em>
              </p>
            </Reveal>
            <Reveal delay={0.16}><p className="mt-6 max-w-md text-[16px] leading-relaxed text-[#E6DACA]/85">Nothing here is ranked, pushed or sold. It’s a room you walk into when you want to, and everything is still on the wall.</p></Reveal>
          </div>
          <Reveal delay={0.1} className="mx-auto w-full max-w-[460px]">
            <div className="relative aspect-[4/5] overflow-hidden rounded-t-[999px] ring-1 ring-[#5A4C3C]">
              <motion.div style={{ y: courtY }} className="absolute inset-[-6%_0]">
                <Image src="/landing/7.webp" alt="A lantern-lit arcade with flowers and carpets" fill sizes="460px" className="object-cover" />
              </motion.div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- who it's for ---------- */}
      <section className="mx-auto max-w-6xl px-4 py-28 sm:px-6 sm:py-36">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <Reveal><Fig n="08">Residents</Fig></Reveal>
            <Reveal delay={0.08}><h2 className="mt-5 font-serif text-[clamp(36px,5vw,58px)] font-medium leading-[1.02] tracking-[-0.015em]">For people who <T>collect</T> as they <W>wander.</W></h2></Reveal>
            <Reveal delay={0.14}>
              <div className="relative mt-10 aspect-[4/5] max-w-[380px] overflow-hidden rounded-t-[999px] ring-1 ring-[#D3C3A7]">
                <Image src="/landing/9.webp" alt="A courtyard with orange trees and a fountain" fill sizes="380px" className="object-cover" />
              </div>
            </Reveal>
          </div>
          <div className="grid content-start gap-px self-start overflow-hidden rounded-[20px] bg-[#D9CBB2] ring-1 ring-[#D9CBB2] sm:grid-cols-2">
            {[
              { I: Ruler, t: 'Designers & architects', d: 'Moodboards of doors, materials and references, with a note on why each one mattered.', c: TURQ },
              { I: BookOpen, t: 'Writers & researchers', d: 'Threads, essays and papers in one place, searchable down to your own margin notes.', c: WOOD },
              { I: ChefHat, t: 'Cooks & makers', d: 'Recipes from reels, how-tos from YouTube, plans from Pinterest: no more lost tabs.', c: WOOD },
              { I: GraduationCap, t: 'Students', d: 'Lectures, articles and notes for each course, in folders inside folders.', c: TURQ },
            ].map(({ I, t, d, c }, i) => (
              <Reveal key={t} delay={i * 0.06} className="h-full">
                <div className="group h-full bg-[#F1E9DB] p-7 transition-colors duration-500 hover:bg-[#F7F0E3]">
                  <I className="h-6 w-6 transition-transform duration-500 group-hover:-translate-y-0.5" style={{ color: c }} strokeWidth={1.4} />
                  <h3 className="mt-6 font-serif text-[25px] font-medium leading-tight">{t}</h3>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-[#5E5446]">{d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- the house rules ---------- */}
      <section className="border-y border-[#D9CBB2] bg-[#E8DCC7]/40">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-28">
          <Reveal><Fig n="09">The house</Fig></Reveal>
          <Reveal delay={0.08}><h2 className="mt-5 max-w-2xl font-serif text-[clamp(36px,5vw,58px)] font-medium leading-[1.02] tracking-[-0.015em]">Built like a <T>home,</T> not a <W>shop.</W></h2></Reveal>
          <div className="mt-12 grid gap-x-10 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { I: ShieldCheck, t: 'Private by default', d: 'Your wall is yours. Nobody else sees it.', c: TURQ },
              { I: EyeOff, t: 'No ads, no feed', d: 'Nothing ranked, nothing pushed at you.', c: WOOD },
              { I: MonitorSmartphone, t: 'Desktop & phone', d: 'Chrome extension and iPhone share sheet, one library.', c: TURQ },
              { I: ImageIcon, t: 'Pictures that last', d: 'Previews are kept with your save, so they don’t vanish later.', c: WOOD },
            ].map(({ I, t, d, c }, i) => (
              <Reveal key={t} delay={i * 0.06}>
                <I className="h-6 w-6" style={{ color: c }} strokeWidth={1.4} />
                <h3 className="mt-5 font-serif text-[24px] font-medium leading-tight">{t}</h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-[#5E5446]">{d}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section id="faq" className="mx-auto max-w-6xl px-4 pb-28 sm:px-6 sm:pb-36">
        <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
          <div>
            <Reveal><Fig n="10">Questions</Fig></Reveal>
            <Reveal delay={0.08}><h2 className="mt-5 font-serif text-[clamp(36px,5vw,56px)] font-medium leading-[1.02] tracking-[-0.015em]">Asked at the <T>door.</T></h2></Reveal>
            <Reveal delay={0.14}>
              <div className="relative mt-10 hidden aspect-[3/5] max-w-[300px] overflow-hidden rounded-t-[999px] ring-1 ring-[#D3C3A7] lg:block">
                <Image src="/landing/8.webp" alt="Scalloped stone arches looking out over a city" fill sizes="300px" className="object-cover object-[50%_40%]" />
              </div>
            </Reveal>
          </div>
          <Reveal delay={0.1} className="border-t border-[#D3C3A7]">
            <Faq q="Is inntoit free?" a="Yes. Saving links, notes, posts and pictures is free." />
            <Faq q="What can I save?" a="Any link, plus a proper card for X posts, Instagram, Reddit, YouTube, Substack, Medium, Threads, Spotify, Hacker News and LinkedIn. You can also save a selected passage, a picture, or a note of your own." />
            <Faq q="How do I save from my phone?" a="Add the inntoit Shortcut on your iPhone once. After that, tap Share in any app and choose inntoit. It takes a second." />
            <Faq q="Who can see my saves?" a="Only you. Your wall is private, and nothing you keep is shown to anyone else, ranked or used for ads." />
            <Faq q="What if a post is deleted later?" a="inntoit keeps the text and the picture of each save when you save it, so your card still shows what you saw, even if the original changes." />
            <Faq q="Which browsers work?" a="The extension is made for Chrome. Your wall itself works in any modern browser, on desktop and phone." />
          </Reveal>
        </div>
      </section>

      {/* ---------- come in: the sea through an arched window ---------- */}
      <section ref={door} className="relative overflow-hidden bg-[#2A241D]">
        <div className="mx-auto flex max-w-6xl flex-col items-center px-4 py-24 text-center sm:px-6 sm:py-32">
          <Reveal><Fig n="11" light>Your door</Fig></Reveal>
          <Reveal delay={0.08}>
            <h2 className="mx-auto mt-6 max-w-3xl font-serif text-[clamp(44px,7vw,96px)] font-medium leading-[0.94] tracking-[-0.025em] text-[#F6EEE1]">
              Come in.<br /><em className="font-normal" style={{ color: '#9FD6DB' }}>Make yourself</em> <em className="font-normal" style={{ color: '#E7B48A' }}>at home.</em>
            </h2>
          </Reveal>
          <Reveal delay={0.12} className="mt-12 w-full max-w-[560px]">
            <motion.div style={{ scale: doorScale }} className="relative aspect-[736/1017] max-h-[620px] w-full overflow-hidden rounded-t-[999px] ring-1 ring-[#5A4C3C]">
              <Image src="/landing/10.webp" alt="A carved arch opening onto the sea" fill sizes="560px" className="object-cover object-[50%_40%]" />
            </motion.div>
          </Reveal>
          <Reveal delay={0.16}><p className="mx-auto mt-10 max-w-md text-[16px] leading-relaxed text-[#E6DACA]/90">It takes a few seconds to sign in with Google. Your first save takes one click.</p></Reveal>
          <Reveal delay={0.2} className="mt-8 flex justify-center"><Cta dark={false}>Open your door, free</Cta></Reveal>
        </div>
      </section>

      <footer className="bg-[#F1E9DB]">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-[1.4fr_1fr_1fr] sm:px-6">
          <div>
            <span className="font-serif text-[30px] font-semibold tracking-tight">inntoit</span>
            <p className="mt-3 max-w-xs font-serif text-[18px] italic leading-snug text-[#5E5446]">Collect quietly. Find it when you need it.</p>
          </div>
          <div className="space-y-2.5 text-[14.5px] text-[#5E5446]">
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#8F8169]">The house</p>
            {[['#save', 'Save'], ['#keep', 'Keep'], ['#find', 'Find'], ['#real', 'The app']].map(([h, t]) => <a key={h} href={h} className="block transition-colors hover:text-[#2A241D]">{t}</a>)}
          </div>
          <div className="space-y-2.5 text-[14.5px] text-[#5E5446]">
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#8F8169]">Your door</p>
            <Link href="/login" className="block transition-colors hover:text-[#2A241D]">Sign in</Link>
            <Link href="/login" className="block transition-colors hover:text-[#2A241D]">Start free</Link>
            <a href="#faq" className="block transition-colors hover:text-[#2A241D]">Questions</a>
          </div>
        </div>
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 border-t border-[#D9CBB2] px-4 py-6 font-mono text-[10px] tracking-[0.2em] uppercase text-[#8F8169] sm:flex-row sm:px-6">
          <span>Drawn with care · {new Date().getFullYear()}</span><span>Made for the things worth keeping</span>
        </div>
      </footer>
    </main>
  )
}
