// app.js - Final Master Version (V11.0)

const els = {
    // Stats & Header
    units: document.getElementById('ui-units'), 
    fuelIon: document.getElementById('ui-fuel-ion'), 
    fuelWarp: document.getElementById('ui-fuel-warp'), 
    loc: document.getElementById('ui-location'),
    hullBar: document.getElementById('ui-hull-bar'), 
    shieldBar: document.getElementById('ui-shield-bar'), 
    hullTxt: document.getElementById('ui-hull-txt'), 
    shieldTxt: document.getElementById('ui-shield-txt'),

    // Left Panel Lists (Manifest)
    wepList: document.getElementById('ui-wep-list'), 
    sysList: document.getElementById('ui-sys-list'), 
    crewList: document.getElementById('ui-crew-list'), 
    cargoList: document.getElementById('ui-cargo-list'),

    // Center Console Views
    mapDisplay: document.getElementById('map-display'), 
    marketDisplay: document.getElementById('market-display'), 
    shipyardDisplay: document.getElementById('shipyard-display'), 
    loungeDisplay: document.getElementById('lounge-display'),
    viewToggles: document.getElementById('view-toggles'),

    // Inner Content Containers
    marketList: document.getElementById('market-list'), 
    shipyardList: document.getElementById('shipyard-list'), 
    recruitList: document.getElementById('recruit-list'), 
    rumorList: document.getElementById('rumor-list'),

    // Right Panel (Ship)
    rightPanel: document.getElementById('panel-content'), 
    shipClass: document.getElementById('ui-ship-class'), 
    slotCount: document.getElementById('ui-slot-count'),

    // Modals & Overlays
    modal: document.getElementById('modal-overlay'), 
    mTitle: document.getElementById('m-title'), 
    mBody: document.getElementById('m-body'), 
    mFooter: document.getElementById('m-footer'),
    encModal: document.getElementById('encounter-overlay'), 
    encTitle: document.getElementById('enc-title'), 
    encText: document.getElementById('enc-text'), 
    encActions: document.getElementById('enc-actions'),

    // Inputs
    input: document.getElementById('player-input'), 
    btn: document.getElementById('btn-engage')
};

let currentData = null;
let activeRightTab = 'ship';
let marketMode = 'buy';

// --- VISUAL MAPPERS ---
function getVisualClass(type) {
    if (!type) return 'planet-terran';
    const t = type.toLowerCase();
    
    if (t.includes("gas") || t.includes("jupiter") || t.includes("puffy")) return "planet-gas";
    if (t.includes("ice") || t.includes("frost") || t.includes("neptune")) return "planet-ice";
    if (t.includes("volcanic") || t.includes("lava") || t.includes("molten") || t.includes("mustafar")) return "planet-volcanic";
    if (t.includes("ocean") || t.includes("water") || t.includes("steam")) return "planet-ocean";
    if (t.includes("toxic") || t.includes("acid") || t.includes("ammonia") || t.includes("soot")) return "planet-toxic";
    if (t.includes("desert") || t.includes("arid") || t.includes("sand")) return "planet-desert";
    if (t.includes("belt") || t.includes("asteroid") || t.includes("debris")) return "planet-belt";
    if (t.includes("moon") || t.includes("dwarf")) return "planet-moon";
    
    return "planet-terran"; // Default
}

function getStarVisual(type) {
    if (!type) return 'star-white';
    const t = type.toLowerCase();
    if (t.includes("blue") || t.includes("o-type") || t.includes("b-type")) return "star-blue";
    if (t.includes("red") || t.includes("m-type") || t.includes("carbon")) return "star-red";
    if (t.includes("yellow") || t.includes("g-type")) return "star-yellow";
    if (t.includes("pulsar") || t.includes("neutron") || t.includes("magnetar")) return "star-pulsar";
    if (t.includes("black")) return "star-blackhole";
    return "star-white";
}

function stringHash(str) { 
    let hash = 0; 
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash); 
    return Math.abs(Math.sin(hash) * 10000) % 1; 
}

