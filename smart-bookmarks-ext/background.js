const API_URL = 'https://smart-bookmark-app-lime.vercel.app/api/save';

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

  chrome.tabs.sendMessage(tab.id, { type: 'GET_CLICKED_CONTEXT' }, (response) => {
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
        chrome.action.setBadgeText({ text: "OK" });
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