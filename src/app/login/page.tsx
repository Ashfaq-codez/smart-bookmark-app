'use client'

import { createClient } from '@/utils/supabase/client'
import { useState, useEffect, useId } from 'react'
import { Merienda } from 'next/font/google'
import { motion, useReducedMotion } from 'motion/react'
import { Loader2 } from 'lucide-react'

// The watercolour wall: arched stained-glass window, blossom branch, tiled skirting (public/login-bg.webp,
// made from public/login.png with the painted card taken out). The sign-in card is real HTML on top of it.
//   Desktop: the whole painting framed like a window in the middle of the page, the card where the design has
//   it (sizes follow the painting's width, so it matches at every screen size).
//   Phones and tall screens: the window on top, the card below it, the tiles along the bottom.
// Always the light painting, also when the app is in dark mode: the page is the artwork.

const hand = Merienda({ weight: ['400', '500'], subsets: ['latin'], display: 'swap' })

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

// Watercolour paper (public/login-paper*.webp): fine grain, soft blooms, pigment pooled at the torn (deckled) edges.
// drop-shadow follows the torn outline, so the sheet seems to rest on the wall.
const PAPER = 'bg-no-repeat bg-[length:100%_100%] [filter:drop-shadow(0_6px_14px_rgba(110,80,40,0.16))]'
const INK = 'text-[#4A3F33]'


function SignInCard({ wide, loading, error, onSignIn }: { wide: boolean; loading: boolean; error: string | null; onSignIn: () => void }) {
  // Wide: sizes in cqw (hundredths of the painting's width) so the card scales with it. Phone: fixed sizes.
  const s = wide
    ? { pad: 'px-[1.6cqw]', title: 'text-[3cqw]', sub: 'text-[1.65cqw] mt-[0.5cqw]', btn: 'mt-[2.2cqw] w-[19cqw] h-[4.2cqw] gap-[0.9cqw] text-[1.32cqw]', icon: 'w-[2.2cqw] h-[2.2cqw]', err: 'text-[0.85cqw] mt-[1cqw]' }
    : { pad: 'px-6 py-9', title: 'text-[40px]', sub: 'text-[19px] mt-1.5', btn: 'mt-7 w-full max-w-[290px] h-[54px] gap-3 text-[17px]', icon: 'w-7 h-7', err: 'text-[13px] mt-4' }
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`${hand.className} ${PAPER} ${s.pad} ${INK} flex flex-col items-center justify-center text-center ${wide ? 'w-full h-full bg-[url(/login-paper.webp)]' : 'w-full max-w-[380px] bg-[url(/login-paper-wide.webp)]'}`}
    >
      <h1 className={`${s.title} leading-tight font-medium`}>Welcome</h1>
      <p className={`${s.sub} leading-tight opacity-90`}>Sign in to continue</p>
      <button
        type="button"
        onClick={onSignIn}
        disabled={loading}
        className={`${s.btn} flex items-center justify-center bg-[url(/login-paper-btn.webp)] bg-no-repeat bg-[length:100%_100%] [filter:drop-shadow(0_2px_3px_rgba(110,80,40,0.18))] transition-[filter,transform] duration-200 hover:[filter:drop-shadow(0_4px_8px_rgba(110,80,40,0.22))_brightness(1.03)] active:scale-[0.98] focus:outline-none focus-visible:outline-2 focus-visible:outline-dashed focus-visible:outline-offset-4 focus-visible:outline-[#8A6E4B] disabled:opacity-70 disabled:cursor-wait cursor-pointer`}
      >
        {loading ? <Loader2 className={`${s.icon} animate-spin`} strokeWidth={1.75} /> : <GoogleIcon className={s.icon} />}
        <span>{loading ? 'Connecting…' : 'Sign in with Google'}</span>
      </button>
      {error && <p role="alert" className={`${s.err} font-sans text-[#A3402F]`}>{error}</p>}
    </motion.div>
  )
}

// Cherry blossom petals: each one leaves the branch, sways side to side and falls all the way to the bottom of
// the box it floats in, then starts again. Positions and drift are in % of that box; the same "random" values on
// the server and in the browser (seeded), so the page never flickers while loading.
type Petal = { x: number; y: number; dx: number; sway: number; size: number; spin: number; dur: number; delay: number; tint: string }

