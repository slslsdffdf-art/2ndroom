// public/js/play.js
// 이 파일은 다음 파일들의 기능을 흡수한 버전임:
// - overlay.js / stroy-overlay.js (방 스토리 오버레이 + 타이핑)
// - audio.js (방별 BGM)
// - room-engine.js (방 로딩 + 선택지 처리)
// - event-modal.js (특수 이벤트 창)
// - will-modal.js (유언 입력)
// - sharecard.js (공유 카드 캔버스)
// 위 6~7개 파일은 삭제해도 됨.
// 단, api.js / queue.js 는 그대로 두는 걸 전제로 함.

// -----------------------------------------------------
// 0. 전역 상태 (이 파일 안에서만 씀)
// -----------------------------------------------------
const PLAY = {
  rooms: null,           // /data/rooms.json 내용
  currentRoomId: null,   // 현재 방
  seenStories: new Set(),// 스토리 한 번만
  inventory: [],         // 이벤트로 얻는 아이템
  lastDeath: null,       // {roomId, cause, will, ts}
  deviceId: getOrCreateDeviceId()
};

// -----------------------------------------------------
// 1. 유틸
// -----------------------------------------------------
function $(sel) { return document.querySelector(sel); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function getOrCreateDeviceId() {
  const KEY = 'sr_device_id';
  let v = localStorage.getItem(KEY);
  if (!v) {
    v = 'dev-' + Math.random().toString(36).slice(2);
    localStorage.setItem(KEY, v);
  }
  return v;
}

// -----------------------------------------------------
// 2. 시작 시 rooms.json 가져오기
// 이 파일은 "이미 /play 에 들어왔다"는 전제로 동작한다고 보면 됨.
// queue.js 가 너를 /play 로 들여보내면, 그때 이게 실행된다는 느낌.
// -----------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('/data/rooms.json', { cache: 'no-store' });
    const data = await res.json();
    PLAY.rooms = data;
    const startId = data.start || Object.keys(data.rooms)[0];
    await enterRoom(startId);
  } catch (err) {
    console.error('rooms.json load fail', err);
  }
});

// -----------------------------------------------------
// 3. 방 진입
// -----------------------------------------------------
async function enterRoom(roomId) {
  const room = PLAY.rooms.rooms[roomId];
  if (!room) {
    console.warn('room not found:', roomId);
    return;
  }
  PLAY.currentRoomId = roomId;

  // 배경, 오디오
  applyRoomBackground(room);
  playRoomBGM(room);

  // 스토리 먼저
  const shown = await showRoomStory(roomId, room);
  if (!shown) {
    // 스토리 없으면 곧바로 선택지
    showChoices(room);
  }
}

// -----------------------------------------------------
// 4. 배경 + BGM  (audio.js 옮김)
// -----------------------------------------------------
function applyRoomBackground(room) {
  const bg = room.bg || room.background;
  if (bg) {
    document.body.style.backgroundImage = `url('${bg}')`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
  } else {
    document.body.style.background = '#000';
  }
}

function playRoomBGM(room) {
  // room.audio 에 들어있는 이름을 실제 파일로 맵핑
  const MAP = {
    'BGM_01': '/audio/bgm_01.mp3',
    'BGM_02': '/audio/bgm_02.mp3',
    'BGM_03': '/audio/bgm_03.mp3',
  };
  const id = room.audio;
  if (!id) return;
  const src = MAP[id];
  if (!src) return;

  let bgm = $('#room-bgm');
  if (!bgm) {
    bgm = document.createElement('audio');
    bgm.id = 'room-bgm';
    bgm.loop = true;
    bgm.volume = 0.7;
    document.body.appendChild(bgm);
  }
  if (bgm.src !== location.origin + src) {
    bgm.src = src;
  }
  bgm.play().catch(()=>{});
}