// --- 4. MAIN RENDER LOOP ---
function render(data) {
    if(!data) return;
    currentData = data;
    
    // 1. Stats
    if(els.units) els.units.innerText = data.player.units + " U";
    if(els.fuelIon) els.fuelIon.innerText = data.ship.stats.fuel_ion; 
    if(els.fuelWarp) els.fuelWarp.innerText = data.ship.stats.fuel_warp;
    if(els.loc) els.loc.innerText = data.meta.landed ? "SURFACE" : `ORBIT: ${data.meta.orbiting}`;
    
    // Status Bars
    if(els.hullBar) els.hullBar.style.width = data.ship.stats.hull + "%"; 
    if(els.hullTxt) els.hullTxt.innerText = data.ship.stats.hull + "%";
    if(els.shieldBar) els.shieldBar.style.width = data.ship.stats.shields + "%"; 
    if(els.shieldTxt) els.shieldTxt.innerText = data.ship.stats.shields + "%";

    // 2. Left Panel Lists
    populateList(els.wepList, data.ship.weapons, 'red');
    populateList(els.sysList, data.ship.systems, 'cyan');
    populateList(els.crewList, data.ship.crew, 'blue');
    populateList(els.cargoList, data.ship.cargo, 'yellow', true);

    // 3. Right Header
    if(els.shipClass) els.shipClass.innerText = data.ship.class.toUpperCase();
    if(els.slotCount) els.slotCount.innerText = `${data.ship.stats.slots_used}/${data.ship.stats.slots_max}`;

    // 4. Encounter Modal
    if (data.encounter) {
        els.encModal.classList.remove('hidden');
        if(els.encTitle) els.encTitle.innerText = data.encounter.type.toUpperCase();
        if(els.encText) els.encText.innerText = data.encounter.text;
        
        let btns = '';
        if (data.encounter.hostile) {
            btns = `<button onclick="sendCmd('Attack')" class="action-btn red">ATTACK</button><button onclick="sendCmd('Flee')" class="action-btn">FLEE</button>`;
        } else if (data.encounter.mineable) {
            btns = `<button onclick="sendCmd('Mine Asteroid')" class="action-btn">MINE</button><button onclick="sendCmd('Ignore')" class="action-btn">IGNORE</button>`;
        } else {
            btns = `<button onclick="sendCmd('Trade')" class="action-btn">TRADE</button><button onclick="sendCmd('Ignore')" class="action-btn">IGNORE</button>`;
        }
        if(els.encActions) els.encActions.innerHTML = btns;
    } else {
        if(els.encModal) els.encModal.classList.add('hidden');
    }

    updateCenterView();
    renderRightPanel();
}

// --- 5. COMPONENT POPULATOR ---
function populateList(container, items, color, isCargo=false) {
    if(!container) return;
    container.innerHTML = '';
    if (!items || items.length === 0) { 
        container.innerHTML = '<div class="empty">- Empty -</div>'; 
        return; 
    }
    items.forEach(item => {
        let name = item.name;
        if(name === "Standard Tank") name = "Standard Fuel Tank"; 

        const div = document.createElement('div'); 
        div.className = `manifest-item ${color}-border`;
        
        let content = `<span>${name}</span>`;
        if (isCargo) content += ` <span class="qty">x${item.qty}</span>`;
        else if (item.role) content += ` <span class="qty">${item.role}</span>`;
        
        div.innerHTML = content;
        div.ondblclick = () => openDetailModal('item', item);
        container.appendChild(div);
    });
}

// --- 6. CENTER VIEW MANAGER ---
function updateCenterView() {
    els.mapDisplay.classList.add('hidden'); els.marketDisplay.classList.add('hidden'); 
    els.shipyardDisplay.classList.add('hidden'); els.loungeDisplay.classList.add('hidden');

    if (currentData.meta.landed) {
        els.viewToggles.innerHTML = `<button onclick="showMarket('goods')" class="view-btn">MARKET</button><button onclick="showMarket('ships')" class="view-btn">SHIPYARD</button><button onclick="showMarket('lounge')" class="view-btn">LOUNGE</button><button onclick="sendCmd('Takeoff')" class="view-btn warning">TAKEOFF</button>`;
        
        // Check Logic to Persist View
        if(els.shipyardDisplay.classList.contains('active-view')) showMarket('ships');
        else if(els.loungeDisplay.classList.contains('active-view')) showMarket('lounge');
        else showMarket('goods');
    } else {
        els.mapDisplay.classList.remove('hidden');
        els.viewToggles.innerHTML = `<button onclick="setMapMode('galaxy')" class="view-btn">GALAXY</button><button onclick="setMapMode('sector')" class="view-btn">SECTOR</button>`;
        requestAnimationFrame(renderMap);
    }
}

