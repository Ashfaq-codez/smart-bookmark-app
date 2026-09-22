document.addEventListener('DOMContentLoaded', async () => {
  const urlEl = document.getElementById('tab-url');
  const noteInput = document.getElementById('note-input');
  const btn = document.getElementById('save-btn');
  const status = document.getElementById('status');

  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (activeTab?.url) {
    urlEl.textContent = activeTab.url;
  }

  btn.addEventListener('click', async () => {
    btn.disabled = true;
    btn.textContent = 'Saving...';
    status.style.display = 'none';

    const personalNote = noteInput.value.trim();
    const payload = {
      url: activeTab.url,
      ...(personalNote && { content: personalNote })
    };

    try {
      const API_URL = 'https://smart-bookmark-app-lime.vercel.app/api/save';

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', 
        body: JSON.stringify(payload),
      });
      
      const data = await res.json().catch(() => ({}));

      if (res.status === 409) {
        status.style.display = 'block';
        status.style.backgroundColor = '#FEF3C7';
        status.style.color = '#92400E';
        status.textContent = 'Already inntoit';
        setTimeout(() => window.close(), 1400);
      } else if (res.ok) {
        status.style.display = 'block';
        status.style.backgroundColor = '#E8EFE5';
        status.style.color = '#4D6A51';
        status.textContent = 'Added inntoit';
        setTimeout(() => window.close(), 1000);
      } else {
        throw new Error(data.error || 'Failed to save');
      }
    } catch (err) {
      status.style.display = 'block';
      status.style.backgroundColor = '#FEE2E2';
      status.style.color = '#991B1B';
      status.textContent = err.message || 'Error saving';
      btn.disabled = false;
      btn.textContent = 'Retry';
    }
  });
});