function makePetals(n: number, seed: number, area: { x: [number, number]; y: [number, number] }, drift: [number, number], dur: [number, number]): Petal[] {
  let s = seed
  const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280)
  const span = (a: [number, number]) => a[0] + r() * (a[1] - a[0])
  return Array.from({ length: n }, (_, i) => ({
    x: span(area.x), y: span(area.y), dx: span(drift), sway: 2 + r() * 4,
    size: 1 + r() * 0.9, spin: (r() > 0.5 ? 1 : -1) * (240 + r() * 420),
    dur: span(dur),
    // spread over one whole fall, so some are always on their way down
    delay: (i / n) * dur[1] * 0.6 + r(),
    tint: ['#F3A9BB', '#EE97AD', '#F6B8C6', '#E9889F', '#F2A3B6'][Math.floor(r() * 5)],
  }))
}

// Desktop: the branch is between 33% and 62% across the painting; petals blow right and fall to the tiles.
const DESKTOP_PETALS = makePetals(30, 7, { x: [33, 62], y: [34, 70] }, [4, 26], [9, 15])
// Phone: the branch is on the right of the window picture at the top; petals fall down the whole screen.
const PHONE_PETALS = makePetals(18, 11, { x: [64, 96], y: [14, 38] }, [-38, 4], [10, 16])

function Petals({ petals, unit }: { petals: Petal[]; unit: 'cqw' | 'px' }) {
  const reduce = useReducedMotion()
  if (reduce) return null
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none">
      {petals.map((p, i) => {
        const size = unit === 'cqw' ? `${p.size}cqw` : `${Math.round(p.size * 13)}px`
        const end = p.x + p.dx
        return (
          <motion.div
            key={i}
            className="absolute"
            style={{ width: size, height: size, left: `${p.x}%`, top: `${p.y}%` }}
            initial={{ opacity: 0 }}
            animate={{
              top: [`${p.y}%`, '104%'],
              left: [`${p.x}%`, `${p.x + p.dx * 0.3 + p.sway}%`, `${p.x + p.dx * 0.55 - p.sway}%`, `${p.x + p.dx * 0.8 + p.sway}%`, `${end}%`],
              opacity: [0, 1, 1, 1, 0.9],
            }}
            transition={{
              top: { duration: p.dur, delay: p.delay, repeat: Infinity, ease: [0.45, 0.05, 0.75, 0.95] },
              left: { duration: p.dur, delay: p.delay, repeat: Infinity, ease: 'easeInOut' },
              opacity: { duration: p.dur, delay: p.delay, repeat: Infinity, times: [0, 0.06, 0.5, 0.95, 1], ease: 'linear' },
            }}
          >
            <motion.svg
              viewBox="0 0 20 24"
              className="w-full h-full block [filter:drop-shadow(0_1px_1.5px_rgba(150,70,90,0.28))]"
              // turns as it falls, and flutters (gets a little narrower and back) like a real petal
              animate={{ rotate: [0, p.spin], scaleX: [1, 0.55, 1] }}
              transition={{ rotate: { duration: p.dur, delay: p.delay, repeat: Infinity, ease: 'linear' }, scaleX: { duration: 1.6 + (i % 4) * 0.4, repeat: Infinity, ease: 'easeInOut' } }}
            >
              {/* a cherry blossom petal: an oval, narrow at the base, with the little notch at its tip */}
              <path d="M10 23C5 19 2 13 3 8 4 4 7 1.5 8.5 3L10 5l1.5-2C13 1.5 16 4 17 8c1 5-2 11-7 15z" fill={p.tint} stroke="#C96F88" strokeOpacity="0.45" strokeWidth="0.7" />
              <path d="M10 22c-.6-4-.6-9 0-15" stroke="#D97F96" strokeOpacity="0.35" strokeWidth="0.9" fill="none" strokeLinecap="round" />
              <path d="M6 9c1.5-2 3-2.5 3.5-2" stroke="#fff" strokeOpacity="0.5" strokeWidth="1.1" fill="none" strokeLinecap="round" />
            </motion.svg>
          </motion.div>
        )
      })}
    </div>
  )
}

