import { describe, it, expect } from 'vitest'
import { sanitizeNoteHtml as clean, MAX_NOTE_CHARS } from '@/lib/sanitizeNoteHtml'

const ALLOWED = new Set(['p','br','strong','em','b','i','u','s','del','strike','code','pre','mark','sup','sub','h1','h2','h3','h4','h5','h6','ul','ol','li','blockquote','hr','a','table','thead','tbody','tfoot','tr','th','td','colgroup','col','label','input','div','span'])
const ALLOWED_ATTRS = new Set(['href','target','rel','start','data-type','data-checked','type','checked','class','colspan','rowspan','colwidth'])

// Whatever the input, the output may only contain allowed tags and allowed attribute names.
function assertSafe(html: string) {
  for (const m of html.matchAll(/<\/?([a-zA-Z][a-zA-Z0-9]*)([^>]*)>/g)) {
    expect(ALLOWED.has(m[1].toLowerCase())).toBe(true)
    for (const a of m[2].replace(/"[^"]*"/g, '""').matchAll(/\s([a-zA-Z:-]+)(?==|\s|$)/g)) expect(ALLOWED_ATTRS.has(a[1].toLowerCase())).toBe(true)
  }
  expect(/on[a-z]+\s*=/i.test(html.replace(/"[^"]*"/g, '""'))).toBe(false)
  expect(/<(script|img|iframe|style|svg|object|embed|form)/i.test(html)).toBe(false)
}

describe('sanitizeNoteHtml: normal notes come out unchanged', () => {
  const samples = [
    '<p>Hello <strong>world</strong> and <em>you</em></p>',
    '<h1>Title</h1><h2>Sub</h2><p>text</p>',
    '<ul><li><p>one</p></li><li><p>two</p></li></ul>',
    '<ol start="3"><li><p>third</p></li></ol>',
    '<blockquote><p>quote</p></blockquote><hr>',
    '<pre><code class="language-js">let a = 1 &lt; 2</code></pre>',
    '<p>line<br>break</p>',
    '<ul data-type="taskList"><li data-checked="true" data-type="taskItem"><label><input type="checkbox" checked><span></span></label><div><p>done</p></div></li></ul>',
    '<table><tbody><tr><th colspan="2" colwidth="100,200"><p>h</p></th></tr><tr><td><p>a</p></td><td><p>b</p></td></tr></tbody></table>',
    '<p><a href="https://example.com/a?x=1&amp;y=2" target="_blank" rel="noopener noreferrer nofollow">link</a></p>',
    '<p>Tom &amp; Jerry &lt;3</p>',
  ]
  for (const html of samples) {
    it(`keeps ${html.slice(0, 40)}…`, () => { expect(clean(html)).toBe(html) })
  }
  it('is idempotent (cleaning twice changes nothing more)', () => {
    for (const html of samples) expect(clean(clean(html))).toBe(clean(html))
  })
})

describe('sanitizeNoteHtml: attacks', () => {
  const attacks = [
    '<script>alert(1)</script><p>hi</p>',
    '<p>hi</p><SCRIPT SRC=//evil.example/x.js></SCRIPT>',
    '<img src=x onerror=alert(1)>',
    '<p onclick="alert(1)">x</p>',
    '<a href="javascript:alert(1)">x</a>',
    '<a href="JaVaScRiPt:alert(1)">x</a>',
    '<a href="java\tscript:alert(1)">x</a>',
    '<a href="&#106;avascript:alert(1)">x</a>',
    '<a href="&#x6A;&#x61;vascript&colon;alert(1)">x</a>',
    '<a href=" \u0001javascript:alert(1)">x</a>',
    '<a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">x</a>',
    '<a href="vbscript:msgbox(1)">x</a>',
    '<a href="//evil.example">x</a>',
    '<iframe src="https://evil.example"></iframe>',
    '<svg onload=alert(1)><circle/></svg>',
    '<math><mi xlink:href="javascript:alert(1)">x</mi></math>',
    '<style>body{display:none}</style><p>x</p>',
    '<p style="background:url(javascript:alert(1))">x</p>',
    '<scr<script>ipt>alert(1)</scr</script>ipt>',
    '<<script>script>alert(1)<</script>/script>',
    '<p title="x>" onmouseover="alert(1)">y</p>',
    "<p title='x' onmouseover=alert(1) x>y</p>",
    '<input type="text" onfocus=alert(1) autofocus>',
    '<form action="https://evil.example"><input type=submit></form>',
    '<object data="x.swf"></object><embed src="x.swf">',
    '<!-- <script>alert(1)</script> --><p>x</p>',
    '<p>unclosed <script>alert(1)',
    '<a href="https://ok.example" onclick="alert(1)" target="_self">x</a>',
    '<td colspan="1 onclick=alert(1)">x</td>',
    '<code class="x onmouseover=alert(1)">x</code>',
    '<ul data-type="taskList" onclick="a()"><li data-type="taskItem" data-checked="javascript:1">x</li></ul>',
    '<img/src=x/onerror=alert(1)>',
    '<p>text</p>\u0000<scr\u0000ipt>alert(1)</scr\u0000ipt>',
  ]
  for (const html of attacks) {
    it(`neutralises ${JSON.stringify(html).slice(0, 60)}`, () => {
      const out = clean(html)
      assertSafe(out)
      expect(/javascript:|vbscript:|data:text/i.test(out.replace(/&[a-z#0-9]+;/gi, ''))).toBe(false)
    })
  }

  it('keeps the useful text around removed scripts', () => {
    expect(clean('<p>hi</p><script>alert(1)</script>')).toBe('<p>hi</p>')
  })
  it('drops an unsafe link target but keeps the link text', () => {
    expect(clean('<a href="javascript:alert(1)">click</a>')).toBe('<a>click</a>')
  })
  it('turns stray angle brackets into plain text', () => {
    expect(clean('1 < 2 > 0')).toBe('1 &lt; 2 &gt; 0')
  })
  it('always adds safe link settings', () => {
    expect(clean('<a href="https://example.com">x</a>')).toBe('<a href="https://example.com" target="_blank" rel="noopener noreferrer nofollow">x</a>')
  })
  it('allows mailto links', () => {
    expect(clean('<a href="mailto:a@b.co">m</a>')).toContain('href="mailto:a@b.co"')
  })
})

describe('sanitizeNoteHtml: odd input', () => {
  it('returns an empty string for non-text input', () => {
    expect(clean(null)).toBe('')
    expect(clean(undefined)).toBe('')
    expect(clean({ a: 1 })).toBe('')
    expect(clean(42)).toBe('')
  })
  it('handles an empty string', () => { expect(clean('')).toBe('') })
  it('survives very long and deeply repeated input quickly', () => {
    const t = Date.now()
    clean('<p>'.repeat(20000) + 'x' + '<a href="'.repeat(5000))
    clean('<'.repeat(100000))
    clean('"'.repeat(100000) + '<p x="'.repeat(10000))
    expect(Date.now() - t < 3000).toBe(true)
  })
  it('exports the size limit used by the save route', () => { expect(MAX_NOTE_CHARS).toBe(200000) })
})
