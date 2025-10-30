// BGM 미리 매핑 (10곡 순환)
const bgmMap = {};
for (let i = 1; i <= 10; i++) {
  const key = `BGM_${String(i).padStart(2, '0')}`;
  const audio = new Audio(`/public/assets/bgm/${key}.mp3`);
  audio.loop = true;
  audio.volume = 0.28;
  bgmMap[key] = audio;
}
let currentBgm = null;

export function playBGMForRoom(key) {
  const audio = bgmMap[key];
  if (!audio) return;
  if (currentBgm && currentBgm !== audio) {
    currentBgm.pause();
    currentBgm.currentTime = 0;
  }
  currentBgm = audio;
  audio.play().catch(() => {});
}
window.playBGMForRoom = playBGMForRoom;

// SFX
const sfx = {
  click: new Audio('/public/assets/sfx/ui_click.mp3'),
  death: new Audio('/public/assets/sfx/death_hit.mp3')
};
Object.values(sfx).forEach(a => a && (a.volume = 0.5));

export function playSfx(name) {
  const a = sfx[name];
  if (!a) return;
  a.currentTime = 0;
  a.play().catch(() => {});
}
window.playSfx = playSfx;