// A common kingfisher, flying the way real ones do: fast, straight, low dashes with the wings whirring too quickly
// to see clearly, sudden changes of speed and direction, short hovers with the body almost upright and the bill
// pointing down, and a quick angled dip before dashing off again. It never glides. Its route keeps clear of the
// sign-in card. Points are in % of the box it flies in.
type Pt = [number, number]
type Leg = { to: Pt; s: number; hover?: boolean }
// Desktop: in from the left low over the window, a hover by the branch, a dip, dashes over the wall, and away.
const DESKTOP_FLIGHT: { from: Pt; legs: Leg[] } = { from: [-8, 46], legs: [
  { to: [20, 40], s: 1.6 }, { to: [34, 30], s: 1.1 }, { to: [36, 28], s: 1.4, hover: true },
  { to: [44, 44], s: 0.7 }, { to: [62, 26], s: 1.4 }, { to: [63, 25], s: 1.2, hover: true },
  { to: [44, 14], s: 1.2 }, { to: [16, 22], s: 1.5 }, { to: [-8, 46], s: 1.3 }, { to: [-8, 46], s: 6 },
] }
// Phone: across the window picture, a hover by the branch, down the side of the card and back.
const PHONE_FLIGHT: { from: Pt; legs: Leg[] } = { from: [-16, 22], legs: [
  { to: [40, 16], s: 1.5 }, { to: [72, 22], s: 1 }, { to: [73, 21], s: 1.4, hover: true },
  { to: [30, 34], s: 1.1 }, { to: [10, 86], s: 1.6 }, { to: [60, 92], s: 1.2 }, { to: [96, 82], s: 0.9 },
  { to: [80, 32], s: 1.6 }, { to: [-16, 22], s: 1.4 }, { to: [-16, 22], s: 6 },
] }

// Keyframes for the whole route: where it is, which way it faces and how it is tilted, with the time of each.
// Dashes speed up and slow down (a fast burst), hovers wobble on the spot with the body upright.
function route({ from, legs }: { from: Pt; legs: Leg[] }) {
  const left = [`${from[0]}%`], top = [`${from[1]}%`], rot = [0], head = [0], face = [1], at = [0]
  const easeL: ([number, number, number, number] | 'linear')[] = []
  let pos = from, t = 0, facing = 1
  for (const leg of legs) {
    const dx = leg.to[0] - pos[0], dy = leg.to[1] - pos[1]
    if (leg.hover) {
      // hovering: tiny bobs on the spot, body tipped up almost upright, head turned so the bill points down
      const wob: Pt[] = [[leg.to[0] + 0.4, leg.to[1] - 0.6], [leg.to[0] - 0.3, leg.to[1] + 0.4], [leg.to[0] + 0.2, leg.to[1] - 0.3], leg.to]
      wob.forEach((w, i) => {
        t += leg.s / wob.length
        left.push(`${w[0]}%`); top.push(`${w[1]}%`); rot.push(-58 + (i % 2 ? 4 : -3)); head.push(92 + (i % 2 ? -4 : 3)); face.push(facing); at.push(t)
        easeL.push('linear' as const)
      })
    } else {
      if (Math.abs(dx) > 0.5) facing = dx >= 0 ? 1 : -1
      // a dash: body level, nose slightly into the climb or dip
      const tilt = Math.max(-14, Math.min(22, (Math.atan2(dy, Math.abs(dx) || 0.001) * 180) / Math.PI * 0.5))
      t += leg.s
      left.push(`${leg.to[0]}%`); top.push(`${leg.to[1]}%`); rot.push(tilt); head.push(0); face.push(facing); at.push(t)
      easeL.push([0.3, 0, 0.2, 1])   // bursts off quickly, brakes into the next move
    }
    pos = leg.to
  }
  return { left, top, rot, head, face, times: at.map((x) => x / t), duration: t, ease: easeL }
}

// The near wing, short and rounded like a kingfisher's, in three positions (same drawing steps so it can move
// smoothly between them). The shoulder is at (31, 17).
const WING_UP = 'M31 17 C29 8 23 2 15 1 C17 4 19 7 20 9 C18 8 16 8 14 9 C19 12 25 15 29 19 Z'
const WING_MID = 'M31 17 C26 13 18 12 10 14 C14 16 17 17 19 18 C17 19 15 20 13 21 C19 22 25 21 29 20 Z'
const WING_DOWN = 'M31 17 C29 24 24 31 17 35 C19 31 20 28 21 26 C19 27 17 28 15 30 C19 26 24 22 29 20 Z'
// whirring: one stroke in 45 ms, back and forth, so a full beat takes under a tenth of a second
const WHIRR = { duration: 0.045, repeat: Infinity, repeatType: 'mirror' as const, ease: 'easeInOut' as const }

