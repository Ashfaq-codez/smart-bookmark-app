'use client'

import { useLayoutEffect, useRef, useState } from 'react'

// Shapes taken from the architecture in the pictures.
//   archPath: a doorway with an ogee crown, like a mihrab: flat base, straight sides, level shoulders, and in the
//   middle a raised crown that swells up and curls into a point.

export function archPath(w: number, h: number, inset = 0) {
  const x0 = inset, x1 = w - inset, y1 = h - inset, top = inset
  const s = top + (h - 2 * inset) * 0.36        // the shoulder line, where the crown begins
  const r = Math.min(9, h * 0.18)                // rounded feet at the base
  const rr = Math.min(8, (s - top) * 0.9 + 2)    // rounded outer shoulders
  const cx = w / 2
  const cw = Math.min((h - 2 * inset) * 1.15, (x1 - x0) * 0.32) // half-width of the crown
  const rise = s - top
  // one half of the ogee crown: out of the shoulder, up in a swelling curve, curling in to the point
  const right = `C ${cx + cw * 0.55} ${s} ${cx + cw * 0.5} ${s - rise * 0.6} ${cx + cw * 0.22} ${top + rise * 0.22} Q ${cx + cw * 0.06} ${top + rise * 0.04} ${cx} ${top}`
  const left = `Q ${cx - cw * 0.06} ${top + rise * 0.04} ${cx - cw * 0.22} ${top + rise * 0.22} C ${cx - cw * 0.5} ${s - rise * 0.6} ${cx - cw * 0.55} ${s} ${cx - cw} ${s}`
  return [
    `M ${x0 + r} ${y1}`, `L ${x1 - r} ${y1}`, `Q ${x1} ${y1} ${x1} ${y1 - r}`,
    `L ${x1} ${s + rr}`, `Q ${x1} ${s} ${x1 - rr} ${s}`,
    `L ${cx + cw} ${s}`, right, left,
    `L ${x0 + rr} ${s}`, `Q ${x0} ${s} ${x0} ${s + rr}`,
    `L ${x0} ${y1 - r}`, `Q ${x0} ${y1} ${x0 + r} ${y1}`, 'Z',
  ].join(' ')
}

// An element cut to the arch shape, with a fine inner line like a carved frame. Measures itself, so the arch always
// fits the text inside it.
export function ArchShape({ fill, line, className = '', children }: { fill: string; line: string; className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => setSize({ w: el.offsetWidth, h: el.offsetHeight })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return (
    <span ref={ref} className={`relative inline-flex items-center ${className}`}>
      {size && (
        <svg aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-visible" width={size.w} height={size.h} viewBox={`0 0 ${size.w} ${size.h}`}>
          <path d={archPath(size.w, size.h)} fill={fill} />
          <path d={archPath(size.w, size.h, 3.5)} fill="none" stroke={line} strokeWidth="0.9" />
        </svg>
      )}
      <span className="relative inline-flex items-center gap-2.5">{children}</span>
    </span>
  )
}
