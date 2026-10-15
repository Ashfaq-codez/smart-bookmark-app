'use client'
import { useState } from 'react'

// Small shared pieces for the social cards and previews.

// A picture that removes itself when it fails to load (never shows broken-image alt text).
export function SafeImg({ src, className, alt = '' }: { src?: string | null; className?: string; alt?: string }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) return null
  return <img src={src} alt={alt} className={className} loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} />
}

// "3h", "2d", "Oct 4", "Oct 4, 2023"
export function shortDate(iso: string | null | undefined, now = Date.now()): string {
  if (!iso) return ''
  const t = Date.parse(iso)
  if (isNaN(t)) return ''
  const s = Math.max(0, (now - t) / 1000)
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))}m`
  if (s < 86400) return `${Math.round(s / 3600)}h`
  if (s < 7 * 86400) return `${Math.round(s / 86400)}d`
  const d = new Date(t)
  const sameYear = d.getFullYear() === new Date(now).getFullYear()
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }) })
}

// 1234 -> "1.2K", 216186 -> "216K"
export function compactNumber(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return ''
  if (n < 1000) return String(n)
  const units: [number, string][] = [[1e9, 'B'], [1e6, 'M'], [1e3, 'K']]
  for (const [v, u] of units) {
    if (n >= v) {
      const x = n / v
      return `${x >= 100 ? Math.round(x) : Math.round(x * 10) / 10}${u}`
    }
  }
  return String(n)
}
