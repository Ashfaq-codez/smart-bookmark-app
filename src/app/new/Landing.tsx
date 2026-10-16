'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { Cormorant_Garamond, IBM_Plex_Mono } from 'next/font/google'
import Lenis from 'lenis'
import { motion, useScroll, useTransform, useSpring, useMotionValue, useReducedMotion, useInView } from 'motion/react'
import { ArrowRight, ArrowUpRight, ShieldCheck, EyeOff, MonitorSmartphone, ImageIcon, MousePointerClick, Smartphone, Search, PenLine } from 'lucide-react'
import { AppWindow, SavePanel, ShareSheet, SearchDemo, XCard, RedditCard, ArticleCard, VideoCard, NoteCard, LinkCard, ink } from './ProductMock'

// The landing page as an architect's portfolio, with the product itself as the subject: warm parchment, fine serif
// headlines, drafting labels ("FIG. 01"), measured lines that draw themselves, and turquoise-to-wood ink accents.
// Smooth scrolling (Lenis) and scroll-linked motion (Motion). Everything still works, without movement, when
// "reduce motion" is on. Always the light paper look, like the login page.

const serif = Cormorant_Garamond({ weight: ['400', '500', '600'], style: ['normal', 'italic'], subsets: ['latin'], display: 'swap', variable: '--font-cormorant' })
const mono = IBM_Plex_Mono({ weight: ['400', '500'], subsets: ['latin'], display: 'swap', variable: '--font-plex' })

// ---------- building blocks ----------

function Fig({ n, children, light = false }: { n: string; children: React.ReactNode; light?: boolean }) {
  return (
    <p className={`font-mono text-[10.5px] tracking-[0.22em] uppercase ${light ? 'text-[#E6D6BF]' : 'text-[#7A6D5A]'}`}>
      <span className={light ? 'text-[#8FD0D6]' : 'text-[#2F7F8C]'}>Fig. {n}</span> <span className="mx-1.5 opacity-50">·</span> {children}
    </p>
  )
}

// a measured line with end ticks and a label, drawn in when it scrolls into view
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
      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#F1E9DB] px-2 font-mono text-[9.5px] tracking-[0.2em] uppercase text-[#8F8169]">{label}</span>
    </div>
  )
}

function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion()
  return (
    <motion.div className={className} initial={reduce ? false : { opacity: 0, y: 30, filter: 'blur(6px)' }} whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-10%' }} transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  )
}

// headline words rising one by one, from behind a mask
function Words({ text, delay = 0 }: { text: string; delay?: number }) {
  const reduce = useReducedMotion()
  return (
    <>
      {text.split(' ').map((w, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.12em] align-bottom">
          <motion.span className="inline-block" initial={reduce ? false : { y: '110%' }} animate={{ y: '0%' }} transition={{ duration: 1, delay: delay + i * 0.07, ease: [0.22, 1, 0.36, 1] }}>
            {w}&nbsp;
          </motion.span>
        </span>
      ))}
    </>
  )
}

function Cta({ children = 'Start saving — free' }: { children?: React.ReactNode }) {
  // the button leans slightly toward the pointer (magnetic)
  const x = useMotionValue(0), y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 200, damping: 15 }), sy = useSpring(y, { stiffness: 200, damping: 15 })
  return (
    <motion.span style={{ x: sx, y: sy }} className="inline-block"
      onPointerMove={(e) => { if (e.pointerType !== 'mouse') return; const r = e.currentTarget.getBoundingClientRect(); x.set((e.clientX - r.left - r.width / 2) * 0.18); y.set((e.clientY - r.top - r.height / 2) * 0.3) }}
      onPointerLeave={() => { x.set(0); y.set(0) }}>
      <Link href="/login"
        className="group inline-flex h-14 items-center gap-3 rounded-full bg-[#2A241D] pl-7 pr-2 text-[15px] font-medium text-[#F1E9DB] transition-colors hover:bg-[#3A3128] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F7F8C] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F1E9DB]">
        {children}
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#3F8C97] to-[#A2683C] text-white transition-transform duration-300 group-hover:rotate-[-35deg]">
          <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
        </span>
      </Link>
    </motion.span>
  )
}

