// Silently capture the exact DOM pixel only when a right-click occurs
let rightClickedElement = null;

document.addEventListener('contextmenu', (e) => {
  rightClickedElement = e.target;
}, true);

function extractExactUrl(target) {
  if (!target) return null;

  // The Ultimate URL Cleaner: Strips tracking junk and playlist IDs
  const cleanUrl = (rawUrl) => {
    try {
      const urlObj = new URL(rawUrl);
      if (urlObj.hostname.includes('youtube.com')) {
        urlObj.searchParams.delete('list');
        urlObj.searchParams.delete('index');
        urlObj.searchParams.delete('pp');
      }
      if (urlObj.hostname.includes('twitter.com') || urlObj.hostname.includes('x.com')) {
        // Drops all ?s= tracking params to perfectly match your iOS shortcut behavior
        return urlObj.origin + urlObj.pathname;
      }
      return urlObj.toString();
    } catch(e) {
      return rawUrl;
    }
  };

  try {
    // 1. YouTube Video Cards
    const ytCard = target.closest('ytd-rich-item-renderer, ytd-video-renderer, ytd-compact-video-renderer, ytd-grid-video-renderer, ytd-reel-item-renderer, ytd-playlist-video-renderer, ytd-playlist-panel-video-renderer');
    if (ytCard) {
      const a = ytCard.querySelector('a#video-title-link, a#video-title, a#thumbnail');
      if (a?.href) return { url: cleanUrl(a.href), type: 'youtube' };
    }

    // 1b. YouTube Watch/Shorts Page
    if ((window.location.pathname.startsWith('/watch') || window.location.pathname.startsWith('/shorts')) && target.closest('#movie_player, ytd-watch-flexy, ytd-shorts, video')) {
      return { url: cleanUrl(window.location.href), type: 'youtube' };
    }

    // 2. Twitter / X Cards
    const tweet = target.closest('article[data-testid="tweet"]');
    if (tweet) {
      const time = tweet.querySelector('time');
      const timeLink = time ? time.closest('a') : null;
      if (timeLink?.href) return { url: cleanUrl(timeLink.href), type: 'twitter' };

      const statusLinks = Array.from(tweet.querySelectorAll('a[href*="/status/"]'));
      const permalink = statusLinks.find(a => /\/status\/\d+$/.test(new URL(a.href).pathname));
      if (permalink?.href) return { url: cleanUrl(permalink.href), type: 'twitter' };
    }

    // 3. Instagram
    const igArticle = target.closest('article, div[role="presentation"], div[role="dialog"]');
    if (igArticle) {
      const igLink = igArticle.querySelector('a[href*="/p/"], a[href*="/reel/"]');
      if (igLink?.href) return { url: cleanUrl(igLink.href), type: 'instagram' };
    }

    // 3b. Pinterest
    const pinCard = target.closest('div[data-test-id="pin"], div[data-test-id="pinWrapper"]');
    if (pinCard) {
      const pinLink = pinCard.querySelector('a[href*="/pin/"]');
      if (pinLink?.href) return { url: cleanUrl(pinLink.href), type: 'pinterest' };
    }

    // 4. Standard Links
    const anchor = target.closest('a');
    if (anchor?.href && !anchor.href.startsWith('javascript:')) {
      return { url: cleanUrl(anchor.href) };
    }

    // 5. Media (Ignore internal blobs)
    if (target.tagName === 'VIDEO' && target.src && !target.src.startsWith('blob:')) {
        return { url: cleanUrl(target.src), type: 'video' };
    }
    if (target.tagName === 'IMG' && target.src && !target.src.startsWith('blob:')) {
        return { url: cleanUrl(target.src), type: 'image' };
    }

  } catch (err) {
    console.error("inntoit extraction error:", err);
  }

  return null;
}

// Listen for the background script and reply with the precise URL
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_CLICKED_CONTEXT') {
    const result = extractExactUrl(rightClickedElement);
    // If no specific post/video is found, default to saving the main page URL
    sendResponse(result || { url: window.location.href });
  }
});