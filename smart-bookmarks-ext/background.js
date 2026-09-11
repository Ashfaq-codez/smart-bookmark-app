const API_URL = 'https://smart-bookmark-app-lime.vercel.app/api/save'; // Swap to Vercel for production[cite: 5]

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ id: "save-page", title: "Save Page to Hub", contexts: ["page"] }); //[cite: 5]
  chrome.contextMenus.create({ id: "save-image", title: "Save Image", contexts: ["image"] }); //[cite: 5]
  chrome.contextMenus.create({ id: "save-text", title: "Save as Note", contexts: ["selection"] }); //[cite: 5]
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  chrome.action.setBadgeText({ text: "..." }); //[cite: 5]

  let payload = { url: tab.url || info.pageUrl }; //[cite: 5]
  
  if (info.menuItemId === "save-image") {
    payload = { ...payload, image_url: info.srcUrl, type: 'image' }; //[cite: 5]
  } else if (info.menuItemId === "save-text") {
    payload = { ...payload, description: info.selectionText, type: 'note' }; //[cite: 5]
  }

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    }); //[cite: 5]

    if (res.status === 409) {
      chrome.action.setBadgeText({ text: "DUP" });
      chrome.action.setBadgeBackgroundColor({ color: "#d97706" }); // Amber for duplicate
    } else if (res.ok) {
      chrome.action.setBadgeText({ text: "OK" }); //[cite: 5]
      chrome.action.setBadgeBackgroundColor({ color: "#15803d" }); //[cite: 5]
    } else {
      throw new Error("Failed"); //[cite: 5]
    }
  } catch (err) {
    chrome.action.setBadgeText({ text: "ERR" }); //[cite: 5]
    chrome.action.setBadgeBackgroundColor({ color: "#b91c1c" }); //[cite: 5]
  }
  
  setTimeout(() => chrome.action.setBadgeText({ text: "" }), 2500);
});