// Silently capture the exact DOM pixel only when a right-click occurs
let rightClickedElement = null;
let selectedHtml = null;

// ---------------------------------------------------------------------------
// Selection -> clean HTML (keeps paragraphs, line breaks, lists, bold, links...)
// Output matches what the TipTap editor stores, so notes render like typed ones.
// ---------------------------------------------------------------------------
const escapeHtml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'IMG', 'VIDEO', 'AUDIO', 'IFRAME', 'CANVAS', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA']);
const BLOCK_TAGS = new Set(['DIV', 'SECTION', 'ARTICLE', 'HEADER', 'FOOTER', 'MAIN', 'ASIDE', 'NAV', 'FIGURE', 'FIGCAPTION', 'DL', 'DT', 'DD', 'TABLE', 'THEAD', 'TBODY', 'TR', 'ADDRESS', 'P', 'FORM', 'DETAILS', 'SUMMARY']);
const INLINE_MAP = { B: 'strong', STRONG: 'strong', I: 'em', EM: 'em', U: 'u', S: 's', STRIKE: 's', DEL: 's', CODE: 'code', SUP: 'sup', SUB: 'sub' };

// Bold / italic / underline / strike given by CSS instead of a tag (<span style="font-weight:700"> ...)
function styleMarks(el) {
  const st = el.style;
  if (!st) return [];
  const marks = [];
  const fw = st.fontWeight;
  if (fw === 'bold' || fw === 'bolder' || parseInt(fw, 10) >= 600) marks.push('strong');
  if (st.fontStyle === 'italic') marks.push('em');
  const deco = (st.textDecorationLine || st.textDecoration || '');
  if (deco.includes('underline')) marks.push('u');
  if (deco.includes('line-through')) marks.push('s');
  return marks;
}

// A selection inside a bold/italic/underlined LIVE element: copy that look onto the wrapper clone
function copyLiveLook(clone, live) {
  try {
    const cs = getComputedStyle(live);
    const ps = live.parentElement ? getComputedStyle(live.parentElement) : null;
    if (!ps) return;
    if (parseInt(cs.fontWeight, 10) >= 600 && parseInt(ps.fontWeight, 10) < 600) clone.style.fontWeight = '700';
    if (cs.fontStyle === 'italic' && ps.fontStyle !== 'italic') clone.style.fontStyle = 'italic';
    const d = cs.textDecorationLine || '';
    if (d.includes('line-through') && !(ps.textDecorationLine || '').includes('line-through')) clone.style.textDecoration = 'line-through';
  } catch (e) { /* styles unavailable: skip */ }
}

