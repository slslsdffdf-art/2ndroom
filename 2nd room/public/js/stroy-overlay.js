// 타이핑 소리 세팅
window.typingAudios = [
  new Audio('/public/assets/sfx/ui_type_1.mp3'),
  new Audio('/public/assets/sfx/ui_type_2.mp3'),
  new Audio('/public/assets/sfx/ui_type_3.mp3')
];
window.typingAudios.forEach(a => a.volume = 0.35);

const seenRooms = new Set();

async function typeTextInto(el, text, opts = {}) {
  const { baseDelay = 28, randomDelay = 12, soundEvery = 2, skipFlagRef = null } = opts;
  el.textContent = '';
  for (let i = 0; i < text.length; i++) {
    if (skipFlagRef && skipFlagRef.value) {
      el.textContent = text;
      return;
    }
    el.textContent += text[i];
    if (i % soundEvery === 0) {
      const a = window.typingAudios[Math.floor(Math.random() * window.typingAudios.length)];
      try { a.currentTime = 0; a.play(); } catch (e) {}
    }
    if (i === 0) continue;
    const delay = baseDelay + Math.floor(Math.random() * randomDelay);
    await new Promise(r => setTimeout(r, delay));
  }
}

export async function showRoomStoryOverlay(roomId, fallbackAction = 'showChoices') {
  if (seenRooms.has(roomId)) {
    proceedAfterStory(roomId, fallbackAction);
    return;
  }

  const overlay = document.getElementById('story-overlay');
  const titleEl = document.getElementById('story-title');
  const subEl = document.getElementById('story-subtitle');
  const bodyEl = document.getElementById('story-body');
  const contBtn = document.getElementById('story-continue');
  const skipBtn = document.getElementById('story-skip');
  const closeBtn = document.getElementById('story-close');

  let story = null;
  try {
    const res = await fetch(`/public/data/stories/${roomId}.json`, { cache: 'no-store' });
    if (res.ok) story = await res.json();
  } catch (e) {}

  if (!story) {
    proceedAfterStory(roomId, fallbackAction);
    return;
  }

  seenRooms.add(roomId);
  overlay.classList.remove('story-hidden');
  titleEl.textContent = story.title || roomId;
  subEl.textContent = story.subtitle || '';
  bodyEl.innerHTML = '';

  const skipFlag = { value: false };
  skipBtn.style.display = 'inline-flex';
  skipBtn.onclick = () => { skipFlag.value = true; };

  if (Array.isArray(story.body)) {
    for (let i = 0; i < story.body.length; i++) {
      const p = document.createElement('p');
      bodyEl.appendChild(p);
      await typeTextInto(p, story.body[i], {
        baseDelay: story.body[i].length > 80 ? 20 : 28,
        randomDelay: 10,
        soundEvery: 2,
        skipFlagRef: skipFlag
      });
      if (skipFlag.value) {
        for (let j = i + 1; j < story.body.length; j++) {
          const p2 = document.createElement('p');
          p2.textContent = story.body[j];
          bodyEl.appendChild(p2);
        }
        break;
      }
    }
  } else {
    const p = document.createElement('p');
    bodyEl.appendChild(p);
    await typeTextInto(p, story.body, { skipFlagRef: skipFlag });
  }

  if (story.autoClose) {
    setTimeout(() => {
      hideStoryOverlay();
      proceedAfterStory(roomId, story.nextAction || fallbackAction);
    }, story.autoCloseDelay || 4000);
  }

  contBtn.onclick = () => {
    hideStoryOverlay();
    proceedAfterStory(roomId, story.nextAction || fallbackAction);
  };
  closeBtn.onclick = () => {
    hideStoryOverlay();
    proceedAfterStory(roomId, story.nextAction || fallbackAction);
  };
}

export function hideStoryOverlay() {
  document.getElementById('story-overlay').classList.add('story-hidden');
}

export function proceedAfterStory(roomId, action = 'showChoices') {
  window.__roomAfterStory?.(roomId, action);
}