// View Switcher
window.showMarket = (type) => {
    els.marketDisplay.classList.add('hidden'); els.shipyardDisplay.classList.add('hidden'); els.loungeDisplay.classList.add('hidden');
    els.marketDisplay.classList.remove('active-view'); els.shipyardDisplay.classList.remove('active-view'); els.loungeDisplay.classList.remove('active-view');

    if(type==='goods'){ els.marketDisplay.classList.remove('hidden'); els.marketDisplay.classList.add('active-view'); renderCommodities(marketMode); }
    else if(type==='ships'){ els.shipyardDisplay.classList.remove('hidden'); els.shipyardDisplay.classList.add('active-view'); renderShipyard(); }
    else { els.loungeDisplay.classList.remove('hidden'); els.loungeDisplay.classList.add('active-view'); renderLounge(); }
}
window.closeMarket = () => sendCmd('Takeoff');

// --- 7. SUB-RENDERERS ---
window.renderCommodities = (mode) => {
    marketMode = mode;
    const list = els.marketList; 
    if(!list) return; list.innerHTML = '';
    
    const items = mode==='buy' ? (currentData.local_market||[]) : (currentData.ship.cargo||[]);
    
    if(items.length===0) { list.innerHTML=`<tr><td colspan="5" class="empty">NO ITEMS</td></tr>`; return; }

    items.forEach((item, idx) => {
        const row = document.createElement('tr'); 
        const color = item.rarity?.color || '#fff';
        const price = mode==='buy' ? item.price : Math.floor(item.val*0.8);
        const can = mode==='buy' ? currentData.player.units >= price : true;
        const btnClass = can ? 'buy-btn' : 'buy-btn disabled';
        const label = mode.toUpperCase();

        row.innerHTML = `
            <td style="color:${color};font-weight:bold">${item.name}</td>
            <td>${item.type}</td>
            <td>${item.qty}</td>
            <td style="color:#eab308">${price} U</td>
            <td class="buy-cell">
                <input type="range" min="1" max="${item.qty}" value="1" id="sl-${idx}" oninput="document.getElementById('v-${idx}').innerText=this.value">
                <span id="v-${idx}">1</span>
                <button onclick="tradeItem('${item.name}','sl-${idx}')" class="${btnClass}">${label}</button>
            </td>
        `;
        list.appendChild(row);
    });
}

window.tradeItem = (name, id) => {
    const qty = document.getElementById(id).value;
    const cmd = marketMode === 'buy' ? 'Buy' : 'Sell';
    sendCmd(`${cmd} ${qty} ${name}`);
}

function renderShipyard() {
    const list = els.shipyardList; if(!list) return; list.innerHTML = '';
    (currentData.local_shipyard||[]).forEach(p => {
        const row = document.createElement('tr');
        const can = currentData.player.units >= p.price;
        const btnClass = can ? 'buy-btn' : 'buy-btn disabled';
        row.innerHTML = `
            <td style="color:#fff;font-weight:bold">${p.name}</td>
            <td>${p.type}</td>
            <td style="color:#eab308">${p.price} U</td>
            <td><button onclick="sendCmd('Buy Part ${p.name}')" class="${btnClass}">INSTALL</button></td>
        `;
        list.appendChild(row);
    });
}

function renderLounge() {
    if(!els.recruitList) return;
    els.recruitList.innerHTML = ''; els.rumorList.innerHTML = '';
    const lounge = currentData.local_lounge || { recruits: [], rumors: [] };
    
    (lounge.recruits||[]).forEach(r => {
        const can = currentData.player.units >= r.cost;
        els.recruitList.innerHTML += `
            <div class="recruit-card">
                <div><strong style="color:#fff">${r.name}</strong> <small>(${r.role})</small></div>
                <div style="font-size:0.8em;color:#888">${r.desc}</div>
                <div style="display:flex;justify-content:space-between;margin-top:5px">
                    <span style="color:#eab308">${r.cost} U</span>
                    <button onclick="sendCmd('Recruit ${r.name}')" class="${can?'':'disabled'}">HIRE</button>
                </div>
            </div>`;
    });
    (lounge.rumors||[]).forEach(r => els.rumorList.innerHTML += `<div class="rumor-bubble">"${r}"</div>`);
}

