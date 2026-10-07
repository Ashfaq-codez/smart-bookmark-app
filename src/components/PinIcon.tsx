// A small pushpin. `filled` = this save is pinned.
export default function PinIcon({ filled = false, className = 'w-4 h-4' }: { filled?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 3h6l-1 6 3.5 3.5V14H6.5v-1.5L10 9 9 3Z" />
      <path d="M12 14v7" />
    </svg>
  )
}
