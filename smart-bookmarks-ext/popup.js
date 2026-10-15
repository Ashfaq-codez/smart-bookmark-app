const API_URL = 'https://smart-bookmark-app-lime.vercel.app/api/save';
const ex = window.inntoitExtract;   // shared URL rules (extract.js)

const HINTS = {
  'instagram-not-post': 'This is the Instagram feed or a profile, not a single post. Right-click a post and choose “Save inntoit”, or open the post first.',
  'x-not-post': 'This X page is not a single post. Right-click a post and choose “Save inntoit”, or open the post first.',
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

function showStatus(status, text, bg, color) {
  status.style.display = 'block';
  status.style.backgroundColor = bg;
  status.style.color = color;
  status.textContent = text;
}

document.addEventListener('DOMContentLoaded', async () => {
  const urlEl = document.getElementById('tab-url');
  const hint = document.getElementById('hint');
  const noteInput = document.getElementById('note-input');
  const btn = document.getElementById('save-btn');
  const status = document.getElementById('status');

  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (activeTab?.url) {
    urlEl.textContent = activeTab.url;
  }

  const problem = activeTab?.url ? ex.pageProblem(activeTab.url) : null;
  if (problem) {
    hint.textContent = HINTS[problem];
    hint.style.display = 'block';
    btn.disabled = true;
    noteInput.disabled = true;
    return;
  }

  btn.addEventListener('click', async () => {
    btn.disabled = true;
    btn.textContent = 'Saving...';
    status.style.display = 'none';

    // Same rules as right-click: a clean address, no title and no type (the server decides).
    const igPost = ex.instagramPostUrl(activeTab.url, activeTab.url);
    const capture = igPost ? await captureFromTab(activeTab.id) : null;
    const personalNote = noteInput.value.trim();
    const payload = {
      url: igPost || ex.cleanUrl(activeTab.url),
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

      if (res.status === 409) {
        showStatus(status, 'Already inntoit', '#FEF3C7', '#92400E');
        setTimeout(() => window.close(), 1400);
      } else if (res.ok) {
        showStatus(status, 'Added inntoit', '#E8EFE5', '#4D6A51');
        setTimeout(() => window.close(), 1000);
      } else {
        throw new Error(data.error || 'Failed to save');
      }
    } catch (err) {
      showStatus(status, err.message || 'Error saving', '#FEE2E2', '#991B1B');
      btn.disabled = false;
      btn.textContent = 'Retry';
    }
  });
});