// -----------------------------------------------------
// 5. 스토리 오버레이 (overlay.js / stroy-overlay.js 옮김)
// -----------------------------------------------------
async function showRoomStory(roomId, room) {
  const story = room.story;
  if (!story) return false;
  if (PLAY.seenStories.has(roomId)) return false; // 한 번만
  PLAY.seenStories.add(roomId);

  // DOM 없으면 만들기
  let overlay = $('#story-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'story-overlay';
    overlay.innerHTML = `
      <div class="story-panel">
        <button id="story-close" class="story-close">×</button>
        <h2 id="story-title"></h2>
        <p id="story-subtitle"></p>
        <div id="story-body"></div>
        <div id="story-actions">
          <button id="story-skip" style="display:none;">SKIP</button>
          <button id="story-continue">계속하기</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    injectStoryStyles();
  }

  $('#story-title').textContent = story.title || room.label || roomId;
  $('#story-subtitle').textContent = story.subtitle || '';
  const bodyEl = $('#story-body');
  bodyEl.innerHTML = '';

  const skipFlag = { value: false };
  const skipBtn = $('#story-skip');
  skipBtn.style.display = 'inline-flex';
  skipBtn.onclick = () => { skipFlag.value = true; };

  overlay.classList.add('show');

  // 본문 타이핑
  if (Array.isArray(story.body)) {
    for (let i=0; i<story.body.length; i++) {
      const p = document.createElement('p');
      bodyEl.appendChild(p);
      await typeText(p, story.body[i], skipFlag);
      if (skipFlag.value) {
        // 남은 문단은 그냥 다 찍기
        for (let j=i+1; j<story.body.length; j++) {
          const p2 = document.createElement('p');
          p2.textContent = story.body[j];
          bodyEl.appendChild(p2);
        }
        break;
      }
    }
  } else if (typeof story.body === 'string') {
    const p = document.createElement('p');
    bodyEl.appendChild(p);
    await typeText(p, story.body, skipFlag);
  }

  return new Promise(resolve => {
    const close = () => {
      overlay.classList.remove('show');
      // 스토리 끝 → 선택지
      showChoices(room);
      resolve(true);
    };
    $('#story-continue').onclick = close;
    $('#story-close').onclick = close;

    if (story.autoClose) {
      setTimeout(close, story.autoCloseDelay || 4000);
    }
  });
}

async function typeText(el, text, skipFlag) {
  el.textContent = '';
  for (let i=0; i<text.length; i++) {
    if (skipFlag.value) {
      el.textContent = text;
      return;
    }
    el.textContent += text[i];
    if (i === 0) continue;
    await sleep(25 + Math.floor(Math.random()*10));
  }
}

function injectStoryStyles() {
  if ($('#story-style')) return;
  const st = document.createElement('style');
  st.id = 'story-style';
  st.textContent = `
  #story-overlay {
    position:fixed; inset:0;
    display:flex; justify-content:center; align-items:center;
    background:rgba(0,0,0,0.7);
    opacity:0; pointer-events:none;
    transition:opacity .2s; z-index:9999;
  }
  #story-overlay.show { opacity:1; pointer-events:auto; }
  .story-panel {
    width:min(560px,90vw);
    background:rgba(8,8,8,0.9);
    border:1px solid rgba(255,255,255,0.05);
    border-radius:12px;
    padding:18px 20px 16px;
    color:#fff;
    position:relative;
  }
  .story-close {
    position:absolute; right:14px; top:8px;
    background:transparent; border:none; color:#fff;
    font-size:1.1rem; cursor:pointer;
  }
  #story-body p { margin-bottom:8px; line-height:1.4; }
  #story-actions { text-align:right; margin-top:12px; }
  #story-actions button {
    background:#f33; border:none; color:#fff;
    padding:6px 12px; border-radius:6px; cursor:pointer;
    margin-left:6px;
  }
  `;
  document.head.appendChild(st);
}

// -----------------------------------------------------
// 6. 선택지 (room-engine.js 옮김) – 3개 고정
// -----------------------------------------------------
function showChoices(room) {
  let box = $('#choice-box');
  if (!box) {
    box = document.createElement('div');
    box.id = 'choice-box';
    document.body.appendChild(box);
    injectChoiceStyles();
  }
  box.innerHTML = '';

  const choices = room.choices || [];
  for (let i=0; i<3; i++) {
    const c = choices[i];
    const btn = document.createElement('button');
    if (c) {
      btn.textContent = c.label || `선택 ${i+1}`;
      btn.onclick = () => handleChoice(room, c);
    } else {
      btn.style.visibility = 'hidden';
      btn.textContent = '-';
    }
    box.appendChild(btn);
  }
}

function injectChoiceStyles() {
  if ($('#choice-style')) return;
  const st = document.createElement('style');
  st.id = 'choice-style';
  st.textContent = `
  #choice-box {
    position:fixed;
    left:50%; bottom:25px;
    transform:translateX(-50%);
    display:flex; gap:10px;
    z-index:100;
  }
  #choice-box button {
    background:rgba(0,0,0,0.5);
    border:1px solid rgba(255,255,255,0.25);
    border-radius:8px;
    color:#fff;
    min-width:150px;
    padding:8px 12px;
    cursor:pointer;
  }
  #choice-box button:hover {
    background:rgba(255,50,50,0.35);
  }
  `;
  document.head.appendChild(st);
}

function handleChoice(room, choice) {
  const to = choice.to;
  if (!to) return;

  // 이벤트
  if (to.startsWith('event_')) {
    openEventModal(to, room, choice);
    return;
  }

  // 사망
  if (to.startsWith('death_')) {
    triggerDeath(to, room, choice);
    return;
  }

  // 일반 방 이동
  enterRoom(to);
}

// -----------------------------------------------------
// 7. 이벤트 모달 (event-modal.js 옮김)
// -----------------------------------------------------
function openEventModal(eventId, room, choice) {
  let m = $('#event-modal');
  if (!m) {
    m = document.createElement('div');
    m.id = 'event-modal';
    m.innerHTML = `
      <div class="event-panel">
        <h3 id="event-title">이벤트</h3>
        <p id="event-body"></p>
        <div class="row">
          <button id="event-ok">확인</button>
        </div>
      </div>
    `;
    document.body.appendChild(m);
    injectEventStyles();
  }

  const titleEl = $('#event-title');
  const bodyEl = $('#event-body');

  if (eventId === 'event_extra_life') {
    titleEl.textContent = '기묘한 부적';
    bodyEl.textContent = '다음 한 번의 죽음을 무시합니다.';
    PLAY.inventory.push({ id: 'extra_life', name: '부적(1회)' });
  } else {
    titleEl.textContent = '알 수 없는 기운';
    bodyEl.textContent = '이 방에는 설명되지 않는 무언가가 머문다.';
  }

  m.classList.add('show');
  $('#event-ok').onclick = () => {
    m.classList.remove('show');
    showChoices(room);
  };
}

function injectEventStyles() {
  if ($('#event-style')) return;
  const st = document.createElement('style');
  st.id = 'event-style';
  st.textContent = `
  #event-modal {
    position:fixed; inset:0; background:rgba(0,0,0,0.7);
    display:flex; justify-content:center; align-items:center;
    opacity:0; pointer-events:none; transition:opacity .2s;
    z-index:9500;
  }
  #event-modal.show { opacity:1; pointer-events:auto; }
  .event-panel {
    background:#141414; color:#fff;
    padding:16px; border-radius:10px;
    width:min(400px, 90vw);
  }
  .event-panel .row { margin-top:10px; text-align:right; }
  .event-panel button {
    background:#f33; border:none; color:#fff;
    padding:5px 10px; border-radius:6px; cursor:pointer;
  }
  `;
  document.head.appendChild(st);
}

// -----------------------------------------------------
// 8. 사망 처리 (will-modal.js + sharecard.js 옮김)
// -----------------------------------------------------
function triggerDeath(code, room, choice) {
  // 1) 부적 있는지 확인
  const idx = PLAY.inventory.findIndex(it => it.id === 'extra_life');
  if (idx !== -1) {
    PLAY.inventory.splice(idx, 1);
    alert('부적이 작동해서 이번 죽음은 무시되었습니다.');
    showChoices(room);
    return;
  }

  // 2) 사망원인
  const cause = mapDeathCodeToText(code, room, choice);
  PLAY.lastDeath = {
    roomId: PLAY.currentRoomId,
    cause,
    ts: Date.now()
  };

  // 3) 모달
  showDeathModal(cause);

  // 4) 서버로도 남길 수 있음 (api.js 있으면)
  if (window.API && typeof window.API.post === 'function') {
    window.API.post('/death', {
      deviceId: PLAY.deviceId,
      roomId: PLAY.currentRoomId,
      cause,
      ts: PLAY.lastDeath.ts
    }).catch(()=>{});
  }
}

function mapDeathCodeToText(code, room, choice) {
  // rooms.json 에 deathCauses 있으면 그거 우선
  if (room.deathCauses && room.deathCauses[code]) {
    return room.deathCauses[code];
  }
  // 기본
  const table = {
    'death_back': '복도로 나가다 등 뒤에서 목이 꺾였다.',
    'death_noise': '세탁기 소리를 무시했고, 그 소리도 너를 무시하지 않았다.',
    'death_steam': '끓어오른 증기에 뼈까지 데었다.'
  };
  if (table[code]) return table[code];
  return `이 방에서 잘못된 선택을 했다. (${code})`;
}

function showDeathModal(cause) {
  let m = $('#death-modal');
  if (!m) {
    m = document.createElement('div');
    m.id = 'death-modal';
    m.innerHTML = `
      <div class="death-panel">
        <h2>사망</h2>
        <p id="death-cause"></p>
        <div class="row">
          <button id="death-will">유언 남기기</button>
          <button id="death-share">공유 카드</button>
          <button id="death-exit">나가기</button>
        </div>
      </div>
    `;
    document.body.appendChild(m);
    injectDeathStyles();
  }
  $('#death-cause').textContent = cause;
  m.classList.add('show');

  $('#death-will').onclick = () => {
    m.classList.remove('show');
    openWillModal();
  };
  $('#death-share').onclick = () => {
    m.classList.remove('show');
    openShareCardModal();
  };
  $('#death-exit').onclick = () => {
    m.classList.remove('show');
    // 죽으면 벽으로 보내는 구조면 여기서
    location.href = '/play/wall';
  };
}

function injectDeathStyles() {
  if ($('#death-style')) return;
  const st = document.createElement('style');
  st.id = 'death-style';
  st.textContent = `
  #death-modal {
    position:fixed; inset:0; background:rgba(0,0,0,0.7);
    display:flex; justify-content:center; align-items:center;
    opacity:0; pointer-events:none; transition:opacity .2s;
    z-index:9300;
  }
  #death-modal.show { opacity:1; pointer-events:auto; }
  .death-panel {
    background:#111; padding:16px; border-radius:10px;
    color:#fff; width:min(420px,90vw);
    text-align:center;
    border:1px solid rgba(255,0,0,0.4);
  }
  .death-panel .row { margin-top:10px; }
  .death-panel button {
    background:#f33; border:none; color:#fff;
    padding:5px 10px; border-radius:6px; cursor:pointer;
    margin:0 4px;
  }
  `;
  document.head.appendChild(st);
}

// -----------------------------------------------------
// 9. 유언 모달 (will-modal.js 옮김)
// -----------------------------------------------------
function openWillModal() {
  let m = $('#will-modal');
  if (!m) {
    m = document.createElement('div');
    m.id = 'will-modal';
    m.innerHTML = `
      <div class="will-panel">
        <h3>유언 작성</h3>
        <textarea id="will-text" rows="4" maxlength="200" placeholder="남길 말이 없으면 비워두세요."></textarea>
        <div class="row">
          <button id="will-save">저장</button>
          <button id="will-cancel">취소</button>
        </div>
      </div>
    `;
    document.body.appendChild(m);
    injectWillStyles();
  }
  m.classList.add('show');

  $('#will-save').onclick = async () => {
    const txt = $('#will-text').value.trim() || '비명조차 지르지 못한 채 즉사.';
    PLAY.lastDeath.will = txt;
    m.classList.remove('show');

    // 서버로도 보내기
    if (window.API && typeof window.API.post === 'function') {
      window.API.post('/lastwords', {
        deviceId: PLAY.deviceId,
        roomId: PLAY.lastDeath.roomId,
        will: txt,
        cause: PLAY.lastDeath.cause,
        ts: PLAY.lastDeath.ts
      }).catch(()=>{});
    }

    // 저장 후 공유 카드 바로
    openShareCardModal();
  };

  $('#will-cancel').onclick = () => {
    m.classList.remove('show');
  };
}

function injectWillStyles() {
  if ($('#will-style')) return;
  const st = document.createElement('style');
  st.id = 'will-style';
  st.textContent = `
  #will-modal {
    position:fixed; inset:0; background:rgba(0,0,0,0.6);
    display:flex; justify-content:center; align-items:center;
    opacity:0; pointer-events:none; transition:opacity .2s;
    z-index:9400;
  }
  #will-modal.show { opacity:1; pointer-events:auto; }
  .will-panel {
    background:#151515; padding:14px 16px 12px;
    border-radius:10px; color:#fff;
    width:min(420px,90vw);
  }
  .will-panel textarea {
    width:100%; background:rgba(0,0,0,0.3);
    border:1px solid rgba(255,255,255,0.08);
    border-radius:6px; color:#fff; padding:6px;
  }
  .will-panel .row { margin-top:10px; text-align:right; }
  .will-panel button {
    background:#f33; border:none; color:#fff;
    padding:5px 10px; border-radius:6px; cursor:pointer;
    margin-left:6px;
  }
  `;
  document.head.appendChild(st);
}

// -----------------------------------------------------
// 10. 공유 카드 (sharecard.js 옮김)
// -----------------------------------------------------
function openShareCardModal() {
  let m = $('#share-modal');
  if (!m) {
    m = document.createElement('div');
    m.id = 'share-modal';
    m.innerHTML = `
      <div class="share-panel">
        <h3>공유 카드</h3>
        <canvas id="share-canvas" width="720" height="400"></canvas>
        <div class="row">
          <a id="share-download" download="lastword.png">다운로드</a>
          <button id="share-close">닫기</button>
        </div>
      </div>
    `;
    document.body.appendChild(m);
    injectShareStyles();
  }
  m.classList.add('show');

  renderShareCard();

  $('#share-close').onclick = () => m.classList.remove('show');
  const link = $('#share-download');
  const canvas = $('#share-canvas');
  link.onclick = () => {
    link.href = canvas.toDataURL('image/png');
  };
}

function injectShareStyles() {
  if ($('#share-style')) return;
  const st = document.createElement('style');
  st.id = 'share-style';
  st.textContent = `
  #share-modal {
    position:fixed; inset:0; background:rgba(0,0,0,0.75);
    display:flex; justify-content:center; align-items:center;
    opacity:0; pointer-events:none; transition:opacity .2s;
    z-index:9450;
  }
  #share-modal.show { opacity:1; pointer-events:auto; }
  .share-panel {
    background:#111; padding:14px 16px 12px;
    border-radius:10px; color:#fff;
  }
  .share-panel .row {
    margin-top:10px;
    display:flex; justify-content:center; gap:12px;
  }
  .share-panel a, .share-panel button {
    background:#f33; border:none; color:#fff;
    text-decoration:none; padding:5px 10px;
    border-radius:6px; cursor:pointer;
  }
  `;
  document.head.appendChild(st);
}

function renderShareCard() {
  const c = $('#share-canvas');
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#0b0b0b';
  ctx.fillRect(0,0,c.width,c.height);

  ctx.strokeStyle = '#ff4444';
  ctx.lineWidth = 4;
  ctx.strokeRect(8,8,c.width-16,c.height-16);

  const death = PLAY.lastDeath || {};
  const room = death.roomId || PLAY.currentRoomId || 'unknown';
  const cause = death.cause || '원인 불명';
  const will = death.will || '비명조차 지르지 못한 채 즉사.';
  const ts = death.ts ? new Date(death.ts).toLocaleString() : '';

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText('2nd_room – Death Log', 24, 44);

  ctx.font = '16px sans-serif';
  ctx.fillStyle = '#ccc';
  ctx.fillText(`Room: ${room}`, 24, 72);
  ctx.fillText(`Device: ${PLAY.deviceId}`, 24, 96);

  ctx.fillStyle = '#fff';
  ctx.font = '18px sans-serif';
  ctx.fillText('Cause:', 24, 132);
  wrapText(ctx, cause, 24, 158, 660, 22, '#ffd9d9');

  ctx.fillStyle = '#fff';
  ctx.font = '18px sans-serif';
  ctx.fillText('Last Words:', 24, 232);
  wrapText(ctx, will, 24, 258, 660, 22, '#ffffff');

  ctx.fillStyle = '#777';
  ctx.font = '14px sans-serif';
  ctx.fillText(ts, 24, c.height - 22);
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, color='#fff') {
  ctx.fillStyle = color;
  const words = text.split(' ');
  let line = '';
  for (let i=0; i<words.length; i++) {
    const testLine = line + words[i] + ' ';
    const w = ctx.measureText(testLine).width;
    if (w > maxWidth && i > 0) {
      ctx.fillText(line, x, y);
      line = words[i] + ' ';
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
}
