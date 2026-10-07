'use client'
// src/components/WelcomeGuide.tsx
// A short step-by-step tour of inntoit. Opens from the sidebar, the command palette or the empty library.

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { TYPE_META } from './TypeIcons'
import PinIcon from './PinIcon'

const Kbd = ({ children }: { children: ReactNode }) => (
  <kbd className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded-md border border-black/10 dark:border-white/15 bg-white/80 dark:bg-white/[0.06] text-[11px] font-sans font-medium text-[#171A17]/70 dark:text-white/70 align-middle">{children}</kbd>
)

const panel = 'rounded-xl bg-white dark:bg-[#151815] border border-black/[0.06] dark:border-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.06)]'

const FolderGlyph = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
)
const SearchGlyph = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
)
const ClipGlyph = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
)
const CloseGlyph = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12" /></svg>
)

const TypeTile = ({ k, label }: { k: string; label?: string }) => {
  const { Icon, tint } = TYPE_META[k]
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className={`w-10 h-10 rounded-xl bg-white dark:bg-[#202520] shadow-sm border border-black/[0.04] dark:border-white/[0.06] inline-flex items-center justify-center ${tint}`}><Icon className="w-[18px] h-[18px]" /></span>
      {label && <span className="text-[11px] font-medium text-[#171A17]/60 dark:text-white/60">{label}</span>}
    </div>
  )
}

type Step = { title: string; body: ReactNode; art: ReactNode }

