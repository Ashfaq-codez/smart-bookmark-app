/* eslint-disable @next/next/no-img-element */
'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useTheme } from '@/context/ThemeContext'
import { 
  InstagramIcon, 
  YouTubeIcon, 
  PinterestIcon, 
  XIcon,
  PlayCircleIcon,
  ExternalLinkIcon,
  InstaHeartIcon,
  InstaCommentIcon,
  InstaShareIcon,
  InstaSaveIcon
} from '@/components/BookmarkIcons'

const IMG = {
  reel: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=700&auto=format&fit=crop&q=80',
  yt: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=700&auto=format&fit=crop&q=80',
  pin: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=700&auto=format&fit=crop&q=80',
}

// Each saved thing keeps the look of where it came from. The reel is last so it ends up on top of the stack.
const STORY_CARDS = [
  { k: 'pdf', sx: 90, sy: 70, sr: 20 },
  { k: 'note', sx: -30, sy: 120, sr: -8 },
  { k: 'x', sx: 60, sy: -130, sr: 25 },
  { k: 'yt', sx: 80, sy: -90, sr: 15 },
  { k: 'pin', sx: -80, sy: 60, sr: -12 },
  { k: 'reel', sx: -70, sy: -80, sr: -24 },
]

const LEAD = 'A reel at 2 a.m. A pin you can’t stop looking at. One line in an essay that changed how you work. You hit save and move on.'

const Bar = ({ dot, name, when }: { dot: string; name: string; when: string }) => (
  <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5 text-[11px] font-body font-semibold">
    <span className="flex items-center gap-2"><span className="block w-2 h-2 rounded-full" style={{ background: dot }} />{name}</span>
    <span className="opacity-50 font-medium">{when}</span>
  </div>
)
const Shell = ({ children, cls = '' }: { children: React.ReactNode; cls?: string }) => (
  <div className={`h-full w-full rounded-[26px] overflow-hidden flex flex-col border border-black/10 dark:border-white/10 shadow-[0_30px_60px_-24px_rgba(0,0,0,.55)] ${cls}`}>{children}</div>
)
const Img = ({ src }: { src: string }) => <img src={src} alt="" draggable={false} className="absolute inset-0 w-full h-full object-cover" />

