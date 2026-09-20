// Silently capture the exact DOM pixel only when a right-click occurs
let rightClickedElement = null;

document.addEventListener('contextmenu', (e) => {
  rightClickedElement = e.target;
}, true);

function extractExactUrl(target) {
  if (!target) return null;

  try {
    // 1. YouTube: Right-clicking anywhere inside a video card (text, thumbnail, background)
    const ytCard = target.closest('ytd-rich-item-renderer, ytd-video-renderer, ytd-compact-video-renderer, ytd-grid-video-renderer, ytd-reel-item-renderer');
    if (ytCard) {
      const a = ytCard.querySelector('a#video-title-link, a#video-title, a#thumbnail');
      if (a?.href) {
        return { url: a.href, type: 'youtube' };
      }
    }

    // 1b. YouTube: Right-clicking the playing video on the watch page
    if (window.location.pathname === '/watch' && target.closest('#movie_player, ytd-watch-flexy, video')) {
      return { url: window.location.href, type: 'youtube' };
    }

    // 2. Twitter / X: Right-clicking anywhere inside a Tweet article
    const tweet = target.closest('article[data-testid="tweet"]');
    if (tweet) {
      // Find the permanent timestamp link for this exact tweet
      const time = tweet.querySelector('time');
      const timeLink = time ? time.closest('a') : null;
      if (timeLink?.href) {
        return { url: timeLink.href, type: 'twitter' };
      }

      // Fallback: search for direct status link in case of promoted tweets
      const statusLinks = Array.from(tweet.querySelectorAll('a[href*="/status/"]'));
      const permalink = statusLinks.find(a => /\/status\/\d+$/.test(new URL(a.href).pathname));
      if (permalink?.href) {
        return { url: permalink.href, type: 'twitter' };
      }
    }

    // 3. Instagram: Right-clicking a post, reel, or modal
    const igArticle = target.closest('article, div[role="presentation"], div[role="dialog"]');
    if (igArticle) {
      const igLink = igArticle.querySelector('a[href*="/p/"], a[href*="/reel/"]');
      if (igLink?.href) {
        return { url: igLink.href, type: 'instagram' };
      }
    }

    // 4. Standard Links: Right-clicking a normal hyperlink
    const anchor = target.closest('a');
    if (anchor?.href && !anchor.href.startsWith('javascript:')) {
      return { url: anchor.href };
    }

    // 5. Direct Media Elements
    if (target.tagName === 'VIDEO' && target.src) return { url: target.src, type: 'video' };
    if (target.tagName === 'IMG' && target.src) return { url: target.src, type: 'image' };

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