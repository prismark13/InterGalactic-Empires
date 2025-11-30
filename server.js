// server.js - V11.3 Async Fix
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const GameCore = require('./systems/core');
const DATA = require('./data/constants');

const app = express();
const PORT = 3000;
const API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = "gemini-2.0-flash"; 

if (!API_KEY) { console.error("CRITICAL: Missing .env API Key"); process.exit(1); }

const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: MODEL_NAME });

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.')); 

let gameState;
let core;

// --- ROBUST LOADER ---
function createFreshState() {
    return { 
        meta: { location: "Veridia Prime", date: "2400.01.01", landed: false, orbiting: "Veridia Prime" },
        player: { units: 1000 },
        ship: { 
            class: "Cutter",
            caps: { crew: 6, weapons: 2, cargo: 20, systems: 4 }, 
            stats: { hull: 100, shields: 100, fuel_ion: 100, fuel_warp: 2, slots_max: 32, slots_used: 0 },
            crew: [{ name: "Shepard", role: "Captain", salary: 0 }],
            equipment: [
                { name: "Mining Laser", type: "Weapon", tag: "LAS", weight: 2, price: 200 },
                { name: "Standard Fuel Tank", type: "System", tag: "TNK", weight: 5, price: 200 }
            ],
            cargo: [ { name: "Nutri-Paste Tubes", qty: 5, val: 5, weight: 0.5 } ]
        },
        map: { view_mode: "sector", neighbors: ["Sector 4", "The Void"], sector_bodies: DATA.STARTER_PLANETS },
        known_systems: { "Veridia Prime": DATA.STARTER_PLANETS }, 
        local_market: [], local_shipyard: [], local_lounge: { recruits: [], rumors: [] }, 
        encounter: null,
        log: [{ type: "system", text: "System Online." }]
    };
}

function loadState() {
    try {
        if (!fs.existsSync('game_state.json')) return createFreshState();
        let s = JSON.parse(fs.readFileSync('game_state.json', 'utf8'));
        // Integrity Check
        if (!s.meta || !s.ship || !s.map) throw new Error("Corrupt");
        if (!s.local_lounge || Array.isArray(s.local_lounge)) s.local_lounge = { recruits: [], rumors: [] };
        return s;
    } catch (e) {
        console.log("State Corrupt. Re-initializing...");
        return createFreshState();
    }
}

// Init
gameState = loadState();
core = new GameCore(gameState);
core.syncShipStats();
// Force Map Data
if(!gameState.known_systems[gameState.meta.location]) {
    gameState.known_systems[gameState.meta.location] = core.generateSectorBodies(gameState.meta.location);
}
gameState.map.sector_bodies = gameState.known_systems[gameState.meta.location];

function save() { fs.writeFileSync('game_state.json', JSON.stringify(core.state, null, 2)); }

