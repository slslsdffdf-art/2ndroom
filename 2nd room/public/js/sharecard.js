export async function renderShareCard({ bgSrc, roomLabel, cause, will, time }) {
  const canvas = document.getElementById('share-canvas');
  const ctx = canvas.getContext('2d');

  // 기본 바탕
  const base = new Image();
  base.src = '/assets/ui/share_base.png';
  await base.decode().catch(()=>{});
  ctx.drawImage(base, 0, 0, canvas.width, canvas.height);

  // 방 배경
  if (bgSrc) {
    const bg = new Image();
    bg.src = bgSrc;
    await bg.decode().catch(()=>{});
    ctx.drawImage(bg, 20, 20, 200, 200);
  }

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px system-ui';
  ctx.fillText(roomLabel || 'Unknown Room', 240, 50);

  ctx.font = '14px system-ui';
  ctx.fillText('Cause: ' + (cause || 'unknown'), 240, 80);
  ctx.fillText(time || '', 240, 105);

  ctx.font = '13px system-ui';
  wrapText(ctx, will || '비명조차 지르지 못한 채 즉사.', 240, 140, 520, 18);

  return canvas.toDataURL('image/png');
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n] + ' ';
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
}
