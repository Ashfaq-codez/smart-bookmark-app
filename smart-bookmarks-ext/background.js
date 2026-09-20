const API_URL = 'https://smart-bookmark-app-lime.vercel.app/api/save';

// Force Chrome to wipe the slate clean and rebuild the menus
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: "save-page", title: "Save Page to Hub", contexts: ["page"] });
    // NEW: Added link context to capture specific social posts/videos
    chrome.contextMenus.create({ id: "save-link", title: "Save Post / Video", contexts: ["link"] }); 
    chrome.contextMenus.create({ id: "save-image", title: "Save Image", contexts: ["image"] });
    chrome.contextMenus.create({ id: "save-text", title: "Save as Note", contexts: ["selection"] });
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  chrome.action.setBadgeText({ text: "..." });

  // Prioritize linkUrl if they right-clicked a specific post/video link, otherwise fallback to the page URL
  const targetUrl = info.linkUrl || info.pageUrl || tab.url;
  let payload = { url: targetUrl, title: tab.title };

  if (info.menuItemId === "save-image") {
    payload = { ...payload, image_url: info.srcUrl, type: 'image' };
  } else if (info.menuItemId === "save-text") {
    let capturedText = info.selectionText || '';

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
      // Fallback to info.selectionText
    }

    const cleanText = capturedText.trim().replace(/\s+/g, ' ');
    const words = cleanText.split(' ');
    
    let scrollUrl = targetUrl.split('#')[0];
    
    if (words.length > 8) {
      const startStr = encodeURIComponent(words.slice(0, 4).join(' '));
      const endStr = encodeURIComponent(words.slice(-4).join(' '));
      scrollUrl += `#:~:text=${startStr},${endStr}`;
    } else if (words.length > 0) {
      scrollUrl += `#:~:text=${encodeURIComponent(cleanText)}`;
    }

    payload = {
      ...payload,
      content: capturedText, 
      url: scrollUrl,        
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
      
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icon.png",
        title: "Collision Detected",
        message: "This entry already exists in your Space."
      });
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