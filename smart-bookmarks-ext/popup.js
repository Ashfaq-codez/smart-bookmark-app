document.getElementById('save-btn').addEventListener('click', async () => {
  const statusEl = document.getElementById('status');
  const btnEl = document.getElementById('save-btn');
  
  // Update UI to show saving state
  btnEl.style.display = 'none';
  statusEl.style.display = 'block';

  // Ask Chrome for the active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  try {
    // Fire the URL to your Next.js backend (update to your production URL later)
    const response = await fetch('http://localhost:3000/api/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: tab.url })
    });

    if (response.ok) {
      statusEl.innerText = "Saved!";
      statusEl.style.color = "#16a34a";
    } else {
      throw new Error('Failed to save');
    }
  } catch (error) {
    statusEl.innerText = "Error saving";
    statusEl.style.color = "#dc2626";
  }

  // Close the popup after a brief delay
  setTimeout(() => window.close(), 1500);
});