// server.js - V11.4 FINAL STABLE (Initialization Fixed)
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

// 1. CRITICAL CHECK - Only exit if key is missing AND we need to use the AI model later
if (!API_KEY) { 
    // This allows the server to run without AI features, preventing the fatal crash.
    console.error("WARNING: Gemini API Key is missing. AI fallback features are disabled.");
}

const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(API_KEY || "DUMMY_KEY"); // Use a dummy key if missing
const model = genAI.getGenerativeModel({ model: MODEL_NAME });

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

function save() { fs.writeFileSync('game_state.json', JSON.stringify(core.state, null, 2)); }

// CRITICAL FIX: Save immediately on startup to ensure file creation
save(); 

// --- ROUTER ---
app.post('/command', async (req, res) => {
    const cmd = req.body.command;

    if (cmd === "RESTART_GAME") {
        if(fs.existsSync('game_state.json')) fs.unlinkSync('game_state.json');
        gameState = createFreshState(); 
        core = new GameCore(gameState);
        core.syncShipStats(); save(); 
        return res.json(core.state);
    }

    if (cmd === "Scan Sector") {
        core.state.map.view_mode = "sector";
        const loc = core.state.meta.location;
        if(!core.state.known_systems[loc] || core.state.known_systems[loc].length === 0) {
            core.state.known_systems[loc] = core.generateSectorBodies(loc);
        }
        core.state.map.sector_bodies = core.state.known_systems[loc];
        save(); return res.json(core.state);
    }
    
    // ... [Other Handlers] ...

    core.syncShipStats();
    save(); res.json(core.state);
});

app.listen(PORT, () => console.log(`SYSTEM ONLINE: http://localhost:${PORT}`));