function Bird({ path, size }: { path: { from: Pt; legs: Leg[] }; size: string }) {
  const reduce = useReducedMotion()
  // each bird's colour fills need their own names (the desktop and the phone bird are both on the page)
  const id = useId().replace(/:/g, '')
  const r = route(path)
  const go = (ease: typeof r.ease | 'linear') => ({ duration: r.duration, times: r.times, repeat: Infinity, ease })
  if (reduce) return null
  const turn = (p: number) => (p < 0.12 ? p / 0.12 : 1)
  const u = (n: string) => `url(#${n}-${id})`
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute"
        style={{ width: size, height: `calc(${size} * 0.58)`, left: r.left[0], top: r.top[0], marginLeft: `calc(${size} / -2)` }}
        animate={{ left: r.left, top: r.top, scaleX: r.face }}
        // turning round is quick: done in the first moment of the dash, not stretched over it
        transition={{ left: go(r.ease), top: go(r.ease), scaleX: { duration: r.duration, times: r.times, repeat: Infinity, ease: turn } }}
      >
        <motion.div className="w-full h-full" animate={{ rotate: r.rot }} transition={{ rotate: go(r.ease) }}>
          <svg viewBox="0 0 70 40" className="w-full h-full block overflow-visible [filter:drop-shadow(0_3px_2.5px_rgba(20,40,60,0.25))]">
            <g filter={`url(#kf-paint-${id})`}>
            <defs>
              {/* painted look: slightly uneven edges and a little paper grain, like the rest of the picture */}
              <filter id={`kf-paint-${id}`} x="-10%" y="-10%" width="120%" height="120%">
                <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" result="n" />
                <feDisplacementMap in="SourceGraphic" in2="n" scale="0.9" xChannelSelector="R" yChannelSelector="G" result="d" />
                <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.9 0.62" result="grain" />
                <feComposite in="grain" in2="d" operator="in" result="g" />
                <feBlend in="d" in2="g" mode="multiply" />
              </filter>
              <linearGradient id={`kf-back-${id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#1E6FA8" /><stop offset="1" stopColor="#2B8FC4" />
              </linearGradient>
              <linearGradient id={`kf-belly-${id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#F08A3C" /><stop offset="1" stopColor="#D9642A" />
              </linearGradient>
              <linearGradient id={`kf-wing-${id}`} x1="1" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#2A8BC0" /><stop offset="1" stopColor="#14507E" />
              </linearGradient>
              <linearGradient id={`kf-bill-${id}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#E8562A" /><stop offset="0.75" stopColor="#D2481F" /><stop offset="1" stopColor="#3A2A24" />
              </linearGradient>
            </defs>
            {/* far wing: a soft blur, it beats too fast to see */}
            <motion.path fill="#164F7C" opacity={0.45} animate={{ d: [WING_DOWN, WING_UP] }} transition={{ d: WHIRR }} style={{ x: 2, y: -1 }} />
            {/* short dark tail */}
            <path d="M14 20 L4 18.5 L5 21 L4 23.5 L14 23 Z" fill="#14507E" />
            {/* body: blue back, bright cyan stripe down the middle of the back, orange underneath */}
            <path d="M12 21 C14 14 24 11 34 12 C41 12.5 44 16 44 21 C44 26 37 29 28 28.5 C20 28 14 25.5 12 21 Z" fill={u('kf-back')} />
            <path d="M14 23.5 C20 28.5 34 30.5 43 23 C42 27 35 29.5 27 29 C21 28.6 16.5 26.5 14 23.5 Z" fill={u('kf-belly')} />
            <path d="M16 23 C24 26 36 26 43.5 21" fill="none" stroke={u('kf-belly')} strokeWidth="3.4" />
            <path d="M14 18.5 C20 14.5 28 13.4 35 14" fill="none" stroke="#5FE0F2" strokeWidth="1.6" strokeLinecap="round" opacity="0.9" />
            {/* red feet tucked under the belly */}
            <path d="M28 28.6 l-1.6 2.2 M31 28.6 l-1 2.4" stroke="#E2453A" strokeWidth="1.1" strokeLinecap="round" />
            {/* head and bill turn down while hovering (pivot at the neck) */}
            {/* view-box: the pivot (40, 17) is in the drawing's own units, at the neck */}
            <motion.g style={{ transformBox: 'view-box', originX: '40px', originY: '17px' }} animate={{ rotate: r.head }} transition={{ rotate: go(r.ease) }}>
            {/* big head: speckled blue crown, orange cheek, blue moustache stripe, white neck patch and throat */}
            <circle cx="46" cy="15.5" r="9" fill="#1F72AA" />
            <path d="M39 11 C42 7.5 49 7 53 10.5" stroke="#4FB3E0" strokeWidth="1" strokeDasharray="0.8 1.6" fill="none" strokeLinecap="round" />
            <path d="M43 13.5 C46 12 51 12.5 54.5 15 C51 16.4 47 16.6 43 15.8 Z" fill="#EE8238" />
            <path d="M41 18.5 C45 20 50 20 54 18 C51 21.5 46 22.5 42 21.5 Z" fill="#1A6699" />
            <path d="M38.5 16 C39.5 14 41.5 13.5 42.5 15 C41.8 17 40 17.6 38.5 16 Z" fill="#F7F4EC" />
            <path d="M47 22.5 C50 23.2 53 22.5 54.5 20.8 C53.5 23.8 50 25 47 24 Z" fill="#F7F4EC" />
            {/* eye, with a highlight */}
            <circle cx="50.2" cy="14" r="1.5" fill="#101418" />
            <circle cx="50.7" cy="13.5" r="0.45" fill="#fff" />
            {/* long, dagger-shaped orange-red bill with a dark tip */}
            <path d="M53.5 14.2 L69.5 17.2 L53.8 18.6 Z" fill={u('kf-bill')} />
            <path d="M53.8 16.5 L69 17.2" stroke="#8C2E14" strokeWidth="0.45" opacity="0.6" />
            </motion.g>
            {/* near wing: speckled azure, whirring; a faint second wing makes the motion blur */}
            <motion.path fill={u('kf-wing')} opacity={0.35} animate={{ d: [WING_UP, WING_MID, WING_DOWN] }} transition={{ d: { ...WHIRR, delay: 0.045 } }} />
            <motion.path fill={u('kf-wing')} animate={{ d: [WING_DOWN, WING_MID, WING_UP] }} transition={{ d: WHIRR }} />
            </g>
          </svg>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) window.location.href = '/dashboard'
    })
  }, [])

  const handleLogin = async () => {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    // window.location.origin works on both localhost and Vercel.
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback`, queryParams: { prompt: 'select_account' } },
    })
    if (error) {
      setError(`Could not sign in: ${error.message}`)
      setLoading(false)
    }
  }

  const card = { loading, error, onSignIn: handleLogin }

  return (
    <main className="min-h-dvh overflow-hidden bg-[#EFE5D6] bg-[radial-gradient(ellipse_at_30%_20%,#F7EFE3_0%,#EFE5D6_55%,#E6D9C5_100%)]">
      {/* Desktop (900px and wider): the whole painting, uncropped, framed like a window of its own in the middle of the page */}
      <div className="hidden min-[900px]:flex min-h-dvh items-center justify-center p-4">
        <div className="relative w-[min(1720px,97vw,calc((100dvh-2rem)*2.357))] aspect-[3168/1344] [container-type:inline-size] rounded-[1.2cqw] overflow-hidden ring-1 ring-[#D8C7AD] shadow-[0_2px_4px_rgba(90,65,35,0.08),0_24px_60px_-12px_rgba(90,65,35,0.28)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/login-bg.webp"
            alt=""
            className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
            draggable={false}
          />
          <Petals petals={DESKTOP_PETALS} unit="cqw" />
          <Bird path={DESKTOP_FLIGHT} size="4cqw" />
          <div className="absolute left-[72.4%] top-[22.4%] w-[22.6%] h-[53%]">
            <SignInCard wide {...card} />
          </div>
        </div>
      </div>

      {/* Phones and tablets: the window on top, the card centred in the space below it, the tiles along the bottom */}
      <div className="relative flex min-[900px]:hidden min-h-dvh flex-col bg-[#FAF4EE]">
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/login-art.webp"
            alt=""
            className="w-full h-[42dvh] min-h-[240px] max-h-[520px] object-cover object-[30%_100%] select-none pointer-events-none [mask-image:linear-gradient(to_bottom,black_80%,transparent)]"
            draggable={false}
          />
        </div>
        <Petals petals={PHONE_PETALS} unit="px" />
        <Bird path={PHONE_FLIGHT} size="50px" />
        <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-6">
          <SignInCard wide={false} {...card} />
        </div>
        <div
          aria-hidden="true"
          className="h-[72px] w-full shrink-0 bg-[url('/login-tiles.webp')] bg-repeat-x bg-[length:auto_100%] bg-left-bottom"
        />
      </div>
    </main>
  )
}
