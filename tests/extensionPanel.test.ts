import { describe, it, expect } from 'vitest'
import { JSDOM } from 'jsdom'
import fs from 'node:fs'
import path from 'node:path'

// Runs the extension's extract.js + ui.js + panel.js in a fake page with a fake `chrome`.
const read = (f: string) => fs.readFileSync(path.resolve(__dirname, '../smart-bookmarks-ext', f), 'utf8')
const SRC = ['extract.js', 'ui.js', 'panel.js'].map(read).join('\n;\n')
const wait = (ms = 0) => new Promise((r) => setTimeout(r, ms))

function setup(url = 'https://example.com/article', saveAnswer: any = { status: 200, data: { data: { id: 7 } } }) {
  const dom = new JSDOM('<!doctype html><html><head><title>(2) A good article</title></head><body><p id="page">page</p></body></html>', { url, runScripts: 'outside-only', pretendToBeVisual: true })
  const w = dom.window as any
  let listener: any = null
  const sent: any[] = []
  w.chrome = {
    runtime: {
      getURL: (p: string) => `chrome-extension://abc/${p}`,
      sendMessage: async (m: any) => { sent.push(m); return m.type === 'PANEL_SAVE' ? saveAnswer : undefined },
      onMessage: { addListener: (fn: any) => { listener = fn }, removeListener: () => {} },
    },
  }
  // jsdom has no constructed style sheets: a stand-in is enough here.
  w.CSSStyleSheet = class { replaceSync() {} }
  let root: any = null
  const attach = w.Element.prototype.attachShadow
  w.Element.prototype.attachShadow = function (o: any) {
    root = attach.call(this, { ...o, mode: 'open' })   // open in tests only, so we can look inside
    Object.defineProperty(root, 'adoptedStyleSheets', { value: [], writable: true })
    return root
  }
  w.eval(SRC)
  const toggle = () => new Promise((r) => listener({ type: 'TOGGLE_PANEL' }, {}, r))
  const host = () => w.document.querySelector('inntoit-panel')
  const $ = (sel: string) => root?.querySelector(sel)
  return { w, toggle, host, $, sent, text: () => root?.textContent || '' }
}

describe('extension save panel (drawn on the page, no frame)', () => {
  it('opens on the page itself: no iframe, shows the cleaned page title', async () => {
    const t = setup()
    await t.toggle()
    expect(t.host()).toBeTruthy()
    expect(t.$('iframe')).toBe(null)
    expect(t.$('.page-title').textContent).toBe('A good article')
    expect(t.$('textarea')).toBeTruthy()
  })

  it('saves through the background script with the note and page details', async () => {
    const t = setup()
    await t.toggle()
    t.$('textarea').value = 'my note'
    t.$('button.save').click()
    await wait(10)
    const save = t.sent.find((m) => m.type === 'PANEL_SAVE')
    expect(save.payload).toMatchObject({ url: 'https://example.com/article', content: 'my note', page: { title: '(2) A good article' } })
    expect(t.text()).toContain('Added to inntoit')
  })

  it('shows "already saved" and "sign in" answers', async () => {
    const dup = setup('https://example.com/a', { status: 409, data: { existing: { id: 3 } } })
    await dup.toggle(); dup.$('button.save').click(); await wait(10)
    expect(dup.text()).toContain('This is already in inntoit')
    const out = setup('https://example.com/a', { status: 401, data: {} })
    await out.toggle(); out.$('button.save').click(); await wait(10)
    expect(out.text()).toContain('Sign in to inntoit first')
  })

  it('on the Instagram feed: the warning, no save button', async () => {
    const t = setup('https://www.instagram.com/')
    await t.toggle()
    expect(t.text()).toContain('This is the Instagram feed, not a post')
    expect(t.$('button.save').hidden).toBe(true)
  })

  it('typing in the note never reaches the page\'s keyboard shortcuts', async () => {
    const t = setup()
    await t.toggle()
    let pageSaw = 0
    t.w.document.addEventListener('keydown', () => { pageSaw++ })
    t.$('textarea').dispatchEvent(new t.w.KeyboardEvent('keydown', { key: 'j', bubbles: true, composed: true }))
    expect(pageSaw).toBe(0)
  })

  it('closes on Esc, a click outside, or a second click on the icon', async () => {
    for (const how of ['esc', 'outside', 'toggle']) {
      const t = setup()
      await t.toggle()
      if (how === 'esc') t.w.document.dispatchEvent(new t.w.KeyboardEvent('keydown', { key: 'Escape' }))
      if (how === 'outside') t.w.document.getElementById('page').dispatchEvent(new t.w.Event('pointerdown', { bubbles: true, composed: true }))
      if (how === 'toggle') await t.toggle()
      await wait(300)
      expect(t.host()).toBe(null)
    }
  })
})
