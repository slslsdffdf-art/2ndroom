// node tools/gen-rooms.js > public/data/rooms.json
const TOTAL = 300;
const rooms = {};
const deaths = {};

for (let i = 1; i <= TOTAL; i++) {
  const id = String(i).padStart(3, '0');
  const roomId = `room_${id}`;

  rooms[roomId] = {
    label: `${id}호실`,
    bg: `/public/assets/bg/${roomId}.jpg`,
    audio: `BGM_${String(((i - 1) % 10) + 1).padStart(2, '0')}`,
    choices: [
      {
        id: "forward",
        label: "앞으로 간다",
        to: i < TOTAL ? `room_${String(i + 1).padStart(3, '0')}` : "exit"
      },
      {
        id: "inspect",
        label: "방 안을 살핀다",
        to: `death_${id}_inspect`
      },
      {
        id: "stay",
        label: "멈춰 선다",
        to: `death_${id}_stay`
      }
    ]
  };

  deaths[`death_${id}_inspect`] = {
    title: `${id}호실 조사`,
    cause: `${id}호실을 괜히 뒤졌다.`,
    cardImage: `/public/assets/cards/death_${id}_inspect.png`,
    defaultWill: "…"
  };

  deaths[`death_${id}_stay`] = {
    title: `${id}호실 정지`,
    cause: `여기서는 멈춰 서 있으면 안 된다.`,
    cardImage: `/public/assets/cards/death_${id}_stay.png`
  };
}

const out = {
  start: "room_001",
  rooms,
  deaths
};

console.log(JSON.stringify(out, null, 2));
