// server.js - V10.2 Final
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

// --- ROBUST STATE LOADER ---
function loadState() {
    try {
        if (!fs.existsSync('game_state.json')) throw new Error("No Save");
        
        let s = JSON.parse(fs.readFileSync('game_state.json', 'utf8'));
        
        // Integrity Check
        if (!s.meta || !s.meta.location || s.meta.location === "Unknown") {
            console.log("Save file corrupt. Resetting...");
            throw new Error("Corrupt State");
        }
        return s;
    } catch (e) {
        console.log("Creating Fresh Universe...");
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
            local_market: [], local_shipyard: [], local_lounge: { recruits:[], rumors:[] }, encounter: null,
            log: [{ type: "system", text: "System Online." }]
        };
    }
}

// Initialize
gameState = loadState();
core = new GameCore(gameState);
core.syncShipStats();

// Force Map Data Integrity
if (!gameState.known_systems["Veridia Prime"]) {
    gameState.known_systems["Veridia Prime"] = DATA.STARTER_PLANETS;
}
if (!gameState.map.sector_bodies || gameState.map.sector_bodies.length === 0) {
    gameState.map.sector_bodies = gameState.known_systems[gameState.meta.location] || DATA.STARTER_PLANETS;
}

function save() { fs.writeFileSync('game_state.json', JSON.stringify(core.state, null, 2)); }

// --- ROUTER ---
app.post('/command', (req, res) => {
    const cmd = req.body.command;

    if (cmd === "RESTART_GAME") {
        if(fs.existsSync('game_state.json')) fs.unlinkSync('game_state.json');
        gameState = loadState(); 
        // Force correct fresh state
        gameState = { 
            meta: { location: "Veridia Prime", date: "2400.01.01", landed: false, orbiting: "Veridia Prime" },
            player: { units: 1000 },
            ship: { class: "Cutter", caps: { crew: 6, weapons: 2, cargo: 20, systems: 4 }, stats: { hull: 100, shields: 100, fuel_ion: 100, fuel_warp: 2, slots_max: 32, slots_used: 0 }, crew: [{ name: "Shepard", role: "Captain", salary: 0 }], equipment: [{ name: "Mining Laser", type: "Weapon", tag: "LAS", weight: 2, price: 200 }, { name: "Standard Fuel Tank", type: "System", tag: "TNK", weight: 5, price: 200 }], cargo: [ { name: "Nutri-Paste Tubes", qty: 5, val: 5, weight: 0.5 } ] },
            map: { view_mode: "sector", neighbors: ["Sector 4", "The Void"], sector_bodies: DATA.STARTER_PLANETS },
            known_systems: { "Veridia Prime": DATA.STARTER_PLANETS }, local_market: [], local_shipyard: [], local_lounge: { recruits:[], rumors:[] }, encounter: null, log: [{ type: "system", text: "Hard Reset Complete." }]
        };
        core = new GameCore(gameState);
        core.syncShipStats(); 
        save(); 
        return res.json(core.state);
    }

    // STANDARD HANDLERS
    if (cmd === "Scan Sector") {
        core.state.map.view_mode = "sector";
        const loc = core.state.meta.location;
        if(!core.state.known_systems[loc]) core.state.known_systems[loc] = core.generateSectorBodies(loc);
        core.state.map.sector_bodies = core.state.known_systems[loc];
        save(); return res.json(core.state);
    }
    
    // ... [Keep Galaxy, Land, Takeoff, Travel, Mine, Buy, Recruit logic from V9.10] ...
    // Copy/Paste the rest of the logic handlers here or use the previous version's body logic.
    // For safety, I will include the critical navigation ones:

    if (cmd.startsWith("Travel")) { core.travel(cmd.replace("Travel to ", "")); save(); return res.json(core.state); }
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

    // Fallback
    core.syncShipStats();
    save(); res.json(core.state);
});

app.listen(PORT, () => console.log(`SYSTEM ONLINE: http://localhost:${PORT}`));