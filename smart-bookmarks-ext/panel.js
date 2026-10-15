// The save panel: a rounded card floating a little below the browser toolbar, top-right of the page.
// Drawn straight onto the page (ui.js) inside a closed shadow root: the page's styles can't touch it, ours can't
// touch the page, and there is no frame for a strict site (Reddit) to block. Saving goes through background.js,
// like right-click saves. Opened / closed by clicking the toolbar icon (background.js sends TOGGLE_PANEL).
// Needs extract.js and ui.js loaded first. Safe to load more than once.
{
if (globalThis.__inntoitPanelCleanup) globalThis.__inntoitPanelCleanup();

const GAP = 12;          // distance from the top and right edges of the page
const WIDTH = 368;
let host = null;
let closing = false;

const PANEL_CSS = `
  :host { all: initial; }
  .wrap {
    position: fixed; top: ${GAP}px; right: ${GAP}px; z-index: 2147483647;
    width: ${WIDTH}px; max-width: calc(100vw - ${GAP * 2}px); max-height: calc(100vh - ${GAP * 2}px); overflow: hidden auto;
    border-radius: 20px; scrollbar-width: none;
    box-shadow: 0 18px 50px rgba(0, 0, 0, 0.22), 0 2px 8px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.06);
    opacity: 0; transform: translateY(-6px) scale(0.98); transform-origin: top right;
    transition: opacity .18s ease, transform .2s cubic-bezier(.2, .8, .2, 1);
  }
  .wrap::-webkit-scrollbar { display: none; }
  .wrap.open { opacity: 1; transform: none; }
  /* Shown in the browser's top layer (popover): above everything a page can draw, whatever its z-index.
     The browser's own popover look (centered, border, padding) is undone here. */
  .wrap[popover] { inset: auto; top: ${GAP}px; right: ${GAP}px; margin: 0; padding: 0; border: 0; background: transparent; color: inherit; }
  .wrap .app { padding: 16px; }
  @media (prefers-color-scheme: dark) {
    .wrap { box-shadow: 0 18px 50px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.08); }
  }
  @media (prefers-reduced-motion: reduce) { .wrap { transition: none; } }
`;

function close() {
  if (!host || closing) return;
  closing = true;
  const wrap = host.__wrap;
  wrap.classList.remove('open');
  const done = () => { host?.__observer?.disconnect(); host?.remove(); host = null; closing = false; };
  wrap.addEventListener('transitionend', done, { once: true });
  setTimeout(done, 260);   // in case no transition runs
}

// The page's own icon, when it is a safe address.
function pageIcon() {
  const link = document.querySelector('link[rel~="icon"][href], link[rel="apple-touch-icon"][href]');
  try { const u = new URL(link?.getAttribute('href') || '/favicon.ico', location.href); return u.protocol === 'https:' ? u.href : null; } catch (e) { return null; }
}

function open() {
  if (host) return;
  const ex = globalThis.inntoitExtract;
  host = document.createElement('inntoit-panel');
  host.__reattached = 0;
  protect(host);
  const root = host.attachShadow({ mode: 'closed' });
  // Constructed style sheets: allowed even on pages whose rules block inline <style>. A <style> as the backup.
  try {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(globalThis.inntoitUI.CSS + PANEL_CSS);
    root.adoptedStyleSheets = [sheet];
  } catch (e) {
    const style = document.createElement('style');
    style.textContent = globalThis.inntoitUI.CSS + PANEL_CSS;
    root.appendChild(style);
  }

  const wrap = document.createElement('div');
  wrap.className = 'wrap';
  if ('popover' in HTMLElement.prototype) wrap.setAttribute('popover', 'manual');
  wrap.setAttribute('role', 'dialog');
  wrap.setAttribute('aria-label', 'Save to inntoit');
  // Typing in the note must not trigger the page's own keyboard shortcuts (Reddit, X, YouTube…).
  for (const t of ['keydown', 'keyup', 'keypress']) wrap.addEventListener(t, (e) => { if (e.key !== 'Escape') e.stopPropagation(); });
  root.appendChild(wrap);
  host.__wrap = wrap;

  const ui = globalThis.inntoitUI.buildSaveUI(wrap, {
    tab: { url: location.href, title: document.title, favIconUrl: pageIcon() },
    logoUrl: chrome.runtime.getURL('icon-32.png'),
    showClose: true,
    captureInstagram: async () => ex.captureInstagram(null, location.href, document),
    capturePage: async () => ex.capturePageMeta(document),
    send: (payload) => chrome.runtime.sendMessage({ type: 'PANEL_SAVE', payload }).then((r) => {
      if (!r || r.networkError) throw new Error('network');
      return r;
    }),
    openApp: (path) => { chrome.runtime.sendMessage({ type: 'OPEN_APP', path }); close(); },
    close,
  });

  attach();
  try { if (wrap.showPopover) wrap.showPopover(); } catch (e) { /* not in the top layer: the z-index still applies */ }
  requestAnimationFrame(() => { wrap.classList.add('open'); ui.focus(); });

  // Some sites (single-page apps) remove elements they don't know: put the panel back while it is open,
  // a few times only (a page that keeps removing it gets the normal popup instead, never a tug-of-war).
  host.__reattached = 0;
  host.__observer = new MutationObserver(() => {
    if (!host || host.isConnected) return;
    if (++host.__reattached > 4) { host.__observer.disconnect(); return; }
    attach();
    try { if (wrap.showPopover && !wrap.matches(':popover-open')) wrap.showPopover(); } catch (e) { /* ignore */ }
  });
  host.__observer.observe(document.documentElement, { childList: true, subtree: true });
}

function attach() {
  // Next to <body> first (some sites hide or clear whatever else is put in their <body>); if the page
  // removes it from there, inside <body> next time.
  const parent = host.__reattached % 2 === 0 ? document.documentElement : (document.body || document.documentElement);
  parent.appendChild(host);
}

// Page style rules can still reach the panel's outer element (e.g. "hide anything unknown"); inline
// !important styles win over every page rule.
function protect(el) {
  const keep = { display: 'block', visibility: 'visible', opacity: '1', position: 'static', contain: 'none', filter: 'none',
    transform: 'none', clip: 'auto', 'clip-path': 'none', width: 'auto', height: 'auto', overflow: 'visible', 'pointer-events': 'auto' };
  for (const [k, v] of Object.entries(keep)) el.style.setProperty(k, v, 'important');
}

// True when the panel really shows on screen (in the page and not hidden or zero-sized).
function isShowing() {
  if (!host || !host.isConnected) return false;
  const r = host.__wrap.getBoundingClientRect();
  return r.width > 40 && r.height > 40 && getComputedStyle(host.__wrap).visibility !== 'hidden';
}

// Click anywhere on the page (outside the panel) or press Esc: close.
const onPointerDown = (e) => { if (host && !e.composedPath().includes(host)) close(); };
const onKeyDown = (e) => { if (host && e.key === 'Escape') close(); };
document.addEventListener('pointerdown', onPointerDown, true);
document.addEventListener('keydown', onKeyDown, true);

const onRuntimeMessage = (request, _sender, sendResponse) => {
  if (request.type !== 'TOGGLE_PANEL') return;
  if (host) { close(); sendResponse({ ok: true }); return; }
  try {
    open();
  } catch (e) {
    console.warn('[inntoit] panel failed:', e);
    host?.remove(); host = null;
    sendResponse({ ok: false });   // background.js opens the normal popup instead
    return;
  }
  // Answer once the panel has had two frames to appear: if it isn't really on screen, say so.
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (isShowing()) { sendResponse({ ok: true }); return; }
    host?.__observer?.disconnect(); host?.remove(); host = null;
    sendResponse({ ok: false });
  }));
  return true;   // answers later
};
chrome.runtime.onMessage.addListener(onRuntimeMessage);

globalThis.__inntoitPanelCleanup = () => {
  document.removeEventListener('pointerdown', onPointerDown, true);
  document.removeEventListener('keydown', onKeyDown, true);
  try { chrome.runtime.onMessage.removeListener(onRuntimeMessage); } catch (e) { /* old copy cut off by a reload */ }
  host?.__observer?.disconnect();
  host?.remove();
  host = null;
};
}
