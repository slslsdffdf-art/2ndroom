import { requestAccess, joinQueue, pollQueue } from './api.js';

const accessInput = document.getElementById('access-input');
const accessBtn   = document.getElementById('access-btn');
const accessMsg   = document.getElementById('access-msg');
const enterBtn    = document.getElementById('enter-btn');
const statusEl    = document.getElementById('queue-status');

let hasAccess = false;
let pollTimer = null;

accessBtn.onclick = async () => {
  const code = accessInput.value.trim();
  if (!code) return;
  const r = await requestAccess(code);
  if (r.ok) {
    hasAccess = true;
    accessMsg.textContent = '접속 허가됨.';
    enterBtn.disabled = false;
  } else {
    hasAccess = false;
    accessMsg.textContent = '비밀번호가 틀렸습니다.';
    enterBtn.disabled = true;
  }
};

enterBtn.onclick = async () => {
  if (!hasAccess) {
    statusEl.textContent = '비밀번호 먼저.';
    return;
  }
  const r = await joinQueue();
  if (r.allowed) {
    location.href = '/play/';
    return;
  }
  if (r.queued) {
    statusEl.textContent = `대기열 등록. 현재 ${r.position}번째.`;
    pollTimer = setInterval(async () => {
      const s = await pollQueue();
      if (s.allowed) {
        clearInterval(pollTimer);
        location.href = '/play/';
      } else {
        statusEl.textContent = `앞에 ${s.position}명 / 예상 ${s.eta}`;
      }
    }, 4000);
  } else if (r.reason === 'no-access') {
    statusEl.textContent = '비밀번호 다시 입력.';
    enterBtn.disabled = false;
  }
};