export default function WelcomeGuide({ onClose, onStart, mod = '⌘' }: { onClose: () => void; onStart?: () => void; mod?: string }) {
  const [i, setI] = useState(0)
  const nextRef = useRef<HTMLButtonElement>(null)

  const steps: Step[] = [
    {
      title: 'Welcome to inntoit',
      body: <>inntoit keeps your links, notes, images, videos and PDFs in one calm place, with a real preview of each. This tour takes about a minute.</>,
      art: (
        <div className="flex flex-col items-center gap-5">
          <span className="font-serif text-4xl text-[#171A17] dark:text-[#F3F0E9]">inntoit</span>
          <div className="flex gap-2">{['link', 'note', 'image', 'videos', 'documents', 'socials'].map(k => <TypeTile key={k} k={k} />)}</div>
        </div>
      ),
    },
    {
      title: 'Save anything',
      body: <>Click the box at the top, or press <Kbd>N</Kbd>. Paste a link or type a note, then press <Kbd>{mod} ↵</Kbd> to save. Paste a list of links and each one becomes its own save.</>,
      art: (
        <div className="w-[85%] max-w-sm">
          <div className={`${panel} h-11 flex items-center gap-3 px-4 text-sm text-[#171A17]/50 dark:text-white/50`}>
            <span className="text-lg leading-none text-[#4D6A51] dark:text-[#8FAA91]">+</span>
            <span className="flex-1 truncate">Paste a link or write a note</span><Kbd>N</Kbd>
          </div>
          <div className="mt-3 flex justify-end">
            <span className="h-9 inline-flex items-center gap-2 px-4 rounded-lg bg-[#4D6A51] dark:bg-[#8FAA91] text-white dark:text-[#151815] text-xs font-medium shadow-md">Save <span className="opacity-70">{mod} ↵</span></span>
          </div>
        </div>
      ),
    },
    {
      title: 'Add files',
      body: <>Use the paperclip next to the box to upload an image, a video or a PDF. It is stored with your saves and opens right inside inntoit.</>,
      art: (
        <div className="flex items-center gap-4">
          <span className={`${panel} w-12 h-12 inline-flex items-center justify-center text-[#171A17]/70 dark:text-white/70`}><ClipGlyph /></span>
          <span className="text-[#171A17]/30 dark:text-white/30">→</span>
          <div className="flex gap-3"><TypeTile k="image" label="Image" /><TypeTile k="videos" label="Video" /><TypeTile k="documents" label="PDF" /></div>
        </div>
      ),
    },
    {
      title: 'Keep it organized',
      body: <>Click + next to Folders in the sidebar to make a folder, then drag any card onto it. Open a card to change its title, folder or notes. Changes save when you close it.</>,
      art: (
        <div className="relative w-[70%] max-w-[15rem]">
          <div className={`${panel} p-2 space-y-1 text-sm`}>
            {['Read later', 'Recipes', 'Work'].map((f, n) => (
              <div key={f} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${n === 1 ? 'bg-[#4D6A51]/10 text-[#4D6A51] dark:bg-[#8FAA91]/15 dark:text-[#8FAA91] ring-1 ring-[#4D6A51]/30 dark:ring-[#8FAA91]/30' : 'text-[#171A17]/70 dark:text-white/70'}`}>
                <FolderGlyph />{f}
              </div>
            ))}
          </div>
          <div className="absolute -right-10 top-5 w-20 h-14 rounded-lg bg-gradient-to-br from-amber-200 to-rose-200 dark:from-amber-800/70 dark:to-rose-800/70 border-2 border-white dark:border-[#151815] shadow-xl rotate-6" />
        </div>
      ),
    },
    {
      title: 'Pin it, find it',
      body: <>Use the pin on a card (or Pin to top inside it) to keep it in Pinned at the top. Press <Kbd>/</Kbd> to search, or <Kbd>{mod} K</Kbd> to jump anywhere and run commands.</>,
      art: (
        <div className="w-[85%] max-w-sm flex flex-col gap-3">
          <div className={`${panel} h-10 flex items-center gap-2.5 px-3 text-sm text-[#171A17]/45 dark:text-white/45`}>
            <SearchGlyph /><span className="flex-1">Search your saves</span><Kbd>/</Kbd>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-[#4D6A51]/10 dark:bg-[#8FAA91]/15 text-[#4D6A51] dark:text-[#8FAA91] text-xs font-semibold"><PinIcon filled className="w-3.5 h-3.5" /> Pinned</span>
            <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-white dark:bg-[#151815] border border-black/[0.06] dark:border-white/10 text-xs text-[#171A17]/60 dark:text-white/60">Commands <Kbd>{mod} K</Kbd></span>
          </div>
        </div>
      ),
    },
    {
      title: 'Make it yours',
      body: <>Open View to pick how many columns you see, show or hide card details, and group saves by date. Your choices follow you to every device.</>,
      art: (
        <div className="flex gap-2.5">
          {[
            { label: 'Columns', svg: <svg width="30" height="20" viewBox="0 0 30 20" fill="currentColor" aria-hidden="true"><rect x="0" y="0" width="6" height="20" rx="1.5" /><rect x="8" y="0" width="6" height="13" rx="1.5" /><rect x="16" y="0" width="6" height="17" rx="1.5" /><rect x="24" y="0" width="6" height="10" rx="1.5" /></svg> },
            { label: 'Details', svg: <svg width="30" height="20" viewBox="0 0 30 20" fill="none" aria-hidden="true"><rect x="1" y="1" width="28" height="18" rx="3.5" stroke="currentColor" strokeWidth="1.5" /><rect x="5" y="11.5" width="14" height="2" rx="1" fill="currentColor" /><rect x="5" y="15" width="8" height="1.6" rx="0.8" fill="currentColor" opacity="0.5" /></svg> },
            { label: 'By date', svg: <svg width="30" height="20" viewBox="0 0 30 20" fill="currentColor" aria-hidden="true"><rect x="0" y="0" width="12" height="2" rx="1" opacity="0.5" /><rect x="0" y="4" width="9" height="5" rx="1.2" /><rect x="10.5" y="4" width="9" height="5" rx="1.2" /><rect x="21" y="4" width="9" height="5" rx="1.2" /><rect x="0" y="11" width="8" height="2" rx="1" opacity="0.5" /><rect x="0" y="15" width="9" height="5" rx="1.2" /><rect x="10.5" y="15" width="9" height="5" rx="1.2" /></svg> },
          ].map((t, n) => (
            <div key={t.label} className={`${panel} w-20 flex flex-col items-center gap-1.5 py-3 text-[11px] font-medium ${n === 2 ? 'ring-1 ring-[#4D6A51] dark:ring-[#8FAA91] text-[#171A17] dark:text-white' : 'text-[#171A17]/55 dark:text-white/55'}`}>
              {t.svg}<span>{t.label}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: 'Save from anywhere',
      body: <>Save pages with the inntoit Chrome extension, or from your iPhone with a Shortcut key from your profile menu. That menu also downloads a full backup whenever you like.</>,
      art: (
        <div className="flex flex-wrap justify-center gap-2.5 max-w-sm">
          {['Chrome extension', 'iPhone Shortcut', 'Backup (.json / .html)'].map(l => (
            <span key={l} className={`${panel} h-10 inline-flex items-center gap-2 px-4 text-xs font-medium text-[#171A17]/75 dark:text-white/75`}>
              <span className="w-2 h-2 rounded-full bg-[#4D6A51] dark:bg-[#8FAA91]" />{l}
            </span>
          ))}
        </div>
      ),
    },
  ]

  const step = steps[i]
  const last = i === steps.length - 1
  const finish = () => { onClose(); onStart?.() }

  useEffect(() => { nextRef.current?.focus() }, [i])

  useEffect(() => {
    // While the tour is open it owns the keyboard, so N, / and the palette shortcut don't fire behind it.
    const onKey = (e: KeyboardEvent) => {
      e.stopPropagation()
      if (e.key === 'Escape') { e.preventDefault(); onClose() }
      else if (e.key === 'ArrowRight') { e.preventDefault(); setI(v => Math.min(v + 1, steps.length - 1)) }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); setI(v => Math.max(v - 1, 0)) }
    }
    window.addEventListener('keydown', onKey, true)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey, true); document.body.style.overflow = prevOverflow }
  }, [onClose, steps.length])

  return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center sm:p-4 bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <style>{`@keyframes inntoit-guide-in { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } } .inntoit-guide-in { animation: inntoit-guide-in .28s cubic-bezier(.22,1,.36,1) }`}</style>
      <div role="dialog" aria-modal="true" aria-labelledby="inntoit-guide-title" onClick={e => e.stopPropagation()}
        className="relative w-full sm:max-w-xl lg:max-w-3xl overflow-hidden rounded-t-3xl sm:rounded-3xl bg-[#FAF9F5] dark:bg-[#0F120F] border border-black/[0.06] dark:border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.25)]">

        <button aria-label="Close tour" onClick={onClose} className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/70 dark:bg-black/30 backdrop-blur text-[#171A17]/60 dark:text-white/60 hover:text-[#171A17] dark:hover:text-white transition-colors"><CloseGlyph /></button>

        <div className="relative h-44 sm:h-56 lg:h-72 flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#EAF1E8] via-[#F6F3EA] to-[#F2ECDD] dark:from-[#1A251C] dark:via-[#151915] dark:to-[#121512]">
          <div className="pointer-events-none absolute -top-16 -left-10 w-56 h-56 rounded-full bg-[#4D6A51]/10 dark:bg-[#8FAA91]/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -right-10 w-56 h-56 rounded-full bg-amber-300/20 dark:bg-amber-500/10 blur-3xl" />
          <div key={`art-${i}`} className="inntoit-guide-in relative w-full flex items-center justify-center"><div className="w-full flex items-center justify-center lg:scale-125">{step.art}</div></div>
        </div>

        <div key={`text-${i}`} className="inntoit-guide-in px-6 sm:px-8 lg:px-12 pt-6 lg:pt-8 min-h-[10.5rem] lg:min-h-[9.5rem]">
          <p className="text-xs font-medium text-[#4D6A51] dark:text-[#8FAA91]">Step {i + 1} of {steps.length}</p>
          <h2 id="inntoit-guide-title" className="mt-1 font-serif text-2xl lg:text-[2rem] lg:leading-tight text-[#171A17] dark:text-[#F3F0E9]">{step.title}</h2>
          <p className="mt-2 lg:mt-3 text-sm lg:text-base leading-relaxed max-w-2xl text-[#171A17]/70 dark:text-white/70">{step.body}</p>
        </div>

        <div className="flex items-center justify-between gap-3 px-6 sm:px-8 lg:px-12 pt-4 pb-6 lg:pb-8">
          <div className="flex items-center gap-1.5">
            {steps.map((s, n) => (
              <button key={s.title} aria-label={`Go to step ${n + 1}`} aria-current={n === i ? 'step' : undefined} onClick={() => setI(n)}
                className={`h-1.5 rounded-full transition-all ${n === i ? 'w-6 bg-[#4D6A51] dark:bg-[#8FAA91]' : 'w-1.5 bg-black/15 dark:bg-white/20 hover:bg-black/30 dark:hover:bg-white/40'}`} />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {i === 0
              ? <button onClick={onClose} className="h-9 px-3 rounded-lg text-sm font-medium text-[#171A17]/55 dark:text-white/55 hover:text-[#171A17] dark:hover:text-white transition-colors">Skip</button>
              : <button onClick={() => setI(v => v - 1)} className="h-9 px-3 rounded-lg text-sm font-medium text-[#171A17]/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">Back</button>}
            <button ref={nextRef} onClick={() => (last ? finish() : setI(v => v + 1))}
              className="h-9 px-4 rounded-lg bg-[#4D6A51] dark:bg-[#8FAA91] text-white dark:text-[#151815] text-sm font-medium hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#4D6A51] dark:focus-visible:ring-offset-[#0F120F]">
              {last ? 'Start saving' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}