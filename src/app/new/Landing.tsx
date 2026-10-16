'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRef } from 'react'
import { Cormorant_Garamond, IBM_Plex_Mono } from 'next/font/google'
import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react'
import { ArrowRight, ArrowUpRight, MousePointerClick, Smartphone, Search, FolderTree, ShieldCheck, EyeOff, MonitorSmartphone, Sparkles } from 'lucide-react'

// The landing page as an architect's portfolio: warm parchment, fine serif headlines, small drafting labels
// ("FIG. 01"), thin measured lines that draw themselves, and the six architectural drawings (public/landing/1–6.webp).
// Always the light paper look (the drawings are the page), like the login page.

const serif = Cormorant_Garamond({ weight: ['400', '500', '600'], style: ['normal', 'italic'], subsets: ['latin'], display: 'swap' })
const mono = IBM_Plex_Mono({ weight: ['400', '500'], subsets: ['latin'], display: 'swap' })

// colours taken from the drawings
const C = {
  paper: '#F1E9DB', paperDeep: '#E8DCC7', ink: '#2A241D', inkSoft: '#5E5446', line: '#B9A88C',
  terracotta: '#B5603A', turquoise: '#3F8C97', wood: '#A2683C',
}

// ---------- small building blocks ----------

// a drafting label: FIG. 01 · ENTRANCE
function Fig({ n, children, className = '' }: { n: string; children: React.ReactNode; className?: string }) {
  return (
    <p className={`${mono.className} text-[10.5px] tracking-[0.22em] uppercase text-[#7A6D5A] ${className}`}>
      <span className="text-[#B5603A]">Fig. {n}</span> <span className="mx-1.5 opacity-50">·</span> {children}
    </p>
  )
}

// a thin measured line with end ticks and a label in the middle, drawn in as it scrolls into view
function Dimension({ label, vertical = false, className = '' }: { label: string; vertical?: boolean; className?: string }) {
  const reduce = useReducedMotion()
  return (
    <div className={`pointer-events-none select-none ${className}`} aria-hidden="true">
      <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox={vertical ? '0 0 10 100' : '0 0 100 10'}>
        <motion.line
          x1={vertical ? 5 : 0} y1={vertical ? 0 : 5} x2={vertical ? 5 : 100} y2={vertical ? 100 : 5}
          stroke={C.line} strokeWidth="0.6" vectorEffect="non-scaling-stroke"
          initial={reduce ? false : { pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true, margin: '-10%' }}
          transition={{ duration: 1.4, ease: [0.65, 0, 0.35, 1] }}
        />
        {vertical
          ? <><line x1="1" y1="0" x2="9" y2="0" stroke={C.line} strokeWidth="0.6" vectorEffect="non-scaling-stroke" /><line x1="1" y1="100" x2="9" y2="100" stroke={C.line} strokeWidth="0.6" vectorEffect="non-scaling-stroke" /></>
          : <><line x1="0" y1="1" x2="0" y2="9" stroke={C.line} strokeWidth="0.6" vectorEffect="non-scaling-stroke" /><line x1="100" y1="1" x2="100" y2="9" stroke={C.line} strokeWidth="0.6" vectorEffect="non-scaling-stroke" /></>}
      </svg>
      <span className={`${mono.className} absolute text-[9.5px] tracking-[0.2em] uppercase text-[#8F8169] bg-[#F1E9DB] px-1.5 ${vertical ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 [writing-mode:vertical-rl]' : 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'}`}>{label}</span>
    </div>
  )
}

// fades and rises into place once, when scrolled into view
function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-12%' }}
      transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

