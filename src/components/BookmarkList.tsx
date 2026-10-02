'use client'
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/no-unescaped-entities */

import { useState, useMemo, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useBookmarks } from '@/hooks/useBookmarks'
import { Bookmark } from '@/types'
import Sidebar from '@/components/Sidebar'
import BookmarkCard from '@/components/BookmarkCard'
import BookmarkSkeleton from '@/components/BookmarkSkeleton'
import TipTapEditor from '@/components/TipTapEditor'
import { toast } from 'react-hot-toast'
import { deriveDisplayType } from '@/utils/bookmarkHelpers'

// --- Existing Icons ---
const SendIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
const PaperclipIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
const SpinnerIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
const MenuIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
const SearchIcon = ({ className }: { className?: string }) => <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
const ClearIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
const SortDescIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5h10"></path><path d="M11 9h7"></path><path d="M11 13h4"></path><path d="M4 14v7"></path><path d="M7 18l-3 3-3-3"></path></svg>
const SortAscIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 19h10"></path><path d="M11 15h7"></path><path d="M11 11h4"></path><path d="M4 10V3"></path><path d="M7 6l-3-3-3 3"></path></svg>
const CalendarIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>

const XIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/></svg>
const YouTubeIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.016 3.016 0 0 0-2.122 2.136C0 8.07 0 12 0 12s0 3.93.501 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.55 9.377.55 9.377.55s7.505 0 9.377-.55a3.016 3.016 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>

// --- New Grid Control & View Icons ---
const Grid5Icon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="3" width="2.5" height="18" rx="0.5" /><rect x="6.5" y="3" width="2.5" height="18" rx="0.5" /><rect x="11" y="3" width="2.5" height="18" rx="0.5" /><rect x="15.5" y="3" width="2.5" height="18" rx="0.5" /><rect x="20" y="3" width="2.5" height="18" rx="0.5" /></svg>
)
const Grid6Icon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="3" width="5.5" height="8" rx="1" /><rect x="9.25" y="3" width="5.5" height="8" rx="1" /><rect x="16.5" y="3" width="5.5" height="8" rx="1" /><rect x="2" y="13" width="5.5" height="8" rx="1" /><rect x="9.25" y="13" width="5.5" height="8" rx="1" /><rect x="16.5" y="13" width="5.5" height="8" rx="1" /></svg>
)
const Grid9Icon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">{[0,1,2].map(col => [0,1,2].map(row => <rect key={`${row}-${col}`} x={2 + col*7.5} y={2 + row*7.5} width="5" height="5" rx="1" />))}</svg>
)
const ViewMinimalIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>
)
const ViewDetailedIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="15" x2="21" y2="15"></line></svg>
)

const mediaTypeLabels: Record<string, string> = {
  'link': 'Links',
  'note': 'Notes',
  'image': 'Images',
  'videos': 'Videos',
  'documents': 'Documents',
  'socials': 'Socials'
};

function normalizeUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim()
  if (!trimmed) return ''
  try {
    const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
    const parsed = new URL(withProto)
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '')
    const path = parsed.pathname.replace(/\/+$/, '') || '/'
    let search = parsed.search
    if (host === 'youtube.com' && path === '/watch') {
      const videoId = parsed.searchParams.get('v')
      if (videoId) search = `?v=${videoId}`
    } else if (host === 'youtu.be') {
      const videoId = path.substring(1)
      if (videoId) return `${parsed.protocol}//youtube.com/watch?v=${videoId}`
    }
    return `${parsed.protocol}//${host}${path}${search}`
  } catch { return trimmed.toLowerCase().replace(/\/+$/, '') }
}

function formatDateHeader(dateString?: string): string {
  if (!dateString) return 'Unknown Date';
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

const PlusIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
const SlidersIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="4" y1="6" x2="20" y2="6"></line><line x1="4" y1="12" x2="20" y2="12"></line><line x1="4" y1="18" x2="20" y2="18"></line><circle cx="9" cy="6" r="2" fill="currentColor"></circle><circle cx="15" cy="12" r="2" fill="currentColor"></circle><circle cx="8" cy="18" r="2" fill="currentColor"></circle></svg>

// One source of truth for media types. To add a category: add its label above and its raw types here.
const mediaTypeMatchers: Record<string, string[]> = {
  link: ['link'], note: ['note'], image: ['image'],
  videos: ['video', 'youtube'], documents: ['pdf', 'file'],
  socials: ['twitter', 'instagram', 'pinterest', 'linkedin', 'github'],
}
const matchesType = (b: Bookmark, t: string) => (mediaTypeMatchers[t] || [t]).includes(b.type || 'link')

// Anything that should be reachable from the command palette registers here (see `commands` in the component).
type Command = { id: string; group: string; label: string; hint?: string; run: () => void }
type FilterChip = { l: string; x: () => void }

const KBD = 'hidden sm:inline-block px-1.5 py-0.5 rounded border border-black/10 dark:border-white/15 text-[10px] font-medium text-[#171A17]/50 dark:text-white/50'
const BTN = 'h-9 px-3 inline-flex items-center gap-2 rounded-lg border border-black/10 dark:border-white/10 text-sm font-medium text-[#171A17] dark:text-[#F3F0E9] hover:bg-black/5 dark:hover:bg-white/5 transition-colors'

function Seg<T extends string | number>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { v: T; label: string }[] }) {
  return (
    <div role="radiogroup" className="flex p-0.5 rounded-lg bg-black/[0.05] dark:bg-white/[0.06]">
      {options.map(o => (
        <button key={String(o.v)} role="radio" aria-checked={value === o.v} onClick={() => onChange(o.v)}
          className={`flex-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${value === o.v ? 'bg-white dark:bg-[#252A25] text-[#171A17] dark:text-white shadow-sm' : 'text-[#171A17]/55 dark:text-white/55 hover:text-[#171A17] dark:hover:text-white'}`}>{o.label}</button>
      ))}
    </div>
  )
}

