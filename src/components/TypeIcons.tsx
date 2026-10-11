// src/components/TypeIcons.tsx
// One place for the save-type icons and colours (type pills, the welcome tour, and anything later).
import type { ReactElement } from 'react'
import { LayoutGrid, Link, PenLine, Image as ImageGlyph, SquarePlay, FileText, MessageCircleHeart } from 'lucide-react'

type IconProps = { className?: string }

// One lucide icon per kind of save. They draw in the current text colour and take their size from `className`.
export const AllIcon = ({ className = 'w-4 h-4' }: IconProps) => <LayoutGrid className={className} strokeWidth={1.9} />
export const LinkIcon = ({ className = 'w-4 h-4' }: IconProps) => <Link className={className} strokeWidth={1.9} />
export const NoteIcon = ({ className = 'w-4 h-4' }: IconProps) => <PenLine className={className} strokeWidth={1.9} />
export const ImageIcon = ({ className = 'w-4 h-4' }: IconProps) => <ImageGlyph className={className} strokeWidth={1.9} />
export const VideoIcon = ({ className = 'w-4 h-4' }: IconProps) => <SquarePlay className={className} strokeWidth={1.9} />
export const DocumentIcon = ({ className = 'w-4 h-4' }: IconProps) => <FileText className={className} strokeWidth={1.9} />
export const SocialIcon = ({ className = 'w-4 h-4' }: IconProps) => <MessageCircleHeart className={className} strokeWidth={1.9} />

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