// server.js - V11.0 Refactored Gateway
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

// --- PERSISTENCE ---
let core;

function loadGame() {
    try {
        if (!fs.existsSync('game_state.json')) throw new Error("No Save");
        const json = fs.readFileSync('game_state.json', 'utf8');
        const state = JSON.parse(json);
        if (!state.meta) throw new Error("Corrupt Save");
        return new GameCore(state);
    } catch (e) {
        console.log("Initializing New Game Universe...");
        // Create default state structure
        const defaultState = { 
            meta: { location: "Veridia Prime", phase: "ORBIT", date: "2400.01.01", landed: true, orbiting: "Veridia Prime" },
            player: { units: 1000, rep: 0 },
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
            map: { view_mode: "sector", neighbors: ["Sector 4", "The Void"], sector_bodies: [] },
            known_systems: {}, 
            local_market: [], local_shipyard: [], local_lounge: { recruits: [], rumors: [] }, 
            encounter: null,
            log: [{ type: "system", text: "System Re-Initialized." }]
        };
        return new GameCore(defaultState);
    }
}

// Init
core = loadGame();
core.initializeSystem(); // Ensures map/market data exists

function saveGame() {
    fs.writeFileSync('game_state.json', JSON.stringify(core.state, null, 2));
}

// --- API ---
app.post('/command', async (req, res) => {
    const { command } = req.body;
    
    if (command === "RESTART_GAME") {
        if (fs.existsSync('game_state.json')) fs.unlinkSync('game_state.json');
        core = loadGame();
        core.initializeSystem();
        saveGame();
        return res.json(core.state);
    }

    // CENTRALIZED COMMAND PROCESSING
    // We simply pass the text to the Core Engine
    core.processCommand(command);

    // AI NARRATIVE INTERCEPT (Optional/Future)
    // if (core.needsAINarrative) { ... }

    saveGame();
    res.json(core.state);
});

app.listen(PORT, () => console.log(`CORE ONLINE: http://localhost:${PORT}`));