// the product window tilts gently with the pointer, and settles flat as you scroll down
function Tilt({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'start 25%'] })
  const settle = useTransform(scrollYProgress, [0, 1], [reduce ? 0 : 16, 0])
  const scale = useTransform(scrollYProgress, [0, 1], [reduce ? 1 : 0.93, 1])
  const px = useMotionValue(0), py = useMotionValue(0)
  const tx = useSpring(py, { stiffness: 120, damping: 20 }), ty = useSpring(px, { stiffness: 120, damping: 20 })
  const rotateX = useTransform(() => settle.get() - tx.get() * 8)
  const rotateY = useTransform(() => ty.get() * 10)
  return (
    <div ref={ref} className="[perspective:1600px]"
      onPointerMove={(e) => { if (reduce || e.pointerType !== 'mouse') return; const r = e.currentTarget.getBoundingClientRect(); px.set((e.clientX - r.left) / r.width - 0.5); py.set((e.clientY - r.top) / r.height - 0.5) }}
      onPointerLeave={() => { px.set(0); py.set(0) }}>
      <motion.div style={{ rotateX, rotateY, scale, transformOrigin: '50% 0%' }}>{children}</motion.div>
    </div>
  )
}

// steps through a demo (0, 1, 0, 1…) only while it's on screen
function useLoop(ms: number[], active: boolean) {
  const [i, setI] = useState(0)
  useEffect(() => {
    if (!active) return
    let k = 0
    let t: ReturnType<typeof setTimeout>
    const next = () => { t = setTimeout(() => { k = (k + 1) % ms.length; setI(k); next() }, ms[k]) }
    next()
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])
  return i
}

// ---------- page ----------

