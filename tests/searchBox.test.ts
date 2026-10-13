// @vitest-environment jsdom
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { createElement as h, createRef, act, useState } from 'react'
import { createRoot, Root } from 'react-dom/client'
import SearchBox from '@/components/bookmark-list/SearchBox'
import { useDebouncedSearch, SEARCH_DEBOUNCE_MS } from '@/hooks/useDebouncedSearch'

;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

let root: Root | null = null
let host: HTMLElement
beforeEach(() => { vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { cb(0); return 0 }) })
afterEach(() => { act(() => root?.unmount()); root = null; host?.remove(); vi.unstubAllGlobals(); vi.useRealTimers() })

function mountSearch(initial: string) {
  const ref = createRef<HTMLInputElement>()
  const changes: string[] = []
  function Harness() {
    const [v, setV] = useState(initial)
    return h(SearchBox, { searchRef: ref, value: v, onChange: (q: string) => { changes.push(q); setV(q) } })
  }
  host = document.createElement('div'); document.body.appendChild(host)
  root = createRoot(host)
  act(() => root!.render(h(Harness)))
  return { input: ref.current!, changes }
}
const clearBtn = () => document.querySelector<HTMLButtonElement>('button[aria-label="Clear search"]')

describe('selecting the old text on focus', () => {
  it('selects everything when the field gets focus (Tab, tap or the / shortcut)', () => {
    const { input } = mountSearch('old search')
    act(() => input.focus())
    expect([input.selectionStart, input.selectionEnd]).toEqual([0, 'old search'.length])
  })

  it('first click keeps the selection; a second click inside the focused field moves the cursor normally', () => {
    const { input } = mountSearch('old search')
    // first click: mousedown (not focused yet) -> focus -> mouseup
    const down1 = new MouseEvent('mousedown', { bubbles: true, cancelable: true })
    act(() => { input.dispatchEvent(down1); input.focus() })
    const up1 = new MouseEvent('mouseup', { bubbles: true, cancelable: true })
    act(() => { input.dispatchEvent(up1) })
    expect(up1.defaultPrevented).toBe(true)                      // stops the browser from dropping the selection
    // second click: already focused
    const down2 = new MouseEvent('mousedown', { bubbles: true, cancelable: true })
    const up2 = new MouseEvent('mouseup', { bubbles: true, cancelable: true })
    act(() => { input.dispatchEvent(down2); input.dispatchEvent(up2) })
    expect(up2.defaultPrevented).toBe(false)                     // the cursor is placed as usual
  })

  it('does not re-select when you come back to the browser tab', () => {
    const { input } = mountSearch('old search')
    act(() => input.focus())
    act(() => input.setSelectionRange(3, 3))                     // the person had put the cursor in the middle
    act(() => { input.dispatchEvent(new FocusEvent('focusout', { bubbles: true })) })   // window loses focus (the field is still the active element)
    act(() => { input.dispatchEvent(new FocusEvent('focusin', { bubbles: true })) })    // and gets it back
    expect([input.selectionStart, input.selectionEnd]).toEqual([3, 3])
  })
})

describe('clearing', () => {
  it('shows the clear button only when there is text', () => {
    mountSearch('')
    expect(clearBtn()).toBeNull()
    act(() => root!.unmount()); host.remove()
    mountSearch('cats')
    expect(clearBtn()).not.toBeNull()
  })

  it('the clear button empties the field and keeps the focus there', () => {
    const { input, changes } = mountSearch('cats')
    const down = new MouseEvent('mousedown', { bubbles: true, cancelable: true })
    act(() => { clearBtn()!.dispatchEvent(down) })
    expect(down.defaultPrevented).toBe(true)                     // so the field does not lose focus
    act(() => clearBtn()!.click())
    expect(changes).toEqual([''])
    expect(document.activeElement).toBe(input)
    expect(clearBtn()).toBeNull()
  })

  it('Esc clears the text first, then (when empty) leaves the field', () => {
    const { input, changes } = mountSearch('cats')
    act(() => input.focus())
    const seenByWindow = vi.fn()
    window.addEventListener('keydown', seenByWindow)

    const esc1 = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
    act(() => { input.dispatchEvent(esc1) })
    expect(changes).toEqual([''])
    expect(document.activeElement).toBe(input)                   // still focused after the first press

    const esc2 = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
    act(() => { input.dispatchEvent(esc2) })
    expect(document.activeElement).not.toBe(input)               // second press blurs

    // Neither press reached the page-level handlers (so the compose pop-up and menus are not affected)
    expect(seenByWindow).not.toHaveBeenCalled()
    expect(esc1.defaultPrevented && esc2.defaultPrevented).toBe(true)
    window.removeEventListener('keydown', seenByWindow)
  })
})

describe('search requests', () => {
  function mountDebounced() {
    const seen: string[] = []
    let setSearch!: (s: string) => void
    function Harness() {
      const [s, set] = useState('')
      setSearch = set
      seen.push(useDebouncedSearch(s))
      return null
    }
    host = document.createElement('div'); document.body.appendChild(host)
    root = createRoot(host)
    act(() => root!.render(h(Harness)))
    const distinct = () => seen.filter((v, i) => i === 0 || v !== seen[i - 1])
    return { setSearch: (s: string) => act(() => setSearch(s)), distinct }
  }

  it('waits for a pause in typing, then searches once', () => {
    vi.useFakeTimers()
    const t = mountDebounced()
    t.setSearch('c'); vi.advanceTimersByTime(100)
    t.setSearch('ca'); vi.advanceTimersByTime(100)
    t.setSearch('cat')
    act(() => { vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS) })
    expect(t.distinct()).toEqual(['', 'cat'])
  })

  it('clearing is instant and costs exactly one reload', () => {
    vi.useFakeTimers()
    const t = mountDebounced()
    t.setSearch('cat'); act(() => { vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS) })
    t.setSearch('')
    expect(t.distinct()).toEqual(['', 'cat', ''])
  })

  it('typing and clearing before the pause causes no search at all', () => {
    vi.useFakeTimers()
    const t = mountDebounced()
    t.setSearch('cat'); vi.advanceTimersByTime(100)
    t.setSearch('')
    act(() => { vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS * 2) })
    expect(t.distinct()).toEqual([''])
  })
})
