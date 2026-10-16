// A screenshot of the visible part of the tab, for pages that have no preview picture of their own.
// Taken in your browser (nothing is sent anywhere else), made small (at most 1280 px wide, JPEG) and
// sent with the save. The server checks it and keeps it only when the page really has no picture.
// Used by background.js (importScripts) and popup.html.
(function () {
  const MAX_WIDTH = 1280;
  const MAX_CHARS = 1_500_000;   // the server refuses anything larger

  async function toDataUrl(blob) {
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return `data:${blob.type};base64,${btoa(bin)}`;
  }

  // null when Chrome won't allow it (chrome:// pages, no permission) or anything goes wrong.
  async function captureTab(windowId) {
    try {
      return await shrink(await chrome.tabs.captureVisibleTab(windowId, { format: 'jpeg', quality: 85 }));
    } catch (e) {
      return null;
    }
  }

  // A full-size capture made small enough to send.
  async function shrink(raw) {
    try {
      const bitmap = await createImageBitmap(await (await fetch(raw)).blob());
      const scale = Math.min(1, MAX_WIDTH / bitmap.width);
      const w = Math.round(bitmap.width * scale);
      const h = Math.round(Math.min(bitmap.height * scale, w * 0.75));   // the top of the page, at most 4:3
      const canvas = new OffscreenCanvas(w, h);
      canvas.getContext('2d').drawImage(bitmap, 0, 0, bitmap.width * scale, bitmap.height * scale);
      bitmap.close();
      for (const quality of [0.72, 0.5]) {
        const out = await toDataUrl(await canvas.convertToBlob({ type: 'image/jpeg', quality }));
        if (out.length <= MAX_CHARS) return out;
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  // The page details already name a picture: no screenshot needed.
  const needsShot = (page) => !page || !page.image;

  globalThis.inntoitShot = { captureTab, shrink, needsShot };
})();
