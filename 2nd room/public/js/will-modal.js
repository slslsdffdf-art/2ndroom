export function openWillModal(ctx = {}) {
  const {
    roomId,
    roomLabel,
    bg,
    deathId,
    deathTitle,
    cause,
    cardImage,
    cardOverlay,
    defaultWill
  } = ctx;

  const modal = document.getElementById('will-modal');
  modal.classList.remove('hidden');

  const textarea = document.getElementById('will-text');
  const causeEl = document.getElementById('will-cause');

  textarea.value = '';
  textarea.placeholder = defaultWill || '비명조차 지르지 못한 채 즉사.';
  textarea.focus();

  causeEl.textContent = cause || deathTitle || '';

  const submitBtn = document.getElementById('will-submit');
  const skipBtn = document.getElementById('will-skip');

  async function finish(finalText) {
    // 1) 서버에 유언 저장
    await fetch('/api/lastwords', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        room: roomId,
        death: deathId,
        cause: cause || deathTitle || 'unknown',
        text: finalText
      })
    });

    // 2) 공유카드 만들기
    if (window.makeShareCard) {
      window.makeShareCard({
        roomLabel: roomLabel || roomId || 'UNKNOWN ROOM',
        cause: cause || deathTitle || 'unknown',
        lastwords: finalText,
        imageUrl: cardImage || bg || null,
        overlayUrl: cardOverlay || null,
        deathTitle: deathTitle || null
      });
    }

    // 3) 사망기록 페이지로 이동
    setTimeout(() => {
      location.href = '/play/wall.html';
    }, 500);
  }

  submitBtn.onclick = async () => {
    const text = textarea.value.trim() || defaultWill || '비명조차 지르지 못한 채 즉사.';
    await finish(text);
  };

  skipBtn.onclick = async () => {
    const text = defaultWill || '비명조차 지르지 못한 채 즉사.';
    await finish(text);
  };
}
window.openWillModal = openWillModal;
