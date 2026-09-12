const API_URL = 'https://smart-bookmark-app-lime.vercel.app/api/save';

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ id: "save-page", title: "Save Page to Hub", contexts: ["page"] });
  chrome.contextMenus.create({ id: "save-image", title: "Save Image", contexts: ["image"] });
  chrome.contextMenus.create({ id: "save-text", title: "Save as Note", contexts: ["selection"] });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  chrome.action.setBadgeText({ text: "..." });

  let payload = { url: tab.url || info.pageUrl, title: tab.title };

  if (info.menuItemId === "save-image") {
    payload = { ...payload, image_url: info.srcUrl, type: 'image' };
  } else if (info.menuItemId === "save-text") {
    let capturedText = info.selectionText || '';

    // Run in-page extraction to retain pure newlines and exact source formatting
    try {
      const [{ result }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const selection = window.getSelection();
          return selection ? selection.toString() : '';
        }
      });
      if (result) capturedText = result;
    } catch {
      // Fallback to info.selectionText if script injection is blocked
    }

    // --- BULLETPROOF TEXT FRAGMENT BUILDER ---
    // 1. Clean whitespace to a single space
    const cleanText = capturedText.replace(/\s+/g, ' ').trim();
    
    // 2. Strip ALL punctuation to prevent Chrome parser crashes (just for the URL tracker)
    const safeWords = cleanText.replace(/[^\w\s]/g, '').split(' ').filter(w => w.length > 0);
    
    let scrollUrl = (tab.url || info.pageUrl).split('#')[0];
    
    // 3. Create a Start and End boundary so Chrome highlights the entire block
    if (safeWords.length >= 8) {
      const startStr = encodeURIComponent(safeWords.slice(0, 4).join(' '));
      const endStr = encodeURIComponent(safeWords.slice(-4).join(' '));
      scrollUrl += `#:~:text=${startStr},${endStr}`;
    } else if (safeWords.length > 0) {
      scrollUrl += `#:~:text=${encodeURIComponent(safeWords.join(' '))}`;
    }

    payload = {
      ...payload,
      content: capturedText, // Keep exact original formatting for the database text box
      url: scrollUrl,        // Send the safe jump-to-link
      type: 'note'
    };
  }

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });

    if (res.status === 409) {
      chrome.action.setBadgeText({ text: "DUP" });
      chrome.action.setBadgeBackgroundColor({ color: "#d97706" });
    } else if (res.ok) {
      chrome.action.setBadgeText({ text: "OK" });
      chrome.action.setBadgeBackgroundColor({ color: "#15803d" });
    } else {
      throw new Error("Failed");
    }
  } catch {
    chrome.action.setBadgeText({ text: "ERR" });
    chrome.action.setBadgeBackgroundColor({ color: "#b91c1c" });
  }

  setTimeout(() => chrome.action.setBadgeText({ text: "" }), 2500);
});