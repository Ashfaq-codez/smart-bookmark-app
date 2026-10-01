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

  chrome.tabs.sendMessage(tab.id, { type: 'GET_CLICKED_CONTEXT' }, { frameId: info.frameId || 0 }, (response) => {
    // Keep formatting: prefer the HTML captured by the content script,
    // otherwise rebuild paragraphs/line breaks from the plain selection text.
    let formatKept = false;
    if (capturedContent) {
      const html = !chrome.runtime.lastError && response?.html;
      formatKept = !!html;
      capturedContent = html || plainTextToHtml(capturedContent);
      console.log('[inntoit] selection saved as', formatKept ? 'HTML' : 'PLAIN fallback', {
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