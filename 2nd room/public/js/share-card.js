export async function makeShareCard({
  roomLabel,
  cause,
  lastwords,
  imageUrl,
  overlayUrl,
  deathTitle
}) {
  const canvas = document.getElementById('share-canvas');
  const ctx = canvas.getContext('2d');

  // 1. 바닥 카드 이미지
  if (imageUrl) {
    const bgImg = new Image();
    bgImg.crossOrigin = 'anonymous';
    bgImg.src = imageUrl;
    await bgImg.decode().catch(()=>{});
    ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // 2. 프레임/오버레이
  if (overlayUrl) {
    const ov = new Image();
    ov.crossOrigin = 'anonymous';
    ov.src = overlayUrl;
    await ov.decode().catch(()=>{});
    ctx.drawImage(ov, 0, 0, canvas.width, canvas.height);
  }

  // 3. 텍스트
  ctx.fillStyle = '#fff';
  ctx.font = '26px system-ui';
  ctx.fillText(roomLabel || 'UNKNOWN ROOM', 46, 100);

  if (deathTitle) {
    ctx.font = '20px system-ui';
    ctx.fillText(deathTitle, 46, 140);
  }

  ctx.font = '16px system-ui';
  ctx.fillText('Cause:', 46, 180);
  wrapText(ctx, cause || '---', 46, 206, canvas.width - 92, 22);

  const baseY = 280;
  wrapText(ctx, lastwords || '비명조차 지르지 못한 채 즉사.', 46, baseY, canvas.width - 92, 22);

  const url = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = '2nd_room_deathcard.png';
  a.click();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(/\s+/);
  let line = '';
  for (let i = 0; i < words.length; i++) {
    const test = line + words[i] + ' ';
    if (ctx.measureText(test).width > maxWidth && i > 0) {
      ctx.fillText(line, x, y);
      line = words[i] + ' ';
      y += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, x, y);
}

window.makeShareCard = makeShareCard;
