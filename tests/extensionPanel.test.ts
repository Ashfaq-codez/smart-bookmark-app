import { describe, it, expect, vi } from 'vitest'
import { JSDOM } from 'jsdom'
import fs from 'node:fs'
import path from 'node:path'

// Runs the extension's panel.js in a fake page with a fake `chrome`.
const SRC = fs.readFileSync(path.resolve(__dirname, '../smart-bookmarks-ext/panel.js'), 'utf8')

function setup() {
  const dom = new JSDOM('<!doctype html><html><body><p id="page">page</p></body></html>', { url: 'https://example.com/', runScripts: 'outside-only', pretendToBeVisual: true })
  const w = dom.window as any
  let listener: any = null
  const sent: any[] = []
  w.chrome = {
    runtime: {
      getURL: (p: string) => `chrome-extension://abc/${p}`,
      sendMessage: (m: any) => sent.push(m),
      onMessage: { addListener: (fn: any) => { listener = fn }, removeListener: () => {} },
    },
  }
  // jsdom has no constructed style sheets: a stand-in is enough here.
  if (!w.CSSStyleSheet.prototype.replaceSync) w.CSSStyleSheet = class { replaceSync() {} }
  const attach = w.Element.prototype.attachShadow
  let root: any = null
  w.Element.prototype.attachShadow = function (o: any) {
    root = attach.call(this, { ...o, mode: 'open' })   // open in tests only, so we can look inside
    try { Object.defineProperty(root, 'adoptedStyleSheets', { value: [], writable: true }) } catch { /* already there */ }
    return root
  }
  w.eval(SRC)
  const toggle = () => new Promise((r) => listener({ type: 'TOGGLE_PANEL' }, {}, r))
  const host = () => w.document.querySelector('inntoit-panel')
  const frame = () => root?.querySelector('iframe')
  return { w, toggle, host, frame, sent }
}

describe('extension save panel', () => {
  it('opens a frame with the popup page, top-right', async () => {
    const t = setup()
    await t.toggle()
    expect(t.host()).toBeTruthy()
    expect(t.frame().src).toBe('chrome-extension://abc/popup.html?embedded=1')
  })

  it('toggling again closes it', async () => {
    const t = setup()
    await t.toggle()
    await t.toggle()
    await new Promise((r) => setTimeout(r, 300))
    expect(t.host()).toBe(null)
  })

  it('ignores messages that do not come from its own frame', async () => {
    const t = setup()
    await t.toggle()
    t.w.dispatchEvent(new t.w.MessageEvent('message', { data: { inntoit: 'close' }, source: t.w }))
    await new Promise((r) => setTimeout(r, 300))
    expect(t.host()).toBeTruthy()
  })

  it('closes when its own frame asks, on Esc, and on a click outside', async () => {
    for (const how of ['frame', 'esc', 'outside']) {
      const t = setup()
      await t.toggle()
      if (how === 'frame') t.w.dispatchEvent(new t.w.MessageEvent('message', { data: { inntoit: 'close' }, source: t.frame().contentWindow }))
      if (how === 'esc') t.w.document.dispatchEvent(new t.w.KeyboardEvent('keydown', { key: 'Escape' }))
      if (how === 'outside') t.w.document.getElementById('page').dispatchEvent(new t.w.Event('pointerdown', { bubbles: true, composed: true }))
      await new Promise((r) => setTimeout(r, 300))
      expect(t.host()).toBe(null)
    }
  })

  it('follows the content height, within limits', async () => {
    const t = setup()
    await t.toggle()
    const wrap = t.frame().parentElement
    t.w.dispatchEvent(new t.w.MessageEvent('message', { data: { inntoit: 'height', value: 301.4 }, source: t.frame().contentWindow }))
    expect(wrap.style.height).toBe('302px')
    t.w.dispatchEvent(new t.w.MessageEvent('message', { data: { inntoit: 'height', value: 5000 }, source: t.frame().contentWindow }))
    expect(wrap.style.height).toBe('640px')
  })

  it('falls back to the normal popup when the frame never loads', async () => {
    vi.useFakeTimers()
    try {
      const t = setup()
      await t.toggle()
      vi.advanceTimersByTime(2600)
      expect(t.sent).toContainEqual({ type: 'PANEL_FAILED' })
      expect(t.host()).toBe(null)
    } finally {
      vi.useRealTimers()
    }
  })
})
