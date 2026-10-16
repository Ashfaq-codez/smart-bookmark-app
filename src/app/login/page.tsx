'use client'

import { createClient } from '@/utils/supabase/client'
import { useState, useEffect } from 'react'
import { Merienda } from 'next/font/google'
import { motion } from 'motion/react'
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
      <div className="hidden min-[900px]:flex min-h-dvh items-center justify-center p-8">
        <div className="relative w-[min(1440px,94vw,calc((100dvh-4rem)*2.357))] aspect-[3168/1344] [container-type:inline-size] rounded-[1.2cqw] overflow-hidden ring-1 ring-[#D8C7AD] shadow-[0_2px_4px_rgba(90,65,35,0.08),0_24px_60px_-12px_rgba(90,65,35,0.28)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/login-bg.webp"
            alt=""
            className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
            draggable={false}
          />
          <div className="absolute left-[72.4%] top-[22.4%] w-[22.6%] h-[53%]">
            <SignInCard wide {...card} />
          </div>
        </div>
      </div>

      {/* Phones and tablets: the window on top, the card centred in the space below it, the tiles along the bottom */}
      <div className="flex min-[900px]:hidden min-h-dvh flex-col bg-[#FAF4EE]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/login-art.webp"
          alt=""
          className="w-full h-[42dvh] min-h-[240px] max-h-[520px] object-cover object-[30%_100%] select-none pointer-events-none [mask-image:linear-gradient(to_bottom,black_80%,transparent)]"
          draggable={false}
        />
        <div className="flex-1 flex items-center justify-center px-4 py-6">
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
