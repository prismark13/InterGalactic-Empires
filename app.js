// app.js - Final V11.3 (Frontend)

const els = {
    units: document.getElementById('ui-units'), fuelIon: document.getElementById('ui-fuel-ion'), fuelWarp: document.getElementById('ui-fuel-warp'), loc: document.getElementById('ui-location'),
    hullBar: document.getElementById('ui-hull-bar'), shieldBar: document.getElementById('ui-shield-bar'), hullTxt: document.getElementById('ui-hull-txt'), shieldTxt: document.getElementById('ui-shield-txt'),
    wepList: document.getElementById('ui-wep-list'), sysList: document.getElementById('ui-sys-list'), crewList: document.getElementById('ui-crew-list'), cargoList: document.getElementById('ui-cargo-list'),
    marketList: document.getElementById('market-list'), shipyardList: document.getElementById('shipyard-list'), recruitList: document.getElementById('recruit-list'), rumorList: document.getElementById('rumor-list'),
    mapDisplay: document.getElementById('map-display'), marketDisplay: document.getElementById('market-display'), shipyardDisplay: document.getElementById('shipyard-display'), loungeDisplay: document.getElementById('lounge-display'),
    rightPanel: document.getElementById('panel-content'), viewToggles: document.getElementById('view-toggles'),
    shipClass: document.getElementById('ui-ship-class'), slotCount: document.getElementById('ui-slot-count'),
    modal: document.getElementById('modal-overlay'), mTitle: document.getElementById('m-title'), mBody: document.getElementById('m-body'), mFooter: document.getElementById('m-footer'),
    encModal: document.getElementById('encounter-overlay'), encTitle: document.getElementById('enc-title'), encText: document.getElementById('enc-text'), encActions: document.getElementById('enc-actions'),
    input: document.getElementById('player-input'), btn: document.getElementById('btn-engage')
};

let currentData = null;
let activeRightTab = 'ship';
let marketMode = 'buy';

function getVisualClass(type) {
    if (!type) return 'planet-terran';
    const t = type.toLowerCase();
    if (t.includes("gas")) return "planet-gas"; if (t.includes("ice")) return "planet-ice"; if (t.includes("volcanic")) return "planet-volcanic";
    if (t.includes("ocean")) return "planet-ocean"; if (t.includes("belt")) return "planet-belt"; if (t.includes("moon")) return "planet-moon";
    return "planet-terran";
}
function getStarVisual(type) {
    if (!type) return 'star-white';
    const t = type.toLowerCase();
    if (t.includes("blue")) return "star-blue"; if (t.includes("red")) return "star-red"; if (t.includes("yellow")) return "star-yellow";
    if (t.includes("pulsar")) return "star-pulsar"; if (t.includes("black")) return "star-blackhole";
    return "star-white";
}
function stringHash(str) { let hash=0; for(let i=0;i<str.length;i++) hash=str.charCodeAt(i)+((hash<<5)-hash); return Math.abs(Math.sin(hash)*10000)%1; }

function render(data) {
    if (!data) return;
    currentData = data;
    
    if(els.units) els.units.innerText = data.player.units + " U";
    if(els.fuelIon) els.fuelIon.innerText = data.ship.stats.fuel_ion; 
    if(els.loc) els.loc.innerText = data.meta.landed ? "SURFACE" : `ORBIT: ${data.meta.orbiting}`;
    
    if(els.hullBar) els.hullBar.style.width = data.ship.stats.hull + "%"; 

    populateList(els.wepList, data.ship.weapons, 'red');
    populateList(els.sysList, data.ship.systems, 'cyan');
    populateList(els.crewList, data.ship.crew, 'blue');
    populateList(els.cargoList, data.ship.cargo, 'yellow', true);

    if(els.shipClass) els.shipClass.innerText = data.ship.class.toUpperCase();
    if(els.slotCount) els.slotCount.innerText = `${data.ship.stats.slots_used}/${data.ship.stats.slots_max}`;

    if (data.encounter) {
        if(els.encModal) els.encModal.classList.remove('hidden');
        if(els.encTitle) els.encTitle.innerText = data.encounter.type;
        if(els.encText) els.encText.innerText = data.encounter.text;
        els.encActions.innerHTML = data.encounter.hostile 
            ? `<button onclick="sendCmd('Attack')" class="action-btn">ATTACK</button><button onclick="sendCmd('Flee')" class="action-btn">FLEE</button>`
            : `<button onclick="sendCmd('Mine Asteroid')" class="action-btn">MINE</button><button onclick="sendCmd('Ignore')" class="action-btn">IGNORE</button>`;
    } else {
        if(els.encModal) els.encModal.classList.add('hidden');
    }

    updateCenterView();
    renderRightPanel();
}

