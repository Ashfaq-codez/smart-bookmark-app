// src/components/TypeIcons.tsx
// One place for the save-type icons and colours (type pills, the welcome tour, and anything later).
import type { ReactElement, ReactNode } from 'react'

type IconProps = { className?: string }

const Svg = ({ className = 'w-4 h-4', children }: IconProps & { children: ReactNode }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
    {children}
  </svg>
)

export const AllIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <rect x="3" y="3" width="7.5" height="7.5" rx="2" /><rect x="13.5" y="3" width="7.5" height="7.5" rx="2" />
    <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" /><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" />
  </Svg>
)
export const LinkIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </Svg>
)
export const NoteIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </Svg>
)
export const ImageIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
  </Svg>
)
export const VideoIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <rect x="2" y="5" width="20" height="14" rx="3" /><path d="M10 9.5v5l4.5-2.5z" fill="currentColor" />
  </Svg>
)
export const DocumentIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M16 13H8" /><path d="M16 17H8" />
  </Svg>
)
export const SocialIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <circle cx="12" cy="12" r="4" /><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94" />
  </Svg>
)

// `tint` = icon colour on a light surface, `tintOn` = icon colour inside a selected (inverted) pill.
export const TYPE_META: Record<string, { Icon: (p: IconProps) => ReactElement; tint: string; tintOn: string }> = {
  all:       { Icon: AllIcon,      tint: 'text-[#4D6A51] dark:text-[#8FAA91]', tintOn: 'text-[#A9C4AC] dark:text-[#4D6A51]' },
  link:      { Icon: LinkIcon,     tint: 'text-sky-600 dark:text-sky-400',     tintOn: 'text-sky-300 dark:text-sky-700' },
  note:      { Icon: NoteIcon,     tint: 'text-amber-600 dark:text-amber-400', tintOn: 'text-amber-300 dark:text-amber-700' },
  image:     { Icon: ImageIcon,    tint: 'text-violet-600 dark:text-violet-400', tintOn: 'text-violet-300 dark:text-violet-700' },
  videos:    { Icon: VideoIcon,    tint: 'text-rose-600 dark:text-rose-400',   tintOn: 'text-rose-300 dark:text-rose-700' },
  documents: { Icon: DocumentIcon, tint: 'text-orange-600 dark:text-orange-400', tintOn: 'text-orange-300 dark:text-orange-700' },
  socials:   { Icon: SocialIcon,   tint: 'text-teal-600 dark:text-teal-400',   tintOn: 'text-teal-300 dark:text-teal-700' },
}
