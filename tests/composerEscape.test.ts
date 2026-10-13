// @vitest-environment jsdom
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { createElement as h, act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import { useQuickCapture } from '@/hooks/useQuickCapture'
import { useSlashMenu } from '@/components/editor/useSlashMenu'
import TipTapEditor from '@/components/editor/TipTapEditor'

;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

let root: Root | null = null
let host: HTMLElement
afterEach(() => { act(() => root?.unmount()); root = null; host?.remove(); vi.restoreAllMocks() })

// A tiny page: one "opener" button, one main trigger button, and the hook under test.
function mountComposer(blocked = { value: false }) {
  let api!: ReturnType<typeof useQuickCapture>
  function Harness() {
    api = useQuickCapture({ bookmarks: [], onDuplicate: () => {}, isEscapeBlocked: () => blocked.value })
    return h('div', null,
      h('button', { id: 'trigger', ref: api.triggerRef, onClick: api.openCapture }, 'main'),
      h('button', { id: 'opener', onClick: api.openCapture }, 'other opener'),
      h('div', { ref: api.captureBarRef }))
  }
  host = document.createElement('div'); document.body.appendChild(host)
  root = createRoot(host)
  act(() => root!.render(h(Harness)))
  return { get api() { return api }, blocked }
}
const press = (key: string, init: KeyboardEventInit = {}) => {
  const e = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init })
  act(() => { window.dispatchEvent(e) })
  return e
}
const openFrom = (id: string) => {
  const btn = document.getElementById(id) as HTMLButtonElement
  act(() => { btn.focus(); btn.click() })
}

describe('Esc closes the compose pop-up', () => {
  it('closes it and keeps the typed text as a draft', () => {
    const c = mountComposer()
    openFrom('trigger')
    act(() => c.api.setInputValue('<p>half a thought</p>'))
    expect(c.api.isExpanded).toBe(true)
    press('Escape')
    expect(c.api.isExpanded).toBe(false)
    expect(c.api.inputValue).toBe('<p>half a thought</p>')
    openFrom('trigger')
    expect(c.api.inputValue).toBe('<p>half a thought</p>')   // still there when reopened
  })

  it('gives focus back to the button that opened it', () => {
    const c = mountComposer()
    openFrom('opener')
    press('Escape')
    expect(document.activeElement).toBe(document.getElementById('opener'))
    expect(c.api.isExpanded).toBe(false)
  })

  it('falls back to the main capture button when it was opened with a key (nothing focused)', () => {
    const c = mountComposer()
    ;(document.activeElement as HTMLElement | null)?.blur()
    act(() => c.api.openCapture())
    press('Escape')
    expect(document.activeElement).toBe(document.getElementById('trigger'))
  })

  it('does not close while a menu, palette or dialog is open', () => {
    const c = mountComposer()
    openFrom('trigger')
    c.blocked.value = true
    press('Escape')
    expect(c.api.isExpanded).toBe(true)
    c.blocked.value = false
    press('Escape')
    expect(c.api.isExpanded).toBe(false)
  })

  it('ignores other keys', () => {
    const c = mountComposer()
    openFrom('trigger')
    press('Enter')
    press('a')
    expect(c.api.isExpanded).toBe(true)
  })

  it('only listens while the pop-up is open, and cleans up when it closes', () => {
    const add = vi.spyOn(window, 'addEventListener')
    const remove = vi.spyOn(window, 'removeEventListener')
    const keydowns = (spy: typeof add) => spy.mock.calls.filter(c => c[0] === 'keydown').length
    const c = mountComposer()
    const addedClosed = keydowns(add)
    openFrom('trigger')
    expect(keydowns(add)).toBeGreaterThan(addedClosed)       // the Esc listener appeared on open
    const removedBefore = keydowns(remove)
    press('Escape')
    expect(keydowns(remove)).toBeGreaterThan(removedBefore)  // and went away on close
    expect(c.api.isExpanded).toBe(false)
  })
})

describe('Esc inside the slash menu', () => {
  it('closes only the menu and stops the event so the pop-up stays open', () => {
    let menu!: ReturnType<typeof useSlashMenu>
    function Harness() { menu = useSlashMenu(); return null }
    host = document.createElement('div'); document.body.appendChild(host)
    root = createRoot(host)
    act(() => root!.render(h(Harness)))

    const editor = {
      state: { selection: { from: 2, $head: { parent: { type: { name: 'paragraph' }, textBetween: () => '/h' }, parentOffset: 2 } } },
      view: { coordsAtPos: () => ({ top: 0, bottom: 0, left: 0 }) },
    }
    act(() => menu.updateFromEditor(editor, true))
    expect(menu.menuOpen).toBe(true)

    const ev = { key: 'Escape', preventDefault: vi.fn(), stopPropagation: vi.fn() } as any
    act(() => menu.handleKeyDown(ev, editor))
    expect(menu.menuOpen).toBe(false)
    expect(ev.preventDefault).toHaveBeenCalled()
    expect(ev.stopPropagation).toHaveBeenCalled()
  })
})

// The real editor, as in the app. The editor engine marks every Esc typed inside it as "handled",
// so these tests press Esc on the editor itself (not on the window).
describe('Esc typed inside the real editor', () => {
  beforeEach(() => {
    // jsdom has no layout, but the editor asks for text positions when the slash menu opens
    const rect = { top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) }
    ;(Range.prototype as any).getClientRects = () => ({ length: 0, item: () => null, [Symbol.iterator]: function* () {} })
    ;(Range.prototype as any).getBoundingClientRect = () => rect
  })

  async function mountWithEditor() {
    let api!: ReturnType<typeof useQuickCapture>
    function Harness() {
      api = useQuickCapture({ bookmarks: [], onDuplicate: () => {}, isEscapeBlocked: () => false })
      return h('div', null,
        h('button', { id: 'trigger', ref: api.triggerRef, onClick: api.openCapture }, 'main'),
        h('div', { ref: api.captureBarRef },
          h(TipTapEditor, {
            value: api.inputValue, onChange: api.setInputValue, isExpanded: api.isExpanded,
            onFocus: () => { api.setIsInputFocused(true); api.setIsExpanded(true) }, onBlur: () => api.setIsInputFocused(false),
          })))
    }
    host = document.createElement('div'); document.body.appendChild(host)
    root = createRoot(host)
    await act(async () => root!.render(h(Harness)))
    await act(async () => { const t = document.getElementById('trigger')!; t.focus(); t.click() })
    const pm = document.querySelector('.ProseMirror') as HTMLElement & { editor: any }
    await act(async () => { pm.focus() })
    const esc = async () => { await act(async () => { pm.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true, cancelable: true })) }) }
    return { api: () => api, pm, esc }
  }

  it('closes the pop-up', async () => {
    const t = await mountWithEditor()
    expect(t.api().isExpanded).toBe(true)
    await t.esc()
    expect(t.api().isExpanded).toBe(false)
    expect(document.activeElement).toBe(document.getElementById('trigger'))
  })

  it('first Esc closes only the slash menu, the second closes the pop-up', async () => {
    const t = await mountWithEditor()
    await act(async () => { t.pm.editor.commands.insertContent('/') })
    expect(document.body.textContent).toContain('Basic Blocks')        // the slash menu is open
    await t.esc()
    expect(document.body.textContent).not.toContain('Basic Blocks')
    expect(t.api().isExpanded).toBe(true)                               // pop-up stays
    await t.esc()
    expect(t.api().isExpanded).toBe(false)
  })
})
