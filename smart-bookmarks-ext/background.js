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
    // This MUST say 'content', not 'description'
    payload = { ...payload, content: info.selectionText, type: 'note' }; 
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
  } catch (err) {
    chrome.action.setBadgeText({ text: "ERR" });
    chrome.action.setBadgeBackgroundColor({ color: "#b91c1c" });
  }
  
  setTimeout(() => chrome.action.setBadgeText({ text: "" }), 2500);
});