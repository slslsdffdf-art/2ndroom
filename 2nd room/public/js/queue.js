const enterBtn = document.getElementById('enter-btn');
const queueInfo = document.getElementById('queue-info');
const posEl = document.getElementById('queue-pos');
const etaEl = document.getElementById('queue-eta');

async function pollQueue() {
  try {
    const res = await fetch('/api/queue', { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    if (data.allowed) {
      location.href = '/play/';
      return;
    }
    queueInfo.classList.remove('hidden');
    posEl.textContent = data.position ?? '-';
    etaEl.textContent = data.eta ?? '-';
  } catch (e) {}
}

if (enterBtn) {
  enterBtn.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/queue', { method: 'POST' });
      if (res.ok) {
        queueInfo.classList.remove('hidden');
        pollQueue();
      }
    } catch (e) {}
  });

  setInterval(pollQueue, 5000);
}