function Cta({ children = 'Start saving — free', light = false }: { children?: React.ReactNode; light?: boolean }) {
  return (
    <Link
      href="/login"
      className={`group inline-flex items-center gap-3 rounded-full pl-7 pr-2 h-14 text-[15px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#B5603A] focus-visible:ring-offset-[#F1E9DB] ${light ? 'bg-[#F1E9DB] text-[#2A241D] hover:bg-white' : 'bg-[#2A241D] text-[#F1E9DB] hover:bg-[#3A3128]'}`}
    >
      {children}
      <span className={`flex h-10 w-10 items-center justify-center rounded-full transition-transform duration-300 group-hover:translate-x-0.5 ${light ? 'bg-[#2A241D] text-[#F1E9DB]' : 'bg-[#B5603A] text-white'}`}>
        <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
      </span>
    </Link>
  )
}

// ---------- page ----------

export default function Landing() {
  const hero = useRef<HTMLDivElement>(null)
  const arches = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress: heroP } = useScroll({ target: hero, offset: ['start start', 'end start'] })
  const heroY = useTransform(heroP, [0, 1], ['0%', reduce ? '0%' : '12%'])
  const { scrollYProgress: archP } = useScroll({ target: arches, offset: ['start end', 'end start'] })
  const archY = useTransform(archP, [0, 1], reduce ? ['0%', '0%'] : ['-8%', '8%'])

  return (
    <main className="min-h-dvh overflow-x-hidden bg-[#F1E9DB] text-[#2A241D] selection:bg-[#B5603A]/25 [background-image:radial-gradient(rgba(120,95,60,0.07)_1px,transparent_1px)] [background-size:22px_22px]">
      {/* ---------- top bar ---------- */}
      <header className="fixed inset-x-0 top-0 z-50">
        <div className="mx-auto mt-4 flex max-w-6xl items-center justify-between gap-4 rounded-full border border-[#D9CBB2]/80 bg-[#F1E9DB]/80 px-4 py-2.5 backdrop-blur-md sm:px-6 mx-4 sm:mx-6 lg:mx-auto">
          <Link href="/new" className={`${serif.className} text-[24px] leading-none font-semibold tracking-tight`}>inntoit</Link>
          <nav className={`${mono.className} hidden md:flex items-center gap-8 text-[11px] tracking-[0.2em] uppercase text-[#5E5446]`}>
            <a href="#rooms" className="hover:text-[#B5603A] transition-colors">The rooms</a>
            <a href="#method" className="hover:text-[#B5603A] transition-colors">Method</a>
            <a href="#house" className="hover:text-[#B5603A] transition-colors">The house</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden sm:inline-flex h-9 items-center px-4 text-[14px] text-[#5E5446] hover:text-[#2A241D] transition-colors">Sign in</Link>
            <Link href="/login" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#2A241D] px-4 text-[13.5px] text-[#F1E9DB] hover:bg-[#3A3128] transition-colors">
              Begin <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.75} />
            </Link>
          </div>
        </div>
      </header>

      {/* ---------- hero ---------- */}
      <section ref={hero} className="relative mx-auto max-w-6xl px-4 sm:px-6 pt-32 pb-20 sm:pt-40 lg:pb-28">
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          <div className="relative z-10">
            <Reveal><Fig n="00">Elevation · A home for what you keep</Fig></Reveal>
            <Reveal delay={0.08}>
              <h1 className={`${serif.className} mt-6 text-[clamp(46px,7.4vw,96px)] leading-[0.95] font-medium tracking-[-0.02em]`}>
                A quiet home<br />for everything<br /><em className="font-normal text-[#B5603A]">you save.</em>
              </h1>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="mt-7 max-w-[30rem] text-[17px] leading-relaxed text-[#5E5446]">
                Links, posts, notes and pictures from anywhere, each kept looking like itself, in one calm, private place.
                No feed. No noise. Just rooms full of things you meant to come back to.
              </p>
            </Reveal>
            <Reveal delay={0.24} className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
              <Cta />
              <a href="#rooms" className={`${mono.className} text-[11px] tracking-[0.2em] uppercase text-[#5E5446] hover:text-[#B5603A] transition-colors`}>Walk through ↓</a>
            </Reveal>
          </div>

          {/* the façade, framed by drafting lines */}
          <div className="relative mx-auto w-full max-w-[460px] lg:max-w-none">
            <Dimension label="Saved · 2 a.m." className="absolute -top-8 left-[8%] right-[8%] h-4" />
            <Dimension label="Found · 3 s" vertical className="absolute -right-8 top-[10%] bottom-[10%] w-4 hidden sm:block" />
            <motion.div style={{ y: heroY }} className="relative aspect-[4/5] overflow-hidden rounded-[2px] shadow-[0_30px_80px_-30px_rgba(70,50,25,0.45)]">
              <Image src="/landing/5.webp" alt="An architectural drawing of a house with a carved wooden balcony window" fill priority sizes="(min-width: 1024px) 520px, 90vw" className="object-cover" />
            </motion.div>
            <div className={`${mono.className} mt-4 flex justify-between text-[10px] tracking-[0.2em] uppercase text-[#8F8169]`}>
              <span>Plate I</span><span>Scale 1 : 1 — your whole mind</span>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- ribbon: what it keeps ---------- */}
      <section aria-label="What inntoit keeps" className="border-y border-[#D9CBB2] bg-[#E8DCC7]/60 py-5 overflow-hidden">
        <motion.div
          className={`${serif.className} flex w-max gap-12 whitespace-nowrap text-[26px] italic text-[#5E5446]`}
          animate={reduce ? undefined : { x: ['0%', '-50%'] }}
          transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
        >
          {[0, 1].map((k) => (
            <div key={k} className="flex gap-12" aria-hidden={k === 1}>
              {['Links', 'Notes', 'X posts', 'Instagram', 'Reddit threads', 'YouTube', 'Substack', 'Medium', 'Threads', 'Spotify', 'Hacker News', 'Pictures', 'PDFs'].map((w) => (
                <span key={w} className="flex items-center gap-12">{w}<span className="text-[#B5603A] not-italic text-[14px]">✦</span></span>
              ))}
            </div>
          ))}
        </motion.div>
      </section>

      {/* ---------- three doors ---------- */}
      <section id="rooms" className="mx-auto max-w-6xl px-4 sm:px-6 py-24 sm:py-32">
        <div className="max-w-2xl">
          <Reveal><Fig n="01">The rooms</Fig></Reveal>
          <Reveal delay={0.08}>
            <h2 className={`${serif.className} mt-5 text-[clamp(36px,5vw,62px)] leading-[1.02] font-medium tracking-[-0.015em]`}>
              Three doors. <em className="font-normal text-[#5E5446]">Everything behind them stays exactly where you left it.</em>
            </h2>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-10 md:grid-cols-3 md:gap-8">
          {[
            { img: '/landing/3.webp', fig: '01.a', title: 'Save from anywhere', alt: 'A turquoise carved door', icons: [MousePointerClick, Smartphone],
              text: 'One click in Chrome, or the share sheet on your iPhone. Right-click a post, a picture or a passage, and it’s home.' },
            { img: '/landing/1.webp', fig: '01.b', title: 'Kept looking like itself', alt: 'A whitewashed house with a wooden balcony by the sea', icons: [Sparkles],
              text: 'An X post stays an X post. A Reddit thread, a reel, a Substack essay — each keeps its author, its picture, its shape.' },
            { img: '/landing/2.webp', fig: '01.c', title: 'Found again', alt: 'A carved wooden window under an arch', icons: [Search, FolderTree],
              text: 'Search everything you’ve kept, sort it into folders inside folders, and add your own notes beside any save.' },
          ].map((d, i) => (
            <Reveal key={d.fig} delay={i * 0.1}>
              <article className="group">
                <div className="relative aspect-[3/4] overflow-hidden rounded-t-[999px] bg-[#E8DCC7] ring-1 ring-[#D9CBB2]">
                  <Image src={d.img} alt={d.alt} fill sizes="(min-width: 768px) 33vw, 92vw" className="object-cover transition-transform duration-[1.4s] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.04]" />
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <Fig n={d.fig}>Door {['I', 'II', 'III'][i]}</Fig>
                  <span className="flex gap-1.5 text-[#3F8C97]">{d.icons.map((I, k) => <I key={k} className="h-4 w-4" strokeWidth={1.5} />)}</span>
                </div>
                <h3 className={`${serif.className} mt-3 text-[30px] leading-tight font-medium`}>{d.title}</h3>
                <p className="mt-3 text-[15.5px] leading-relaxed text-[#5E5446]">{d.text}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- the arches: one line ---------- */}
      <section ref={arches} className="relative h-[78vh] min-h-[520px] overflow-hidden bg-[#2A241D]" aria-label="Not a feed. A place.">
        <motion.div style={{ y: archY }} className="absolute inset-[-10%_0]">
          <Image src="/landing/4.webp" alt="" fill sizes="100vw" className="object-cover object-[50%_38%] opacity-80" />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#1E1913]/85 via-[#1E1913]/25 to-[#1E1913]/40" />
        <div className="relative mx-auto flex h-full max-w-6xl flex-col justify-end px-4 sm:px-6 pb-16 sm:pb-24">
          <Reveal><p className={`${mono.className} text-[10.5px] tracking-[0.22em] uppercase text-[#E9C9A8]`}><span className="text-[#F0A77F]">Fig. 02</span> <span className="mx-1.5 opacity-50">·</span> The courtyard</p></Reveal>
          <Reveal delay={0.08}>
            <p className={`${serif.className} mt-5 max-w-3xl text-[clamp(40px,6.4vw,84px)] leading-[0.98] font-medium text-[#F6EEE1] tracking-[-0.02em]`}>
              Not a feed.<br /><em className="font-normal text-[#E9C9A8]">A place.</em>
            </p>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mt-6 max-w-md text-[16px] leading-relaxed text-[#E6DACA]/85">
              Nothing here is ranked, pushed or sold. It’s a room you walk into when you want to — and everything is still on the wall.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ---------- method: three steps, like a drawing's legend ---------- */}
      <section id="method" className="mx-auto max-w-6xl px-4 sm:px-6 py-24 sm:py-32">
        <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div>
            <Reveal><Fig n="03">Method</Fig></Reveal>
            <Reveal delay={0.08}>
              <h2 className={`${serif.className} mt-5 text-[clamp(36px,5vw,58px)] leading-[1.02] font-medium tracking-[-0.015em]`}>
                Drawn in three lines.
              </h2>
            </Reveal>
            <Reveal delay={0.16}><p className="mt-5 max-w-sm text-[16px] leading-relaxed text-[#5E5446]">No setup, no learning curve. If you can share a link, you already know how.</p></Reveal>
          </div>
          <ol className="relative border-t border-[#C9B89B]">
            {[
              { n: 'I', t: 'Keep it', d: 'Click the inntoit icon, right-click anything, or share from your phone. It saves in a moment.' },
              { n: 'II', t: 'We tidy it', d: 'inntoit reads the page and keeps its title, author and picture, so the card looks like the real thing.' },
              { n: 'III', t: 'Come back to it', d: 'Search, open a folder, or just browse your wall. Add a note whenever a thought arrives.' },
            ].map((s, i) => (
              <Reveal key={s.n} delay={i * 0.08}>
                <li className="grid grid-cols-[64px_1fr] gap-4 border-b border-[#C9B89B] py-8 sm:grid-cols-[96px_1fr_auto] sm:items-baseline">
                  <span className={`${serif.className} text-[40px] leading-none italic text-[#B5603A]`}>{s.n}.</span>
                  <div>
                    <h3 className={`${serif.className} text-[30px] leading-tight font-medium`}>{s.t}</h3>
                    <p className="mt-2 max-w-md text-[15.5px] leading-relaxed text-[#5E5446]">{s.d}</p>
                  </div>
                  <span className={`${mono.className} hidden sm:block text-[10px] tracking-[0.2em] uppercase text-[#8F8169]`}>Step 0{i + 1}</span>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- the house: what's included, with the balcony ---------- */}
      <section id="house" className="relative border-t border-[#D9CBB2] bg-[#E8DCC7]/50">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 py-24 sm:py-32 lg:grid-cols-2 lg:gap-16">
          <Reveal className="order-2 lg:order-1">
            <div className="relative mx-auto aspect-square w-full max-w-[520px]">
              {/* white paper of the drawing disappears into the page's parchment */}
              <Image src="/landing/6.webp" alt="A watercolour of a carved wooden balcony with flowers" fill sizes="(min-width: 1024px) 520px, 92vw" className="object-contain mix-blend-multiply" />
            </div>
          </Reveal>
          <div className="order-1 lg:order-2">
            <Reveal><Fig n="04">The house</Fig></Reveal>
            <Reveal delay={0.08}>
              <h2 className={`${serif.className} mt-5 text-[clamp(36px,5vw,58px)] leading-[1.02] font-medium tracking-[-0.015em]`}>
                Built like a home, <em className="font-normal text-[#5E5446]">not a shop.</em>
              </h2>
            </Reveal>
            <ul className="mt-10 grid gap-x-8 gap-y-7 sm:grid-cols-2">
              {[
                { I: ShieldCheck, t: 'Private by default', d: 'Your saves are yours. Nobody else sees your wall.' },
                { I: EyeOff, t: 'No ads, no feed', d: 'Nothing ranked, nothing pushed at you. Ever.' },
                { I: MonitorSmartphone, t: 'Desktop & phone', d: 'Chrome extension and iPhone share sheet, one library.' },
                { I: Sparkles, t: 'Pictures that last', d: 'Previews are kept with your save, so they don’t vanish later.' },
              ].map(({ I, t, d }, i) => (
                <Reveal key={t} delay={0.1 + i * 0.06}>
                  <li className="flex gap-4">
                    <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#C9B89B] text-[#3F8C97]"><I className="h-[18px] w-[18px]" strokeWidth={1.5} /></span>
                    <div>
                      <h3 className="text-[16px] font-medium">{t}</h3>
                      <p className="mt-1 text-[14.5px] leading-relaxed text-[#5E5446]">{d}</p>
                    </div>
                  </li>
                </Reveal>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ---------- final call ---------- */}
      <section className="relative mx-auto max-w-6xl px-4 sm:px-6 py-24 sm:py-36 text-center">
        <Dimension label="Your door" className="relative mx-auto mb-12 h-4 w-[min(420px,80%)]" />
        <Reveal>
          <h2 className={`${serif.className} mx-auto max-w-3xl text-[clamp(42px,6.6vw,88px)] leading-[0.98] font-medium tracking-[-0.02em]`}>
            Come in.<br /><em className="font-normal text-[#B5603A]">Make yourself at home.</em>
          </h2>
        </Reveal>
        <Reveal delay={0.12} className="mt-10 flex justify-center"><Cta>Open your door — free</Cta></Reveal>
      </section>

      <footer className="border-t border-[#D9CBB2]">
        <div className={`${mono.className} mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:px-6 py-8 text-[10.5px] tracking-[0.2em] uppercase text-[#8F8169] sm:flex-row`}>
          <span className={`${serif.className} text-[22px] normal-case tracking-tight text-[#2A241D] font-semibold`}>inntoit</span>
          <span>Drawn with care · {new Date().getFullYear()}</span>
          <Link href="/login" className="hover:text-[#B5603A] transition-colors">Sign in →</Link>
        </div>
      </footer>
    </main>
  )
}
