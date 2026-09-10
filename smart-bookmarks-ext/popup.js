document.addEventListener('DOMContentLoaded', async () => {
  const urlEl = document.getElementById('tab-url');
  const btn = document.getElementById('save-btn');
  const status = document.getElementById('status');

  // Grab active tab URL
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (activeTab?.url) {
    urlEl.textContent = activeTab.url;
  }

  btn.addEventListener('click', async () => {
    btn.disabled = true;
    btn.textContent = 'Saving...';
    status.style.display = 'none';

    try {
      // 🟢 CHANGE THIS TO YOUR LIVE VERCEL URL
      const API_URL = 'https://smart-bookmark-app-lime.vercel.app/api/save';
      
      // If you want to test locally again later, swap it back to:
      // const API_URL = 'http://localhost:3000/api/save';

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', 
        body: JSON.stringify({ url: activeTab.url }),
      });
      const data = await res.json();

      if (res.ok) {
        status.style.display = 'block';
        status.style.backgroundColor = '#bbf7d0'; // green-200
        status.style.color = '#15803d';
        status.textContent = 'Saved to Inbox!';
        setTimeout(() => window.close(), 1200);
      } else {
        throw new Error(data.error || 'Failed to save');
      }
    } catch (err) {
      status.style.display = 'block';
      status.style.backgroundColor = '#fecaca'; // red-200
      status.style.color = '#b91c1c';
      status.textContent = err.message || 'Error saving tab';
      btn.disabled = false;
      btn.textContent = 'Retry Save';
    }
  });
});