function CommandPalette({ commands, saves, onPick, onClose }: { commands: Command[]; saves: Bookmark[]; onPick: (b: Bookmark) => void; onClose: () => void }) {
  const [q, setQ] = useState('')
  const [i, setI] = useState(0)
  const needle = q.trim().toLowerCase()
  const items = useMemo(() => {
    const cmds = commands.filter(c => !needle || c.label.toLowerCase().includes(needle))
    const hits = needle ? saves.filter(b => (b.title || b.url || '').toLowerCase().includes(needle)).slice(0, 6) : []
    return [
      ...cmds.map(c => ({ key: c.id, group: c.group, label: c.label, hint: c.hint, run: c.run })),
      ...hits.map(b => ({ key: `b${b.id}`, group: 'Saves', label: b.title || b.url, hint: undefined as string | undefined, run: () => onPick(b) })),
    ]
  }, [needle, commands, saves])
  const go = (it: (typeof items)[number]) => { onClose(); it.run() }
  return (
    <div className="fixed inset-0 z-[300] flex items-start justify-center pt-[12vh] px-4 bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Command palette" onClick={e => e.stopPropagation()} className="w-full max-w-xl overflow-hidden rounded-2xl bg-white dark:bg-[#151815] border border-black/[0.06] dark:border-white/10 shadow-2xl">
        <input autoFocus value={q} placeholder="Search saves or run a command" aria-label="Search saves or run a command"
          onChange={e => { setQ(e.target.value); setI(0) }}
          onKeyDown={e => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setI(v => Math.min(v + 1, items.length - 1)) }
            else if (e.key === 'ArrowUp') { e.preventDefault(); setI(v => Math.max(v - 1, 0)) }
            else if (e.key === 'Enter' && items[i]) go(items[i])
          }}
          className="w-full bg-transparent outline-none px-5 py-4 text-base border-b border-black/[0.06] dark:border-white/10 text-[#171A17] dark:text-[#F3F0E9] placeholder-black/40 dark:placeholder-white/40" />
        <ul role="listbox" className="max-h-[50vh] overflow-y-auto p-2">
          {items.length === 0 && <li className="px-3 py-8 text-center text-sm text-[#171A17]/60 dark:text-white/60">Nothing matches “{q}”.</li>}
          {items.map((it, n) => (
            <li key={it.key} role="option" aria-selected={n === i}>
              {(n === 0 || items[n - 1].group !== it.group) && <p className="px-3 pt-3 pb-1 text-xs font-medium text-[#171A17]/45 dark:text-white/45">{it.group}</p>}
              <button onMouseMove={() => setI(n)} onClick={() => go(it)} className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm text-left text-[#171A17] dark:text-[#F3F0E9] ${n === i ? 'bg-[#4D6A51]/10 dark:bg-[#8FAA91]/15' : ''}`}>
                <span className="truncate">{it.label}</span>{it.hint && <kbd className={KBD}>{it.hint}</kbd>}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// Estimated card height relative to column width. Used to drop each card into the shortest column
// (true masonry) instead of rotating columns, which left gaps whenever card heights differed.
const estimateCardHeight = (b: Bookmark): number => {
  const type = deriveDisplayType(b) || 'link'
  const textLen = (b.content || b.description || b.title || '').replace(/<[^>]*>/g, '').length
  switch (type) {
    case 'note': return Math.min(1.35, 0.35 + textLen / 450)
    case 'twitter': return 0.3 + Math.min(0.7, textLen / 380) + (b.image_url ? 0.55 : 0)
    case 'instagram':
    case 'tiktok': return 1.25
    case 'pinterest': return 1.5
    case 'pdf': return 1.33
    case 'google': return 0.56
    case 'youtube': return b.url?.toLowerCase().includes('/shorts/') ? 1.25 : 0.5625
    case 'video': return 0.5625
    case 'image': return 0.95
    default: return b.image_url ? 0.75 : 0.56
  }
}

const distributeToColumns = (items: Bookmark[], count: number): Bookmark[][] => {
  const cols: Bookmark[][] = Array.from({ length: count }, () => [])
  const heights: number[] = Array.from({ length: count }, () => 0)
  items.forEach((b) => {
    let target = 0
    for (let c = 1; c < count; c++) if (heights[c] < heights[target] - 0.05) target = c
    cols[target].push(b)
    heights[target] += estimateCardHeight(b) + 0.06
  })
  return cols
}

export default function BookmarkList({ initialBookmarks, userEmail }: { initialBookmarks: Bookmark[], userEmail?: string }) {
  const { bookmarks, updateBookmark, deleteBookmark } = useBookmarks(initialBookmarks)
  const [isLoading, setIsLoading] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const supabase = createClient()

  const [activeFilter, setActiveFilter] = useState('All')
  const [activeSubFilter, setActiveSubFilter] = useState<string | null>(null)
  const [activeMediaType, setActiveMediaType] = useState<string | null>(null)

  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')
  const [isGroupedByDate, setIsGroupedByDate] = useState(false)
  
  const [userColPreference, setUserColPreference] = useState<'auto' | 5 | 6 | 9>('auto')
  const [showGridMenu, setShowGridMenu] = useState(false)
  const [columnsCount, setColumnsCount] = useState(2)
  const [isMinimalist, setIsMinimalist] = useState(false)

  const [draggedId, setDraggedId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [inputValue, setInputValue] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  
  const [isInputFocused, setIsInputFocused] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const captureBarRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const [duplicateMatch, setDuplicateMatch] = useState<Bookmark | null>(null)
  const [forcedInspectId, setForcedInspectId] = useState<number | null>(null)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [mod, setMod] = useState('⌘')
  const searchRef = useRef<HTMLInputElement>(null)

  const [customCategories, setCustomCategories] = useState<string[]>([])
  const [customSubCategories, setCustomSubCategories] = useState<Record<string, string[]>>({})
  const [foldersLoaded, setFoldersLoaded] = useState(false)
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({})
  const [creatingSubFor, setCreatingSubFor] = useState<string | null>(null)
  const [newSubfolderName, setNewSubfolderName] = useState('')

  // Smart Scroll Listener
  useEffect(() => {
    let startY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
    };

    const handleScrollIntent = (e: Event) => {
      if (!isInputFocused) return;
      const target = e.target as HTMLElement;
      if (target?.closest?.('.fixed.z-\\[100\\]') || target?.closest?.('.fixed.z-\\[9999\\]') || target?.closest?.('.custom-scrollbar')) {
        return;
      }

      if ('touches' in e) {
        const deltaY = Math.abs((e as TouchEvent).touches[0].clientY - startY);
        if (deltaY < 30) return; 
      }

      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
        setIsExpanded(false);
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleScrollIntent, { passive: true });
    window.addEventListener('wheel', handleScrollIntent, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleScrollIntent);
      window.removeEventListener('wheel', handleScrollIntent);
    };
  }, [isInputFocused]);

  // Capture CMD+Enter
  useEffect(() => {
    const handleShortcut = (e: KeyboardEvent) => {
      if (isExpanded && (e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        handleQuickCapture()
      }
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [isExpanded, inputValue])

  useEffect(() => {
    if (isSidebarOpen && window.innerWidth < 1024) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; }
  }, [isSidebarOpen]);

  useEffect(() => {
    try {
      const savedCats = localStorage.getItem('space_custom_cats')
      const savedSubs = localStorage.getItem('space_custom_subs')
      const savedGrid = localStorage.getItem('space_grid_pref')
      const savedMin = localStorage.getItem('space_minimalist')
      if (savedCats) setCustomCategories(JSON.parse(savedCats))
      if (savedSubs) setCustomSubCategories(JSON.parse(savedSubs))
      if (savedGrid) setUserColPreference(Number(savedGrid) as 5 | 6 | 9)
      if (savedMin) setIsMinimalist(savedMin === 'true')
    } catch (e) {} finally { setFoldersLoaded(true) }
  }, [])

  useEffect(() => {
    if (foldersLoaded) {
      localStorage.setItem('space_custom_cats', JSON.stringify(customCategories))
      localStorage.setItem('space_custom_subs', JSON.stringify(customSubCategories))
    }
  }, [customCategories, customSubCategories, foldersLoaded])

  // Strict Mobile 2-Column Logic & Desktop Scaling
  useEffect(() => {
    const updateColumns = () => {
      if (!gridRef.current) return
      const width = gridRef.current.offsetWidth
      
      if (width < 640) {
        setColumnsCount(2) // Lock mobile specifically to 2 columns
        return
      }

      if (userColPreference !== 'auto') {
        setColumnsCount(userColPreference)
        return
      }

      if (width >= 1600) setColumnsCount(6)
      else setColumnsCount(5)
    }

    const observer = new ResizeObserver(updateColumns)
    if (gridRef.current) observer.observe(gridRef.current)
    updateColumns()
    const timer = setTimeout(() => setIsLoading(false), 300)
    return () => { observer.disconnect(); clearTimeout(timer) }
  }, [userColPreference])

  const toggleMinimalist = () => {
    const newVal = !isMinimalist;
    setIsMinimalist(newVal);
    localStorage.setItem('space_minimalist', String(newVal));
  }

  const handleSignOut = async () => { await supabase.auth.signOut(); window.location.href = '/' }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const fileExt = file.name.split('.').pop()

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Unauthenticated")

      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('attachments').upload(fileName, file)
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('attachments').getPublicUrl(fileName)

      let type = 'file'
      if (file.type.startsWith('image/')) type = 'image'
      else if (file.type.startsWith('video/')) type = 'video'
      else if (file.type === 'application/pdf') type = 'pdf'

      const { error: dbError } = await supabase.from('bookmarks').insert([{
        user_id: user.id, title: file.name, url: publicUrl, type: type, file_path: fileName, file_type: file.type
      }])

      if (dbError) throw dbError
      toast.success('Document archived successfully')
    } catch (err) {
      toast.error('Upload failed.')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleQuickCapture = async () => {
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = inputValue.replace(/<\/(p|div|li|h[1-6])>|<br\s*\/?>/gi, ' ')
    
    // 1. EXTRACT EXPLICIT HTML LINKS (e.g. Pasted from Safari/Chrome History)
    const extractedUrls: string[] = []
    tempDiv.querySelectorAll('a').forEach(a => {
      if (a.href && a.href.startsWith('http')) {
        extractedUrls.push(a.href)
      }
    })

    const rawText = (tempDiv.textContent || tempDiv.innerText || '')
    const cleanText = rawText.replace(/[\u200B-\u200D\uFEFF]/g, '').trim()
    const hasMediaOrStructure = tempDiv.querySelector('img, hr, table, iframe') !== null;

    if (!cleanText && !hasMediaOrStructure) return
    
    // 2. EXTRACT RAW TEXT LINKS
    const tokens = cleanText.split(/[\s,\n]+/).map(t => {
      return t.replace(/^[\(\[\{\<]/, '').replace(/[\)\}\]\>\.\,\;]$/, '')
    }).filter(Boolean)
    
    const isUrl = (str: string) => {
      try {
        if (str.length < 5 || !str.includes('.')) return false;
        const url = new URL(str.startsWith('http') ? str : `https://${str}`);
        return url.hostname.includes('.') && url.hostname.length > 3;
      } catch { return false; }
    }

    const rawUrlTokens = tokens.filter(isUrl)
    
    // Merge explicit HTML links and raw text links into one array
    const allUrls = Array.from(new Set([...extractedUrls, ...rawUrlTokens]))

    // 3. INTENT DETECTION: Did they paste a list of links, or write a genuine note?
    // We clone the input, physically delete all the <a> tags, and see what text is left over.
    const clone = tempDiv.cloneNode(true) as HTMLDivElement
    clone.querySelectorAll('a').forEach(a => a.remove())
    let leftoverText = (clone.textContent || '').replace(/[\u200B-\u200D\uFEFF]/g, '')
    
    // Strip out the raw URL strings from the leftover text too
    rawUrlTokens.forEach(url => { leftoverText = leftoverText.replace(url, '') })
    
    // Strip out bullets (•, -) and ordered numbers (1., 2)) added by browsers
    leftoverText = leftoverText.replace(/(^|\s)(?:[\u2022\-\*]|\d+[\.\)])\s+/g, '')
    // Finally, strip ALL spaces and punctuation to see the pure remaining word count
    leftoverText = leftoverText.replace(/[\s,\.\-\u2022\*\n\r]/g, '').trim()

    // If there are valid URLs, no complex HTML structure, AND almost no leftover words 
    // (meaning the entire block was just URLs + their anchor titles + bullets), it's a Bulk URL Save.
    const isBulkLinkSave = allUrls.length > 0 && leftoverText.length < 30 && !hasMediaOrStructure

    if (isBulkLinkSave && allUrls.length === 1) {
      const existing = bookmarks.find(b => (b.type === 'link' || !b.type) && normalizeUrl(b.url) === normalizeUrl(allUrls[0]))
      if (existing) { setDuplicateMatch(existing); return }
    }

    setIsSaving(true)
    const existingUrls = new Set(bookmarks.map(b => normalizeUrl(b.url)))

    try {
      if (isBulkLinkSave && allUrls.length > 1) {
        // --- BULK PASTE MODE ---
        const validNewTokens = allUrls.filter(token => !existingUrls.has(normalizeUrl(token)))
        if (validNewTokens.length === 0) { toast.error('Already cataloged.'); setIsSaving(false); return }
        
        await Promise.all(validNewTokens.map(token => fetch('/api/save', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ url: /^https?:\/\//i.test(token) ? token : 'https://' + token }) 
        })))
        toast.success(`Cataloged ${validNewTokens.length} items`)
        
      } else {
        // --- SINGLE PASTE OR NOTE MODE ---
        const isSingleUrl = isBulkLinkSave && allUrls.length === 1
        let finalUrl = isSingleUrl ? allUrls[0] : cleanText
        if (isSingleUrl) finalUrl = /^https?:\/\//i.test(finalUrl) ? finalUrl : 'https://' + finalUrl
        
        const payload = isSingleUrl ? { url: finalUrl } : { url: window.location.origin + '/note-' + Date.now(), content: inputValue, type: 'note' }

        const res = await fetch('/api/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        const data = await res.json().catch(() => ({}))

        if (res.status === 409) {
          if (data.existing) setDuplicateMatch(data.existing)
          setIsSaving(false)
          return
        }
        if (!res.ok) throw new Error('Failed')
      }
      setInputValue('')
      setIsExpanded(false)
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur()
      }
    } catch { toast.error('Error.') } finally { setIsSaving(false) }
  }

  const filteredBookmarks = useMemo(() => {
    const filtered = bookmarks.filter((bookmark) => {
      const isCategoryMatch = activeFilter === 'All' || (bookmark.category || 'Uncategorized') === activeFilter;
      const isSubCategoryMatch = activeFilter === 'All' || !activeSubFilter ? true : bookmark.sub_category === activeSubFilter;

      const isMediaTypeMatch = activeMediaType === null || matchesType(bookmark, activeMediaType);

      const searchTarget = searchQuery.toLowerCase();
      const isSearchMatch = searchTarget === '' ||
        bookmark.title.toLowerCase().includes(searchTarget) ||
        bookmark.url.toLowerCase().includes(searchTarget) ||
        (bookmark.content !== null && bookmark.content !== undefined && bookmark.content.toLowerCase().includes(searchTarget)) ||
        (bookmark.description !== null && bookmark.description !== undefined && bookmark.description.toLowerCase().includes(searchTarget)) ||
        (bookmark.category !== null && bookmark.category !== undefined && bookmark.category.toLowerCase().includes(searchTarget)) ||
        (bookmark.sub_category !== null && bookmark.sub_category !== undefined && bookmark.sub_category.toLowerCase().includes(searchTarget));

      return isCategoryMatch && isSubCategoryMatch && isMediaTypeMatch && isSearchMatch;
    });

    return filtered.sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }, [bookmarks, activeFilter, activeSubFilter, activeMediaType, searchQuery, sortOrder]);

  const masonryColumns = useMemo(() => {
    if (isGroupedByDate) return [];
    return distributeToColumns(filteredBookmarks, columnsCount)
  }, [filteredBookmarks, columnsCount, isGroupedByDate])

  const groupedBookmarks = useMemo(() => {
    if (!isGroupedByDate) return null;

    const groups: Record<string, Bookmark[]> = {};
    filteredBookmarks.forEach(bookmark => {
      const header = formatDateHeader(bookmark.created_at);
      if (!groups[header]) groups[header] = [];
      groups[header].push(bookmark);
    });
    return groups;
  }, [filteredBookmarks, isGroupedByDate]);

  const folderHierarchy = useMemo(() => {
    const tree: Record<string, string[]> = {}
    const baseCats = Array.from(new Set([...customCategories, ...bookmarks.map(b => b.category || 'Uncategorized')]))
    baseCats.forEach(c => { if (c !== 'All') tree[c] = [] })
    bookmarks.forEach(b => {
      const p = b.category || 'Uncategorized'
      if (b.sub_category) { if (!tree[p]) tree[p] = []; if (!tree[p].includes(b.sub_category)) tree[p].push(b.sub_category) }
    })
    Object.entries(customSubCategories).forEach(([p, subs]) => {
      if (!tree[p]) tree[p] = []
      subs.forEach(s => { if (!tree[p].includes(s)) tree[p].push(s) })
    })
    return tree
  }, [bookmarks, customCategories, customSubCategories])

  const getCounts = useMemo(() => {
    const counts: Record<string, number> = { 'All': bookmarks.length }
    bookmarks.forEach(b => {
      const c = b.category || 'Uncategorized'
      counts[c] = (counts[c] || 0) + 1
      if (b.sub_category) counts[`${c}::${b.sub_category}`] = (counts[`${c}::${b.sub_category}`] || 0) + 1
    })
    return counts
  }, [bookmarks])

  const handleAddCategory = () => {
    const t = newCategoryName.trim()
    if (t && !Object.keys(folderHierarchy).includes(t)) { setCustomCategories(p => [...p, t]); setActiveFilter(t); setActiveSubFilter(null) }
    setNewCategoryName(''); setIsAddingCategory(false)
  }

  const handleAddSubfolder = (p: string) => {
    const t = newSubfolderName.trim()
    if (t) { setCustomSubCategories(prev => { const e = prev[p] || []; return e.includes(t) ? prev : { ...prev, [p]: [...e, t] } }); setActiveFilter(p); setActiveSubFilter(t) }
    setNewSubfolderName(''); setCreatingSubFor(null)
  }

  const handleDeleteCategory = async (catToDelete: string) => {
    setCustomCategories(p => p.filter(c => c !== catToDelete));
    if (activeFilter === catToDelete) { setActiveFilter('All'); setActiveSubFilter(null) };
  }

  const toggleFolderExpand = (folder: string) => setExpandedFolders(prev => ({ ...prev, [folder]: !prev[folder] }))
  const handleDragStart = (e: React.DragEvent, id: number) => { e.dataTransfer.setData('bookmarkId', id.toString()); setDraggedId(id) }
  const handleDragEnd = () => setDraggedId(null)
  const handleDragOver = (e: React.DragEvent) => e.preventDefault()
  const handleDrop = async (e: React.DragEvent, targetCategory: string, targetSubCategory?: string) => {
    e.preventDefault(); const id = parseInt(e.dataTransfer.getData('bookmarkId'))
    if (!id || isNaN(id)) return
    await updateBookmark(id, { category: targetCategory === 'All' ? 'Uncategorized' : targetCategory, sub_category: targetSubCategory || null })
  }

  const hasFilters = activeFilter !== 'All' || activeMediaType !== null || searchQuery !== ''
  const clearAll = () => { setActiveFilter('All'); setActiveSubFilter(null); setActiveMediaType(null); setSearchQuery('') }
  const viewTitle = activeSubFilter || (activeFilter !== 'All' ? activeFilter : activeMediaType ? mediaTypeLabels[activeMediaType] : 'All saves')
  const crumbs = [activeFilter !== 'All' && activeFilter, activeFilter !== 'All' && activeSubFilter, activeFilter === 'All' && activeMediaType && mediaTypeLabels[activeMediaType]].filter(Boolean) as string[]
  const typeCounts = useMemo(() => Object.fromEntries(Object.keys(mediaTypeLabels).map(t => [t, bookmarks.filter(b => matchesType(b, t)).length])) as Record<string, number>, [bookmarks])
  const openCapture = () => { setIsExpanded(true); setTimeout(() => captureBarRef.current?.querySelector<HTMLElement>('.tiptap')?.focus(), 120) }
  const chips = [
    activeFilter !== 'All' && { l: activeSubFilter ? `${activeFilter} / ${activeSubFilter}` : activeFilter, x: () => { setActiveFilter('All'); setActiveSubFilter(null) } },
    searchQuery && { l: `“${searchQuery}”`, x: () => setSearchQuery('') },
  ].filter(Boolean) as FilterChip[]

  // Extension point: future features add an entry here and they show up in the palette (and can take a shortcut hint).
  const commands: Command[] = useMemo(() => [
    { id: 'new-note', group: 'Create', label: 'New note', hint: 'N', run: openCapture },
    { id: 'upload', group: 'Create', label: 'Upload a file', run: () => fileInputRef.current?.click() },
    { id: 'group', group: 'View', label: isGroupedByDate ? 'Ungroup by date' : 'Group by date', run: () => setIsGroupedByDate(v => !v) },
    { id: 'details', group: 'View', label: isMinimalist ? 'Show card details' : 'Hide card details', run: toggleMinimalist },
    { id: 'sort', group: 'View', label: sortOrder === 'desc' ? 'Sort oldest first' : 'Sort newest first', run: () => setSortOrder(o => (o === 'desc' ? 'asc' : 'desc')) },
    { id: 'all', group: 'Go to', label: 'All saves', run: clearAll },
    ...Object.entries(mediaTypeLabels).map(([t, label]) => ({ id: `type-${t}`, group: 'Go to', label, run: () => setActiveMediaType(t) })),
    ...Object.keys(folderHierarchy).map(f => ({ id: `folder-${f}`, group: 'Folders', label: f, run: () => { setActiveFilter(f); setActiveSubFilter(null) } })),
  ], [isGroupedByDate, isMinimalist, sortOrder, folderHierarchy])

  useEffect(() => {
    if (!/Mac|iPhone|iPad/i.test(navigator.platform)) setMod('Ctrl')
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      const typing = !!t && (/INPUT|TEXTAREA|SELECT/.test(t.tagName) || t.isContentEditable)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPaletteOpen(o => !o) }
      else if (e.key === 'Escape') { setPaletteOpen(false); setShowGridMenu(false) }
      else if (!typing && !e.metaKey && !e.ctrlKey && e.key === '/') { e.preventDefault(); searchRef.current?.focus() }
      else if (!typing && !e.metaKey && !e.ctrlKey && e.key.toLowerCase() === 'n') { e.preventDefault(); openCapture() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="bg-[#FAF9F5] dark:bg-[#0F120F] min-h-screen font-sans text-[#171A17] dark:text-[#F3F0E9] flex selection:bg-[#E8EFE5] selection:text-[#4D6A51] dark:selection:bg-[#202820] dark:selection:text-[#69866E] transition-colors duration-500">
      
      {/* 
        UNIVERSAL CSS NUKE
        Forces every single element inside the capture bar (including pasted spans, links, and headers) 
        to perfectly contrast with the green/white background.
      */}
      <style dangerouslySetInnerHTML={{__html: `
        /* Light Mode: Green Capture Bar -> White Text & Cursor */
        .capture-bar-wrapper .tiptap, 
        .capture-bar-wrapper .tiptap * {
          color: #ffffff !important;
          caret-color: #ffffff !important;
        }
        .capture-bar-wrapper .tiptap p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
          color: rgba(255, 255, 255, 0.7) !important;
        }

        /* Dark Mode: White Capture Bar -> Green Text & Cursor */
        .dark .capture-bar-wrapper .tiptap, 
        .dark .capture-bar-wrapper .tiptap * {
          color: #4D6A51 !important;
          caret-color: #4D6A51 !important;
        }
        .dark .capture-bar-wrapper .tiptap p.is-editor-empty:first-child::before {
          color: rgba(77, 106, 81, 0.5) !important;
        }
      `}} />

      {/* ─── SIDEBAR DRAWER (z-[200] ensures it is ALWAYS on top) ─── */}
      <div className={`fixed top-0 left-0 h-screen z-[200] bg-[#FBF9F4] dark:bg-[#151815] transition-all duration-300 flex flex-col border-r border-black/[0.04] dark:border-white/[0.04] shadow-[4px_0_24px_rgba(0,0,0,0.02)] lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0 w-[80vw] sm:w-[280px]' : '-translate-x-full lg:w-[72px]'}`}>
        <Sidebar
          isCollapsed={!isSidebarOpen}
          userEmail={userEmail || null}
          handleSignOut={handleSignOut}
          isMobileMenuOpen={isSidebarOpen}
          setIsMobileMenuOpen={setIsSidebarOpen}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          activeSubFilter={activeSubFilter}
          setActiveSubFilter={setActiveSubFilter}

          activeMediaType={activeMediaType}
          setActiveMediaType={setActiveMediaType}

          getCounts={getCounts}
          folderHierarchy={folderHierarchy}
          expandedFolders={expandedFolders}
          toggleFolderExpand={toggleFolderExpand}
          customCategories={customCategories}
          handleDeleteCategory={handleDeleteCategory}
          handleDragOver={handleDragOver}
          handleDrop={handleDrop}
          creatingSubFor={creatingSubFor}
          setCreatingSubFor={setCreatingSubFor}
          newSubfolderName={newSubfolderName}
          setNewSubfolderName={setNewSubfolderName}
          handleAddSubfolder={handleAddSubfolder}
          isAddingCategory={isAddingCategory}
          setIsAddingCategory={setIsAddingCategory}
          newCategoryName={newCategoryName}
          setNewCategoryName={setNewCategoryName}
          handleAddCategory={handleAddCategory}
        />
      </div>

      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          onTouchMove={() => setIsSidebarOpen(false)}
          onWheel={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/10 dark:bg-black/40 backdrop-blur-sm z-[150] transition-opacity lg:hidden"
        />
      )}

      {/* ─── MAIN CONTENT ─── */}
      <div className={`flex-1 flex flex-col min-h-screen relative w-full transition-all duration-300 ${isSidebarOpen ? 'lg:ml-[280px] lg:w-[calc(100%-280px)]' : 'lg:ml-[72px] lg:w-[calc(100%-72px)]'}`}>

        {/* TOP BAR: navigation context, search, primary action */}
        <div className="sticky top-0 z-40 w-full bg-[#FAF9F5]/90 dark:bg-[#0F120F]/90 backdrop-blur-xl border-b border-black/[0.06] dark:border-white/[0.06]">
          <header className="h-14 flex items-center gap-3 px-3 sm:px-8">
            <button aria-label="Open menu" onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 -ml-2 rounded-lg text-[#171A17]/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5"><MenuIcon /></button>
            <nav aria-label="Breadcrumb" className="hidden md:flex items-center gap-1.5 text-sm shrink-0 text-[#171A17]/55 dark:text-white/55">
              <button onClick={clearAll} className="hover:text-[#171A17] dark:hover:text-white transition-colors">Library</button>
              {crumbs.map(c => <span key={c} className="flex items-center gap-1.5"><span aria-hidden="true">/</span><span className="text-[#171A17] dark:text-white font-medium truncate max-w-[22ch]" title={c}>{c}</span></span>)}
            </nav>
            <div className="relative flex-1 max-w-xl md:ml-4">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-black/45 dark:text-white/45" />
              <input ref={searchRef} type="text" aria-label="Search saves" placeholder="Search your saves" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 bg-black/[0.04] dark:bg-white/[0.06] border border-transparent focus:border-[#4D6A51] dark:focus:border-[#8FAA91] outline-none pl-9 pr-14 rounded-lg text-[16px] sm:text-sm text-[#171A17] dark:text-[#F3F0E9] placeholder-black/45 dark:placeholder-white/45 transition-colors" />
              {searchQuery
                ? <button aria-label="Clear search" onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-black/50 hover:text-black dark:text-white/50 dark:hover:text-white"><ClearIcon /></button>
                : <kbd className={`${KBD} absolute right-2.5 top-1/2 -translate-y-1/2`}>/</kbd>}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button onClick={() => setPaletteOpen(true)} aria-label="Open command palette" className={`${BTN} hidden md:inline-flex text-[#171A17]/60 dark:text-white/60`}>Commands <kbd className={KBD}>{mod} K</kbd></button>
              <button onClick={openCapture} aria-label="New save" className="h-9 px-3 sm:px-4 inline-flex items-center gap-2 rounded-lg bg-[#4D6A51] dark:bg-[#8FAA91] text-white dark:text-[#151815] text-sm font-medium hover:opacity-90 transition-opacity"><PlusIcon /><span className="hidden sm:inline">New</span></button>
            </div>
          </header>
        </div>

        {/* PAGE HEADER: title, count, view options, type tabs, active filters */}
        <div className="px-3 sm:px-8 pt-6 pb-2">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <h1 className="font-serif text-2xl sm:text-3xl font-medium leading-tight text-[#171A17] dark:text-[#F4F1EA] break-words">{viewTitle}</h1>
              <p className="mt-1 text-sm text-[#171A17]/55 dark:text-white/55">{filteredBookmarks.length} {filteredBookmarks.length === 1 ? 'save' : 'saves'}{filteredBookmarks.length !== bookmarks.length ? ` of ${bookmarks.length}` : ''}</p>
            </div>
            {/* Extension point: put future page-level actions (share, export, select) beside the View menu. */}
            <div className="relative flex items-center gap-2">
              <button onClick={() => setShowGridMenu(v => !v)} aria-haspopup="menu" aria-expanded={showGridMenu} className={BTN}><SlidersIcon />View</button>
              {showGridMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowGridMenu(false)} />
                  <div role="menu" className="absolute right-0 top-full mt-2 w-72 z-50 p-4 space-y-4 rounded-2xl bg-white dark:bg-[#151815] border border-black/[0.06] dark:border-white/10 shadow-[0_16px_48px_rgba(0,0,0,0.16)]">
                    <div><p className="mb-2 text-xs font-medium text-[#171A17]/50 dark:text-white/50">Sort</p>
                      <Seg<'desc' | 'asc'> value={sortOrder} onChange={setSortOrder} options={[{ v: 'desc', label: 'Newest first' }, { v: 'asc', label: 'Oldest first' }]} /></div>
                    <div><p className="mb-2 text-xs font-medium text-[#171A17]/50 dark:text-white/50">Card details</p>
                      <Seg<'full' | 'min'> value={isMinimalist ? 'min' : 'full'} onChange={v => { if ((v === 'min') !== isMinimalist) toggleMinimalist() }} options={[{ v: 'full', label: 'Detailed' }, { v: 'min', label: 'Minimal' }]} /></div>
                    <div className="hidden sm:block"><p className="mb-2 text-xs font-medium text-[#171A17]/50 dark:text-white/50">Columns</p>
                      <Seg<'auto' | 5 | 6 | 9> value={userColPreference} onChange={v => { setUserColPreference(v); if (v === 'auto') localStorage.removeItem('space_grid_pref'); else localStorage.setItem('space_grid_pref', String(v)) }} options={[{ v: 'auto', label: 'Auto' }, { v: 5, label: '5' }, { v: 6, label: '6' }, { v: 9, label: '9' }]} /></div>
                    <label className="flex items-center justify-between text-sm text-[#171A17] dark:text-[#F3F0E9]">Group by date
                      <input type="checkbox" role="switch" checked={isGroupedByDate} onChange={() => setIsGroupedByDate(v => !v)} className="w-4 h-4 accent-[#4D6A51]" /></label>
                  </div>
                </>
              )}
            </div>
          </div>

          <div role="tablist" aria-label="Filter by type" className="mt-5 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {[{ k: null as string | null, label: 'All' }, ...Object.entries(mediaTypeLabels).map(([k, label]) => ({ k: k as string | null, label }))].map(t => {
              const on = activeMediaType === t.k
              return (
                <button key={t.label} role="tab" aria-selected={on} onClick={() => setActiveMediaType(t.k)}
                  className={`shrink-0 flex items-center gap-2 px-3.5 h-9 rounded-full text-sm font-medium border transition-colors ${on ? 'bg-[#4D6A51] border-[#4D6A51] text-white dark:bg-[#8FAA91] dark:border-[#8FAA91] dark:text-[#151815]' : 'border-black/10 dark:border-white/10 text-[#171A17]/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5'}`}>
                  {t.label}<span className={`text-xs tabular-nums ${on ? 'opacity-75' : 'opacity-50'}`}>{t.k === null ? bookmarks.length : typeCounts[t.k]}</span>
                </button>
              )
            })}
          </div>

          {chips.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#171A17] dark:text-[#F3F0E9]">
              {chips.map(f => (
                <span key={f.l} className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-md bg-black/[0.05] dark:bg-white/[0.07]">{f.l}
                  <button aria-label={`Remove ${f.l}`} onClick={f.x} className="p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10"><ClearIcon /></button></span>
              ))}
              <button onClick={clearAll} className="px-1.5 py-1 font-medium text-[#4D6A51] dark:text-[#8FAA91] hover:underline">Clear all</button>
            </div>
          )}
        </div>

        {/* MAIN GRID VIEW OR EMPTY STATE */}
        <main className="flex-1 px-3 sm:px-8 pt-4 pb-32">
          <div className="w-full flex flex-col items-start" ref={gridRef}>
            {isLoading ? (
              <div className="w-full flex gap-1.5 sm:gap-6">
                {Array.from({ length: columnsCount }).map((_, colIndex) => (
                  <div key={colIndex} className="flex flex-col gap-1.5 sm:gap-6 w-full flex-1 min-w-0">
                    {Array.from({ length: 3 }).map((_, i) => <BookmarkSkeleton key={i} />)}
                  </div>
                ))}
              </div>
            ) : bookmarks.length === 0 ? (
              <div className="w-full max-w-xl mx-auto mt-[8vh] text-center px-4 animate-fade-in">
                <h2 className="font-serif text-2xl sm:text-3xl text-[#171A17] dark:text-[#F3F0E9]">Nothing saved yet</h2>
                <p className="mt-3 text-sm sm:text-base leading-relaxed text-[#171A17]/60 dark:text-white/60">Paste a link, write a note or upload a file. inntoit keeps the preview, not just the address.</p>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <button onClick={openCapture} className="h-10 px-5 rounded-lg bg-[#4D6A51] dark:bg-[#8FAA91] text-white dark:text-[#151815] text-sm font-medium hover:opacity-90 transition-opacity">Add your first save</button>
                  <button onClick={() => fileInputRef.current?.click()} className={`${BTN} h-10 px-5`}>Upload a file</button>
                </div>
                <p className="mt-6 text-xs text-[#171A17]/45 dark:text-white/45">Press N to write a note, or {mod} K to search and run commands.</p>
              </div>
            ) : filteredBookmarks.length === 0 ? (
              <div className="w-full max-w-md mx-auto mt-[8vh] text-center px-4">
                <h2 className="font-serif text-xl sm:text-2xl text-[#171A17] dark:text-[#F3F0E9]">No saves match</h2>
                <p className="mt-2 text-sm text-[#171A17]/60 dark:text-white/60">Try a different search, or remove a filter to see everything again.</p>
                {hasFilters && <button onClick={clearAll} className={`${BTN} mt-6`}>Clear filters</button>}
              </div>
            ) : isGroupedByDate && groupedBookmarks ? (
              Object.entries(groupedBookmarks).map(([dateLabel, groupBookmarks]) => {
                const groupCols = distributeToColumns(groupBookmarks, columnsCount)

                return (
                  <div key={dateLabel} className="w-full mb-10">
                    <div className="sticky top-14 z-30 flex items-baseline gap-2.5 py-2.5 mb-4 bg-[#FAF9F5]/90 dark:bg-[#0F120F]/90 backdrop-blur">
                      <h3 className="text-sm font-semibold text-[#171A17] dark:text-[#E2E8F0]">{dateLabel}</h3>
                      <span className="text-xs tabular-nums text-[#171A17]/45 dark:text-white/45">{groupBookmarks.length}</span>
                    </div>

                    <div className="w-full flex gap-1.5 sm:gap-6 items-start">
                      {groupCols.map((colBookmarks, colIndex) => (
                        <div key={colIndex} className="flex flex-col gap-1.5 sm:gap-6 w-full flex-1 min-w-0">
                          {colBookmarks.map(bookmark => (
                            <BookmarkCard
                              key={bookmark.id}
                              bookmark={bookmark}
                              theme={{ card: 'border border-black/[0.04] dark:border-white/[0.04] bg-white dark:bg-[#151815] shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none', btn: '', hover: '' }}
                              isDragged={draggedId === bookmark.id}
                              onDragStart={handleDragStart}
                              onDragEnd={handleDragEnd}
                              updateBookmark={updateBookmark}
                              deleteBookmark={deleteBookmark}
                              forceOpenModal={forcedInspectId === bookmark.id}
                              onCloseForcedModal={() => setForcedInspectId(null)}
                              folderHierarchy={folderHierarchy}
                              isMinimalist={isMinimalist}
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="w-full flex gap-1.5 sm:gap-6 items-start">
                {masonryColumns.map((colBookmarks, colIndex) => (
                  <div key={colIndex} className="flex flex-col gap-1.5 sm:gap-6 w-full flex-1 min-w-0">
                    {colBookmarks.map(bookmark => (
                      <BookmarkCard
                        key={bookmark.id}
                        bookmark={bookmark}
                        theme={{ card: 'border border-black/[0.04] dark:border-white/[0.04] bg-white dark:bg-[#151815] shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none', btn: '', hover: '' }}
                        isDragged={draggedId === bookmark.id}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        updateBookmark={updateBookmark}
                        deleteBookmark={deleteBookmark}
                        forceOpenModal={forcedInspectId === bookmark.id}
                        onCloseForcedModal={() => setForcedInspectId(null)}
                        folderHierarchy={folderHierarchy}
                        isMinimalist={isMinimalist}
                      />
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* --- FOCUS MODE OVERLAY & CAPTURE BAR --- */}
        
        {/* 1. Dark Backdrop */}
        <div 
          className={`fixed inset-0 bg-[#FBF9F4]/80 dark:bg-[#080A08]/90 backdrop-blur-md z-[90] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${isExpanded ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
          onPointerDown={(e) => {
            e.preventDefault();
            setIsExpanded(false);
            if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
          }}
        />

        {/* 2. The Capture Bar / Modal Editor */}
        <div 
          ref={captureBarRef}
          className={`fixed z-[100] flex flex-col bg-[#4D6A51] dark:bg-[#FAF9F5] text-white dark:text-[#4D6A51] overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] origin-bottom ${
            isExpanded 
              ? 'bottom-[50dvh] translate-y-1/2 left-1/2 -translate-x-1/2 w-[92vw] sm:w-[600px] md:w-[750px] h-[65dvh] rounded-[24px] p-4 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.4)] border border-white/20 dark:border-black/[0.08]' 
              : 'bottom-6 left-1/2 -translate-x-1/2 w-[92%] sm:w-[500px] h-[52px] rounded-full p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-white/20 dark:border-black/10 hover:shadow-xl hover:-translate-y-0.5'
          }`}
        >
           {/* Top Header (Visible only in Focus Mode) */}
           <div className={`flex items-center justify-between w-full transition-opacity duration-300 shrink-0 ${isExpanded ? 'opacity-100 h-auto mb-4 sm:mb-6 delay-150' : 'opacity-0 h-0 hidden'}`}>
             <span className="text-[11px] font-bold uppercase tracking-widest text-white/90 dark:text-[#4D6A51]/80 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-white dark:bg-[#4D6A51] shadow-[0_0_8px_rgba(255,255,255,0.8)]"></span>
                New Quick Note
             </span>
             <div className="flex items-center gap-3">
               <span className="text-[10px] font-sans text-white/80 dark:text-[#4D6A51]/70 uppercase tracking-widest hidden sm:block border border-white/20 dark:border-[#4D6A51]/20 px-2 py-1 rounded-md">
                 Press ⌘+Enter to save
               </span>
               <button 
                 onClick={() => { 
                   setIsExpanded(false);
                   if (document.activeElement instanceof HTMLElement) document.activeElement.blur() 
                 }}
                 className="text-xs sm:hidden font-bold uppercase tracking-widest text-white/80 dark:text-[#4D6A51]/80 hover:text-white"
               >
                 Done
               </button>
             </div>
           </div>

           {/* Editor Body */}
           <div className={`capture-bar-wrapper flex-1 w-full relative flex flex-col justify-center min-h-0 ${isExpanded ? 'items-start' : 'items-center px-11'}`}>
             <div className={`w-full custom-scrollbar transition-all duration-500 ${isExpanded ? 'h-full overflow-y-auto text-lg md:text-xl delay-75' : 'h-[24px] overflow-hidden text-[16px] sm:text-sm whitespace-nowrap'}`}>
                <TipTapEditor 
                  value={inputValue} 
                  onChange={setInputValue} 
                  onFocus={() => { setIsInputFocused(true); setIsExpanded(true); }} 
                  onBlur={() => setIsInputFocused(false)}
                  isExpanded={isExpanded}
                />
             </div>
           </div>

           {/* Bottom Actions */}
           <div className={`w-full shrink-0 flex items-center transition-all ${isExpanded ? 'justify-between mt-4 pt-4 border-t border-white/20 dark:border-[#4D6A51]/20 opacity-100 delay-150' : 'absolute inset-0 pointer-events-none'}`}>
              
              {/* Paperclip Button */}
              <div className={`pointer-events-auto flex items-center transition-all ${!isExpanded && 'absolute left-1.5 top-1/2 -translate-y-1/2'}`}>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,video/*,application/pdf" />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className={`shrink-0 text-white/90 dark:text-[#4D6A51]/80 hover:text-white dark:hover:text-[#4D6A51] hover:bg-white/10 dark:hover:bg-[#4D6A51]/10 rounded-full flex items-center justify-center transition-colors disabled:opacity-50 ${isExpanded ? 'w-10 h-10 bg-white/10 dark:bg-[#4D6A51]/5' : 'w-10 h-10'}`}
                >
                  {isUploading ? <SpinnerIcon /> : <PaperclipIcon />}
                </button>
              </div>

              {/* Send Button */}
              <div className={`pointer-events-auto flex items-center transition-all ${!isExpanded && 'absolute right-1.5 top-1/2 -translate-y-1/2'}`}>
                <button
                  onClick={handleQuickCapture}
                  disabled={isSaving || (!inputValue.replace(/<[^>]*>?/gm, '').trim() && !/<(img|hr|table)/i.test(inputValue))}
                  className={`shrink-0 text-[#4D6A51] dark:text-white bg-white dark:bg-[#4D6A51] hover:opacity-90 rounded-full flex items-center justify-center transition-opacity disabled:opacity-30 ${isExpanded ? 'w-10 h-10 shadow-lg' : 'w-10 h-10'}`}
                >
                  <SendIcon />
                </button>
              </div>

           </div>
        </div>

      </div>

      {paletteOpen && <CommandPalette commands={commands} saves={bookmarks} onClose={() => setPaletteOpen(false)} onPick={(b) => { clearAll(); setTimeout(() => setForcedInspectId(b.id), 100) }} />}

      {/* DUPLICATE MODAL */}
      {duplicateMatch && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm" onClick={() => { setDuplicateMatch(null); setInputValue(''); }}>
          <div className="w-full max-w-sm bg-white dark:bg-[#151815] border border-black/[0.04] dark:border-white/[0.04] p-6 rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-serif text-[#171A17] dark:text-white mb-2">Already Cataloged</h3>
            <p className="text-sm text-[#636A63] dark:text-[#9DA59D] mb-4">This source currently exists in your Space.</p>
            <div className="p-3 bg-[#F5F1E8]/50 dark:bg-[#202520] rounded-xl mb-4 border border-black/[0.04] dark:border-white/[0.04]">
               <p className="text-sm font-medium truncate text-[#171A17] dark:text-[#F3F0E9]">{duplicateMatch.title || duplicateMatch.url || 'Untitled Save'}</p>
               <p className="text-xs truncate text-[#737B73] dark:text-[#8F998F] mt-1">{duplicateMatch.url ? duplicateMatch.url.replace(/^https?:\/\/(www\.)?/, '') : ''}</p>
            </div>
            <div className="flex gap-2">
               <button onClick={() => {
                  setActiveFilter('All');
                  setActiveSubFilter(null);
                  setActiveMediaType(null);
                  setSearchQuery('');
                  setTimeout(() => setForcedInspectId(duplicateMatch.id), 100);
                  setDuplicateMatch(null);
                  setInputValue('');
               }} className="flex-1 py-2 bg-[#4D6A51] text-white text-sm rounded-xl hover:opacity-90 transition-opacity">
                  View
               </button>
               <button onClick={() => { setDuplicateMatch(null); setInputValue(''); }} className="flex-1 py-2 bg-black/5 dark:bg-white/5 text-sm rounded-xl text-[#171A17] dark:text-[#F3F0E9] hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                  Dismiss
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}