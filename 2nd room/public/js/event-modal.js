export function openEventModal(eventData, onSelect) {
  const modal = document.getElementById('event-modal');
  const title = document.getElementById('event-title');
  const body = document.getElementById('event-body');
  const actions = document.getElementById('event-actions');

  title.textContent = eventData.title || '이벤트';
  body.textContent = eventData.body || '';
  actions.innerHTML = '';

  (eventData.actions || []).forEach(act => {
    const btn = document.createElement('button');
    btn.textContent = act.label;
    btn.onclick = () => {
      closeEventModal();
      onSelect?.(act);
    };
    actions.appendChild(btn);
  });

  modal.classList.remove('hidden');
}

export function closeEventModal() {
  document.getElementById('event-modal').classList.add('hidden');
}

window.openEventModal = openEventModal;