// --- 8. MAP RENDERER ---
function renderMap() {
    const display = els.mapDisplay; 
    if(!display) return; display.innerHTML = '';
    
    const mode = currentData.map.view_mode || 'sector';
    const rect = display.getBoundingClientRect();
    const cx = rect.width / 2; 
    const cy = rect.height / 2;

    if (mode === 'galaxy') {
        // GALAXY
        let hub = document.createElement('div'); hub.className="map-node center-hub"; 
        hub.style.left=`${cx}px`; hub.style.top=`${cy}px`; display.appendChild(hub);
        
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); 
        svg.setAttribute("width", "100%"); svg.setAttribute("height", "100%"); 
        svg.style.position = "absolute"; display.appendChild(svg);
        
        (currentData.map.neighbors||[]).forEach((star,i)=>{
            const dist=150; const ang=(i/3)*6.28;
            const sx = cx + dist * Math.cos(ang);
            const sy = cy + dist * Math.sin(ang);
            let line = document.createElementNS("http://www.w3.org/2000/svg","line"); 
            line.setAttribute("x1",cx); line.setAttribute("y1",cy); line.setAttribute("x2",sx); line.setAttribute("y2",sy); 
            line.setAttribute("stroke","#45a29e"); line.setAttribute("opacity","0.3"); svg.appendChild(line);
            
            let n = document.createElement('div'); n.className="map-node star-node"; 
            n.innerHTML=`<div class="node-label">${star}</div>`; 
            n.style.left=`${sx}px`; n.style.top=`${sy}px`; 
            n.onclick=()=>sendCmd(`Warp to ${star}`); display.appendChild(n);
        });
    } else {
        // SECTOR
        const bodies = currentData.map.sector_bodies || [];
        if (bodies.length === 0) { display.innerHTML = '<div class="empty" style="padding-top:100px">NO SCAN DATA</div>'; return; }

        // Star Logic
        let sun = document.createElement('div'); 
        sun.className = `central-sun ${getStarVisual(bodies.find(b=>b.is_star)?.type || "G-Type")}`; 
        sun.style.left=`${cx}px`; sun.style.top=`${cy}px`; 
        display.appendChild(sun);

        // Planets Logic
        const planets = bodies.filter(b => !b.is_star);
        const maxRad = Math.min(cx, cy) - 60; 
        const step = maxRad / (planets.length + 1);

        planets.forEach((b, i) => {
            const r = step * (i + 1); 
            const a = stringHash(b.name) * 6.28 + (i*0.8);
            
            let ring = document.createElement('div'); ring.className = "orbit-ring"; 
            ring.style.width = `${r*2}px`; ring.style.height = `${r*2}px`; 
            ring.style.left = `${cx-r}px`; ring.style.top = `${cy-r}px`; 
            display.appendChild(ring);

            const px = cx + r * Math.cos(a); 
            const py = cy + r * Math.sin(a);
            
            let p = document.createElement('div'); p.className="orbital-planet";
            let visual = getVisualClass(b.type);
            p.innerHTML = `<div class="planet-icon ${visual}"></div><div class="orbital-label">${b.name}</div>`;
            p.style.left = `${px}px`; p.style.top = `${py}px`; 
            p.onclick = () => openDetailModal('planet', b); 
            display.appendChild(p);
            
            if(currentData.meta.orbiting === b.name) { 
                let s = document.createElement('div'); s.className = "player-ship-icon"; s.innerHTML = "▲"; 
                s.style.left = `${px+15}px`; s.style.top = `${py-15}px`; display.appendChild(s); 
            }
        });
    }
}

