// Track the exact right-clicked DOM node
document.addEventListener('contextmenu', (e) => {
  window.__lastRightClickedElement = e.target;
}, true);