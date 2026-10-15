// The save panel: a rounded card floating a little below the browser toolbar, top-right of the page.
// It shows popup.html in a frame (same code as the normal popup), inside a closed shadow root so the
// page's styles can't touch it and ours can't touch the page.
// Opened / closed by clicking the toolbar icon (background.js sends TOGGLE_PANEL).
// Safe to load more than once: a new copy removes the old copy's panel and listeners first.
{
if (globalThis.__inntoitPanelCleanup) globalThis.__inntoitPanelCleanup();

const GAP = 12;          // distance from the top and right edges of the page
const WIDTH = 368;
let host = null;
let frame = null;
let closing = false;

const css = `
  :host { all: initial; }
  .wrap {
    position: fixed; top: ${GAP}px; right: ${GAP}px; z-index: 2147483647;
    width: ${WIDTH}px; max-width: calc(100vw - ${GAP * 2}px); height: 240px; max-height: calc(100vh - ${GAP * 2}px);
    border-radius: 20px; overflow: hidden;
    box-shadow: 0 18px 50px rgba(0, 0, 0, 0.22), 0 2px 8px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.06);
    background: #FAF9F5;
    opacity: 0; transform: translateY(-6px) scale(0.98); transform-origin: top right;
    transition: opacity .18s ease, transform .2s cubic-bezier(.2, .8, .2, 1), height .18s ease;
  }
  .wrap.open { opacity: 1; transform: none; }
  @media (prefers-color-scheme: dark) {
    .wrap { background: #0F120F; box-shadow: 0 18px 50px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.08); }
  }
  @media (prefers-reduced-motion: reduce) { .wrap { transition: none; } }
  iframe { display: block; width: 100%; height: 100%; border: 0; background: transparent; color-scheme: light dark; }
`;

function close() {
  if (!host || closing) return;
  closing = true;
  const wrap = host.__wrap;
  wrap.classList.remove('open');
  const done = () => { host?.remove(); host = null; frame = null; closing = false; };
  wrap.addEventListener('transitionend', done, { once: true });
  setTimeout(done, 260);   // in case no transition runs
}

function open() {
  if (host) return;
  host = document.createElement('inntoit-panel');
  const root = host.attachShadow({ mode: 'closed' });
  // A constructed style sheet: allowed even on pages whose rules block inline <style>.
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(css);
  root.adoptedStyleSheets = [sheet];

  const wrap = document.createElement('div');
  wrap.className = 'wrap';
  frame = document.createElement('iframe');
  frame.src = chrome.runtime.getURL('popup.html?embedded=1');
  frame.title = 'Save to inntoit';
  frame.allow = 'clipboard-write';
  wrap.appendChild(frame);
  root.appendChild(wrap);
  host.__wrap = wrap;
  document.documentElement.appendChild(host);

  // The panel says when it is ready; if it never does (a page that blocks it), use the normal popup instead.
  const failTimer = setTimeout(() => {
    if (host && !host.__ready) { host.remove(); host = null; frame = null; chrome.runtime.sendMessage({ type: 'PANEL_FAILED' }); }
  }, 2500);
  host.__failTimer = failTimer;
}

// Messages from the panel's frame (only that frame: anything else is ignored).
function onMessage(e) {
  if (!frame || e.source !== frame.contentWindow) return;
  const d = e.data || {};
  if (d.inntoit === 'ready') {
    host.__ready = true;
    clearTimeout(host.__failTimer);
    requestAnimationFrame(() => host?.__wrap.classList.add('open'));
    frame.focus();
  } else if (d.inntoit === 'height' && typeof d.value === 'number') {
    host.__wrap.style.height = `${Math.max(120, Math.min(Math.ceil(d.value), 640))}px`;
  } else if (d.inntoit === 'close') {
    close();
  }
}

// Click anywhere on the page (outside the panel) or press Esc: close.
const onPointerDown = (e) => { if (host && !e.composedPath().includes(host)) close(); };
const onKeyDown = (e) => { if (host && e.key === 'Escape') close(); };

window.addEventListener('message', onMessage);
document.addEventListener('pointerdown', onPointerDown, true);
document.addEventListener('keydown', onKeyDown, true);

const onRuntimeMessage = (request, _sender, sendResponse) => {
  if (request.type !== 'TOGGLE_PANEL') return;
  if (host) close(); else open();
  sendResponse({ ok: true });
};
chrome.runtime.onMessage.addListener(onRuntimeMessage);

globalThis.__inntoitPanelCleanup = () => {
  window.removeEventListener('message', onMessage);
  document.removeEventListener('pointerdown', onPointerDown, true);
  document.removeEventListener('keydown', onKeyDown, true);
  try { chrome.runtime.onMessage.removeListener(onRuntimeMessage); } catch (e) { /* old copy cut off by a reload */ }
  host?.remove();
  host = null;
};
}
