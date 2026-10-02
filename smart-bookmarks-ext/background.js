const API_URL = 'https://smart-bookmark-app-lime.vercel.app/api/save';

// Fallback when the content script can't supply HTML (inputs, restricted pages)
function plainTextToHtml(text) {
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return text
    .replace(/\r\n?/g, '\n')
    .split(/\n{2,}/)
    .map((para) => para.trim())
    .filter(Boolean)
    .map((para) => `<p>${esc(para).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

// Runs INSIDE the page (via chrome.scripting) so it never depends on a stale content script.
// Must stay self-contained.
function extractSelectionHtmlInPage() {
  const escapeHtml = (s) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'IMG', 'VIDEO', 'AUDIO', 'IFRAME', 'CANVAS', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA']);
  const BLOCK_TAGS = new Set(['DIV', 'SECTION', 'ARTICLE', 'HEADER', 'FOOTER', 'MAIN', 'ASIDE', 'NAV', 'FIGURE', 'FIGCAPTION', 'DL', 'DT', 'DD', 'TABLE', 'THEAD', 'TBODY', 'TR', 'ADDRESS', 'P', 'FORM', 'DETAILS', 'SUMMARY']);
  const INLINE_MAP = { B: 'strong', STRONG: 'strong', I: 'em', EM: 'em', U: 'u', S: 's', STRIKE: 's', DEL: 's', CODE: 'code', SUP: 'sup', SUB: 'sub' };

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

    if (INLINE_MAP[tag]) {
      const t = INLINE_MAP[tag];
      return { block: false, html: `<${t}>${inner}</${t}>` };
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
    return { block: false, html: inner };
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
      const frag = range.cloneContents();
      const anc = range.commonAncestorContainer;
      const ancEl = anc.nodeType === Node.ELEMENT_NODE ? anc : anc.parentElement;
      const ws = ancEl ? getComputedStyle(ancEl).whiteSpace : '';
      const ctx = { preserveNewlines: ws.startsWith('pre') };
      const html = toBlocks(frag, ctx);
      return html || null;
    } catch (e) {
      console.error('inntoit selection error:', e);
      return null;
    }
  }
  return getSelectionHtml();
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "save-to-inntoit",
      title: "Save inntoit",
      contexts: ["all"]
    });
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== "save-to-inntoit") return;

  chrome.action.setBadgeText({ text: "..." });
  chrome.action.setBadgeBackgroundColor({ color: "#4D6A51" });

  let resolvedUrl = info.linkUrl || info.srcUrl || info.pageUrl || tab.url;
  
  // FIX: YouTube passes temporary 'blob:https...' links when right-clicking a video.
  // We must immediately block it and fall back to the actual page URL.
  if (resolvedUrl && resolvedUrl.startsWith('blob:')) {
    resolvedUrl = info.linkUrl || info.pageUrl || tab.url;
  }

  let capturedContent = info.selectionText || null;
  let detectedType = capturedContent ? 'note' : null;

  // Read the formatted selection straight from the page (works even if the tab runs an old content script)
  const pageHtmlPromise = capturedContent
    ? chrome.scripting
        .executeScript({ target: { tabId: tab.id, frameIds: [info.frameId || 0] }, func: extractSelectionHtmlInPage })
        .then((r) => r?.[0]?.result || null)
        .catch((err) => { console.log('[inntoit] executeScript failed:', err?.message); return null; })
    : Promise.resolve(null);

  pageHtmlPromise.then((pageHtml) => {
  chrome.tabs.sendMessage(tab.id, { type: 'GET_CLICKED_CONTEXT' }, { frameId: info.frameId || 0 }, (response) => {
    // Keep formatting: prefer the HTML captured by the content script,
    // otherwise rebuild paragraphs/line breaks from the plain selection text.
    let formatKept = false;
    if (capturedContent) {
      const html = pageHtml || (!chrome.runtime.lastError && response?.html);
      formatKept = !!html;
      capturedContent = html || plainTextToHtml(capturedContent);
      console.log('[inntoit] selection saved as', formatKept ? 'HTML' : 'PLAIN fallback', {
        fromPageScript: !!pageHtml,
        contentScriptReplied: !chrome.runtime.lastError,
        contentScriptVersion: response?.v,
        error: chrome.runtime.lastError?.message
      });
    }

    if (!chrome.runtime.lastError && response?.url) {
      // Final safety check just in case the content script failed and returned a blob
      if (!response.url.startsWith('blob:')) {
        resolvedUrl = response.url;
      }
      if (response.type) detectedType = response.type;
    }

    const payload = {
      url: resolvedUrl,
      title: tab.title,
      ...(capturedContent && { content: capturedContent }),
      ...(detectedType && { type: detectedType })
    };

    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    })
    .then(res => {
      if (res.status === 409) {
        chrome.action.setBadgeText({ text: "DUP" });
        chrome.action.setBadgeBackgroundColor({ color: "#D97706" });
      } else if (res.ok) {
        // "OK" = formatting captured, "TXT" = fell back to plain text (content script didn't reply)
        chrome.action.setBadgeText({ text: capturedContent && !formatKept ? "TXT" : "OK" });
        chrome.action.setBadgeBackgroundColor({ color: "#4D6A51" });
      } else {
        throw new Error("Failed");
      }
    })
    .catch(() => {
      chrome.action.setBadgeText({ text: "ERR" });
      chrome.action.setBadgeBackgroundColor({ color: "#B91C1C" });
    })
    .finally(() => {
      setTimeout(() => chrome.action.setBadgeText({ text: "" }), 2200);
    });
  });
  });
});