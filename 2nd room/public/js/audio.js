let currentAudio = null;

export function playBGM(id, opts = {}) {
  const src = `/assets/bgm/${id}.mp3`; // 네가 채움
  const audio = new Audio(src);
  audio.loop = true;
  audio.volume = 0;
  audio.play().catch(()=>{});
  currentAudio = audio;

  const fadeIn = opts.fadeIn || 1200;
  const step = 50;
  let t = 0;
  const timer = setInterval(() => {
    t += step;
    audio.volume = Math.min(1, t / fadeIn);
    if (t >= fadeIn) clearInterval(timer);
  }, step);
}
