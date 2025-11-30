// server.js - V11.4 Final Stable
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const GameCore = require('./systems/core');
const DATA = require('./data/constants');

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Accept multiple env var names to be flexible for local setups
const API_KEY = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.API_KEY || process.env.GEN_AI_KEY || '').trim();
const MODEL_NAME = process.env.MODEL_NAME || process.env.MODEL || 'gemini-2.0-flash';

let genAI = null;
let model = null;

function initAI() {
    if (!API_KEY) {
        console.warn('No API key found (GEMINI_API_KEY/GOOGLE_API_KEY/API_KEY/GEN_AI_KEY). Running without AI (dev mode).');
        return;
    }
    if (API_KEY.startsWith('AIza')) {
        console.warn('API key looks like a legacy REST API key (starts with "AIza"). It may not be compatible with the Generative AI client.');
    }
    try {
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        genAI = new GoogleGenerativeAI(API_KEY);
        try {
            model = genAI.getGenerativeModel({ model: MODEL_NAME });
            console.log(`AI model initialized: ${MODEL_NAME}`);
        } catch (e) {
            console.warn('Failed to select model:', MODEL_NAME, e && e.message ? e.message : e);
            model = null;
        }
    } catch (e) {
        console.warn('Failed to initialize GoogleGenerativeAI client, continuing without AI.', e && e.message ? e.message : e);
        genAI = null; model = null;
    }
}

initAI();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.'));

let gameState;
let core;

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
        log: [{ type: "system", text: "System Initialized." }]
    };
}

function loadState() {
    try {
        if (!fs.existsSync('game_state.json')) throw new Error("No Save");
        const s = JSON.parse(fs.readFileSync('game_state.json', 'utf8'));
        if (!s.meta || !s.ship || !s.map || !s.meta.location || s.meta.location === "Unknown") {
            throw new Error("Invalid Location Data");
        }
        if (!s.local_lounge || Array.isArray(s.local_lounge)) s.local_lounge = { recruits: [], rumors: [] };
        return s;
    } catch (e) {
        console.log("Save Invalid. Creating New Universe...");
        return createFreshState();
    }
}

// Init
gameState = loadState();
core = new GameCore(gameState);
core.syncShipStats();
if(!gameState.known_systems[gameState.meta.location]) {
    gameState.known_systems[gameState.meta.location] = core.generateSectorBodies(gameState.meta.location);
}
gameState.map.sector_bodies = gameState.known_systems[gameState.meta.location];

function save() {
    try {
        const payload = (core && core.state) ? core.state : gameState;
        fs.writeFileSync('game_state.json', JSON.stringify(payload, null, 2));
    } catch (e) {
        console.error('Failed to save game_state.json:', e && e.message ? e.message : e);
    }
}

// simple health endpoint
app.get('/ping', (req, res) => {
    res.json({ ok: true, ai: !!model, model: model ? MODEL_NAME : null, location: (core && core.state && core.state.meta && core.state.meta.location) || null });
});

// Global error handlers to avoid silent exits during development
process.on('unhandledRejection', (reason, p) => {
    console.error('Unhandled Rejection at:', p, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception thrown:', err);
});

// --- NEW GET /STATE ROUTE (For Frontend to safely retrieve current data) ---
app.get('/state', (req, res) => {
    res.json(core.state);
});

// --- API POST /COMMAND ---
app.post('/command', async (req, res) => { // <-- ASYNC FUNCTION
    const cmdRaw = req.body && req.body.command ? req.body.command : '';
    console.log('Command received:', cmdRaw);
    const cmd = (cmdRaw || '').toString();
    const n = cmd.trim().toLowerCase();

    // Helper to respond with current state
    const respondState = () => { core.syncShipStats(); save(); return res.json(core.state); };

    if (n === 'restart_game' || n === 'restart game') {
        if(fs.existsSync('game_state.json')) fs.unlinkSync('game_state.json');
        gameState = createFreshState();
        core = new GameCore(gameState);
        core.syncShipStats(); save(); 
        return res.json(core.state);
    }

    if (n === 'scan sector' || n === 'sector') {
        core.state.map.view_mode = "sector";
        const loc = core.state.meta.location;
        if(!core.state.known_systems[loc] || core.state.known_systems[loc].length === 0) {
            core.state.known_systems[loc] = core.generateSectorBodies(loc);
        }
        core.state.map.sector_bodies = core.state.known_systems[loc];
        return respondState();
    }

    if (n === 'galaxy map' || n === 'galaxy') {
        core.state.map.view_mode = "galaxy";
        if(!core.state.map.neighbors || core.state.map.neighbors.length < 3) {
            core.state.map.neighbors = ["Alpha Centauri", "Proxima", "Wolf 359", "Sirius"];
        }
        return respondState();
    }

    if (n.startsWith('travel')) {
        const target = cmd.replace(/travel to\s*/i, '');
        core.travel(target);
        return respondState();
    }

    if (n.startsWith('warp')) {
        const target = cmd.replace(/warp to\s*/i, '');
        if(core.state.ship.stats.fuel_warp > 0) {
            core.state.ship.stats.fuel_warp--; core.state.meta.location = target;
            core.state.meta.orbiting = "Deep Space"; core.state.meta.landed = false;
            core.state.map.view_mode = "sector";
            if(!core.state.known_systems[target]) core.state.known_systems[target] = core.generateSectorBodies(target);
            core.state.map.sector_bodies = core.state.known_systems[target];
        } else core.log("Insufficient Warp Fuel.", "error");
        return respondState();
    }

    if (n.startsWith('land')) {
        const target = cmd.replace(/land on\s*/i, '');
        if(core.state.meta.orbiting === target) {
            core.state.meta.landed = true;
            core.state.local_market = core.generateMarket();
            core.state.local_shipyard = core.generateShipyard();
            core.state.local_lounge = core.generateLounge();
        } else core.log("Not in orbit.");
        return respondState();
    }

    if (n.startsWith('takeoff')) { core.state.meta.landed = false; return respondState(); }
    if (n.startsWith('mine')) { core.mineAction(); return respondState(); }

    // Commerce Logic
    if (n.startsWith('buy ')) {
        const parts = cmd.split(" ");
        if(parts[1] && parts[1].toLowerCase() === 'part') {
            const name = cmd.replace(/buy part\s*/i, '');
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
        return respondState();
    }

    if (n.startsWith('recruit ')) {
        const name = cmd.replace(/recruit\s*/i, '');
        const r = core.state.local_lounge.recruits.find(r => r.name === name);
        if(r && core.state.player.units >= r.cost) {
            core.state.player.units -= r.cost;
            core.state.ship.crew.push(r);
            core.state.local_lounge.recruits = core.state.local_lounge.recruits.filter(c => c !== r);
        }
        return respondState();
    }

    // Encounter Actions
    if (core.state.encounter) {
        if (n === 'attack') core.resolveCombat();
        else if (n === 'ignore' || n === 'flee') core.state.encounter = null;
        else if (n === 'mine asteroid') { core.mineAction(); core.state.encounter = null; }
        return respondState();
    }

    // Default: unknown command
    core.log(`Unknown command: ${cmd}`, 'system');
    return respondState();
});

app.listen(PORT, () => console.log(`SYSTEM ONLINE: http://localhost:${PORT}`));