function populateList(container, items, color, isCargo=false) {
    if (!container) return;
    container.innerHTML = '';
    if (!items || items.length === 0) { container.innerHTML = '<div class="empty">- Empty -</div>'; return; }
    items.forEach(item => {
        const div = document.createElement('div'); div.className = `manifest-item ${color}-border`;
        div.innerHTML = isCargo ? `<span>${item.name}</span> <span class="qty">x${item.qty}</span>` : `<span>${item.name}</span>`;
        div.ondblclick = () => openDetailModal('item', item);
        container.appendChild(div);
    });
}

function updateCenterView() {
    els.mapDisplay.classList.add('hidden'); els.marketDisplay.classList.add('hidden'); 
    els.shipyardDisplay.classList.add('hidden'); els.loungeDisplay.classList.add('hidden');

    if (currentData.meta.landed) {
        els.viewToggles.innerHTML = `<button onclick="showMarket('goods')" class="view-btn">MARKET</button><button onclick="showMarket('ships')" class="view-btn">SHIPYARD</button><button onclick="showMarket('lounge')" class="view-btn">LOUNGE</button><button onclick="sendCmd('Takeoff')" class="view-btn warning">TAKEOFF</button>`;
        if(els.shipyardDisplay.classList.contains('active-view')) showMarket('ships');
        else if(els.loungeDisplay.classList.contains('active-view')) showMarket('lounge');
        else showMarket('goods');
    } else {
        els.mapDisplay.classList.remove('hidden');
        els.viewToggles.innerHTML = `<button onclick="setMapMode('galaxy')" class="view-btn">GALAXY</button><button onclick="setMapMode('sector')" class="view-btn">SECTOR</button>`;
        requestAnimationFrame(renderMap);
    }
}

window.showMarket = (type) => {
    els.marketDisplay.classList.add('hidden'); els.shipyardDisplay.classList.add('hidden'); els.loungeDisplay.classList.add('hidden');
    els.marketDisplay.classList.remove('active-view'); els.shipyardDisplay.classList.remove('active-view'); els.loungeDisplay.classList.remove('active-view');

    if(type==='goods'){ els.marketDisplay.classList.remove('hidden'); els.marketDisplay.classList.add('active-view'); renderCommodities(marketMode); }
    else if(type==='ships'){ els.shipyardDisplay.classList.remove('hidden'); els.shipyardDisplay.classList.add('active-view'); renderShipyard(); }
    else { els.loungeDisplay.classList.remove('hidden'); els.loungeDisplay.classList.add('active-view'); renderLounge(); }
}
window.closeMarket = () => sendCmd('Takeoff');

window.renderCommodities = (mode) => {
    marketMode = mode;
    const list = els.marketList; if(!list) return; list.innerHTML = '';
    const items = mode==='buy' ? (currentData.local_market||[]) : (currentData.ship.cargo||[]);
    if(items.length===0) { list.innerHTML=`<tr><td colspan="5" class="empty">NO ITEMS</td></tr>`; return; }
    items.forEach((item, idx) => {
        const row = document.createElement('tr'); const color = item.rarity?.color || '#fff';
        const price = mode==='buy' ? item.price : Math.floor(item.val*0.8);
        const can = mode==='buy' ? currentData.player.units >= price : true;
        const btnClass = can ? 'buy-btn' : 'buy-btn disabled';
        row.innerHTML = `<td style="color:${color};font-weight:bold">${item.name}</td><td>${item.type}</td><td>${item.qty}</td><td style="color:#eab308">${price} U</td><td class="buy-cell"><input type="range" min="1" max="${item.qty}" value="1" id="sl-${idx}" oninput="document.getElementById('v-${idx}').innerText=this.value"><span id="v-${idx}">1</span><button onclick="tradeItem('${item.name}','sl-${idx}')" class="${btnClass}">${mode.toUpperCase()}</button></td>`;
        list.appendChild(row);
    });
}
window.tradeItem = (name, id) => sendCmd(`${marketMode==='buy'?'Buy':'Sell'} ${document.getElementById(id).value} ${name}`);

