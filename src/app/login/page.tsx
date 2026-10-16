'use client'

import { createClient } from '@/utils/supabase/client'
import { useState, useEffect } from 'react'
import { Merienda } from 'next/font/google'
import { motion } from 'motion/react'
import { Loader2 } from 'lucide-react'

// The watercolour wall: arched stained-glass window, blossom branch, tiled skirting (public/login-bg.webp,
// made from public/login.png with the painted card taken out). The sign-in card is real HTML on top of it.
//   Wide screens: the whole painting along the bottom, the card where the design has it (sizes follow the
//   painting's width, so it matches at every screen size).
//   Phones and tall screens: the window on top, the card below it, the tiles along the bottom.

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

// The card's paper: warm, slightly uneven, soft edges, like the painted one.
const PAPER = 'bg-[linear-gradient(160deg,#FBF4E8_0%,#F5EAD7_55%,#F1E3CC_100%)] dark:bg-[linear-gradient(160deg,#2C261E_0%,#26201A_60%,#221C16_100%)] border border-[#E6D6BC] dark:border-[#3F362A] shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_10px_30px_rgba(120,90,50,0.10)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)]'
const INK = 'text-[#4A3F33] dark:text-[#EFE3D0]'

function SignInCard({ wide, loading, error, onSignIn }: { wide: boolean; loading: boolean; error: string | null; onSignIn: () => void }) {
  // Wide: sizes in cqw (hundredths of the painting's width) so the card scales with it. Phone: fixed sizes.
  const s = wide
    ? { pad: 'px-[1.6cqw]', title: 'text-[3cqw]', sub: 'text-[1.65cqw] mt-[0.5cqw]', btn: 'mt-[2.2cqw] w-[18cqw] h-[4cqw] gap-[1cqw] rounded-[0.6cqw] text-[1.4cqw]', icon: 'w-[2.2cqw] h-[2.2cqw]', err: 'text-[0.85cqw] mt-[1cqw]' }
    : { pad: 'px-6 py-9', title: 'text-[40px]', sub: 'text-[19px] mt-1.5', btn: 'mt-7 w-full max-w-[290px] h-[54px] gap-3 rounded-xl text-[17px]', icon: 'w-7 h-7', err: 'text-[13px] mt-4' }
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`${hand.className} ${PAPER} ${s.pad} ${INK} flex flex-col items-center justify-center text-center rounded-[6px] ${wide ? 'w-full h-full' : 'w-full max-w-[380px]'}`}
    >
      <h1 className={`${s.title} leading-tight font-medium`}>Welcome</h1>
      <p className={`${s.sub} leading-tight opacity-90`}>Sign in to continue</p>
      <button
        type="button"
        onClick={onSignIn}
        disabled={loading}
        className={`${s.btn} flex items-center justify-center border border-[#D9C7A9] dark:border-[#4A3F31] bg-[linear-gradient(180deg,#F6EDDF,#EDE0CB)] dark:bg-[linear-gradient(180deg,#352E24,#2D261E)] shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_2px_6px_rgba(120,90,50,0.12)] dark:shadow-[0_2px_6px_rgba(0,0,0,0.3)] transition-[filter,transform] duration-200 hover:brightness-[1.03] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8A6E4B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F5EAD7] dark:focus-visible:ring-offset-[#26201A] disabled:opacity-70 disabled:cursor-wait cursor-pointer`}
      >
        {loading ? <Loader2 className={`${s.icon} animate-spin`} strokeWidth={1.75} /> : <GoogleIcon className={s.icon} />}
        <span>{loading ? 'Connecting…' : 'Sign in with Google'}</span>
      </button>
      {error && <p role="alert" className={`${s.err} font-sans text-[#A3402F] dark:text-[#F0A493]`}>{error}</p>}
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
    <main className="min-h-dvh bg-[#FAF4EE] dark:bg-[#1B1612] overflow-hidden">
      {/* Wide screens (at least 900px wide and wider than tall by 3:2) */}
      <div className="hidden [@media(min-width:900px)_and_(min-aspect-ratio:3/2)]:flex min-h-dvh flex-col justify-end">
        <div className="relative w-full aspect-[3168/1344] [container-type:inline-size]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/login-bg.webp"
            alt=""
            className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none [mask-image:linear-gradient(to_bottom,transparent,black_10%)] dark:brightness-[0.55] dark:saturate-[0.85]"
            draggable={false}
          />
          <div className="absolute left-[72.4%] top-[22.4%] w-[22.6%] h-[53%]">
            <SignInCard wide {...card} />
          </div>
        </div>
      </div>

      {/* Phones, tablets and tall windows */}
      <div className="flex [@media(min-width:900px)_and_(min-aspect-ratio:3/2)]:hidden min-h-dvh flex-col">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/login-art.webp"
          alt=""
          className="w-full h-[46dvh] min-h-[260px] object-cover object-[35%_100%] select-none pointer-events-none [mask-image:linear-gradient(to_bottom,black_82%,transparent)] dark:brightness-[0.55] dark:saturate-[0.85]"
          draggable={false}
        />
        <div className="flex-1 flex items-start justify-center px-4 -mt-4 pb-8">
          <SignInCard wide={false} {...card} />
        </div>
        <div
          aria-hidden="true"
          className="h-[88px] w-full shrink-0 bg-[url('/login-tiles.webp')] bg-repeat-x bg-[length:auto_100%] bg-left-bottom dark:brightness-[0.55] dark:saturate-[0.85]"
        />
      </div>
    </main>
  )
}
