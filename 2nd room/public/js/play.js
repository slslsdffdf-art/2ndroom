import {
  startHeartbeat,
  fetchRoomData,
  fetchRoomStory,
  postDeath,
  postLastWords
} from './api.js';
import { showStoryOverlay } from './overlay.js';
import { renderShareCard } from './sharecard.js';

let ROOMS = null;
let currentRoomId = null;

const bgEl = document.getElementById('room-bg');
const choicePanel = document.getElementById('choice-panel');
const choiceBtns = choicePanel.querySelectorAll('button');

const deathModal = document.getElementById('death-modal');
const deathCauseEl = document.getElementById('death-cause');
const willInput = document.getElementById('will-input');
const willSubmit = document.getElementById('will-submit');

async function init() {
  startHeartbeat();
  ROOMS = await fetchRoomData();
  currentRoomId = ROOMS.start;
  await enterRoom(currentRoomId);
}

async function enterRoom(roomId) {
  currentRoomId = roomId;
  const room = ROOMS.rooms[roomId];

  // 배경
  if (room.bg) {
    bgEl.style.backgroundImage = `url(${room.bg})`;
  }

  // 스토리 로드
  const story = await fetchRoomStory(roomId);
  await new Promise(resolve => {
    showStoryOverlay(story, (action) => {
      if (action === 'showChoices') {
        showChoices(room);
      } else if (action === 'goDeath') {
        handleDeath('story-kill');
      } else {
        showChoices(room);
      }
      resolve();
    });
  });
}

function showChoices(room) {
  const choices = room.choices || [];
  choicePanel.classList.remove('choice-hidden');

  for (let i = 0; i < 3; i++) {
    const btn = choiceBtns[i];
    const c = choices[i];
    if (c) {
      btn.style.display = 'inline-flex';
      btn.textContent = c.label;
      btn.onclick = () => handleChoice(c);
    } else {
      btn.style.display = 'none';
      btn.onclick = null;
    }
  }
}

async function handleChoice(choice) {
  const to = choice.to;
  if (to.startsWith('death_')) {
    await handleDeath(to);
  } else if (to.startsWith('room_')) {
    await enterRoom(to);
  } else {
    // 기타 forward/end
    await handleDeath('death_unknown');
  }
}

async function handleDeath(deathCode) {
  choicePanel.classList.add('choice-hidden');
  const room = ROOMS.rooms[currentRoomId];
  const causeText = mapDeathCodeToText(deathCode);

  // 서버에 사망 기록
  await postDeath({
    room: currentRoomId,
    death: deathCode,
    cause: causeText
  });

  // 유언 모달 열기
  deathCauseEl.textContent = causeText;
  deathModal.classList.remove('hidden');

  willSubmit.onclick = async () => {
    const text = willInput.value.trim();
    await postLastWords({
      text: text || '비명조차 지르지 못한 채 즉사.',
      cause: causeText,
      room: currentRoomId,
      death: deathCode
    });

    // 공유카드 생성
    const dataUrl = await renderShareCard({
      bgSrc: room.bg,
      roomLabel: room.label,
      cause: causeText,
      will: text,
      time: new Date().toLocaleString()
    });
    // 보여주기만 (다운로드는 네가 버튼 추가해서)
    console.log('share card created', dataUrl);

    // 벽으로 보내기
    setTimeout(() => {
      location.href = '/play/wall.html';
    }, 500);
  };
}

function mapDeathCodeToText(code) {
  switch (code) {
    case 'death_back': return '뒤로 물러서다 복도에서 사라짐';
    case 'death_noise': return '소리를 덮으려다 무언가에게 들킴';
    case 'death_steam': return '보일러 증기에 의해 화상';
    case 'death_unknown': return '원인 불명 사망';
    default:
      if (code.startsWith('death_')) {
        return code.replace('death_', '').replace(/_/g, ' ');
      }
      return '사망';
  }
}

init();