function renderShipyard() {
    const list = els.shipyardList; if(!list) return; list.innerHTML = '';
    (currentData.local_shipyard||[]).forEach(p => {
        const row = document.createElement('tr');
        const can = currentData.player.units >= p.price;
        const btnClass = can ? 'buy-btn' : 'buy-btn disabled';
        row.innerHTML = `<td style="color:#fff;font-weight:bold">${p.name}</td><td>${p.type}</td><td style="color:#eab308">${p.price} U</td><td><button onclick="sendCmd('Buy Part ${p.name}')" class="${btnClass}">INSTALL</button></td>`;
        list.appendChild(row);
    });
}

function renderLounge() {
    if(!els.recruitList) return;
    els.recruitList.innerHTML = ''; els.rumorList.innerHTML = '';
    const lounge = currentData.local_lounge || { recruits: [], rumors: [] };
    (lounge.recruits||[]).forEach(r => {
        const can = currentData.player.units >= r.cost;
        els.recruitList.innerHTML += `<div class="recruit-card"><div><strong>${r.name}</strong> <small>(${r.role})</small></div><div>${r.cost} U</div><button onclick="sendCmd('Recruit ${r.name}')" class="buy-btn ${can?'':'disabled'}">HIRE</button></div>`;
    });
    (lounge.rumors||[]).forEach(r => els.rumorList.innerHTML += `<div class="rumor-bubble">"${r}"</div>`);
}

function renderMap() {
    const display = els.mapDisplay; if(!display) return; display.innerHTML = '';
    const mode = currentData.map.view_mode || 'sector';
    const cx = display.clientWidth/2; const cy = display.clientHeight/2;

    if (mode === 'galaxy') {
        let hub=document.createElement('div'); hub.className="central-sun"; hub.style.left=`${cx}px`; hub.style.top=`${cy}px`; display.appendChild(hub);
        (currentData.map.neighbors||[]).forEach((star,i)=>{
            const dist=150; const ang=(i/3)*6.28;
            let n=document.createElement('div'); n.className="map-node star-node"; n.innerHTML=`<div class="node-label">${star}</div>`; n.style.left=`${cx+dist*Math.cos(ang)}px`; n.style.top=`${cy+dist*Math.sin(ang)}px`; n.onclick=()=>sendCmd(`Warp to ${star}`); display.appendChild(n);
        });
    } else {
        let sun=document.createElement('div'); sun.className="central-sun"; sun.style.left=`${cx}px`; sun.style.top=`${cy}px`; display.appendChild(sun);
        const bodies = currentData.map.sector_bodies || [];
        const maxRad = Math.min(cx, cy) - 50; const step = maxRad/(bodies.length+1);
        bodies.forEach((b,i)=>{
            if(b.is_star) return;
            const r=step*(i+1); const a=stringHash(b.name)*6.28;
            let ring=document.createElement('div'); ring.className="orbit-ring"; ring.style.width=`${r*2}px`; ring.style.height=`${r*2}px`; ring.style.left=`${cx-r}px`; ring.style.top=`${cy-r}px`; display.appendChild(ring);
            const x=cx+r*Math.cos(a); const y=cy+r*Math.sin(a);
            let p=document.createElement('div'); p.className="orbital-planet";
            let visual = getVisualClass(b.type);
            p.innerHTML=`<div class="planet-icon ${visual}"></div><div class="orbital-label">${b.name}</div>`;
            p.style.left=`${x}px`; p.style.top=`${y}px`; p.onclick=()=>openDetailModal('planet', b); display.appendChild(p);
            if(currentData.meta.orbiting===b.name) { let s=document.createElement('div'); s.className="player-ship-icon"; s.innerHTML="▲"; s.style.left=`${x+15}px`; s.style.top=`${y-15}px`; display.appendChild(s); }
        });
    }
}

