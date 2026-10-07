// src/lib/sanitizeNoteHtml.ts
// Cleans the HTML of a saved note on the server.
//
// How it stays safe: it never "removes the bad parts" of what it was given. It reads the input piece by piece
// and BUILDS NEW HTML from an allow-list of tag names and attributes, checking every attribute value.
// Anything that is not on the list (scripts, images, event handlers, styles, odd links) simply never makes it
// into the output. The allow-list is what the TipTap editor produces, so normal notes come out unchanged.

const ALLOWED_TAGS = new Set([
  'p', 'br', 'strong', 'em', 'b', 'i', 'u', 's', 'del', 'strike', 'code', 'pre', 'mark', 'sup', 'sub',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'hr', 'a',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'colgroup', 'col',
  'label', 'input', 'div', 'span',
])
const VOID_TAGS = new Set(['br', 'hr', 'col', 'input'])

// Elements whose whole content must go, not just the tag.
const DROP_WITH_CONTENT =
  /<(script|style|iframe|object|embed|noscript|template|svg|math|textarea|select|form|head|title|xmp|noembed|noframes)\b[^>]*>[\s\S]*?<\/\1\s*>/gi
const COMMENTS = /<!--[\s\S]*?(?:-->|$)/g

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", colon: ':', tab: '\t', newline: '\n', nbsp: ' ',
}

function decodeEntities(v: string): string {
  return v
    .replace(/&#x([0-9a-f]{1,6});?/gi, (_m, h) => safeChar(parseInt(h, 16)))
    .replace(/&#(\d{1,7});?/g, (_m, d) => safeChar(parseInt(d, 10)))
    .replace(/&([a-z]+);/gi, (m, n) => NAMED_ENTITIES[n.toLowerCase()] ?? m)
}
function safeChar(code: number): string {
  try { return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : '' } catch { return '' }
}

const escText = (s: string) => s.replace(/</g, '&lt;').replace(/>/g, '&gt;')
const escAttr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function parseAttrs(src: string): Map<string, string> {
  const out = new Map<string, string>()
  const re = /([^\s"'<>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g
  let m: RegExpExecArray | null
  while ((m = re.exec(src))) {
    const name = m[1].toLowerCase()
    if (out.has(name)) continue
    out.set(name, decodeEntities(m[2] ?? m[3] ?? m[4] ?? ''))
  }
  return out
}

// control characters and invisible spaces that browsers ignore inside a link (used to hide "java\tscript:")
const INVISIBLE = new RegExp('[\\u0000-\\u001f\\u007f-\\u009f\\u200b-\\u200d\\u2028\\u2029\\ufeff]', 'g')

function safeHref(raw: string | undefined): string | null {
  if (!raw) return null
  const cleaned = raw.replace(INVISIBLE, '').trim()
  if (cleaned.length === 0 || cleaned.length > 2048) return null
  return /^(https?:\/\/|mailto:)/i.test(cleaned) ? cleaned : null
}

function renderOpenTag(name: string, a: Map<string, string>): string {
  switch (name) {
    case 'a': {
      const href = safeHref(a.get('href'))
      return href ? `<a href="${escAttr(href)}" target="_blank" rel="noopener noreferrer nofollow">` : '<a>'
    }
    case 'ol': {
      const n = /^\d{1,4}$/.test(a.get('start') ?? '') ? Number(a.get('start')) : null
      return n && n > 1 ? `<ol start="${n}">` : '<ol>'
    }
    case 'ul':
      return a.get('data-type') === 'taskList' ? '<ul data-type="taskList">' : '<ul>'
    case 'li': {
      if (a.get('data-type') !== 'taskItem') return '<li>'
      const checked = a.get('data-checked') === 'true' ? 'true' : 'false'
      return `<li data-checked="${checked}" data-type="taskItem">`
    }
    case 'input':
      if ((a.get('type') ?? '').toLowerCase() !== 'checkbox') return ''
      return a.has('checked') ? '<input type="checkbox" checked>' : '<input type="checkbox">'
    case 'code': {
      const c = a.get('class') ?? ''
      return /^language-[a-z0-9+#-]{1,30}$/i.test(c) ? `<code class="${c}">` : '<code>'
    }
    case 'td':
    case 'th': {
      let extra = ''
      for (const k of ['colspan', 'rowspan']) {
        const v = a.get(k)
        if (v && /^\d{1,3}$/.test(v)) extra += ` ${k}="${Number(v)}"`
      }
      const w = a.get('colwidth')
      if (w && /^\d{1,5}(,\d{1,5}){0,19}$/.test(w)) extra += ` colwidth="${w}"`
      return `<${name}${extra}>`
    }
    default:
      return VOID_TAGS.has(name) ? `<${name}>` : `<${name}>`
  }
}

// Reads one tag starting at "<". Quoted attribute values may contain ">".
const TAG_RE = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:[^<>"']|"[^"]*"|'[^']*')*)>/y

export function sanitizeNoteHtml(input: unknown): string {
  if (typeof input !== 'string') return ''
  let s = input.replace(/\u0000/g, '')

  // Remove scripts, styles, comments etc. (repeat: removing one can join the pieces of another)
  for (let i = 0; i < 10; i++) {
    const next = s.replace(COMMENTS, '').replace(DROP_WITH_CONTENT, '')
    if (next === s) break
    s = next
  }

  let out = ''
  let i = 0
  while (i < s.length) {
    const lt = s.indexOf('<', i)
    if (lt === -1) { out += escText(s.slice(i)); break }
    out += escText(s.slice(i, lt))

    TAG_RE.lastIndex = lt
    const m = TAG_RE.exec(s)
    if (!m) { out += '&lt;'; i = lt + 1; continue }

    const closing = m[1] === '/'
    const name = m[2].toLowerCase()
    if (ALLOWED_TAGS.has(name)) {
      if (closing) { if (!VOID_TAGS.has(name)) out += `</${name}>` }
      else out += renderOpenTag(name, parseAttrs(m[3]))
    }
    i = lt + m[0].length
  }
  return out.trim()
}

export const MAX_NOTE_CHARS = 200_000