// --- 9. RIGHT PANEL (SHIP) ---
function renderRightPanel() {
    const container = els.rightPanel; 
    if(!container) return; container.innerHTML = '';

    if (activeRightTab === 'ship') {
        const ship = currentData.ship; 
        const max = ship.stats.slots_max || 32;
        const hull = document.createElement('div'); hull.className='ship-hull'; 
        const grid = document.createElement('div'); grid.className='slot-grid';
        
        const add = (arr, cls, tag) => arr.forEach(x => {
            const s=document.createElement('div'); s.className=`slot filled ${cls}`;
            s.innerHTML=`<span class="slot-tag">${tag}</span>`; s.title=x.name;
            s.ondblclick = () => openDetailModal('item', x); 
            grid.appendChild(s);
        });
        
        add(ship.crew||[], 'crew', 'CRW'); 
        add(ship.weapons||[], 'weapon', 'WPN'); 
        add(ship.systems||[], 'system', 'SYS');
        
        let flatCargo=[]; (ship.cargo||[]).forEach(c=>{ 
            for(let i=0; i<Math.ceil((c.qty * (c.weight||1)) / 20); i++) flatCargo.push(c); 
        });
        add(flatCargo, 'cargo', 'CGO');

        for(let i=grid.children.length; i<max; i++) { 
            const s=document.createElement('div'); s.className='slot empty'; grid.appendChild(s); 
        }

        const scroll = document.createElement('div'); scroll.className='slot-grid-container';
        scroll.appendChild(grid); hull.appendChild(scroll); container.appendChild(hull);
    } else {
        (currentData.log||[]).forEach(l=>{ 
            let d=document.createElement('div'); d.className=`log-entry ${l.type}`; d.innerText=l.text; 
            container.appendChild(d); 
        });
        container.scrollTop = container.scrollHeight;
    }
}

// --- 10. MODALS & CONTROLS ---
window.openDetailModal = (t, d) => {
    els.mTitle.innerText = d.name;
    
    if(t==='planet') { 
        const visual = getVisualClass(d.type);
        els.mBody.innerHTML = `
            <div class="modal-content-grid">
                <div class="planet-visual-large ${visual}"></div>
                <div class="modal-data">
                    <div class="data-tag">TYPE: <span>${d.type}</span></div>
                    <div class="data-tag">ECON: <span>${d.economy}</span></div>
                    <div class="divider"></div>
                    <p class="lore-text">${d.desc}</p>
                </div>
            </div>`;
        
        let btns = `<button onclick="closeModal(); sendCmd('Travel to ${d.name}')" class="action-btn">TRAVEL</button>
                    <button onclick="closeModal(); sendCmd('Land on ${d.name}')" class="action-btn">LAND</button>`;
        if(d.mineable) btns += `<button onclick="closeModal(); sendCmd('Mine ${d.name}')" class="action-btn">MINE</button>`;
        els.mFooter.innerHTML = btns;
    
    } else { 
        els.mBody.innerHTML = `<div class="modal-data"><div class="data-tag">DETAILS</div><p class="lore-text">${d.desc || d.role || 'Standard Item'}</p></div>`; 
        els.mFooter.innerHTML = `<button onclick="closeModal()" class="action-btn">CLOSE</button>`; 
    }
    els.modal.classList.remove('hidden');
}

window.closeModal = () => els.modal.classList.add('hidden');
window.closeMarket = () => sendCmd('Takeoff');
window.restartGame = () => sendCmd("RESTART_GAME");
window.setMapMode = (m) => sendCmd(m==='galaxy'?'Galaxy Map':'Scan Sector');
window.switchRightTab = (t) => { activeRightTab=t; document.querySelectorAll('.p-tab').forEach(b=>b.classList.remove('active')); document.getElementById('tab-'+t).classList.add('active'); renderRightPanel(); }

// --- 11. COMMUNICATION ---
window.sendCmd = async(txt) => { 
    if(!txt) txt=els.input.value; els.input.value=''; 
    try { 
        const res = await fetch('http://localhost:3000/command', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({command: txt}) }); 
        render(await res.json()); 
    } catch(e) {
        console.error("Transmission Failure:", e);
        // Simple visual feedback on failure
        if(els.btn) { els.btn.style.backgroundColor = "#ef4444"; setTimeout(() => els.btn.style.backgroundColor = "#66fcf1", 1000); }
    }
}

els.btn.onclick = () => sendCmd(); 
els.input.onkeypress = (e) => { if(e.key === 'Enter') sendCmd(); };
async function init() { 
    try { 
        const res = await fetch('game_state.json');
        const data = await res.json();
        // Check 1: If data is loaded but location is missing, force reset.
        if (data && data.meta && (!data.meta.location || data.meta.location === "Unknown")) {
             sendCmd("RESTART_GAME"); // Self-heal
        } else {
            render(data); 
        }
    } catch(e) {
        // Check 2: If file is missing/unreadable, start fresh.
        sendCmd("RESTART_GAME");
    } 
}
init();