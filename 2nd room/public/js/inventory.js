const inventory = [];
const invBox = document.getElementById('inventory');
const invList = document.getElementById('inventory-list');

export function giveItem(item) {
  inventory.push(item);
  renderInventory();
}

function renderInventory() {
  if (inventory.length === 0) {
    invBox.classList.add('hidden');
    return;
  }
  invBox.classList.remove('hidden');
  invList.innerHTML = '';
  inventory.forEach(it => {
    const li = document.createElement('li');
    li.textContent = it.name;
    invList.appendChild(li);
  });
}

window.giveItem = giveItem;
