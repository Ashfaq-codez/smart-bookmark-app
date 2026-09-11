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
    let capturedText = info.selectionText;

    // Run in-page extraction to retain pure newlines and build the scroll fragment
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

    // Generate Chrome Scroll-To-Text URL fragment
    // Takes the first ~60 clean chars of snippet for precise matching
    const cleanMatch = capturedText.trim().replace(/\s+/g, ' ').slice(0, 80);
    const scrollUrl = `${tab.url.split('#')[0]}#:~:text=${encodeURIComponent(cleanMatch)}`;

    payload = {
      ...payload,
      content: capturedText,
      url: scrollUrl, // Links directly to the exact highlighted paragraph
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