function renderNode(node, ctx) {
  if (node.nodeType === Node.TEXT_NODE) {
    let t = node.nodeValue;
    if (ctx.preserveNewlines) {
      return { block: false, html: escapeHtml(t).replace(/\r?\n/g, '<br>') };
    }
    t = t.replace(/\s+/g, ' ');
    return { block: false, html: escapeHtml(t) };
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return { block: false, html: '' };

  const tag = node.tagName.toUpperCase();
  if (SKIP_TAGS.has(tag)) return { block: false, html: '' };
  if (tag === 'BR') return { block: false, html: '<br>' };
  if (tag === 'HR') return { block: true, html: '<hr>' };
  if (tag === 'TR') {
    // A table row becomes one line, cells separated by " | " (the editor has no tables)
    const cells = Array.from(node.children)
      .filter((c) => /^(TD|TH)$/.test(c.tagName.toUpperCase()))
      .map((c) => inlineHtml(c, ctx))
      .filter(Boolean);
    return { block: true, html: cells.length ? `<p>${cells.join(' | ')}</p>` : '' };
  }

  if (tag === 'UL' || tag === 'OL') {
    const items = Array.from(node.children)
      .filter((c) => c.tagName.toUpperCase() === 'LI')
      .map((li) => `<li>${toBlocks(li, ctx)}</li>`)
      .join('');
    const start = tag === 'OL' ? parseInt(node.getAttribute('start') || '', 10) : NaN;
    const startAttr = Number.isInteger(start) && start > 1 ? ` start="${start}"` : '';
    return { block: true, html: items ? `<${tag.toLowerCase()}${startAttr}>${items}</${tag.toLowerCase()}>` : '' };
  }

  if (/^H[1-6]$/.test(tag)) {
    return { block: true, html: `<${tag.toLowerCase()}>${inlineHtml(node, ctx)}</${tag.toLowerCase()}>` };
  }

  if (tag === 'BLOCKQUOTE') {
    return { block: true, html: `<blockquote>${toBlocks(node, ctx)}</blockquote>` };
  }

  if (tag === 'PRE') {
    return { block: true, html: `<pre><code>${escapeHtml(node.textContent || '')}</code></pre>` };
  }

  if (BLOCK_TAGS.has(tag)) {
    return { block: true, html: toBlocks(node, ctx) };
  }

  // Inline-ish elements (links, bold, spans, unknown tags)
  const results = Array.from(node.childNodes).map((c) => renderNode(c, ctx));
  if (results.some((r) => r.block)) {
    // e.g. <a><div>..</div></a> -> drop the wrapper, keep the blocks
    return { block: true, html: toBlocks(node, ctx) };
  }
  const inner = results.map((r) => r.html).join('');
  if (!inner) return { block: false, html: '' };

  let marked = inner;
  if (tag !== 'A') for (const mk of styleMarks(node)) marked = `<${mk}>${marked}</${mk}>`;
  if (INLINE_MAP[tag]) {
    const t = INLINE_MAP[tag];
    return { block: false, html: `<${t}>${marked}</${t}>` };
  }
  if (tag === 'A') {
    const href = node.getAttribute('href') || '';
    try {
      const abs = new URL(href, window.location.href);
      if (abs.protocol === 'http:' || abs.protocol === 'https:') {
        return { block: false, html: `<a href="${escapeHtml(abs.href).replace(/"/g, '&quot;')}">${inner}</a>` };
      }
    } catch (e) { /* ignore bad hrefs */ }
  }
  return { block: false, html: marked };
}

function inlineHtml(el, ctx) {
  return Array.from(el.childNodes).map((c) => renderNode(c, ctx).html).join('').trim();
}

// Groups loose inline content into <p> and passes real blocks through
function toBlocks(parent, ctx) {
  let out = '';
  let inline = '';
  const flush = () => {
    const visible = inline.replace(/<br>|&nbsp;|\s/g, '');
    if (visible) out += `<p>${inline.trim()}</p>`;
    inline = '';
  };
  parent.childNodes.forEach((child) => {
    const r = renderNode(child, ctx);
    if (r.block) { flush(); out += r.html; }
    else inline += r.html;
  });
  flush();
  return out;
}

function getSelectionHtml() {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null;
  try {
    const range = sel.getRangeAt(0);
    let content = range.cloneContents();
    const anc = range.commonAncestorContainer;
    const ancEl = anc.nodeType === Node.ELEMENT_NODE ? anc : anc.parentElement;
    const ws = ancEl ? getComputedStyle(ancEl).whiteSpace : '';
    const ctx = { preserveNewlines: ws.startsWith('pre') };

    // cloneContents() drops the elements AROUND the selection (the <ul> of a list, the <h2> of a heading,
    // the <pre> of a code block, a <strong>, a link...). Put them back so the format survives.
    for (let el = ancEl; el && el !== document.body && el !== document.documentElement; el = el.parentElement) {
      if (SKIP_TAGS.has(el.tagName.toUpperCase())) continue;
      const clone = el.cloneNode(false);
      const elTag = el.tagName.toUpperCase();
      // tags that already mean bold/italic/etc. (or headings) are handled by the converter itself
      if (!INLINE_MAP[elTag] && !/^(H[1-6]|TH)$/.test(elTag)) copyLiveLook(clone, el);
      clone.appendChild(content);
      content = clone;
    }
    const holder = document.createElement('div');
    holder.appendChild(content);
    const html = toBlocks(holder, ctx);
    return html || null;
  } catch (e) {
    console.error('inntoit selection error:', e);
    return null;
  }
}

// Remember the latest non-empty selection, in case a site clears it when the context menu opens
let lastSelectionHtml = null;
let selTimer = null;
document.addEventListener('selectionchange', () => {
  clearTimeout(selTimer);
  selTimer = setTimeout(() => {
    const h = getSelectionHtml();
    if (h) lastSelectionHtml = h;
  }, 120);
});

document.addEventListener('contextmenu', (e) => {
  rightClickedElement = e.target;
  // Grab the selection NOW, before the context menu / page can change it
  selectedHtml = getSelectionHtml() || lastSelectionHtml;
}, true);

function extractExactUrl(target) {
  if (!target) return null;

  // The Ultimate URL Cleaner: Strips tracking junk and playlist IDs
  const cleanUrl = (rawUrl) => {
    try {
      const urlObj = new URL(rawUrl);
      // exact site or its sub-domains only ("dropbox.com" must not count as "x.com")
      const isSite = (d) => urlObj.hostname === d || urlObj.hostname.endsWith('.' + d);
      if (isSite('youtube.com')) {
        urlObj.searchParams.delete('list');
        urlObj.searchParams.delete('index');
        urlObj.searchParams.delete('pp');
      }
      if (isSite('twitter.com') || isSite('x.com')) {
        // Drops all ?s= tracking params to perfectly match your iOS shortcut behavior
        return urlObj.origin + urlObj.pathname;
      }
      return urlObj.toString();
    } catch(e) {
      return rawUrl;
    }
  };

  try {
    // 1. YouTube Video Cards
    const ytCard = target.closest('ytd-rich-item-renderer, ytd-video-renderer, ytd-compact-video-renderer, ytd-grid-video-renderer, ytd-reel-item-renderer, ytd-playlist-video-renderer, ytd-playlist-panel-video-renderer');
    if (ytCard) {
      const a = ytCard.querySelector('a#video-title-link, a#video-title, a#thumbnail');
      if (a?.href) return { url: cleanUrl(a.href), type: 'youtube' };
    }

    // 1b. YouTube Watch/Shorts Page
    if ((window.location.pathname.startsWith('/watch') || window.location.pathname.startsWith('/shorts')) && target.closest('#movie_player, ytd-watch-flexy, ytd-shorts, video')) {
      return { url: cleanUrl(window.location.href), type: 'youtube' };
    }

    // 2. Twitter / X Cards
    const tweet = target.closest('article[data-testid="tweet"]');
    if (tweet) {
      const time = tweet.querySelector('time');
      const timeLink = time ? time.closest('a') : null;
      if (timeLink?.href) return { url: cleanUrl(timeLink.href), type: 'twitter' };

      const statusLinks = Array.from(tweet.querySelectorAll('a[href*="/status/"]'));
      const permalink = statusLinks.find(a => /\/status\/\d+$/.test(new URL(a.href).pathname));
      if (permalink?.href) return { url: cleanUrl(permalink.href), type: 'twitter' };
    }

    // 3. Instagram
    const igArticle = target.closest('article, div[role="presentation"], div[role="dialog"]');
    if (igArticle) {
      const igLink = igArticle.querySelector('a[href*="/p/"], a[href*="/reel/"]');
      if (igLink?.href) return { url: cleanUrl(igLink.href), type: 'instagram' };
    }

    // 3b. Pinterest
    const pinCard = target.closest('div[data-test-id="pin"], div[data-test-id="pinWrapper"]');
    if (pinCard) {
      const pinLink = pinCard.querySelector('a[href*="/pin/"]');
      if (pinLink?.href) return { url: cleanUrl(pinLink.href), type: 'pinterest' };
    }

    // 4. Standard Links
    const anchor = target.closest('a');
    if (anchor?.href && !anchor.href.startsWith('javascript:')) {
      return { url: cleanUrl(anchor.href) };
    }

    // 5. Media (Ignore internal blobs)
    if (target.tagName === 'VIDEO' && target.src && !target.src.startsWith('blob:')) {
        return { url: cleanUrl(target.src), type: 'video' };
    }
    if (target.tagName === 'IMG' && target.src && !target.src.startsWith('blob:')) {
        return { url: cleanUrl(target.src), type: 'image' };
    }

  } catch (err) {
    console.error("inntoit extraction error:", err);
  }

  return null;
}

// Listen for the background script and reply with the precise URL
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_CLICKED_CONTEXT') {
    const result = extractExactUrl(rightClickedElement);
    // If no specific post/video is found, default to saving the main page URL
    sendResponse({ ...(result || { url: window.location.href }), html: selectedHtml || getSelectionHtml() || lastSelectionHtml, v: 3 });
  }
});