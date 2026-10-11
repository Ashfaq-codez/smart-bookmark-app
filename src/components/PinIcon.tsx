import { Pin } from 'lucide-react'

// A small pushpin. `filled` = this save is pinned.
export default function PinIcon({ filled = false, className = 'w-4 h-4' }: { filled?: boolean; className?: string }) {
  return <Pin className={className} fill={filled ? 'currentColor' : 'none'} strokeWidth={1.8} />
}
