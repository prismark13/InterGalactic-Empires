console.log('✅ app.js loaded');

const GameState = {
  data: null,
  rightTab: 'ship',

  async init() {
    console.log('🚀 GameState.init()');
    try {
      this.data = await StateService.load();
      console.log('✅ State loaded:', this.data?.meta?.orbiting);
      UI.render(this.data);
    } catch (err) {
      console.error('❌ Init failed:', err.message);
    }
  },

  async executeCommand(cmd) {
    console.log(`📤 ${cmd}`);
    try {
      this.data = await CommandService.send(cmd);
      console.log('✅ Response:', this.data?.meta?.orbiting);
      UI.render(this.data);
    } catch (err) {
      console.error(`❌ ${cmd} failed:`, err.message);
    }
  },

  setRightTab(tab) {
    this.rightTab = tab;
    UI.renderRightPanel(this.data, tab);
  },

  updateMapMode(mode) {
    if (this.data?.map) {
      this.data.map.view_mode = mode;
      UI.render(this.data);
    }
  },
};

const StateService = {
  async load() {
    const response = await fetch('/state');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  },
};

const CommandService = {
  async send(cmd) {
    const response = await fetch('/command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: cmd }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  },
};

const UI = {
  $(id) {
    const el = document.getElementById(id);
    if (!el) console.warn(`⚠️ Missing: ${id}`);
    return el;
  },

  render(data) {
    if (!data) return;
    console.log('🎨 Render');
    this.renderHeader(data);
    this.renderStats(data);
    this.renderInventory(data);
    this.renderMap(data);
    this.renderRightPanel(data, GameState.rightTab);
  },

  renderHeader(data) {
    const location = data?.meta?.orbiting || 'UNKNOWN';
    const credits = data?.player?.units || 0;
    const fuelIon = data?.ship?.stats?.fuel_ion || 0;
    const fuelWarp = data?.ship?.stats?.fuel_warp || 0;

    let el = this.$('ui-location');
    if (el) el.textContent = location;

    el = this.$('ui-location-display');
    if (el) el.textContent = location;

    el = this.$('ui-units');
    if (el) el.textContent = credits;

    el = this.$('ui-fuel-ion');
    if (el) el.textContent = fuelIon;

    el = this.$('ui-fuel-warp');
    if (el) el.textContent = fuelWarp;

    console.log(`📍 ${location}`);
  },

  renderStats(data) {
    const hull = data?.ship?.stats?.hull || 0;
    const shields = data?.ship?.stats?.shields || 0;
    const shipClass = data?.ship?.class || 'UNKNOWN';
    const slotUsed = data?.ship?.stats?.slots_used || 0;
    const slotMax = data?.ship?.stats?.slots_max || 32;

    let el = this.$('ui-hull-bar');
    if (el) el.style.width = `${Math.max(0, Math.min(100, hull))}%`;

    el = this.$('ui-hull-txt');
    if (el) el.textContent = `${hull}%`;

    el = this.$('ui-shield-bar');
    if (el) el.style.width = `${Math.max(0, Math.min(100, shields))}%`;

    el = this.$('ui-shield-txt');
    if (el) el.textContent = `${shields}%`;

    el = this.$('ui-ship-class');
    if (el) el.textContent = shipClass;

    el = this.$('ui-slot-count');
    if (el) el.textContent = `${slotUsed}/${slotMax}`;
  },

  renderInventory(data) {
    this.renderList('ui-wep-list', data?.ship?.weapons || [], (w) => w.name);
    this.renderList('ui-sys-list', data?.ship?.systems || [], (s) => s.name);
    this.renderList('ui-crew-list', data?.ship?.crew || [], (c) => `${c.name} (${c.role})`);
    this.renderList('ui-cargo-list', data?.ship?.cargo || [], (item) => `${item.name} × ${item.qty}`);
  },

  renderList(id, items, format) {
    const el = this.$(id);
    if (!el) return;
    el.innerHTML = '';
    if (items.length === 0) {
      el.innerHTML = '<div class="item gray">None</div>';
      return;
    }
    items.forEach((item) => {
      const div = document.createElement('div');
      div.className = 'item';
      div.textContent = format(item);
      el.appendChild(div);
    });
  },

  renderMap(data) {
    const el = this.$('map-display');
    if (!el) return;
    if (data?.map?.view_mode === 'galaxy') {
      this.renderGalaxyMap(el, data);
    } else {
      this.renderSectorMap(el, data);
    }
  },

  renderSectorMap(container, data) {
    container.innerHTML = '';
    const canvas = document.createElement('canvas');
    canvas.width = container.clientWidth || 600;
    canvas.height = container.clientHeight || 400;
    canvas.style.background = '#000';
    canvas.style.border = '1px solid #0f0';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const bodies = data?.map?.sector_bodies || [];

    console.log(`🗺️ ${bodies.length} bodies`);

    if (!bodies.length) {
      ctx.fillStyle = '#fff';
      ctx.font = '14px monospace';
      ctx.fillText('NO BODIES DETECTED', 50, 50);
      return;
    }

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    bodies.forEach((b) => {
      minX = Math.min(minX, b.x ?? 0);
      maxX = Math.max(maxX, b.x ?? 0);
      minY = Math.min(minY, b.y ?? 0);
      maxY = Math.max(maxY, b.y ?? 0);
    });

    const padding = 50;
    const width = maxX - minX || 1;
    const height = maxY - minY || 1;
    const scaleX = (canvas.width - 2 * padding) / width;
    const scaleY = (canvas.height - 2 * padding) / height;
    const scale = Math.min(scaleX, scaleY);

    bodies.forEach((body) => {
      const x = (body.x - minX) * scale + padding;
      const y = (body.y - minY) * scale + padding;
      const radius = body.type === 'Gas Giant' ? 8 : 6;
      const color = body.type === 'Star' ? '#ffd700' : '#4488ff';

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.font = '11px monospace';
      ctx.fillText(body.name, x + 10, y - 5);

      ctx.fillStyle = '#aaa';
      ctx.font = '9px monospace';
      ctx.fillText(body.type, x + 10, y + 8);
    });

    ctx.fillStyle = '#222';
    ctx.fillRect(10, canvas.height - 30, 300, 25);
    ctx.strokeStyle = '#0f0';
    ctx.lineWidth = 1;
    ctx.strokeRect(10, canvas.height - 30, 300, 25);

    ctx.fillStyle = '#0f0';
    ctx.font = '10px monospace';
    ctx.fillText(
      `SECTOR: ${data?.map?.current_system || 'VERIDIA'} | BODIES: ${bodies.length}`,
      15,
      canvas.height - 12
    );
  },

  renderGalaxyMap(container, data) {
    container.innerHTML = '';
    const canvas = document.createElement('canvas');
    canvas.width = container.clientWidth || 600;
    canvas.height = container.clientHeight || 400;
    canvas.style.background = '#000';
    canvas.style.border = '1px solid #0f0';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0f0';
    ctx.font = '14px monospace';
    ctx.fillText('GALAXY NAVIGATION', 50, 50);

    ctx.font = '11px monospace';
    ctx.fillText('NEIGHBORING SECTORS:', 50, 100);

    const neighbors = data?.map?.neighbors || [];
    neighbors.forEach((n, i) => {
      ctx.fillText(`  • ${n}`, 70, 120 + i * 20);
    });
  },

  renderRightPanel(data, tab) {
    const panelContent = this.$('panel-content');
    if (!panelContent) return;

    if (tab === 'ship') {
      this.renderShipPanel(data, panelContent);
    } else if (tab === 'log') {
      this.renderLogPanel(data, panelContent);
    }
  },

  renderShipPanel(data, container) {
    let html = '<div class="blueprint-section">';
    const equipment = data?.ship?.equipment || [];

    if (equipment.length > 0) {
      html += '<h4 class="sub-head" style="margin-top: 10px;">EQUIPMENT</h4>';
      equipment.forEach((e) => {
        html += `<div class="item">${e.name} <span class="gray">(${e.type})</span></div>`;
      });
    } else {
      html += '<div class="item gray">No equipment</div>';
    }

    html += '</div>';
    container.innerHTML = html;
  },

  renderLogPanel(data, container) {
    let html = '<div class="log-section">';
    const log = data?.log || [];

    if (log.length > 0) {
      log.slice(-20).forEach((entry) => {
        const typeClass = entry.type || 'info';
        html += `<div class="log-entry log-${typeClass}">${entry.text}</div>`;
      });
    } else {
      html += '<div class="log-entry log-system">No log entries</div>';
    }

    html += '</div>';
    container.innerHTML = html;
  },
};

function sendCmd(cmd) {
  GameState.executeCommand(cmd);
}

function setMapMode(mode) {
  console.log(`🗺️ ${mode}`);
  GameState.updateMapMode(mode);
}

function switchRightTab(tabName) {
  console.log(`📋 ${tabName}`);
  GameState.setRightTab(tabName);

  const tabShip = document.getElementById('tab-ship');
  const tabLog = document.getElementById('tab-log');

  if (tabShip) tabShip.classList.toggle('active', tabName === 'ship');
  if (tabLog) tabLog.classList.toggle('active', tabName === 'log');
}

function restartGame() {
  if (confirm('HARD RESET: Lose all progress?')) {
    sendCmd('Restart Game');
  }
}

function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.classList.add('hidden');
}

function closeMarket() {
  const market = document.getElementById('market-display');
  const shipyard = document.getElementById('shipyard-display');
  const lounge = document.getElementById('lounge-display');

  if (market) market.classList.add('hidden');
  if (shipyard) shipyard.classList.add('hidden');
  if (lounge) lounge.classList.add('hidden');
}

window.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 DOM ready');
  GameState.init();
});

window.debugState = () => console.log('State:', GameState.data);