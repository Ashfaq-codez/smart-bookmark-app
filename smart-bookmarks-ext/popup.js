// Chrome's normal popup: only used on pages the floating panel can't be drawn on (chrome://, Web Store, PDF viewer).
// The card itself is built by ui.js, the same as the panel.
const APP_URL = 'https://smart-bookmark-app-lime.vercel.app';
const API_URL = `${APP_URL}/api/save`;

// Runs a function inside the tab (after loading extract.js there). null when the page can't be reached.
async function inTab(tabId, func) {
  try {
    await chrome.scripting.executeScript({ target: { tabId }, files: ['extract.js'] });
    const [r] = await chrome.scripting.executeScript({ target: { tabId }, func });
    return r?.result || null;
  } catch (e) {
    return null;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const style = document.createElement('style');
  style.textContent = globalThis.inntoitUI.CSS + 'body { margin: 0; width: 340px; }';
  document.head.appendChild(style);

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const ui = globalThis.inntoitUI.buildSaveUI(document.body, {
    tab: { url: tab?.url || '', title: tab?.title || '', favIconUrl: tab?.favIconUrl },
    logoUrl: 'icon-32.png',
    showClose: false,
    captureInstagram: () => inTab(tab.id, () => globalThis.inntoitExtract.captureInstagram(null, location.href, document)),
    capturePage: () => inTab(tab.id, () => globalThis.inntoitExtract.capturePageMeta(document)),
    send: async (payload) => {
      // A page with no picture of its own: a screenshot of what the tab shows (the popup isn't in it).
      if (payload.page && globalThis.inntoitShot.needsShot(payload.page)) {
        const shot = await globalThis.inntoitShot.captureTab(tab.windowId);
        if (shot) payload = { ...payload, screenshot: shot };
      }
      const res = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload) });
      return { status: res.status, data: await res.json().catch(() => ({})) };
    },
    openApp: (path) => { chrome.tabs.create({ url: `${APP_URL}${path}` }); window.close(); },
    close: () => window.close(),
  });
  ui.focus();
});
