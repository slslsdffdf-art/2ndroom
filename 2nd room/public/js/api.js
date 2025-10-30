// 모든 서버 API는 여기로 모은다

export async function requestAccess(password) {
  const res = await fetch('/api/access', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ password })
  });
  return res.json();
}

export async function joinQueue() {
  const res = await fetch('/api/queue', {
    method: 'POST',
    headers: { 'content-type': 'application/json' }
  });
  return res.json();
}

export async function pollQueue() {
  const res = await fetch('/api/queue', { cache: 'no-store' });
  return res.json();
}

export function startHeartbeat() {
  setInterval(() => {
    fetch('/api/heartbeat', { cache: 'no-store' }).catch(()=>{});
  }, 10000);
}

export async function getLastWords() {
  const res = await fetch('/api/lastwords', { cache: 'no-store' });
  return res.json();
}

export async function postLastWords(payload) {
  const res = await fetch('/api/lastwords', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function postDeath(payload) {
  const res = await fetch('/api/death', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function getDeaths() {
  const res = await fetch('/api/deaths', { cache: 'no-store' });
  return res.json();
}

export async function adminLogin(password) {
  const res = await fetch('/api/admin-login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ password })
  });
  return res.json();
}

// (옵션) 원격 rooms/story
export async function fetchRoomData() {
  const res = await fetch('/data/rooms.json', { cache: 'no-store' });
  return res.json();
}
export async function fetchRoomStory(roomId) {
  // 먼저 정적
  const res = await fetch(`/data/stories/${roomId}.json`, { cache: 'no-store' });
  if (res.ok) return res.json();
  return { title: '', subtitle: '', body: [], nextAction: 'showChoices' };
}
