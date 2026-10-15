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
  const done = () => { host?.remove(); host = null; closing = false; };
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
  const root = host.attachShadow({ mode: 'closed' });
  // Constructed style sheets: allowed even on pages whose rules block inline <style>.
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(globalThis.inntoitUI.CSS + PANEL_CSS);
  root.adoptedStyleSheets = [sheet];

  const wrap = document.createElement('div');
  wrap.className = 'wrap';
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

  document.documentElement.appendChild(host);
  requestAnimationFrame(() => { wrap.classList.add('open'); ui.focus(); });
}

// Click anywhere on the page (outside the panel) or press Esc: close.
const onPointerDown = (e) => { if (host && !e.composedPath().includes(host)) close(); };
const onKeyDown = (e) => { if (host && e.key === 'Escape') close(); };
document.addEventListener('pointerdown', onPointerDown, true);
document.addEventListener('keydown', onKeyDown, true);

const onRuntimeMessage = (request, _sender, sendResponse) => {
  if (request.type !== 'TOGGLE_PANEL') return;
  if (host) close(); else open();
  sendResponse({ ok: true });
};
chrome.runtime.onMessage.addListener(onRuntimeMessage);

globalThis.__inntoitPanelCleanup = () => {
  document.removeEventListener('pointerdown', onPointerDown, true);
  document.removeEventListener('keydown', onKeyDown, true);
  try { chrome.runtime.onMessage.removeListener(onRuntimeMessage); } catch (e) { /* old copy cut off by a reload */ }
  host?.remove();
  host = null;
};
}
