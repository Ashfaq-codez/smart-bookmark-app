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

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "save-to-inntoit") return;

  chrome.action.setBadgeText({ text: "..." });
  chrome.action.setBadgeBackgroundColor({ color: "#4D6A51" });

  let resolvedUrl = info.linkUrl || info.srcUrl || info.pageUrl || tab.url;
  let capturedContent = null;
  let detectedType = null;

  if (info.selectionText) {
    capturedContent = info.selectionText;
    detectedType = 'note';
  }

  // Inject DOM crawler to pinpoint exact post or video when right-clicking text, cards, or video elements
  try {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const el = window.__lastRightClickedElement;
        if (!el) return null;

        // 1. YouTube: Detect active video or feed card
        const ytVideo = el.closest('ytd-watch-flexy, #movie_player, video');
        if (ytVideo && window.location.pathname === '/watch') {
          return { url: window.location.href, type: 'youtube' };
        }
        const ytCard = el.closest('ytd-rich-item-renderer, ytd-video-renderer, ytd-grid-video-renderer, ytd-compact-video-renderer');
        if (ytCard) {
          const a = ytCard.querySelector('a#thumbnail, a#video-title-link, a#video-title');
          if (a?.href) return { url: a.href, type: 'youtube' };
        }

        // 2. Twitter / X: Detect exact tweet card
        const tweet = el.closest('article[data-testid="tweet"]');
        if (tweet) {
          const links = Array.from(tweet.querySelectorAll('a[href*="/status/"]'));
          const statusLink = links.find(l => /\/status\/\d+$/.test(l.pathname));
          if (statusLink?.href) return { url: statusLink.href, type: 'twitter' };
        }

        // 3. Instagram: Detect post / reel / feed item
        const igPost = el.closest('article, div[role="presentation"], div[role="dialog"]');
        if (igPost) {
          const igLink = igPost.querySelector('a[href*="/p/"], a[href*="/reel/"]');
          if (igLink?.href) return { url: igLink.href, type: 'instagram' };
        }

        // 4. Generic Link fallback
        const anchor = el.closest('a');
        if (anchor?.href) {
          return { url: anchor.href };
        }

        return null;
      }
    });

    if (result?.url) {
      resolvedUrl = result.url;
      if (result.type) detectedType = result.type;
    }
  } catch {
    // Falls back to resolvedUrl
  }

  const payload = {
    url: resolvedUrl,
    title: tab.title,
    ...(capturedContent && { content: capturedContent }),
    ...(detectedType && { type: detectedType })
  };

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });

    if (res.status === 409) {
      chrome.action.setBadgeText({ text: "DUP" });
      chrome.action.setBadgeBackgroundColor({ color: "#D97706" });
    } else if (res.ok) {
      chrome.action.setBadgeText({ text: "OK" });
      chrome.action.setBadgeBackgroundColor({ color: "#4D6A51" });
    } else {
      throw new Error("Failed");
    }
  } catch {
    chrome.action.setBadgeText({ text: "ERR" });
    chrome.action.setBadgeBackgroundColor({ color: "#B91C1C" });
  }

  setTimeout(() => chrome.action.setBadgeText({ text: "" }), 2500);
});