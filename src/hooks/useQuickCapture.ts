import { useState, useRef, useEffect, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { Bookmark } from '@/types'
import { normalizeUrl } from '@/utils/normalizeUrl'

// Everything about the "save something" pop-up: what is typed, opening/closing it, and saving it through /api/save.
export function useQuickCapture({ bookmarks, onDuplicate, isEscapeBlocked }: {
  bookmarks: Bookmark[]
  onDuplicate: (existing: Bookmark) => void
  isEscapeBlocked: () => boolean     // true while a menu, palette or dialog is open: Esc then belongs to that
}) {
  const [inputValue, setInputValue] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isInputFocused, setIsInputFocused] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const captureBarRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)     // the main "Paste a link or write a note" button
  const openerRef = useRef<HTMLElement | null>(null)     // whatever had focus when the pop-up was opened

  const openCapture = useCallback(() => {
    const active = document.activeElement
    openerRef.current = active instanceof HTMLElement && active !== document.body ? active : null
    setIsExpanded(true)
    setTimeout(() => captureBarRef.current?.querySelector<HTMLElement>('.tiptap')?.focus(), 120)
  }, [])

  // Closes the pop-up and hands focus back to the button that opened it (or the main capture button if that is gone).
  // The text stays in `inputValue`, so it is still there as a draft when the pop-up is opened again.
  const closeCapture = useCallback(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    setIsExpanded(false)
    const opener = openerRef.current
    const target = opener && opener.isConnected ? opener : triggerRef.current
    target?.focus({ preventScroll: true })
  }, [])

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
      if (existing) { onDuplicate(existing); return }
    }

    setIsSaving(true)
    const existingUrls = new Set(bookmarks.map(b => normalizeUrl(b.url)))

    try {
      if (isBulkLinkSave && allUrls.length > 1) {
        // --- BULK PASTE MODE ---
        const validNewTokens = allUrls.filter(token => !existingUrls.has(normalizeUrl(token)))
        if (validNewTokens.length === 0) { toast.error('Already cataloged.'); setIsSaving(false); return }
        
        // Send in small groups and count what really happened (the server allows 60 saves a minute).
        let saved = 0, already = 0, failed = 0, limited = false
        for (let i = 0; i < validNewTokens.length && !limited; i += 5) {
          const results = await Promise.all(validNewTokens.slice(i, i + 5).map(token =>
            fetch('/api/save', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: /^https?:\/\//i.test(token) ? token : 'https://' + token })
            }).then(r => r.status).catch(() => 0)
          ))
          for (const status of results) {
            if (status === 200) saved++
            else if (status === 409) already++
            else if (status === 429) limited = true
            else failed++
          }
        }
        if (limited) {
          // Keep the text in the box: pasting it again later is safe, links already saved are skipped.
          toast.error(`Saved ${saved}. You hit the limit of 60 saves a minute. Paste the rest again in a minute.`)
          setIsSaving(false)
          return
        }
        if (failed > 0) toast.error(`Saved ${saved}${already ? `, ${already} already saved` : ''}, ${failed} could not be saved.`)
        else toast.success(`Cataloged ${saved} item${saved === 1 ? '' : 's'}${already ? ` (${already} already saved)` : ''}`)
        
      } else {
        // --- SINGLE PASTE OR NOTE MODE ---
        const isSingleUrl = isBulkLinkSave && allUrls.length === 1
        let finalUrl = isSingleUrl ? allUrls[0] : cleanText
        if (isSingleUrl) finalUrl = /^https?:\/\//i.test(finalUrl) ? finalUrl : 'https://' + finalUrl
        
        const payload = isSingleUrl ? { url: finalUrl } : { url: window.location.origin + '/note-' + Date.now(), content: inputValue, type: 'note' }

        const res = await fetch('/api/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        const data = await res.json().catch(() => ({}))

        if (res.status === 409) {
          if (data.existing) onDuplicate(data.existing)
          setIsSaving(false)
          return
        }
        if (res.status === 429) { toast.error('Too many saves. Please wait a minute and try again.'); setIsSaving(false); return }
        if (!res.ok) throw new Error('Failed')
      }
      setInputValue('')
      setIsExpanded(false)
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur()
      }
    } catch { toast.error('Error.') } finally { setIsSaving(false) }
  }

  // The shortcut below always calls the newest version, so it never uses an old list of saves.
  const saveRef = useRef(handleQuickCapture)
  useEffect(() => { saveRef.current = handleQuickCapture })

  // Capture CMD+Enter
  useEffect(() => {
    if (!isExpanded) return
    const handleShortcut = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        saveRef.current()
      }
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [isExpanded])

  // Esc closes the pop-up. It only listens while the pop-up is open.
  // If a slash menu, palette, dropdown or dialog is open, Esc was meant for that one, so the pop-up stays.
  const blockedRef = useRef(isEscapeBlocked)
  useEffect(() => { blockedRef.current = isEscapeBlocked })
  useEffect(() => {
    if (!isExpanded) return
    const onEsc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.isComposing || e.defaultPrevented || blockedRef.current()) return
      e.preventDefault()
      closeCapture()
    }
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [isExpanded, closeCapture])

  // Smart Scroll Listener: scrolling the page while typing closes the pop-up and drops the keyboard.
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

  return {
    inputValue, setInputValue, isSaving, isExpanded, setIsExpanded, setIsInputFocused,
    captureBarRef, triggerRef, openCapture, closeCapture, handleQuickCapture,
  }
}