export default function Landing() {
  const reduce = useReducedMotion()

  // smooth, weighted scrolling; off when motion is turned down
  useEffect(() => {
    if (reduce) return
    const lenis = new Lenis({ lerp: 0.09, smoothWheel: true })
    let raf = 0
    const loop = (t: number) => { lenis.raf(t); raf = requestAnimationFrame(loop) }
    raf = requestAnimationFrame(loop)
    // in-page links (#save…) glide too
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest('a[href^="#"]') as HTMLAnchorElement | null
      if (!a) return
      e.preventDefault()
      lenis.scrollTo(a.getAttribute('href')!, { offset: -90 })
    }
    document.addEventListener('click', onClick)
    return () => { cancelAnimationFrame(raf); document.removeEventListener('click', onClick); lenis.destroy() }
  }, [reduce])

  const saveRef = useRef<HTMLDivElement>(null)
  const saveOn = useInView(saveRef, { margin: '-20%' })
  const panelStep = useLoop([1600, 2200], saveOn && !reduce)
  const sheetStep = useLoop([1300, 2600], saveOn && !reduce)

  // "Keep": the cards slide sideways while the section stays pinned
  const rail = useRef<HTMLDivElement>(null)
  const { scrollYProgress: railP } = useScroll({ target: rail, offset: ['start start', 'end end'] })
  const railX = useTransform(railP, [0, 1], ['0%', reduce ? '0%' : '-55%'])

  const court = useRef<HTMLDivElement>(null)
  const { scrollYProgress: courtP } = useScroll({ target: court, offset: ['start end', 'end start'] })
  const courtY = useTransform(courtP, [0, 1], reduce ? ['0%', '0%'] : ['-10%', '10%'])

  const { scrollYProgress } = useScroll()
  const bar = useSpring(scrollYProgress, { stiffness: 120, damping: 30 })

  return (
    <main
      className={`${serif.variable} ${mono.variable} min-h-dvh overflow-x-clip bg-[#F1E9DB] text-[#2A241D] selection:bg-[#3F8C97]/25 [background-image:radial-gradient(rgba(120,95,60,0.07)_1px,transparent_1px)] [background-size:22px_22px]`}
      style={{ ['--font-serif' as string]: 'var(--font-cormorant), Georgia, serif', ['--font-mono' as string]: 'var(--font-plex), ui-monospace, monospace' }}
    >
      {/* reading progress: a thin turquoise-to-wood line */}
      <motion.div style={{ scaleX: bar }} className="fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-gradient-to-r from-[#3F8C97] to-[#A2683C]" />

      {/* ---------- top bar ---------- */}
      <header className="fixed inset-x-0 top-0 z-50 px-4 sm:px-6">
        <div className="mx-auto mt-4 flex max-w-6xl items-center justify-between gap-4 rounded-full border border-[#D9CBB2]/80 bg-[#F1E9DB]/75 px-4 py-2.5 backdrop-blur-md sm:px-6">
          <Link href="/new" className="font-serif text-[24px] font-semibold leading-none tracking-tight">inntoit</Link>
          <nav className="hidden items-center gap-8 font-mono text-[11px] tracking-[0.2em] uppercase text-[#5E5446] md:flex">
            <a href="#save" className="transition-colors hover:text-[#2F7F8C]">Save</a>
            <a href="#keep" className="transition-colors hover:text-[#2F7F8C]">Keep</a>
            <a href="#find" className="transition-colors hover:text-[#2F7F8C]">Find</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden h-9 items-center px-4 text-[14px] text-[#5E5446] transition-colors hover:text-[#2A241D] sm:inline-flex">Sign in</Link>
            <Link href="/login" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#2A241D] px-4 text-[13.5px] text-[#F1E9DB] transition-colors hover:bg-[#3A3128]">Begin <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.75} /></Link>
          </div>
        </div>
      </header>

      {/* ---------- hero: the headline, then the product ---------- */}
      <section className="relative mx-auto max-w-6xl px-4 pt-32 sm:px-6 sm:pt-40">
        {/* a faint elevation drawing behind the headline, like a blueprint under tracing paper */}
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 top-14 hidden h-[560px] w-[460px] opacity-[0.14] mix-blend-multiply [mask-image:radial-gradient(closest-side,black,transparent)] lg:block">
          <Image src="/landing/5.webp" alt="" fill sizes="460px" className="object-contain" priority />
        </div>
        <div className="relative max-w-3xl">
          <Reveal><Fig n="00">Elevation · A home for what you keep</Fig></Reveal>
          <h1 className="mt-6 font-serif text-[clamp(48px,8vw,108px)] font-medium leading-[0.92] tracking-[-0.025em]">
            <Words text="A quiet home for" /><br />
            <Words text="everything" delay={0.25} /> <em className={`font-normal ${ink} pr-2`}><Words text="you save." delay={0.35} /></em>
          </h1>
          <Reveal delay={0.5}>
            <p className="mt-8 max-w-[34rem] text-[17.5px] leading-relaxed text-[#5E5446]">
              inntoit keeps the links, posts, notes and pictures you find, each one looking like itself, on one calm wall that’s
              yours alone. Save in a click on desktop, or from the share sheet on your phone.
            </p>
          </Reveal>
          <Reveal delay={0.6} className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-4">
            <Cta />
            <a href="#save" className="font-mono text-[11px] tracking-[0.2em] uppercase text-[#5E5446] transition-colors hover:text-[#2F7F8C]">See how it works ↓</a>
          </Reveal>
        </div>

        <div className="relative mt-16 sm:mt-24">
          <Dimension label="Plate I · The wall" className="mx-auto mb-5 h-3 w-[min(560px,80%)]" />
          <Tilt><AppWindow /></Tilt>
          <div className="mt-4 flex justify-between font-mono text-[10px] tracking-[0.2em] uppercase text-[#8F8169]">
            <span>Saved · 2 a.m.</span><span className="hidden sm:inline">Scale 1 : 1, your whole mind</span><span>Found · 3 s</span>
          </div>
        </div>
      </section>

      {/* ---------- what it keeps ---------- */}
      <section aria-label="What inntoit keeps" className="mt-24 overflow-hidden border-y border-[#D9CBB2] bg-[#E8DCC7]/60 py-5">
        <motion.div className="flex w-max gap-12 whitespace-nowrap font-serif text-[26px] italic text-[#5E5446]"
          animate={reduce ? undefined : { x: ['0%', '-50%'] }} transition={{ duration: 45, repeat: Infinity, ease: 'linear' }}>
          {[0, 1].map((k) => (
            <div key={k} className="flex gap-12" aria-hidden={k === 1}>
              {['Links', 'Notes', 'X posts', 'Instagram', 'Reddit threads', 'YouTube', 'Substack', 'Medium', 'Threads', 'Spotify', 'Hacker News', 'Pictures', 'PDFs'].map((w) => (
                <span key={w} className="flex items-center gap-12">{w}<span className="bg-gradient-to-br from-[#3F8C97] to-[#A2683C] bg-clip-text text-[14px] not-italic text-transparent">✦</span></span>
              ))}
            </div>
          ))}
        </motion.div>
      </section>

      {/* ---------- 01 save: the extension and the share sheet, live ---------- */}
      <section id="save" ref={saveRef} className="mx-auto max-w-6xl px-4 py-28 sm:px-6 sm:py-36">
        <div className="max-w-2xl">
          <Reveal><Fig n="01">Save</Fig></Reveal>
          <Reveal delay={0.08}>
            <h2 className="mt-5 font-serif text-[clamp(38px,5.4vw,66px)] font-medium leading-[1] tracking-[-0.02em]">
              One click on desktop. <em className={`font-normal ${ink}`}>One tap on your phone.</em>
            </h2>
          </Reveal>
        </div>
        <div className="mt-16 grid gap-6 lg:grid-cols-2">
          <Reveal>
            <div className="relative h-[480px] overflow-hidden rounded-[22px] bg-[#E8DCC7] ring-1 ring-[#D3C3A7]">
              {/* a page being read, with the save panel over it */}
              <div className="absolute inset-5 rounded-[14px] bg-[#FBF6EC] p-6 ring-1 ring-[#DCCDB3] sm:inset-6">
                <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-[#8F8169]">archdaily.com</p>
                <p className="mt-3 max-w-[15rem] font-serif text-[26px] leading-tight">The Haveli Facades of Jaisalmer</p>
                <div className="mt-4 space-y-2">{[92, 84, 88, 60].map((w) => <div key={w} className="h-2 rounded-full bg-[#E8DCC7]" style={{ width: `${w}%` }} />)}</div>
                <div className="relative mt-5 h-40 overflow-hidden rounded-lg"><Image src="/landing/5.webp" alt="" fill sizes="400px" className="object-cover object-[50%_40%]" /></div>
              </div>
              <div className="absolute right-4 top-16 scale-[0.88] origin-top-right sm:right-10 sm:top-12 sm:scale-100">
                <SavePanel saved={panelStep === 1} />
              </div>
              {/* the pointer moving in and clicking Save */}
              {!reduce && (
                <motion.div aria-hidden="true" className="absolute z-10" initial={false}
                  animate={{ left: panelStep === 0 ? '55%' : '72%', top: panelStep === 0 ? '80%' : '60%', scale: panelStep === 1 ? [1, 0.8, 1] : 1 }}
                  transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}>
                  <MousePointerClick className="h-6 w-6 fill-[#FBF6EC] text-[#2A241D]" strokeWidth={1.5} />
                </motion.div>
              )}
              <div className="absolute inset-x-6 bottom-8 flex items-center gap-2 font-mono text-[10px] tracking-[0.18em] uppercase text-[#5E5446]"><MousePointerClick className="h-3.5 w-3.5 text-[#2F7F8C]" />Chrome · icon or right-click</div>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="relative flex h-[480px] items-center justify-center overflow-hidden rounded-[22px] bg-[#E8DCC7] ring-1 ring-[#D3C3A7]">
              <ShareSheet open={sheetStep === 1} />
              <div className="absolute inset-x-6 bottom-5 flex items-center gap-2 font-mono text-[10px] tracking-[0.18em] uppercase text-[#5E5446]"><Smartphone className="h-3.5 w-3.5 text-[#2F7F8C]" />iPhone · share sheet</div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- 02 keep: every kind of save keeps its shape (pinned, slides sideways) ---------- */}
      <section id="keep" ref={rail} className="relative h-[240vh] border-y border-[#D9CBB2] bg-[#E8DCC7]/50">
        <div className="sticky top-0 flex h-dvh flex-col justify-center overflow-hidden">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <Fig n="02">Keep</Fig>
            <h2 className="mt-5 max-w-3xl font-serif text-[clamp(36px,5.4vw,66px)] font-medium leading-[1] tracking-[-0.02em]">
              An X post stays an X post. <em className={`font-normal ${ink}`}>Everything keeps its shape.</em>
            </h2>
          </div>
          <motion.div style={{ x: railX }} className="mt-10 flex w-max items-start gap-6 pl-4 sm:mt-12 sm:pl-[max(1.5rem,calc((100vw-72rem)/2+1.5rem))]">
            {[
              { el: <XCard />, l: 'X post', d: 'Author, text and counts' },
              { el: <RedditCard />, l: 'Reddit', d: 'Subreddit, title, picture' },
              { el: <ArticleCard />, l: 'Substack & Medium', d: 'Cover, author, reading time' },
              { el: <VideoCard />, l: 'YouTube', d: 'Plays right on the card' },
              { el: <NoteCard />, l: 'Your notes', d: 'Beside any save, or alone' },
              { el: <LinkCard />, l: 'Any website', d: 'A picture that lasts' },
            ].map((c, i) => (
              <div key={c.l} className="w-[240px] shrink-0 sm:w-[290px]" style={{ marginTop: i % 2 ? 40 : 0 }}>
                {c.el}
                <p className="mt-4 font-mono text-[10px] tracking-[0.2em] uppercase text-[#2F7F8C]">0{i + 1} · {c.l}</p>
                <p className="mt-1 font-serif text-[19px] italic text-[#5E5446]">{c.d}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ---------- 03 find: search narrows the wall as you type ---------- */}
      <section id="find" className="mx-auto max-w-6xl px-4 py-28 sm:px-6 sm:py-36">
        <div className="grid items-center gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <Reveal><Fig n="03">Find</Fig></Reveal>
            <Reveal delay={0.08}>
              <h2 className="mt-5 font-serif text-[clamp(38px,5.4vw,62px)] font-medium leading-[1] tracking-[-0.02em]">
                Type a word. <em className={`font-normal ${ink}`}>It’s already there.</em>
              </h2>
            </Reveal>
            <Reveal delay={0.16}>
              <ul className="mt-8 space-y-4 text-[15.5px] text-[#5E5446]">
                {([[Search, 'Search titles, notes and the text of every save'], [PenLine, 'Write your own notes beside anything'], [MonitorSmartphone, 'Folders inside folders, the same on every device']] as const).map(([Icon, t]) => (
                  <li key={t} className="flex items-start gap-3"><Icon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[#2F7F8C]" strokeWidth={1.5} />{t}</li>
                ))}
              </ul>
            </Reveal>
          </div>
          <Reveal delay={0.1}><SearchDemo /></Reveal>
        </div>
      </section>

      {/* ---------- the courtyard: one atmospheric pause ---------- */}
      <section ref={court} className="relative h-[80vh] min-h-[520px] overflow-hidden bg-[#2A241D]" aria-label="Not a feed. A place.">
        <motion.div style={{ y: courtY }} className="absolute inset-[-12%_0]">
          <Image src="/landing/4.webp" alt="" fill sizes="100vw" className="object-cover object-[50%_38%] opacity-80" />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#1E1913]/90 via-[#1E1913]/30 to-[#1E1913]/40" />
        <div className="relative mx-auto flex h-full max-w-6xl flex-col justify-end px-4 pb-16 sm:px-6 sm:pb-24">
          <Reveal><Fig n="04" light>The courtyard</Fig></Reveal>
          <Reveal delay={0.08}>
            <p className="mt-5 max-w-3xl font-serif text-[clamp(42px,6.6vw,88px)] font-medium leading-[0.96] tracking-[-0.02em] text-[#F6EEE1]">
              Not a feed.<br /><em className="bg-gradient-to-r from-[#8FD0D6] to-[#E7B48A] bg-clip-text pr-2 font-normal text-transparent">A place.</em>
            </p>
          </Reveal>
          <Reveal delay={0.16}><p className="mt-6 max-w-md text-[16px] leading-relaxed text-[#E6DACA]/85">Nothing here is ranked, pushed or sold. It’s a room you walk into when you want to, and everything is still on the wall.</p></Reveal>
        </div>
      </section>

      {/* ---------- the house rules ---------- */}
      <section className="mx-auto max-w-6xl px-4 py-28 sm:px-6 sm:py-32">
        <Reveal><Fig n="05">The house</Fig></Reveal>
        <Reveal delay={0.08}><h2 className="mt-5 max-w-2xl font-serif text-[clamp(36px,5vw,58px)] font-medium leading-[1.02] tracking-[-0.015em]">Built like a home, <em className={`font-normal ${ink}`}>not a shop.</em></h2></Reveal>
        <div className="mt-14 grid gap-px overflow-hidden rounded-[20px] bg-[#D9CBB2] ring-1 ring-[#D9CBB2] sm:grid-cols-2 lg:grid-cols-4">
          {[
            { I: ShieldCheck, t: 'Private by default', d: 'Your wall is yours. Nobody else sees it.' },
            { I: EyeOff, t: 'No ads, no feed', d: 'Nothing ranked, nothing pushed at you.' },
            { I: MonitorSmartphone, t: 'Desktop & phone', d: 'Chrome extension and iPhone share sheet, one library.' },
            { I: ImageIcon, t: 'Pictures that last', d: 'Previews are kept with your save, so they never vanish.' },
          ].map(({ I, t, d }) => (
            <div key={t} className="group h-full bg-[#F1E9DB] p-7 transition-colors duration-500 hover:bg-[#F7F0E3]">
              <I className="h-6 w-6 text-[#2F7F8C] transition-transform duration-500 group-hover:-translate-y-0.5" strokeWidth={1.4} />
              <h3 className="mt-6 font-serif text-[24px] font-medium leading-tight">{t}</h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-[#5E5446]">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- come in ---------- */}
      <section className="relative overflow-hidden border-t border-[#D9CBB2] px-4 py-28 text-center sm:px-6 sm:py-36">
        <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 opacity-[0.2] mix-blend-multiply [mask-image:radial-gradient(closest-side,black_40%,transparent)]">
          <Image src="/landing/6.webp" alt="" fill sizes="520px" className="object-contain" />
        </div>
        <div className="relative">
          <Dimension label="Your door" className="mx-auto mb-12 h-3 w-[min(420px,80%)]" />
          <Reveal>
            <h2 className="mx-auto max-w-3xl font-serif text-[clamp(44px,7vw,96px)] font-medium leading-[0.95] tracking-[-0.025em]">
              Come in.<br /><em className={`font-normal ${ink} pr-2`}>Make yourself at home.</em>
            </h2>
          </Reveal>
          <Reveal delay={0.12} className="mt-11 flex justify-center"><Cta>Open your door — free</Cta></Reveal>
        </div>
      </section>

      <footer className="border-t border-[#D9CBB2]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 font-mono text-[10.5px] tracking-[0.2em] uppercase text-[#8F8169] sm:flex-row sm:px-6">
          <span className="font-serif text-[22px] font-semibold normal-case tracking-tight text-[#2A241D]">inntoit</span>
          <span>Drawn with care · {new Date().getFullYear()}</span>
          <Link href="/login" className="transition-colors hover:text-[#2F7F8C]">Sign in →</Link>
        </div>
      </footer>
    </main>
  )
}
