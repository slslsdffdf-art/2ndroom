import { showRoomStoryOverlay } from '/public/js/story-overlay.js';
import { openWillModal } from '/public/js/will-modal.js';
import { openEventModal } from '/public/js/event-modal.js';
import { giveItem } from '/public/js/inventory.js';

let ROOMS = {};
let DEATHS = {};
let CURRENT_ROOM = null;

window.__roomAfterStory = (roomId, action) => {
  if (action === 'showChoices') {
    renderChoices(roomId);
  } else if (action === 'goDeath') {
    triggerDeath(roomId, `death_${roomId}`);
  } else if (action === 'forward') {
    goForward(roomId);
  } else {
    renderChoices(roomId);
  }
};

async function init() {
  const res = await fetch('/public/data/rooms.json', { cache: 'no-store' });
  const data = await res.json();
  ROOMS = data.rooms || {};
  DEATHS = data.deaths || {};
  const start = data.start || 'room_001';
  loadLastWords();
  enterRoom(start);
}

function loadLastWords() {
  fetch('/api/lastwords', { cache: 'no-store' })
    .then(r => r.ok ? r.json() : null)
    .then(data => {
      const el = document.getElementById('lastwords');
      if (!el) return;
      el.textContent = (data && data.text) ? data.text : '비명조차 지르지 못한 채 즉사.';
    });
}

function enterRoom(roomId) {
  const room = ROOMS[roomId];
  if (!room) return;
  CURRENT_ROOM = roomId;
  setBg(room.bg);
  setLabel(room.label);
  if (window.playBGMForRoom) window.playBGMForRoom(room.audio);

  // 이벤트 방이면 먼저 이벤트
  if (room.event) {
    openEventModal(room.event, act => {
      if (act.type === 'item') {
        giveItem({ name: act.itemName || '이름 없는 것' });
      } else if (act.type === 'life') {
        // 목숨증가 처리 자리
      }
      showRoomStoryOverlay(roomId, 'showChoices');
    });
  } else {
    showRoomStoryOverlay(roomId, 'showChoices');
  }
}

function setBg(src) {
  const el = document.getElementById('room-bg');
  if (el) el.style.backgroundImage = `url(${src})`;
}
function setLabel(txt) {
  const el = document.getElementById('room-label');
  if (el) el.textContent = txt;
}

function renderChoices(roomId) {
  const room = ROOMS[roomId];
  const wrap = document.getElementById('choices');
  wrap.innerHTML = '';
  room.choices.forEach(ch => {
    const btn = document.createElement('button');
    btn.textContent = ch.label;
    btn.onclick = () => handleChoice(roomId, ch);
    wrap.appendChild(btn);
  });
}

function handleChoice(roomId, choice) {
  const to = choice.to;
  if (to.startsWith('room_')) {
    enterRoom(to);
  } else if (to.startsWith('death_')) {
    triggerDeath(roomId, to);
  } else if (to === 'exit') {
    location.href = '/play/wall.html';
  }
}

function goForward(roomId) {
  const room = ROOMS[roomId];
  const fw = room.choices.find(c => c.id === 'forward');
  if (fw) handleChoice(roomId, fw);
}

function triggerDeath(roomId, deathId) {
  if (window.playSfx) window.playSfx('death');

  const room = ROOMS[roomId];
  const deathData = DEATHS[deathId] || {
    title: '정의되지 않은 죽음',
    cause: deathId,
    cardImage: room?.bg || null
  };

  openWillModal({
    roomId,
    roomLabel: room?.label || roomId,
    bg: room?.bg || null,
    deathId,
    deathTitle: deathData.title,
    cause: deathData.cause,
    cardImage: deathData.cardImage,
    cardOverlay: deathData.cardOverlay,
    defaultWill: deathData.defaultWill
  });

  // 서버에 사망 로그
  fetch('/api/death', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      room: roomId,
      death: deathId,
      cause: deathData.cause
    })
  });
}

document.addEventListener('DOMContentLoaded', init);
