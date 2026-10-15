const APP_URL = 'https://smart-bookmark-app-lime.vercel.app';
const API_URL = `${APP_URL}/api/save`;
const ex = window.inntoitExtract;   // shared URL rules (extract.js)

// lucide icons (paths copied from lucide.dev), built as DOM nodes: never innerHTML.
const ICONS = {
  bookmarkPlus: ['M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z', 'M12 7v6', 'M9 10h6'],
  loader: ['M21 12a9 9 0 1 1-6.219-8.56'],
  check: ['M20 6 9 17l-5-5'],
  bookmarkCheck: ['m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z', 'm9 10 2 2 4-4'],
  alert: ['M12 8v4', 'M12 16h.01', 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0'],
  clock: ['M12 6v6l4 2', 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0'],
  logIn: ['m10 17 5-5-5-5', 'M15 12H3', 'M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4'],
};
function icon(name, extraClass = '') {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('class', `i ${extraClass}`.trim());
  svg.setAttribute('aria-hidden', 'true');
  for (const d of ICONS[name]) {
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', d);
    svg.appendChild(p);
  }
  return svg;
}
function fill(el, iconName, text, iconClass) {
  el.replaceChildren(icon(iconName, iconClass), document.createTextNode(text));
}

const SITE_NAMES = { twitter: 'X', instagram: 'Instagram', youtube: 'YouTube', pinterest: 'Pinterest' };
const NOTICES = {
  'instagram-not-post': {
    title: 'This is the Instagram feed, not a post',
    text: 'Saving here would only save the feed address. Open a post, or right-click the post you want.',
  },
  'x-not-post': {
    title: 'This X page is not a single post',
    text: 'Saving here would only save the timeline. Open the post, or right-click the post you want.',
  },
};

// Reads the Instagram post shown in the tab (handle, caption, picture). null when it can't.
async function captureFromTab(tabId) {
  try {
    await chrome.scripting.executeScript({ target: { tabId }, files: ['extract.js'] });
    const [r] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => globalThis.inntoitExtract.captureInstagram(null, location.href, document),
    });
    return r?.result || null;
  } catch (e) {
    return null;
  }
}

const openApp = (path = '/dashboard') => chrome.tabs.create({ url: `${APP_URL}${path}` });

document.addEventListener('DOMContentLoaded', async () => {
  const $ = (id) => document.getElementById(id);
  const btn = $('save-btn');
  const status = $('status');
  const noteInput = $('note-input');

  $('open-app').addEventListener('click', () => openApp());
  $('kbd-hint').textContent = `${/Mac/i.test(navigator.platform) ? '⌘' : 'Ctrl'} + Enter to save`;
  fill(btn, 'bookmarkPlus', 'Save to inntoit');

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = tab?.url || '';

  // ---------- what is being saved ----------
  $('page-title').textContent = ex.cleanTitle(tab?.title) || url || 'This tab';
  try { $('page-domain').textContent = new URL(url).hostname.replace(/^www\./, ''); } catch (e) { /* chrome:// pages etc. */ }
  if (tab?.favIconUrl && /^(https:|data:image\/)/.test(tab.favIconUrl)) {
    const img = document.createElement('img');
    img.alt = '';
    img.src = tab.favIconUrl;
    img.addEventListener('error', () => img.remove());   // a broken icon just leaves the globe
    $('fav').replaceChildren(img);
  }
  const site = ex.siteOf(url);
  if (SITE_NAMES[site]) { $('site-chip').textContent = SITE_NAMES[site]; $('site-chip').hidden = false; }

  // ---------- feed / timeline: explain instead of saving the wrong address ----------
  const problem = /^https?:/.test(url) ? ex.pageProblem(url) : null;
  if (problem) {
    $('notice-title').textContent = NOTICES[problem].title;
    $('notice-text').textContent = NOTICES[problem].text;
    $('notice').hidden = false;
    $('note').hidden = true;
    btn.hidden = true;
    return;
  }
  if (!/^https?:/.test(url)) {
    $('note').hidden = true;
    btn.disabled = true;
    fill(btn, 'alert', 'This page can’t be saved');
    return;
  }

  // ---------- note ----------
  const grow = () => { noteInput.style.height = 'auto'; noteInput.style.height = `${Math.min(noteInput.scrollHeight, 180)}px`; };
  noteInput.addEventListener('input', grow);
  noteInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); if (!btn.disabled) save(); }
  });
  noteInput.focus();

  function showStatus(kind, iconName, text, action) {
    status.className = `status ${kind}`;
    status.replaceChildren(icon(iconName), document.createTextNode(text));
    if (action) {
      const a = document.createElement('button');
      a.textContent = action.label;
      a.addEventListener('click', action.onClick);
      status.appendChild(a);
    }
    status.hidden = false;
  }

  async function save() {
    btn.disabled = true;
    fill(btn, 'loader', 'Saving…', 'spin');
    status.hidden = true;

    // Same rules as right-click: a clean address, no title and no type (the server decides).
    const igPost = ex.instagramPostUrl(url, url);
    const capture = igPost ? await captureFromTab(tab.id) : null;
    const personalNote = noteInput.value.trim();
    const payload = {
      url: igPost || ex.cleanUrl(url),
      ...(personalNote && { content: personalNote }),
      ...(capture && { capture }),
    };

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        fill(btn, 'check', 'Saved');
        showStatus('ok', 'check', 'Added to inntoit', { label: 'Open', onClick: () => openApp(data?.data?.id ? `/dashboard?b=${data.data.id}` : '/dashboard') });
        setTimeout(() => window.close(), 1600);
      } else if (res.status === 409) {
        fill(btn, 'bookmarkCheck', 'Already saved');
        const id = data?.existing?.id;
        showStatus('dup', 'bookmarkCheck', 'This is already in inntoit', { label: 'Open', onClick: () => openApp(id ? `/dashboard?b=${id}` : '/dashboard') });
      } else if (res.status === 401) {
        btn.disabled = false;
        fill(btn, 'bookmarkPlus', 'Try again');
        showStatus('err', 'logIn', 'Sign in to inntoit first', { label: 'Sign in', onClick: () => openApp('/login') });
      } else if (res.status === 429) {
        btn.disabled = false;
        fill(btn, 'bookmarkPlus', 'Try again');
        showStatus('dup', 'clock', 'Too many saves. Wait a minute.');
      } else {
        throw new Error(data.error || 'Could not save');
      }
    } catch (err) {
      btn.disabled = false;
      fill(btn, 'bookmarkPlus', 'Try again');
      showStatus('err', 'alert', navigator.onLine ? 'Could not save. Try again.' : 'You are offline.');
    }
  }

  btn.addEventListener('click', save);
});