function renderRightPanel() {
    const container = els.rightPanel; if(!container) return; container.innerHTML = '';
    if (activeRightTab === 'ship') {
        const ship = currentData.ship; const max = ship.stats.slots_max || 32;
        const hull = document.createElement('div'); hull.className='ship-hull'; const grid = document.createElement('div'); grid.className='slot-grid';
        const add = (arr, cls, tag) => arr.forEach(x => { const s=document.createElement('div'); s.className=`slot filled ${cls}`; s.innerHTML=`<span class="slot-tag">${tag}</span>`; s.title=x.name; s.ondblclick = () => openDetailModal('item', x); grid.appendChild(s); });
        add(ship.crew||[], 'crew', 'CRW'); add(ship.weapons||[], 'weapon', 'WPN'); add(ship.systems||[], 'system', 'SYS');
        let flatCargo=[]; (ship.cargo||[]).forEach(c=>{ for(let i=0; i<Math.ceil(c.qty/20); i++) flatCargo.push(c); }); add(flatCargo, 'cargo', 'CGO');
        for(let i=grid.children.length; i<max; i++) { const s=document.createElement('div'); s.className='slot empty'; grid.appendChild(s); }
        const scroll = document.createElement('div'); scroll.className='slot-grid-container'; scroll.appendChild(grid); hull.appendChild(scroll); container.appendChild(hull);
    } else { (currentData.log||[]).forEach(l=>{ let d=document.createElement('div'); d.className=`log-entry ${l.type}`; d.innerText=l.text; container.appendChild(d); }); }
}

window.openDetailModal = (t, d) => {
    els.mTitle.innerText = d.name;
    if(t==='planet') { els.mBody.innerHTML=`<div class="modal-content-grid"><div class="planet-visual-large ${getVisualClass(d.type)}"></div><div class="modal-data"><div class="data-tag">TYPE: ${d.type}</div><div class="data-tag">ECON: ${d.economy}</div><p class="lore-text">${d.desc}</p></div></div>`; els.mFooter.innerHTML=`<button onclick="closeModal(); sendCmd('Travel to ${d.name}')" class="action-btn">TRAVEL</button><button onclick="closeModal(); sendCmd('Land on ${d.name}')" class="action-btn">LAND</button>`; if(d.mineable) els.mFooter.innerHTML += `<button onclick="closeModal(); sendCmd('Mine ${d.name}')" class="action-btn">MINE</button>`; }
    else { els.mBody.innerHTML=`<div class="modal-data"><p>${d.desc||'Item'}</p></div>`; els.mFooter.innerHTML=`<button onclick="closeModal()" class="action-btn">CLOSE</button>`; }
    els.modal.classList.remove('hidden');
}
window.closeModal = () => els.modal.classList.add('hidden');
window.sendCmd = async(txt) => {
    if(!txt) txt=els.input.value; els.input.value='';
    try {
        const res = await fetch('http://localhost:3000/command', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({command: txt}) });
        if (!res.ok) {
            const detail = await res.text().catch(() => res.statusText);
            console.error('Server error', res.status, detail);
            if (currentData && currentData.log) {
                currentData.log.unshift({ type: 'system', text: `Server error ${res.status}: ${detail}` });
                render(currentData);
            }
            return;
        }
        render(await res.json());
    } catch(e) {
        console.error('Network error sending command', e);
        if (currentData && currentData.log) {
            currentData.log.unshift({ type: 'system', text: `Connection failed: ${e.message || e}` });
            render(currentData);
        }
    }
}
window.setMapMode = (m) => sendCmd(m==='galaxy'?'Galaxy Map':'Scan Sector');
window.switchRightTab = (t) => { activeRightTab=t; document.querySelectorAll('.p-tab').forEach(b=>b.classList.remove('active')); document.getElementById('tab-'+t).classList.add('active'); renderRightPanel(); }
window.restartGame = () => sendCmd("RESTART_GAME");
els.btn.onclick = () => sendCmd(); els.input.onkeypress = (e) => { if(e.key === 'Enter') sendCmd(); };
async function init() { 
    try { 
        const res = await fetch('game_state.json');
        const data = await res.json();
        if (!data.meta || !data.meta.location || data.meta.location === "Unknown") {
             sendCmd("RESTART_GAME");
        } else {
            render(data); 
        }
    } catch(e) {
        sendCmd("RESTART_GAME");
    } 
}
init();