function StoryCard({ k }: { k: string }) {
  if (k === 'reel') return (
    <Shell cls="bg-white text-[#111311] dark:bg-[#161916] dark:text-white">
      <Bar dot="#E1306C" name="Reel" when="2:07 a.m." />
      <div className="relative flex-1 min-h-0">
        <Img src={IMG.reel} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <span className="absolute bottom-3 left-3 w-9 h-9 rounded-full bg-white/90 text-black flex items-center justify-center text-xs pl-0.5">▶</span>
        <span className="absolute bottom-3 right-3 -rotate-3 px-2.5 py-1.5 rounded-md bg-[#FFE066] text-[#2B2410] text-[11px] font-body font-bold shadow-lg">“use this for the café”</span>
      </div>
      <div className="p-3.5 shrink-0">
        <p className="font-block text-[17px] leading-tight uppercase">Kyoto joinery, no nails</p>
        <p className="mt-1 text-xs font-body opacity-60">@kyoto.woodwork</p>
      </div>
    </Shell>
  )
  if (k === 'yt') return (
    <Shell cls="bg-[#0F110F] text-white">
      <div className="relative aspect-video shrink-0">
        <Img src={IMG.yt} />
        <span className="absolute bottom-0 left-0 h-[3px] w-[38%] bg-[#FF0033]" />
        <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono-tech font-bold">18:42</span>
        <span className="absolute top-2.5 left-2.5 px-2 py-1 rounded-full bg-white text-[#FF0033] text-[10px] font-body font-bold">YouTube</span>
      </div>
      <div className="p-4 flex-1 min-h-0 flex flex-col gap-2">
        <p className="font-block text-[19px] leading-[1.05] uppercase">Why Swiss grids never died</p>
        <p className="text-xs font-body text-white/55">Studio Form, 148K views</p>
        <p className="mt-auto self-start px-2.5 py-1.5 rounded-lg bg-white/10 text-[11px] font-body"><b className="text-[#10B981] font-mono-tech mr-1.5">6:12</b>the grid spec starts here</p>
      </div>
    </Shell>
  )
  if (k === 'pin') return (
    <Shell cls="bg-[#1C1D20] text-white">
      <div className="relative flex-1 min-h-0">
        <Img src={IMG.pin} />
        <span className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-[#E60023] text-xs font-body font-bold">Save</span>
        <div className="absolute inset-x-0 bottom-0 p-4 pt-16 bg-gradient-to-t from-black/85 to-transparent">
          <p className="font-block text-xl leading-[1] uppercase">Concrete house, timber stair</p>
          <p className="mt-1.5 text-xs font-body text-white/65">archdaily.com</p>
        </div>
      </div>
    </Shell>
  )
  if (k === 'pdf') return (
    <Shell cls="bg-[#F6F3EA] text-[#15170F]">
      <Bar dot="#E5322D" name="PDF" when="page 14 of 55" />
      <div className="flex-1 min-h-0 mx-4 mb-4 rounded-md bg-white shadow-[0_2px_12px_rgba(0,0,0,.12)] p-4 flex flex-col gap-2">
        <p className="font-block text-[17px] leading-[1.05]">A Mathematical Theory of Communication</p>
        <p className="text-[11px] font-body opacity-60">C. E. Shannon, 1948</p>
        <div className="mt-2 space-y-1.5">
          {[100, 92, 96, 70, 100, 84].map((w, i) => <div key={i} className={`h-[5px] rounded-full ${i === 3 ? 'bg-[#FFD84D]' : 'bg-black/10'}`} style={{ width: `${w}%` }} />)}
        </div>
        <p className="mt-auto text-[11px] font-body font-semibold"><span className="bg-[#FFE066] px-1">Your highlight, page 14</span></p>
      </div>
    </Shell>
  )
  if (k === 'note') return (
    <Shell cls="bg-[#FFF1A8] text-[#2B2410] relative">
      <span className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-5 bg-black/10 rounded-b-md" />
      <div className="p-5 pt-8 flex flex-col gap-3 h-full">
        <p className="font-block text-2xl leading-[1] uppercase">On visual density</p>
        <ul className="space-y-2 text-sm font-body font-medium leading-snug">
          <li>More on the wall is not more noise.</li>
          <li>Sort by feeling first, folder second.</li>
          <li className="bg-[#FFC933]/60 px-1.5 rounded w-fit">Ask why I stopped scrolling.</li>
        </ul>
        <p className="mt-auto text-[11px] font-body opacity-60">Note, kept beside 3 saves</p>
      </div>
    </Shell>
  )
  return (
    <Shell cls="bg-white text-[#0F1419] dark:bg-black dark:text-white">
      <Bar dot="#1D9BF0" name="X post" when="Thread kept whole" />
      <div className="px-4 flex-1 min-h-0 flex flex-col gap-3">
        <div className="flex items-center gap-2.5">
          <span className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6366F1] to-[#10B981] flex items-center justify-center text-white text-xs font-bold font-body">MI</span>
          <div className="leading-tight font-body"><p className="text-sm font-bold">Mara Ito</p><p className="text-xs opacity-55">@maraito</p></div>
        </div>
        <p className="font-body text-[19px] leading-[1.25] font-semibold">Weird obsessions win. Every single time.</p>
        <div className="mt-auto pb-4 flex gap-5 text-xs font-body font-semibold opacity-70"><span>2.4K reposts</span><span>9.1K likes</span></div>
      </div>
    </Shell>
  )
}

const MOMENTS = [
  { tab: 'The 2 a.m. find', src: 'Reel, saved 2:07 a.m.', title: 'Light through paper walls', bg: 'linear-gradient(140deg,#7A2E1D,#FF8A3D)',
    lost: 'Weeks later you remember loving it. The link now says “This video is unavailable.”',
    kept: 'It is still here, in the same light, with the note you wrote: “use this for the café.”' },
  { tab: 'The idea that wasn’t ready', src: 'Essay, saved 3 years ago', title: 'On slow work', bg: 'linear-gradient(140deg,#0E1F3A,#6366F1)',
    lost: 'You are finally building the thing, and you cannot remember where you read that one line.',
    kept: 'You type “slow” and it opens on the paragraph you underlined back then.' },
  { tab: 'The house you’ll build', src: '212 pins, since 2021', title: 'Concrete, timber, quiet', bg: 'linear-gradient(140deg,#0A2A1D,#34D399)',
    lost: 'A camera roll of screenshots, buried under nine thousand others, half with no source.',
    kept: 'Every pin sits on one wall with where it came from. The plot is bought. The wall is ready.' },
]

const Words = ({ text, className = '', base = 0 }: { text: string; className?: string; base?: number }) => (
  <>
    {text.split(' ').map((w, i) => (
      <span key={i}>
        <span className="w-mask"><span className={`w-in ${className}`} style={{ '--i': base + i } as React.CSSProperties}>{w}</span></span>{' '}
      </span>
    ))}
  </>
)

export default function HomePage() {
  const { isDarkMode, toggleDarkMode } = useTheme()
  const [tabs, setTabs] = useState(40)
  const rootRef = useRef<HTMLElement>(null)

  // Interactive Gallery Filter State
  const [activeCanvasFilter, setActiveCanvasFilter] = useState<'all' | 'cinema' | 'socials' | 'architecture' | 'notes'>('all')

  // Interactive Instagram Reel State in Demo
  const [moment, setMoment] = useState(0)
  const [demoIgLiked, setDemoIgLiked] = useState(false)
  const [demoIgLikesCount, setDemoIgLikesCount] = useState(14820)
  const [demoHeartBurst, setDemoHeartBurst] = useState(false)
  const [demoSaved, setDemoSaved] = useState(false)

  // Scroll engine: one rAF loop eases scroll values into CSS variables (--sy, --vel, --p, --pc, --sp, --cp, --o)
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const els = Array.from(root.querySelectorAll<HTMLElement>('[data-scrub]'))
    const val = new Map<HTMLElement, number>()
    const c01 = (v: number) => Math.min(1, Math.max(0, v))
    let sy = 0, vel = 0, last = window.scrollY, raf = 0
    const tick = () => {
      const vh = window.innerHeight
      const y = window.scrollY
      const max = document.documentElement.scrollHeight - vh
      const k = calm ? 1 : 0.1
      sy += ((max > 0 ? y / max : 0) - sy) * k
      vel += ((y - last) - vel) * 0.12
      last = y
      root.style.setProperty('--sy', sy.toFixed(4))
      root.style.setProperty('--vel', Math.max(-1, Math.min(1, vel / 50)).toFixed(3))
      for (const el of els) {
        const r = el.getBoundingClientRect()
        const m = el.dataset.scrub
        let t: number
        if (m === 'story') t = 1 - c01(-r.top / Math.max(1, r.height - vh))
        else if (m === 'stage') t = c01((vh * 0.95 - r.top) / (vh * 0.65))
        else if (m === 'out') t = c01(-r.top / (r.height * 0.9))
        else t = c01((vh - r.top) / (vh + r.height))
        const prev = val.get(el) ?? t
        const v = prev + (t - prev) * k
        val.set(el, v)
        if (m === 'story') {
          const e = v * v * (3 - 2 * v)
          el.style.setProperty('--sp', e.toFixed(4))
          setTabs(Math.max(1, Math.round(1 + 39 * e)))
        } else if (m === 'stage') el.style.setProperty('--cp', (1 - Math.pow(1 - v, 3)).toFixed(4))
        else if (m === 'out') el.style.setProperty('--o', v.toFixed(4))
        else { el.style.setProperty('--p', v.toFixed(4)); el.style.setProperty('--pc', (v * 2 - 1).toFixed(4)) }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  // Smooth Intersection Observer for kinetic scroll reveals
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view')
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    )

    const revealElements = document.querySelectorAll('.kinetic-reveal')
    revealElements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  // Instagram Demo Double Tap handler
  const handleDemoDoubleTap = () => {
    if (!demoIgLiked) {
      setDemoIgLiked(true)
      setDemoIgLikesCount((prev) => prev + 1)
    }
    setDemoHeartBurst(true)
    setTimeout(() => setDemoHeartBurst(false), 900)
  }

  const handleToggleLike = () => {
    if (demoIgLiked) {
      setDemoIgLiked(false)
      setDemoIgLikesCount((prev) => prev - 1)
    } else {
      setDemoIgLiked(true)
      setDemoIgLikesCount((prev) => prev + 1)
      setDemoHeartBurst(true)
      setTimeout(() => setDemoHeartBurst(false), 800)
    }
  }

  return (
    <main
      ref={rootRef}
      className="relative min-h-screen text-[#111311] dark:text-[#F3F4F3] selection:bg-[#1A3826] selection:text-[#E8F5E9] overflow-x-clip font-sans transition-colors duration-700 bg-[#FAF7F2] dark:bg-[#070908]"
    >
      
      {/* TYPOGRAPHY INJECTION */}
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,800..900&family=JetBrains+Mono:wght@400;500;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        @import url('https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@800,900&display=swap');
        
        .font-tall-block { font-family: 'Cabinet Grotesk', 'Bebas Neue', sans-serif; font-weight: 900; letter-spacing: -0.035em; }
        .font-syne-black { font-family: 'Cabinet Grotesk', 'Bebas Neue', sans-serif; font-weight: 900; letter-spacing: -0.035em; }
        .font-syne { font-family: 'Cabinet Grotesk', 'Syne', sans-serif; font-weight: 800; letter-spacing: -0.02em; }
        .font-mono-tech { font-family: 'JetBrains Mono', monospace; }
        .font-body { font-family: 'Plus Jakarta Sans', sans-serif; }
        .font-block { font-family: 'Cabinet Grotesk', sans-serif; font-weight: 900; letter-spacing: -0.02em; }

        /* Elastic Kinetic Reveals */
        .kinetic-reveal {
          opacity: 0;
          will-change: transform, opacity, filter;
          transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), 
                      transform 0.7s cubic-bezier(0.16, 1, 0.3, 1), 
                      filter 0.7s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .kr-up {
          transform: translateY(32px);
          filter: blur(4px);
        }
        .kr-up.in-view {
          opacity: 1;
          transform: translateY(0px) scale(1);
          filter: blur(0px);
        }

        .kr-roll-left {
          transform: perspective(1400px) rotateY(-8deg) translateX(-24px);
          filter: blur(4px);
        }
        .kr-roll-left.in-view {
          opacity: 1;
          transform: perspective(1400px) rotateY(0deg) rotateZ(0deg) translateX(0px);
          filter: blur(0px);
        }

        .kr-roll-right {
          transform: perspective(1400px) rotateY(8deg) translateX(24px);
          filter: blur(4px);
        }
        .kr-roll-right.in-view {
          opacity: 1;
          transform: perspective(1400px) rotateY(0deg) rotateZ(0deg) translateX(0px);
          filter: blur(0px);
        }

        .glass-brutal {
          background: rgba(250, 247, 242, 0.72);
          backdrop-filter: blur(32px) saturate(190%);
          -webkit-backdrop-filter: blur(32px) saturate(190%);
          border: 1px solid rgba(0, 0, 0, 0.08);
        }
        .dark .glass-brutal {
          background: rgba(14, 17, 14, 0.72);
          backdrop-filter: blur(32px) saturate(190%);
          -webkit-backdrop-filter: blur(32px) saturate(190%);
          border: 1px solid rgba(255, 255, 255, 0.09);
        }

        @keyframes float-y { 0%, 100% { translate: 0 0; } 50% { translate: 0 -10px; } }
        .float-y { animation: float-y 5s ease-in-out infinite; }
        
        /* Hero */
        .hero-line { display: block; overflow: hidden; padding-bottom: 0.08em; margin-bottom: -0.08em; }
        .hero-line > span { display: block; transform: translateY(112%); white-space: nowrap; animation: line-up 1.1s cubic-bezier(0.16, 1, 0.3, 1) forwards, squeeze 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; animation-delay: var(--d, 0s), var(--d, 0s); }
        @keyframes line-up { to { transform: translateY(0); } }
        @keyframes squeeze { from { font-variation-settings: "wdth" 100, "wght" 900; } to { font-variation-settings: "wdth" 68, "wght" 900; } }

        @media (prefers-reduced-motion: reduce) {
          .g-text, .g-border::before, .beat-in { animation: none; }
          .hero-line > span { animation: none; transform: none; }
          .kinetic-reveal { transition: none; }
        }

        @property --a { syntax: '<angle>'; inherits: false; initial-value: 0deg; }
        @keyframes spin-a { to { --a: 360deg; } }
        @keyframes g-flow { to { background-position: 100% 0; } }
        @keyframes beat-in { from { opacity: 0; transform: translateY(24px); filter: blur(6px); } to { opacity: 1; transform: none; filter: none; } }
        .beat-in { animation: beat-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .g-text { background: linear-gradient(100deg, #0E7A55, #10B981 25%, #C8F55A 50%, #FFB13B 75%, #FF6A3D); background-size: 220% 100%; -webkit-background-clip: text; background-clip: text; color: transparent; animation: g-flow 7s ease-in-out infinite alternate; }
        .g-btn { background: linear-gradient(100deg, #10B981, #C8F55A 60%, #FFB13B); color: #06120B; }
        .g-border { position: relative; }
        .g-border::before { content: ''; position: absolute; inset: 0; padding: 2px; border-radius: inherit; pointer-events: none; z-index: 5; background: conic-gradient(from var(--a), var(--g1), var(--g2), var(--g3), var(--g4), var(--g5), var(--g1)); -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask-composite: exclude; animation: spin-a 6s linear infinite; }
        .mesh-bg { background: radial-gradient(60% 45% at 6% 4%, rgba(16,185,129,.30), transparent 62%), radial-gradient(50% 40% at 100% 24%, rgba(255,177,59,.28), transparent 62%), radial-gradient(55% 45% at 0% 66%, rgba(99,102,241,.16), transparent 60%), radial-gradient(60% 50% at 92% 100%, rgba(255,106,61,.22), transparent 60%); }
        .dark .mesh-bg { background: radial-gradient(60% 45% at 6% 4%, rgba(16,185,129,.22), transparent 62%), radial-gradient(50% 40% at 100% 24%, rgba(255,177,59,.14), transparent 62%), radial-gradient(55% 45% at 0% 66%, rgba(99,102,241,.16), transparent 60%), radial-gradient(60% 50% at 92% 100%, rgba(255,106,61,.12), transparent 60%); }
        .grain-fx { background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='2'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>"); opacity: .07; mix-blend-mode: overlay; }

        /* ===== UPGRADE LAYER ===== */
        :root { --ease: cubic-bezier(.16,1,.3,1); --g1:#00A06C; --g2:#46A800; --g3:#E48A00; --g4:#EE4F2C; --g5:#5757EE; }
        .dark { --g1:#2CFFB0; --g2:#B6FF5C; --g3:#FFC13D; --g4:#FF6B4A; --g5:#8B7CFF; }
        @keyframes g-flow { to { background-position: 200% 0; } }
        .g-text { background: linear-gradient(100deg, var(--g1), var(--g2), var(--g3), var(--g4), var(--g5), var(--g1)) 0 0 / 200% 100%; -webkit-background-clip: text; background-clip: text; color: transparent; animation: g-flow 10s linear infinite; padding: .12em .06em; margin: -.12em -.06em; -webkit-box-decoration-break: clone; box-decoration-break: clone; }
        .g-btn { background: linear-gradient(100deg, var(--g1), var(--g2) 55%, var(--g3)); color: #06120B; }
        main h2 { text-wrap: balance; overflow-wrap: break-word; }
        .hero-h { text-wrap: balance; }
        .w-mask { display: inline-block; overflow: hidden; vertical-align: top; padding: .14em .06em .2em; margin: -.14em -.06em -.2em; }
        .w-in { display: inline-block; transform: translateY(125%) rotate(6deg); transform-origin: 0 100%; animation: w-up 1.2s var(--ease) both; animation-delay: calc(var(--i) * 70ms + .12s); }
        .w-in.g-text { animation: w-up 1.2s var(--ease) both, g-flow 10s linear infinite; animation-delay: calc(var(--i) * 70ms + .12s), 0s; }
        @keyframes w-up { to { transform: none; } }
        .kinetic-reveal { will-change: transform, opacity; transition: opacity 1.1s var(--ease), transform 1.3s var(--ease), filter 1.1s var(--ease), clip-path 1.3s var(--ease); }
        .kr-up { transform: perspective(1200px) translateY(64px) rotateX(8deg) scale(.96); filter: blur(10px); transform-origin: 50% 100%; }
        .kr-roll-left { transform: perspective(1400px) translateX(-72px) rotateY(-14deg) scale(.94); filter: blur(10px); clip-path: inset(0 30% 0 0 round 36px); }
        .kr-roll-right { transform: perspective(1400px) translateX(72px) rotateY(14deg) scale(.94); filter: blur(10px); clip-path: inset(0 0 0 30% round 36px); }
        .kinetic-reveal.in-view { opacity: 1; transform: none; filter: none; will-change: auto; }
        .kr-roll-left.in-view, .kr-roll-right.in-view { clip-path: inset(-10% -10% -10% -10% round 36px); }
        .rv { display: inline-block; --l: clamp(0, ((var(--p, 0) - .2) * 3.2 * var(--n) - var(--i)) / 3, 1); opacity: calc(.14 + .86 * var(--l)); transform: translateY(calc((1 - var(--l)) * .28em)); will-change: opacity, transform; }
        @media (prefers-reduced-motion: reduce) { .rv { opacity: 1 !important; transform: none !important; } }
        .hero-in { transform: translate3d(0, calc(var(--o, 0) * 90px), 0) scale(calc(1 - var(--o, 0) * .08)); opacity: calc(1 - var(--o, 0) * 1.4); }
        .sc { transform: translate(calc(var(--sp, 1) * var(--x) * var(--sm, 1)), calc(var(--sp, 1) * var(--y) * var(--sm, 1))) rotate(calc(var(--sp, 1) * var(--r) + (1 - var(--sp, 1)) * var(--b))) scale(calc(1 - var(--sp, 1) * .06)); will-change: transform; }
        .story-stage { --sm: 1; }
        @media (max-width: 767px) { .story-stage { --sm: .42; } }
        .plx-img { transform: translate3d(0, calc(var(--pc, 0) * -7%), 0) scale(1.18); will-change: transform; }
        @media (prefers-reduced-motion: reduce) {
          .kinetic-reveal { opacity: 1 !important; transform: none !important; filter: none !important; clip-path: none !important; transition: none; }
          .w-in, .w-in.g-text { animation: none; transform: none; }
          .g-text { animation: none; }
        }
      `}} />

      <div className="fixed inset-0 pointer-events-none z-0 mesh-bg" style={{ transform: 'translate3d(0, calc(var(--sy, 0) * -12vh), 0) scale(1.3)' }} />
      <div className="fixed inset-0 pointer-events-none z-[60] grain-fx" />

      {/* TOP PROGRESS BAR */}
      <div className="fixed top-0 left-0 h-[3px] w-full z-[100] origin-left" style={{ transform: 'scaleX(var(--sy, 0))', background: 'linear-gradient(90deg, var(--g1), var(--g2), var(--g3), var(--g4), var(--g5))' }} />

      <header className="fixed top-0 w-full z-50 px-4 sm:px-8 py-4 transition-all">
        <nav className="mx-auto max-w-7xl glass-brutal rounded-full px-6 sm:px-8 py-3.5 flex items-center justify-between shadow-[0_8px_32px_rgba(0,0,0,0.04)]">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1A3826] dark:bg-[#10B981] group-hover:scale-125 transition-transform" />
            <span className="text-2xl sm:text-3xl font-syne-black uppercase tracking-tight text-[#111311] dark:text-white">
              inntoit<span className="text-[#10B981]">.</span>
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-8 text-[11px] font-mono-tech uppercase tracking-[0.2em] text-[#111311]/70 dark:text-[#F3F4F3]/70 font-semibold">
            <a href="#ingestion" className="hover:text-[#1A3826] dark:hover:text-[#10B981] transition-colors flex items-center gap-1.5">
              <span className="text-[9px] opacity-40">01</span> Ingestion
            </a>
            <a href="#canvas" className="hover:text-[#1A3826] dark:hover:text-[#10B981] transition-colors flex items-center gap-1.5">
              <span className="text-[9px] opacity-40">02</span> Canvas
            </a>
            <a href="#chamber" className="hover:text-[#1A3826] dark:hover:text-[#10B981] transition-colors flex items-center gap-1.5">
              <span className="text-[9px] opacity-40">03</span> Chamber
            </a>
            <a href="#pricing" className="hover:text-[#1A3826] dark:hover:text-[#10B981] transition-colors flex items-center gap-1.5">
              <span className="text-[9px] opacity-40">04</span> Access
            </a>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={toggleDarkMode}
              aria-label="Toggle mood lighting"
              className="w-9 h-9 rounded-full flex items-center justify-center border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all text-[#111311] dark:text-white bg-white/50 dark:bg-black/40"
            >
              {isDarkMode ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
              )}
            </button>

            <Link 
              href="/login"
              className="h-9 px-6 rounded-full bg-[#111311] dark:bg-white text-white dark:text-[#111311] text-[11px] font-syne uppercase tracking-wider flex items-center justify-center hover:opacity-90 hover:scale-105 active:scale-95 transition-all shadow-sm"
            >
              Open Vault
            </Link>
          </div>
        </nav>
      </header>

      {/* HERO SECTION */}
      <section data-scrub="out" className="relative pt-28 md:pt-36 pb-6 px-5 sm:px-10 z-10">
        <div className="max-w-6xl mx-auto flex flex-col items-center text-center hero-in">
          
          <div className="kinetic-reveal kr-up inline-flex items-center gap-3 rounded-full border border-black/10 dark:border-white/10 glass-brutal px-4 py-1.5 mb-8 shadow-sm">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]" />
            </span>
            <span className="text-[10px] sm:text-[11px] font-mono-tech font-bold tracking-[0.25em] uppercase text-[#111311]/80 dark:text-white/80">
              STATION 01 {'//'} THE VISUAL ARCHIVE FOR SHARP MINDS
            </span>
          </div>

          <h1 className="hero-h text-[clamp(2.5rem,6.1vw,5.6rem)] font-tall-block uppercase leading-[0.95] text-[#111311] dark:text-[#F3F4F3] mb-8 select-none">
            <Words text="The internet is art. Preserve it as" />
            <Words text="a curated gallery." className="g-text" base={7} />
          </h1>

          <p className="kinetic-reveal kr-up max-w-2xl text-base sm:text-lg md:text-xl font-body text-[#111311]/75 dark:text-[#F3F4F3]/75 leading-relaxed mb-10">
            Standard bookmarks strip away the poster art, the typography, and the spatial emotion of why you stopped scrolling. 
            <strong className="text-[#111311] dark:text-white font-semibold"> inntoit</strong> captures the raw visual soul of every discovery — turning chaotic browser tabs into a permanent intellectual sanctuary.
          </p>

          <div className="kinetic-reveal kr-up flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Link 
              href="/login"
              className="w-full sm:w-auto h-14 px-9 rounded-full g-btn text-xs font-syne uppercase tracking-widest flex items-center justify-center gap-3 shadow-[0_16px_40px_rgba(26,56,38,0.28)] hover:-translate-y-1 active:translate-y-0 transition-all group"
            >
              <span>Begin Your Vault Free</span>
              <span className="text-base font-bold group-hover:translate-x-1 transition-transform">→</span>
            </Link>

            <a 
              href="#protocol"
              className="w-full sm:w-auto h-14 px-8 rounded-full glass-brutal hover:bg-black/5 dark:hover:bg-white/5 text-xs font-mono-tech font-bold uppercase tracking-widest flex items-center justify-center transition-all text-[#111311] dark:text-white"
            >
              Explore the Archive ↓
            </a>
          </div>

          <div className="kinetic-reveal kr-up mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-[10px] sm:text-[11px] font-mono-tech uppercase tracking-[0.2em] text-[#111311]/50 dark:text-[#F3F4F3]/50">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" /> Never loses the picture
            </span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E78F52]" /> Finds it in seconds
            </span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#6366F1]" /> Yours to keep, always
            </span>
          </div>

        </div>
      </section>

      {/* THE MOMENT BEFORE THE SAVE: the sentence lights up word by word as you scroll */}
      <section data-scrub="" className="relative z-10 px-5 sm:px-10 py-20 sm:py-32 max-w-7xl mx-auto">
        <h2 className="max-w-5xl font-tall-block uppercase text-[clamp(1.85rem,4.6vw,4rem)] leading-[1.04] text-[#111311] dark:text-white" style={{ '--n': LEAD.split(' ').length + 3 } as React.CSSProperties}>
          {LEAD.split(' ').map((w, i) => (
            <span key={i}><span className="rv" style={{ '--i': i } as React.CSSProperties}>{w}</span>{' '}</span>
          ))}
        </h2>
      </section>

      {/* STORY: DYNAMIC SCROLL ANIMATION (No massive gaps, driven natively by flow) */}
      <section id="story" data-scrub="story" className="story-stage relative h-[260vh] z-10">
        <div className="sticky top-0 h-screen overflow-hidden flex items-center pt-16"><div className="w-full">
        <div className="max-w-7xl mx-auto px-5 sm:px-10 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* Text Wing */}
          <div className="space-y-6 z-20">
            <div className="flex items-end gap-4">
              <span className="font-tall-block text-[#111311] dark:text-white text-[clamp(4.5rem,13vw,9rem)] leading-[0.9] min-w-[2.1ch] inline-block text-right tabular-nums">
                {tabs}
              </span>
              <span className="font-block uppercase text-2xl sm:text-4xl pb-2 text-[#111311] dark:text-white transition-all duration-300">
                {tabs > 1 ? 'tabs open' : 'in the vault'}
              </span>
            </div>
            
            <div className="mt-4 relative h-[236px] sm:h-[260px] lg:h-[320px]">
              {/* Dynamic Text Crossfade */}
              <div className={`absolute top-0 left-0 transition-all duration-500 ${tabs > 15 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                <h2 className="font-tall-block uppercase text-[clamp(1.75rem,4.2vw,3.25rem)] leading-[1] text-[#111311] dark:text-white">Every one felt important. <br/> None will be found again.</h2>
                <p className="mt-4 max-w-md text-base sm:text-lg font-body text-[#111311]/70 dark:text-white/70 leading-relaxed">
                  You hit save. The link stays. The poster, the mood, the reason you saved it: gone.
                </p>
              </div>
              
              <div className={`absolute top-0 left-0 transition-all duration-500 ${tabs <= 15 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                <h2 className="font-tall-block uppercase text-[clamp(1.75rem,4.2vw,3.25rem)] leading-[1] text-[#111311] dark:text-white">inntoit keeps<br/>the picture.</h2>
                <p className="mt-4 max-w-md text-base sm:text-lg font-body text-[#111311]/70 dark:text-white/70 leading-relaxed">
                  Every reel, pin, essay and PDF lands on one wall, exactly as you saw it. Safe in the vault.
                </p>
              </div>
            </div>
          </div>

          {/* Dynamic Animation Wing: Chaos -> Stacked Vault */}
          <div className="relative w-full h-[36vh] sm:h-[44vh] lg:h-auto lg:aspect-[4/3] flex items-center justify-center">
            <div className="relative w-full max-w-[300px] h-[400px] scale-[.6] sm:scale-[.78] lg:scale-100">
              {STORY_CARDS.map((c, i) => (
                <div key={c.k} className="sc absolute inset-0 m-auto w-[260px] sm:w-[280px] h-[360px]"
                  style={{ zIndex: i, '--x': `${c.sx}%`, '--y': `${c.sy}%`, '--r': `${c.sr}deg`, '--b': `${(i - 5) * 4}deg` } as React.CSSProperties}>
                  <StoryCard k={c.k} />
                </div>
              ))}
            </div>
          </div>

        </div>
      </div></div></section>

      {/* PROTOCOL DOCK: SCROLL-DRIVEN FEED */}
      <section id="protocol" className="py-16 px-4 sm:px-8 max-w-5xl mx-auto z-10 relative">
        <div className="glass-brutal rounded-[32px] sm:rounded-[44px] p-6 sm:p-10 border border-black/10 dark:border-white/10 shadow-2xl relative">
          
          <div className="text-center pb-12 mb-8 border-b border-black/[0.08] dark:border-white/[0.08]">
            <p className="text-[10px] font-mono-tech uppercase tracking-[0.3em] text-[#10B981] font-bold">The Ingestion Protocol</p>
            <h2 className="text-3xl sm:text-4xl font-syne uppercase tracking-tight text-[#111311] dark:text-white mt-2">
              Save anything. Keep how it looked.
            </h2>
          </div>

          <div className="space-y-24">
            
            {/* INSTAGRAM REEL LIVE CARD */}
            <div className="flex flex-col md:flex-row items-center gap-10 kinetic-reveal kr-up" data-scrub="">
              <div className="w-full md:w-1/2 flex justify-center">
                <div className="w-full max-w-sm bg-white dark:bg-[#000000] border border-black/10 dark:border-[#262626] rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 hover:scale-[1.02]">
                  <div className="p-3 flex items-center justify-between border-b border-black/[0.04] dark:border-[#262626]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full p-[1.5px] bg-gradient-to-tr from-yellow-400 via-rose-500 to-purple-600">
                        <div className="w-full h-full bg-white dark:bg-black rounded-full flex items-center justify-center text-[10px] font-bold text-black dark:text-white font-syne">
                          AR
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-syne font-bold text-[#111] dark:text-white">archive.curator</span>
                          <span className="w-1 h-1 rounded-full bg-[#10B981]" />
                        </div>
                        <span className="text-[10px] font-mono-tech text-gray-500">Kyoto, Japan</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-gray-400">•••</span>
                  </div>

                  <div 
                    className="relative aspect-[4/5] bg-[#1A1D1A] overflow-hidden cursor-pointer select-none group/ig"
                    onDoubleClick={handleDemoDoubleTap}
                  >
                    <img 
                      src="https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800&auto=format&fit=crop&q=80" 
                      alt="Japanese Architecture" 
                      className="w-full h-full object-cover plx-img" 
                    />
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-mono-tech flex items-center gap-1.5">
                      <InstagramIcon className="w-3.5 h-3.5" />
                      <span>Instagram Reel</span>
                    </div>

                    {demoHeartBurst && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-ping">
                        <svg className="w-24 h-24 text-white drop-shadow-2xl fill-white" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                      </div>
                    )}
                  </div>

                  <div className="p-4 space-y-2 font-body">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button onClick={handleToggleLike} className="hover:opacity-75 transition-opacity">
                          {demoIgLiked ? (
                            <svg className="w-6 h-6 text-[#FF3040] fill-[#FF3040]" viewBox="0 0 24 24">
                              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                            </svg>
                          ) : (
                            <InstaHeartIcon />
                          )}
                        </button>
                        <InstaCommentIcon />
                        <InstaShareIcon />
                      </div>
                      <button onClick={() => setDemoSaved(!demoSaved)} className="hover:opacity-75 transition-opacity">
                        {demoSaved ? (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="20 21 12 13.44 4 21 4 3 20 3 20 21" />
                          </svg>
                        ) : (
                          <InstaSaveIcon />
                        )}
                      </button>
                    </div>
                    <div className="text-xs font-bold text-[#111] dark:text-white font-mono-tech">
                      {demoIgLikesCount.toLocaleString()} likes
                    </div>
                    <p className="text-xs text-[#111]/80 dark:text-[#E0E0E0] leading-relaxed">
                      <span className="font-bold mr-1.5 font-syne">archive.curator</span>
                      Wood joinery in temple pavilions. Traditional mortise and tenon joints built without nails, standing 400 years later.
                    </p>
                  </div>
                </div>
              </div>
              <div className="w-full md:w-1/2 space-y-4">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-[10px] font-mono-tech uppercase tracking-wider text-rose-600 dark:text-rose-400 font-bold">
                  <InstagramIcon className="w-3.5 h-3.5" />
                  <span>Instagram</span>
                </div>
                <h3 className="text-3xl font-block uppercase leading-tight">Preserve the exact aesthetic</h3>
                <p className="text-base font-body text-[#111311]/70 dark:text-[#F3F4F3]/70 leading-relaxed">
                  Saving a reel doesn't mean extracting text. It means capturing the poster frame, the precise caption, and the visual weight of the content seamlessly.
                </p>
              </div>
            </div>

            {/* YOUTUBE CINEMA CARD */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-10 kinetic-reveal kr-up" data-scrub="">
              <div className="w-full md:w-1/2 flex justify-center">
                <div className="w-full max-w-md bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 transition-all duration-500 hover:scale-[1.02] group/yt">
                  <div className="relative aspect-video bg-[#111] overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[3.5px] bg-[#FF0000] z-20" />
                    <img 
                      src="https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&auto=format&fit=crop&q=80" 
                      alt="Video thumbnail" 
                      className="w-full h-full object-cover plx-img opacity-90"
                    />
                    <div className="absolute top-3 left-3 z-20 bg-white text-[#FF0000] p-1.5 rounded-full shadow-md">
                      <YouTubeIcon className="w-3.5 h-3.5" />
                    </div>
                    <div className="absolute bottom-3 right-3 z-20 px-2 py-0.5 rounded bg-black/80 font-mono-tech text-[10px] text-white font-bold">
                      18:42 {'//'} 4K
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover/yt:bg-black/40 transition-colors">
                      <PlayCircleIcon className="w-14 h-14 text-white drop-shadow-xl group-hover/yt:scale-110 transition-transform" />
                    </div>
                  </div>
                  <div className="p-5 bg-[#0F110F] space-y-2">
                    <h3 className="text-base font-syne uppercase tracking-tight text-white leading-snug">
                      Why Swiss Typography Never Died: The Architecture of Grid Systems
                    </h3>
                    <div className="flex items-center justify-between text-xs font-mono-tech text-gray-400 pt-1">
                      <span>Studio Form Archive</span>
                      <span>148K views • 2 weeks ago</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="w-full md:w-1/2 space-y-4">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-[10px] font-mono-tech uppercase tracking-wider text-red-600 dark:text-red-400 font-bold">
                  <YouTubeIcon className="w-3.5 h-3.5" />
                  <span>YouTube</span>
                </div>
                <h3 className="text-3xl font-block uppercase leading-tight">Cinema-grade ingestion</h3>
                <p className="text-base font-body text-[#111311]/70 dark:text-[#F3F4F3]/70 leading-relaxed">
                  Rich media isn't stripped of its context. Video essays, shorts, and full documentaries are securely encapsulated with their full resolution thumbnails and timestamps.
                </p>
              </div>
            </div>

            {/* PINTEREST PIN CARD */}
            <div className="flex flex-col md:flex-row items-center gap-10 kinetic-reveal kr-up" data-scrub="">
              <div className="w-full md:w-1/2 flex justify-center">
                <div className="w-full max-w-xs bg-white dark:bg-[#1C1D20] rounded-2xl overflow-hidden shadow-2xl border border-black/10 dark:border-white/10 transition-all duration-500 hover:scale-[1.02] group/pin">
                  <div className="relative aspect-[2/3] bg-[#222] overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[4px] bg-[#E60023] z-20" />
                    <img 
                      src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80" 
                      alt="Interior Design Pin" 
                      className="w-full h-full object-cover plx-img"
                    />
                    <div className="absolute top-3 left-3 z-20 bg-white text-[#E60023] p-1.5 rounded-full shadow-md">
                      <PinterestIcon className="w-3.5 h-3.5" />
                    </div>
                    <div className="absolute top-3 right-3 z-20">
                      <span className="bg-[#E60023] hover:bg-[#ad081b] text-white text-xs font-syne font-bold px-3.5 py-1.5 rounded-full shadow-lg">
                        Save
                      </span>
                    </div>
                    <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-between">
                      <span className="text-white text-xs font-mono-tech truncate">archdaily.com</span>
                      <span className="text-white/80"><ExternalLinkIcon /></span>
                    </div>
                  </div>
                  <div className="p-4 space-y-1.5">
                    <h4 className="text-sm font-syne uppercase tracking-tight text-[#111] dark:text-white">
                      Minimalist Concrete Residence
                    </h4>
                    <p className="text-xs font-body text-gray-500 dark:text-gray-400">
                      Cast-in-place raw concrete walls with floating cantilevered timber staircase.
                    </p>
                  </div>
                </div>
              </div>
              <div className="w-full md:w-1/2 space-y-4">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-600/10 border border-red-600/20 text-[10px] font-mono-tech uppercase tracking-wider text-red-600 dark:text-red-500 font-bold">
                  <PinterestIcon className="w-3.5 h-3.5" />
                  <span>Pinterest</span>
                </div>
                <h3 className="text-3xl font-block uppercase leading-tight">Moodboards unified</h3>
                <p className="text-base font-body text-[#111311]/70 dark:text-[#F3F4F3]/70 leading-relaxed">
                  Consolidate sprawling inspiration boards into a single, high-definition masonry layout. The aesthetic remains completely intact, without the algorithm dictating your flow.
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* CHAPTER 01: UNIVERSAL INGESTION */}
      <section id="ingestion" className="py-12 sm:py-16 px-5 sm:px-10 max-w-6xl mx-auto z-10 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-5 kinetic-reveal kr-roll-left space-y-6">
            <div className="inline-flex items-center gap-2 text-[10px] font-mono-tech uppercase tracking-[0.25em] text-[#1A3826] dark:text-[#10B981] font-bold">
              <span>Chapter 01</span>
              <span>{'//'}</span>
              <span>Universal Ingestion</span>
            </div>
            
            <h2 className="text-5xl sm:text-7xl font-tall-block uppercase tracking-tight leading-[0.92] text-[#111311] dark:text-white">
              One click. <br />
              Zero friction. <br />
              ANY MEDIA FORMAT.
            </h2>

            <p className="text-base font-body text-[#111311]/70 dark:text-[#F3F4F3]/70 leading-relaxed">
              Right-click anywhere on the web, click our extension, or trigger an iOS shortcut. inntoit automatically identifies YouTube shorts, Instagram reels, Pinterest boards, and raw PDFs — extracting high-res assets while stripping away tracking parameters and algorithmic bloat.
            </p>

            <ul className="space-y-3 font-mono-tech text-xs text-[#111311]/80 dark:text-white/80">
              <li className="flex items-center gap-2.5">
                <span className="text-[#10B981] font-bold">✓</span> Save from your browser or phone in one tap
              </li>
              <li className="flex items-center gap-2.5">
                <span className="text-[#10B981] font-bold">✓</span> Keeps the exact moment: timestamp, caption, thread
              </li>
              <li className="flex items-center gap-2.5">
                <span className="text-[#10B981] font-bold">✓</span> Works on Chrome, Brave, Arc, Safari, and Mobile
              </li>
            </ul>
          </div>

          <div className="lg:col-span-7 kinetic-reveal kr-roll-right">
            <div className="p-6 sm:p-8 rounded-[36px] glass-brutal border border-black/10 dark:border-white/10 shadow-2xl space-y-6">
              
              <div className="flex items-center justify-between pb-4 border-b border-black/[0.08] dark:border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#FF5F56]" />
                  <span className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                  <span className="w-3 h-3 rounded-full bg-[#27C93F]" />
                </div>
                <div className="px-4 py-1 rounded-full bg-black/5 dark:bg-white/5 font-mono-tech text-[10px] text-gray-500">
                  {'https://instagram.com/p/DB12345'}
                </div>
                <div className="w-4" />
              </div>

              <div className="relative rounded-2xl overflow-hidden bg-black/5 dark:bg-white/5 p-6 border border-black/5 dark:border-white/5">
                <div className="max-w-xs ml-auto rounded-2xl bg-white dark:bg-[#181B18] shadow-2xl border border-black/10 dark:border-white/10 p-2 space-y-1 font-body text-xs">
                  <div className="px-3 py-2 text-gray-400 font-mono-tech text-[10px] uppercase">Browser Actions</div>
                  <div className="px-3 py-2 rounded-lg text-gray-600 dark:text-gray-400">Copy Link Address</div>
                  <div className="px-3 py-2 rounded-lg text-gray-600 dark:text-gray-400">Inspect Element</div>
                  <div className="px-3 py-2.5 rounded-lg bg-[#1A3826] text-white font-syne font-bold flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
                      Save to inntoit
                    </span>
                    <span className="text-[10px] font-mono-tech">⌘S</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#1A3826]/10 dark:bg-[#10B981]/10 border border-[#10B981]/20 font-mono-tech text-xs text-[#1A3826] dark:text-[#A7F3D0] flex items-center justify-between">
                <span>{`[ EXTRACTED: INSTAGRAM_REEL // RESOLVED_STILL: 800PX ]`}</span>
                <span className="font-bold">SAVED ✓</span>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* CHAPTER 02: THE SPATIAL CANVAS */}
      <section id="canvas" className="py-12 sm:py-16 px-4 sm:px-8 max-w-[1440px] mx-auto z-10 relative">
        <div className="kinetic-reveal kr-up max-w-3xl mb-12 px-4 mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 text-[10px] font-mono-tech uppercase tracking-[0.25em] text-[#1A3826] dark:text-[#10B981] font-bold">
            <span>Chapter 02</span>
            <span>{'//'}</span>
            <span>The Spatial Canvas</span>
          </div>
          <h2 className="text-5xl sm:text-8xl font-tall-block uppercase tracking-tight leading-[0.92] text-[#111311] dark:text-white">
            Your second brain, <br />
            IN HIGH-DEFINITION SPATIAL MASONRY.
          </h2>
          <p className="text-base sm:text-lg font-body text-[#111311]/70 dark:text-[#F3F4F3]/70 leading-relaxed">
            Stop scrolling vertical text lists. inntoit builds an architectural masonry wall where cinema clips, graphic posters, essays, and architecture blueprints coexist in balanced visual harmony.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
            {[
              { id: 'all', label: 'All Artifacts (142)' },
              { id: 'cinema', label: 'Cinema & Video' },
              { id: 'socials', label: 'Social Feeds' },
              { id: 'architecture', label: 'Architecture' },
              { id: 'notes', label: 'Markdown Notes' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveCanvasFilter(f.id as any)}
                className={`px-4 py-1.5 rounded-full text-xs font-mono-tech uppercase tracking-wider transition-all cursor-pointer ${
                  activeCanvasFilter === f.id
                    ? 'bg-[#1A3826] dark:bg-white text-white dark:text-[#111311] font-bold shadow-md'
                    : 'bg-black/5 dark:bg-white/5 text-[#111311]/60 dark:text-white/60 hover:bg-black/10'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3D FREESTYLE FLOATING DASHBOARD STAGE - STRAIGHTENED */}
        <div data-scrub="stage" className="relative py-6 w-full flex items-center justify-center [perspective:1600px]">
          <div className="absolute inset-x-[10%] top-[10%] bottom-[4%] rounded-full blur-[100px] pointer-events-none" style={{ opacity: 'calc(var(--cp, 0) * .6)', background: 'conic-gradient(from 90deg, var(--g1), var(--g2), var(--g3), var(--g4), var(--g5), var(--g1))' }} />
          <div className="hidden sm:block absolute left-[3%] top-[18%] z-20 px-4 py-2 rounded-full g-btn font-block text-lg uppercase shadow-2xl float-y" style={{ opacity: 'var(--cp, 0)', transform: 'translate3d(calc((1 - var(--cp, 0)) * -90px), calc((1 - var(--cp, 0)) * 70px), 0)' }}>Saved at 2 a.m.</div>
          <div className="hidden sm:block absolute right-[3%] bottom-[16%] z-20 px-4 py-2 rounded-full bg-white text-[#06120B] font-block text-lg uppercase shadow-2xl float-y" style={{ opacity: 'var(--cp, 0)', animationDelay: '-2s', transform: 'translate3d(calc((1 - var(--cp, 0)) * 90px), calc((1 - var(--cp, 0)) * 70px), 0)' }}>Found in 3 seconds</div>
          
          <div 
            className="w-[95%] sm:w-[90%] md:w-[86%] max-w-6xl rounded-[28px] md:rounded-[40px] overflow-hidden shadow-2xl bg-[#111411] z-10 border border-white/10 float-y"
            style={{ opacity: 'calc(.35 + var(--cp, 0) * .65)', transform: 'rotateX(calc((1 - var(--cp, 0)) * 16deg)) translateY(calc((1 - var(--cp, 0)) * 90px)) scale(calc(.9 + var(--cp, 0) * .1))', transformOrigin: '50% 100%' }}
          >
            <div className="w-full bg-[#161916] px-5 py-3.5 flex items-center justify-between border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-[#FF5F56]" />
                <span className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                <span className="w-3 h-3 rounded-full bg-[#27C93F]" />
              </div>
              <span className="text-[10px] font-mono-tech uppercase tracking-[0.25em] text-white/50">{'inntoit://sanctuary/masonry-wall'}</span>
              <div className="flex items-center gap-2 text-[10px] font-mono-tech text-white/40">
                <span>FILTER: {activeCanvasFilter.toUpperCase()}</span>
              </div>
            </div>

            <img 
              src="/dashboard-preview.png" 
              alt="Dashboard Masonry View" 
              className="w-full h-auto object-cover max-h-[750px]"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                if (e.currentTarget.nextElementSibling) e.currentTarget.nextElementSibling.classList.remove('hidden');
              }}
            />
            <div className="hidden w-full h-[550px] bg-[#111411] flex items-center justify-center font-syne text-xl uppercase tracking-wider text-white/30">
              Save dashboard screenshot to public/dashboard-preview.png
            </div>
          </div>
        </div>
      </section>

      {/* CHAPTER 03: THE EDITORIAL FOCUS CHAMBER */}
      <section id="chamber" className="py-12 sm:py-16 px-5 sm:px-10 max-w-7xl mx-auto z-10 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-8 kinetic-reveal kr-roll-left order-2 lg:order-1">
            <div className="rounded-[36px] overflow-hidden shadow-2xl border border-black/10 dark:border-white/10 bg-[#0E110E] p-2 sm:p-4">
              
              <div className="w-full bg-[#141714] px-4 py-3 rounded-2xl flex items-center justify-between border border-white/[0.06] mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
                  <span className="text-xs font-mono-tech text-white/80 font-bold">Split-View Focus Chamber</span>
                </div>
                <span className="text-[10px] font-mono-tech text-white/40">⌘K {'//'} EXPANDED</span>
              </div>

              <img 
                src="/editorial-preview.png" 
                alt="Editorial Modal Split View" 
                className="w-full h-auto object-contain rounded-2xl max-h-[800px]"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  if (e.currentTarget.nextElementSibling) e.currentTarget.nextElementSibling.classList.remove('hidden');
                }}
              />
              <div className="hidden w-full h-[600px] bg-[#0E110E] rounded-2xl flex items-center justify-center font-syne text-xl uppercase tracking-wider text-white/30">
                Save editorial screenshot to public/editorial-preview.png
              </div>

            </div>
          </div>

          <div className="lg:col-span-4 kinetic-reveal kr-roll-right space-y-6 order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 text-[10px] font-mono-tech uppercase tracking-[0.25em] text-[#1A3826] dark:text-[#10B981] font-bold">
              <span>Chapter 03</span>
              <span>{'//'}</span>
              <span>The Focus Chamber</span>
            </div>
            
            <h2 className="text-5xl sm:text-6xl font-tall-block uppercase tracking-tight leading-[0.92] text-[#111311] dark:text-white">
              Read. Annotate. <br />
              SYNTHESIZE WITHOUT DECAY.
            </h2>

            <p className="text-base font-body text-[#111311]/70 dark:text-[#F3F4F3]/70 leading-relaxed">
              Clicking any card expands into the Focus Chamber. The left pane hosts the high-resolution media — playable YouTube shorts, Instagram post with comments, or zoomable Pinterest pin. The right pane hosts your personal TipTap markdown notebook, nested folder taxonomy, and source backlinks.
            </p>

            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-2xl glass-brutal border border-black/[0.08] dark:border-white/[0.08]">
                <h4 className="text-sm font-syne uppercase text-[#111] dark:text-white font-bold">Left Media Wing</h4>
                <p className="text-xs font-body text-gray-500 mt-1">Direct interactive players. Watch YouTube essays, review Instagram quotes, inspect pin recipes.</p>
              </div>

              <div className="p-4 rounded-2xl glass-brutal border border-black/[0.08] dark:border-white/[0.08]">
                <h4 className="text-sm font-syne uppercase text-[#111] dark:text-white font-bold">Right Notebook Wing</h4>
                <p className="text-xs font-body text-gray-500 mt-1">Rich TipTap markdown notes, nested multi-level folder structure, and timestamp history.</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* WHY IT MATTERS: THE EMOTIONAL CHAPTER */}
      <section id="integrity" className="py-12 sm:py-16 px-5 sm:px-10 max-w-6xl mx-auto z-10 relative">
        <div className="kinetic-reveal kr-up max-w-4xl space-y-4 mb-8">
          <h2 className="font-tall-block uppercase text-5xl sm:text-8xl leading-[0.9] text-[#111311] dark:text-white">
            Some saves are just links.<br />Some are who you&apos;re becoming.
          </h2>
          <p className="max-w-xl text-lg font-body text-[#111311]/70 dark:text-white/70 leading-relaxed">inntoit is for the second kind. Pick a moment and see what happens to it.</p>
        </div>

        <div className="grid lg:grid-cols-12 gap-5">
          <div className="lg:col-span-4 flex lg:flex-col gap-3 overflow-x-auto lg:overflow-visible pb-1">
            {MOMENTS.map((m, i) => (
              <button key={m.tab} onClick={() => setMoment(i)}
                className={`text-left shrink-0 px-6 py-5 rounded-3xl font-block uppercase text-2xl leading-[0.95] transition-all ${moment === i ? 'g-btn scale-[1.02] shadow-xl' : 'bg-black/5 dark:bg-white/5 text-[#111311]/70 dark:text-white/70 hover:bg-black/10 dark:hover:bg-white/10'}`}>
                {m.tab}
              </button>
            ))}
          </div>

          <div key={moment} className="lg:col-span-8 grid sm:grid-cols-2 gap-5">
            <div className="beat-in rounded-[32px] p-6 sm:p-7 glass-brutal border border-black/10 dark:border-white/10 flex flex-col gap-4">
              <div className="aspect-[4/3] rounded-2xl flex items-center justify-center text-center p-4 grayscale opacity-60" style={{ background: 'repeating-linear-gradient(135deg, rgba(120,120,120,.18) 0 10px, rgba(120,120,120,.08) 10px 20px)' }}>
                <span className="font-block uppercase text-2xl text-[#111311]/60 dark:text-white/60">Nothing here anymore</span>
              </div>
              <p className="font-block uppercase text-xl text-[#111311]/60 dark:text-white/60">Without it</p>
              <p className="text-base font-body text-[#111311]/75 dark:text-white/75 leading-relaxed">{MOMENTS[moment].lost}</p>
            </div>
            <div className="beat-in g-border rounded-[32px] p-6 sm:p-7 bg-[#0C110D] text-white flex flex-col gap-4" style={{ animationDelay: '0.15s' }}>
              <div className="aspect-[4/3] rounded-2xl p-4 flex flex-col justify-between" style={{ background: MOMENTS[moment].bg }}>
                <span className="text-xs font-body font-semibold opacity-80">{MOMENTS[moment].src}</span>
                <span className="font-block uppercase text-3xl sm:text-4xl leading-[0.92]">{MOMENTS[moment].title}</span>
              </div>
              <p className="font-block uppercase text-xl text-white">With inntoit</p>
              <p className="text-base font-body text-white/85 leading-relaxed">{MOMENTS[moment].kept}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid md:grid-cols-3 gap-5">
          {[
            ['Keeps the picture', 'Not just the address. The poster, the frame, the mood.'],
            ['Finds it like you remember', 'Search a word, a colour, or the note you jotted down.'],
            ['Stays yours', 'No ads, nothing sold. Take everything with you any time.'],
          ].map(([h, p]) => (
            <div key={h} className="kinetic-reveal kr-up">
              <h3 className="font-block uppercase text-3xl leading-[0.95]">{h}</h3>
              <p className="mt-2 text-sm font-body text-[#111311]/70 dark:text-white/70 leading-relaxed">{p}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ACCESS & PRICING */}
      <section id="pricing" className="py-12 sm:py-16 px-5 sm:px-10 max-w-5xl mx-auto z-10 relative">
        <div className="kinetic-reveal kr-up text-center max-w-2xl mx-auto mb-10 space-y-3">
          <p className="text-[10px] font-mono-tech uppercase tracking-[0.3em] text-[#1A3826] dark:text-[#10B981] font-bold">Access Tiers</p>
          <h2 className="text-3xl sm:text-5xl font-syne-black uppercase tracking-tight text-[#111] dark:text-white">
            Space For Your Mind.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="kinetic-reveal kr-roll-left p-8 sm:p-12 rounded-[40px] glass-brutal border border-black/10 dark:border-white/10 flex flex-col justify-between">
            <div>
              <span className="text-xs font-syne uppercase tracking-widest text-[#1A3826] dark:text-[#10B981] font-bold">Curator Tier</span>
              <div className="flex items-baseline gap-2 my-6">
                <span className="text-5xl sm:text-6xl font-syne-black">$0</span>
                <span className="text-xs font-mono-tech text-gray-500 font-bold uppercase tracking-widest">/ FOREVER</span>
              </div>
              <p className="text-sm font-body text-[#111]/70 dark:text-white/70 leading-relaxed mb-8">
                The complete visual archive engine. Unlimited saves, pictures that never break, and a reading room for every find.
              </p>
              <ul className="space-y-3.5 text-xs sm:text-sm font-body font-semibold">
                <li className="flex items-center gap-3 text-[#1A3826] dark:text-[#10B981]">✓ Unlimited URLs &amp; Notes</li>
                <li className="flex items-center gap-3 text-[#1A3826] dark:text-[#10B981]">✓ Pictures that never break</li>
                <li className="flex items-center gap-3 text-[#1A3826] dark:text-[#10B981]">✓ Notes beside everything you save</li>
                <li className="flex items-center gap-3 text-[#1A3826] dark:text-[#10B981]">✓ Universal Social &amp; Video Embeds</li>
              </ul>
            </div>
            <Link 
              href="/login" 
              className="mt-10 w-full py-4 rounded-full border border-black/15 dark:border-white/15 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black text-center text-xs font-syne uppercase tracking-widest transition-all shadow-sm"
            >
              Start Free Vault
            </Link>
          </div>

          <div className="kinetic-reveal kr-roll-right p-8 sm:p-12 g-border rounded-[40px] bg-[#0C110D] text-white flex flex-col justify-between shadow-2xl relative">
            <div className="absolute top-6 right-8">
              <span className="px-3.5 py-1 rounded-full bg-[#1A3826] text-white text-[10px] font-mono-tech uppercase tracking-widest font-bold">
                ARCHITECT
              </span>
            </div>
            <div>
              <span className="text-xs font-syne uppercase tracking-widest text-[#A7F3D0] font-bold">Heavy Storage</span>
              <div className="flex items-baseline gap-2 my-6">
                <span className="text-5xl sm:text-6xl font-syne-black">$5</span>
                <span className="text-xs font-mono-tech text-white/50 uppercase tracking-widest font-bold">/ MONTH</span>
              </div>
              <p className="text-sm font-body text-white/70 leading-relaxed mb-8">
                For creative technologists, researchers, and designers who require raw media preservation and in-document intelligence.
              </p>
              <ul className="space-y-3.5 text-xs sm:text-sm font-body font-semibold text-white/90">
                <li className="flex items-center gap-3 text-[#A7F3D0]">✓ Everything in Curator</li>
                <li className="flex items-center gap-3 text-[#A7F3D0]">✓ Unlimited Raw PDF &amp; Media Uploads</li>
                <li className="flex items-center gap-3 text-[#A7F3D0]">✓ Search inside your PDFs</li>
                <li className="flex items-center gap-3 text-[#A7F3D0]">✓ Smart tags, added for you</li>
              </ul>
            </div>
            <Link 
              href="/login" 
              className="mt-10 w-full py-4 rounded-full g-btn text-center text-xs font-syne uppercase tracking-widest shadow-xl transition-all"
            >
              Claim Pro Vault
            </Link>
          </div>

        </div>
      </section>

      {/* EPILOGUE */}
      <section className="py-12 sm:py-16 px-5 sm:px-12 max-w-4xl mx-auto text-center z-10 relative">
        <div className="kinetic-reveal kr-up space-y-6">
          <p className="text-[10px] font-mono-tech uppercase tracking-[0.35em] text-[#1A3826] dark:text-[#10B981] font-bold">Epilogue</p>
          <h2 className="text-5xl sm:text-8xl font-tall-block uppercase tracking-tight leading-[0.92]">
            Stop hoarding tabs. <br />
            BEGIN YOUR SANCTUARY.
          </h2>
          <p className="max-w-xl mx-auto text-base sm:text-lg font-body text-[#111311]/70 dark:text-[#F3F4F3]/70 leading-relaxed">
            Build a permanent visual library for the references, cinema, and discoveries that shape your intellect and inform your work.
          </p>

          <Link 
            href="/login" 
            className="inline-flex h-14 px-10 rounded-full bg-[#111311] dark:bg-white text-white dark:text-[#111311] text-xs font-syne uppercase tracking-widest items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl"
          >
            <span>Open Your Vault Free</span>
            <span className="text-base font-bold">→</span>
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer data-scrub="" className="relative overflow-hidden bg-[#06110B] text-[#F3F4F3] pt-14">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(55% 60% at 12% 0%, rgba(16,185,129,.35), transparent 65%), radial-gradient(45% 55% at 100% 30%, rgba(255,106,61,.25), transparent 65%), radial-gradient(50% 50% at 60% 100%, rgba(99,102,241,.22), transparent 65%)' }} />
        <div className="relative max-w-7xl mx-auto px-6 sm:px-12 grid lg:grid-cols-12 gap-10 items-end">
          <div className="lg:col-span-7 kinetic-reveal kr-up">
            <h2 className="font-tall-block uppercase text-[clamp(2.75rem,7.6vw,7rem)] leading-[0.92]">
              Stop saving links.<br />Keep the picture.
            </h2>
            <Link href="/login" className="g-btn g-border group mt-8 inline-flex h-14 px-9 rounded-full font-block text-lg uppercase items-center gap-3 hover:scale-105 active:scale-95 transition-transform">
              Open your vault free <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
          <div className="lg:col-span-5 grid grid-cols-2 gap-x-8 gap-y-8">
            {[
              { h: 'Explore', links: [['Ingestion', '#ingestion'], ['Canvas', '#canvas'], ['Focus chamber', '#chamber'], ['Why inntoit', '#integrity']] },
              { h: 'Product', links: [['Live cards', '#protocol'], ['Pricing', '#pricing'], ['Sign in', '/login']] },
              { h: 'Elsewhere', links: [['Twitter', 'https://x.com'], ['GitHub', 'https://github.com'], ['Privacy', '#'], ['Terms', '#']] },
            ].map((col) => (
              <div key={col.h}>
                <h3 className="font-block uppercase text-2xl mb-2">{col.h}</h3>
                <ul className="space-y-1.5 text-sm font-body font-medium text-white/70">
                  {col.links.map(([label, href]) => (
                    <li key={label}>
                      <a href={href} {...(href.startsWith('http') ? { target: '_blank', rel: 'noreferrer' } : {})} className="hover:text-white hover:translate-x-1 inline-block transition-all">{label}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="flex items-end justify-between gap-3 text-xs font-body text-white/50">
              <span>&copy; {new Date().getFullYear()} inntoit</span>
              <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="px-3.5 py-2 rounded-full border border-white/20 hover:bg-white hover:text-black transition-colors font-semibold">Top ↑</button>
            </div>
          </div>
        </div>
        <div aria-hidden="true" className="relative mt-6 font-tall-block uppercase text-center text-[21vw] leading-[0.85] whitespace-nowrap select-none g-text" style={{ transform: 'translateY(calc((1 - min(var(--p, 0) * 1.8, 1)) * 60% + 8%))' }}>inntoit</div>
      </footer>

    </main>
  )
}