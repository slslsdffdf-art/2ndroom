// overlay.js

// 짧은 타이핑 사운드 여러 개
const typingAudios = [
  new Audio('/assets/sfx/ui_type_1.mp3'),
  new Audio('/assets/sfx/ui_type_2.mp3'),
  new Audio('/assets/sfx/ui_type_3.mp3')
];
typingAudios.forEach(a => a.volume = 0.35);

async function typeTextInto(el, text, opts = {}) {
  const {
    baseDelay = 28,
    randomDelay = 12,
    soundEvery = 2,
    skipFlagRef = null
  } = opts;

  el.textContent = '';
  let i = 0;
  while (i < text.length) {
    if (skipFlagRef && skipFlagRef.value) {
      el.textContent = text;
      break;
    }
    el.textContent += text[i];

    if (i % soundEvery === 0) {
      const a = typingAudios[Math.floor(Math.random()*typingAudios.length)];
      try {
        a.currentTime = 0;
        a.play();
      } catch(e) {}
    }

    i++;
    if (i === 1) continue;
    const delay = baseDelay + Math.floor(Math.random() * randomDelay);
    await new Promise(r => setTimeout(r, delay));
  }
}

export async function showStoryOverlay(story, afterFn) {
  const overlay = document.getElementById('story-overlay');
  const titleEl = document.getElementById('story-title');
  const subEl   = document.getElementById('story-subtitle');
  const bodyEl  = document.getElementById('story-body');
  const contBtn = document.getElementById('story-continue');
  const skipBtn = document.getElementById('story-skip');
  const closeBtn= document.getElementById('story-close');

  overlay.classList.remove('story-hidden');

  titleEl.textContent = story.title || '';
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
        for (let j = i+1; j < story.body.length; j++) {
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
    await typeTextInto(p, story.body, { skipFlagRef: skipFlag });
  }

  function closeAll() {
    overlay.classList.add('story-hidden');
    if (afterFn) afterFn(story.nextAction || 'showChoices');
  }

  if (story.autoClose) {
    setTimeout(closeAll, story.autoCloseDelay || 4000);
  }

  contBtn.onclick = closeAll;
  closeBtn.onclick = closeAll;
}