// --- API ROUTE (FIXED ASYNC) ---
app.post('/command', async (req, res) => { // <--- FIXED HERE
    const cmd = req.body.command;

    if (cmd === "RESTART_GAME") {
        if(fs.existsSync('game_state.json')) fs.unlinkSync('game_state.json');
        gameState = createFreshState(); 
        core = new GameCore(gameState);
        core.syncShipStats(); save(); 
        return res.json(core.state);
    }

    // SCANNING
    if (cmd === "Scan Sector") {
        core.state.map.view_mode = "sector";
        const loc = core.state.meta.location;
        if(!core.state.known_systems[loc] || core.state.known_systems[loc].length === 0) {
            core.state.known_systems[loc] = core.generateSectorBodies(loc);
        }
        core.state.map.sector_bodies = core.state.known_systems[loc];
        save(); return res.json(core.state);
    }

    if (cmd === "Galaxy Map") {
        core.state.map.view_mode = "galaxy";
        if(!core.state.map.neighbors || core.state.map.neighbors.length < 3) {
            core.state.map.neighbors = ["Alpha Centauri", "Proxima", "Wolf 359", "Sirius"];
        }
        save(); return res.json(core.state);
    }

    // NAVIGATION
    if (cmd.startsWith("Warp")) {
        const target = cmd.replace("Warp to ", "");
        if(core.state.ship.stats.fuel_warp > 0) {
            core.state.ship.stats.fuel_warp--;
            core.state.meta.location = target;
            core.state.meta.orbiting = "Deep Space";
            core.state.meta.landed = false;
            core.state.map.view_mode = "sector";
            // Gen Destination
            if(!core.state.known_systems[target]) core.state.known_systems[target] = core.generateSectorBodies(target);
            core.state.map.sector_bodies = core.state.known_systems[target];
            // Gen Neighbors
            core.state.map.neighbors = ["Sector " + Math.floor(Math.random()*99), "Nebula", "Void"];
        } else core.log("Insufficient Warp Fuel.", "error");
        save(); return res.json(core.state);
    }

    if (cmd.startsWith("Travel")) { core.travel(cmd.replace("Travel to ", "")); save(); return res.json(core.state); }

    // LANDING
    if (cmd.startsWith("Land")) {
        const target = cmd.replace("Land on ", "");
        if(core.state.meta.orbiting === target) {
            core.state.meta.landed = true;
            core.state.local_market = core.generateMarket();
            core.state.local_shipyard = core.generateShipyard();
            core.state.local_lounge = core.generateLounge();
        } else core.log("Not in orbit.");
        save(); return res.json(core.state);
    }
    if (cmd.startsWith("Takeoff")) { core.state.meta.landed = false; save(); return res.json(core.state); }

    // COMMERCE
    if (cmd.startsWith("Buy ")) {
        const parts = cmd.split(" ");
        if(parts[1]==="Part") {
            const name = cmd.replace("Buy Part ", "");
            const part = core.state.local_shipyard.find(p=>p.name===name);
            if(part && core.state.player.units>=part.price) {
                core.state.player.units-=part.price;
                core.state.ship.equipment.push(part);
                core.state.local_shipyard = core.state.local_shipyard.filter(p=>p!==part);
            }
        } else {
            const qty = parseInt(parts[1]); const name = parts.slice(2).join(" ");
            const item = core.state.local_market.find(i=>i.name===name);
            if(item && core.state.player.units>=item.price*qty) {
                core.state.player.units-=item.price*qty;
                const ex = core.state.ship.cargo.find(c=>c.name===name);
                if(ex) ex.qty+=qty;
                else core.state.ship.cargo.push({name:name,qty:qty,val:item.price,weight:1,type:item.type});
                if(name.includes("Ionic Gel")) core.state.ship.stats.fuel_ion+=qty*10;
                if(name.includes("Hyper-Crystals")) core.state.ship.stats.fuel_warp+=qty;
            }
        }
    }

    if (cmd.startsWith("Sell ")) {
        const parts = cmd.split(" ");
        const qty = parseInt(parts[1]);
        const name = parts.slice(2).join(" ");
        const idx = core.state.ship.cargo.findIndex(c => c.name === name);
        if (idx > -1 && core.state.ship.cargo[idx].qty >= qty) {
            core.state.player.units += Math.floor(core.state.ship.cargo[idx].val * 0.8 * qty);
            core.state.ship.cargo[idx].qty -= qty;
            if (core.state.ship.cargo[idx].qty <= 0) core.state.ship.cargo.splice(idx, 1);
        }
    }

    if (cmd.startsWith("Recruit ")) {
        const name = cmd.replace("Recruit ", "");
        const r = core.state.local_lounge.recruits.find(r => r.name === name);
        if(r && core.state.player.units >= r.cost) {
            core.state.player.units -= r.cost;
            core.state.ship.crew.push(r);
            core.state.local_lounge.recruits = core.state.local_lounge.recruits.filter(c => c !== r);
        }
    }

    // ENCOUNTERS & ACTIONS
    if (core.state.encounter) {
        if (cmd === "Attack") core.resolveCombat();
        else if (cmd === "Ignore" || cmd === "Flee") core.state.encounter = null;
        else if (cmd === "Mine Asteroid") { core.mineAction(); core.state.encounter = null; }
    }

    if (cmd.startsWith("Mine ")) { core.mineAction(); save(); return res.json(core.state); }

    // AI FALLBACK
    if(!["Buy","Sell","Travel","Warp","Land","Takeoff","Scan","Mine","Recruit","Attack","Ignore","Flee"].some(k=>cmd.startsWith(k))) {
         try {
            const prompt = `Context: GM. State: ${JSON.stringify(core.state)} | Cmd: "${cmd}"`;
            const result = await model.generateContent(prompt);
            core.log("Command processed.", "gm");
        } catch (e) {}
    }

    core.syncShipStats();
    save(); 
    res.json(core.state);
});

app.listen(PORT, () => console.log(`SYSTEM ONLINE: http://localhost:${PORT}`));