'use client'

import { useEffect, useRef, useState } from 'react'
import { toast } from 'react-hot-toast'

const MAX_CHARS = 2000

type FeedbackType = 'idea' | 'problem' | 'other'

const TYPES: { v: FeedbackType; label: string; placeholder: string }[] = [
  { v: 'idea', label: 'Idea', placeholder: 'What would make inntoit better for you?' },
  { v: 'problem', label: 'Problem', placeholder: 'What went wrong? What did you expect to happen?' },
  { v: 'other', label: 'Other', placeholder: 'Anything you want to tell us.' },
]

export default function FeedbackModal({ onClose, mod = 'Ctrl' }: { onClose: () => void; mod?: string }) {
  const [type, setType] = useState<FeedbackType>('idea')
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const trimmed = message.trim()
  const canSend = !!trimmed && trimmed.length <= MAX_CHARS && !isSending

  // Keep the latest onClose without re-running the effect (the parent passes a new function each render).
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    textareaRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCloseRef.current() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const send = async () => {
    if (!canSend) return
    setIsSending(true)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, message: trimmed }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data?.error || 'Could not send feedback. Please try again.')
        return
      }
      toast.success('Thank you! Your feedback was sent.')
      onClose()
    } catch {
      toast.error('No connection. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  const placeholder = TYPES.find(t => t.v === type)?.placeholder

  return (
    <div
      className="fixed inset-0 z-[250] flex items-start sm:items-center justify-center p-4 pt-16 sm:pt-4 bg-black/20 dark:bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-title"
        className="w-full max-w-md bg-white dark:bg-[#151815] border border-black/[0.04] dark:border-white/[0.06] p-5 sm:p-6 rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 id="feedback-title" className="text-xl font-serif text-[#171A17] dark:text-white">Send feedback</h3>
            <p className="text-sm text-[#636A63] dark:text-[#9DA59D] mt-1">Ideas, problems, anything. It goes straight to the team.</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 -mr-1.5 rounded-lg text-[#171A17]/50 dark:text-white/50 hover:bg-black/5 dark:hover:bg-white/5"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        <div role="radiogroup" aria-label="Feedback type" className="flex p-0.5 mb-3 rounded-lg bg-black/[0.05] dark:bg-white/[0.06]">
          {TYPES.map(t => (
            <button
              key={t.v}
              role="radio"
              aria-checked={type === t.v}
              onClick={() => setType(t.v)}
              className={`flex-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${type === t.v ? 'bg-white dark:bg-[#252A25] text-[#171A17] dark:text-white shadow-sm' : 'text-[#171A17]/55 dark:text-white/55 hover:text-[#171A17] dark:hover:text-white'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); send() } }}
          placeholder={placeholder}
          aria-label="Your feedback"
          rows={5}
          maxLength={MAX_CHARS + 200}
          className="w-full resize-none bg-black/[0.04] dark:bg-white/[0.06] border border-transparent focus:border-[#4D6A51] dark:focus:border-[#8FAA91] outline-none p-3 rounded-xl text-[16px] sm:text-sm text-[#171A17] dark:text-[#F3F0E9] placeholder-black/40 dark:placeholder-white/40 transition-colors"
        />

        <div className="flex items-center justify-between gap-3 mt-3">
          <span className={`text-xs ${trimmed.length > MAX_CHARS ? 'text-[#E53E3E]' : 'text-[#171A17]/45 dark:text-white/45'}`}>
            {trimmed.length}/{MAX_CHARS}
          </span>
          <div className="flex items-center gap-2">
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded border border-black/10 dark:border-white/15 text-[10px] font-medium text-[#171A17]/50 dark:text-white/50">{mod} ↵</kbd>
            <button
              onClick={send}
              disabled={!canSend}
              className="h-9 px-4 inline-flex items-center gap-2 rounded-lg bg-[#4D6A51] dark:bg-[#8FAA91] text-white dark:text-[#151815] text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-30"
            >
              {isSending ? 'Sending…' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
